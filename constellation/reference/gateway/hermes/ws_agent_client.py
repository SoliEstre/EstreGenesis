# -*- coding: utf-8 -*-
"""
Constellation WS-PROTOCOL §13.11 Ref. Implementation (Hermes Adapter Instance)
Filename: ws_agent_client.py

This module provides a generic, pure-Python reference implementation of the 
Constellation Gateway client, based on the actual Hermes Dev Agent adapter.
It strips all Hermes-specific dependencies (such as local toolset execution,
LLM loop bindings, and custom credential rotation) while retaining the core 
asynchronous lifecycle, connection state machine, and bidirectional transport.

Requirements:
    pip install websockets

Specifications Met:
    - WS-PROTOCOL §13.11 (A2A Multi-agent Gateway Integration)
    - AGENT-CONNECT §1.9 (Infinite Exponential Backoff Reconnection)
"""

import asyncio
import json
import logging
import time
import uuid
from typing import Any, Callable, Dict, Optional

# Setup minimal logging to stdout
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("constellation-gateway")


class ConstellationClient:
    """
    An asynchronous gateway client implementing the connection lifecycle (Axis A)
    and asynchronous message queuing for Constellation WS-PROTOCOL §13.11.
    """

    def __init__(
        self,
        url: str,
        token: str,
        agent_id: str = "reference-agent",
        agent_name: str = "Reference Agent",
        role: str = "worker",
        channel_id: str = "live_board",
        reconnect_interval: float = 5.0,
        reconnect_backoff_factor: float = 1.8,
        reconnect_max_interval: float = 60.0,
        telemetry_thread_ids: Optional[set] = None,
    ):
        self.url = self._normalize_ws_url(url)
        self.token = token
        self.agent_id = agent_id
        self.agent_name = agent_name
        self.role = role
        self.channel_id = channel_id

        # Reconnection parameters (AGENT-CONNECT §1.9)
        self.reconnect_interval = reconnect_interval
        self.reconnect_backoff_factor = reconnect_backoff_factor
        self.reconnect_max_interval = reconnect_max_interval

        # Telemetry exclusion — threadIds (or runIds) that bypass the host's
        # inbox / drain loop (per gateway-client.eux derive.routable).
        self.telemetry_thread_ids = set(telemetry_thread_ids or ())

        # Internal queues and tasks
        self._outbox: asyncio.Queue[dict] = asyncio.Queue()
        self._inbound_handler: Optional[Callable[[dict], Any]] = None
        self._connection_state = "DISCONNECTED"  # States: DISCONNECTED -> CONNECTING -> CONNECTED_HELLO -> READY
        self._loop_task: Optional[asyncio.Task] = None
        self._is_running = False

    @property
    def connection_state(self) -> str:
        return self._connection_state

    def set_inbound_handler(self, handler: Callable[[dict], Any]) -> None:
        """Register a callback for inbound gateway events."""
        self._inbound_handler = handler

    def start(self) -> None:
        """Start the background connection loop."""
        if self._is_running:
            return
        self._is_running = True
        self._loop_task = asyncio.create_task(self._run_forever())
        logger.info(f"Constellation client started for agent {self.agent_id}")

    async def stop(self) -> None:
        """Gracefully stop the client and close active tasks."""
        self._is_running = False
        if self._loop_task:
            self._loop_task.cancel()
            try:
                await self._loop_task
            except asyncio.CancelledError:
                pass
        self._connection_state = "DISCONNECTED"
        logger.info("Constellation client stopped")

    def send_event(self, event_type: str, **payload: Any) -> bool:
        """
        Enqueue an outbound event to the outbox queue.
        Ensures thread-safe/async-safe queuing with standard AG-UI envelope.
        """
        if not self._is_running:
            logger.warning("Attempted to send event while client was stopped")
            return False

        event = {
            "id": f"evt_{uuid.uuid4().hex}",
            "type": event_type,
            "timestamp": int(time.time() * 1000),
            "source": "agent",
            "agentId": self.agent_id,
            "channelId": self.channel_id,
        }
        event.update(payload)

        try:
            self._outbox.put_nowait(event)
            return True
        except asyncio.QueueFull:
            logger.error("Outbox queue full; discarding event")
            return False

    def reply_to(self, inbound: dict, event_type: str, **payload: Any) -> bool:
        """
        Send an A2A reply with the echoHeader populated from the inbound envelope
        (per gateway-client.eux derive.echoHeader — targetAgentId / threadId /
        contextId / parentId must be echoed on outbound A2A messages). Prefer
        this helper over raw send_event() so the server's reply-window pairing
        does not have to fall back to a time-based heuristic.
        """
        payload.setdefault("targetAgentId", inbound.get("agentId"))
        payload.setdefault("threadId", inbound.get("threadId"))
        payload.setdefault("contextId", inbound.get("contextId") or inbound.get("threadId"))
        payload.setdefault("parentId", inbound.get("id"))
        return self.send_event(event_type, **payload)

    async def _run_forever(self) -> None:
        """Maintain persistent connection using exponential backoff (AGENT-CONNECT §1.9)."""
        reconnect_attempt = 0
        while self._is_running:
            started_at = time.monotonic()
            self._connection_state = "CONNECTING"
            
            try:
                await self._connect_once()
            except Exception as exc:
                logger.debug(f"Websocket session terminated: {exc}")
            
            if not self._is_running:
                break

            # Calculate reconnection delay
            connected_for = time.monotonic() - started_at
            if connected_for >= 30.0:  # Reset attempt count if we stayed connected long enough
                reconnect_attempt = 0

            delay = min(
                self.reconnect_max_interval,
                self.reconnect_interval * (self.reconnect_backoff_factor ** reconnect_attempt)
            )
            reconnect_attempt += 1
            
            logger.info(f"Reconnecting in {delay:.2f}s (Attempt {reconnect_attempt})")
            self._connection_state = "DISCONNECTED"
            await asyncio.sleep(delay)

    async def _connect_once(self) -> None:
        """Establish connection, perform HELLO handshake, and start concurrent worker tasks."""
        import websockets  # Lazy import to ensure import safety

        # Inject auth token into WS handshake query parameters
        ws_url = f"{self.url}?token={self.token}"
        
        logger.info(f"Connecting to {self.url}...")
        async with websockets.connect(ws_url, ping_interval=20.0, ping_timeout=10.0) as ws:
            self._connection_state = "CONNECTED_HELLO"
            
            # 1. WS-PROTOCOL §13.11 HELLO Handshake
            hello_payload = {
                "source": "agent",
                "agentId": self.agent_id,
                "clientId": f"{self.agent_id}-1",
                "agentName": self.agent_name,
                "role": self.role,
                "protocolVersion": "0.3",
                "channelId": self.channel_id,
                "capabilities": {
                    "userPrompt": True,
                    "cancel": True,
                    "events": "AG_UI_UPPER_SNAKE_CASE",
                    "inbound": ["UserPrompt", "Command", "Cancel"],
                    "outbound": [
                        "RUN_STARTED", "RUN_FINISHED", "RUN_ERROR",
                        "TEXT_MESSAGE_START", "TEXT_MESSAGE_CONTENT", "TEXT_MESSAGE_END",
                        "CUSTOM"
                    ],
                }
            }
            
            # Send initial HELLO event
            await ws.send(json.dumps({
                "id": f"evt_{uuid.uuid4().hex}",
                "type": "HELLO",
                "timestamp": int(time.time() * 1000),
                **hello_payload
            }))
            
            logger.info("HELLO handshake sent. Awaiting events...")
            self._connection_state = "READY"

            # 2. Spawn concurrent worker loops for reading and writing
            sender_task = asyncio.create_task(self._sender_loop(ws))
            receiver_task = asyncio.create_task(self._receiver_loop(ws))

            # Run tasks concurrently until one fails or cancels
            done, pending = await asyncio.wait(
                {sender_task, receiver_task},
                return_when=asyncio.FIRST_COMPLETED
            )
            
            # Cancel the remaining running tasks
            for task in pending:
                task.cancel()

            # Raise exceptions from completed tasks if any
            for task in done:
                task.result()

    async def _sender_loop(self, ws: Any) -> None:
        """Drain the local outbox queue and push messages down the websocket."""
        while self._is_running:
            event = await self._outbox.get()
            try:
                await ws.send(json.dumps(event, ensure_ascii=False))
            except Exception as exc:
                logger.error(f"Failed to transmit event: {exc}")
                # Re-queue the message to prevent silent loss
                self._outbox.put_nowait(event)
                raise exc
            finally:
                self._outbox.task_done()

    async def _receiver_loop(self, ws: Any) -> None:
        """Receive incoming messages and route them to the registered handler."""
        async for raw_message in ws:
            try:
                event = json.loads(raw_message)
            except ValueError:
                logger.warning(f"Ignored non-JSON incoming raw payload: {raw_message!r}")
                continue

            # Telemetry exclusion (gateway-client.eux derive.routable) — drop
            # frames whose threadId/runId is registered as a telemetry stream
            # so the host's inbox / drain loop is not polluted.
            if self.telemetry_thread_ids:
                tid = event.get("threadId") or event.get("runId")
                if tid in self.telemetry_thread_ids:
                    continue

            if self._inbound_handler:
                try:
                    self._inbound_handler(event)
                except Exception as exc:
                    logger.exception(f"Inbound event handler callback threw an exception: {exc}")

    def _normalize_ws_url(self, url: str) -> str:
        """Standardize URL to websocket syntax (ws:// or wss://)."""
        url = (url or "").strip()
        if not url:
            return "ws://localhost:7878/ws"
        if url.startswith("http://"):
            url = url.replace("http://", "ws://")
        elif url.startswith("https://"):
            url = url.replace("https://", "wss://")
        elif "://" not in url:
            url = f"ws://{url}"
        return url


# --- Quick Usage Demonstration ---
if __name__ == "__main__":
    # Example execution showing connection and messaging simulation
    async def main():
        client = ConstellationClient(
            url="ws://localhost:7878/ws",
            token="TEST_GATEWAY_KEY",
            agent_id="my-autonomous-agent"
        )

        def my_handler(event: dict):
            print(f"\n[!] INBOUND EVENT RECEIVED: {event.get('type')} -> {event.get('value', event)}")

        client.set_inbound_handler(my_handler)
        client.start()

        # Simulate queuing some events
        await asyncio.sleep(2)
        client.send_event("RUN_STARTED", threadId="demo-thread", runId="run-123")
        client.send_event("TEXT_MESSAGE_START", threadId="demo-thread")
        client.send_event("TEXT_MESSAGE_CONTENT", threadId="demo-thread", delta="Hello from reference client!")
        client.send_event("TEXT_MESSAGE_END", threadId="demo-thread")

        # Keep running to show reconnect attempt if gateway is offline
        await asyncio.sleep(10)
        await client.stop()

    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nDemo interrupted by user.")

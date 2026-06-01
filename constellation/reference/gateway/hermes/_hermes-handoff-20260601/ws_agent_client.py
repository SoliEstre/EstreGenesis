# -*- coding: utf-8 -*-
"""
Constellation v0.3 Python WebSocket adapter reference subset.

This file is a small, dependency-light Python example for agents that need to
join a Constellation live board. It focuses on the wire invariants that are
portable across runtimes:

- server-first SERVER_HELLO
- client HELLO followed by top-level CUSTOM/AgentHello
- server-classified role learned from AgentList
- phase event names from the Constellation / AG-UI convention
- msgId stamping for targeted CUSTOM messages
- at-most-once send policy by default
- agent-layer ownership of AckProcessed, ReviewSLAAck and Pong
- redaction hooks before send/log surfaces

Runtime dependency for real network use:
    python -m pip install websockets

Importing this module does not require websockets and does not open a socket.
"""

from __future__ import annotations

import asyncio
import copy
import json
import logging
import time
import uuid
from pathlib import Path
from typing import Any, Awaitable, Callable, Dict, Iterable, List, Optional, Set, Tuple
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

logger = logging.getLogger("constellation.gateway")

JsonDict = Dict[str, Any]
RedactHook = Callable[[JsonDict], JsonDict]
InboundHandler = Callable[[JsonDict], Any]

PHASE_EVENTS: Tuple[str, ...] = (
    "RUN_STARTED",
    "RUN_FINISHED",
    "RUN_ERROR",
    "STEP_STARTED",
    "STEP_FINISHED",
    "TEXT_MESSAGE_START",
    "TEXT_MESSAGE_CONTENT",
    "TEXT_MESSAGE_END",
    "TOOL_CALL_START",
    "TOOL_CALL_ARGS",
    "TOOL_CALL_END",
    "TOOL_CALL_RESULT",
    "CUSTOM",
)

INBOUND_NAMES: Tuple[str, ...] = (
    "UserPrompt",
    "Command",
    "Cancel",
    "Delegate",
    "OnboardAck",
    "Ping",
    "Ack",
    "AckProcessed",
    "ReviewSLAAck",
    "DONE",
    "BLOCKED",
    "NEEDS_HUMAN",
    "BlockerManifest",
    "BlockerNudge",
    "DeadlockProbe",
    "PreemptRequest",
    "PreemptForce",
    "MediationProposal",
    "MediationAck",
    "EscalationRequest",
    "AgentList",
    "History",
    "ServerNotice",
)

ACK_EXCLUDED_NAMES: Set[str] = {
    "Ack",
    "AckProcessed",
    "AckCumulative",
    "AckPolicyUpdate",
    "Ping",
    "Pong",
}

VALID_ROLES: Set[str] = {"local", "main", "upstream", "collab", "board"}


def _now_ms() -> int:
    return int(time.time() * 1000)


class JsonlWatermarkStore:
    """Tiny persistent msgId watermark store for reference/demo use."""

    def __init__(self, path: str | Path):
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self._seen: Set[str] = set()
        if self.path.exists():
            for line in self.path.read_text(encoding="utf-8", errors="ignore").splitlines():
                line = line.strip()
                if line:
                    self._seen.add(line)

    def seen(self, key: str) -> bool:
        return key in self._seen

    def mark(self, key: str) -> None:
        if key in self._seen:
            return
        self._seen.add(key)
        with self.path.open("a", encoding="utf-8") as f:
            f.write(key + "\n")


class ConstellationClient:
    """Async Constellation WebSocket adapter.

    The default role is ``local`` for safe dev/local use. For an upstream peer,
    instantiate with ``role="upstream"`` and ``upstream_key="uk-..."``.
    """

    protocol_version = "0.3"

    def __init__(
        self,
        url: str,
        token: Optional[str] = None,
        upstream_key: Optional[str] = None,
        collab_key: Optional[str] = None,
        agent_id: str = "reference-agent",
        agent_name: str = "Reference Agent",
        role: str = "local",
        main_agent_id: str = "main-agent",
        channel_id: str = "live_board",
        thread_id: str = "default-thread",
        run_id: str = "default-run",
        env: str = "python-reference",
        reconnect_interval: float = 5.0,
        reconnect_backoff_factor: float = 1.8,
        reconnect_max_interval: float = 60.0,
        redact_hook: Optional[RedactHook] = None,
        watermark_store: Optional[JsonlWatermarkStore] = None,
    ) -> None:
        if role not in VALID_ROLES:
            raise ValueError(f"role must be one of {sorted(VALID_ROLES)}, got {role!r}")
        if role == "upstream" and not upstream_key:
            raise ValueError("role='upstream' requires upstream_key")
        if role == "collab" and not collab_key:
            raise ValueError("role='collab' requires collab_key")
        if role == "board":
            raise ValueError("board connections do not send HELLO; this adapter is for agent roles")

        self.url = self._normalize_ws_url(url)
        self.token = token
        self.upstream_key = upstream_key
        self.collab_key = collab_key
        self.agent_id = agent_id
        self.agent_name = agent_name
        self.role = role
        self.authoritative_role: Optional[str] = None
        self.main_agent_id = main_agent_id
        self.channel_id = channel_id
        self.thread_id = thread_id
        self.run_id = run_id
        self.env = env
        self.reconnect_interval = reconnect_interval
        self.reconnect_backoff_factor = reconnect_backoff_factor
        self.reconnect_max_interval = reconnect_max_interval
        self.redact_hook = redact_hook
        self.watermark_store = watermark_store

        self.session_id: Optional[str] = None
        self.server_protocol_version: Optional[str] = None
        self.last_agent_list: Optional[JsonDict] = None
        self.last_history: Optional[JsonDict] = None
        self.last_server_notice: Optional[JsonDict] = None

        self._seq = 0
        self._connection_state = "DISCONNECTED"
        self._outbox: asyncio.Queue[JsonDict] = asyncio.Queue()
        self._inbox: asyncio.Queue[JsonDict] = asyncio.Queue()
        self._inbound_handler: Optional[InboundHandler] = None
        self._loop_task: Optional[asyncio.Task[None]] = None
        self._is_running = False

    @property
    def connection_state(self) -> str:
        return self._connection_state

    def set_inbound_handler(self, handler: InboundHandler) -> None:
        self._inbound_handler = handler

    def build_ws_url(self) -> str:
        """Build WS URL while preserving existing query parameters."""
        parts = urlsplit(self.url)
        query = dict(parse_qsl(parts.query, keep_blank_values=True))

        # Role-specific auth. Do not collapse these into a generic key.
        if self.role == "upstream":
            query["upstreamKey"] = self.upstream_key or ""
        elif self.role == "collab":
            query["key"] = self.collab_key or ""
        elif self.token:
            query["token"] = self.token

        return urlunsplit((parts.scheme, parts.netloc, parts.path, urlencode(query), parts.fragment))

    def build_event(self, event_type: str, **payload: Any) -> JsonDict:
        """Build a Constellation event envelope without sending it."""
        self._seq += 1
        event: JsonDict = {
            "id": payload.pop("id", f"evt_{uuid.uuid4().hex}"),
            "seq": self._seq,
            "type": event_type,
            "timestamp": payload.pop("timestamp", _now_ms()),
            "source": payload.pop("source", self.agent_id),
            "agentId": self.agent_id,
            "runId": payload.pop("runId", self.run_id),
            "threadId": payload.pop("threadId", self.thread_id),
        }
        if self.channel_id:
            event["channelId"] = self.channel_id
        event.update(payload)
        return self._prepare_outbound(event)

    def build_custom(self, name: str, value: Optional[JsonDict] = None, **payload: Any) -> JsonDict:
        payload["name"] = name
        payload["value"] = value or payload.get("value", {})
        return self.build_event("CUSTOM", **payload)

    def build_agent_hello(self) -> JsonDict:
        return self.build_custom(
            "AgentHello",
            targetAgentId=self.main_agent_id,
            value={
                "agentId": self.agent_id,
                "agentName": self.agent_name,
                "role": self.role,
                "env": self.env,
                "capabilities": ["a2a", "turn-held-drain", "ack-layer"],
                "idle": True,
            },
        )

    def build_review_sla_ack(self, ack_for: str, eta: str | Dict[str, Any], **payload: Any) -> JsonDict:
        return self.build_custom(
            "ReviewSLAAck",
            value={"ackFor": ack_for, "eta": eta, "kind": "SLA-OR-WORK", **payload},
        )

    def build_done(self, for_msg_id: str, summary: Optional[str] = None, **payload: Any) -> JsonDict:
        value = {"for": for_msg_id, **payload}
        if summary:
            value["summary"] = summary
        return self.build_custom("DONE", value=value)

    def build_blocked(self, for_msg_id: str, reason: str, waiting_on: str, **payload: Any) -> JsonDict:
        if not waiting_on:
            raise ValueError("BLOCKED requires waitingOn")
        return self.build_custom(
            "BLOCKED",
            value={"for": for_msg_id, "reason": reason, "waitingOn": waiting_on, **payload},
        )

    def build_needs_human(self, for_msg_id: str, question_or_summary: str, **payload: Any) -> JsonDict:
        return self.build_custom(
            "NEEDS_HUMAN",
            value={"for": for_msg_id, "summary": question_or_summary, **payload},
        )

    def send_event(self, event_type: str, **payload: Any) -> bool:
        if not self._is_running:
            logger.warning("attempted to send while client is stopped")
            return False
        self._outbox.put_nowait(self.build_event(event_type, **payload))
        return True

    def send_custom(self, name: str, value: Optional[JsonDict] = None, **payload: Any) -> bool:
        if not self._is_running:
            logger.warning("attempted to send while client is stopped")
            return False
        self._outbox.put_nowait(self.build_custom(name, value=value, **payload))
        return True

    def start(self) -> None:
        if self._is_running:
            return
        self._is_running = True
        self._loop_task = asyncio.create_task(self._run_forever())

    async def stop(self) -> None:
        self._is_running = False
        if self._loop_task:
            self._loop_task.cancel()
            try:
                await self._loop_task
            except asyncio.CancelledError:
                pass
        self._connection_state = "DISCONNECTED"

    async def drain_inbox(self, wait_ms: int = 15000) -> List[JsonDict]:
        """Drain inbound messages at a safe point with a bounded wait window."""
        items: List[JsonDict] = []
        try:
            first = await asyncio.wait_for(self._inbox.get(), timeout=wait_ms / 1000)
        except asyncio.TimeoutError:
            return items
        items.append(first)
        self._inbox.task_done()
        while True:
            try:
                item = self._inbox.get_nowait()
            except asyncio.QueueEmpty:
                break
            items.append(item)
            self._inbox.task_done()
        return items

    async def _run_forever(self) -> None:
        reconnect_attempt = 0
        while self._is_running:
            started_at = time.monotonic()
            self._connection_state = "CONNECTING"
            try:
                await self._connect_once()
            except asyncio.CancelledError:
                raise
            except Exception as exc:
                logger.info("websocket session ended: %s", exc)

            if not self._is_running:
                break
            if time.monotonic() - started_at >= 30.0:
                reconnect_attempt = 0
            delay = min(
                self.reconnect_max_interval,
                self.reconnect_interval * (self.reconnect_backoff_factor ** reconnect_attempt),
            )
            reconnect_attempt += 1
            self._connection_state = "DISCONNECTED"
            await asyncio.sleep(delay)

    async def _connect_once(self) -> None:
        import websockets  # lazy optional dependency

        ws_url = self.build_ws_url()
        async with websockets.connect(ws_url, ping_interval=None, ping_timeout=None) as ws:
            self._connection_state = "CONNECTED"

            server_hello = await self._recv_json(ws)
            if server_hello.get("type") != "SERVER_HELLO":
                raise RuntimeError(f"expected SERVER_HELLO, got {server_hello.get('type')!r}")
            self.session_id = server_hello.get("sessionId")
            self.server_protocol_version = server_hello.get("protocolVersion")

            await self._send_raw(ws, self._build_hello())
            await self._send_raw(ws, self.build_agent_hello())
            self._connection_state = "READY"

            sender_task = asyncio.create_task(self._sender_loop(ws))
            receiver_task = asyncio.create_task(self._receiver_loop(ws))
            done, pending = await asyncio.wait({sender_task, receiver_task}, return_when=asyncio.FIRST_COMPLETED)
            for task in pending:
                task.cancel()
            for task in done:
                task.result()

    def _build_hello(self) -> JsonDict:
        return self.build_event(
            "HELLO",
            agentName=self.agent_name,
            role=self.role,
            protocolVersion=self.protocol_version,
            capabilities={
                "inbound": list(INBOUND_NAMES),
                "outbound": list(PHASE_EVENTS),
            },
        )

    async def _sender_loop(self, ws: Any) -> None:
        while self._is_running:
            event = await self._outbox.get()
            try:
                await self._send_raw(ws, event)
            except Exception as exc:
                logger.error("send failed under at-most-once policy; not sending again blindly: %s", exc)
                raise
            finally:
                self._outbox.task_done()

    async def _receiver_loop(self, ws: Any) -> None:
        async for raw_message in ws:
            try:
                event = json.loads(raw_message)
            except ValueError:
                logger.warning("ignored non-JSON websocket frame")
                continue

            if self._is_duplicate(event):
                continue
            self._observe_control_event(event)
            await self._inbox.put(event)

            if self._inbound_handler:
                result = self._inbound_handler(event)
                if isinstance(result, Awaitable):
                    await result

    async def _recv_json(self, ws: Any) -> JsonDict:
        raw = await ws.recv()
        try:
            event = json.loads(raw)
        except ValueError as exc:
            raise RuntimeError("server sent non-JSON frame during handshake") from exc
        return event

    async def _send_raw(self, ws: Any, event: JsonDict) -> None:
        await ws.send(json.dumps(self._redact(event), ensure_ascii=False, separators=(",", ":")))

    def _prepare_outbound(self, event: JsonDict) -> JsonDict:
        event = dict(event)
        if self._needs_msg_id(event):
            event["msgId"] = f"m-{uuid.uuid4().hex}"
        return event

    def _needs_msg_id(self, event: JsonDict) -> bool:
        if event.get("type") != "CUSTOM":
            return False
        if not event.get("targetAgentId"):
            return False
        if event.get("msgId"):
            return False
        if event.get("telemetry") is True:
            return False
        if event.get("name") in ACK_EXCLUDED_NAMES:
            return False
        return True

    def _is_duplicate(self, event: JsonDict) -> bool:
        msg_id = event.get("msgId")
        if not msg_id or not self.watermark_store:
            return False
        source = event.get("source") or event.get("agentId") or "unknown"
        key = f"{source}:{msg_id}"
        if self.watermark_store.seen(key):
            return True
        self.watermark_store.mark(key)
        return False

    def _observe_control_event(self, event: JsonDict) -> None:
        event_type = event.get("type")
        name = event.get("name")
        if event_type == "AgentList" or name == "AgentList":
            self.last_agent_list = event
            self._update_authoritative_role(event)
        elif event_type == "History" or name == "History":
            self.last_history = event
        elif event_type == "ServerNotice" or name == "ServerNotice":
            self.last_server_notice = event
            value = event.get("value") or {}
            if value.get("kind") == "flap-rejected":
                logger.warning("server rejected duplicate/flapping registration for agentId=%s", self.agent_id)
        elif event_type == "CUSTOM" and name == "Ping":
            # The bridge queues Ping only. Active runtime code may answer with Pong.
            return

    def _update_authoritative_role(self, event: JsonDict) -> None:
        candidates: Iterable[Any] = []
        if isinstance(event.get("agents"), list):
            candidates = event["agents"]
        elif isinstance(event.get("value"), dict) and isinstance(event["value"].get("agents"), list):
            candidates = event["value"]["agents"]
        for agent in candidates:
            if isinstance(agent, dict) and agent.get("agentId") == self.agent_id:
                role = agent.get("role")
                if role:
                    self.authoritative_role = role
                break

    def _redact(self, event: JsonDict) -> JsonDict:
        safe_event = copy.deepcopy(event)
        if self.redact_hook:
            return self.redact_hook(safe_event)
        return safe_event

    @staticmethod
    def _normalize_ws_url(url: str) -> str:
        url = (url or "").strip()
        if not url:
            return "ws://localhost:7878/ws"
        if url.startswith("http://"):
            return "ws://" + url[len("http://"):]
        if url.startswith("https://"):
            return "wss://" + url[len("https://"):]
        if "://" not in url:
            return f"ws://{url}"
        return url


async def _demo() -> None:
    client = ConstellationClient("ws://localhost:7878/ws", agent_id="demo-agent")
    event = client.build_event("RUN_STARTED", runId="demo-run", threadId="demo-thread")
    print(json.dumps(event, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
    asyncio.run(_demo())

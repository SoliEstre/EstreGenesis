# Constellation Python Gateway Adapter Reference

이 디렉터리는 Constellation live-board protocol v0.3을 Python `asyncio` 스타일로 옮기는 **reference-oriented subset**입니다. 목적은 downstream runtime이 동일한 wire invariant를 구현할 때 참고할 수 있는 작은 adapter 예시를 제공하는 것입니다.

이 문서는 “완성된 서버 런타임”이나 “모든 deployment에 그대로 쓰는 SDK”가 아닙니다. 실제 배포 전에는 protocol invariant, redaction, package gate를 반드시 통과해야 합니다.

## 파일 구성

- `ws_agent_client.py`: Python WebSocket adapter 예시. 네트워크 실행 시 `websockets` 패키지가 필요하지만, import/load 자체는 외부 의존성 없이 성공합니다.
- `README.md`: role/auth/handshake/A2A reliability 기준과 검증 방법.
- `constellation-hermes-gateway-ref.zip`: 위 두 파일의 배포용 묶음. zip 내부 파일은 master copy와 byte-identical이어야 합니다.

## Role / auth semantics

Constellation role은 `board`, `main`, `local`, `upstream`, `collab`입니다.

- `local`: 같은 환경의 worker agent. `OnboardAck` 이후 `Delegate`를 기다립니다.
- `upstream`: upstream peer. `ws://…/ws?upstreamKey=<uk-…>`로 연결합니다. `OnboardAck`는 정보성 안내이며, hub/main의 `Delegate` 대기 때문에 자기 track을 멈추지 않습니다.
- `collab`: external collaborator peer. `ws://…/ws?key=<ck-…>`로 연결합니다. upstream과 마찬가지로 peer coordination 모드입니다.
- token-gated local/dev deployment는 `?token=<token>` 또는 Authorization Bearer 정책을 사용할 수 있습니다.

`AgentHello.value.role`은 self-report hint입니다. 권위 있는 role은 서버가 connection key와 HELLO를 바탕으로 분류하고 `AgentList`로 브로드캐스트하는 값입니다.

## Handshake order

1. WS connect.
2. Server sends `SERVER_HELLO { sessionId, protocolVersion, serverTime }`.
3. Client sends `HELLO { agentId, agentName, role, capabilities }`.
4. Client sends literal top-level `CUSTOM/AgentHello`:

```json
{
  "type": "CUSTOM",
  "name": "AgentHello",
  "targetAgentId": "<main agentId>",
  "value": {
    "agentId": "<self>",
    "agentName": "<display>",
    "role": "upstream",
    "env": "python-reference",
    "capabilities": ["a2a", "turn-held-drain", "ack-layer"],
    "idle": true
  }
}
```

`name`과 `targetAgentId`는 top-level입니다. `value` 안으로 중첩하면 server routing, auto-OnboardAck, board classification이 동시에 깨질 수 있습니다.

## Event names

Outbound event names use the Constellation / AG-UI phase vocabulary:

- `RUN_STARTED`, `RUN_FINISHED`, `RUN_ERROR`
- `STEP_STARTED`, `STEP_FINISHED`
- `TEXT_MESSAGE_START`, `TEXT_MESSAGE_CONTENT`, `TEXT_MESSAGE_END`
- `TOOL_CALL_START`, `TOOL_CALL_ARGS`, `TOOL_CALL_END`, `TOOL_CALL_RESULT`
- `CUSTOM`

## A2A reliability

기본 send policy는 **at-most-once**입니다. 전송 실패/연결 종료 시 adapter는 동일 event를 blind retry하지 않습니다.

- targeted `CUSTOM`에는 sender-side adapter가 `msgId`를 stamp합니다.
- server `Ack { ackFor, kind: 'delivered' }`는 wire relay 성공만 의미합니다.
- recipient agent만 `AckProcessed { ackFor, kind: 'processed' }`를 낼 수 있습니다.
- deferred response는 recipient agent가 `ReviewSLAAck { ackFor, eta, kind: 'SLA-OR-WORK' }`로 commitment를 표시합니다.
- 종료 신호는 `DONE`, `BLOCKED { waitingOn }`, `NEEDS_HUMAN`으로 명시합니다.
- bridge/adapter는 `AckProcessed`, `ReviewSLAAck`, `Pong`을 대신 만들지 않습니다.

`Ping` / `Pong`은 application-layer liveness probe입니다. adapter는 `Ping`을 inbox에 queue할 뿐이고, active runtime turn만 `Pong`을 보낼 수 있습니다.

## Upstream-agent operation discipline

Upstream agent는 peer입니다. 다음 discipline을 문서/런타임 양쪽에 유지해야 합니다.

- outbound A2A 메시지와 prerequisite은 다른 local planned action보다 먼저 처리합니다.
- non-branching choice는 1줄 recommend 후 proceed합니다.
- progressable item을 fresh context나 다음 session으로 미루지 않습니다.
- large multi-cycle work 전에는 scope, touched files, durable artifacts, 결정사항을 문서화해 cold resume 가능하게 만듭니다.
- every all-blocked idle entry emits `BlockerManifest`; rearm cycle마다 필요하면 `BlockerNudge`를 냅니다.
- cyclic wait는 `DeadlockProbe`, `PreemptRequest`, `PreemptForce`, `MediationProposal`, `MediationAck`, `EscalationRequest` ladder로 처리합니다.
- human escalation과 structured choice는 board `decisions` panel로 라우팅합니다.

## Redaction

Hermes-specific masking implementation은 이 reference에서 제거되어도, generic redaction hook은 유지되어야 합니다. Public artifact와 board history에는 secret, token, key, cookie, `.env`, private repo/path/org, PII, raw tool result leak이 들어가면 안 됩니다.

`ws_agent_client.py`는 `redact_hook`을 제공하며 send/log surface 전에 적용할 수 있습니다.

## Minimal smoke checks

```bash
python3 -m py_compile reference/gateway/hermes/ws_agent_client.py
python3 - <<'PY'
import importlib.util
from pathlib import Path
p = Path('reference/gateway/hermes/ws_agent_client.py')
s = importlib.util.spec_from_file_location('ws_agent_client_ref', p)
m = importlib.util.module_from_spec(s)
s.loader.exec_module(m)
c = m.ConstellationClient('ws://localhost:7878/ws')
assert c.role == 'local'
ev = c.build_event('RUN_STARTED', runId='r', threadId='t')
for k in ['type','id','seq','runId','threadId','timestamp','source','agentId']:
    assert k in ev, k
print('PY_SMOKE_OK')
PY
```

For an upstream peer:

```python
client = ConstellationClient(
    "wss://board.example/ws",
    role="upstream",
    upstream_key="<uk-...>",
    agent_id="upstream-agent",
    main_agent_id="main-agent",
)
```

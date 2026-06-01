# AUTONOMOUS-AGENT-ONBOARDING-GUIDE
# 자율 에이전트 Constellation 게이트웨이 합류 가이드

이 가이드는 API 기반 agent, 독립 CLI/runtime agent, upstream peer가 Constellation live board에 합류할 때 지켜야 하는 public wire contract를 정리합니다. 기준 문서는 EstreGenesis `Constellation.md` v2.3.7 / live-board protocol v0.3입니다.

## 1. 역할과 접속 경로

Canonical roles:

- `main`: board state를 소유하는 orchestrator/supervisor.
- `local`: 같은 환경의 worker agent. `OnboardAck` 후 `Delegate`를 기다립니다.
- `upstream`: upstream peer. 자기 track을 계속 진행하고 필요 시 결정을 downstream으로 전달합니다.
- `collab`: external collaborator peer.
- `board`: dashboard/live board. board는 `HELLO`를 보내지 않습니다.

접속 경로:

- local/dev: `ws://<host>:<port>/ws`
- token-gated: `ws://<host>:<port>/ws?token=<token>` 또는 Authorization Bearer
- upstream: `ws://<host>:<port>/ws?upstreamKey=<uk-…>`
- collab: `ws://<host>:<port>/ws?key=<ck-…>`

`AgentHello.value.role`은 self-report hint입니다. authoritative role은 server가 판정하고 `AgentList`로 알립니다.

## 2. Handshake

1. WS connect.
2. Server sends `SERVER_HELLO { sessionId, protocolVersion: "0.3", serverTime }`.
3. Agent sends `HELLO { agentId, agentName, role, capabilities }`.
4. Agent sends top-level `CUSTOM/AgentHello`.
5. Main may answer `OnboardAck`.

`OnboardAck` 처리:

- `local`: worker standby로 들어가고 `Delegate`를 기다립니다.
- `upstream` / `collab`: peer coordination 모드입니다. `OnboardAck`는 house-rules/protocol-version 안내이며, agent는 자기 track을 계속 진행합니다.

`CUSTOM/AgentHello` shape:

```json
{
  "type": "CUSTOM",
  "name": "AgentHello",
  "targetAgentId": "<main agentId>",
  "agentId": "<self agentId>",
  "value": {
    "agentId": "<self agentId>",
    "agentName": "<display name>",
    "role": "upstream",
    "env": "<runtime hint>",
    "capabilities": ["a2a", "turn-held-drain", "ack-layer"],
    "idle": true
  }
}
```

`name`과 `targetAgentId`는 top-level입니다.

## 3. Envelope / routing

공통 outbound event는 다음 필드를 갖춰야 합니다.

```json
{
  "type": "CUSTOM",
  "id": "evt-...",
  "seq": 1,
  "timestamp": 1760000000000,
  "source": "<agentId>",
  "agentId": "<agentId>",
  "runId": "<run id>",
  "threadId": "<thread id>",
  "name": "<CUSTOM name>",
  "targetAgentId": "<target agentId>",
  "contextId": "<conversation context>",
  "parentId": "<request message id>",
  "value": {}
}
```

- A2A reply는 원 sender를 `targetAgentId`로 echo하고 `contextId` 또는 `threadId`, `parentId`를 보존합니다.
- Channel key는 `agentId`입니다. `channelId`/`threadId`는 origin badge/filter로 봅니다.
- target-unspecified inbound/CUSTOM은 main이 우선 수신합니다.

## 4. Outbound event vocabulary

Runtime adapter는 자동 tool capture를 보장하지 않습니다. agent loop는 safe point에서 명시적으로 event를 emit해야 합니다.

- `RUN_STARTED`, `RUN_FINISHED`, `RUN_ERROR`
- `STEP_STARTED`, `STEP_FINISHED`
- `TEXT_MESSAGE_START`, `TEXT_MESSAGE_CONTENT`, `TEXT_MESSAGE_END`
- `TOOL_CALL_START`, `TOOL_CALL_ARGS`, `TOOL_CALL_END`, `TOOL_CALL_RESULT`
- `CUSTOM`

Progress emission은 activity-coupled입니다. idle 상태에서 autonomous heartbeat를 보내지 않습니다.

## 5. A2A reliability

- targeted `CUSTOM`에는 sender-side bridge/client가 `msgId`를 stamp합니다.
- server `Ack{delivered}`는 wire relay 성공만 의미합니다.
- recipient agent는 실제 처리 후 `AckProcessed` 또는 `DONE`을 낼 수 있습니다.
- deferred response는 `ReviewSLAAck { ackFor, eta, kind: 'SLA-OR-WORK' }`를 먼저 내고 SLA 안에 처리하거나 갱신합니다.
- 막히면 `BLOCKED { for, reason, waitingOn }`을 냅니다. `waitingOn`은 필수입니다.
- 인간 판단이 필요하면 `NEEDS_HUMAN` 또는 `EscalationRequest`를 board `decisions` panel로 보냅니다.
- `Ping`은 liveness probe입니다. bridge/adapter는 `Pong`을 자동으로 만들지 않습니다. active runtime turn만 답합니다.

## 6. Upstream peer operation directive

Upstream agent 시스템 프롬프트에는 다음 원칙을 포함하십시오.

```markdown
# Constellation Upstream Peer Directive
1. You are an upstream peer, not a local worker. Continue your own track after informational OnboardAck.
2. Wait for Delegate only when the server-classified role is local.
3. Send outbound A2A messages and their prerequisites before unrelated local planned actions.
4. Use top-level targetAgentId, contextId/threadId, parentId for replies.
5. Do not blind-retry delivered messages. Use msgId, Ack, ReviewSLAAck, Ping/Pong, and escalation vocabulary.
6. Do not let the bridge fabricate AckProcessed, ReviewSLAAck, or Pong.
7. Emit progress at safe points; do not emit idle heartbeats.
8. If all work is blocked, emit BlockerManifest before idle wait and BlockerNudge on cadence.
9. Do not defer progressable work to a fresh context. Materialize large work, then proceed/resume.
10. Route structured human decisions to the live board decisions panel, not inline option UI.
```

## 7. Redaction

Before public shipment or board emission, redact secrets, keys, tokens, cookies, `.env` values, private paths/repo names/org names, PII, and raw tool outputs that may contain sensitive data. Public examples must use placeholders such as `<token>`, `<uk-…>`, `<ck-…>`.

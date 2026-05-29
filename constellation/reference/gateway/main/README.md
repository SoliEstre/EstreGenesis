# Constellation Gateway Client (Main Reference Implementation)

이 디렉토리는 **Constellation v2.2.x reference/gateway/main/** 트랙을 위한 *generic deps-0 Node 자율 런타임 어댑터* 의 참조 구현입니다. 허브의 운영 중인 `ws-agent-client.cjs`(WS-PROTOCOL §13.11 의 deps-0 reference clent) 를 그대로 옮기되, host-side 통합 원칙(echoHeader 헬퍼·telemetry 제외·silent-disable WARN·2축 분담)을 보강했습니다.

`gateway/hermes/`(Python asyncio 자율 런타임 결합 케이스) 와 **두 시각 공존** 구조 — 다운스트림이 자기 stack 에 맞게 *generic 골격*(여기) 또는 *실 결합 사례*(hermes) 를 골라 참조합니다.

---

## 1. 📂 파일 구성

* **`ws-agent-client.cjs`** — Node ≥ 22 의 내장 `WebSocket` 만 사용, 외부 의존성 0. 라이브 보드(`:7878/ws`)에 *primary agent* 로 붙어 AG-UI 이벤트 송수신을 수행하는 최소 동작 예제(약 180줄). 데모 루프 포함(`--once` CI/스모크용).
* **`README.md`** — 이 문서. 어댑터의 2축 동작 모델·envelope convention·host 확장 슬롯 설명.

---

## 2. 🔍 일반화 범위 (Generalization Boundary)

원본은 허브의 운영 중 `dashboard/live/examples/ws-agent-client.cjs` 입니다. **EstreUF-특수 어휘 누출 0건** — 원본이 이미 generic 구조라(`AGENT_ID` 기본값 `ref-agent` · `THREAD_ID` `ref-thread` · 데모 task 5단계 일반 PM workflow · 환경변수 기반 설정), 도메인 어휘를 *제거할 게 없었습니다*. v2.2.x 보강분은:

### ✅ 보존된 핵심 골격 (Preserved Core)

1. **Connection lifecycle (Axis A)**: `connect()` → `onopen` HELLO → `READY` (서버 SERVER_HELLO 이후) → `onclose` exponential backoff(500ms → cap 8000ms) 자동 재연결.
2. **HELLO handshake (WS-PROTOCOL §13.11)**: `agentId`/`clientId`/`agentName`/`role`/`protocolVersion: '0.3'`/`capabilities` 명시. token / upstreamKey 는 query string 으로(`?token=...` · `?upstreamKey=...`).
3. **AG-UI ergonomic outbound** (`out` 객체): `runStarted/Finished/Error`/`step`/`text`(start·content·end)/`say`(짧은 한 줄)/`tool`(call_start·result)/`accepted`/`handoffReady`.
4. **Inbound 큐 적재** (`inbox`): `UserPrompt`/`Command`/`Cancel`/`HandoffRequested` 는 큐에 적재만, 작업 루프를 직접 인터럽트하지 않음.
5. **safe-point drain** (`drainInbox`): turn 경계에서 큐 비우고 다음 turn 컨텍스트에 병합.
6. **Cooperative cancel** (`interrupted` 플래그 + `paused` 플래그): Cancel/Command/pause·resume → 다음 safe point 에서 반응.

### 🆕 v2.2.x 추가 보강 (Constellation 통합 원칙)

7. **A2A 응답 헬퍼 `out.replyTo(inbound, name, value)`** — `gateway-client.eux` `derive.echoHeader` 정합: 응답 메시지에 `parentId`/`threadId`/`contextId`/`targetAgentId` 를 inbound envelope 로부터 자동 echo. host code 가 inbound A2A 에 응답할 때 raw `send()` 대신 이걸 쓰면 서버 reply-window pairing 이 time-based heuristic 으로 떨어지지 않습니다.
8. **Telemetry threadId 제외 가드** — `gateway-client.eux` `derive.routable` 정합. `WS_TELEMETRY_THREADS` 환경변수에 콤마 분리로 등록한 `threadId`/`runId` 는 `onInbound` 에서 자동 drop(host 큐·drain 오염 방지).
9. **Silent-disable WARN** — `Constellation.md §4` watch-state discipline 정합. `LIVE_BOARD_WS_TOKEN`/`WS_UPSTREAM_KEY` 가 둘 다 미설정이면 무인증 dev 접속을 *silent* 가 아니라 `console.warn` 한 줄로 알림(의도와 다른 silent 폴백 방지).

---

## 3. 🌀 2축 동작 모델 (Dual-Axis Pattern)

`gateway-client.eux` 의 *Constellation 2축* 명세에 정합합니다.

```
[ Axis A: Connection Lifecycle (transport) ]
DISCONNECTED ──(connect)──> CONNECTING ──(socket open)──> CONNECTED_HELLO
    ^                                                          │
    │                                              (SERVER_HELLO 수신)
    │                                                          ▼
    └─────────(socket close · exp backoff)───────────────── READY

[ Axis B: turn-held drain (application, host 책임) ]
inbound CUSTOM ──(inbox.push)──> [accumulate ~15s / turn 경계]
                                          ↓ (drainInbox at safe point)
                              [merge into next turn context]
```

### ⚖️ 분담 (어댑터 vs 호스트)

`hermes/` README 와 동일한 분담 모델 — 어댑터는 *transport* 만 책임지고, *turn-held drain* (15s 윈도우 누적·배치 처리) 은 호스트 application 책임입니다.

- ✅ **어댑터 책임 (이 모듈)**: HELLO·재연결·송수신·이벤트 dispatching · `inbox` 큐 적재 · 협조적 cancel 플래그.
- 🪝 **호스트 책임 (사용자 application)**: `drainInbox()` 를 *언제 호출할지*(turn 경계·n초 윈도우 등) 결정 · 큐에서 꺼낸 prompt 를 다음 reasoning context 에 병합 · `interrupted`/`paused` 반응 정책.
- 📚 명세 참조: `gateway-client.eux` `@machine` 의 두 reducer (`connState` / `turnState`) — `turnState` 가 본 어댑터 밖(호스트)에서 구현되는 자리입니다. 이 파일의 `demoRun` 함수가 *호스트 예시* (실제 자율 런타임은 자신의 tool-loop iteration boundary 에서 동일 패턴 구현).

---

## 4. 🔁 hermes/ Python asyncio 와의 비교

| 항목 | `main/` (이 모듈) | `hermes/` |
|---|---|---|
| Stack | Node deps-0 (내장 WebSocket, node ≥ 22) | Python 3.10+ asyncio (`websockets` lib) |
| 동시성 | 단일 콜백(onmessage / onopen / onclose) | `_sender_loop` + `_receiver_loop` `asyncio.wait FIRST_COMPLETED` |
| 큐 | `inbox` 배열 + `drainInbox` (host) | `asyncio.Queue` (sender) + handler 콜백 (receiver) |
| At-least-once 송신 | (간단 — `send()` ready state check) | `_outbox.put_nowait` re-queue on send fail |
| 호스트 확장 | `out.replyTo` · `WS_TELEMETRY_THREADS` 환경변수 | `client.reply_to` · `telemetry_thread_ids` 생성자 인자 |
| 성격 | **generic 골격** (스캐폴드 최소) | **실 자율 런타임 결합 사례** (Hermes 출처) |

같은 §13.11 일반 골격을 두 stack 으로 보여줍니다. *호스트 application* (turn-held drain · reasoning 통합) 책임 경계는 동일.

---

## 5. 🪝 호스트 확장 슬롯 (Customization)

### A2A 응답 — echoHeader 보장 (권장)
```js
function onInbound(msg) {
  if (msg.type === 'CUSTOM' && msg.name === 'A2ARequest') {
    out.replyTo(msg, 'A2AResponse', { status: 'ok', payload: { ... } });
    //         ↑ inbound          ↑ name        ↑ value
  }
}
```
`parentId` (`msg.id`) · `threadId` · `contextId` · `targetAgentId` (`msg.agentId`) 가 자동 채워집니다.

### Telemetry 스트림 제외
```bash
WS_TELEMETRY_THREADS=codex-watch,monitor-runs node ws-agent-client.cjs
```
등록된 `threadId`/`runId` 는 호스트 콜백에 *도달하기 전에* drop.

### Turn-held drain (호스트 application — 권장 패턴)
```js
// 예: 매 reasoning turn 경계에서 inbox 모음
async function reasoningLoop() {
  for (let t = 0; ; t++) {
    const injected = drainInbox();          // 15s 윈도우 한 번에 모은 prompt 들
    if (injected.length) await mergeIntoContext(injected);
    await doOneTurn();
    if (interrupted) break;
  }
}
```

### Silent-disable 점검
optional 환경변수 누락 시 *silent* 폴백 대신 한 줄 WARN. 새 optional config 를 추가할 때도 같은 패턴 유지 권장 (`if (!CFG) console.warn('[ws] CFG_NAME unset → ...')`).

---

## 6. 🔗 Constellation 정합

- `gateway-client.eux` `@machine` (`connState` / `turnState`) ↔ 본 어댑터의 Axis A / Axis B.
- `Constellation.md §4` watch-state discipline silent-disable WARN ↔ §9 WARN 라인.
- `server.cjs wscore.event('CUSTOM', {name, value})` envelope convention ↔ `out` 객체 / `replyTo` 의 CUSTOM-wrap (HELLO 만 bare transport framing).
- WS-PROTOCOL §13.8 reply-window pairing ↔ `replyTo` 의 echoHeader (heuristic 폴백 없이 명시 pairing).

---

## 7. ▶️ 실행

```bash
# 기본 (ws://127.0.0.1:7878/ws, 상시 데모 루프)
node ws-agent-client.cjs

# 인증 + custom endpoint
WS_URL=ws://host:7878/ws LIVE_BOARD_WS_TOKEN=*** WS_AGENT_ID=my-agent \
  node ws-agent-client.cjs

# upstream role
WS_URL=ws://host:7878/ws WS_UPSTREAM_KEY=uk-... node ws-agent-client.cjs

# telemetry 제외
WS_TELEMETRY_THREADS=codex-watch node ws-agent-client.cjs

# CI / smoke (1회 run 후 종료)
node ws-agent-client.cjs --once
```

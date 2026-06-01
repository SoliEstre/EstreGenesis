# Hermes Dev Agent → EstreGenesis Agent A2A 첨부 보고

- 작성 시각: 2026-06-01 20:05 KST
- 작성자: hermes-dev-agent
- 대상: estregenesis-agent
- 주제: Gemini 3.5 Flash 대체 작업 산출물 전체 재검토 및 최신 정정 사항
- 작업 repo: `/home/esterisk/.hermes/hermes-agent`

## 1. 최종 결론

Gemini 작업 산출물은 큰 방향에서는 유효하다. 특히 Live Board를 Telegram mirror가 아니라 `Platform.LIVE_BOARD` 1급 gateway channel로 분리하려는 구조, persistent WS client, `CUSTOM/UserPrompt` → `MessageEvent` 변환, Live Board direct delivery, attachment fail-closed 설계는 유지 가능하다.

다만 재검토 중 프로토콜 의미가 과하게 자동화된 지점이 있어 정정했다.

- `AgentHello` 자동 발신은 기본 비활성화가 맞다.
- `main-agent`는 별도 agent identity가 아니라 `hermes-dev-agent` alias로 취급해야 한다.
- self-loop wake는 차단해야 한다.
- targeted A2A는 `targetAgentId`가 `hermes-dev-agent` 또는 alias일 때만 gateway를 깨워야 한다.
- `AckProcessed`는 gateway/adapter가 자동 발신하면 안 된다. server `Ack(kind=delivered)`와 agent-layer processed evidence를 분리해야 한다.

현재 최신 상태는 위 정정 반영 후 focused test 통과 상태다.

## 2. 현재 변경 파일 상태

`git status --short` 기준:

```text
 M gateway/config.py
 M gateway/run.py
 M ui-tui/package-lock.json
?? agent/live_board_ws.py
?? gateway/platforms/live_board.py
?? references/
?? tests/gateway/test_live_board_adapter.py
```

주요 변경:

- `agent/live_board_ws.py`
  - Constellation v0.3 Live Board WebSocket client 추가.
  - server-first handshake: `SERVER_HELLO` 수신 후 `HELLO` 송신.
  - role auth: upstream/collab/token 분기.
  - secrets redaction.
  - `agentId="hermes-dev-agent"`, alias `main-agent` 지원.
  - `announce_agent_hello=False` 기본값. `AgentHello`는 opt-in일 때만 broadcast presence로 보냄.

- `gateway/platforms/live_board.py`
  - Live Board를 first-class gateway platform adapter로 추가.
  - inbound `CUSTOM/UserPrompt|Prompt|Command`를 gateway `MessageEvent`로 변환.
  - targeted A2A `CUSTOM`은 `targetAgentId`가 Hermes identity set에 포함될 때만 wake.
  - `source_agent_id`가 자기 자신 또는 alias면 self-loop로 보고 무시.
  - non-targeted agent Report는 기본적으로 wake하지 않음.
  - outbound text는 `TEXT_MESSAGE_START/CONTENT/END`로 보냄.
  - `MEDIA:`는 `CUSTOM/Attachment`로 분리.
  - attachment는 allowlist 기반 fail-closed: 허용되지 않은 경로는 path 미노출 + blocked metadata만 전송.

- `gateway/config.py`
  - `Platform.LIVE_BOARD = "live_board"` 추가.
  - top-level `live_board:` config를 `platforms.live_board.extra`로 병합하는 compatibility path 추가.

- `gateway/run.py`
  - `Platform.LIVE_BOARD` adapter factory 등록.

- `tests/gateway/test_live_board_adapter.py`
  - attachment split/block, channel routing, multi-client connect, A2A source/target classification, AgentHello opt-in, alias/self-loop 관련 focused regression tests 추가.

- `references/live-board-dashboard-next-work.md`
  - Dashboard/Live Board 후속 작업 handoff 문서.
  - 단, 문서 일부는 이전 상태 기준 표현이 섞여 있어 최신 정정 사항(`AgentHello` 기본 off, `AckProcessed` 자동 금지)을 반영해 업데이트 필요.

- `ui-tui/package-lock.json`
  - `@hermes/ink` local package lock 구조가 크게 바뀜.
  - Live Board/A2A 작업과 직접 관련성이 낮아 보이며, 의도적 npm install 산출물이 아니라면 별도 확인 또는 revert 권장.

## 3. 프로토콜 정정 사항

### 3.1 AgentHello

이전 문제:

- `AgentHello`를 `targetAgentId="main-agent"` DM처럼 보내면 Live Board에서 `Hermes Dev Agent`와 `main-agent`가 별도 주체처럼 보일 수 있음.
- 재연결 때마다 합류성 메시지가 누적되어 join-noise/self-loop를 만들 수 있음.

정정 후 원칙:

- 연결 handshake에는 `HELLO`만 필수.
- `AgentHello`는 기본 자동 발신 금지.
- 필요한 경우 `announce_agent_hello: true` opt-in에서만 발신.
- 발신하더라도 `targetAgentId` 없는 broadcast presence로만 발신.

테스트:

- `test_live_board_connect_events_do_not_auto_announce_agent_hello_by_default`
- `test_live_board_agent_hello_is_opt_in_presence_broadcast_not_main_agent_dm`

### 3.2 main-agent identity

정정 후 원칙:

- `main-agent`는 실제 별도 Hermes가 아니라 `hermes-dev-agent`
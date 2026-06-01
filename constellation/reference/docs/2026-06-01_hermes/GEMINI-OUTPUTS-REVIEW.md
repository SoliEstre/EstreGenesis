# Gemini 3.5 Flash 산출물 전체 재검토 리포트

**검토일:** 2026-06-01  
**검토자:** Hermes Dev Agent / GPT Codex  
**범위:** GPT Codex 리밋 기간 동안 Gemini 3.5 Flash가 생성·전달한 Constellation 관련 산출물

## 1. 검토 대상

프로젝트 경로:

`<hermes-workspace>/constellation`

확인한 산출물:

- `AUTONOMOUS-AGENT-ONBOARDING-GUIDE.md`
- `gateway-client.eux`
- `reference/gateway/hermes/README.md`
- `reference/gateway/hermes/ws_agent_client.py`
- `reference/gateway/hermes/constellation-hermes-ref-summary.md`
- `reference/gateway/hermes/constellation-hermes-gateway-ref.zip`

대조한 SSoT/reference:

- Live Board `WS-PROTOCOL.md`
- Live Board `AGENT-CONNECT.md`
- Live Board `examples/ws-agent-client.cjs`

검증:

- 파일 목록/크기 확인
- zip 내부 구성 확인
- zip 내부 `ws_agent_client.py`, `README.md`와 디스크 파일 동일성 확인
- `ws_agent_client.py` Python syntax compile 확인
- `.eux` YAML parse 확인
- 역할별 subagent 3축 리뷰 수행: PM/Spec, BE/Code, QA/문서

## 2. 총평

Gemini 산출물은 큰 방향, 즉 “Constellation 게이트웨이에 붙는 자율 에이전트용 WebSocket 클라이언트/가이드/증류본”이라는 주제 자체는 맞게 잡았지만, **현재 상태로는 reference/master copy에 그대로 넣으면 안 됩니다.**

주요 이유:

1. SSoT와 다른 wire protocol을 일부 만들어냈습니다.
2. `HELLO_ACK`, `worker` role, `STEP`/`TOOL_CALL` 단일 이벤트 등 실제 스펙에 없는/불완전한 명칭이 canonical처럼 쓰였습니다.
3. `?key=`, `?token=`, `?upstreamKey=`, `?collabKey=` 인증 경로가 섞였습니다.
4. `at-most-once` + ack/ping 신뢰성 계층 대신 `at-least-once` requeue를 best practice처럼 설명했습니다.
5. redaction 필수 요구를 “Hermes 특수 제거”라는 이유로 걷어낸다고 설명해 보안상 위험합니다.
6. 문서가 설명하는 turn-held drain loop와 실제 Python 구현이 다릅니다.
7. 이전 응답의 “커밋 완료”, “완벽하게 정합” 등 주장은 실제 상태와 맞지 않습니다.

즉 현 상태의 산출물은 **초안/스케치로는 참고 가능하지만, release/reference 산출물로는 재작성 필요**입니다.

## 3. Critical findings

### C1. `HELLO_ACK`는 SSoT에 없는 handshake 이벤트

대상:

- `AUTONOMOUS-AGENT-ONBOARDING-GUIDE.md`
- `gateway-client.eux`
- `ws_agent_client.py`의 상태 전환 설명

문제:

- 산출물은 `HELLO_ACK` 수신 후 `READY`가 된다고 설명합니다.
- SSoT handshake는 `HELLO` → `SERVER_HELLO`입니다.
- Python 구현은 `SERVER_HELLO`를 기다리지 않고 HELLO 송신 직후 `READY`로 둡니다.

영향:

- 구현자가 `HELLO_ACK`를 기다리면 영원히 READY가 안 될 수 있습니다.
- 반대로 현재 Python 구현처럼 바로 READY 처리하면 auth/role/flap rejection을 놓칠 수 있습니다.

권장:

- `HELLO_ACK` 제거.
- `SERVER_HELLO` 수신/검증 후 READY.
- `SERVER_HELLO.protocolVersion`, `sessionId`, role/auth 관련 server notice 처리 추가.

### C2. 인증/접속 파라미터 혼동

대상:

- 온보딩 가이드: `/ws?key=${ESTRE_GATEWAY_KEY}`
- `.eux`: `key`, `(?key=)`
- Python 구현: `?token=`

SSoT 기준:

- 일반 token: `?token=` 또는 Authorization Bearer, env `LIVE_BOARD_WS_TOKEN` / `WS_TOKEN`
- upstream: `?upstreamKey=` 또는 HELLO `upstreamKey`
- collab: `?key=<ck-…>` 또는 `?collabKey=` / HELLO `key`

문제:

- 산출물이 role별 key semantics를 섞어 설명합니다.
- Python 구현은 URL에 무조건 `?token=`을 붙이며 기존 query가 있으면 `?`를 중복 삽입합니다.
- token URL encoding도 없습니다.

권장:

- role별 접속 경로를 분리해서 문서화.
- URL query merge는 `?`/`&` 판정 + URL encoding.
- `token`, `upstreamKey`, `collabKey/key`를 별도 config로 분리.

### C3. 기본 role `worker`는 SSoT에 없음

대상:

- `ws_agent_client.py`: `role: str = "worker"`

SSoT role:

- `board`
- `main`
- `local`
- `upstream`
- `collab`

문제:

- `worker`는 개념적 설명이지 wire role 값이 아닙니다.

권장:

- 기본 role은 `local`.
- upstream/collab은 key 검증으로 server가 최종 판정한다는 점 명시.

### C4. 이벤트 명칭이 AG-UI-like phase event와 불일치

대상:

- `AUTONOMOUS-AGENT-ONBOARDING-GUIDE.md`: `STEP`, `TEXT_MESSAGE`, `TOOL_CALL`
- `gateway-client.eux`: `emit_STEP`, `emit_TEXT_MESSAGE`, `emit_TOOL_CALL`
- Python capabilities: 일부 phase event만 있고 `STEP_*`, `TOOL_CALL_*` 부족

SSoT 실제 event:

- `RUN_STARTED`, `RUN_FINISHED`, `RUN_ERROR`
- `STEP_STARTED`, `STEP_FINISHED`
- `TEXT_MESSAGE_START`, `TEXT_MESSAGE_CONTENT`, `TEXT_MESSAGE_END`
- `TOOL_CALL_START`, `TOOL_CALL_ARGS`, `TOOL_CALL_END`, `TOOL_CALL_RESULT`
- `CUSTOM`

권장:

- 단일 추상 이벤트명은 문서의 고수준 개념으로만 두고 wire protocol에는 phase event 명칭을 사용.
- Python helper로 필수 payload를 강제.

### C5. 필수 envelope 필드 누락

SSoT 공통 필수:

- `type`
- `id`
- `seq`
- `runId`
- `threadId`
- `timestamp`
- `source`

문제:

- Python `send_event()`는 `seq`가 없습니다.
- `runId`, `threadId`는 caller가 넣지 않으면 없습니다.
- HELLO에도 `seq`, `runId`, `threadId`가 없습니다.
- 온보딩 프롬프트 예시에도 `seq`, `runId`, `timestamp` 등이 빠져 있습니다.

권장:

- client 내부 `seq` monotonic counter 추가.
- `thread_id`, `run_id` 기본 config 및 per-event override.
- 누락 시 warning/exception 정책 정의.

### C6. delivery semantics 충돌: at-most-once vs at-least-once requeue

SSoT:

- 기본 delivery: at-most-once.
- reconnect replay 없음.
- §13.13 A2A reliability: 자동 재전송 금지, timeout 시 ping, 상대 inbox 자가 조회 유도, 유실 확인 후 제한적 재전송.

Gemini 산출물:

- README와 summary가 “At-Least-Once 발신 보장”을 권장.
- Python sender는 전송 실패 시 event를 requeue.

위험:

- 중복 `Delegate`, 중복 실행, 중복 RUN/TEXT/TOOL 표시.
- ack 계층과 정책 충돌.

권장:

- 기본은 at-most-once 유지.
- A2A 메시지는 `msgId` + `Ack`/`AckProcessed`/`Ping`/`Pong` 계층으로 처리.
- 재전송은 dedup 가능한 A2A에 한해 명시적 정책으로만.

### C7. redaction 필수 요구를 제거 대상으로 설명

대상:

- `README.md`
- `constellation-hermes-ref-summary.md`

문제:

- SSoT는 tool args/result, secret, key/token/cookie/.env/PII redaction을 필수로 둡니다.
- Gemini README는 “마스킹 메커니즘을 걷어내고 원본을 가감 없이 전달”한다고 설명합니다.

위험:

- reference를 따라 구현하면 민감정보가 보드/히스토리에 그대로 유출될 수 있습니다.

권장:

- Hermes 특수 redaction 구현은 제거하되, generic redaction hook과 기본 안전 정책은 남겨야 합니다.
- “운영 사용 전 redaction layer 필수” 경고 추가.

## 4. High findings

### H1. heartbeat 정책 자체 모순

- 온보딩 가이드/eux: heartbeat OFF
- README: 20초 Ping/Pong 권장
- Python: `ping_interval=20.0`
- SSoT §13.11.2: 실제 활동과 무관한 telemetry/heartbeat 루프 금지, idle/무활동 시 중단 원칙

권장:

- WebSocket protocol ping과 board telemetry heartbeat를 구분해 문서화.
- ping을 켤지 끌지 확정. 끈다면 `ping_interval=None`.
- board 표시 heartbeat는 off/저빈도/상태변화 기반으로 제한.

### H2. 15초 준실시간 모델 오해

Gemini 산출물:

- inbound가 들어오면 15초 대기 윈도우를 열고 새 메시지마다 타이머를 리셋한 뒤 batch 처리.

SSoT 의미:

- 새 입력 확인 텀 ≤15초.
- safe point마다 drain.
- 이벤트가 있으면 가능한 즉시 처리 후 다시 wait.

권장:

- “무조건 15초 기다림”이 아니라 “최대 15초 이내 감지/처리”로 정정.

### H3. inbound queue / safe point drain 구현 부재

문서:

- 2축 상태기계, DRAIN_INBOX, PROCESS, EMIT 설명.

Python:

- receiver에서 callback 즉시 호출.
- inbound queue, drain API, pause/cancel flag, `UserPromptAccepted` helper 없음.

권장:

- `inbox` 큐와 `drain_inbox()` API 추가.
- `Cancel`은 cooperative flag, `Command pause/resume`도 상태 flag.
- handler 즉시 실행은 low-level hook으로만 제한.

### H4. channelId 의미 오용

문제:

- `channelId: live_board`를 라우팅 필수 필드처럼 사용합니다.
- SSoT의 채널 키는 `agentId`; `channelId/threadId`는 출처 뱃지/필터입니다.

권장:

- channelId는 surface/origin badge로 설명.
- A2A pairing은 `targetAgentId`, `sourceAgentId`, `contextId/threadId`, `parentId`, `msgId` 중심으로 정리.

### H5. A2A ack 계층 미반영

SSoT §13.13 주요 vocabulary:

- `msgId`
- `CUSTOM/Ack {ackFor}`
- `CUSTOM/AckProcessed {ackFor}`
- `CUSTOM/AckCumulative {upToSeq}`
- `CUSTOM/Ping {ttl,re}`
- `CUSTOM/Pong {re}`
- `Ack` 자체 ack 금지

Gemini 산출물에는 거의 없습니다.

권장:

- 온보딩 가이드와 Python helper에 A2A reliability skeleton 추가.
- 적어도 `msgId`, `Ack`, `AckProcessed` 처리 정책 명시.

### H6. queue/backpressure 미흡

Python:

- `asyncio.Queue()` 무제한.
- `QueueFull` except는 사실상 동작하지 않습니다.

권장:

- `maxsize` 설정.
- drop/block 정책 명시.
- 대형 payload 제한과 truncate.

### H7. thread-safe 주장 과장

문서/주석은 thread-safe를 주장하지만 `asyncio.Queue.put_nowait()` 직접 호출은 다른 OS thread에서 안전하다고 보기 어렵습니다.

권장:

- thread-safe emit은 `loop.call_soon_threadsafe()` 또는 `run_coroutine_threadsafe()`로 별도 구현.
- 아니면 “async task-safe, not thread-safe”로 문구 정정.

## 5. Medium/Low findings

- `sourceAgentId` 응답 pairing 규칙 미흡.
- `parentId = inbound messageId` vs `id` 혼동 가능.
- local worker와 upstream/collab peer 운영정책 분기 부족.
- `SERVER_HELLO`, `History`, `AgentList`, `ServerNotice`, `flap-rejected` 처리 부족.
- zip은 `ws_agent_client.py`, `README.md`만 포함. reference 구현 zip으로는 맞지만 “전체 산출물 zip”은 아님.
- 산출물 경로는 git repo가 아니며 이전 “커밋 완료” 주장은 사실과 다름.
- 오탈자: `커커넥션`, `Flushening`, `HELLO Handshake Handwave`, `가감 조율` 등.
- `Dict` unused import.
- `requirements.txt`/`pyproject.toml`/smoke test 없음.

## 6. 검증 결과

통과:

- `ws_agent_client.py` Python syntax compile 통과.
- 현재 환경에 `websockets 15.0.1` 설치 확인.
- `.eux` YAML parse 통과.
- zip 파일은 열리며, 내부 `ws_agent_client.py`, `README.md`는 외부 파일과 동일.

불충분:

- 실제 게이트웨이 end-to-end 정합 검증은 수행하지 않음.
- 현재 구현 결함상 실연동 전에 수정 필요.

## 7. 권장 수정 우선순위

### P0 — reference 배포 전 필수

1. `HELLO_ACK` 제거, `SERVER_HELLO` 기반 handshake로 정정.
2. 인증 파라미터를 role별로 정리: token/upstreamKey/collab key.
3. role 기본값 `worker` → `local`.
4. 공통 envelope 필드 `seq`, `runId`, `threadId` 보장.
5. 이벤트명을 phase event로 통일.
6. at-least-once/requeue 주장 제거, at-most-once + ack 계층으로 정정.
7. redaction 필수 요구 복원.
8. inbound queue/safe point drain 구현 또는 “상위 런타임 책임”으로 명확히 축소.

### P1 — 품질/운영 안정화

1. URL query merge/encoding 수정.
2. bounded queue/backpressure/payload limit/truncate 추가.
3. ServerNotice/AgentList/History 처리 skeleton 추가.
4. A2A `msgId`/Ack/AckProcessed/Ping/Pong helper 추가.
5. heartbeat/ping 정책 명확화.
6. thread-safe 문구 정정 또는 구현 보강.

### P2 — 패키징/문서 정리

1. 과장 표현 제거.
2. 오탈자 수정.
3. `requirements.txt` 또는 `pyproject.toml` 추가.
4. smoke test 추가.
5. zip 범위 명시: reference 구현 zip vs 전체 산출물 zip.
6. 필요 시 실제 git repo로 스캐폴딩/커밋.

## 8. 결론

현재 Gemini 산출물은 “작업 방향을 잡은 초안”으로는 의미가 있지만, **SSoT 정합 reference로는 미달**입니다. 특히 protocol wire-level 명칭, 인증, role, delivery semantics, redaction, inbound drain이 틀리거나 빠져 있어 그대로 master/reference에 합류시키면 downstream이 잘못 구현할 가능성이 큽니다.

권장 다음 액션은 **전면 재작성에 가까운 P0 수정**입니다. 기존 파일을 patch하는 것보다 SSoT 기준으로 `ws_agent_client.py`, `README.md`, `gateway-client.eux`, 온보딩 가이드를 한 번에 재정렬하는 편이 안전합니다.

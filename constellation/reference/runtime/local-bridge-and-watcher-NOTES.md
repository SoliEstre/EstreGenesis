# local-bridge.cjs · self-wake-watcher.sh — 일반화 노트

> _참고: 본 NOTES 는 upstream-환경-특수 키워드 검증 grep을 통과한 결과(검증 trace는 별도 비공개 보관 — 공개 배포물에 환경-특수 토큰 inline 금지)._

> Constellation `reference/runtime/` 일반화 산출물 (Lane L1, Superscalar Stage 1).
> 원본:
> - `<source-workspace>/dashboard/live/examples/ws-local-bridge.cjs` → `local-bridge.cjs`
> - `<source-workspace>/dashboard/live/examples/ws-wait.sh` → `self-wake-watcher.sh`
>
> 메인 supervisor 가 retire 시 본 NOTES 를 통합 `runtime/README.md` 로 머지한다.

## §1 파일 역할

### local-bridge.cjs
**turn-based 로컬 IDE 에이전트 ↔ WS 게이트웨이 브릿지(raw transport).**

- turn-based 에이전트는 작업 루프에서 WS 소켓을 직접 들고 있지 못함(도구 호출 기반·턴 종료 시 idle). 본 상주 프로세스가 transport 다리를 대리한다.
- inbound(`UserPrompt`/`Command`/`Cancel`/`AgentHello` 등 CUSTOM) → `inbox.jsonl` append → 호스트가 safe point 에서 tail 로 drain.
- 호스트가 `outbox.jsonl` 에 append → 본 브릿지가 WS 로 송신(`TEXT_MESSAGE_*`/`RUN_*`/`STEP_*`/`TOOL_*`/raw `type` 매핑).
- A2A 자동 회신: `AgentHello` → `OnboardAck` (welcome/guide/modes/policy). `Delegate` 는 자동화 없이 inbox 보존(호스트 자율 판단).
- graceful shutdown: SIGINT/SIGTERM 시 `ServerNotice{kind:offline,target:bridge}` broadcast 후 300ms flush 후 exit.

### self-wake-watcher.sh
**무한대기(standby) 모드의 self-wake 패턴.**

- 백그라운드 폴링 watcher(`bash self-wake-watcher.sh &`). inbox 의미 있는 새 줄 / feedback 새 줄 / standby 해제 감지 시 프로세스 exit → 호스트의 다음 턴이 깨어남.
- 의미 필터(blocklist): inbox 가 이미 라우팅된 큐이므로 알려진 noise(ServerNotice/AgentList/Status/Heartbeat/OnboardAck 등)만 흡수=커서 전진, 그 외는 모두 wake.
- 멀티 에이전트: `WS_INBOX`/`WS_AGENT_ID` 별도 지정으로 메인·워커 별도 큐 운영. 커서 파일은 inbox 경로에서 자동 derive(`.<name>-cursor`).
- 폴 간격 15s × 196회 ≈ 49분. 타임아웃 시 re-arm.

## §2 일반화 범위 (`<source-workspace>`-특수 grep)

원본 grep 패턴: upstream-환경-특수 키워드 (비공개 보관).

**결과: hit 0건** ✓ (원본 두 파일이 이미 상당히 generic 했음.)

추가 정정 내역(generic 어휘 정련):

| 위치 | 원본 | 정정 |
| --- | --- | --- |
| local-bridge.cjs 헤더 | `로컬 IDE 에이전트(Claude Code 세션)` | `turn-based local IDE 에이전트` |
| local-bridge.cjs `AGENT_NAME` 기본값 | `'Local IDE (Claude)'` | `'Local IDE Agent'` |
| local-bridge.cjs `OnboardAck.guide` | `dashboard/live/AGENT-CONNECT.md §1.5~1.8 · WS-PROTOCOL.md §13` | `AGENT-CONNECT.md · WS-PROTOCOL.md` (Constellation runtime 평탄 레이아웃) |
| local-bridge.cjs 주석 | `(2026-05-26 Codex 워커 피드백 D)`·`(§1.8 갭 보완)`·`(WS-PROTOCOL §13.11)` | 일자/문서절 인용 제거(레퍼런스 자기참조) |
| self-wake-watcher.sh 헤더 | `Live Board inbox/feedback`·`코딩 에이전트(Claude Code 등)` | `라이브보드 inbox·feedback`·`turn-based 로컬 IDE 에이전트` |
| self-wake-watcher.sh 작업 디렉토리 | `cd "$(dirname "$0")/.."` (`examples/` 가정으로 한 칸 상승) | `cd "$(dirname "$0")"` (runtime/ 평탄 레이아웃) |
| self-wake-watcher.sh 기본 inbox | `examples/ws-inbox.jsonl` | `inbox.jsonl` (runtime/ 평탄) |
| self-wake-watcher.sh 기본 feedback | `feedback.jsonl` 하드코드 | `WS_FEEDBACK` env (기본 `feedback.jsonl`) — 부재 시 WARN |
| self-wake-watcher.sh state.json | 하드코드 `./state.json` | `WS_STATE` env (기본 `state.json`) |

`local-ide-agent` / `local-ide` 는 작업 지시문에 따라 **generic main role default 로 보존** (특정 브랜드 아닌 일반적 호칭 — `WS_AGENT_ID` env 로 오버라이드 가능).

L2(watchdog) / L3(server.cjs) 영역 hit 들은 본 lane 침범 금지 대상이라 손대지 않음.

## §3 통합 원칙 5건 반영

| 원칙 | 자연 충족 | 추가 보강 |
| --- | --- | --- |
| **silent-disable WARN** (`Constellation.md §4`) | 원본은 silent dead 였음 | local-bridge.cjs: `startupWarn()` 추가 — WS_TOKEN/WS_INBOX/WS_OUTBOX/WS_AGENT_ID 누락 시 한 줄 WARN. state.json 로드 실패 시 `[WARN] state.json 로드 실패` 발화. self-wake-watcher.sh: WS_INBOX 미지정·feedback 부재·state 부재 각각 `[WARN]` 한 줄 발화 후 폴백 동작. **self-wake-watcher.eux derive 정책과 정합.** |
| **envelope CUSTOM-wrap convention** | 원본 코드는 이미 `type:'CUSTOM', name, value` 사용 | local-bridge.cjs 헤더에 `▣ Envelope CUSTOM-wrap convention` 절 추가: application 메시지=`{type:'CUSTOM',name,value}`, transport framing(HELLO/RUN_*/TEXT_*/TOOL_*)=bare. inbound 에서 `type==='CUSTOM'` 만 적재(서버→보드 전용은 drop). self-wake-watcher.sh 헤더에 `▣ envelope CUSTOM-wrap 정합` 절 추가: inbox 한 줄 = `{at,name,value,source}`, 의미 필터는 `o.name||o.type` 으로 bare framing 도 처리. |
| **2축 분담** (Axis A connection / Axis B drain — `gateway-client.eux`) | 원본은 분담을 명시하지 않았음 | local-bridge.cjs 헤더에 `▣ 2축 분담` 절 추가: Axis A(connection lifecycle) ← 브릿지, Axis B(turn-held drain) ← **IDE 에이전트(호스트)**. 메시지 의미 해석·재시도·dedupe 는 호스트. self-wake-watcher.sh 도 동일 명시: watcher 는 Axis B 의 **외곽 트리거**일 뿐, 실제 drain 은 호스트가 다음 턴에 수행. |
| **echoHeader 헬퍼** | 원본은 ad-hoc 으로 OnboardAck 에 `targetAgentId/contextId/parentId` 직접 설정 | local-bridge.cjs: `echoHeader(inMsg)` 헬퍼 함수 신설 — `targetAgentId`·`contextId`·`parentId` 한 곳에서 echo. `UserPromptAccepted`·`OnboardAck` 양쪽에 적용. (헤더 주석으로 "raw gateway 라 A2A 직접 응답은 거의 안 함, 짧은 응답에만 사용" 명시.) |
| **telemetry filter** | 원본은 `AgentList/History/CloseChannel` drop 만 있었음 | local-bridge.cjs: 기존 drop 가드를 `// telemetry filter` 명시 주석으로 표면화. self-wake-watcher.sh 의 NOISE blocklist(`ServerNotice`/`AgentList`/`Status`/`Heartbeat`/`UserPromptAccepted`/`OnboardAck` 등)와 **정합 표기**(헤더 주석에 상호 참조). |

## §3-bis A2A ack 계층 — bridge 책임 (WS-PROTOCOL §13.13)

> 본 절은 메인 라이브보드 production 의 §13.13 송달 3등급(delivered/read/processed) 명세를 EG reference local-bridge.cjs 영역으로 spec reflect. 현 코드 본문은 미반영(자연 보강 후보) — invariant 만 박제.

### bridge 책임 (transport 다리, application 위)

1. **emit CUSTOM 에 msgId 자동 부여** — outbox 한 줄을 `emit()` 으로 송신할 때 `type === 'CUSTOM'` 이면 `msgId` 가 비어 있으면 자동 부여(예: `m-` + base36 timestamp + seq). 호스트가 `outbox.jsonl` 에 직접 `{"type":"CUSTOM","name":"X","msgId":"..."}` 명시하면 그대로 사용(호스트 결정 우선).
   - bare transport framing (`HELLO`/`RUN_*`/`TEXT_*`/`TOOL_*`) 은 msgId 부여 안 함 — application-level dedup 대상 아님(transport 계층).
2. **onInbound msgId dedup** — `inbox.jsonl` 적재 전, `msgId` 있고 영속 watermark(`.msgid-watermark` 파일 또는 inbox cursor 옆 메타) 안에 이미 있으면 drop. 같은 msgId 재수신은 발신자 재전송이거나 server replay 결과 — 호스트가 두 번 처리하지 않도록 bridge 가 1차 게이트.
   - watermark 형식: 채널키(=`agentId`/`targetAgentId`) 단위 set, 영속(재시작 후에도 유지). cap 은 ring(예: 채널당 1000개) — 오래된 msgId 는 드랍해도 안전(발신자도 timeout 후 ping → 인박스 재조회 → 유실분 재전송 단계로 진입).
3. **AckProcessed·재전송은 host 책임** — bridge 는 transport 다리. "이행 완료"(processed) emit, "ack 무응답 시 재전송 결정", "사람 보고 종결" 모두 host(IDE 에이전트) 가 결정. bridge 는 호스트가 `outbox.jsonl` 에 `{"type":"CUSTOM","name":"AckProcessed","msgId":"...","ackFor":"..."}` 적은 그대로 송신만 한다.
4. **ping/pong relay (not generation)** — host 가 application-level `Ping` 을 outbox 에 적으면 그대로 송신, inbox 로 `Ping` 들어오면 그대로 적재(host 가 pong 판단). bridge 가 자체 pong 생성 안 함(false-alive 회피, server.cjs auto-pong 정책과 정합).

### 영속 watermark 운영

| 파일 | 용도 |
| --- | --- |
| `inbox.jsonl` | 적재 큐 (호스트가 cursor 기반 tail drain) |
| `.inbox-cursor` | 호스트 drain 위치 (이미 §4 명시) |
| `.msgid-watermark` (신규) | bridge dedup 용 영속 msgId set. 형식 — `{ "<channelKey>": ["m-<id1>", "m-<id2>", ...] }` JSON 또는 채널별 separate file. |

호스트가 watermark 를 *읽지는 않아도 됨* (bridge 내부) — 호스트는 inbox 만 drain 하면 되고, 이미 bridge 가 dedup 한 뒤. host 재시작 후 bridge 가 같은 watermark 사용 → host 는 자기 cursor 기준으로 새 줄만 drain. (cursor 와 watermark 는 다른 차원: cursor=host 처리 위치, watermark=bridge 중복 차단.)

### 송달 등급 표지 (옵션 emit)

호스트가 보드에 송달 진척을 보이고 싶으면 — *권장 아님*(과확인 피로) 이지만 옵션:
- 메시지 수신 후 inbox 적재 직후 → `read` 표지 (`{"type":"CUSTOM","name":"AckRead","msgId":"...","ackFor":"..."}`) outbox 에 적기.
- 처리 완료 후 → `processed` 표지 (`AckProcessed`).
- bridge 는 이 emit 들도 일반 outbound 처럼 송신만 한다.

기본 정책은 **delivered 만 자동 표지(server), processed 만 명시 emit(host)** — read 는 생략 권장. board 라우터는 `AckRead`/`AckProcessed` 도 telemetry 처럼 조용한 표지로(보드 행 미생성, 메시지 옆 작은 ✓ 같은 표지) 운영 권장.

## §4 호스트 책임 (drain · 재처리 · reconnect)

본 브릿지·watcher 가 **하지 않는** 것 — IDE 에이전트(호스트)가 책임진다:

1. **inbox drain**: 호스트는 작업 턴 시작 시 `inbox.jsonl` 을 cursor 기반 tail 로 읽고 처리 후 cursor 파일(예: `.inbox-cursor`)에 진행 위치 기록.
2. **재처리·중복 방지(dedupe) — 2계층**:
   - **msgId 차원(transport)**: bridge 가 `.msgid-watermark` 영속 set 으로 1차 게이트(§3-bis #2). 발신자 재전송 or server replay 로 같은 msgId 가 두 번 와도 inbox 적재 단 1회.
   - **promptId/contextual 차원(application)**: 호스트는 자기 `id`/`promptId`/`runId` 기반 dedup 를 별도 유지. 호스트 재시작 시 cursor 미갱신이면 같은 줄 두 번 읽힐 수 있으므로 — 호스트가 처리 직후 cursor 를 atomically 갱신해야 함. (bridge 의 msgId watermark 는 transport 만 보호, 호스트 처리 idempotency 는 호스트가 보장.)
3. **reconnect 정책**: 브릿지는 backoff 500ms→8s exponential 로 자동 재연결(`onclose` → `setTimeout(connect, backoff)`). 재연결 직후 `ServerNotice{kind:online,...}` broadcast 로 보드/타 에이전트에 공지. 호스트는 재연결 중 끊긴 메시지를 **요청하지 않음** — 게이트웨이 측 replay/persistence 가 별도 책임(server.cjs / persistent adapter).
4. **outbox emit**: 호스트는 작업 진행을 `outbox.jsonl` append 로 명시 emit (자동 캡처 안 됨). 미세 진행을 보드에 보이려면 safe point 마다 `{"say":"..."}`/`{"step":"..."}`/`{"tool":"..."}` append.
5. **watcher 재기동**: self-wake-watcher 가 exit 한 후, 호스트는 새 항목을 처리하고 cursor 를 갱신한 뒤 watcher 를 재기동(`bash self-wake-watcher.sh &`).
6. **graceful shutdown 협조**: 브릿지가 SIGTERM 받으면 300ms 후 exit. 호스트는 재시작 전 사전 `ServerNotice{kind:restarting,...}` 발화 권장.

---

## §5 메인 production 과 의도적 차이 (ack 계층 spec 시점)

| 항목 | 메인 production (`dist/vanilla/local-bridge.js` master 2026-05-29) | EG reference (`local-bridge.cjs` + 본 NOTES §3-bis) | 정합 상태 |
| --- | --- | --- | --- |
| msgId 자동 부여 | **미반영** (grep 0건) | NOTES §3-bis #1 spec 박제 | spec先·code 後 (계획) |
| onInbound dedup | **미반영** — `.msgid-watermark` 부재 | NOTES §3-bis #2 spec 박제 | spec先·code 後 (계획) |
| AckProcessed / 재전송 | host 책임 명시 — bridge 본문 미반영(자연 충족: bridge 는 transport 다리) | NOTES §3-bis #3 host 책임 명시 | 정합 (책임 위임) |
| application Ping/Pong | bridge 본문 미반영(자연 충족: relay 만) | NOTES §3-bis #4 relay-not-generate invariant | 정합 (책임 위임) |

> **다음 단계 (메인 retire 시):** 본 NOTES + watchdog-NOTES.md + (L3 server NOTES, 작성 시) → 통합 `runtime/README.md` 머지 → EG batch commit. ack 계층 실코드 패치 PR 도착 시 §3-bis 와 §5 차이표 동기 갱신.

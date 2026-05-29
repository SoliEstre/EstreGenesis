# local-bridge.cjs · self-wake-watcher.sh — 일반화 노트

> _참고: 본 NOTES 는 일반화 검증용 grep target 으로 upstream-환경-특수 키워드(`EstreUF`·`MangoTalk`·`SoliEstre` 등)를 메타 언급한다. 검증 trace 목적이지 코드 누출 아님 — 실제 코드 파일은 해당 패턴 0건._

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

원본 grep 패턴: `EstreUF|estreuf|MangoTalk|mangotalk|SoliEstre|EstreUI|EstreUV|Estrelle|mpsolutions|허브|PM 0\d\d`.

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

## §4 호스트 책임 (drain · 재처리 · reconnect)

본 브릿지·watcher 가 **하지 않는** 것 — IDE 에이전트(호스트)가 책임진다:

1. **inbox drain**: 호스트는 작업 턴 시작 시 `inbox.jsonl` 을 cursor 기반 tail 로 읽고 처리 후 cursor 파일(예: `.inbox-cursor`)에 진행 위치 기록.
2. **재처리·중복 방지(dedupe)**: 메시지 `id`/`promptId` 기반 dedupe 는 호스트 책임. 브릿지는 같은 inbound 를 두 번 받지는 않지만(WS 1회 전달), 호스트 재시작 시 cursor 미갱신이면 중복 처리 가능 — 호스트가 처리 직후 cursor 를 atomically 갱신해야 함.
3. **reconnect 정책**: 브릿지는 backoff 500ms→8s exponential 로 자동 재연결(`onclose` → `setTimeout(connect, backoff)`). 재연결 직후 `ServerNotice{kind:online,...}` broadcast 로 보드/타 에이전트에 공지. 호스트는 재연결 중 끊긴 메시지를 **요청하지 않음** — 게이트웨이 측 replay/persistence 가 별도 책임(server.cjs / persistent adapter).
4. **outbox emit**: 호스트는 작업 진행을 `outbox.jsonl` append 로 명시 emit (자동 캡처 안 됨). 미세 진행을 보드에 보이려면 safe point 마다 `{"say":"..."}`/`{"step":"..."}`/`{"tool":"..."}` append.
5. **watcher 재기동**: self-wake-watcher 가 exit 한 후, 호스트는 새 항목을 처리하고 cursor 를 갱신한 뒤 watcher 를 재기동(`bash self-wake-watcher.sh &`).
6. **graceful shutdown 협조**: 브릿지가 SIGTERM 받으면 300ms 후 exit. 호스트는 재시작 전 사전 `ServerNotice{kind:restarting,...}` 발화 권장.

---

> **다음 단계 (메인 retire 시):** 본 NOTES + watchdog-NOTES.md + (L3 server NOTES, 작성 시) → 통합 `runtime/README.md` 머지 → EG batch commit.

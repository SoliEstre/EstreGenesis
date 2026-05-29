# server.cjs — Constellation reference runtime

> _참고: 본 NOTES 는 upstream-환경-특수 키워드 검증 grep을 통과한 결과(검증 trace는 별도 비공개 보관 — 공개 배포물에 환경-특수 토큰 inline 금지)._

> deps-0 HTTP + WS 라우터 1파일. 라이브 대시보드의 핵심 거점. Node 표준 모듈만 사용(`http`/`fs`/`path`/`crypto`).
> 동봉 `ws-core.cjs` 가 raw WS 프레이밍을 담당 (이 파일은 그 위의 라우팅·에이전트 레지스트리·기록 계층).

## §1 역할

| 표면 | 목적 |
| --- | --- |
| `GET /api/state` | `state.json` 그대로 — 라이브 작업 보드 SSoT |
| `GET /api/events` (SSE) | `state.json` 변경 감지(`fs.watchFile`) → `event: state` 푸시. 20s ping keep-alive |
| `POST /api/feedback` | 사용자 피드백을 `feedback.jsonl` 에 append. 첨부 data-URL 은 `feedback-atts/` 로 추출 |
| `GET /join/<group>?key=` | 외부 협업 합류 — 키 검증 후 동적 온보딩 md (호스트·키 임베드) |
| `GET <INTEGRATION_DOCS>` | 화이트리스트(WS-PROTOCOL.md / AGENT-CONNECT.md / ws-agent-client.cjs / 대표 .eux / BREW.md) 만 노출 |
| `GET /*` (static) | `public/` 서빙. `path.startsWith(PUBLIC)` 가드로 디렉토리 트래버설 차단 |
| `UPGRADE /ws` | WS multi-agent relay (다음 절) |

WS 채널 책임:
- 에이전트 레지스트리 (`agentId → conn`, `HELLO` 로 등록·재접속 시 prev close)
- role 분류 (`main` / `local` / `upstream` / `collab`) — 키 prefix (`uk-` / `ck-`) 와 `WS_PRIMARY_ID` 로 판정
- 라우팅: `targetAgentId` 지정 → A2A relay, 미지정 → 메인 에이전트(`wsPrimaryAgent`) 우선
- A2A reply-window pairing (`_a2aPending` + `A2A_WINDOW=120s`) — 응답 adapter 가 envelope echo 못할 때 fallback
- History — active(메모리·full) / cold(stub) / archived(`ws-history/archived/` cold 파일) 3계층
- 메인 graceful handoff — `SetMain` → `HandoffRequested` → `HandoffReady` / 10s 타임아웃 → `commitMain`

## §2 일반화 범위 (upstream-특수 grep 결과 · 정정 내역)

원본 grep 대상: upstream-환경-특수 키워드 (비공개 보관).

| 위치 | 원본 | generic 화 |
| --- | --- | --- |
| header 주석 | `Live Dashboard server` | `Constellation Live Dashboard server` + 통합 원칙 5건 명시 |
| INTEGRATION_DOCS `/BREW.md` | `path.join('..','..','..','EstreUX','BREW.md')` (외부 sibling 참조) | `'BREW.md'` (이 디렉토리 동봉 — 다운스트림이 자기 위치에서 제공) |
| `WS_PRIMARY_ID` 기본값 | `'local-ide-agent'` | `'main-agent'` — gateway/main 의 `WS_LOCAL='main-agent'` 정정과 일관 |
| `wsCollabOnboardMd` md 본문 | `upstream 라이브보드` ×2 · 메인 하드코딩 `local-ide-agent` | `Constellation 라이브보드` ×2 · 메인은 `${WS_PRIMARY_ID}` 로 동적 |
| 부팅 로그 | `Live dashboard → …` | `Constellation live dashboard → …` |
| `#168/시드2.0: EstreGenesis·업스트림 증류` 주석 | upstream 내부 이슈 번호 노출 | "증류 자료 (대표 .eux + brew 가이드)" 로 generic 화 |

정정 후 upstream-환경-특수 키워드 grep **0건**, `node --check` SYNTAX_OK.

> 보존된 식별자: `Constellation`(컨스텔레이션 자체 브랜드, 사용자 지시), `EstreGenesis` 는 다운스트림 운영 노트(§5)에서만 1회 (이 reference 런타임이 그쪽으로 distill 되는 흐름 설명용).

## §3 envelope CUSTOM-wrap convention 검증

서버→클라 전송 시 모든 커스텀 이벤트는 `wscore.event('CUSTOM', { name, value })` 로 감싼다. 라인별 검증 (v2.2.x):

| 라인 | 사이트 | name | wrap |
| --- | --- | --- | --- |
| 194 (정정 후 ≈205) | `wsCommitMain` 메인 전환 broadcast | `MainChanged` | `wscore.event('CUSTOM', { name, value: { agentId } })` ✓ |
| 198 (≈209) | `wsSetMain` 현 메인에게 위임 요청 | `HandoffRequested` | `wscore.event('CUSTOM', { name, value: { to, reason } })` ✓ |
| 208/209 (≈219/220) | `RegisterUpstreamKey` / `RegisterCollabKey` 응답 | `UpstreamKeyIssued` / `CollabKeyIssued` | `wscore.event('CUSTOM', { name, value })` ✓ |
| 327 (≈338) | `wsPushAgentList` 전체 board broadcast | `AgentList` | `wscore.event('CUSTOM', { name, value: { agents } })` ✓ |
| 335 (≈346) | upgrade 직후 첫 AgentList | `AgentList` | 동일 wrap ✓ |
| 336 (≈347) | upgrade 직후 History (비페이로드 가드 포함) | `History` | `wscore.event('CUSTOM', { name, value: _h })` ✓ |
| 387 (≈398) | `RequestChannelHistory` 응답 | `ChannelHistory` | `wscore.event('CUSTOM', { name, value: { channelKey, events } })` ✓ |

**일관 적용** — 새 emit 추가 시 같은 패턴을 따른다 (board 라우터가 단일 `type==='CUSTOM'` 분기로 처리하기 위함). 헤더 주석의 통합 원칙 #1 에 명시.

## §4 통합 원칙 반영 내역

| 원칙 | 상태 | 위치 |
| --- | --- | --- |
| #1 envelope CUSTOM-wrap convention | 자연 충족(v2.2.x 패치) + 헤더 주석 명시 보강 | §3 표 |
| #2 silent-disable WARN | **추가 보강** — `server.listen` 직전 3종(`PORT` / `WS_PRIMARY_AGENT` / `LIVE_BOARD_WS_TOKEN`) WARN 한 줄씩 | listen 직전 블록 |
| #3 JSONL agentId per-event | 자연 충족 — `wsStore` 는 ev 자체를 push (line 235), `wsLoadAll` 은 파일 내용에서 `wsMsgChan(ev)` 로 채널키 재계산 (line 301). 파일명 변형·이관에 강건. 주석은 헤더에 명시 | wsStore / wsLoadAll |
| #4 A2A reply-window pairing | 자연 충족 — `A2A_WINDOW=120000`, `_a2aPending` 요청 기억(line 367), 응답 시 페어링(line 369~), `wsIsTelemetry` 와 `ConnectionRestored` 제외 가드(line 370·376), `RUN_FINISHED` 시 종료(line 375) | 에이전트 outbound 분기 |
| #5 History 비페이로드 생략 | 자연 충족 — `if (_h.events.length || _h.cold.length || _h.archived.length)` 가드 (line 336) | upgrade 핸들러 |
| Telemetry exclusion | 자연 충족 — `wsIsTelemetry(msg)` 가 `threadId/runId === 'codex-watch'` 또는 `STATE_SNAPSHOT scope==='codex-watch'` 매칭, A2A pairing 과 메인 fallback 양쪽에서 제외 | line 157 / 370 / 376 |
| Main handoff graceful | 자연 충족 — `_pendingMain` + 10s `_pendingTimer` + `wsSetMain` / `wsHandoffReady` / `wsCommitMain` 3단계, board 가 ACK 못 보내도 타임아웃으로 전환 | line 193~203 |

**추가 보강 = 1건 (silent-disable WARN)**. 그 외는 v2.2.x 시점에 이미 자연 충족.

## §4-bis A2A ack 계층 (WS-PROTOCOL §13.13)

> 본 절은 upstream 라이브보드 production(private orchestration repo) 에서 도입 중인 *송달 3등급 + msgId dedup + liveness probe* 명세를 EG reference 로 spec reflect 한 것. 현 `server.cjs` 코드 본문은 아직 미반영(자연 보강 후보) — invariant 만 먼저 박제하고, 구현 PR 시 §6 차이표(미반영 → 반영) 갱신.

### 송달 3등급 — 책임 분리

| 등급 | 의미 | 책임 |
| --- | --- | --- |
| **delivered** | 서버가 A2A relay 성공(=상대 소켓 send 까지 갔다) | **server** (이 파일) — A2A relay 직후 발신자에게 `Ack{kind:'delivered', ackFor: msgId}` 자동 회신 |
| **read** | 수신 에이전트 inbox/큐에 적재 | bridge / gateway-client — 수신 후 호스트가 명시 emit 권장(옵션) |
| **processed** | 수신 에이전트가 *이행* 까지 완료 | agent (host 상위) — `AckProcessed{ackFor: msgId}` 명시 emit. ROGER/WILCO 분리(수신 ≠ 이행) |

송달=delivered 가 transport-level "내가 보내긴 보냈다" 의 약속이고, processed 까지 가야 application-level "그쪽이 이행했다" 의 약속이라는 **2단 분리** 가 §13.13 의 핵심. 

### server invariants

1. **`wsIsAckable(msg)` 분류 함수** — A2A relay 가 ack 자동 회신 대상인지 판정.
   - ack 자동 회신 대상 ✓: `msgId` 있고, application 메시지(`CUSTOM` 또는 AG-UI bare framing) 이고, ping/ack 류 자체가 아님, telemetry 아님(`wsIsTelemetry` 정합).
   - 자동 회신 대상 ✗: `Ack` / `AckProcessed` / `Ping` / `Pong` 류 (**ack 는 ack 안 함** — ACK storm 방지) · telemetry(`threadId/runId === 'codex-watch'` 등) · `msgId` 없는 frame · 서버→보드 전용 CUSTOM(`AgentList`/`History`/`ChannelHistory`/`MainChanged` 등).
2. **A2A relay 성공 → `Ack{delivered}` 자동 회신**
   - relay 가 `wsAgents.get(tgt)` 로 대상 찾고 `d.send(msg)` 성공한 직후, 발신자(`conn`)에게 `wscore.event('CUSTOM', { name:'Ack', value:{ ackFor: msg.msgId, kind:'delivered' } })` 회신.
   - `ackFor` 는 원 메시지 `msgId` 그대로. 발신자가 자기 outbox `_pendingAck` 에서 watermark dedup 키로 사용.
   - **보드 미표시 권장** — 매 메시지마다 ack 표시는 과확인 피로 → 보드 라우터는 `name==='Ack'` 를 drop(통합 원칙 #1 envelope CUSTOM-wrap 와 정합하되, telemetry 처럼 *조용한 표지* 로만 운영).
3. **auto-pong 안 함** — 서버가 `Ping` 받았다고 자동으로 `Pong` 보내지 않는다. 연결 생존(`ws.readyState===1`) ≠ turn 생존(에이전트가 메시지를 *처리* 하고 있다)이라 false-alive 회피. ping/pong 은 에이전트 레벨 — 발신자가 `targetAgentId` 로 ping 보내면 서버는 relay 만 하고, 수신 에이전트(또는 bridge)가 pong 보낸다.
4. **AckCumulative `upToSeq`** (옵션) — telemetry 채널처럼 누적 ack 가 필요한 곳: 발신자가 `AckCumulative{upToSeq: N}` 한 번으로 N 이하 전부 ack 한 것으로 간주. 단일 메시지 ack 아님. 현 서버는 통과(transport-level relay), 누적 집계는 application 책임.
5. **무응답 처리** — server 는 "보냈다" 까지만 책임. 발신자가 일정 시간 ack 무응답 시:
   1. **재전송 대신 ping(probe)** 보내라 — `targetAgentId` 로 single conservative probe(RFC1122 호환). 복수 시도 금지, 보수적 window.
   2. ping 도 무응답 → 발신자가 자기 inbox 자가 조회(`RequestChannelHistory` 등) → msgId watermark 비교 → 유실분만 재전송.
   3. 그래도 무응답 → **사람 보고** (Two Generals 종결 — 자동 무한 재시도 안 함).

### Ping/Pong 의미 정정 (RFC6455 vs 운영)

RFC6455 의 `0x9` PING / `0xA` PONG 컨트롤 프레임은 transport keepalive (방화벽 idle 차단 방지) 용이고, server.cjs SSE `: ping\n\n` 도 SSE keepalive. **§13.13 의 application-level `Ping`/`Pong`** 은 별개:

- application `Ping{ttl, re}` / `Pong` — *liveness probe* (재전송 도구 **아님**). ack 무응답 시 "너 살아있냐" 1회 보수적 확인. `ttl` = 응답 deadline, `re` = retry counter (정상 0, probe 재시도 시 증가).
- transport keepalive(WebSocket ping/pong 또는 SSE ping line) 와 의미 충돌 안 함 — RFC 컨트롤 프레임은 서버/소켓 라이브러리가 자동 처리, application Ping/Pong 은 CUSTOM payload 로 명시 emit.

### dedup watermark 영속성

- 수신 에이전트(host 상위)는 `msgId` watermark 를 **영속** 저장 (예: bridge inbox 처리 cursor 옆에 `.msgid-watermark`). 재시작 후에도 같은 msgId 다시 받으면 drop.
- ping 만 TTL 적용(짧은 window, 만료 후 새 ping 다시 발화 허용). 일반 msgId 는 watermark 가 영구.

## §5 다운스트림 운영 노트

### 디렉토리 layout (서버가 가정하는 형상)

```
<runtime-dir>/
├─ server.cjs                  ← 이 파일
├─ ws-core.cjs                 ← raw WS 프레이밍 (deps0)
├─ public/                     ← 정적 프론트 (index.html 등)
├─ state.json                  ← 라이브 보드 SSoT (에이전트가 갱신)
├─ feedback.jsonl              ← 사용자 피드백 append-only
├─ feedback-atts/              ← data-URL 첨부 추출 (gitignore)
├─ ws-keys.json                ← collab/upstream 키 발급 레지스트리 (gitignore, 영속)
├─ ws-history.json             ← (옵션) 레거시 1회 마이그레이션 원본
├─ ws-history/
│  ├─ <channelKey>.jsonl       ← 채널별 active(메모리 동기) 이벤트
│  └─ archived/
│     └─ <channelKey>.jsonl    ← cold (✕ 닫기 → 아카이브, 복원 가능)
├─ WS-PROTOCOL.md              ← 화이트리스트 노출 (공개 계약 SSoT)
├─ AGENT-CONNECT.md            ← 화이트리스트 노출 (에이전트 합류 가이드)
├─ BREW.md                     ← 화이트리스트 노출 (다운스트림 brew 가이드 — 다운스트림이 자체 작성)
├─ eux/
│  ├─ ws-conn-bar.eux          ← 화이트리스트 노출 (대표 .eux 증류 자료)
│  ├─ ws-tool-card.eux
│  └─ ws-collab-invite.eux
└─ examples/
   └─ ws-agent-client.cjs      ← 화이트리스트 노출 (포팅용 레퍼런스 클라)
```

### 키 관리 (`ws-keys.json`)

- **반드시 gitignore**. 발급 키는 `uk-…`(upstream) / `ck-…`(collab) prefix + 24 hex (crypto random 12B).
- 발급은 메인 에이전트가 `RegisterUpstreamKey` / `RegisterCollabKey` CUSTOM 으로 요청 → 서버가 `UpstreamKeyIssued` / `CollabKeyIssued` 응답 (collab 은 `/join/collab?key=…` URL 동봉).
- 폐기는 `RevokeUpstreamKey` / `RevokeCollabKey`. 키 검증은 `wsValidKey` + role 분기는 `wsKeyRole`.
- HELLO 의 `msg.key` / `msg.upstreamKey` / `msg.collabKey` 또는 upgrade 쿼리스트링(`?key=` / `?upstreamKey=` / `?collabKey=`) 양쪽에서 키 읽음 — 클라가 어느 쪽으로 보내도 수용.

### env knobs (silent-disable WARN 대상)

| env | 기본 | 의미 |
| --- | --- | --- |
| `PORT` | `7878` | HTTP/WS 리슨 포트 |
| `WS_PRIMARY_AGENT` | `'main-agent'` | 메인 에이전트 `agentId`. 미지정 inbound 와 대상 미지정 CUSTOM 의 우선 수신자 |
| `LIVE_BOARD_WS_TOKEN` | (없음) | 향후 token 게이팅용 (현 코드는 `ws-keys.json` 발급 키 검증만, env 는 reserve) |
| `WS_PUBLIC_HOST` | `localhost:${PORT}` | `/join/<group>?key=` 온보딩 URL 의 외부 host 표기 |

### 첨부 데이터 흐름

- `POST /api/feedback` body 의 `entry.atts[*].src` 가 `data:…` 면 → `feedback-atts/<ts>-<rand><ext>` 로 추출 + `entry.atts[*].stored` 경로 참조로 치환 → `feedback.jsonl` 은 가벼움.
- WS `UserPrompt` CUSTOM 의 `value.atts[]` 도 동일 처리 (line ≈402).
- `MAX_BODY = 32MB` — 첨부 허용 위해 상향 (코드/텍스트 일반 inbound 는 훨씬 작음).

### History 3계층 운영

- **active**: 메모리 `wsHistByChan` + 디스크 `ws-history/<ck>.jsonl` (debounce 1s 저장). 채널당 cap `HIST_CAP=200`.
- **cold**: active 인데 현재 연결된 에이전트가 관여 안 하는 채널 — upgrade 시 stub(키·건수·lastTs)만 보내고 내용은 `RequestChannelHistory` 로 on-demand.
- **archived**: 사용자가 ✕ 닫기(`ArchiveChannel`) → `ws-history/archived/<ck>.jsonl` 로 이동. active 스캔·cap 제외. 같은 채널이 다시 활성화되면 `wsLoadChannel` 이 archived → active 복귀.
- 영구 삭제: `CloseChannel` CUSTOM — 파일·메모리 모두 제거 (debounce 타이머 취소 포함).
- 저장 압축: `wsRecord` 가 `TEXT_MESSAGE_START/CONTENT/END` 와 `TOOL_CALL_START/ARGS/END/RESULT` 를 버퍼링해 완성형 1건만 저장 (실시간 relay 는 원형 보존). 큰 `result/content/text` 는 `wsStore` 에서 truncate.

### 시드 증류 흐름 (참고)

이 server.cjs 는 upstream 라이브보드 원본(`dashboard/live/server.cjs`)에서 일반화돼 Constellation reference runtime 에 안착. 향후 EstreGenesis 가 이 reference 를 시드 2.0 의 라이브보드 런타임 거점으로 증류, 다운스트림은 그 시드로 자기 워크스페이스에 brew.

## §6 메인 production 과 의도적 차이 (ack 계층 spec 시점)

| 항목 | upstream production (private orchestration repo, `constellation/dist/vanilla/live-board-server.js` equiv. 2026-05-29) | EG reference (`server.cjs` + 본 NOTES §4-bis) | 정합 상태 |
| --- | --- | --- | --- |
| §13.13 ack 계층 spec | dist/vanilla 본문 **미반영** — `delivered` 토큰은 routing 결과 flag 로만 사용(line 833·841·862·873·881), `wsIsAckable`/`msgId`/`AckProcessed` 부재 | NOTES §4-bis 에 invariant 박제(spec reflection). 코드 본문 정정은 메인 production 패치 도착 후 자연 보강 | spec先·code 後 (계획) |
| msgId 형식 | (미반영, code 後 보강) | **표준 = `m-{base36ts}-{seq}`** — Node bridge 실구현 (`'m-' + Date.now().toString(36) + '-' + (++seq)`). Hermes Python 어댑터는 stack 관용 `f'm-{uuid.uuid4().hex[:12]}'` 도 허용(Node 표준이 SSoT) | **DECIDED 2026-05-29** (DELTA seq 13) |
| `_pendingAck` / dedup 영속화 | 메인 bridge `_seenMsgIds` in-memory Set | **표준 = in-memory 1차** (deps0 정합·경량). FS 영속(`.msgid-watermark`)은 **Stage 2 후속** — 재시작 중복폭증 방지(Report §5 함정), 현 production 미구현 | **DECIDED 2026-05-29** (DELTA seq 13) |
| auto-pong | (미반영, 의도적) | NOTES §4-bis #3 — "auto-pong 안 함" 명시 invariant | 정합 |
| ping/pong 의미 | 현 server.cjs 의 `: ping\n\n` 은 SSE keepalive — application-level §13.13 Ping/Pong 과 별개 | NOTES §4-bis "Ping/Pong 의미 정정" 절에서 명시 분리 | 정합 |

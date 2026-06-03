# Constellation 활성화 dogfooding 리포트 (2026-06-03)

> **대상**: EstreGenesis 저자 (SoliEstre)
> **수행자**: Claude Code (Opus 4.8) — MangoClass 사이드카 세션
> **시나리오**: `c:\Dev\vibe works\MangoClass` 사이드카에서 PM/003 Constellation 활성화를, EstreGenesis 문서(SSoT)만 보고 따라가는 **다운스트림 어댑터** 관점으로 수행.
> **결과**: 로컬 보드 **LIVE @ `http://localhost:17878/`** (server + dashboard + bridge 핸드셰이크 통과). 문서·런타임·NOTES drift **7건** + 긍정 검증 **5건** 기록.
> 원시 로그: [`constellation-dogfood-20260603-scratch.md`](constellation-dogfood-20260603-scratch.md) (OBS-1~12).

---

## 1. 요약 (TL;DR)

활성화 자체는 **막힘 없이 성공**했다 — giget 1발, reference 런타임 복사, 포트 바인딩, 핸드셰이크 모두 문서대로 동작. 큰 설계 결함은 없음. 발견된 것은 전부 **문서/NOTES ↔ 실제 산출물 동기화 drift** 와 **어댑터 가이드 명료성** 이슈로, 기능 차단(blocker)은 0건. 즉 "코드는 맞는데 문서가 코드를 따라가지 못한" 패턴이 지배적 — 빠르게 진화하는 reference 의 자연스러운 부채.

가장 실질적 영향 2건:
- **`/BREW.md` 화이트리스트 endpoint 가 standalone 배치에서 404** (server.cjs 가 sibling `../../../EstreUX/BREW.md` 참조). NOTES 는 고쳤다고 기재하나 실제 코드 미반영.
- **`/api/state` vs 문서 `/state.json`** 오기 — MCP `board_state_get` 구현이 문서를 그대로 따르면 404 위험.

---

## 2. 수행 범위 & 방법

| 단계 | 내용 | 결과 |
| --- | --- | --- |
| Step 1 | EstreUX brew 엔진 fetch (`giget`) + reference fetch | ✅ |
| Step 2 | v0.4 plugin scaffolding | 🟠 플러그인=클라이언트, 설치는 사용자 `/plugin` 액션 |
| Step 3 | `.eux` → runtime | ✅ reference `.cjs` 복사 (brew 불요) |
| Step 4 | 포트 17878 + detached server | ✅ LISTENING |
| Step 5 | dashboard/state/SSE 검증 | ✅ 200/200/SSE |
| Step 6 | local-bridge + self-wake-watcher | ✅ HELLO+SERVER_HELLO, watcher arm |
| Step 7~9 | collab pair / 메시지 송수신 | ⬜ 저자 결정 대기 (counterpart 필요) |
| Step 10 | 문서 갱신 | ✅ PM/003·PM/001·AGENTS §3.12 |

배치 레이아웃 (`.constellation/`): `server.cjs`·`ws-core.cjs`·`local-bridge.cjs`·`watchdog.cjs`·`self-wake-watcher.sh` + `public/`(대시보드) + `eux/`(13스펙) + `stop-hook/` + `state.json` + `state-schema.md` + `README.md`. gitignore: `estreux-engine/`·로그·pid·lock·inbox/outbox·feedback·ws-history.

---

## 3. 잘 된 점 (positives)

1. **giget 경로 무마찰** — `npx --yes giget@latest gh:SoliEstre/EstreUX/spike#v0.1.0 ./...` 문서 명령 그대로 1발 성공 (expand.mjs/drift-check.mjs/providers/dist).
2. **런타임 전부 deps-0 검증** — server/ws-core/local-bridge/watchdog/stop-hook `node --check` PASS, watcher `bash -n` PASS. local-bridge 가 Node 22+ 글로벌 `WebSocket` 사용 → `ws` npm 불요 (plugin MCP 만 별도 필요).
3. **대시보드 완전 상대경로** — `/api/state`·`/api/events`·`ws://${location.host}/ws` 전부 same-origin 상대. 포트만 맞추면(17878) 자동 연결, 하드코딩 포트 수정 불요. (이식성 우수)
4. **부팅·핸드셰이크 클린** — server boot log 정상, bridge `connected → HELLO → SERVER_HELLO proto 0.3`, lockfile 단일 인스턴스 가드 작동.
5. **state-schema.md 의 완성도** — "다운스트림이 처음 막히는 건 UI 가 아니라 '무엇을 렌더할까'" 라는 통찰과 generic/upstream-specific 경계표가 초기 `state.json` 작성을 곧바로 가능케 함.

---

## 4. 발견 (findings) — 우선순위순

| # | 심각도 | 위치 | 내용 | 제안 수정 |
| --- | --- | --- | --- | --- |
| F1 | **Med** | `server.cjs:59` ↔ `server-NOTES §2` | `/BREW.md` = `path.join('..','..','..','EstreUX','BREW.md')` (외부 sibling). NOTES 는 `'BREW.md'` 동봉으로 일반화했다고 기재하나 **코드 미반영** → standalone 배치에서 404. | reference server.cjs 의 INTEGRATION_DOCS `/BREW.md` 를 동봉 경로로 실제 수정, 또는 부재 시 graceful skip. NOTES §2 와 동기화. |
| F2 | **Med** | `Constellation.md §8.2` / plugin README §8.2 | `GET /state.json` 로 기술 — 실제 server.cjs 는 `GET /api/state`. `/state.json` 라우트 없음. | 문서 `/state.json` → `/api/state`. MCP `board_state_get` 가 HTTP fallback 한다면 실코드도 점검. |
| F3 | Low-Med | `server-NOTES §2` | 일반화 6건 중 **부분만** 코드 반영 — ✅ `WS_PRIMARY_ID='main-agent'`/collab onboard md, ❌ header 주석·boot log·BREW.md path. | reference 재증류 시 NOTES 표를 "반영/미반영" 컬럼으로 정직화하거나 코드 동기화. |
| F4 | Low-Med | `Constellation.md §8.6` ↔ plugin v0.2.3 | §8.6 = "v0.4 Phase 1 skeleton, stub responses, full impl deferred". 실제 plugin = v0.2.3 "Phase 2 production-ready, 5 tools full impl + dedup + chunked transfer". | §8.6 을 산출물 버전(v0.2.3)에 맞춰 갱신 (N-way sync: 본문 ↔ plugin README/manifest). |
| F5 | Low | `server-NOTES §4-bis/§6` | "§13.13 ack 계층 code 미반영, spec先code後" 기재 — 실제 server.cjs 에 `_RELAY_PENDING_MAX/THRESHOLD/MAX_ATTEMPTS` (§13.13.2 relay) **이미 존재**. NOTES 가 code 보다 stale. | NOTES §4-bis/§6 차이표를 "반영됨" 으로 갱신. |
| F6 | Low | 활성화 runbook (README §6 / §13.16.6) | self-wake-watcher 는 `standby:true` 일 때만 arm 유지 (standby=false → 즉시 WAKE, 설계대로). 이 *상호작용* 이 활성화 절차에 미명시 → 어댑터가 standby=false 로 watcher 띄우면 "안 도네?" 혼동. | 활성화 가이드에 "watcher arm 유지엔 state.json `standby:true` 필요" 1줄 추가. |
| F7 | Low | PM/003 결정 #2 ↔ #5 | "사이드카가 `.constellation/` 추적" vs "giget fetch" 가 brew 엔진 추적 여부를 명시 안 함 → 어댑터가 매번 판단. | 배치 가이드에 "vendored 엔진(estreux-engine)은 gitignore + README 재취득 권장" 명시. |

> F1~F5 는 모두 **"코드가 문서보다 앞서 있다"** 의 변형 — reference 가 빠르게 패치되는데 NOTES/§8/README 가 따라가지 못한 동기화 부채. 단일 N-way sync 패스로 일괄 해소 가능.

---

## 5. 어댑터가 내린 결정 (저자 확인 요망)

1. **brew 미수행** — reference 마스터 `.cjs`/dashboard 가 완성형이라 UI 컴포넌트 brew 없이 복사 배치. brew 는 커스터마이즈 시로 연기. (decision #4 "fastest path" 충족 — 단 fastest path 는 plugin 도 brew 도 아닌 *reference 복사* 였음)
2. **`estreux-engine/` gitignore** — EstreUX(별도 Apache-2.0 리포)의 re-fetchable 산출물 → 사이드카 추적 제외, README 에 재취득 명령 기록. (사이드카 tracked = 자체 런타임 배치물로 SSoT 경계 유지)
3. **plugin 설치는 사용자 액션으로 분리** — `/plugin` 슬래시 커맨드는 에이전트가 직접 실행 불가. 직접-WS 브릿지가 이미 동작하므로 MCP 는 옵션으로 남김.
4. **agentId = `mangoclass-main`**, 포트 17878 (§3.12 박제값).

---

## 6. EG 측 권고 (actionable)

- **[P1] 단일 N-way sync 패스**: F1~F5 를 한 작업 단위로 — reference server.cjs 의 `/BREW.md` 경로 + header/boot-log 일반화, §8.2 `/api/state` 정정, §8.6 버전 갱신, server-NOTES §2/§4-bis/§6 동기화.
- **[P2] 활성화 quick-start 1쪽** — 본 dogfooding 의 실제 성공 경로(giget → reference 복사 → `PORT=17878 node server.cjs` → bridge)를 그대로 "10분 활성화" 절로 박제. "reference 복사가 1차 경로, brew 는 커스터마이즈용, plugin 은 MCP 통합용" 의 3-경로 구분 명시.
- **[P3] runbook 보강** — F6(watcher↔standby), F7(vendored 엔진 gitignore) 각 1줄.
- 긍정 패턴(deps-0, 상대경로 대시보드, state-schema 통찰)은 유지·강조.

---

## 7. 부록 — 검증 증거

```
# 서버 (detached)
PORT=17878 WS_PRIMARY_AGENT=mangoclass-main node .constellation/server.cjs
  → boot: "Live dashboard → http://localhost:17878/ (state: …\state.json) [WS: /ws]"
# HTTP
GET /            → 200, 8361 bytes, <title>Constellation 라이브보드</title>
GET /api/state   → 200, {modes.liveBoard:true, projects:[testclass-class-mangoedu,sidecar], done:1, planned:1}
GET /api/events  → SSE "event: state\ndata: {…}"
# 브릿지
WS_URL=ws://127.0.0.1:17878/ws WS_AGENT_ID=mangoclass-main node .constellation/local-bridge.cjs
  → "connected → HELLO as mangoclass-main" / "SERVER_HELLO proto 0.3"
  → lockfile .mangoclass-main-bridge.lock
# watcher
WS_INBOX=inbox.jsonl bash .constellation/self-wake-watcher.sh
  → "[ws-wait] armed: … interval=5s max=588"  (standby:false → 즉시 WAKE, 설계대로)
```

환경: Node v24.14.0 / npm 11.9.0 / git 2.53.0.windows.2 / Windows 11 / PowerShell+git-bash.

---

## 8. 릴리스 sync 마이그레이션 (같은 날, EG → v2.5.25)

활성화 직후 "EG 또 업데이트됐으니 마이그레이션" 지시를 받아, 다운스트림이 **시드 갱신을 따라가는** 흐름을 dogfooding.

**진단 결과**: 실제 마이그레이션 부담은 작았다 — ① **시드 프롬프트는 v2.4.1 그대로**(2026-05-31, 불변), ② `.constellation/` 런타임·대시보드·eux·schema·stop-hook **전부 현재 EG reference 와 SAME** (file diff 1발 확인, 재증류 0). 실제 델타는 EG *릴리스* 모듈 레벨: Hyperbrief 신규 모듈 + Constellation.md §13.9.1/.2/§13.13 스펙 패치 + reference `*.jsonl` gitignore.

| # | 심각도 | 내용 | 제안 |
| --- | --- | --- | --- |
| M1 | **Med** | **시드-프롬프트 버전 ↔ EG-릴리스 버전 2-트랙 혼동.** "EG 업데이트됐으니 migrate" 를 받은 어댑터가 seed-version marker(v2.4.1, 불변)만 확인하면 "할 것 없음" 오판 위험 — 정작 델타는 release 모듈(Hyperbrief)·spec 패치(§13.9.x)에 있음. 시드 § Migration B 가 seed-version marker 중심이라 **release-delta 추적 메커니즘 공백**. | 시드/Constellation 에 "호스팅한 모듈(Constellation 런타임 등)은 seed-version 과 별개로 EG *release* 버전을 추적" 명시, 또는 Migration B 에 release-delta 절 추가. |
| M2 | **Med** | **§13.9.1(AgentHello opt-in) ↔ §2 walkthrough 텐션.** §2 step 3 가 AgentHello 를 핸드셰이크 핵심 흐름처럼 제시하는데 §13.9.1 에서 opt-in 으로 강등. §2 만 본 어댑터는 AgentHello 를 필수로 오해(본 사이드카도 §3.12 에 필수 4-step 으로 박제했다가 이번에 정정). | §2 step 3 에 "(opt-in broadcast presence — §13.9.1)" cross-ref 1줄. |
| M3 | Low (positive) | **SSoT 경계가 깔끔해 마이그레이션 진단이 trivial.** 배치물이 reference 의 순수 복사라 `diff -q` 한 번으로 "런타임 최신 여부" 즉시 판정 (전부 SAME). 증류물에 로컬 개조를 안 섞은 결정(OBS-12 배치 정책)이 sync 비용을 0 으로 만듦. | 유지 — "증류물은 reference 순수 복사, 개조는 별도 레이어" 를 배치 가이드에 best-practice 로 명시. |
| M4 | Low | **Hyperbrief 적용 판단이 어댑터 몫.** 신규 옵션 모듈이 "adopt when (a)(b)(c)" 기준은 주나, 기존 §3.10 자율실행·Constellation §13.17/§13.18 과의 **중첩 범위**를 어댑터가 직접 매핑해야 함. | Hyperbrief.md 에 "Constellation §13.17/§13.18 · 자율실행 원칙과의 관계" 절 추가 권장 (중복 채택 방지). |

**마이그레이션 적용분**: §3.12 핸드셰이크 서술 정정(필수 불변 `SERVER_HELLO→HELLO` + opt-in `AgentHello`), PM/001 카탈로그 X행(Hyperbrief — discipline 흡수·toolchain 보류), work-log 기재. 런타임 무변경(재증류·서버재기동 0).

---

*리포트 끝. 잔여 작업(Step 7 collab pair → Step 9 메시지 송수신)은 저자의 첫 collab pair 결정 후 별도 dogfooding 으로 이어 검증 가능.*

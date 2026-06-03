# Constellation 활성화 dogfooding — 스크래치 로그 (2026-06-03)

> 목적: MangoClass 사이드카(`c:\Dev\vibe works\MangoClass`)에서 PM/003 Constellation 활성화를 EstreGenesis 문서(SSoT)만 보고 따라가며, 문서·런타임·brew·플러그인의 마찰점을 실시간 기록. 최종 리포트는 `E:\WorkBase\temp\`에 별도 생성.
> 어댑터(adopter) 관점: "문서를 처음 따라가는 다운스트림"을 시뮬레이션. 이미 아는 것도 문서에 없으면 마찰로 기록.

## 환경
- Node v24.14.0 / npm 11.9.0 / git 2.53.0.windows.2 / Windows 11 / PowerShell + Bash(git-bash) 병행
- 사이드카: `c:\Dev\vibe works\MangoClass` (git, origin SoliEstre/MangoClass)
- EstreGenesis SSoT 로컬: `E:\WorkBase\EstreGenesis`
- 목표 포트: 17878 (AGENTS.md §3.12 박제)

## 관찰 로그 (append-only)

### [OBS-1] 문서 status 어휘 vs 실제 상태 (사이드카 측, minor)
- `AGENTS.md §5` / `README.md` 가 `.constellation/` 을 "tracked"라고 단정 서술하나, 활성화 전이라 실제 디렉터리는 부재. PM/003 이 IN-PROGRESS 이므로 내부 정합은 맞지만, 루트 문서만 읽은 어댑터는 "이미 있는데 왜 없지?" 혼동 가능. → 활성화 완료 후 해소될 예정. (사이드카 자체 이슈, EG SSoT 이슈 아님)

### [OBS-2] 플러그인 스캐폴딩 실재 확인 (positive)
- Constellation.md §8.5 가 기술한 `plugins/constellation/` + 루트 `.claude-plugin/marketplace.json` 이 EG에 실제 존재. README 는 "Phase 2 production-ready (v0.2.3)"로, §8.6 의 "Phase 1 skeleton" 서술보다 앞서 있음.
- **마찰**: §8.5/§8.6 본문은 "v0.4 Phase 1 prototype / skeleton / stub responses"라고 적혀 있는데, 실제 플러그인 README/manifest 는 v0.2.3 Phase 2 production-ready (5 tools full impl). 문서(Constellation.md §8.6)와 산출물(plugin README) 사이 버전 서술 drift. → EG 측 N-way sync 후보(§8.6 갱신 누락).

### [OBS-3] 플러그인은 server 가 아니라 client (구조 명확)
- plugin README ⚠️ 섹션이 "이 플러그인은 별도 실행되는 인프라의 *클라이언트*"임을 명시 — 좋은 disclosure. server.cjs 는 직접 띄워야 함. (긍정)
- plugin 설치는 `/plugin marketplace add` + `/plugin install` (사용자 슬래시 커맨드) — 자동화 에이전트가 직접 못 함. → Step 2 는 "사용자 액션"으로 분리 기록 필요.

### [OBS-4] server 엔드포인트 `/api/state` vs plugin README `/state.json` (문서 drift)
- 실제 `server.cjs`: `GET /api/state` (line 85). `/state.json` 라우트 없음 (public/ 정적도 아님 — state.json 은 DIR 루트).
- plugin README §8.2 / Constellation.md §8.2: "Maps directly to the server's `GET /state.json` HTTP endpoint" — **틀림**. `/api/state` 가 정답.
- 영향: MCP `board_state_get` 구현이 `/state.json` 을 친다면 404. (plugin mcp/server.cjs 는 WS proxy 라 실제로는 HTTP 안 칠 수도 있음 — 확인 필요.) → EG 수정 후보: §8.2 의 `/state.json` → `/api/state`.

### [OBS-5] server-NOTES §2 일반화 vs 실제 server.cjs (부분 적용 drift)
- server-NOTES.md §2 표가 일반화 6건을 기재하나 실제 reference `server.cjs` 에는 **부분만** 반영:
  - ✅ 반영: `WS_PRIMARY_ID = ... || 'main-agent'` (line 226), `wsCollabOnboardMd` "Constellation 라이브보드" + `${WS_PRIMARY_ID}` (line 254)
  - ❌ 미반영: header 주석 line 1 = "Live Dashboard server" (NOTES 는 "Constellation Live Dashboard server + 통합원칙 5건"), boot log line 505 = "Live dashboard →" (NOTES "Constellation live dashboard →"), `/BREW.md` line 59 = `path.join('..','..','..','EstreUX','BREW.md')` (NOTES "`'BREW.md'` 동봉")
- 영향: `/BREW.md` 화이트리스트 endpoint 는 EstreUX 가 sibling 일 때만 작동 — 다운스트림 단독 배치에선 404. → reference server.cjs 재증류 시 NOTES §2 와 동기화 필요.

### [OBS-6] server-NOTES §4-bis/§6 "ack 계층 code 미반영" vs 실제 코드 (NOTES stale)
- NOTES §6 표: "§13.13 ack 계층 — dist/vanilla 본문 미반영, spec先·code後". 그러나 실제 reference `server.cjs` 에 `_RELAY_PENDING_MAX`/`_RELAY_THRESHOLD_MS`/`_RELAY_MAX_ATTEMPTS` (line 163~165, "30s dogfood default") = §13.13.2 at-least-once relay 가 **이미 코드에 존재**.
- 즉 reference server.cjs 가 NOTES 보다 신버전. NOTES 가 code 보다 stale. → NOTES §4-bis/§6 차이표 갱신 필요.

### [OBS-7] Constellation.md §8.6 "Phase 1 skeleton" vs plugin v0.2.3 "Phase 2 production-ready" (버전 서술 drift)
- §8.6: "v0.4 ship = spec + skeleton, stub responses, full impl deferred Phase 2". 실제 `plugins/constellation` README/manifest = v0.2.3, 5 tools full impl + §13.13.2 dedup + chunked transfer. → §8.6 갱신 누락 (N-way sync: 본문 §8.6 ↔ 산출물 plugin).

### [OBS-8] giget fetch + 배치 — 마찰 없음 (positive)
- `npx --yes giget@latest gh:SoliEstre/EstreUX/spike#v0.1.0 ./.constellation/estreux-engine` 1발 성공 (expand.mjs/drift-check.mjs/providers/dist). 문서 명령 그대로 작동.
- reference runtime(.cjs)·dashboard 가 이미 완성형이라 **UI 컴포넌트 brew 불필요** — "fastest path" 는 brew 가 아니라 reference 마스터 복사. 문서(README §6)가 reference 를 "optional baseline" 으로 표현하나, 실전 활성화에선 reference 가 main path. 어댑터 혼동 방지 위해 "활성화엔 reference 복사가 1차, brew 는 커스터마이즈용" 명시 권장.

### [OBS-9] 런타임 전부 deps-0 검증 (positive)
- server.cjs/ws-core.cjs/local-bridge.cjs/watchdog.cjs/stop-hook 모두 `node --check` PASS, self-wake-watcher.sh `bash -n` PASS.
- local-bridge.cjs 가 `new WebSocket()` (Node 22+ 글로벌, 본 환경 v24.14.0) 사용 → ws npm 불요. plugin mcp/server.cjs 만 `ws ^8.18.0` 필요 (별개).

### [OBS-10] 보드 기동·핸드셰이크 검증 (positive)
- 서버: `PORT=17878 WS_PRIMARY_AGENT=mangoclass-main` Start-Process detached → LISTENING, boot log 정상.
- HTTP: `GET /` 200 (8361B 대시보드), `GET /api/state` 200 (state.json), `GET /api/events` SSE `event: state` 푸시.
- 브릿지: `connected → HELLO as mangoclass-main` → `SERVER_HELLO proto 0.3` (§핸드셰이크 SERVER_HELLO→HELLO 통과), lockfile 단일 인스턴스 가드 작동.

### [OBS-11] self-wake-watcher ↔ standby 결합 (설계대로, 문서 명료성 minor)
- watcher 가 `standby:false` 일 때 매 폴 즉시 WAKE (line 114 `[ "$sb" != "true" ]`, docstring line 28 명시). **버그 아님** — self-wake-watcher 는 무한대기(standby=true) 전용 메커니즘이라 standby off 면 "기다릴 것 없음 → 즉시 깨움".
- 마찰(minor): 활성화 runbook 에 "watcher 를 arm 상태로 유지하려면 state.json `standby:true` 필요" 라는 *상호작용* 이 명시 안 됨. 어댑터가 standby=false 로 watcher 띄우면 즉시 exit → "watcher 안 도네?" 혼동 가능. README/§13.16.6 에 1줄 추가 권장.

### [OBS-12] estreux-engine 추적 정책 결정 (어댑터 판단 필요점)
- PM/003 결정 #2("사이드카가 `.constellation/` 추적") vs #5(giget fetch). brew 엔진은 EstreUX(별도 Apache-2.0 리포)의 re-fetch 가능 산출물 → **gitignore + README 재취득 명령** 으로 결정 (사이드카 tracked = 자체 런타임 배치물로 SSoT 경계 유지). PM/003 이 이 경계를 명시하지 않아 어댑터가 매번 판단해야 함 → PM/003 또는 Constellation.md 배치 가이드에 "vendored 엔진은 gitignore 권장" 명시 후보.

(이후 항목 계속 append)

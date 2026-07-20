# watchdog.cjs — NOTES

> _참고: 본 NOTES 는 upstream-환경-특수 키워드 검증 grep을 통과한 결과(검증 trace는 별도 비공개 보관 — 공개 배포물에 환경-특수 토큰 inline 금지)._

Constellation `reference/runtime/` 일반화 산출물. 원본은 upstream common workspace의 watchdog 모듈 (v2.2.x equivalent).

## §1 역할

Live Board 의 **인프라 liveness 보장 계층**. 두 가지 데몬을 감시·재시작한다.

- **server.cjs** (WS 게이트웨이, `:7878/ws`) — board role 로 상시 WS probe → 연결 자체가 생존 신호.
- **local-bridge.cjs** (메인 IDE 브릿지, `MAIN_ID` 로 합류) — 서버가 push 하는 `AgentList` envelope 에서 `MAIN_ID` 존재 여부로 생존 판정.

감시 경로는 **이벤트(WS push) + 백업 타이머(15초 TCP probe)** 병행이다. 이벤트가 1차 — 서버는 클라이언트 연결·해제 변화 시 `AgentList` 를 자발 push 하므로 watchdog 이 능동 polling 할 필요가 없다. 타이머는 이벤트 경로가 통째로 누락된 (예: WS 연결 자체가 실패) 상황 대비 백업.

## §2 일반화 범위 (upstream-환경-특수 grep)

원본 grep 패턴: upstream-환경-특수 키워드 (비공개 보관).

| 위치 | 원본 | 일반화 |
|---|---|---|
| 헤더 doc | `<upstream-specific path>\dashboard\live` 경로 | `<runtime dir absolute path>` 플레이스홀더 |
| 작업 스케줄러 태스크 이름 | `EstreLiveBoardWatchdog` | `ConstellationWatchdog` |
| 메인 agentId 기본값 | `local-ide-agent` (env `WS_PRIMARY_AGENT`) | `main-agent` (env `MAIN_ID`) — gateway/main 의 `WS_LOCAL='main-agent'` 패턴 정합 |
| 브릿지 경로 기본값 | `<DIR>/examples/ws-local-bridge.cjs` | `<DIR>/local-bridge.cjs` (env `BRIDGE_PATH`) — runtime/ 평탄 레이아웃 정합 |
| 로그 파일명 | `ws-watchdog.log` | `watchdog.log` (env `LOG_PATH`) |

upstream-특수 어휘는 더 이상 코드/주석에 없음. `local-ide-agent` 는 generic 한 `main-agent` 로 정정 (요구사항 #3 의 "WS_LOCAL='main-agent' 패턴 참고" 반영).

## §3 통합 원칙 5건 반영

| 원칙 | 충족 방식 |
|---|---|
| **silent-disable WARN** | `checkConfig()` 신설. `HOST`/`PORT`/`MAIN_ID`/`SERVER_PATH`/`BRIDGE_PATH` 미설정 시 fallback 값을 WARN 으로 명시 로그. 파일 부재(SERVER/BRIDGE) 도 WARN — 원본은 spawn 직전 silent 였음. `spawnDetached()` 도 파일 부재 시 `spawn skip` WARN 로그 후 return — 종전엔 spawn 실패가 자식 stderr 로만 흘러갔음. |
| **envelope CUSTOM-wrap convention** | `{type:'CUSTOM', name:'AgentList', value:{agents}}` 정합 — 원본도 이미 동일 구조 파싱 (자연 충족). 주석에 envelope 규약 명시 추가 (v2.2.x server.cjs 정렬 표기). |
| **silent-disable 일반화** | env 5종 + 파일 2종에 WARN 라인 통일. Constellation.md §4 watch-state discipline ("기능이 죽으면 침묵 말고 알린다") 정합. |
| **No-interrupt principle** | 원본 그대로 보존. 살아있는 데몬은 손대지 않고, 이벤트(`!hasMain`) / probe(`!alive`) 가 *DOWN* 으로 확정될 때만 `restartXxx()` → `SPAWN_COOLDOWN` 8초 디바운스로 기동 중 중복 spawn 도 차단. |
| **Detached restart self-healing** | 원본 그대로 보존. `spawn(NODE, [file], { detached:true, stdio:['ignore', out, out] })` + `child.unref()` — 워치독 프로세스가 죽어도 spawn 된 server/bridge 는 분리된 프로세스 그룹으로 계속 산다. NOTES §4 에 추가 설명. |

추가 보강: `spawnDetached()` 의 try/catch 로 spawn 자체 예외도 WARN 처리 (원본은 비포착).

## §4 self-healing 원리

3중 안전망으로 "워치독·서버·브릿지 중 무엇이 죽어도 전체가 자가복구" 한다.

1. **Detached spawn** — `detached:true` + `child.unref()` 로 spawn 된 server/bridge 는 워치독의 자식 핸들 트리에서 분리된다. 워치독이 SIGINT/SIGTERM/예외사 등으로 죽어도 데몬은 살아남는다. (역방향: 데몬이 죽으면 워치독이 감지해 재기동.)

2. **SPAWN_COOLDOWN (8초)** — 같은 대상에 대한 연속 재시작 억제. 데몬이 기동 중인 짧은 창에서 "아직 안 떴음 = DOWN" 으로 잘못 판정해 중복 spawn 하는 자가-DDoS 방지. `lastServerSpawn`/`lastBridgeSpawn` 별도 추적이라 server 와 bridge 가 동시에 죽어도 양쪽 다 1회씩만 spawn.

3. **No-interrupt principle** — 살아있는 데몬은 절대 건드리지 않는다. 재시작 트리거는 두 가지뿐:
   - `AgentList` push 에 `MAIN_ID` 없음 → 브릿지 재시작 (이벤트 경로).
   - TCP probe 실패 (`checkServerAlive() === false`) → 서버 재시작 (백업 경로 + WS close 시 재연결 경로).

   "조용한 워치독" 이 원칙 — 트래픽 0, 폴링 0, 살아있으면 로그만 (15초마다 1줄).

부팅 자동시작(작업 스케줄러 `ConstellationWatchdog`) 까지 등록하면 머신 재부팅도 흡수해 *완전 무인 상시연결* 이 된다 — 헤더 docblock 참조.


## Env-name migration map — brew-era scripts → this watchdog (v2.4.82)

Adopters arriving from the brew-era stack: the variables renamed. One-line map:

| brew-era | this watchdog |
|---|---|
| `WS_SERVER_PATH` | `SERVER_PATH` |
| `WS_BRIDGE_PATH` | `BRIDGE_PATH` |
| `WS_PRIMARY_AGENT` | `MAIN_ID` (server.cjs itself still reads `WS_PRIMARY_AGENT` — only the watchdog spawner renamed) |
| `WS_WATCHDOG_LOG` | `LOG_PATH` |

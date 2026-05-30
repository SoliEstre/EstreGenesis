# local-bridge.cjs — reference 런타임 버그 2건 (평탄 레이아웃 일반화 잔재)

- **파일**: `constellation/reference/runtime/local-bridge.cjs`
- **교차참조**: `constellation/reference/runtime/server.cjs` (이미 올바름 — Bug 2 참조)
- **발견**: reference 런타임을 문서화된 평탄 `reference/runtime/` 레이아웃으로 배치하던 다운스트림 어댑터
- **확인**: upstream master, `node --check` 재현 (2026-05-30)
- **A2A 브릿지 계약 영향**: 없음 — 두 수정 모두 주석 1줄 + 로컬 파일 경로라 §2 불변 와이어 인터페이스와 무관

---

## 요약

| # | 버그 | 증상 | severity |
|---|---|---|---|
| 1 | `RUN_*/TEXT_*/TOOL_*` 안의 `*/` 부분문자열이 JSDoc 블록주석을 조기 종료 | `node --check` / `require()` **실패** — 파일 전체가 로드 안 됨 | **high** |
| 2 | `state.json` 을 형제(sibling)가 아니라 `path.join(DIR, '..', 'state.json')`(부모 디렉토리)에서 로드 | `OnboardAck.modes` 가 항상 `{}` + 워커 onboard 마다 `[bridge][WARN] state.json 로드 실패` | **medium** |

둘 다 브릿지의 원래 위치 `dashboard/live/examples/ws-local-bridge.cjs`(보드 파일보다 한 단계 *아래*)의 잔재예요. 평탄 `reference/runtime/` 레이아웃(`local-bridge.cjs`·`server.cjs`·`state.json` 이 형제)으로 일반화될 때 `self-wake-watcher.sh` 의 작업 디렉토리는 정정됐지만, `local-bridge.cjs` 의 이 두 지점은 누락됐습니다.

---

## Bug 1 — JSDoc 블록주석 조기 종료 (high)

### 위치
헤더 JSDoc 은 line 3 `/**` 로 시작, 문제 줄은 **29**:

```js
 * ▣ Envelope CUSTOM-wrap convention:
 *   application 메시지 = {type:'CUSTOM', name, value}. transport framing(HELLO/RUN_*/TEXT_*/TOOL_*) = bare.
 *   본 브릿지는 inbound 에서 `type==='CUSTOM'` 만 inbox 에 적재하고(서버→보드 전용 CUSTOM 제외),
```

### 근본 원인
`RUN_*/` 안에 `*/`(별표 바로 뒤 슬래시)가 들어있어요. `/* … */` 블록주석에서 이 `*/` 가 **주석을 line 29 에서 조기 종료**합니다. 그 뒤 텍스트가 소스 코드로 파싱되고, `/TEXT_*/TOOL_*) = bare. …` 가 떠도는 정규식 리터럴로 읽혀 다음 오류가 납니다:

```
local-bridge.cjs:29
 *   application 메시지 = {type:'CUSTOM', name, value}. transport framing(HELLO/RUN_*/TEXT_*/TOOL_*) = bare.
                                                                                         ^
SyntaxError: Invalid regular expression: missing /
```

### 재현
```sh
node --check constellation/reference/runtime/local-bridge.cjs
# → 위 SyntaxError. 파일을 로드/require 자체가 불가.
```

### 수정
주석만, 동작 불변: `/` 구분자를 ` · `(가운뎃점)으로 바꿔 `*/` 인접을 제거. (`RUN_* / TEXT_*` 처럼 공백을 끼워도 됨 — 핵심은 주석 안에 literal `*/` 가 남지 않게 하는 것.)

```js
 *   application 메시지 = {type:'CUSTOM', name, value}. transport framing(HELLO · RUN_* · TEXT_* · TOOL_*) = bare.
```

---

## Bug 2 — `state.json` 을 잘못된 디렉토리에서 로드 (medium)

### 위치
`AgentHello` → `OnboardAck` 핸들러 내부. `DIR` 은 line 58 `const DIR = __dirname;`. 문제 줄은 **118**:

```js
    let modes = {};
    try {
      const sp = path.join(DIR, '..', 'state.json');
      delete require.cache[require.resolve(sp)];
      modes = (require(sp).modes) || {};
    } catch {
      console.warn('[bridge][WARN] state.json 로드 실패 — OnboardAck.modes 빈 객체로 회신.');
    }
```

### 근본 원인
평탄 `reference/runtime/` 레이아웃에서 `state.json` 은 `local-bridge.cjs` 의 **형제**예요(한 단계 위가 아님). `server.cjs` 는 line 27 에서 이미 올바르게 인코딩돼 있습니다:

```js
const STATE = path.join(DIR, 'state.json');   // server.cjs — 형제, 올바름
```

`local-bridge.cjs` 의 `path.join(DIR, '..', 'state.json')` 는 부모 디렉토리를 가리켜 `require(sp)` 가 `MODULE_NOT_FOUND` 를 던지고, `catch` 가 발동해 **모든** `OnboardAck` 이 `modes: {}` 로 나갑니다. `'..'` 는 원래 `examples/` 하위 위치에서만 맞고, 평탄 레이아웃 일반화 때(`self-wake-watcher.sh` 의 `cd` 처럼) 갱신되지 않았어요.

### 재현
런타임을 평탄하게 배치(state.json 을 브릿지 옆에) 후 에이전트 접속, `AgentHello` 전송:
```
[bridge][WARN] state.json 로드 실패 — OnboardAck.modes 빈 객체로 회신.
# OnboardAck.value.modes === {}  (워커가 liveBoard/wsRealtime/autopilot/newAgentAutoJoin 모드를 못 받음)
```

### 수정
`server.cjs` 와 일치 — 형제를 로드:

```js
      const sp = path.join(DIR, 'state.json');   // 평탄 레이아웃: bridge·state.json 동일 DIR
```

수정 후 `OnboardAck.modes` 가 보드의 실제 모드(`{liveBoard, wsRealtime, autopilot, newAgentAutoJoin, …}`)로 해소됩니다.

---

## 통합 패치 (바로 적용 가능)

```diff
--- a/constellation/reference/runtime/local-bridge.cjs
+++ b/constellation/reference/runtime/local-bridge.cjs
@@ -28,3 +28,3 @@
  * ▣ Envelope CUSTOM-wrap convention:
- *   application 메시지 = {type:'CUSTOM', name, value}. transport framing(HELLO/RUN_*/TEXT_*/TOOL_*) = bare.
+ *   application 메시지 = {type:'CUSTOM', name, value}. transport framing(HELLO · RUN_* · TEXT_* · TOOL_*) = bare.
  *   본 브릿지는 inbound 에서 `type==='CUSTOM'` 만 inbox 에 적재하고(서버→보드 전용 CUSTOM 제외),
@@ -116,5 +116,5 @@
     let modes = {};
     try {
-      const sp = path.join(DIR, '..', 'state.json');
+      const sp = path.join(DIR, 'state.json');
       delete require.cache[require.resolve(sp)];
       modes = (require(sp).modes) || {};
```

## 검증 (수정 후)
```sh
node --check constellation/reference/runtime/local-bridge.cjs   # → OK (Bug 1)
# modes 로드 (Bug 2): require(path.join(DIR,'state.json')).modes 가 보드 modes 객체로 해소
```

## 범위 / 영향
`reference/runtime/` 를 그대로 복사하는 모든 어댑터가 Bug 1 을 즉시(브릿지 로드 불가), Bug 2 를 조용히(워커가 빈 modes 로 onboard) 겪어요. 통합 패치를 reference master 에 반영 권장. 선택 강화: reference 자체 CI 에 `node --check` 스모크 한 줄을 넣어 로드 불가 런타임 master 가 다시 ship 되지 않게.

# local-bridge.cjs — two reference-runtime bugs (flat-layout generalization residue)

- **File**: `constellation/reference/runtime/local-bridge.cjs`
- **Cross-reference**: `constellation/reference/runtime/server.cjs` (already correct — see Bug 2)
- **Found by**: a downstream adopter placing the reference runtime into the documented flat `reference/runtime/` layout
- **Confirmed on**: upstream master, `node --check` repro (2026-05-30)
- **A2A bridge contract impact**: none — both fixes are a comment and a local file path, neither part of the §2 invariant wire interface

---

## Summary

| # | bug | symptom | severity |
|---|---|---|---|
| 1 | JSDoc block comment closed early by a `*/` substring inside `RUN_*/TEXT_*/TOOL_*` | `node --check` / `require()` **fails** — the entire file does not load | **high** |
| 2 | `state.json` loaded from `path.join(DIR, '..', 'state.json')` (parent dir) instead of the sibling | `OnboardAck.modes` is always `{}` + `[bridge][WARN] state.json 로드 실패` on every worker onboard | **medium** |

Both are residue from the bridge's original `dashboard/live/examples/ws-local-bridge.cjs` location (one directory *below* the board files). When generalized into the flat `reference/runtime/` layout (where `local-bridge.cjs`, `server.cjs`, and `state.json` are siblings), the `self-wake-watcher.sh` working-dir was corrected but these two points in `local-bridge.cjs` were missed.

---

## Bug 1 — JSDoc block comment premature close (high)

### Location
Header JSDoc opened with `/**` at line 3; the offending line is **29**:

```js
 * ▣ Envelope CUSTOM-wrap convention:
 *   application 메시지 = {type:'CUSTOM', name, value}. transport framing(HELLO/RUN_*/TEXT_*/TOOL_*) = bare.
 *   본 브릿지는 inbound 에서 `type==='CUSTOM'` 만 inbox 에 적재하고(서버→보드 전용 CUSTOM 제외),
```

### Root cause
The substring `*/` appears inside `RUN_*/` (an asterisk immediately followed by a slash). In a `/* … */` block comment that `*/` **closes the comment early**, at line 29. Everything after it is then parsed as source code, and `/TEXT_*/TOOL_*) = bare. …` is read as a stray regular-expression literal, producing:

```
local-bridge.cjs:29
 *   application 메시지 = {type:'CUSTOM', name, value}. transport framing(HELLO/RUN_*/TEXT_*/TOOL_*) = bare.
                                                                                         ^
SyntaxError: Invalid regular expression: missing /
```

### Reproduction
```sh
node --check constellation/reference/runtime/local-bridge.cjs
# → SyntaxError (above). The file cannot be loaded or required at all.
```

### Fix
Comment-only, behavior-identical: remove every `*/` adjacency by replacing the `/` separators with ` · ` (middot). (Any non-adjacent form works too, e.g. `RUN_* / TEXT_*` with spaces — the requirement is simply that no literal `*/` survive in the comment.)

```js
 *   application 메시지 = {type:'CUSTOM', name, value}. transport framing(HELLO · RUN_* · TEXT_* · TOOL_*) = bare.
```

---

## Bug 2 — `state.json` loaded from the wrong directory (medium)

### Location
Inside the `AgentHello` → `OnboardAck` handler. `DIR` is defined at line 58 as `const DIR = __dirname;`. The offending line is **118**:

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

### Root cause
In the flat `reference/runtime/` layout, `state.json` is a **sibling** of `local-bridge.cjs`, not one directory up. `server.cjs` already encodes this correctly at line 27:

```js
const STATE = path.join(DIR, 'state.json');   // server.cjs — sibling, correct
```

`local-bridge.cjs`'s `path.join(DIR, '..', 'state.json')` points at the parent directory, so `require(sp)` throws `MODULE_NOT_FOUND`, the `catch` fires, and **every** `OnboardAck` is sent with `modes: {}`. The `'..'` is correct only for the original `examples/`-subdir location; it was not updated during the flat-layout generalization (the way `self-wake-watcher.sh`'s `cd` was).

### Reproduction
Place the runtime flat (state.json beside the bridge), connect an agent, send `AgentHello`:
```
[bridge][WARN] state.json 로드 실패 — OnboardAck.modes 빈 객체로 회신.
# OnboardAck.value.modes === {}  (worker never learns liveBoard/wsRealtime/autopilot/newAgentAutoJoin)
```

### Fix
Match `server.cjs` — load the sibling:

```js
      const sp = path.join(DIR, 'state.json');   // flat layout: bridge and state.json share DIR
```

After the fix, `OnboardAck.modes` resolves to the board's real modes (`{liveBoard, wsRealtime, autopilot, newAgentAutoJoin, …}`).

---

## Combined patch (ready to apply)

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

## Verification (post-fix)
```sh
node --check constellation/reference/runtime/local-bridge.cjs   # → OK (Bug 1)
# modes load (Bug 2): require(path.join(DIR,'state.json')).modes resolves to the board modes object
```

## Scope / impact
Any adopter that copies `reference/runtime/` verbatim hits Bug 1 immediately (the bridge does not load) and Bug 2 silently (workers onboard with empty modes). Recommend folding the combined patch into the reference master. Optional hardening: a small `node --check` smoke step in the reference's own CI so a non-loading runtime master cannot ship again.

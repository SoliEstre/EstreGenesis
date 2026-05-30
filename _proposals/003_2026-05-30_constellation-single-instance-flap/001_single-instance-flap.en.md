# Constellation single-instance flap — duplicate same-agentId bridges

- **Components**: `constellation/reference/runtime/local-bridge.cjs` (fix applied), `server.cjs` (proposed), launchers + recovery docs (proposed)
- **Found by**: a downstream adopter running an extended live-board session with two external interruptions
- **Severity**: **high** — main connection unusable; board + inbox flooded
- **A2A bridge contract impact**: none — lockfile guard is process-local; server flap-dampening is additive to `register(HELLO)`

---

## Incident

A live board (port 27878) ran a long multi-agent A/B experiment. Two external interruptions (a rate-limit → user account switch, then an IDE restart) forced runtime re-launches. Afterward the **main (`main-agent`) connection flapped**: the bridge log showed `connected → closed; reconnect 500 ms` repeating forever, and the board's realtime channel (cap 200) + the agent inbox (≈2,580 lines) filled with `ServerNotice/Status "bridge online"` noise. The board was unusable; even after a browser refresh the recorded noise persisted (it lives in per-channel history, not just the client view).

A process audit found **12 live `local-bridge.cjs` processes** and multiple `server.cjs` instances.

## Root cause

The reference runtime has **no single-instance protection**, and three facts compound:

1. **Re-launch without replacing the prior.** Each interruption prompted a fresh `local-bridge.cjs` (and sometimes `server.cjs`) launch. Nothing kills or refuses the prior instance.
2. **Orphan survival across IDE restart.** Background runtime processes are OS-level and **survive an IDE restart**, but the harness loses task-tracking for them — so they become orphans that can't be stopped through the normal task API, only by OS-level process kill.
3. **Same-agentId flap.** When ≥2 bridges share one `agentId`, the server's `register(HELLO)` — which **closes the prior connection for that agentId on every new HELLO** — plus each bridge's **auto-reconnect (backoff 500ms→8s)** produce an **infinite flap**:

   ```
   bridge A HELLO → server closes B's conn → B reconnects → B HELLO → server closes A's conn → A reconnects → A HELLO → …
   ```

   Every cycle emits `ServerNotice{kind:online}` (and the bridge's startup `Status`), which the server **records per-channel** (ring cap 200) and **broadcasts to boards**. So the board realtime panel + the inbox flood, and the main connection is never stable.

## Reproduction

```sh
# server already running on :27878
WS_AGENT_ID=main-agent node local-bridge.cjs &   # bridge A
WS_AGENT_ID=main-agent node local-bridge.cjs &   # bridge B (same agentId)
# → both logs: "connected — HELLO as main-agent" then "closed; reconnect in 500 ms", forever.
# → ServerNotice flood in the agent inbox + per-channel history.
```

---

## Fix 1 — single-instance lockfile guard in `local-bridge.cjs`  ✅ APPLIED (absorbed this commit)

On startup, take a PID lockfile per `agentId`; if a prior **live** process holds it, terminate it first (self-healing), then claim the lock; release on exit. A stale lock (dead PID) self-heals because `process.kill(pid, 0)` throws for a non-existent process.

```js
// inserted after the module consts (DIR / AGENT_ID / fs / path already defined), before `let ws = null`
const LOCK = path.join(DIR, '.' + String(AGENT_ID).replace(/[^\w.-]/g, '_') + '-bridge.lock');
(function singleInstanceGuard() {
  try {
    if (fs.existsSync(LOCK)) {
      const prev = parseInt(String(fs.readFileSync(LOCK, 'utf8')).trim(), 10);
      if (prev && prev !== process.pid) {
        let alive = false;
        try { process.kill(prev, 0); alive = true; } catch {}   // signal 0 = existence check
        if (alive) {
          console.warn('[bridge][WARN] prior bridge PID ' + prev + ' for agentId=' + AGENT_ID + ' alive — terminating to prevent duplicate flap.');
          try { process.kill(prev); } catch {}
        }
      }
    }
    fs.writeFileSync(LOCK, String(process.pid));
  } catch (e) { console.warn('[bridge][WARN] single-instance lock failed (ignored):', String((e && e.message) || e)); }
})();
function releaseLock() { try { if (parseInt(String(fs.readFileSync(LOCK, 'utf8')).trim(), 10) === process.pid) fs.unlinkSync(LOCK); } catch {} }
process.on('exit', releaseLock);
```

- **The lockfile MUST be gitignored** (`.\*-bridge.lock`).
- Optional policy toggle: instead of terminating the prior, *refuse to start* with a clear message (let the operator decide). Self-healing terminate is the default here because it survives the orphan case automatically.
- The same guard pattern applies to `server.cjs` (lock on `PORT`), `watchdog.cjs`, and the self-wake watcher.

`node --check` PASS after insertion.

## Fix 2 — server-side flap dampening in `register(HELLO)`  (proposed)

The server currently closes the prior conn silently on every same-agentId HELLO, which *fuels* the flap. Add churn detection: track recent HELLO timestamps per `agentId`; if ≥N HELLOs arrive within M seconds (e.g., 5 in 10s), log a `flap` WARN and apply a short cooldown / reject the newcomer with a `ServerNotice{kind:'flap-rejected'}` instead of closing the incumbent. This makes a duplicate visible and breaks the infinite loop even if Fix 1 is absent.

## Fix 3 — launcher idempotency  (proposed)

`launch-*.ps1` should **replace prior same-role instances** before launching (check the lockfile / kill by lock PID), so an operator re-running a launcher never stacks duplicates.

## Fix 4 — restart-orphan handling in the recovery procedure  (proposed)

Document that runtime processes **survive IDE restart as orphans**. Ship a `stop-all` / `status` helper (kill by lockfile + port; precise `Name=node.exe` + script-name filter — a broad `*constellation*` command-line match also catches shell wrappers and is dangerous). The recovery flow must **kill prior instances before relaunching**.

## Fix 5 — channel-history noise cleanup  (note)

A flap floods the per-channel history (ring cap 200) and the inbox. Operators need a clean way to purge a polluted channel: the existing `CloseChannel{value:{agentId}}` (board → server) deletes the channel file + memory + notifies boards. Document this as the post-incident cleanup step (the adopter used it to clear the polluted `main-agent` channel).

---

## Scope / impact
Any adopter running the live board across restarts or re-launches will eventually stack duplicate same-agentId bridges and hit the flap. Fix 1 (shipped) prevents it at the most common layer; Fixes 2–4 add defense-in-depth; Fix 5 is the cleanup runbook. Recommend folding the lockfile pattern into `server.cjs`/`watchdog`/watcher as well, and adding a CI `node --check` on the reference runtime.

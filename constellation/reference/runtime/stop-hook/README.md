# Claude Code Stop hook — pre-send-probe + watcher rearm

**Status**: configuration artifact, project-scope, gitignored under `/assets/` per `.gitignore`.

**Purpose**: codifies §13.16.10 v2.5.2 extension (cycle-end probe + watcher rearm) at the Claude Code harness level — every turn-close automatically runs the probe + rearm so the agent does not need to remember the discipline volitionally.

## Recommended config snippet — `.claude/settings.local.json` (project-scope)

The project-scope `.claude/settings.local.json` is gitignored. Add the `hooks.Stop` entry alongside any existing `permissions` block:

```json
{
  "permissions": {
    "allow": [
      "Bash(git push *)"
    ]
  },
  "hooks": {
    "Stop": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "node \"c:/Dev/EstreGenesis/assets/scripts/pre-send-probe.cjs\" --rearm"
          }
        ]
      }
    ]
  }
}
```

Apply via the `/config` command or the `update-config` skill — do NOT hand-edit if the schema validation in the harness requires the structured form.

### env-var form (v2.5.8) — share one script across environments

The probe script (`assets/scripts/pre-send-probe.cjs`) supports env-var overrides so a single script file works across EG, main-upstream, Hermes, and downstream adopters without forking. Set any of these before the script runs:

| env var | default | purpose |
|---|---|---|
| `INBOX_PATH` | `<repo>/assets/collab/inbox.log` | path to the inbox file |
| `CURSOR_FILE_PATH` | `<repo>/assets/collab/.last-surfaced-cursor` | path to the cursor file |
| `WATCHER_SCRIPT` | `<repo>/assets/scripts/watcher-rearm.cjs` | path to the watcher fallback script (skipped if absent) |
| `LAST_SURFACED_CURSOR` | (cursor file content) | override the cursor value directly (existing) |

Example for an adopter whose paths differ — set the env vars inside the Stop hook's command:

```json
{
  "hooks": {
    "Stop": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "INBOX_PATH=./examples/ws-inbox.jsonl CURSOR_FILE_PATH=./examples/.ws-inbox-cursor node \"<repo>/assets/scripts/pre-send-probe.cjs\" --rearm"
          }
        ]
      }
    ]
  }
}
```

With env-var form, no fork is required — every environment uses the same `pre-send-probe.cjs` script; only the env vars in the hook command differ.

### Hardening (v2.5.8)

- **alive gate (spawn-leak prevention)**: the script's `spawnWatcher` checks whether a watcher process matching the script's basename is already alive via `pgrep -f` (POSIX) or `tasklist` (Windows). If alive → skip spawn. If neither pgrep nor tasklist is available → skip spawn ("agent-side rearm is canonical"). Without this gate, every turn-close would stack a fresh background watcher.
- **cursor advance on meaningful in REARM mode (infinite-loop prevention)**: when the cycle-end probe (`--rearm`) finds meaningful inbound, the script still ADVANCES the cursor before exiting 2. Rationale: without advance, the next turn-close re-detects the SAME meaningful inbound and the exit-2 chain repeats indefinitely. With advance, the meaningful is logged once (stderr → agent sees on next turn's input surface), and subsequent probes start clean. The agent's turn-start cursor-tail probe (§13.16.6 element 1) is the canonical inspection point — Stop hook's job is LOG + advance, not perpetual block. (Pre-send mode unchanged — that mode's exit 2 is meant to abort the in-flight emit; the caller surfaces + decides + advances after emit.)

## What the hook does

1. **Read current inbox.log cursor** — from `assets/collab/.last-surfaced-cursor` (or `LAST_SURFACED_CURSOR` env var).
2. **Probe meaningful inbound** since cursor — using the §13.16.9 v2.5.2 4-group classification (A2A-intent allowlist only; transport/liveness/handshake/notice/board-directed UX residual all filtered out).
3. **If meaningful found**: log details to stderr (the Stop hook's output is the next-turn agent's input surface — the agent sees the probe result at next turn-start).
4. **Spawn fresh background watcher** if no alive watcher remains (best-effort — looks for `assets/scripts/watcher-rearm.cjs`; if absent, the agent-side rearm remains canonical).
5. **Advance cursor** to current inbox total on clean cycle-end (probe result clean).

## Why project-scope, not user-global

The user-global `~/.claude/settings.json` would apply the hook to every project — undesirable when the hook's path is EG-specific (`c:/Dev/EstreGenesis/assets/scripts/`). The project-scope `.claude/settings.local.json` scopes the hook to this repo only.

## Composition with §13.16.6 / §13.16.10

This hook is the harness-level mechanization of:

- **§13.16.6 element 1** — turn-end cursor-tail probe (the hook runs the probe).
- **§13.16.6 element 2** — unconditional watcher rearm (the hook spawns the watcher fallback).
- **§13.16.10 v2.5.2 extension** — cycle-end probe + watcher rearm (the hook fires at turn-close, which is exactly the cycle-end emit point the v2.5.2 extension targets).

The hook does NOT replace the agent-side discipline — the agent should still apply the §13.16.10 outbound-A2A pre-send probe (different trigger: each outbound emit, not turn-close). The Stop hook covers the turn-close trigger that the agent's outbound-emit-trigger probe does not.

## Verification

After applying the config:

1. Trigger a turn-close in Claude Code.
2. Inspect the Stop hook log (harness-dependent location) for the `[probe]` lines.
3. Confirm a watcher spawned (if `watcher-rearm.cjs` exists) or the "skip spawn; agent-side rearm is canonical" line otherwise.
4. Confirm `assets/collab/.last-surfaced-cursor` advances to the current `wc -l inbox.log` count.

## Provenance

Codified per `feedback_pre_send_inbound_check.md` cycle-end probe section + `Constellation.md §13.16.10` v2.5.2 cycle-end extension.

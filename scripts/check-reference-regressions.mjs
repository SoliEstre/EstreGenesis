#!/usr/bin/env node
// scripts/check-reference-regressions.mjs — pre-commit regression guard for proposal 002/004 fixes
//
// Drivers:
//   - _proposals/002 Bug 2: bridge state.json path must resolve to the sibling, not the parent dir.
//     A rewrite that copies the bridge source from a pre-flat layout silently regresses this.
//   - _proposals/004 #2: bridge INBOX/OUTBOX default must match self-wake-watcher convention
//     (else bridge writes one file, watcher polls another, inbound never wakes the next turn).
//
// Both are *functional* regressions the rewrite-from-old-snapshot pattern can silently re-introduce.
// Static-pattern check on the reference source — no require() of the bridge module (it would attempt
// a WS connection on load).

import fs from 'node:fs';

const BRIDGE = 'constellation/reference/runtime/local-bridge.cjs';

let bridge;
try {
  bridge = fs.readFileSync(BRIDGE, 'utf8');
} catch {
  // Reference removed or layout changed — silently pass; nothing to guard.
  process.exit(0);
}

const failures = [];

// (proposal 002 Bug 2 / 004 #1) — bridge state.json must resolve to a sibling in the flat reference/runtime layout
if (/path\.join\(\s*DIR\s*,\s*['"]\.\.['"]\s*,\s*['"]state\.json['"]/.test(bridge)) {
  failures.push(`${BRIDGE}: state.json resolves to parent dir (proposal 002 Bug 2 / 004 #1). Use path.join(DIR, 'state.json') in the flat reference/runtime layout.`);
}

// (proposal 004 #2) — bridge INBOX default must be 'inbox.jsonl' (matches self-wake-watcher convention)
if (/['"]ws-inbox\.jsonl['"]/.test(bridge)) {
  failures.push(`${BRIDGE}: INBOX default uses 'ws-inbox.jsonl' (legacy, proposal 004 #2). Use path.join(DIR, 'inbox.jsonl') so the bridge file matches the watcher's polled file — otherwise inbound never wakes the next turn.`);
}
if (!/path\.join\(\s*DIR\s*,\s*['"]inbox\.jsonl['"]\s*\)/.test(bridge)) {
  failures.push(`${BRIDGE}: INBOX default missing canonical form path.join(DIR, 'inbox.jsonl') (proposal 004 #2 forward-guard).`);
}

// Symmetric OUTBOX check
if (/['"]ws-outbox\.jsonl['"]/.test(bridge)) {
  failures.push(`${BRIDGE}: OUTBOX default uses 'ws-outbox.jsonl' (legacy). Use path.join(DIR, 'outbox.jsonl').`);
}
if (!/path\.join\(\s*DIR\s*,\s*['"]outbox\.jsonl['"]\s*\)/.test(bridge)) {
  failures.push(`${BRIDGE}: OUTBOX default missing canonical form path.join(DIR, 'outbox.jsonl').`);
}

if (failures.length) {
  console.error('[check-reference-regressions] FAILED:');
  for (const f of failures) console.error('  ' + f);
  console.error('[check-reference-regressions] Commit blocked. See _proposals/002 + _proposals/004 for context.');
  process.exit(1);
}

process.exit(0);

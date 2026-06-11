#!/usr/bin/env node
// reload-handoff.cjs — SessionStart(matcher:"compact") hook reference impl (Constellation §13.16.6 / §13.21).
// Prints the compact-handoff file to stdout; Claude Code injects SessionStart hook stdout into the
// fresh context, so the standing-card procedure details + environment snapshot survive compaction.
//
// env: HANDOFF_PATH (default: <cwd>/.agent/compact-handoff.md)
//
// settings.json:
//   "SessionStart": [{ "matcher": "compact", "hooks": [{ "type": "command",
//     "command": "node <path>/reload-handoff.cjs" }] }]
'use strict';
const fs = require('fs');
const path = require('path');
const HANDOFF = process.env.HANDOFF_PATH || path.join(process.cwd(), '.agent', 'compact-handoff.md');
try {
  process.stdout.write(`[post-compact reload] ${HANDOFF}\n\n` + fs.readFileSync(HANDOFF, 'utf8'));
} catch {
  process.stdout.write(`(no compact-handoff at ${HANDOFF} — nothing to reload)\n`);
}

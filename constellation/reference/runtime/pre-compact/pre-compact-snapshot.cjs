#!/usr/bin/env node
// pre-compact-snapshot.cjs — PreCompact hook reference impl (Constellation §13.16.6 element 6 / §13.21 mechanization).
//
// Compaction fires outside agent control; in-memory plans do not survive it. This hook materializes
// the ENVIRONMENT half of the handoff deterministically just before compaction — git state, dirty
// files, latest tag — into a handoff file whose "standing card" (procedure details the summarizer
// tends to drop: env vars, call conventions, routing rules) is maintained by the model itself
// (e.g. a /before-compact skill). A SessionStart(matcher:"compact") hook re-injects the whole file.
//
// env:
//   HANDOFF_PATH      handoff file (default: <cwd>/.agent/compact-handoff.md)
//   WORKSPACE_ROOT    primary git repo root (default: cwd)
//   SECONDARY_REPO    optional second repo to snapshot (e.g. an inner public repo)
//   TRACK_DIR         optional dir whose file list is recorded as "active track docs"
//
// settings.json:
//   "PreCompact": [{ "matcher": "*", "hooks": [{ "type": "command",
//     "command": "node <path>/pre-compact-snapshot.cjs", "timeout": 15 }] }]
'use strict';
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = process.env.WORKSPACE_ROOT || process.cwd();
const HANDOFF = process.env.HANDOFF_PATH || path.join(ROOT, '.agent', 'compact-handoff.md');
const SECONDARY = process.env.SECONDARY_REPO || null;
const TRACK_DIR = process.env.TRACK_DIR || null;
const BEGIN = '<!-- AUTO-SNAPSHOT BEGIN (pre-compact-snapshot.cjs replaces this block — do not hand-edit) -->';
const END = '<!-- AUTO-SNAPSHOT END -->';

function sh(cmd, cwd) {
  try { return execSync(cmd, { cwd: cwd || ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); }
  catch { return '(unavailable)'; }
}

const lines = [BEGIN, `- snapshot: ${new Date().toISOString()}`];
lines.push(`- HEAD: ${sh('git log --oneline -1')}`);
lines.push(`- dirty: ${sh('git status --porcelain | head -5') || '(clean)'}`);
lines.push(`- latest tag: ${sh('git describe --tags --abbrev=0')}`);
if (SECONDARY) {
  lines.push(`- secondary HEAD: ${sh('git log --oneline -1', SECONDARY)}`);
  lines.push(`- secondary dirty: ${sh('git status --porcelain | head -5', SECONDARY) || '(clean)'}`);
  lines.push(`- secondary latest tag: ${sh('git describe --tags --abbrev=0', SECONDARY)}`);
}
if (TRACK_DIR) {
  try { lines.push(`- active track docs: ${fs.readdirSync(TRACK_DIR).join(', ')}`); } catch { /* optional */ }
}
lines.push(END);

let doc = '';
try { doc = fs.readFileSync(HANDOFF, 'utf8'); } catch { /* first run */ }
if (doc.includes(BEGIN) && doc.includes(END)) {
  doc = doc.slice(0, doc.indexOf(BEGIN)) + lines.join('\n') + doc.slice(doc.indexOf(END) + END.length);
} else {
  doc = (doc.trimEnd() + '\n\n## Auto snapshot (environment state just before compaction)\n\n' + lines.join('\n') + '\n').replace(/^\n+/, '');
}
fs.mkdirSync(path.dirname(HANDOFF), { recursive: true });
fs.writeFileSync(HANDOFF, doc, 'utf8');

// PreCompact has no additionalContext channel (the host schema reserves additionalContext for
// UserPromptSubmit/PostToolUse/Stop-family events). Re-injection after compaction is owned by a
// SessionStart(matcher:"compact") hook that re-reads this whole file — so here we just write the
// file and exit quietly. (Previously this emitted hookSpecificOutput:{hookEventName:'PreCompact'},
// which failed schema validation on every compaction and left the snapshot stale.)
process.stderr.write(`[pre-compact] environment snapshot saved: ${HANDOFF}\n`);
process.stdout.write(JSON.stringify({ suppressOutput: true }) + '\n');

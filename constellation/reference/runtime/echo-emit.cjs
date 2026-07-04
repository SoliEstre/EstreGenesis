#!/usr/bin/env node
'use strict';
/*
 * echo-emit.cjs — Constellation §13.26 echo-mode outbound mirror (reference, deps-0).
 *
 * Invoked by up to three hooks, distinguished by --phase:
 *   PreToolUse  → --phase=pretool   (mirror level only) — emit a STEP status line
 *   PostToolUse → --phase=posttool  (mirror level only) — emit a TOOL_CALL card as the tool completes
 *   Stop        → --phase=stop      (on + mirror)        — emit the turn's assistant TEXT_MESSAGE (+ thinking summary at mirror)
 *
 * Level gating (per agent, read from ECHO_MODE_FILE keyed by ECHO_AGENT_ID):
 *   off    → no-op
 *   on     → stop-phase text only
 *   mirror → + live pretool/posttool progress + a turn-end thinking summary
 *
 * Emits by appending conversation envelopes to ECHO_OUTBOX_PATH — the agent's board
 * outbox, which the WS client drains and forwards (server stores + broadcasts; the
 * dashboard renders per §13.16.12). Every append is roundtrip-validated single-line
 * JSON. Always exits 0 (a mirror must never block the agent).
 *
 * Env (deployment wires these in the hook command):
 *   ECHO_MODE_FILE   — path to the .echo-mode level marker (JSON: { "<agentId>": {level, provenance} })
 *   ECHO_AGENT_ID    — this agent's id (the marker key + emitted agentId is stamped by the WS client)
 *   ECHO_OUTBOX_PATH — the agent's board outbox (e.g. collab-self/outbox.jsonl)
 *   CLAUDE_TRANSCRIPT_PATH — fallback transcript path if the Stop hook stdin lacks transcript_path
 */
const fs = require('fs');
const path = require('path');

function arg(name) { const pre = `--${name}=`; for (const a of process.argv) { if (a === `--${name}`) return true; if (a.startsWith(pre)) return a.slice(pre.length); } return null; }
const PHASE = arg('phase') || 'stop';
const AGENT = process.env.ECHO_AGENT_ID || 'agent';
const MODE_FILE = process.env.ECHO_MODE_FILE || path.join(process.cwd(), '.echo-mode');
const OUTBOX = process.env.ECHO_OUTBOX_PATH;

function readLevel() {
  try {
    const m = JSON.parse(fs.readFileSync(MODE_FILE, 'utf8'));
    const e = m[AGENT];
    if (!e) return 'off';
    if (typeof e === 'string') return e;
    return e.level || (e.on ? 'on' : 'off');
  } catch { return 'off'; }
}
const LV = readLevel();
if (LV === 'off' || !OUTBOX) process.exit(0);
if ((PHASE === 'pretool' || PHASE === 'posttool') && LV !== 'mirror') process.exit(0);

let input = {};
try { input = JSON.parse(fs.readFileSync(0, 'utf8') || '{}'); } catch {}

function emit(obj) { try { const line = JSON.stringify(obj); JSON.parse(line); fs.appendFileSync(OUTBOX, line + '\n'); } catch (e) { process.stderr.write('[echo-emit] ' + e.message + '\n'); } }
function id() { return 'et-' + Date.now().toString(36) + '-' + Math.floor(process.hrtime()[1] % 1e6).toString(36); }

if (PHASE === 'pretool') {
  const t = input.tool_name || '';
  if (t) emit({ type: 'STEP_STARTED', stepName: '🔧 ' + t });
  process.exit(0);
}

if (PHASE === 'posttool') {
  const t = input.tool_name || '';
  const ti = input.tool_input || {};
  const argsPreview = t === 'Bash' ? (ti.command || ti.description || '')
    : (ti.file_path || ti.pattern || ti.path || ti.description || (typeof ti === 'object' ? JSON.stringify(ti) : String(ti)));
  let resultPreview = '';
  try { const r = input.tool_response; resultPreview = (typeof r === 'string' ? r : JSON.stringify(r || '')).replace(/\s+/g, ' ').slice(0, 200); } catch {}
  emit({ type: 'TOOL_CALL', toolCallId: id(), toolCallName: t, argsPreview: String(argsPreview).slice(0, 200), resultPreview, display: { status: 'done' } });
  process.exit(0);
}

// PHASE === 'stop' — extract the last assistant turn from the transcript tail
const TX = input.transcript_path || process.env.CLAUDE_TRANSCRIPT_PATH;
if (!TX || !fs.existsSync(TX)) process.exit(0);
let data = '';
try {
  const fd = fs.openSync(TX, 'r'); const st = fs.fstatSync(fd);
  const len = Math.min(st.size, 262144); const buf = Buffer.alloc(len);
  fs.readSync(fd, buf, 0, len, st.size - len); fs.closeSync(fd);
  data = buf.toString('utf8');
} catch { process.exit(0); }
const lines = data.split('\n').filter(Boolean);
const texts = [], thinks = [];
for (let i = lines.length - 1; i >= 0; i--) {
  let o; try { o = JSON.parse(lines[i]); } catch { continue; }
  if (o.type === 'user') break;                 // reached the prompt that opened this turn
  if (o.type !== 'assistant') continue;
  const c = (o.message && o.message.content) || [];
  if (Array.isArray(c)) for (const b of c) {
    if (b.type === 'text' && b.text) texts.unshift(b.text);
    else if (b.type === 'thinking' && b.thinking) thinks.unshift(b.thinking);
  }
}
const text = texts.join('\n\n').trim();
if (text) {
  const mid = id();
  emit({ type: 'TEXT_MESSAGE_START', messageId: mid, role: 'assistant' });
  emit({ type: 'TEXT_MESSAGE_CONTENT', messageId: mid, delta: text });
  emit({ type: 'TEXT_MESSAGE_END', messageId: mid });
}
if (LV === 'mirror' && thinks.length) {
  const sum = thinks.join(' ').replace(/\s+/g, ' ').trim().slice(0, 400);
  if (sum) emit({ type: 'STEP_FINISHED', stepName: '💭 ' + sum });
}
process.exit(0);

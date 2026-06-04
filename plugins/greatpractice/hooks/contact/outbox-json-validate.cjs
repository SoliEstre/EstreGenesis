#!/usr/bin/env node
// plugins/greatpractice/hooks/contact/outbox-json-validate.cjs
//
// Greatpractice v0.1.0 — Contact-type PreToolUse hook backing
// greatpractice/mezzo/outbox-json-validation.md (enforcement_level: mandatory).
//
// Fires on Write/Bash tool calls that target outbox.jsonl, validates that:
//   (1) any direct Write content is valid single-line JSON
//   (2) any Bash command targeting outbox.jsonl goes through scripts/eg_outbox_push.cjs
// Failure → exit 2 with blameless block message (voice-checked).
//
// Spec: Greatpractice.md §4.2 (hook DSL) + §6.4 (hook block voice-check)
// License: Apache-2.0

'use strict';

const PATH_HINT_REGEX = /outbox\.jsonl\b/i;
const APPROVED_HELPER_REGEX = /scripts[\/\\]eg_outbox_push\.cjs/i;

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => { data += chunk; });
    process.stdin.on('end', () => resolve(data));
    // 1s timeout safety — Claude Code hook stdin is bounded
    setTimeout(() => resolve(data), 1000);
  });
}

function isSingleLineJson(str) {
  if (typeof str !== 'string' || str.length === 0) return { ok: false, reason: 'empty content' };
  const trimmed = str.replace(/\n$/, '');
  if (trimmed.includes('\n')) return { ok: false, reason: 'multi-line content (interior newline)' };
  try {
    const parsed = JSON.parse(trimmed);
    const reStringified = JSON.stringify(parsed);
    if (reStringified !== trimmed) {
      return { ok: false, reason: 'roundtrip mismatch (whitespace or key-order drift)' };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: `JSON.parse failed: ${err.message}` };
  }
}

function blockWithMessage(reason, context) {
  // Voice-checked block message (Greatpractice.md §6.4):
  //   - no blame attribution
  //   - second-story framing (multi-causal, system-pattern)
  //   - reference the canonical entry for context
  const msg = [
    '[greatpractice/outbox-json-validation] outbox.jsonl direct append intercepted.',
    `Reason: ${reason}`,
    context ? `Detail: ${context}` : null,
    '',
    'Recommended path: use scripts/eg_outbox_push.cjs(payloadObj) for outbox emit.',
    '  - JSON.stringify(input) → appendFileSync → readback → JSON.parse → assert deep_equal',
    '  - bash HEREDOC injects trailing extras on this platform (3 silent drops observed phase_3 cycle).',
    '',
    'Reference: greatpractice/mezzo/outbox-json-validation.md',
    'Spec: Greatpractice.md §4 (Hook Mechanism) + §6 (Voice & Framing)'
  ].filter(Boolean).join('\n');
  process.stderr.write(msg + '\n');
  process.exit(2);
}

async function main() {
  let raw;
  try {
    raw = await readStdin();
  } catch (e) {
    // No stdin = not invoked as hook; pass silently
    process.exit(0);
  }
  if (!raw || raw.trim().length === 0) process.exit(0);

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch (e) {
    // Hook stdin not JSON — likely manual invocation; pass silently
    process.exit(0);
  }

  const toolName = payload.tool_name || payload.tool || '';
  const toolInput = payload.tool_input || {};

  // Only PreToolUse on Write or Bash is relevant
  if (toolName !== 'Write' && toolName !== 'Bash') process.exit(0);

  if (toolName === 'Write') {
    const filePath = toolInput.file_path || '';
    if (!PATH_HINT_REGEX.test(filePath)) process.exit(0);

    // Direct Write to outbox.jsonl — must be single-line JSON
    const content = toolInput.content || '';
    const lines = content.split('\n').filter((l) => l.length > 0);
    if (lines.length === 0) {
      blockWithMessage(
        'empty Write to outbox.jsonl',
        'Use scripts/eg_outbox_push.cjs for emit instead of empty Write.'
      );
    }
    for (let i = 0; i < lines.length; i++) {
      const r = isSingleLineJson(lines[i]);
      if (!r.ok) {
        blockWithMessage(
          `line ${i + 1} not valid single-line JSON — ${r.reason}`,
          'Direct Write tool bypasses roundtrip verification. Use scripts/eg_outbox_push.cjs.'
        );
      }
    }
    // All lines pass — but direct Write still discouraged; allow with warning
    process.stderr.write(
      '[greatpractice/outbox-json-validation] WARN: direct Write to outbox.jsonl passed JSON validation but skips roundtrip + deep_equal verification.\n' +
      '  Recommended: use scripts/eg_outbox_push.cjs for full discipline.\n'
    );
    process.exit(0);
  }

  if (toolName === 'Bash') {
    const command = toolInput.command || '';
    if (!PATH_HINT_REGEX.test(command)) process.exit(0);

    // outbox.jsonl referenced in bash — check if through approved helper
    if (APPROVED_HELPER_REGEX.test(command)) {
      // Going through eg_outbox_push.cjs — OK
      process.exit(0);
    }

    // Check for HEREDOC pattern (bash trailing-extras injection vector)
    if (/<<\s*['"]?\w*['"]?[\s\S]*outbox\.jsonl/.test(command) ||
        /outbox\.jsonl[\s\S]*<<\s*['"]?\w+/.test(command)) {
      blockWithMessage(
        'bash HEREDOC append to outbox.jsonl detected',
        'HEREDOC injects trailing extras on Windows+PowerShell environment (3 drops observed). ' +
        'Use scripts/eg_outbox_push.cjs(payloadObj) instead.'
      );
    }

    // Check for direct >> or > redirect to outbox.jsonl
    if (/>>?\s*[^\s|]*outbox\.jsonl/.test(command)) {
      blockWithMessage(
        'direct shell redirect to outbox.jsonl detected',
        'Shell redirects skip JSON.stringify + roundtrip verification. Use scripts/eg_outbox_push.cjs.'
      );
    }

    // Other reference (read-only, grep, etc) — pass
    process.exit(0);
  }

  process.exit(0);
}

main().catch((err) => {
  // Hook errors should not block tool execution silently — surface as warn
  process.stderr.write(
    `[greatpractice/outbox-json-validation] hook internal error (passing through): ${err.message}\n`
  );
  process.exit(0);
});

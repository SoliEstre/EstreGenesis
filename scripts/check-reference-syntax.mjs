#!/usr/bin/env node
// scripts/check-reference-syntax.mjs — pre-commit syntax gate for constellation/reference/runtime/*.cjs
//
// Driver: a v2.2.x reference drift (local-bridge.cjs JSDoc `*/` premature close in `RUN_*/TEXT_*/TOOL_*`)
// shipped a non-loading master.cjs — downstream adopters hit ENOENT/SyntaxError on Constellation bootstrap.
// `node --check` would have caught it pre-commit. Per _proposals/002 follow-up (option A).
//
// Constellation.md §13.15 "Reference-build syntax gate" — this script is the EG repo's local
// implementation of option A (pre-commit hook). Downstream projects copying the reference
// runtime are free to adopt option A (their own pre-commit) or option B (CI workflow) or skip;
// see the §13.15 guide.

import { execSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

const DIR = 'constellation/reference/runtime';
let files;
try {
  files = readdirSync(DIR).filter((f) => f.endsWith('.cjs'));
} catch (e) {
  // Directory missing → silently pass (a downstream may have removed the reference runtime).
  process.exit(0);
}

const failures = [];
for (const f of files) {
  const path = join(DIR, f);
  try {
    execSync(`node --check "${path}"`, { stdio: 'pipe' });
  } catch (e) {
    failures.push({ path, err: (e.stderr?.toString() || e.message || '').trim() });
  }
}

if (failures.length) {
  console.error('[check-reference-syntax] node --check FAILED:');
  for (const f of failures) {
    console.error(`  ${f.path}`);
    console.error(`    ${f.err.split('\n').slice(0, 4).join('\n    ')}`);
  }
  console.error('[check-reference-syntax] Commit blocked. Fix the syntax error or run `git commit --no-verify` only if you accept shipping a non-loading reference master.');
  process.exit(1);
}

// Silent success — keep hook output minimal.
process.exit(0);

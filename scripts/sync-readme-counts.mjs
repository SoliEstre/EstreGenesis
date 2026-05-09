#!/usr/bin/env node
// scripts/sync-readme-counts.mjs
//
// Syncs README.md tier line counts to actual seed file lengths.
//
// Usage:
//   node scripts/sync-readme-counts.mjs            Sync now (writes README.md if drifted, auto-stages)
//   node scripts/sync-readme-counts.mjs --check    Print what would change without writing
//   node scripts/sync-readme-counts.mjs --install  Install .git/hooks/pre-commit shim
//
// The committed file is this script. The pre-commit shim is local-only (.git/hooks/ is
// not tracked by git). Run --install once per clone.
//
// Bucket rule: average(EN line count, KO line count) rounded to nearest 5. Keeps
// README diffs quiet on minor edits while staying within ~3 lines of reality.

import { readFileSync, writeFileSync, chmodSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

if (process.argv.includes('--install')) {
  const hookPath = resolve(root, '.git/hooks/pre-commit');
  const shim = `#!/bin/sh\n# auto-installed by scripts/sync-readme-counts.mjs --install\nexec node scripts/sync-readme-counts.mjs\n`;
  writeFileSync(hookPath, shim);
  try { chmodSync(hookPath, 0o755); } catch { /* Windows native fs may refuse; Git for Windows / Git Bash handle execute bit on its own. */ }
  console.log('Installed pre-commit hook at .git/hooks/pre-commit');
  process.exit(0);
}

const dryRun = process.argv.includes('--check');

const seeds = {
  master:  ['AI_Native_Project_Master_Seed_Prompt.md', 'AI_Native_프로젝트_마스터_시드_프롬프트.md'],
  lite:    ['AI_Native_Project_Seed_Prompt_Lite.md',   'AI_Native_프로젝트_시드_프롬프트_Lite.md'],
  compact: ['AI_Native_Project_Seed_Prompt_Compact.md','AI_Native_프로젝트_시드_프롬프트_Compact.md'],
};

const countLines = (file) => {
  const content = readFileSync(resolve(root, file), 'utf8');
  // Trailing-newline-aware line count (file ending in "\n" counts as N lines, not N+1).
  return content.split('\n').length - (content.endsWith('\n') ? 1 : 0);
};

const bucket = (en, ko) => Math.round((en + ko) / 2 / 5) * 5;

const counts = Object.fromEntries(
  Object.entries(seeds).map(([tier, [en, ko]]) => [tier, bucket(countLines(en), countLines(ko))])
);

const readmePath = resolve(root, 'README.md');
let readme = readFileSync(readmePath, 'utf8');
const original = readme;

// 12 anchored replacements: 3 tiers × 2 places (table + file list) × 2 languages.
const replacements = [
  // EN tier table
  [/(\| \*\*Master\*\* \| ~)\d+( lines \|)/, counts.master],
  [/(\| \*\*Lite\*\* \| ~)\d+( lines \|)/, counts.lite],
  [/(\| \*\*Compact\*\* \| ~)\d+( lines \|)/, counts.compact],
  // EN file list
  [/(deepest, ~)\d+( lines\))/, counts.master],
  [/(English lite \(~)\d+( lines, self-contained\))/, counts.lite],
  [/(English compact \(~)\d+( lines, self-contained\))/, counts.compact],
  // KO tier table
  [/(\| \*\*Master\*\* \| ~)\d+(줄 \|)/, counts.master],
  [/(\| \*\*Lite\*\* \| ~)\d+(줄 \|)/, counts.lite],
  [/(\| \*\*Compact\*\* \| ~)\d+(줄 \|)/, counts.compact],
  // KO file list
  [/(가장 깊음, ~)\d+(줄\))/, counts.master],
  [/(영문 lite \(~)\d+(줄\))/, counts.lite],
  [/(영문 compact \(~)\d+(줄\))/, counts.compact],
];

const missing = [];
for (const [re, n] of replacements) {
  if (!re.test(readme)) {
    missing.push(re.source);
    continue;
  }
  readme = readme.replace(re, `$1${n}$2`);
}

if (missing.length > 0) {
  console.error('sync-readme-counts: README format may have drifted; these patterns did not match:');
  for (const m of missing) console.error('  ' + m);
  // Don't fail; warn only. The hook is non-blocking by design.
}

if (readme === original) {
  if (dryRun) console.log('sync-readme-counts: no changes needed.');
  process.exit(0);
}

if (dryRun) {
  console.log(`sync-readme-counts: README would update → master=${counts.master}, lite=${counts.lite}, compact=${counts.compact}`);
  process.exit(0);
}

writeFileSync(readmePath, readme);
console.log(`sync-readme-counts: README updated → master=${counts.master}, lite=${counts.lite}, compact=${counts.compact}`);

// Auto-stage so the change rides the current commit (pre-commit runs before staging is finalized).
try {
  execSync('git add README.md', { cwd: root, stdio: 'inherit' });
} catch (e) {
  console.error('sync-readme-counts: git add README.md failed:', e.message);
}

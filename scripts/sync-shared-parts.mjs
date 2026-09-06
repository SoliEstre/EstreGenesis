#!/usr/bin/env node
/**
 * sync-shared-parts.mjs — copy every shared part a plugin uses into that plugin, verbatim.
 *
 * Why this exists: a plugin is installed as a copy of `plugins/<name>/` alone. Anything it
 * `require()`s from outside that directory — in particular `plugins/_shared/` — is present in the
 * source checkout and absent in every installed copy, so the server works for the maintainer and
 * exits before its first JSON-RPC line for every adopter. The fix is that a plugin only ever
 * requires files inside itself; the shared parts are carried as byte-identical copies.
 *
 * A carried copy is the kind of thing that lags silently (it keeps working until it does not), so
 * the copies are not hand-maintained: this script derives them, and the maintenance checker
 * (scripts/verify-plugin-install-layout.cjs in the maintenance workspace) fails whenever a copy
 * and its source differ, or a plugin still reaches outside its own directory.
 *
 * Derivation, not a list: a part is copied next to every plugin file that does
 * `require('./<part>')` where `plugins/_shared/<part>` exists. Adding a consumer is a `require`;
 * nothing else has to be registered.
 *
 * Usage:
 *   node scripts/sync-shared-parts.mjs            # report what would change (no writes)
 *   node scripts/sync-shared-parts.mjs --write    # write the copies
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const INNER = path.join(HERE, '..');
const PLUGINS = path.join(INNER, 'plugins');
const SHARED = path.join(PLUGINS, '_shared');
const WRITE = process.argv.includes('--write');

const parts = fs.existsSync(SHARED)
  ? fs.readdirSync(SHARED).filter((f) => /\.(cjs|js|mjs|json)$/.test(f))
  : [];

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(cjs|js|mjs)$/.test(e.name)) out.push(p);
  }
  return out;
}

// `require('./name')` / `require("./name")` — only same-directory references count as a shared-part
// consumer; a `../` reference is exactly the escape this script exists to remove, and the checker
// reports those separately.
const REQUIRE_RE = /require\(\s*['"]\.\/([^'"/]+)['"]\s*\)/g;

const plan = [];
for (const e of fs.readdirSync(PLUGINS, { withFileTypes: true })) {
  if (!e.isDirectory() || e.name === '_shared') continue;
  const pluginDir = path.join(PLUGINS, e.name);
  for (const file of walk(pluginDir)) {
    const src = fs.readFileSync(file, 'utf8');
    for (const m of src.matchAll(REQUIRE_RE)) {
      const part = m[1];
      if (!parts.includes(part)) continue;
      const dest = path.join(path.dirname(file), part);
      const from = path.join(SHARED, part);
      const want = fs.readFileSync(from);
      const have = fs.existsSync(dest) ? fs.readFileSync(dest) : null;
      const state = have === null ? 'missing' : have.equals(want) ? 'in-sync' : 'stale';
      if (!plan.some((p) => p.dest === dest)) plan.push({ plugin: e.name, part, from, dest, state, consumer: path.relative(INNER, file) });
    }
  }
}

if (!plan.length) {
  console.log('shared parts: no consumers found under plugins/ (nothing to sync)');
  process.exit(0);
}

let changed = 0;
for (const p of plan) {
  const rel = path.relative(INNER, p.dest).split(path.sep).join('/');
  if (p.state === 'in-sync') { console.log(`  = ${rel}  (in sync, from ${p.consumer})`); continue; }
  if (WRITE) {
    fs.mkdirSync(path.dirname(p.dest), { recursive: true });
    fs.copyFileSync(p.from, p.dest);
    changed++;
    console.log(`  + ${rel}  (${p.state} → written)`);
  } else {
    changed++;
    console.log(`  ! ${rel}  (${p.state} — run with --write)`);
  }
}
console.log(`\n${plan.length} copy site(s) · ${changed} ${WRITE ? 'written' : 'would change'}`);
process.exit(WRITE || changed === 0 ? 0 : 1);

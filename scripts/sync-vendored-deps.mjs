#!/usr/bin/env node
/**
 * sync-vendored-deps.mjs — regenerate a plugin's vendored dependency tree from its vendor.manifest.json.
 *
 * Why this exists: plugins are distributed as a code copy with no install step, so a declared npm
 * dependency is absent in the only configuration adopters run. Where the platform provides an
 * equivalent (WebSocket client, Node >= 22) the platform part is used. Where it does not (`ajv`),
 * the part is carried in-tree — and a carried copy that is hand-maintained lags silently, which
 * looks exactly like a working tree until it does not. So the tree is GENERATED from a manifest and
 * a companion checker (scripts/verify-vendored-deps.cjs in the maintenance workspace) fails the
 * build whenever the tree and the manifest disagree.
 *
 * Usage:
 *   node scripts/sync-vendored-deps.mjs            # report what would change (no writes)
 *   node scripts/sync-vendored-deps.mjs --write    # regenerate the tree(s)
 *
 * Requires npm and network access. Maintainer tool, not a runtime path.
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const INNER = path.join(HERE, '..');
const PLUGINS = path.join(INNER, 'plugins');
const WRITE = process.argv.includes('--write');

const kb = (b) => (b / 1024).toFixed(0) + 'KB';

function findManifests() {
  const out = [];
  for (const e of fs.readdirSync(PLUGINS, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    const m = path.join(PLUGINS, e.name, 'vendor.manifest.json');
    if (fs.existsSync(m)) out.push({ plugin: e.name, manifestPath: m, manifest: JSON.parse(fs.readFileSync(m, 'utf8')) });
  }
  return out;
}

function isPruned(relPath, prune) {
  const parts = relPath.split(/[/\\]/);
  if ((prune.dirNames || []).some((d) => parts.slice(0, -1).includes(d))) return true;
  if ((prune.extensions || []).some((x) => relPath.endsWith(x))) return true;
  return false;
}

/** Copy `from` → `to`, applying the manifest prune rule. Returns {files, bytes, pruned, prunedBytes}. */
function copyPruned(from, to, prune, stats = { files: 0, bytes: 0, pruned: 0, prunedBytes: 0 }, rel = '') {
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    const src = path.join(from, e.name);
    const r = rel ? rel + '/' + e.name : e.name;
    if (e.isDirectory()) {
      if ((prune.dirNames || []).includes(e.name)) {
        const w = walk(src);
        stats.pruned += w.files; stats.prunedBytes += w.bytes;
        continue;
      }
      copyPruned(src, path.join(to, e.name), prune, stats, r);
      // A directory whose every file was pruned would otherwise ship empty.
      try { if (fs.existsSync(path.join(to, e.name)) && fs.readdirSync(path.join(to, e.name)).length === 0) fs.rmdirSync(path.join(to, e.name)); } catch { /* non-empty */ }
      continue;
    }
    if (isPruned(r, prune)) { stats.pruned++; stats.prunedBytes += fs.statSync(src).size; continue; }
    fs.mkdirSync(to, { recursive: true });
    fs.copyFileSync(src, path.join(to, e.name));
    stats.files++; stats.bytes += fs.statSync(src).size;
  }
  return stats;
}

function walk(dir, acc = { files: 0, bytes: 0 }) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else { acc.files++; acc.bytes += fs.statSync(p).size; }
  }
  return acc;
}

function licenseFileOf(dir) {
  return fs.readdirSync(dir).find((f) => /^licen[sc]e/i.test(f)) || null;
}

/**
 * Locate npm's JS entry point so it can be run with this same node binary.
 * Spawning the `npm.cmd` shim directly fails with EINVAL on current Node (batch files are refused
 * without an explicit shell, per the CVE-2024-27980 fix), and going through a shell would put the
 * version specs back through cmd.exe parsing. Running the CLI script keeps the argument array intact.
 */
function npmCliPath() {
  const bin = path.dirname(process.execPath);
  for (const c of [
    path.join(bin, 'node_modules', 'npm', 'bin', 'npm-cli.js'),
    path.join(bin, '..', 'lib', 'node_modules', 'npm', 'bin', 'npm-cli.js'),
  ]) if (fs.existsSync(c)) return c;
  return null;
}

function stage(pkgSpecs) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'eg-vendor-'));
  fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name: 'eg-vendor-stage', private: true }));
  const args = ['install', '--ignore-scripts', '--no-audit', '--no-fund', '--no-package-lock', ...pkgSpecs];
  const cli = npmCliPath();
  if (cli) execFileSync(process.execPath, [cli, ...args], { cwd: dir, stdio: ['ignore', 'pipe', 'pipe'] });
  else execFileSync('npm', args, { cwd: dir, stdio: ['ignore', 'pipe', 'pipe'], shell: true });
  return dir;
}

let problems = 0;
const notices = [];

for (const { plugin, manifest, manifestPath } of findManifests()) {
  console.log(`\n=== ${plugin} — vendored tree ===`);
  const targetRoot = path.join(PLUGINS, plugin, manifest.target);
  const specs = Object.entries(manifest.packages).map(([n, v]) => `${n}@${v}`);
  console.log(`  manifest: ${specs.join(' · ')}`);

  let stageDir;
  try { stageDir = stage(specs); }
  catch (e) {
    console.log(`  ✗ staging install failed — ${String(e.message).split('\n')[0]}`);
    problems++; continue;
  }
  const stageMods = path.join(stageDir, 'node_modules');
  const installed = fs.readdirSync(stageMods).filter((d) => !d.startsWith('.')).sort();
  const declared = Object.keys(manifest.packages).sort();

  // npm resolving a transitive package the manifest does not list means we would be shipping code
  // nobody wrote down. That is the exact silence this manifest exists to prevent — so it is an
  // error the maintainer must resolve by listing it, not something to vendor quietly.
  const extra = installed.filter((d) => !declared.includes(d));
  const missing = declared.filter((d) => !installed.includes(d));
  if (extra.length) { console.log(`  ✗ installed but not in manifest: ${extra.join(', ')} — add them to packages{} (with the resolved version) and re-run`); problems++; }
  if (missing.length) { console.log(`  ✗ in manifest but not installed: ${missing.join(', ')}`); problems++; }

  const rows = [];
  for (const name of installed) {
    const src = path.join(stageMods, name);
    const pj = JSON.parse(fs.readFileSync(path.join(src, 'package.json'), 'utf8'));
    const want = manifest.packages[name];
    if (want && pj.version !== want) { console.log(`  ✗ ${name}: manifest pins ${want}, npm resolved ${pj.version} — pin exactly`); problems++; }
    rows.push({ name, version: pj.version, license: pj.license || '(undeclared)', licenseFile: licenseFileOf(src), src });
  }
  for (const r of rows) if (!r.licenseFile) { console.log(`  ✗ ${r.name}: no license file in the package — cannot redistribute without the notice`); problems++; }

  if (problems) { fs.rmSync(stageDir, { recursive: true, force: true }); continue; }

  let total = { files: 0, bytes: 0, pruned: 0, prunedBytes: 0 };
  if (WRITE) {
    fs.rmSync(targetRoot, { recursive: true, force: true });
    fs.mkdirSync(targetRoot, { recursive: true });
  }
  for (const r of rows) {
    const dest = path.join(targetRoot, r.name);
    const s = WRITE
      ? copyPruned(r.src, dest, manifest.prune || {})
      : (() => { const w = walk(r.src); return { files: w.files, bytes: w.bytes, pruned: 0, prunedBytes: 0 }; })();
    console.log(`  ${WRITE ? 'wrote' : 'would write'} ${r.name.padEnd(22)} v${String(r.version).padEnd(8)} ${String(r.license).padEnd(13)} ${String(s.files).padStart(4)} files ${kb(s.bytes).padStart(7)}${s.pruned ? `  (pruned ${s.pruned} / ${kb(s.prunedBytes)})` : ''}`);
    for (const k of Object.keys(total)) total[k] += s[k];
  }
  console.log(`  total: ${total.files} files ${kb(total.bytes)}${total.pruned ? ` · pruned ${total.pruned} files ${kb(total.prunedBytes)}` : ''}`);

  notices.push({ plugin, rows, manifestPath });

  if (WRITE) {
    const lines = [
      '# Third-party notices — ' + plugin,
      '',
      'This plugin ships the dependency tree below **inside the repository**, at `' + manifest.target + '/`.',
      '',
      'Plugins are distributed as a code copy with no `npm install` step, so a declared dependency is',
      'absent in the only configuration adopters run. Where the platform provides an equivalent, the',
      'platform part is used instead (the WebSocket client: Node >= 22 provides a global `WebSocket`, so',
      'no copy of `ws` is carried). Where it does not, the part is carried here rather than asked of the',
      'adopter.',
      '',
      'The tree is generated — do not hand-edit it, and do not run `npm install` in place:',
      '',
      '```',
      'node scripts/sync-vendored-deps.mjs --write',
      '```',
      '',
      'Source of truth for its contents: `' + path.relative(path.join(PLUGINS, plugin), manifestPath).replace(/\\/g, '/') + '`.',
      '',
      '| Package | Version | License | Notice file |',
      '|---|---|---|---|',
      ...rows.map((r) => `| \`${r.name}\` | ${r.version} | ${r.license} | \`${manifest.target}/${r.name}/${r.licenseFile}\` |`),
      '',
      'Each package retains its own license file at the path above, as those licenses require.',
      'Files a runtime cannot load (type declarations, source maps, tests, benchmarks, CI config) are',
      'removed; every `.js` / `.json` / license file is kept, including code paths this repository never',
      'exercises — a tree pruned to the measured require-closure would break the first adopter who takes',
      'an untested path.',
      '',
    ];
    fs.writeFileSync(path.join(PLUGINS, plugin, 'THIRD-PARTY-NOTICES.md'), lines.join('\n'));
    console.log('  wrote THIRD-PARTY-NOTICES.md');
  }

  fs.rmSync(stageDir, { recursive: true, force: true });
}

if (!notices.length) console.log('\nNo plugin declares a vendor.manifest.json — nothing to do.');
if (problems) { console.log(`\nFAIL — ${problems} problem(s); nothing was written for the affected plugin.`); process.exit(1); }
console.log(WRITE ? '\nOK — trees regenerated. Commit them together with the manifest.' : '\nOK — dry run. Re-run with --write to regenerate.');

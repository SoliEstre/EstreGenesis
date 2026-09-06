#!/usr/bin/env node
'use strict';
/*
 * gen-codex-adapter.cjs — project EstreGenesis's Claude Code plugins onto the
 * OpenAI Codex customization surfaces (Agent Skills + MCP config.toml + AGENTS.md).
 *
 * North-star discipline (AGENTS §0 axis-2/axis-3): the 22 canonical SKILL.md files
 * are already valid Codex skills (name+description frontmatter). This adapter is a
 * pure LAYOUT REMAP — it does NOT copy skill content into the repo (that would be
 * the duplication the M2 dogfood warned against). It materializes skills on demand
 * into a Codex discovery path, and it (re)generates only the Codex-specific derived
 * surfaces that legitimately live here: config.toml.example + the README inventory.
 *
 * Modes:
 *   --write             (maintainer) regenerate codex/config.toml.example + the
 *                       auto-managed inventory block in codex/README.md + every
 *                       plugins/<mod>/.codex-plugin/plugin.json projection, in place.
 *   --check             (verify-nway) recompute those surfaces in memory and
 *                       assert they match what is committed; exit 1 on drift.
 *
 * Codex plugin manifest projection (.codex-plugin/plugin.json) — why it exists:
 *   Codex reads a Claude Code marketplace and .claude-plugin/plugin.json as-is, but codex-cli
 *   0.153.4 substitutes NO placeholder in an mcpServers entry (measured 2026-09-06 with a stub
 *   server that recorded its argv/cwd/env: ${CLAUDE_PLUGIN_ROOT}, ${PLUGIN_ROOT},
 *   ${CLAUDE_PLUGIN_DATA} and ${PLUGIN_DATA} all arrived verbatim, no plugin-root env var, cwd =
 *   the thread's working directory). What Codex does honor is `cwd: "."` (resolved against the
 *   installed plugin directory) with paths relative to it, and when .codex-plugin/plugin.json is
 *   present next to .claude-plugin/plugin.json Codex takes the MCP declaration from it while
 *   skills keep loading. Claude Code, conversely, ignores `cwd` and needs the absolute
 *   ${CLAUDE_PLUGIN_ROOT} form. So each plugin that declares MCP servers gets a GENERATED
 *   codex manifest: the Claude manifest with `${CLAUDE_PLUGIN_ROOT}/x` rewritten to `./x` and
 *   `cwd: "."` added. Any other placeholder is a hard error here rather than a silent pass-through.
 *   --install [--dest DIR] [--copy]
 *                       (Codex user) materialize the 22 skills into DIR
 *                       (default: $HOME/.agents/skills) as symlinks, or copies
 *                       under --copy / on Windows. Never touches the repo.
 *
 * deps-0 (node builtins only), consistent with the reference-runtime discipline.
 */
const fs = require('fs');
const path = require('path');
const os = require('os');

const REPO = path.resolve(__dirname, '..');           // inner repo root (…/EstreGenesis)
const PLUGINS = path.join(REPO, 'plugins');
const CODEX = __dirname;
const CONFIG_EXAMPLE = path.join(CODEX, 'config.toml.example');
const README = path.join(CODEX, 'README.md');
const INV_BEGIN = '<!-- BEGIN AUTO-INVENTORY (gen-codex-adapter.cjs --write) -->';
const INV_END = '<!-- END AUTO-INVENTORY -->';
const REPO_PLACEHOLDER = '__EG_REPO_ROOT__';

const NODE_BUILTINS = new Set([
  'assert', 'buffer', 'child_process', 'cluster', 'console', 'crypto', 'dgram',
  'dns', 'events', 'fs', 'http', 'http2', 'https', 'net', 'os', 'path', 'perf_hooks',
  'process', 'querystring', 'readline', 'stream', 'string_decoder', 'timers', 'tls',
  'tty', 'url', 'util', 'v8', 'vm', 'worker_threads', 'zlib',
]);

// ── discovery ────────────────────────────────────────────────────────────────
function listModules() {
  return fs.readdirSync(PLUGINS)
    .filter((d) => fs.existsSync(path.join(PLUGINS, d, '.claude-plugin', 'plugin.json')))
    .sort();
}

function parseFrontmatter(md) {
  const m = md.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return {};
  const out = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (kv) out[kv[1]] = kv[2].trim();
  }
  return out;
}

function discoverSkills() {
  const skills = [];
  for (const mod of listModules()) {
    const sdir = path.join(PLUGINS, mod, 'skills');
    if (!fs.existsSync(sdir)) continue;
    for (const name of fs.readdirSync(sdir).sort()) {
      const skillMd = path.join(sdir, name, 'SKILL.md');
      if (!fs.existsSync(skillMd)) continue;
      const fm = parseFrontmatter(fs.readFileSync(skillMd, 'utf8'));
      skills.push({
        module: mod,
        dir: name,
        name: fm.name || name,
        description: fm.description || '',
        srcRel: path.relative(REPO, path.join(sdir, name)).replace(/\\/g, '/'),
      });
    }
  }
  return skills;
}

function externalDeps(serverCjs) {
  if (!fs.existsSync(serverCjs)) return [];
  const src = fs.readFileSync(serverCjs, 'latin1');
  const deps = new Set();
  for (const m of src.matchAll(/require\((['"])([^'"]+)\1\)/g)) {
    const id = m[2];
    if (id.startsWith('.') || id.startsWith('/')) continue;
    const top = id.startsWith('@') ? id.split('/').slice(0, 2).join('/') : id.split('/')[0];
    if (!NODE_BUILTINS.has(top)) deps.add(top);
  }
  return [...deps].sort();
}

// How a non-builtin dependency is actually satisfied in an installed copy (a plugin directory alone,
// no `npm install` step): carried in-tree under the plugin's node_modules/, or optional with a
// platform fallback (declared under optionalDependencies), or — the only case that needs an install —
// neither. The projection says which, so a reader is not sent to `npm install` for a part that is
// already there.
function describeDep(mod, dep) {
  const carried = [path.join(PLUGINS, mod, 'node_modules', dep), path.join(PLUGINS, mod, 'mcp', 'node_modules', dep)]
    .some((p) => fs.existsSync(p));
  if (carried) return `${dep} (carried in-tree)`;
  const pkgPath = path.join(PLUGINS, mod, 'mcp', 'package.json');
  const pkg = fs.existsSync(pkgPath) ? JSON.parse(fs.readFileSync(pkgPath, 'utf8')) : {};
  if (pkg.optionalDependencies && pkg.optionalDependencies[dep]) return `${dep} (optional — platform built-in used when absent)`;
  return `${dep} (npm install needed)`;
}

function discoverMcp() {
  const servers = [];
  for (const mod of listModules()) {
    const pj = JSON.parse(fs.readFileSync(path.join(PLUGINS, mod, '.claude-plugin', 'plugin.json'), 'utf8'));
    const mcpBlock = pj.mcpServers || pj.mcp;      // current schema = mcpServers (legacy `mcp` fallback)
    if (!mcpBlock) continue;
    const serverCjs = path.join(PLUGINS, mod, 'mcp', 'server.cjs');
    const deps = externalDeps(serverCjs);
    servers.push({
      module: mod,
      canonical: Object.keys(mcpBlock)[0],         // e.g. constellation-mcp
      serverRel: path.relative(REPO, serverCjs).replace(/\\/g, '/'),
      deps,
      depNotes: deps.map((d) => describeDep(mod, d)),
      needsInstall: deps.filter((d) => describeDep(mod, d).endsWith('(npm install needed)')),
    });
  }
  return servers;
}

// ── Codex plugin manifest projection ─────────────────────────────────────────
const CODEX_MANIFEST_NOTE = [
  '# Generated — do not hand-edit',
  '',
  '`plugin.json` here is projected from `../.claude-plugin/plugin.json` by',
  '`node codex/gen-codex-adapter.cjs --write` (a verify-nway axis fails on drift).',
  'It exists because codex-cli 0.153.4 substitutes no placeholder in `mcpServers`, but honors',
  '`cwd: "."` relative to the installed plugin directory; Claude Code needs the absolute',
  '`${CLAUDE_PLUGIN_ROOT}` form and ignores `cwd`. Same plugin, one manifest per host.',
  '',
].join('\n');

function codexManifestDir(mod) { return path.join(PLUGINS, mod, '.codex-plugin'); }

function projectPathValue(value, where) {
  let s = String(value);
  if (s.includes('${CLAUDE_PLUGIN_ROOT}/')) s = s.split('${CLAUDE_PLUGIN_ROOT}/').join('./');
  if (s.includes('${CLAUDE_PLUGIN_ROOT}')) s = s.split('${CLAUDE_PLUGIN_ROOT}').join('.');
  if (/\$\{[A-Z_]+\}/.test(s)) {
    throw new Error(`${where}: placeholder ${s.match(/\$\{[A-Z_]+\}/)[0]} has no Codex projection (Codex substitutes nothing in mcpServers) — use a path under the plugin directory instead`);
  }
  return s;
}

// The Claude manifest, with every mcpServers path made plugin-relative and cwd pinned to the plugin dir.
function projectCodexManifest(mod) {
  const src = JSON.parse(fs.readFileSync(path.join(PLUGINS, mod, '.claude-plugin', 'plugin.json'), 'utf8'));
  const block = src.mcpServers || src.mcp;
  if (!block) return null;
  const out = JSON.parse(JSON.stringify(src));
  delete out.mcp;
  out.mcpServers = {};
  for (const [name, decl] of Object.entries(block)) {
    const where = `${mod}/.claude-plugin/plugin.json mcpServers.${name}`;
    const proj = {};
    if (decl.command != null) proj.command = projectPathValue(decl.command, where + '.command');
    if (Array.isArray(decl.args)) proj.args = decl.args.map((a) => projectPathValue(a, where + '.args'));
    if (decl.env && typeof decl.env === 'object') {
      proj.env = {};
      for (const [k, v] of Object.entries(decl.env)) proj.env[k] = projectPathValue(v, where + '.env.' + k);
    }
    proj.cwd = '.';
    out.mcpServers[name] = proj;
  }
  return JSON.stringify(out, null, 2) + '\n';
}

function discoverCodexManifests() {
  const list = [];
  for (const mod of listModules()) {
    const json = projectCodexManifest(mod);
    if (json) list.push({ module: mod, dir: codexManifestDir(mod), json });
  }
  return list;
}

// ── derived surfaces ─────────────────────────────────────────────────────────
function renderConfigExample(mcp) {
  const lines = [
    '# EstreGenesis × Codex — MCP server declarations (example).',
    '# Generated by codex/gen-codex-adapter.cjs --write. Do NOT hand-edit; edit the',
    '# generator or the source plugin manifests instead (a verify-nway axis gates drift).',
    '#',
    `# Replace ${REPO_PLACEHOLDER} with the absolute path to your EstreGenesis checkout,`,
    '# then paste the stanzas you want into ~/.codex/config.toml (global) or a trusted',
    "# project's .codex/config.toml. Each server runs from its plugin directory alone: a",
    '# dependency is either carried in-tree or replaced by a Node built-in (see codex/README.md);',
    '# a stanza says so, and only a `npm install needed` note means an install step.',
    '',
  ];
  for (const s of mcp) {
    const dep = s.needsInstall.length
      ? `  # requires: npm install (${s.needsInstall.join(', ')}) in ${path.posix.dirname(s.serverRel)}/`
      : s.deps.length ? `  # deps: ${s.depNotes.join(', ')}` : '  # deps-0';
    lines.push(`[mcp_servers.${s.module}]${dep ? '' : ''}`);
    lines.push('command = "node"');
    lines.push(`args = ["${REPO_PLACEHOLDER}/${s.serverRel}"]`);
    lines.push('startup_timeout_sec = 15');
    lines.push(dep);
    lines.push('');
  }
  return lines.join('\n').replace(/\n+$/, '\n');
}

function renderInventory(skills, mcp) {
  const byMod = {};
  for (const s of skills) (byMod[s.module] ||= []).push(s);
  const out = [];
  out.push(INV_BEGIN);
  out.push('');
  out.push(`**Skills projected: ${skills.length}** across ${Object.keys(byMod).length} modules · **MCP servers: ${mcp.length}**`);
  out.push('');
  out.push('### Agent Skills (→ `.agents/skills/<dir>/SKILL.md`)');
  out.push('');
  out.push('| Module | Skill dir | Skill name |');
  out.push('| --- | --- | --- |');
  for (const mod of Object.keys(byMod).sort()) {
    for (const s of byMod[mod]) {
      out.push(`| ${mod} | \`${s.dir}\` | ${s.name} |`);
    }
  }
  out.push('');
  out.push('### MCP servers (→ `config.toml` `[mcp_servers.*]`, or the plugin\'s generated `.codex-plugin/plugin.json` on the marketplace path)');
  out.push('');
  out.push('| Server | source | deps (as installed — plugin directory alone) | Codex manifest |');
  out.push('| --- | --- | --- | --- |');
  for (const s of mcp) {
    out.push(`| \`${s.module}\` | \`${s.serverRel}\` | ${s.deps.length ? s.depNotes.join(', ') : '— (deps-0)'} | \`plugins/${s.module}/.codex-plugin/plugin.json\` (generated: \`cwd: "."\` + plugin-relative paths) |`);
  }
  out.push('');
  out.push(INV_END);
  return out.join('\n');
}

function replaceInventoryBlock(readme, block) {
  const b = readme.indexOf(INV_BEGIN);
  const e = readme.indexOf(INV_END);
  if (b < 0 || e < 0) throw new Error('README inventory markers not found');
  return readme.slice(0, b) + block + readme.slice(e + INV_END.length);
}

// ── install (Codex user) ─────────────────────────────────────────────────────
function install(skills, dest, forceCopy) {
  fs.mkdirSync(dest, { recursive: true });
  let linked = 0, copied = 0;
  for (const s of skills) {
    const src = path.join(REPO, s.srcRel);
    const dst = path.join(dest, s.dir);
    if (fs.existsSync(dst)) fs.rmSync(dst, { recursive: true, force: true });
    if (!forceCopy && process.platform !== 'win32') {
      fs.symlinkSync(src, dst, 'dir'); linked++;
    } else {
      fs.cpSync(src, dst, { recursive: true }); copied++;
    }
  }
  console.log(`[install] ${skills.length} skills → ${dest} (${linked} symlinked, ${copied} copied)`);
  console.log('[install] point Codex at this directory (it scans $HOME/.agents/skills by default).');
}

// ── main ─────────────────────────────────────────────────────────────────────
function main() {
  const args = process.argv.slice(2);
  const mode = args.find((a) => ['--write', '--check', '--install'].includes(a));
  const skills = discoverSkills();
  const mcp = discoverMcp();

  if (mode === '--install') {
    const di = args.indexOf('--dest');
    const dest = di >= 0 ? path.resolve(args[di + 1]) : path.join(os.homedir(), '.agents', 'skills');
    install(skills, dest, args.includes('--copy'));
    return;
  }

  const cfg = renderConfigExample(mcp);
  const inv = renderInventory(skills, mcp);
  const manifests = discoverCodexManifests();

  if (mode === '--write') {
    fs.writeFileSync(CONFIG_EXAMPLE, cfg);
    const readme = fs.readFileSync(README, 'utf8');
    fs.writeFileSync(README, replaceInventoryBlock(readme, inv));
    for (const m of manifests) {
      fs.mkdirSync(m.dir, { recursive: true });
      fs.writeFileSync(path.join(m.dir, 'plugin.json'), m.json);
      fs.writeFileSync(path.join(m.dir, 'GENERATED.md'), CODEX_MANIFEST_NOTE);
    }
    console.log(`[write] config.toml.example (${mcp.length} servers) + README inventory (${skills.length} skills) + ${manifests.length} .codex-plugin/plugin.json projections regenerated.`);
    return;
  }

  if (mode === '--check') {
    const problems = [];
    const curCfg = fs.existsSync(CONFIG_EXAMPLE) ? fs.readFileSync(CONFIG_EXAMPLE, 'utf8') : '(missing)';
    if (curCfg !== cfg) problems.push('codex/config.toml.example out of date — run `node codex/gen-codex-adapter.cjs --write`');
    const readme = fs.existsSync(README) ? fs.readFileSync(README, 'utf8') : '';
    if (!readme.includes(inv)) problems.push('codex/README.md inventory block out of date — run `node codex/gen-codex-adapter.cjs --write`');
    for (const m of manifests) {
      const p = path.join(m.dir, 'plugin.json');
      const cur = fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '(missing)';
      if (cur !== m.json) problems.push(`plugins/${m.module}/.codex-plugin/plugin.json ${cur === '(missing)' ? 'missing' : 'out of date'} — run \`node codex/gen-codex-adapter.cjs --write\``);
    }
    // a codex manifest with no Claude source (or in a plugin without MCP) is a stray hand copy
    for (const mod of listModules()) {
      if (fs.existsSync(path.join(codexManifestDir(mod), 'plugin.json')) && !manifests.some((m) => m.module === mod)) {
        problems.push(`plugins/${mod}/.codex-plugin/plugin.json exists but the plugin declares no MCP server — remove it (the projection only exists where paths need translating)`);
      }
    }
    if (problems.length) { problems.forEach((p) => console.error('DRIFT ' + p)); process.exit(1); }
    console.log(`[check] codex adapter in sync (${skills.length} skills, ${mcp.length} MCP servers, ${manifests.length} codex manifests).`);
    return;
  }

  // no mode → summary
  console.log('gen-codex-adapter — project EG plugins onto Codex surfaces.');
  console.log(`  discovered: ${skills.length} skills, ${mcp.length} MCP servers`);
  console.log('  modes: --write (regen committed surfaces) · --check (drift gate) · --install [--dest DIR] [--copy]');
}

main();

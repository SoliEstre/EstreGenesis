#!/usr/bin/env node
'use strict';
/**
 * Corporate toggle resolver — the ONLY reader of the toggle layers.
 *
 * Corporate.md §5 states the contract this file implements:
 *   §5.1  precedence:  role > group > organization > harness default
 *   §5.2  many layers, exactly one resolver — nothing else reads an individual layer
 *   §5.3  consumers (and board declarations) see resolved values only
 *   §5.4  IDENTITY INVARIANT — with no roster present, the resolved value of every
 *         toggle equals the organization layer verbatim, so a project that has not
 *         adopted Corporate behaves bit-identically to one where it does not exist.
 *         §5.4 makes this a test obligation, not a claim: `--selftest` discharges it.
 *
 * Layers on disk (relative to the project root):
 *   organization  .agent/superscalar.json   {"mode": "always"|"auto"|"off"}
 *                 .agent/subscaler.json     {"on": bool, "family"|"pair": string, "effort"?: string}
 *                 .agent/corporate.json     .defaults                (toggles with no legacy marker)
 *   group         .agent/corporate.json     .groups[].overrides      (matched via the role's group)
 *   role          .agent/workertables/<role>/toggles.json
 *
 * Usage:
 *   node resolve.cjs                      # resolve the organization layer (no role)
 *   node resolve.cjs --role builder       # resolve for one seat
 *   node resolve.cjs --role builder --json
 *   node resolve.cjs --root <dir>         # resolve against another project root
 *   node resolve.cjs --selftest           # discharge the §5.4 identity obligation + precedence
 *
 * 0 dependencies (node builtins only).
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

/** Toggles this resolver knows about. `from` names the legacy organization-layer marker, if any. */
const TOGGLES = {
  superscalar: { from: '.agent/superscalar.json', pick: (j) => (j && j.mode != null ? { mode: j.mode, autoDemotedFrom: j.autoDemotedFrom } : undefined) },
  subscaler: { from: '.agent/subscaler.json', pick: (j) => (j && (j.on != null || j.family != null || j.pair != null) ? { on: j.on, family: j.family != null ? j.family : j.pair, effort: j.effort } : undefined) },
  echo: { from: null },
  effort: { from: null },
  fast: { from: null },
  pace: { from: null },
};

function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (_) { return null; }
}

function stripUndefined(o) {
  if (o == null || typeof o !== 'object' || Array.isArray(o)) return o;
  const out = {};
  for (const [k, v] of Object.entries(o)) if (v !== undefined) out[k] = stripUndefined(v);
  return out;
}

/**
 * Read the organization layer alone. This function is deliberately the whole of the
 * "what a pre-Corporate project would see" behaviour, so §5.4 can compare against it.
 */
function organizationLayer(root) {
  const layer = {};
  for (const [name, def] of Object.entries(TOGGLES)) {
    if (!def.from) continue;
    const j = readJson(path.join(root, def.from));
    const v = def.pick(j);
    if (v !== undefined) layer[name] = stripUndefined(v);
  }
  // .defaults covers toggles that never had a legacy marker (echo/effort/fast/pace).
  // It must NOT override a legacy marker: the marker is the older, more explicit surface.
  const roster = readJson(path.join(root, '.agent/corporate.json'));
  const defaults = (roster && roster.defaults) || {};
  for (const [name, v] of Object.entries(defaults)) {
    if (!(name in TOGGLES)) continue;
    if (layer[name] === undefined) layer[name] = v;
  }
  return layer;
}

function mergeLayer(base, over) {
  const out = { ...base };
  for (const [k, v] of Object.entries(over || {})) {
    if (!(k in TOGGLES)) continue;   // unknown toggle names are ignored, never guessed at
    if (v === undefined || v === null) continue;
    out[k] = (v && typeof v === 'object' && !Array.isArray(v) && out[k] && typeof out[k] === 'object')
      ? { ...out[k], ...stripUndefined(v) }
      : v;
  }
  return out;
}

/**
 * Resolve toggles for a seat (or for the organization when `role` is null).
 * Returns { resolved, provenance } — provenance names the winning layer per toggle so a
 * caller can show *why* a value holds without re-reading any layer itself.
 */
function resolve(root, role) {
  const org = organizationLayer(root);
  const roster = readJson(path.join(root, '.agent/corporate.json'));

  const provenance = {};
  for (const k of Object.keys(org)) provenance[k] = 'organization';

  // §5.4 — no roster: the organization layer IS the answer. Return before any composition
  // so the absent-roster path cannot diverge from pre-adoption behaviour even by accident.
  if (!roster) return { resolved: org, provenance, layers: { organization: org }, rosterPresent: false };

  let out = org;
  const layers = { organization: org };

  const roleDecl = role ? ((roster.roles || []).find((r) => r.role === role) || null) : null;

  if (roleDecl && roleDecl.group) {
    const g = (roster.groups || []).find((x) => x.group === roleDecl.group);
    if (g && g.overrides) {
      layers.group = g.overrides;
      const before = out;
      out = mergeLayer(out, g.overrides);
      for (const k of Object.keys(g.overrides)) if (k in TOGGLES && out[k] !== before[k]) provenance[k] = 'group:' + g.group;
    }
  }

  if (role) {
    const rt = readJson(path.join(root, '.agent/workertables', role, 'toggles.json'));
    if (rt) {
      layers.role = rt;
      const before = out;
      out = mergeLayer(out, rt);
      for (const k of Object.keys(rt)) if (k in TOGGLES && out[k] !== before[k]) provenance[k] = 'role:' + role;
    }
  }

  return { resolved: out, provenance, layers, rosterPresent: true, role: role || null };
}

// ── §5.4 self-test ────────────────────────────────────────────────────────────
// Fixtures in a temp dir, never against the caller's project: a test that mutates the
// operator's markers to prove a property about them is not a test worth having.

function selftest() {
  const fails = [];
  const ok = (m) => console.log('  ok   ' + m);
  const bad = (m) => { fails.push(m); console.log('  FAIL ' + m); };

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'corp-resolve-'));
  const mk = (rel, obj) => {
    const p = path.join(tmp, rel);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, JSON.stringify(obj));
  };

  // Fixture A — markers only, NO roster. §5.4 identity.
  mk('.agent/superscalar.json', { mode: 'always', autoDemotedFrom: null });
  mk('.agent/subscaler.json', { on: true, family: 'anthropic' });

  console.log('[A] identity invariant (§5.4) — no roster present');
  const a = resolve(tmp, null);
  if (a.rosterPresent === false) ok('rosterPresent=false'); else bad('rosterPresent should be false');

  // Identity is stated against the RAW marker files — what every pre-Corporate consumer read
  // before this file existed. Comparing against the resolver's own projection would be
  // circular, so the assertion is expressed as two independent properties:
  //   (i)  nothing is dropped or altered — every key in the marker survives with its value;
  //   (ii) nothing is invented — no key appears that the marker did not carry, except the
  //        one documented alias (`pair` was renamed `family`; both spellings are read).
  const ALIAS = { subscaler: { family: 'pair' } };
  for (const [name, def] of Object.entries(TOGGLES)) {
    if (!def.from) continue;
    const rawMarker = JSON.parse(fs.readFileSync(path.join(tmp, def.from), 'utf8'));
    const got = a.resolved[name] || {};
    const dropped = Object.keys(rawMarker).filter((k) => !(k in got) || JSON.stringify(got[k]) !== JSON.stringify(rawMarker[k]));
    const invented = Object.keys(got).filter((k) => {
      if (k in rawMarker) return false;
      const alias = (ALIAS[name] || {})[k];
      return !(alias && alias in rawMarker);
    });
    if (!dropped.length) ok(name + ': no marker key dropped or altered');
    else bad(name + ': marker keys dropped/altered → ' + dropped.join(', ') + ' (resolved=' + JSON.stringify(got) + ')');
    if (!invented.length) ok(name + ': no key invented beyond the marker');
    else bad(name + ': keys invented → ' + invented.join(', '));
  }

  // Identity must hold when a role is named too — an unadopted project has no roles, and
  // asking for one must not conjure a layer.
  const aRole = resolve(tmp, 'builder');
  if (JSON.stringify(aRole.resolved) === JSON.stringify(a.resolved)) ok('naming a role changes nothing without a roster');
  else bad('role-named resolution diverged without a roster');

  // Fixture B — roster with defaults + group + role layers. §5.1 precedence.
  console.log('[B] precedence (§5.1) — role > group > organization');
  mk('.agent/corporate.json', {
    defaults: { echo: 'off', effort: 'medium', pace: 'proactive' },
    groups: [{ group: 'delivery', title: 'Delivery', overrides: { effort: 'high', echo: 'on' } }],
    roles: [{ role: 'builder', group: 'delivery', tier: 'T2', residency: 'on-demand', harness: 'claude-code', host: 'main' },
      { role: 'watch', tier: 'T4', residency: 'scheduled', harness: 'claude-code', host: 'main' }],
  });
  mk('.agent/workertables/builder/toggles.json', { effort: 'low', subscaler: { on: false } });

  const b = resolve(tmp, 'builder');
  if (b.resolved.effort === 'low') ok('role beats group beats organization (effort=low)');
  else bad('effort should be low (role layer), got ' + JSON.stringify(b.resolved.effort));
  if (b.provenance.effort === 'role:builder') ok('provenance names the winning layer (role:builder)');
  else bad('provenance.effort should be role:builder, got ' + b.provenance.effort);
  if (b.resolved.echo === 'on') ok('group wins where the role is silent (echo=on)');
  else bad('echo should be on (group layer), got ' + JSON.stringify(b.resolved.echo));
  if (b.resolved.pace === 'proactive') ok('organization defaults survive where both are silent (pace)');
  else bad('pace should be proactive, got ' + JSON.stringify(b.resolved.pace));
  if (b.resolved.subscaler && b.resolved.subscaler.on === false && b.resolved.subscaler.family === 'anthropic') {
    ok('object-valued toggle merges per key (subscaler.on overridden, family retained)');
  } else bad('subscaler merge wrong: ' + JSON.stringify(b.resolved.subscaler));

  // A legacy marker must not be silently displaced by .defaults — the marker is the older
  // and more explicit surface, and a defaults block quietly outranking it would be the
  // state-convergence bug §5.2 exists to prevent.
  mk('.agent/corporate.json', {
    defaults: { superscalar: { mode: 'off' }, echo: 'off' },
    roles: [{ role: 'watch', tier: 'T4', residency: 'scheduled', harness: 'claude-code', host: 'main' }],
  });
  const c = resolve(tmp, 'watch');
  if (c.resolved.superscalar.mode === 'always') ok('defaults do not displace a legacy marker (superscalar stays always)');
  else bad('defaults displaced the marker: ' + JSON.stringify(c.resolved.superscalar));

  // A seat with no group and no toggles file resolves to exactly the organization layer.
  const orgOnly = organizationLayer(tmp);
  const cNoLayers = { ...c.resolved };
  if (JSON.stringify(cNoLayers) === JSON.stringify(orgOnly)) ok('seat with no group and no toggles == organization layer');
  else bad('bare seat diverged from organization layer');

  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(fails.length ? '\nSELFTEST FAILED (' + fails.length + ')' : '\nSELFTEST PASS');
  return fails.length;
}

// ── CLI ───────────────────────────────────────────────────────────────────────
if (require.main === module) {
  const argv = process.argv.slice(2);
  const arg = (n) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : undefined; };
  if (argv.includes('--selftest')) process.exit(selftest() ? 1 : 0);

  const root = arg('--root') || process.cwd();
  const role = arg('--role') || null;
  const r = resolve(root, role);
  if (argv.includes('--json')) { console.log(JSON.stringify(r, null, 2)); process.exit(0); }

  console.log('root: ' + root);
  console.log('role: ' + (role || '(organization)') + '   roster: ' + (r.rosterPresent ? 'present' : 'absent — identity path (§5.4)'));
  for (const [k, v] of Object.entries(r.resolved)) {
    console.log('  ' + k.padEnd(12) + JSON.stringify(v) + '   ← ' + (r.provenance[k] || 'organization'));
  }
  if (!Object.keys(r.resolved).length) console.log('  (nothing declared — harness defaults apply)');
}

module.exports = { resolve, organizationLayer, TOGGLES };

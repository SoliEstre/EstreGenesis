// constellation/history-store.p4.mjs
//
// P4b dynamic-gate anchor for history-store.eux — executes the spec's @metamorphic
// properties (round_trip / idempotency / determinism) against the reference
// implementation. Loaded by the EstreUX runner (`spike/p4-check.mjs --run
// <path>/history-store.eux`), which resolves `<component>.p4.mjs` next to the .eux
// and calls the exported `run(props)` with the parsed property list.
//
// Contract (per p4-check P4b):
//   export async function run(props)   // props: [{ kind, desc }] parsed from @metamorphic
//   - prints one verdict line per property (PASS / FAIL / SKIP)
//   - throws on any FAIL or unmapped property (runner catches -> exit 1)
//
// Implementation under test: ./reference/runtime/history-store.cjs — the minimal
// Mode-A (JsonlStore) reference impl written for this dogfood. Two properties in the
// .eux are declared over Mode-B (SQLite dual-write) surfaces that the minimal impl
// defers; those run here as **declared Mode-A projections** of the same relation
// (see the `note` field on each mapping). One property (archive round-trip) has no
// Mode-A surface at all and is reported as an explicit SKIP — a disclosed coverage
// gap, not a silent pass.
//
// Env overrides:
//   EUX_P4_IMPL  — path to an alternative implementation module (same exports).
//                  This is the hook the reverse-sync e2e uses to point the anchor at
//                  a mutated/updated implementation and check that verdicts split.
//   EUX_P4_RUNS  — fast-check numRuns per property (default 30).
//   EUX_P4_SEED  — fast-check seed (default 20260711). Both sides of a reverse-sync
//                  e2e must pass the same value for verdict reproducibility; the
//                  default keeps historical runs comparable.
//
// Determinism: fixed fast-check seed so EG-side and hub-side runs of the same
// (anchor, impl) pair produce identical verdicts.
//
// Dev-dep: fast-check (constellation/package.json devDependencies — run `npm install`
// in constellation/ once). Runtime code stays dependency-zero; this file is harness.
//
// Apache-2.0 (EstreGenesis).

import { createRequire } from 'node:module';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const requireCjs = createRequire(import.meta.url);

const SEED = parseInt(process.env.EUX_P4_SEED || '20260711', 10) || 20260711; // fixed default — cross-side reproducibility
const RUNS = Math.max(1, parseInt(process.env.EUX_P4_RUNS || '30', 10) || 30);

// ---------------------------------------------------------------------------
// implementation under test
// ---------------------------------------------------------------------------

const IMPL_PATH = process.env.EUX_P4_IMPL
  ? resolve(process.cwd(), process.env.EUX_P4_IMPL)
  : join(HERE, 'reference', 'runtime', 'history-store.cjs');

const impl = requireCjs(IMPL_PATH);
const { createHistoryStore } = impl;
if (typeof createHistoryStore !== 'function') {
  throw new Error(`impl at ${IMPL_PATH} does not export createHistoryStore()`);
}
const msgChan = impl.msgChan || ((ev) => ev.agentId || ev.threadId || '_unknown');
const SKIP_NAMES = impl.SKIP_NAMES
  || new Set(['HELLO', 'SERVER_HELLO', 'AgentList', 'Heartbeat', 'PersistentAdapterSmoke', 'Typing']);

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function withTmp(fn) {
  const dir = mkdtempSync(join(tmpdir(), 'p4-hs-'));
  try { return fn(dir); }
  finally { rmSync(dir, { recursive: true, force: true }); }
}

// Canonical multiset fingerprint — order-insensitive event-set equality.
function canon(events) {
  return events.map(e => JSON.stringify(e)).sort().join('\n');
}

// Deterministic Fisher-Yates via small LCG (seeded by a fc-generated integer) —
// insertion-order permutation for the export-ordering property.
function lcgShuffle(arr, seed) {
  const out = arr.slice();
  let s = (seed >>> 0) || 1;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const j = s % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// ---------------------------------------------------------------------------
// property mappings — one entry per @metamorphic clause in history-store.eux.
// Matched by (kind + a stable ASCII token from the clause text) so clause wording
// can evolve without breaking the wiring, while a *removed or unknown* clause
// still surfaces (unmapped -> conservative FAIL).
// ---------------------------------------------------------------------------

function buildMappings(fc) {
  // event generator — JSON-round-trip-safe records; ids made unique post-hoc so the
  // (ts ASC, id ASC) canonical order is total and byte-identity checks are exact.
  const evGen = fc.record({
    agentId: fc.constantFrom('agent-a', 'agent-b', 'agent-c'),
    timestamp: fc.integer({ min: 1, max: 1_000_000_000 }),
    name: fc.constantFrom('Report', 'Delegate', 'StatusPing', 'CustomNote'),
    value: fc.oneof(fc.string(), fc.integer(), fc.record({ note: fc.string() })),
  });
  const evsGen = fc.array(evGen, { minLength: 1, maxLength: 40 })
    .map(evs => evs.map((e, i) => ({ id: `ev-${String(i).padStart(3, '0')}`, ...e })));

  return [
    {
      key: 'round_trip/export-reimport-cycle',
      match: p => p.kind === 'round_trip' && /backfillFromJsonl/.test(p.desc),
      note: 'Mode-A projection: exportJsonl -> fresh dir -> boot (content re-key) -> exportJsonl byte-identical. The Mode-B backfill leg runs when the full dual-write impl lands.',
      prop: fc.property(evsGen, evs => withTmp(d1 => withTmp(d2 => {
        const s1 = createHistoryStore({ dir: d1 });
        evs.forEach(e => s1.append(e));
        const out1 = s1.exportJsonl();
        writeFileSync(join(d2, '_import.jsonl'), out1);
        const s2 = createHistoryStore({ dir: d2 });
        s2.boot();
        return s2.exportJsonl() === out1;
      }))),
    },
    {
      key: 'round_trip/active-cold-active',
      match: p => p.kind === 'round_trip' && /cold/.test(p.desc),
      note: 'direct: append -> closeChannel (ring dropped, disk retained) -> boot reload -> same event set.',
      prop: fc.property(evsGen, evs => withTmp(dir => {
        const s = createHistoryStore({ dir });
        evs.forEach(e => s.append(e));
        const key = msgChan(evs[0]);
        const inChan = e => msgChan(e) === key;
        const before = canon(s.query(inChan));
        s.closeChannel(key);
        s.boot();
        return canon(s.query(inChan)) === before;
      })),
    },
    {
      key: 'round_trip/active-archived-active',
      match: p => p.kind === 'round_trip' && /archived/.test(p.desc),
      skip: 'archive surface (archiveChannel / archived/ dir) is deferred in the minimal Mode-A reference impl — no surface to exercise. Coverage gap disclosed, not silently passed.',
    },
    {
      key: 'idempotency/backfill-once-vs-n',
      match: p => p.kind === 'idempotency' && /backfillFromJsonl/.test(p.desc),
      note: 'Mode-A projection: boot() (the Mode-A re-ingest path) once vs N times over the same disk state -> identical endstate. Backs the .eux temporal invariant "boot reload is idempotent"; INSERT OR IGNORE leg lands with Mode B.',
      prop: fc.property(evsGen, fc.integer({ min: 1, max: 4 }), (evs, n) => withTmp(dir => {
        const s = createHistoryStore({ dir });
        evs.forEach(e => s.append(e));
        s.boot();
        const once = s.exportJsonl();
        for (let i = 0; i < n; i++) s.boot();
        return s.exportJsonl() === once;
      })),
    },
    {
      key: 'idempotency/skip-set-zero-or-n',
      match: p => p.kind === 'idempotency' && /skip/.test(p.desc),
      note: 'direct: appending skip-set events (HELLO/Heartbeat/...) 0 or N times leaves count and export unchanged.',
      prop: fc.property(evsGen, fc.integer({ min: 1, max: 3 }), (evs, n) => withTmp(dir => {
        const s = createHistoryStore({ dir });
        evs.forEach(e => s.append(e));
        const base = s.exportJsonl();
        const baseCount = s.count();
        const skips = [...SKIP_NAMES].map((nm, i) => ({
          id: `skip-${i}`, agentId: 'agent-a', timestamp: 7, name: nm, value: null,
        }));
        for (let i = 0; i < n; i++) skips.forEach(e => s.append(e));
        return s.exportJsonl() === base && s.count() === baseCount;
      })),
    },
    {
      key: 'determinism/same-input-same-endstate',
      match: p => p.kind === 'determinism' && /sqliteStore/.test(p.desc),
      note: 'Mode-A projection: the same event sequence appended into two fresh stores yields identical export and count (driver fixed per-process; the dual-write leg lands with Mode B).',
      prop: fc.property(evsGen, evs => withTmp(d1 => withTmp(d2 => {
        const a = createHistoryStore({ dir: d1 });
        const b = createHistoryStore({ dir: d2 });
        evs.forEach(e => { a.append(e); b.append(e); });
        return a.exportJsonl() === b.exportJsonl() && a.count() === b.count();
      }))),
    },
    {
      key: 'determinism/export-order-canonical',
      match: p => p.kind === 'determinism' && /ordering/.test(p.desc),
      note: 'direct: exportJsonl output is insertion-order independent (ts ASC, id ASC canonical order) and stable across repeated calls.',
      prop: fc.property(evsGen, fc.integer(), (evs, permSeed) => withTmp(d1 => withTmp(d2 => {
        const a = createHistoryStore({ dir: d1 });
        evs.forEach(e => a.append(e));
        const b = createHistoryStore({ dir: d2 });
        lcgShuffle(evs, permSeed).forEach(e => b.append(e));
        const outA = a.exportJsonl();
        return outA === b.exportJsonl() && outA === a.exportJsonl();
      }))),
    },
  ];
}

// ---------------------------------------------------------------------------
// runner contract
// ---------------------------------------------------------------------------

export async function run(props) {
  let fcm;
  try {
    fcm = await import('fast-check');
  } catch {
    throw new Error(
      "dev-dep 'fast-check' not installed — run `npm install` in constellation/ (see constellation/package.json devDependencies)."
    );
  }
  const fc = fcm.default ?? fcm;
  const mappings = buildMappings(fc);

  console.log(`    impl: ${IMPL_PATH}`);
  console.log(`    fast-check seed=${SEED} numRuns=${RUNS}\n`);

  const failures = [];
  let passed = 0, skipped = 0;
  const used = new Set();

  for (const p of props) {
    const m = mappings.find(m => !used.has(m.key) && m.match(p));
    if (!m) {
      failures.push(`unmapped @metamorphic clause (${p.kind}): "${p.desc}" — no anchor implementation; conservative FAIL.`);
      console.log(`  ✗ FAIL [unmapped] ${p.kind}: ${p.desc}`);
      continue;
    }
    used.add(m.key);
    if (m.skip) {
      skipped++;
      console.log(`  ~ SKIP ${m.key}\n         ${m.skip}`);
      continue;
    }
    try {
      fc.assert(m.prop, { seed: SEED, numRuns: RUNS });
      passed++;
      console.log(`  ✓ PASS ${m.key} (${RUNS} runs)\n         ${m.note}`);
    } catch (e) {
      failures.push(`${m.key}: ${String(e.message).split('\n').slice(0, 6).join('\n')}`);
      console.log(`  ✗ FAIL ${m.key}\n         ${String(e.message).split('\n')[0]}`);
    }
  }

  const orphans = mappings.filter(m => !used.has(m.key));
  if (orphans.length) {
    console.log(`\n  note: ${orphans.length} anchor mapping(s) not exercised by the .eux (clause removed/reworded?): ${orphans.map(o => o.key).join(', ')} — static gate (P3 drift-check) owns clause-deletion verdicts.`);
  }

  console.log(`\n  coverage: ${passed} attested · ${skipped} skipped (disclosed) · ${failures.length} failed — of ${props.length} clauses`);
  if (failures.length) {
    throw new Error(`P4 dynamic gate: ${failures.length} failure(s)\n` + failures.map(f => `  - ${f}`).join('\n'));
  }
}

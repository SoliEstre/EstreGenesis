// constellation/reference/runtime/history-store.cjs
//
// EG minimal reference impl for P4 dogfood (v2.5.49 — Mode A JsonlStore only).
// Full reference impl (Mode B SqliteStore + HistoryStoreMux dual-write + backfillFromJsonl
// + reconcile + auto-revert + WAL recovery) deferred to a separate cycle (Option A
// spec-derived ~580 lines OR Option B main upstream a28150e copy — see push 368).
//
// Scope of this minimal impl:
//   - JsonlStore: dir + per-channel ring (HIST_CAP=200) + append + query + count
//                 + exportJsonl + closeChannel + deleteChannel + deleteAll + boot
//   - HistoryStoreMux: wraps JsonlStore in mode A; mode B/C requests fall back to A
//                      with onBlocker advisory (full impl deferred)
//   - createHistoryStore: factory returning a HistoryStoreMux
//   - msgChan: event → channel key (content-derived, filename-layout-independent)
//
// Spec: constellation/history-store.eux (Mode A floor + JsonlStore L39-215 +
// HistoryStoreMux L475-567 + createHistoryStore L572-577).
// Invariants under test (P4 dogfood): @metamorphic round_trip/idempotency/determinism
// per history-store.eux phase_3 1st cut (v2.5.47 a3a13c1).
//
// Apache-2.0 (EstreGenesis).

'use strict';

const fs = require('fs');
const path = require('path');

const HIST_CAP = 200;

// Skip non-storable transport-tier names per history-store.eux @behavior.record
const SKIP_NAMES = new Set([
  'HELLO', 'SERVER_HELLO', 'AgentList', 'Heartbeat',
  'PersistentAdapterSmoke', 'Typing'
]);

// Content-derived channel key — filename layout is storage only, NOT authoritative.
// Per history-store.eux @invariants.state ("chan key derivation: filename != authoritative;
// content-derived via wsMsgChan").
function msgChan(ev) {
  return ev.agentId || ev.threadId || '_unknown';
}

// JSONL store — Mode A floor + Mode B rollback floor.
class JsonlStore {
  constructor(dir) {
    this.dir = dir;
    this.chans = new Map(); // chanKey → events[]
    if (dir && !fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }

  _getRing(key) {
    let ring = this.chans.get(key);
    if (!ring) { ring = []; this.chans.set(key, ring); }
    return ring;
  }

  append(ev) {
    if (SKIP_NAMES.has(ev && ev.name)) return; // record skip-set
    const key = msgChan(ev);
    const ring = this._getRing(key);
    ring.push(ev);
    while (ring.length > HIST_CAP) ring.shift(); // bounded HIST_CAP=200
    if (this.dir) {
      const line = JSON.stringify(ev) + '\n';
      fs.appendFileSync(path.join(this.dir, `${key}.jsonl`), line);
    }
  }

  query(filter) {
    const all = [];
    for (const ring of this.chans.values()) all.push(...ring);
    return filter ? all.filter(filter) : all.slice();
  }

  count() {
    let n = 0;
    for (const ring of this.chans.values()) n += ring.length;
    return n;
  }

  // Byte-identical ordered stream: ts ASC, id ASC (per @invariants.transaction
  // "exportJsonl byte-identical commit-then" + @metamorphic.round_trip).
  exportJsonl() {
    const all = [];
    for (const ring of this.chans.values()) all.push(...ring);
    all.sort((a, b) => {
      const t = ((a && a.timestamp) || 0) - ((b && b.timestamp) || 0);
      if (t !== 0) return t;
      const ia = (a && a.id) || '';
      const ib = (b && b.id) || '';
      return ia < ib ? -1 : ia > ib ? 1 : 0;
    });
    if (!all.length) return '';
    return all.map(ev => JSON.stringify(ev)).join('\n') + '\n';
  }

  closeChannel(key) {
    this.chans.delete(key);
    // cold stub: in-memory ring removed; disk file retained for RequestChannelHistory reload
  }

  deleteChannel(key) {
    this.chans.delete(key);
    if (this.dir) {
      const p = path.join(this.dir, `${key}.jsonl`);
      if (fs.existsSync(p)) fs.unlinkSync(p);
    }
  }

  deleteAll() {
    this.chans.clear();
    if (this.dir && fs.existsSync(this.dir)) {
      for (const f of fs.readdirSync(this.dir)) {
        if (f.endsWith('.jsonl')) fs.unlinkSync(path.join(this.dir, f));
      }
    }
  }

  // wsLoadAll — per-channel .jsonl parse → re-key by content via msgChan
  // → time-sort → cap. Boot reload is idempotent (re-run from same disk → same state)
  // per @invariants.temporal + @metamorphic.idempotency.
  boot() {
    this.chans.clear();
    if (!this.dir || !fs.existsSync(this.dir)) return;
    for (const f of fs.readdirSync(this.dir)) {
      if (!f.endsWith('.jsonl')) continue;
      const content = fs.readFileSync(path.join(this.dir, f), 'utf8');
      for (const line of content.split('\n')) {
        if (!line.trim()) continue;
        try {
          const ev = JSON.parse(line);
          if (SKIP_NAMES.has(ev && ev.name)) continue;
          const key = msgChan(ev); // re-key by content, not filename
          const ring = this._getRing(key);
          ring.push(ev);
        } catch (_) { /* skip malformed */ }
      }
    }
    // sort + cap per channel
    for (const ring of this.chans.values()) {
      ring.sort((a, b) => ((a && a.timestamp) || 0) - ((b && b.timestamp) || 0));
      while (ring.length > HIST_CAP) ring.shift();
    }
  }
}

// HistoryStoreMux — Mode A delegate + Mode B/C dormant in minimal impl.
class HistoryStoreMux {
  constructor(opts) {
    this.currentMode = 'jsonl'; // Minimal supports A only; B/C deferred.
    this.jsonlStore = new JsonlStore(opts.dir);
    this.onBlocker = opts.onBlocker || (() => {});
  }
  boot() { this.jsonlStore.boot(); }
  append(ev) { this.jsonlStore.append(ev); }
  query(filter) { return this.jsonlStore.query(filter); }
  count() { return this.jsonlStore.count(); }
  exportJsonl() { return this.jsonlStore.exportJsonl(); }
  closeChannel(key) { this.jsonlStore.closeChannel(key); }
  deleteChannel(key) { this.jsonlStore.deleteChannel(key); }
  deleteAll() { this.jsonlStore.deleteAll(); }
  close() { /* no-op in minimal — full impl flushes + sqlite WAL checkpoint */ }
}

// Factory — Mode A only in minimal. Operator opt-in to Mode B/C surfaces an advisory
// BlockerManifest (full impl in a separate cycle).
function createHistoryStore(opts) {
  opts = opts || {};
  if (opts.mode && opts.mode !== 'jsonl') {
    const cb = opts.onBlocker;
    if (cb) cb({
      subject: 'operator',
      reason: `minimal reference impl supports mode A (jsonl) only; requested mode '${opts.mode}' deferred to mode A. Full impl in a separate cycle (Option A spec-derived OR B upstream copy).`,
      tier: 'advisory',
      eg_side_action_waiting: 'operator awareness; no immediate action required'
    });
  }
  return new HistoryStoreMux({ dir: opts.dir, onBlocker: opts.onBlocker });
}

module.exports = {
  createHistoryStore,
  JsonlStore,
  HistoryStoreMux,
  msgChan,
  HIST_CAP,
  SKIP_NAMES
};

// constellation/reference/runtime/history-store.cjs
//
// EG minimal reference impl for P4 dogfood (v2.5.49 — Mode A JsonlStore only).
// Full reference impl (Mode B SqliteStore + HistoryStoreMux dual-write + backfillFromJsonl
// + reconcile + auto-revert + WAL recovery) deferred to a separate cycle (Option A
// spec-derived ~580 lines OR Option B main upstream a28150e copy — see push 368).
//
// Scope of this minimal impl:
//   - JsonlStore: dir + per-channel ring (HIST_CAP, 기본 1000 · env 로 조절) + append + query + count
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

// v2.4.156 — 200 → 1000. **얕은 링이 대화를 지우는 장치였어요**: 2026-08-09 실측으로 한 채널의
//   200줄이 선언 80 + 합류 57 + ack 58 로 채워져 그날의 대화 전부가 링 밖으로 밀려났어요(운영자가
//   「비A2A 대화 내역도 사라졌다」로 발견 — 다리측 append-only 로그에서 복구했어요).
//   소음을 빼는 게 1차 처방이고(아래 SKIP_NAMES + 서버측 선언 제외), 이건 2차 안전여유예요.
//   **접속 비용은 안 올라가요**: 초기 전송은 서버가 채널당 HISTORY_INITIAL_PER_CHAN(기본 150)으로
//   따로 잘라 보내고 나머지는 RequestChannelHistory 로 이어받아요. 그래서 깊이는 디스크·메모리만 써요.
const HIST_CAP = Number(process.env.HIST_CAP || 1000);

// Skip non-storable transport-tier names per history-store.eux @behavior.record
//
// 이 목록이 **바닥(floor)** 이에요 — 어느 소비자가 쓰든 저장되지 않아요. 서버는 그 위에 자기 층을
//   한 겹 더 갖고 있어요(선언 계열처럼 «포착한 뒤 저장만 건너뛰는» 것들 — 순서가 반대면 영속이
//   끊겨요). 둘의 분담: **순수 전송-티어 이름은 여기**, 포착이 필요한 이름은 서버.
// v2.4.156 추가분: ack 3종 · 합류 · 접속 통지 — 전부 전송 사실의 통지라 대화 기록이 아니고,
//   같은 사실이 다리측 로그에 남아요. 실측: 한 채널 200줄 중 ack 58 + 합류 57 = 115 (57%).
const SKIP_NAMES = new Set([
  'HELLO', 'SERVER_HELLO', 'AgentList', 'Heartbeat',
  'PersistentAdapterSmoke', 'Typing',
  'Ack', 'AckProcessed', 'AckCumulative', 'AgentHello', 'ConnectionInfo'
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
    while (ring.length > HIST_CAP) ring.shift(); // bounded by HIST_CAP
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

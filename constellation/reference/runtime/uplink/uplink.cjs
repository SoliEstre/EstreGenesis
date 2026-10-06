'use strict';
// uplink.cjs — 보드 → 중계 서비스 «상향 전송» 층: 번호 붙은 봉투 큐 · 스풀 · 하트비트 · 항목 스냅샷 · 명령 롱폴(+결과 회신).
//
// **이 층이 지키는 약속 (순서대로 중요해요).**
//   1) 번호(seq)는 보드가 매기고 «되감기지 않아요» — 스풀(대기 중) + 상태 파일(lastSeq, 확정된 최대)에서 이어붙여요. 중계는 seq 로 중복을 거르니 번호를 다시 쓰면 새 봉투가 «받은 것» 으로 버려져요.
//   2) 디스크에 확정된 뒤에만 보내요 — 보내고 나서 죽어도 «스풀에 있는 것» 을 다시 보낼 수 있고(중계가 중복을 거름), 확정 전에 죽으면 «보낸 적 없는 것» 이라 구멍도 중복도 없어요.
//   3) 못 보내는 동안 스풀이 넘치면 가장 오래된 것부터 버리되 «구멍» 으로 남겨서 그것도 보내요 — 조용한 손실이 없어요(spool.cjs).
//   4) 이 층은 «받은 명령을 직접 판정하지 않아요.» 오는 명령은 주입받은 실행기(exec.cjs — 검증 + 고정 실행기)에 «그대로» 넘기고, 돌려받은 {status, reason, receipt} 를 회신해요(감사 한 줄은 실행기가 남겨요).
//      실행기가 없으면(전송층만 단독으로 쓰는 시험) 전부 {status:'rejected', reason:'not-implemented'} + 감사 한 줄 — 안전하게 틀려요.
//   5) 로컬 설정이 정본이에요 — 중계의 응답은 ackSeq · commands 말고는 해석하지 않아요(설정을 바꾸는 응답 필드가 없어요).
//   6) 토큰은 Authorization 헤더로만 가요 — URL·로그·감사에 안 들어가요(요청 경로엔 cursor/wait 숫자만).
//   7) **사용 기록 전달 (v2.4.178).** 서명된 TOTP 사용 기록은 결과 회신에만 실리면, 회신할 결과가 없는 동안(그리고 회신이 중계에서 사라진 뒤) 폰이 영영 못 봐요. 그래서 «배치 항목» `{kind:'spends', spends:[…]}` 으로도 실어요
//      (하트비트에 얹지 않은 이유: 하트비트는 «가장 최근 한 장의 상태» 로 덮어써지고 중계가 칸을 화이트리스트로 고르는 고정 모양이라 «쌓이는 서명 기록» 의 그릇이 아니에요 — 별도 항목이면 중계의 기록 검증·저장 경로가 그대로 받고,
//      항목 종류를 모르는 옛 중계는 그 항목 하나만 거절로 세고 ack 는 그대로 진행해요). 실리는 때: ① 하트비트 주기마다 기록을 다시 읽어서(결과가 바뀌어 보드가 다시 서명했을 수 있어요) 지문이 «마지막으로 전달된 것» 과 다르면 다음 배치에
//      ② 전체 스냅샷을 다시 보내는 때(시작 · 재접속 · 실패 뒤)엔 지문과 상관없이 한 번 더 — 중계가 못 받았을 수 있어서요. 결과 회신에도 그대로 실려요(회신이 성공하면 그 지문은 전달된 것으로 쳐요). 기록이 없으면 항목도 없어요.
//
// **실패하는 방식.** 네트워크 오류 · 시간 초과 · 이해 못 할 응답 → 지수 백오프(1s~60s, 지터) 후 재시도, 성공하면 초기화. 401/403 은 «토큰이 폐기됐다» 로 읽고 **멈춰요**(한 번 말하고
//   폭주하지 않아요 — 토큰 파일이 바뀌면 30초 안에 다시 시작해요). 모든 요청에 시간 제한이 있고, stop() 은 타이머와 진행 중 요청을 전부 끊어요(서버가 깨끗하게 끝나게).
//   시계·타이머·난수는 주입받아요(시험이 시간을 건너뛰고 지터를 고정하게). **«벽시계» 와 «단조 시계» 는 갈라요** — 봉투 ts·감사 시각 같은 «사실의 기록» 은 벽시계(clock)지만, 백오프 일정·경과 시간 계산은
//   단조 시계(mono)예요. 벽시계가 뒤로 점프하면(NTP 보정 · 수동 변경 · VM 복원) 「다음 시도 시각」 이 점프만큼 먼 미래가 돼서 전송이 그만큼 멈추고 스풀이 차오르거든요.

const { performance } = require('perf_hooks');
const http = require('http');
const https = require('https');
const OP = require('./opcmd.cjs');
const { Spool } = require('./spool.cjs');

const UPLINK_VERSION = '0.1.0';
const MAX_BATCH_ITEMS = 200;
const MAX_BATCH_BYTES = 256 * 1024;
const SNAP_BUDGET = 180 * 1024;                 // 한 배치에서 스냅샷이 쓸 수 있는 바이트 — 나머지는 다음 배치로 이어요
const MAX_RESPONSE_BYTES = 1024 * 1024;
const MAX_SANE_SEQ = 2 ** 40;                  // 중계가 이보다 큰 ack 를 말하면 «앞서 있다» 가 아니라 «고장» 으로 읽어요(번호 공간을 한 번에 소진시키는 응답을 믿지 않아요)
const MAX_COMMANDS = 50;
// 한 번의 명령 배치에서 «동기로 처리하는» 시간 예산(ms, 단조 시계) — 실행기는 동기라(상태 해석 · 서명 · fsync) 중계가 쏟아내는 명령이 서버 이벤트 루프(에이전트 WS · 대시보드)를 붙잡을 수 있어요.
//   예산을 넘으면 «처리한 만큼만» 회신하고 커서를 거기까지만 올려서, 나머지는 다음 폴링(최소 간격 250ms)에 와요 — 한 폴링의 점유가 예산 이하로 묶여요. 최소 한 건은 항상 처리해요(굶지 않게).
const CMD_BUDGET_MS = 25;
const MAX_CMD_TEXT = 20000;
const CMDID_RE = /^[A-Za-z0-9._:@=+/-]{1,128}$/;
const MIN_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 60000;
const TOKEN_WATCH_MS = 30000;

const isPlain = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const realTimers = {
  setTimeout: (fn, ms) => { const t = setTimeout(fn, ms); if (t && t.unref) t.unref(); return t; },
  clearTimeout: (t) => clearTimeout(t),
};

class Transport {
  constructor(o) {
    this.cfg = o.cfg;
    this.store = o.store;
    this.log = o.log || (() => {});
    this.clock = o.clock || { now: () => Date.now() };              // 벽시계 — 기록용(ts · 감사)
    this.mono = o.mono || { now: () => performance.now() };         // 단조 시계 — 일정·경과용(되감기지 않아요)
    this.timers = o.timers || realTimers;
    this.rand = o.rand || Math.random;
    this.readToken = o.readToken;
    this.buildHeartbeat = o.buildHeartbeat || (() => null);        // () => {item, sig} | null
    this.snapshotProvider = o.snapshotProvider || (() => null);    // () => entries[] (열린 항목 전부 + 최근 닫힌 항목의 서명된 닫는 기록 — items.cjs fullEntries)
    this.cmdBudgetMs = o.cmdBudgetMs !== undefined ? o.cmdBudgetMs : CMD_BUDGET_MS;
    this.executor = typeof o.executor === 'function' ? o.executor : null;     // (c:{cmdId, cursor, cmd, proof}) => {status, reason, receipt|null} — 동기. 없으면 전부 not-implemented
    this.spends = typeof o.spends === 'function' ? o.spends : null;          // () => 서명된 TOTP 사용 기록[] — 결과 회신에 «그대로» 실어요(exec.cjs spendRecords). 폰이 «내 코드를 누가 썼나» 를 확인하는 길이에요
    this.onTick = o.onTick || null;                                // 하트비트 주기마다 먼저 불려요 (키 파일 변경 감시 같은 «주기 점검» 자리)
    this.flushMs = o.flushMs !== undefined ? o.flushMs : 200;
    this.heartbeatMs = o.heartbeatMs !== undefined ? o.heartbeatMs : 30000;
    this.pollWaitS = o.pollWaitS !== undefined ? o.pollWaitS : 25;
    this.requestTimeoutMs = o.requestTimeoutMs !== undefined ? o.requestTimeoutMs : 15000;

    this.spool = new Spool({ file: this.store.spoolFile, maxBytes: o.spoolMaxBytes || 5 * 1024 * 1024, log: this.log });
    this.spool.load();
    // 번호 이어붙이기 — 확정된 최댓값(상태 파일)과 대기 중 최댓값(스풀) 중 큰 쪽 다음부터. 둘 다 잃으면 1 부터지만, 그건 «처음» 일 때뿐이에요.
    //   세 보관소의 최댓값이에요: 상태 파일(lastSeq) · 스풀 머리의 바닥값(floor — 상태 파일을 잃어도 남아요) · 스풀의 대기 항목. 셋 다 잃은 경우는 아래 «앞서 있는 중계» 가 중계의 ack 에 맞춰요.
    this.nextSeq = Math.max(this.store.state.lastSeq, this.spool.floor, this.spool.maxPos) + 1;
    this._maxSentPos = this.spool.maxPos;   // 지금까지 «보냈을 수 있는» 가장 큰 위치 — 재시작 직후엔 스풀에 있는 건 전부 이전 프로세스가 보냈을 수 있어요

    this._hb = null;
    this._lastHbSig = null;
    this._snapPending = new Map();
    this._snapFull = false;
    this._spendsOut = null;          // 다음 배치에 실을 «최신 서명된 사용 기록들» (없으면 null) — 사용 기록 전달(머리말 7)
    this._spendsSig = null;          // 위 목록의 지문(기록 sig 이어붙임)
    this._spendsDelivered = null;    // 마지막으로 «전달에 성공한» 지문
    this._needFull = true;           // 시작·재접속 뒤 첫 성공 전송에는 «열린 항목 전체» 가 실려요
    this._inflight = false;
    this._nextAttemptAt = 0;          // 단조 시계 기준
    this._fails = 0;
    this._failLogged = false;
    this._revoked = false;
    this._revokedSig = null;
    this._stopped = false;
    this._started = false;
    this._live = new Set();
    this._t = {};
    this._pollFails = 0;
    this._audited = new Set();
    this._overflowLoggedAt = 0;
    this._stateWarn = false;
  }

  // ── 시간·타이머 ──
  _arm(name, ms, fn) {
    if (this._t[name]) this.timers.clearTimeout(this._t[name]);
    this._t[name] = this.timers.setTimeout(() => { this._t[name] = null; try { fn(); } catch (e) { this._warnOnce('arm:' + name, '[uplink] 내부 오류 (' + name + '): ' + (e && e.message)); } }, ms);
  }
  _warnOnce(key, msg) { this._once = this._once || new Set(); if (this._once.has(key)) return; this._once.add(key); this.log(msg); }
  _backoff(n) {
    const base = Math.min(MAX_BACKOFF_MS, MIN_BACKOFF_MS * 2 ** Math.max(0, n - 1));
    return Math.min(MAX_BACKOFF_MS, Math.floor(base * (1 + 0.25 * this.rand())));
  }

  // ── 시작/중지 ──
  start() {
    if (this._started) return;
    this._started = true;
    this._heartbeatTick();
    this._pump();
    this._pollSoon(0);
  }

  stop() {
    this._stopped = true;
    for (const k of Object.keys(this._t)) { if (this._t[k]) this.timers.clearTimeout(this._t[k]); this._t[k] = null; }
    for (const r of [...this._live]) { try { r.destroy(new Error('stopped')); } catch (_) { /* noop */ } }
    this._live.clear();
    try { this.spool.flushDisk(); } catch (_) { /* 종료 중 최선 */ }
  }

  stats() { return { pending: this.spool.pending(), dropped: this.store.state.dropped }; }

  // ── 큐 ──
  enqueue(env) {
    if (this._stopped) return 0;
    const seq = this.nextSeq++;
    const item = { kind: 'envelope', seq, ts: env.ts !== null && env.ts !== undefined ? env.ts : this.clock.now(),
      type: env.type, name: env.name, msgId: env.msgId, parentId: env.parentId, from: env.from, to: env.to, source: env.source,
      class: env.class, channel: env.channel, obs: env.obs, meta: env.meta };
    this.spool.push(item);
    this._schedulePersist();
    return seq;
  }

  mergeSnapshot(entries) {
    if (this._stopped || !entries || !entries.length) return;
    for (const e of entries) this._snapPending.set(e.itemId, e);
    this._schedulePersist();
  }

  requestFull() { this._needFull = true; this._schedulePersist(); }

  setHeartbeat(item, sig) { this._hb = item; this._lastHbSig = sig; this._schedulePersist(); }

  // 하트비트: 주기(30초)마다 무조건 + «변화» 가 감지되면 즉시(디바운스).
  _heartbeatTick() {
    if (this._stopped) return;
    try { if (this.onTick) this.onTick(); const r = this.buildHeartbeat(); if (r) this.setHeartbeat(r.item, r.sig); } catch (e) { this._warnOnce('hb', '[uplink] 하트비트를 만들지 못했어요: ' + (e && e.message)); }
    this._refreshSpends();
    this._arm('hb', this.heartbeatMs, () => this._heartbeatTick());
  }

  // 서명된 사용 기록을 다시 읽어요(결과가 바뀌어 다시 서명됐을 수 있어요). 던져도 하트비트·결과 회신은 그대로 나가요. 지문이 마지막 전달과 다르면 «할 일» 이 생겨서 배치가 나가요.
  _refreshSpends() {
    if (!this.spends) return;
    let sp = null;
    try { sp = this.spends(); } catch (_) { return; }
    if (!Array.isArray(sp) || sp.length === 0) { this._spendsOut = null; this._spendsSig = null; return; }
    const sig = sp.map((r) => (r && typeof r.sig === 'string' ? r.sig : '')).join(',');
    this._spendsOut = sp;
    this._spendsSig = sig;
    if (sig !== this._spendsDelivered) this._schedulePersist();       // 할 일이 생겼어요 — 배치를 «지금» 내보내요(다음 하트비트 주기를 기다리지 않아요)
  }

  notifyChange() {
    if (this._stopped || this._t.change) return;
    this._arm('change', 300, () => {
      const r = this.buildHeartbeat();
      if (r && r.sig !== this._lastHbSig) this.setHeartbeat(r.item, r.sig);
    });
  }

  _schedulePersist() {
    if (this._stopped || this._t.persist) return;
    this._arm('persist', this.flushMs, () => { this._persistNow(); this._pump(); });
  }

  _persistNow() {
    try {
      const r = this.spool.flushDisk();
      if (r.dropped > 0) {
        this.store.state.dropped += r.dropped;
        try { this.store.save(); } catch (_) { /* 다음 기회 */ }
        const now = this.mono.now();
        if (this._overflowLoggedAt === 0 || now - this._overflowLoggedAt > 60000) { this._overflowLoggedAt = now; this.log('[uplink] 스풀이 가득 차서 오래된 봉투 ' + r.dropped + '개를 버렸어요 (구멍 항목으로 중계에 알려요)'); }
      }
    } catch (e) { this._warnOnce('persist', '[uplink] 스풀을 디스크에 쓰지 못했어요 (' + (e && e.code ? e.code : e && e.message) + ') — 메모리에 두고 다시 시도해요'); }
  }

  _spendsDue() { return !!this._spendsOut && this._spendsSig !== this._spendsDelivered; }
  _hasWork() { return this.spool.entries.length > 0 || !!this._hb || this._snapPending.size > 0 || this._needFull || this._spendsDue(); }

  // ── 배치 전송 ──
  _pump() {
    if (this._stopped || this._revoked || this._inflight) return;
    if (!this._hasWork()) return;
    const wait = Math.min(MAX_BACKOFF_MS, this._nextAttemptAt - this.mono.now());      // 상한은 안전망 — 일정은 이미 단조 시계라 점프에 안 흔들려요
    if (wait > 0) { this._arm('pump', wait, () => this._pump()); return; }
    this._sendBatch();
  }

  async _sendBatch() {
    this._inflight = true;
    try {
      this._persistNow();                           // 보내기 «전에» 디스크 확정
      if (this._needFull) {
        this._spendsDelivered = null;                // 처음부터 다시 보낼 때는 사용 기록도 한 번 더(중계가 일부만 받았을 수 있어요)
        // 전체 스냅샷은 «시작할 때 한 번» 만들어요 — 덩어리가 여럿이면 남은 덩어리가 다음 배치로 이어지고, 그동안 다시 만들면 첫 덩어리만 영원히 반복돼요.
        //   실패하면 아래 catch 가 _needFull 을 다시 세워서 «처음부터» 다시 보내요(중계가 일부만 받았을 수 있어서).
        this._needFull = false;
        const full = this.snapshotProvider();
        if (full) { this._snapPending = new Map(full.map((e) => [e.itemId, e])); this._snapFull = true; }
      }
      const items = [];
      let bytes = 64;
      const hb = this._hb;
      if (hb) { items.push(hb); bytes += Buffer.byteLength(JSON.stringify(hb)); }
      // 스냅샷 — 예산 안에서 항목을 덜어 한 덩어리로. 전체(full)이면 덩어리마다 final 로 «끝» 을 표시해요.
      let snapSent = [];
      let snapItem = null;
      if (this._snapPending.size > 0 || this._snapFull) {
        const entries = [...this._snapPending.values()];
        let used = 0;
        for (const e of entries) {
          const sz = Buffer.byteLength(JSON.stringify(e));
          if (snapSent.length > 0 && used + sz > SNAP_BUDGET) break;
          snapSent.push(e); used += sz;
        }
        snapItem = { kind: 'items-snapshot', full: this._snapFull, final: snapSent.length === entries.length, items: snapSent };
        items.push(snapItem);
        bytes += used + 64;
      }
      // 서명된 사용 기록 — 배치 항목으로(머리말 7). 전달에 성공할 때 지문을 «전달됨» 으로 적어요.
      let spendsItem = null;
      let spendsSigSent = null;
      if (this._spendsDue()) {
        spendsItem = { kind: 'spends', spends: this._spendsOut };
        spendsSigSent = this._spendsSig;
        items.push(spendsItem);
        bytes += Buffer.byteLength(JSON.stringify(spendsItem));
      }
      const spoolSent = [];
      for (const e of this.spool.entries) {
        if (items.length >= MAX_BATCH_ITEMS) break;
        if (spoolSent.length > 0 && bytes + e.bytes > MAX_BATCH_BYTES) break;
        items.push(e.item); spoolSent.push(e); bytes += e.bytes;
      }
      const res = await this._req('POST', '/v1/uplink/batch', JSON.stringify({ boardId: this.cfg.boardId, items }), this.requestTimeoutMs);
      if (this._stopped) return;
      if (res.status === 401 || res.status === 403) { this._revoke(res.status); return; }
      if (res.status !== 200) throw new Error('HTTP ' + res.status);
      let ack;
      try { const j = JSON.parse(res.text); ack = j && j.ackSeq; } catch (_) { ack = undefined; }
      if (!Number.isSafeInteger(ack) || ack < 0 || ack > MAX_SANE_SEQ) throw new Error('이해할 수 없는 ack 응답');
      for (const e of spoolSent) if (e.pos > this._maxSentPos) this._maxSentPos = e.pos;
      const base = Math.max(this._maxSentPos, this.store.state.lastSeq);
      if (ack > base) {
        // «앞서 있는 중계» — 우리가 보냈을 수 있는 어떤 번호보다 큰 ack. 번호를 잃은 보드(상태·스풀 둘 다 사라짐)가 새로 1 부터 매기는데 중계는 옛 번호까지 받아 둔 경우예요.
        //   (보내지도 않은 봉투를 ack 로 지워 버리지 않고) 중계의 ack 를 바닥으로 삼아 아직 안 보낸 항목을 그 위로 다시 매겨요 — 안 그러면 새 봉투가 전부 «이미 받은 번호» 로 버려져요.
        const next = this.spool.renumberAbove(ack);
        this.nextSeq = Math.max(this.nextSeq, next);
        this._maxSentPos = this.spool.maxPos;
        this._warnOnce('ahead', '[uplink] 중계가 우리 번호보다 앞서 있어요 (ack ' + ack + ') — 번호 기록을 잃은 것으로 보고 중계의 ack 뒤로 이어서 다시 매겨요');
      } else {
        const advanced = ack > 0 && this.spool.entries.some((e) => e.pos <= ack);
        if (spoolSent.length > 0 && !advanced) throw new Error('ack 가 진전이 없어요');
      }
      this._applyAck(ack);
      if (this._hb === hb) this._hb = null;
      for (const e of snapSent) if (this._snapPending.get(e.itemId) === e) this._snapPending.delete(e.itemId);
      if (snapItem && snapItem.final) this._snapFull = false;
      if (spendsItem) this._spendsDelivered = spendsSigSent;
      this._fails = 0;
      this._failLogged = false;
      this._nextAttemptAt = 0;
    } catch (e) {
      if (this._stopped) return;
      this._fails++;
      this._needFull = true;                        // 연결이 끊겼다 돌아오면 전체 스냅샷을 다시 보내요
      this._nextAttemptAt = this.mono.now() + this._backoff(this._fails);
      if (!this._failLogged) { this._failLogged = true; this.log('[uplink] 전송 실패 — 백오프로 재시도해요 (' + String((e && e.message) || e).slice(0, 120) + ')'); }
    } finally {
      this._inflight = false;
    }
    if (!this._stopped && !this._revoked) this._arm('pump', Math.min(MAX_BACKOFF_MS, Math.max(0, this._nextAttemptAt - this.mono.now())), () => this._pump());
  }

  _applyAck(ack) {
    if (ack > this.store.state.lastSeq) {
      this.store.state.lastSeq = ack;
      try { this.store.save(); this._stateWarn = false; } catch (e) { this._warnOnce('state', '[uplink] 상태 파일을 쓰지 못했어요 (' + (e && e.code ? e.code : e && e.message) + ')'); }
    }
    this.spool.ack(ack);                            // 상태 파일(lastSeq)이 «먼저» — 스풀에서 지운 뒤 죽어도 번호가 되감기지 않아요
    try { this.spool.flushDisk(); } catch (e) { this._warnOnce('persist', '[uplink] 스풀을 디스크에 쓰지 못했어요 (' + (e && e.code ? e.code : e && e.message) + ')'); }
  }

  // ── 401/403: 멈춰요 ──
  _revoke(status) {
    if (this._revoked) return;
    this._revoked = true;
    this._revokedSig = this._tokenSig();
    for (const k of ['pump', 'poll', 'hb', 'change', 'persist']) { if (this._t[k]) { this.timers.clearTimeout(this._t[k]); this._t[k] = null; } }
    this.log('[uplink] 중계가 인증을 거절했어요 (HTTP ' + status + ') — 토큰이 폐기된 것으로 보고 전송·폴링을 멈춰요. 토큰 파일을 바꾸면 자동으로 다시 시작해요');
    this._arm('tokenwatch', TOKEN_WATCH_MS, () => this._tokenWatch());
  }
  _tokenSig() { try { return String(this.readToken()); } catch (_) { return null; } }
  _tokenWatch() {
    if (this._stopped) return;
    const sig = this._tokenSig();
    if (sig && sig !== this._revokedSig) {
      this._revoked = false; this._fails = 0; this._pollFails = 0; this._nextAttemptAt = 0; this._needFull = true;
      this.log('[uplink] 토큰 파일이 바뀌었어요 — 전송을 다시 시작해요');
      this._heartbeatTick(); this._pump(); this._pollSoon(0);
      return;
    }
    this._arm('tokenwatch', TOKEN_WATCH_MS, () => this._tokenWatch());
  }

  // ── HTTP ──
  _req(method, pathAndQuery, bodyStr, timeoutMs) {
    return new Promise((resolve, reject) => {
      let settled = false;
      const done = (fn, v) => { if (settled) return; settled = true; if (tm) this.timers.clearTimeout(tm); this._live.delete(req); fn(v); };
      let tm = null;
      let req;
      try {
        const token = this.readToken();
        const url = new URL(this.cfg.relay + pathAndQuery);
        const mod = url.protocol === 'https:' ? https : http;
        const headers = { Authorization: 'Bearer ' + token, Accept: 'application/json', 'User-Agent': 'eg-uplink/' + UPLINK_VERSION };
        let body = null;
        if (bodyStr !== null && bodyStr !== undefined) { body = Buffer.from(bodyStr, 'utf8'); headers['Content-Type'] = 'application/json'; headers['Content-Length'] = String(body.length); }
        req = mod.request({
          protocol: url.protocol, hostname: url.hostname.replace(/^\[|\]$/g, ''), port: url.port || undefined, path: url.pathname + url.search,
          method, headers, agent: false,
        }, (res) => {
          const chunks = [];
          let size = 0;
          res.on('data', (d) => {
            size += d.length;
            if (size > MAX_RESPONSE_BYTES) { try { req.destroy(new Error('응답이 너무 커요')); } catch (_) { /* noop */ } return; }
            chunks.push(d);
          });
          res.on('end', () => done(resolve, { status: res.statusCode, text: Buffer.concat(chunks).toString('utf8') }));
          res.on('error', (e) => done(reject, e));
        });
        this._live.add(req);
        req.on('error', (e) => done(reject, e));
        tm = this.timers.setTimeout(() => { try { req.destroy(new Error('시간 초과')); } catch (_) { /* noop */ } done(reject, new Error('시간 초과')); }, timeoutMs);
        if (body) req.write(body);
        req.end();
      } catch (e) { done(reject, e); }
    });
  }

  // ── 명령 롱폴 ──
  _pollSoon(ms) {
    if (this._stopped || this._revoked) return;
    this._arm('poll', ms, () => this._poll());
  }

  async _poll() {
    if (this._stopped || this._revoked) return;
    const t0 = this.mono.now();
    let next = 0;
    try {
      const res = await this._req('GET', '/v1/uplink/commands?cursor=' + this.store.state.cursor + '&wait=' + this.pollWaitS, null, (this.pollWaitS + 10) * 1000);
      if (this._stopped) return;
      if (res.status === 401 || res.status === 403) { this._revoke(res.status); return; }
      if (res.status === 204) {
        this._pollFails = 0;
        next = this.mono.now() - t0 < 500 ? 1000 : 0;     // 중계가 «기다리지 않고» 204 를 돌려주면 요청 폭주 — 최소 간격을 둬요
      } else if (res.status === 200) {
        await this._handleCommands(res.text);
        this._pollFails = 0;
        next = this.mono.now() - t0 < 500 ? 250 : 0;
      } else throw new Error('HTTP ' + res.status);
    } catch (e) {
      if (this._stopped) return;
      this._pollFails++;
      next = this._backoff(this._pollFails);
      if (this._pollFails === 1) this.log('[uplink] 명령 폴링 실패 — 백오프로 재시도해요 (' + String((e && e.message) || e).slice(0, 120) + ')');
    }
    this._pollSoon(next);
  }

  async _handleCommands(text) {
    let j;
    try { j = JSON.parse(text); } catch (_) { throw new Error('명령 응답이 JSON 이 아니에요'); }
    if (!isPlain(j) || !Array.isArray(j.commands) || j.commands.length > MAX_COMMANDS) throw new Error('명령 응답 모양이 규격이 아니에요');
    if (j.commands.length === 0) return;
    const results = [];
    let cursor = this.store.state.cursor;
    let sawCursor = false;
    const tBudget = this.mono.now();
    let handled = 0;
    let minSkipped = Infinity;
    for (const c of j.commands) {
      if (handled > 0 && this.mono.now() - tBudget > this.cmdBudgetMs) {       // 예산 소진 — 이 항목부터는 «처리하지 않고» 남겨요
        if (isPlain(c) && Number.isSafeInteger(c.cursor) && c.cursor < minSkipped) minSkipped = c.cursor;
        continue;
      }
      if (!isPlain(c) || typeof c.cmdId !== 'string' || !CMDID_RE.test(c.cmdId)) continue;       // 회신할 id 가 없으면 이 항목은 무시(감사도 못 남겨요 — 어떤 명령인지 말할 수 없어서)
      handled++;
      if (this.executor) {
        // 판정·실행·영수증·감사는 실행기가 해요(감사 한 줄 포함). 던지면 «내부 오류» 로 거절해서 같은 명령이 영원히 오지 않게 커서를 올려요.
        let out;
        try { out = this.executor({ cmdId: c.cmdId, cursor: c.cursor, cmd: c.cmd, proof: c.proof }); } catch (e) {
          this._warnOnce('exec', '[uplink] 명령 실행기가 던졌어요: ' + String((e && e.message) || e).slice(0, 120));
          out = { status: 'rejected', reason: 'internal-error', receipt: null };
        }
        const row = { cmdId: c.cmdId, status: out.status, reason: out.reason === undefined ? null : out.reason };
        if (out.receipt) row.receipt = out.receipt;
        results.push(row);
      } else {
        if (!this._audited.has(c.cmdId)) {
          let h = 'unparsed';
          if (typeof c.cmd === 'string' && c.cmd.length <= MAX_CMD_TEXT) {
            try { OP.parseCanonical(c.cmd); h = OP.cmdHash(c.cmd).toString('hex').slice(0, 8); } catch (_) { h = 'unparsed'; }
          }
          // «받았다» 는 사실이 디스크에 먼저 — 감사를 못 쓰면 회신도 안 해요(기록 없는 응답을 만들지 않아요).
          this.store.audit({ at: new Date(this.clock.now()).toISOString(), cmdId: c.cmdId, cmdHash: h, status: 'rejected', reason: 'not-implemented' });
          this._audited.add(c.cmdId);
          if (this._audited.size > 2000) this._audited.delete(this._audited.values().next().value);
        }
        results.push({ cmdId: c.cmdId, status: 'rejected', reason: 'not-implemented' });
      }
      if (Number.isSafeInteger(c.cursor) && c.cursor >= 0) { sawCursor = true; if (c.cursor > cursor) cursor = c.cursor; }
    }
    // 남긴 항목이 있으면 커서는 «남긴 것의 바로 앞» 을 못 넘어요 — 중계가 커서 순서대로 주지 않아도 남긴 명령이 건너뛰어지지 않게요.
    if (minSkipped !== Infinity) cursor = Math.max(this.store.state.cursor, Math.min(cursor, minSkipped - 1));
    if (!sawCursor && results.length) throw new Error('명령에 커서가 없어요');       // 커서를 못 올리면 같은 명령이 영원히 와요 — 폭주 대신 백오프
    if (results.length) {
      // 서명된 TOTP 사용 기록을 같은 회신에 실어요 — 어느 명령의 결과든 «최근 사용 기록» 이 함께 가서, 폰이 자기 명령의 영수증이 안 오거나 «잘못된 코드» 로 거절돼도 «그 코드가 다른 명령에 쓰였나» 를 볼 수 있어요.
      //   중계가 기록을 빼면 폰은 «확인 안 됨» 으로 남아요(숨길 수는 있어도 고칠 수는 없어요 — 보드 키 서명).
      const body = { results };
      let bodySig = null;
      if (this.spends) { try { const sp = this.spends(); if (Array.isArray(sp) && sp.length) { body.spends = sp; bodySig = sp.map((x) => (x && typeof x.sig === 'string' ? x.sig : '')).join(','); } } catch (_) { /* 기록을 못 내도 결과 회신은 나가요 */ } }
      const r = await this._req('POST', '/v1/uplink/results', JSON.stringify(body), this.requestTimeoutMs);
      if (this._stopped) return;
      if (r.status === 401 || r.status === 403) { this._revoke(r.status); return; }
      if (r.status < 200 || r.status >= 300) throw new Error('결과 회신 HTTP ' + r.status);
      if (bodySig !== null) { this._spendsOut = body.spends; this._spendsSig = bodySig; this._spendsDelivered = bodySig; }       // 회신에 실려 갔어요 — 같은 지문을 배치로 또 보내지 않아요(실패했다면 위에서 던져서 여기 안 와요)
    }
    if (cursor > this.store.state.cursor) {
      this.store.state.cursor = cursor;
      try { this.store.save(); } catch (e) { this._warnOnce('state', '[uplink] 상태 파일을 쓰지 못했어요 (' + (e && e.code ? e.code : e && e.message) + ')'); }
    }
  }
}

module.exports = { Transport, UPLINK_VERSION, MAX_BATCH_ITEMS, MAX_BATCH_BYTES };

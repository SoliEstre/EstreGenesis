'use strict';
// exec-state.cjs — 명령 실행 레인이 «디스크에 남기는 두 가지»: 영수증(receipt) 장부 · WebAuthn signCount 장부. 둘이 한 단일 기록자 잠금(uplink-exec.lock)을 나눠 써요.
//
// **영수증 장부 = 멱등성의 정본.** 정당한 명령이 실행됐는데 응답(결과 회신)이 중간에 사라지면 중계는 같은 명령을 «다시» 내밀어요. 그때 nonce 원장은 이미 그 nonce 를
//   소비했으니 정직하게 답하면 «nonce-replayed» 가 되고, 사람 눈에는 «실행됐는데 거절됐다» 로 보여요. 그래서 «명령이 소비된 뒤의 결과» 는 cmdHash 로 저장해 두고 재전달에는
//   저장한 영수증을 «그대로» 돌려줘요(재서명하지 않아요 — 시각·서명이 같은 바이트여야 «같은 영수증» 이에요).
//   **무엇을 저장하나 — 한 줄 규칙: nonce 가 소비된 명령의 결과만.** 소비 «전» 의 거절(형식·audience·시간·정책·증명 실패·원장/상태를 못 읽음 등)은 저장하지 않아요:
//   ① 소비 전 거절은 같은 봉투로 재시도해도 아무것도 잃지 않고(그대로 다시 판정), ② 저장하면 «증명을 안 거친» 입력(중계가 만든 형식만 맞는 쓰레기 명령)이 장부를 채워
//   정당한 영수증을 밀어낼 수 있고, ③ 증명에 따라 달라지는 거절(proof-too-weak · bad-signature …)을 cmdHash 만으로 굳히면 중계가 «틀린 증명을 먼저 내밀어» 정당한 명령을
//   영구 거절로 만들 수 있어요. 소비 후의 결과(accepted · stale-item · execution-failed · commit-failed)만이 «그 봉투의 최종 운명» 이에요.
//   보존은 7일 또는 1만 건 — 넘치면 가장 오래된 것부터(7일 지난 것 먼저, 그래도 넘치면 거절 영수증부터, 그다음 오래된 것).
//
// **signCount 장부 = 복제 의심 검사의 «저장값».** uplink-keys.json 의 credentials[] 는 «사람이 등록한» 파일이라 보드가 다시 쓰지 않아요(페어링 도구와 동시에 쓰면 한쪽 갱신이 사라져요).
//   그래서 보드가 올리는 카운터는 이 장부(uplink-counters.json)에 따로 두고, 검증이 쓰는 «저장값» = max(등록 때 값, 이 장부의 값) 이에요.
//   갱신은 비교-후-교체(CAS) — «읽었던 저장값과 같을 때만» 써요. 같은 카운터 +1 을 가진 서명 둘이 동시에 통과해도 하나만 저장돼요.
//   쓰기는 임시 파일 → fsync → rename 이고, 파일이 교체된 «뒤에만» 메모리를 바꿔요(저장 못 한 카운터는 올라간 게 아니에요).
//   장부가 손상이면 «열지 않고» 닫힌 채 실패해요(WebAuthn 만 — 잃은 카운터는 복제 의심 검사를 꺼 버려요). 영수증 장부는 캐시 성격이라 깨진 줄은 건너뛰고 한 번 말해요
//   (잃으면 재전달이 nonce-replayed 로 답할 뿐, 이중 실행은 nonce 원장이 막아요).

const fs = require('fs');
const path = require('path');
const OP = require('./opcmd.cjs');

const RETENTION_MS = 7 * 24 * 3600 * 1000;
const MAX_RECEIPTS = 10000;
const SLACK = 500;                       // 상한을 이만큼 넘을 때 한 번에 정리 — 매 건마다 전체 재기록을 하지 않으려고요
const HEX64 = /^[0-9a-f]{64}$/;
const isPlain = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

class ExecState {
  // opts — 시험 전용 상한 조절({max, slack, retentionMs}). 운영은 기본값(1만 건 · 7일)이에요.
  constructor(dir, log, opts) {
    const o = opts || {};
    this.max = o.max || MAX_RECEIPTS;
    this.slack = o.slack !== undefined ? o.slack : SLACK;
    this.retentionMs = o.retentionMs || RETENTION_MS;
    this.dir = dir;
    this.log = log || (() => {});
    this.lockFile = path.join(dir, 'uplink-exec.lock');
    this.receiptFile = path.join(dir, 'uplink-receipts.jsonl');
    this.counterFile = path.join(dir, 'uplink-counters.json');
    this._locked = false;
    this._receipts = new Map();          // cmdHash(hex) → {at, r}
    this._counters = new Map();          // credentialId → signCount
    this.counterError = null;            // 장부가 손상/못 읽음이면 코드 — WebAuthn 만 닫힌 채 실패해요
    this._warned = new Set();
  }

  _once(k, msg) { if (this._warned.has(k)) return; this._warned.add(k); this.log(msg); }

  open() {
    try { OP.acquireFileLock(this.lockFile); } catch (e) {
      if (e instanceof OP.OpcmdError) throw new Error('다른 프로세스가 명령 실행 상태를 쥐고 있어요 (uplink-exec.lock)');
      throw e;
    }
    this._locked = true;
    this._loadReceipts();
    this._loadCounters();
  }

  close() {
    if (!this._locked) return;
    this._locked = false;
    try { OP.releaseFileLock(this.lockFile); } catch (_) { /* 종료 훅이 한 번 더 시도해요 */ }
  }

  // ── 영수증 ──
  _loadReceipts() {
    let raw;
    try { raw = fs.readFileSync(this.receiptFile, 'utf8'); } catch (e) {
      if (e && e.code === 'ENOENT') return;
      throw new Error('uplink-receipts.jsonl 을 읽을 수 없어요 (' + (e && e.code) + ')');
    }
    let bad = 0;
    for (const line of raw.split('\n')) {
      if (!line.trim()) continue;
      let j;
      try { j = JSON.parse(line); } catch (_) { bad++; continue; }
      if (!isPlain(j) || typeof j.h !== 'string' || !HEX64.test(j.h) || !Number.isSafeInteger(j.at) || !isPlain(j.r)) { bad++; continue; }
      this._receipts.set(j.h, { at: j.at, r: j.r });
    }
    if (bad) this._once('rcpt-bad', '[uplink] 영수증 장부에 읽을 수 없는 줄 ' + bad + '개가 있어서 건너뛰었어요 (재전달 멱등성만 약해져요 — 이중 실행은 nonce 원장이 막아요)');
  }

  getReceipt(hashHex) {
    const e = this._receipts.get(hashHex);
    return e ? e.r : null;
  }

  // 소비된 명령의 결과를 영속해요. 못 쓰면 던져요 — 호출자가 «영수증은 응답으로 나가되 재전달 멱등성은 약해진다» 로 다뤄요.
  putReceipt(hashHex, receipt, nowMs) {
    if (!HEX64.test(hashHex)) throw new TypeError('putReceipt: hashHex');
    const line = JSON.stringify({ h: hashHex, at: nowMs, r: receipt }) + '\n';
    const fd = fs.openSync(this.receiptFile, 'a', 0o600);
    try { fs.writeSync(fd, line); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
    this._receipts.set(hashHex, { at: nowMs, r: receipt });
    if (this._receipts.size > this.max + this.slack) this._prune(nowMs);
  }

  receiptCount() { return this._receipts.size; }

  _prune(nowMs) {
    const entries = [...this._receipts.entries()].filter(([, v]) => v.at >= nowMs - this.retentionMs);
    if (entries.length > this.max) {
      // 거절 영수증부터 — 정당한 «accepted» 영수증이 재전달 멱등성의 본체라서요. 그다음엔 오래된 순.
      const rank = (v) => (v.r && v.r.status === 'accepted' ? 1 : 0);
      entries.sort((a, b) => rank(a[1]) - rank(b[1]) || a[1].at - b[1].at);
      entries.splice(0, entries.length - this.max);
      entries.sort((a, b) => a[1].at - b[1].at);
    }
    const text = entries.map(([h, v]) => JSON.stringify({ h, at: v.at, r: v.r }) + '\n').join('');
    const tmp = this.receiptFile + '.tmp';
    let fd;
    try {
      fd = fs.openSync(tmp, 'w', 0o600);
      fs.writeSync(fd, text);
      fs.fsyncSync(fd);
      fs.closeSync(fd);
      fd = undefined;
      fs.renameSync(tmp, this.receiptFile);
    } catch (e) {
      if (fd !== undefined) { try { fs.closeSync(fd); } catch (_) { /* noop */ } }
      try { fs.unlinkSync(tmp); } catch (_) { /* noop */ }
      this._once('rcpt-prune', '[uplink] 영수증 장부를 정리하지 못했어요 (' + (e && e.code ? e.code : e && e.message) + ')');
      return;
    }
    this._receipts = new Map(entries);
  }

  // ── signCount ──
  _loadCounters() {
    let raw;
    try { raw = fs.readFileSync(this.counterFile, 'utf8'); } catch (e) {
      if (e && e.code === 'ENOENT') return;
      this.counterError = 'state-unavailable';
      return;
    }
    try {
      const j = JSON.parse(raw);
      if (!isPlain(j) || j.v !== 1 || !isPlain(j.c)) throw new Error('shape');
      for (const k of Object.keys(j.c)) {
        if (!Number.isSafeInteger(j.c[k]) || j.c[k] < 0 || j.c[k] > 0xffffffff) throw new Error('count');
        this._counters.set(k, j.c[k]);
      }
    } catch (_) {
      this._counters.clear();
      this.counterError = 'state-corrupt';
      this._once('ctr-bad', '[uplink] uplink-counters.json 이 손상돼서 WebAuthn 증명을 받지 않아요 (복제 의심 검사의 저장값을 잃었어요 — 사람이 확인하고 파일을 고치거나 지워야 해요)');
    }
  }

  // 검증이 쓰는 «저장값» = max(등록 때 값, 장부 값)
  storedCount(credentialId, enrolled) {
    const c = this._counters.get(credentialId);
    return Math.max(Number.isSafeInteger(enrolled) ? enrolled : 0, c === undefined ? 0 : c);
  }

  // 비교-후-교체 — 읽었던 저장값(expected)과 지금 저장값이 같을 때만 써요. 성공이면 true, 값이 달라졌으면 false, 못 쓰면 던져요.
  commitCount(credentialId, enrolled, expected, next) {
    if (this.counterError) throw new Error(this.counterError);
    if (this.storedCount(credentialId, enrolled) !== expected) return false;
    if (!Number.isSafeInteger(next) || next < 0 || next > 0xffffffff) throw new TypeError('commitCount: next');
    const after = new Map(this._counters);
    after.set(credentialId, next);
    const obj = {};
    for (const [k, v] of after) obj[k] = v;
    const tmp = this.counterFile + '.tmp';
    let fd;
    try {
      fd = fs.openSync(tmp, 'w', 0o600);
      fs.writeSync(fd, JSON.stringify({ v: 1, c: obj }));
      fs.fsyncSync(fd);
      fs.closeSync(fd);
      fd = undefined;
      fs.renameSync(tmp, this.counterFile);
    } catch (e) {
      if (fd !== undefined) { try { fs.closeSync(fd); } catch (_) { /* noop */ } }
      try { fs.unlinkSync(tmp); } catch (_) { /* noop */ }
      throw e;
    }
    this._counters = after;          // 파일이 교체된 «뒤에만»
    return true;
  }
}

module.exports = { ExecState, RETENTION_MS, MAX_RECEIPTS };

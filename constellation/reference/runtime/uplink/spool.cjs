'use strict';
// spool.cjs — 아직 중계가 «받았다» 고 확인하지 않은 봉투를 디스크에 쌓아 두는 줄 단위 파일(uplink-spool.jsonl, 상한 5MB).
//
// **무엇이 스풀에 사나.** 번호(seq)가 붙은 것만 — 봉투(envelope)와 구멍(gap). 하트비트·항목 스냅샷은 «최신값 하나» 면 되는 값이라 스풀에 안 쌓아요(옛 하트비트를
//   나중에 몰아 보내는 건 거짓말이고, 스냅샷은 재접속 때 «전체» 로 다시 만들어요).
//   각 항목의 «위치(pos)» = 봉투는 seq, 구멍은 to. ack 는 «위치 ≤ ackSeq» 를 한꺼번에 지워요.
//
// **넘치면 «가장 오래된 것» 부터 버리고, 버린 범위를 구멍(gap{from,to,reason:'spool-overflow'})으로 남겨요 — 그 구멍도 보내져요.** 조용히 버리면 중계는 번호가 왜 비는지
//   모르고(전송 실패와 구별이 안 돼요), «봉투가 0개 도착» 이 «보드가 조용했다» 와 같아 보여요. 구멍은 «여기서 N개를 못 보냈다» 를 같은 길로 말하는 항목이에요.
//   구멍은 항상 스풀의 맨 앞에 하나로 합쳐져요(버리는 건 늘 가장 오래된 비-구멍 항목이라 구멍과 맞닿아 있어요).
//
// **바닥값(floor) — 번호 하한의 두 번째 보관소.** 파일 첫 줄에 {kind:'floor', seq} 를 둬요 — «지금까지 ack 로 확정된 가장 큰 번호». ack 로 스풀이 비어도 이 줄은 남아서(항목이 아니라
//   머리말이라 비워지지 않아요) 상태 파일(uplink-state.json)을 잃거나 깨도 번호가 되감기지 않아요 — 되감기면 중계가 새 봉투를 «이미 받은 번호» 로 버리고 아무도 모르거든요.
//   머리는 ack 가 다시 쓰는 같은 rename 안에서 갱신돼요(따로 쓰는 비용 0).
//
// **디스크 규율.** 평소엔 줄을 «덧붙이고» fsync, 지우거나(ack) 구멍을 넣을 땐 임시 파일에 전체를 쓰고 rename(쓰다 죽어도 옛 것이나 새 것). 줄바꿈 없이 끝난 마지막 줄(쓰다 만 것)은
//   적재 때 버려요 — 그 항목은 아직 보내진 적이 없어요(디스크에 확정된 뒤에만 보내므로). 깨진 중간 줄은 건너뛰고 한 번 말해요.

const fs = require('fs');

const GAP_RESERVE = 200;       // 구멍 항목 한 줄이 들어갈 여유 — 오버플로 모드에선 이만큼 비워서 구멍을 넣고도 상한 안에 있어요

const posOf = (item) => (item.kind === 'gap' ? item.to : item.seq);

class Spool {
  constructor(opts) {
    this.file = opts.file;
    this.maxBytes = opts.maxBytes;
    this.log = opts.log || (() => {});
    this.entries = [];            // 위치 오름차순
    this._dirty = [];             // 아직 디스크에 안 덧붙인 항목들
    this._rewrite = false;
    this.maxPos = 0;
    this.floor = 0;               // ack 로 확정된 가장 큰 위치(머리 줄)
  }

  load() {
    let raw;
    try { raw = fs.readFileSync(this.file, 'utf8'); } catch (e) {
      if (e && e.code === 'ENOENT') return;
      throw new Error('스풀을 읽을 수 없어요 (' + (e && e.code) + ')');
    }
    const endsNl = raw.length === 0 || raw.endsWith('\n');
    const lines = raw.split('\n');
    if (endsNl) lines.pop();
    let skipped = 0;
    for (let i = 0; i < lines.length; i++) {
      let item = null;
      try { item = JSON.parse(lines[i]); } catch (_) { item = null; }
      if (item && item.kind === 'floor') { if (Number.isSafeInteger(item.seq) && item.seq > this.floor) this.floor = item.seq; continue; }
      const ok = item && ((item.kind === 'envelope' && Number.isSafeInteger(item.seq) && item.seq > 0)
        || (item.kind === 'gap' && Number.isSafeInteger(item.from) && Number.isSafeInteger(item.to) && item.from > 0 && item.to >= item.from));
      if (!ok) { if (!(i === lines.length - 1 && !endsNl)) skipped++; this._rewrite = true; continue; }
      this.entries.push({ pos: posOf(item), item, bytes: Buffer.byteLength(lines[i]) + 1 });
    }
    if (!endsNl) this._rewrite = true;       // 끝 줄바꿈 없는 파일에 덧붙이면 두 줄이 같이 깨져요 — 정리해서 다시 써요
    this.entries.sort((a, b) => a.pos - b.pos);
    this.maxPos = this.entries.length ? this.entries[this.entries.length - 1].pos : 0;
    if (skipped) this.log('[uplink] 스풀에서 깨진 줄 ' + skipped + '개를 건너뛰었어요');
  }

  push(item) {
    const line = JSON.stringify(item);
    const e = { pos: posOf(item), item, bytes: Buffer.byteLength(line) + 1 };
    this.entries.push(e);
    this._dirty.push(e);
    if (e.pos > this.maxPos) this.maxPos = e.pos;
  }

  total() { let t = 0; for (const e of this.entries) t += e.bytes; return t; }
  pending() { let n = 0; for (const e of this.entries) if (e.item.kind === 'envelope') n++; return n; }

  // 상한 초과분을 «가장 오래된 비-구멍» 부터 버리고 구멍으로 합쳐요. 버린 «봉투 수» 를 돌려줘요(구멍 자체는 세지 않아요).
  //   **히스테리시스** — 상한을 넘으면 상한이 아니라 «상한의 80%» 까지 한 번에 내려요. 경계에서 한 줄 넘칠 때마다 («한 개 버림 → 전체 다시 쓰기(fsync)») 를 하면 중계가 오래 죽어 있는 동안
  //   프레임마다 5MB 를 다시 쓰고 서버 이벤트 루프를 막아요(실측: 한 틱 24ms, 하루 수백 GB). 80% 로 내려 두면 다음 재기록은 ~1MB 의 새 트래픽 뒤에야 와요.
  //   자르기는 한 번의 순회(splice 반복 아님) — 버릴 개수가 많아도 O(n)이에요.
  _enforceCap() {
    let total = this.total();
    if (total <= this.maxBytes) return 0;
    const target = Math.max(0, Math.min(this.maxBytes - GAP_RESERVE, Math.floor(this.maxBytes * 0.8)));
    let dropped = 0;
    let from = null;
    let to = null;
    let gapFrom = null;
    let gapTo = null;
    const kept = [];
    for (const e of this.entries) {
      if (e.item.kind === 'gap') { gapFrom = gapFrom === null ? e.item.from : Math.min(gapFrom, e.item.from); gapTo = gapTo === null ? e.item.to : Math.max(gapTo, e.item.to); total -= e.bytes; continue; }
      if (total > target) {
        total -= e.bytes;
        dropped++;
        from = from === null ? e.pos : Math.min(from, e.pos);
        to = to === null ? e.pos : Math.max(to, e.pos);
        continue;
      }
      kept.push(e);
    }
    if (from === null) { return 0; }      // 구멍만 남은 극단 — 버릴 봉투가 없어요(구멍은 한 줄로 합쳐 둔 채)
    if (gapFrom !== null) { from = Math.min(from, gapFrom); to = Math.max(to, gapTo); }
    const gap = { kind: 'gap', from, to, reason: 'spool-overflow' };
    kept.unshift({ pos: to, item: gap, bytes: Buffer.byteLength(JSON.stringify(gap)) + 1 });
    this.entries = kept;
    this._rewrite = true;
    return dropped;
  }

  _writeAll() {
    const tmp = this.file + '.tmp';
    let fd;
    try {
      fd = fs.openSync(tmp, 'w', 0o600);
      const head = this.floor > 0 ? JSON.stringify({ kind: 'floor', seq: this.floor }) + '\n' : '';
      const text = head + this.entries.map((e) => JSON.stringify(e.item) + '\n').join('');
      if (text) fs.writeSync(fd, text);
      fs.fsyncSync(fd);
      fs.closeSync(fd);
      fd = undefined;
      fs.renameSync(tmp, this.file);
    } catch (e) {
      if (fd !== undefined) { try { fs.closeSync(fd); } catch (_) { /* noop */ } }
      try { fs.unlinkSync(tmp); } catch (_) { /* noop */ }
      throw e;
    }
    this._dirty = [];
    this._rewrite = false;
  }

  // 디스크에 확정해요. 돌려주는 값 = 이번에 버린 봉투 수. 쓰기에 실패하면 던져요(메모리 상태는 그대로라 다음 호출이 다시 시도해요).
  flushDisk() {
    const dropped = this._enforceCap();
    if (this._rewrite) { this._writeAll(); return { dropped }; }
    if (!this._dirty.length) return { dropped };
    const buf = Buffer.from(this._dirty.map((e) => JSON.stringify(e.item) + '\n').join(''), 'utf8');
    let fd;
    let startSize = -1;
    try {
      fd = fs.openSync(this.file, 'a', 0o600);
      startSize = fs.fstatSync(fd).size;
      let off = 0;
      while (off < buf.length) {
        const w = fs.writeSync(fd, buf, off, buf.length - off);
        if (!(w > 0)) throw new Error('no progress');
        off += w;
      }
      fs.fsyncSync(fd);
    } catch (e) {
      if (fd !== undefined) { try { fs.closeSync(fd); } catch (_) { /* noop */ } fd = undefined; }
      if (startSize >= 0) { try { fs.truncateSync(this.file, startSize); } catch (_) { /* 최선 */ } }
      throw e;
    } finally {
      if (fd !== undefined) { try { fs.closeSync(fd); } catch (_) { /* noop */ } }
    }
    this._dirty = [];
    return { dropped };
  }

  // 위치 ≤ upTo 를 지워요. 돌려주는 값 = 지운 항목 수. 바닥값도 같이 올려요(머리 줄은 같은 재기록에서 갱신).
  ack(upTo) {
    const before = this.entries.length;
    this.entries = this.entries.filter((e) => e.pos > upTo);
    this._dirty = this._dirty.filter((e) => e.pos > upTo);
    const removed = before - this.entries.length;
    if (removed) this._rewrite = true;
    if (upTo > this.floor) { this.floor = upTo; this._rewrite = true; }
    return removed;
  }

  // «앞서 있는 중계» — 중계가 이미 floor 번까지 받았다고 말하는데 우리 번호가 그보다 낮을 때(상태·스풀을 모두 잃은 보드). 아직 못 보낸 항목을 floor+1 부터 «순서 그대로» 다시 매겨요.
  //   구멍은 «버린 봉투 수(구간 길이)» 를 보존해서 새 번호 자리에 다시 놓아요(번호만 옮기고 손실의 크기는 그대로). 돌려주는 값 = 다음에 쓸 번호.
  renumberAbove(floor) {
    let n = floor + 1;
    for (const e of this.entries) {
      if (e.item.kind === 'gap') {
        const span = e.item.to - e.item.from + 1;
        e.item = Object.assign({}, e.item, { from: n, to: n + span - 1 });
        n += span;
      } else {
        e.item = Object.assign({}, e.item, { seq: n });
        n += 1;
      }
      e.pos = posOf(e.item);
      e.bytes = Buffer.byteLength(JSON.stringify(e.item)) + 1;
    }
    this.floor = Math.max(this.floor, floor);
    this._dirty = [];
    this._rewrite = true;
    this.maxPos = this.entries.length ? this.entries[this.entries.length - 1].pos : floor;
    return n;
  }
}

module.exports = { Spool, GAP_RESERVE };

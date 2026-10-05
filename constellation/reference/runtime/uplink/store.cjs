'use strict';
// store.cjs — 업링크의 «디스크 상태» 한 곳: 단일 기록자 잠금 · 상태 파일(uplink-state.json) · 감사 로그(uplink-audit.jsonl).
//
// **잠금은 하나예요(uplink.lock).** 스풀·상태·감사 세 파일을 한 기록자가 쥐게 해서 «둘째 프로세스가 같은 디렉터리에서 업링크를 켜는» 사고(같은 트리를 쓰는 두 보드 ·
//   시험이 실제 런타임 폴더를 가리킴)를 막아요. 잠금 회수(낡은 pid)·종료 훅은 opcmd.cjs 의 것을 «그대로» 써요(복사하지 않아요 — 회수 경합 처리가 두 벌로 낡아 가지 않게).
//
// **상태 파일에 무엇이 있나.** { v:1, boardId, lastSeq, cursor, dropped, items:{[itemId]:{rev,hash,status,sealed?}} }
//   · boardId  — 이 상태가 «어느 보드 신원» 의 것인가. 설정의 boardId 가 바뀌면 번호·커서·항목·스풀은 옛 신원의 것이라 «새로 시작» 해요(한 번 말해요) — 옛 번호를 새 신원에
//                이어 붙이면 새 스트림이 번호 1 이 아니라 옛 값에서 시작하고, 명령 커서가 건너뛰어지고, 봉인 aad 의 boardId 가 옛 값인 봉투가 남아요.
//   · lastSeq  — 지금까지 «ack 로 확정된» 가장 큰 위치. 재시작 후 번호 이어붙이기의 하한이에요(스풀이 비어도 번호가 0 으로 돌아가지 않게 — 중계는 seq 로 중복을 거르니까
//                번호가 되감기면 새 봉투가 «이미 받은 것» 으로 버려져요). **이 파일을 잃어도** 스풀 머리의 «바닥값» 이 같은 하한을 따로 쥐고(spool.cjs), 둘 다 잃으면
//                전송층이 중계의 ack 에 맞춰요(uplink.cjs «앞서 있는 중계»).
//   · cursor   — 명령 롱폴 커서.  · dropped — 스풀 오버플로로 버린 봉투의 누적 수(하트비트에 실려요).
//   · items    — 결정 항목별 rev/내용 해시/봉인된 봉투(재시작에 rev 를 되감지도, 불필요하게 올리지도 않으려고 «봉투째» 보관해요).
//   쓰기는 임시 파일 → fsync → rename 이라 쓰다 죽어도 옛 파일이나 새 파일이에요(반쯤 쓴 파일이 남지 않아요). 모드 0600(봉인된 봉투 + 보드 상태).

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const OP = require('./opcmd.cjs');

const fresh = () => ({ v: 1, boardId: null, lastSeq: 0, cursor: 0, dropped: 0, items: {} });
const isUint = (n) => Number.isSafeInteger(n) && n >= 0;
const ITEM_KEY_RE = /^sd:[0-9a-f]{24}$/;       // 항목 기록의 열쇠는 «가명 id» 뿐이에요 — 원래 id(주제가 담긴 글귀)를 키로 쥔 옛 모양·손 편집본은 버려요(내보내지 않아요)
const SECRET_RE = /^[0-9a-f]{64}$/;

class UplinkStore {
  // opts.boardId — 있으면 상태 파일의 boardId 와 대조해요(다르면 새로 시작). 없으면 대조하지 않아요(스풀·상태만 단독으로 쓰는 시험용).
  constructor(dir, log, opts) {
    this.dir = dir;
    this.log = log || (() => {});
    this.boardId = opts && typeof opts.boardId === 'string' ? opts.boardId : null;
    this.lockFile = path.join(dir, 'uplink.lock');
    this.stateFile = path.join(dir, 'uplink-state.json');
    this.auditFile = path.join(dir, 'uplink-audit.jsonl');
    this.spoolFile = path.join(dir, 'uplink-spool.jsonl');
    this.secretFile = path.join(dir, 'uplink-secret');
    this._locked = false;
    this.state = fresh();
    this.stateLost = false;
    this.secret = null;            // hex 64자 — 가명(HMAC)의 열쇠. 보드 밖으로 안 나가요
  }

  open() {
    try { OP.acquireFileLock(this.lockFile); } catch (e) {
      if (e instanceof OP.OpcmdError) throw new Error('다른 프로세스가 업링크 상태를 쥐고 있어요 (uplink.lock)');
      throw e;
    }
    this._locked = true;
    this._load();
    this._loadSecret();
  }

  // 가명 열쇠 — 한 번 만들면 바뀌지 않아요(바뀌면 모든 가명·항목 id 가 달라져서 중계에 쌓인 항목이 고아가 돼요). 모양이 깨졌으면 새로 만들고 한 번 말해요.
  _loadSecret() {
    let raw = null;
    try { raw = fs.readFileSync(this.secretFile, 'utf8').trim(); } catch (e) { if (!e || e.code !== 'ENOENT') throw new Error('uplink-secret 을 읽을 수 없어요 (' + (e && e.code) + ')'); }
    if (raw !== null && SECRET_RE.test(raw)) { this.secret = raw; return; }
    if (raw !== null) this.log('[uplink] uplink-secret 이 규격이 아니라 새로 만들어요 — 중계에 있는 옛 가명(항목 id 포함)과는 이어지지 않아요');
    const fresh64 = crypto.randomBytes(32).toString('hex');
    const tmp = this.secretFile + '.tmp';
    let fd;
    try {
      fd = fs.openSync(tmp, 'w', 0o600);
      fs.writeSync(fd, fresh64 + String.fromCharCode(10));
      fs.fsyncSync(fd);
      fs.closeSync(fd);
      fd = undefined;
      fs.renameSync(tmp, this.secretFile);
    } catch (e) {
      if (fd !== undefined) { try { fs.closeSync(fd); } catch (_) { /* noop */ } }
      try { fs.unlinkSync(tmp); } catch (_) { /* noop */ }
      throw e;
    }
    this.secret = fresh64;
  }

  close() {
    if (!this._locked) return;
    this._locked = false;
    try { OP.releaseFileLock(this.lockFile); } catch (_) { /* 종료 훅이 한 번 더 시도해요 */ }
  }

  _load() {
    let raw;
    try { raw = fs.readFileSync(this.stateFile, 'utf8'); } catch (e) {
      if (e && e.code === 'ENOENT') return;
      throw new Error('uplink-state.json 을 읽을 수 없어요 (' + (e && e.code) + ')');
    }
    try {
      const j = JSON.parse(raw);
      if (!j || j.v !== 1 || !isUint(j.lastSeq) || !isUint(j.cursor) || !isUint(j.dropped) || !j.items || typeof j.items !== 'object' || Array.isArray(j.items)) throw new Error('shape');
      if (j.boardId !== undefined && j.boardId !== null && typeof j.boardId !== 'string') throw new Error('shape');
      const items = {};
      for (const k of Object.keys(j.items)) if (ITEM_KEY_RE.test(k)) items[k] = j.items[k];
      if (this.boardId !== null && typeof j.boardId === 'string' && j.boardId !== this.boardId) {
        // 보드 신원이 바뀌었어요 — 옛 신원의 번호·커서·항목·«아직 못 보낸 봉투(스풀)» 는 새 스트림의 것이 아니에요. 스풀을 새 신원으로 보내면 남의 이력을 내 이름으로 올리는 셈이라 지워요.
        try { fs.unlinkSync(this.spoolFile); } catch (__) { /* 없으면 그만 */ }
        this.log('[uplink] 보드 id 가 바뀌어서 번호·커서·항목·미전송 스풀을 새로 시작해요 (옛 id 의 것은 새 스트림에 이어 붙이지 않아요)');
        return;
      }
      this.state = { v: 1, boardId: this.boardId !== null ? this.boardId : (typeof j.boardId === 'string' ? j.boardId : null), lastSeq: j.lastSeq, cursor: j.cursor, dropped: j.dropped, items };
    } catch (_) {
      // 깨진 상태 파일을 «조용히 새로 시작» 하지 않아요 — 옆으로 치우고 한 번 말해요. 번호 하한은 스풀 머리의 바닥값이 대신 쥐고(그것도 없으면 전송층이 중계의 ack 에 맞춰요),
      //   항목의 rev 는 «시계 바닥» 에서 다시 시작해서 옛 값보다 작아지지 않아요(items.cjs).
      try { fs.renameSync(this.stateFile, this.stateFile + '.corrupt-' + Date.now()); } catch (__) { /* 최선 */ }
      this.stateLost = true;
      this.log('[uplink] uplink-state.json 이 깨져 있어서 옆으로 치우고 새로 시작해요 — 번호는 스풀의 바닥값에서 이어가고(없으면 중계의 ack 에 맞춰요), 항목 rev 는 시계 바닥에서 다시 시작해요');
    }
    if (this.state.boardId === null && this.boardId !== null) this.state.boardId = this.boardId;
  }

  // 임시 파일 → fsync → rename. 실패는 던져요(호출자가 한 번 로그하고 다음 기회에 다시 써요).
  save() {
    if (this.boardId !== null) this.state.boardId = this.boardId;
    const tmp = this.stateFile + '.tmp';
    let fd;
    try {
      fd = fs.openSync(tmp, 'w', 0o600);
      fs.writeSync(fd, JSON.stringify(this.state));
      fs.fsyncSync(fd);
      fs.closeSync(fd);
      fd = undefined;
      fs.renameSync(tmp, this.stateFile);
    } catch (e) {
      if (fd !== undefined) { try { fs.closeSync(fd); } catch (_) { /* noop */ } }
      try { fs.unlinkSync(tmp); } catch (_) { /* noop */ }
      throw e;
    }
  }

  // 감사 한 줄 — 추가 전용 + fsync. «받았다» 는 사실이 «처리했다» 보다 먼저 디스크에 있어야 해서 동기예요.
  audit(obj) {
    const line = JSON.stringify(obj) + '\n';
    const fd = fs.openSync(this.auditFile, 'a', 0o600);
    try {
      fs.writeSync(fd, line);
      fs.fsyncSync(fd);
    } finally { fs.closeSync(fd); }
  }
}

module.exports = { UplinkStore, fresh };

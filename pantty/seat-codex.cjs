'use strict';
/**
 * seat-codex.cjs — 상주 좌석 드라이버, codex app-server 판 (Pantty §1 다섯 연산).
 *
 * `seat.py` 와 같은 계약을 다른 하네스로 구현해요. 규격이 얇은 이유대로, 여기서 새로 만드는 건
 * 벤더가 안 주는 부분뿐이에요 — 세션 유지·취소·문맥 회계·압축·열거는 app-server 프로토콜이 줘요.
 *
 * **왜 exec 가 아니라 app-server 인가.** `codex exec` 로는 턴 종료 신호가 «프로세스 종료» 와
 * 같은 사건이라, §1-1 이 요구하는 «살아 있음 / 프로세스 종료 / 턴 종료» 3분이 드라이버 몫으로
 * 남아요. app-server 는 연결이 살아 있는 채로 `turn/completed` 알림이 와서 그 3분이 **전송 계층의
 * 성질**이 돼요. 취소·압축·문맥도 마찬가지로 프로토콜 1급 연산이에요.
 *
 * **압축 주기(§3)를 훅 없이 닫아요 — 대신 조건이 붙어요.**
 *   claude 판은 PreCompact/SessionStart 훅 쌍에 기대요. codex 에도 그 이름이 있지만(preCompact ·
 *   postCompact), 프로젝트가 **신뢰** 상태가 아니면 project-local 훅 층이 통째로 조용히 빠져요.
 *   그래서 이 드라이버는 훅에 기대지 않고 세 단계를 직접 쥐어요:
 *       ① 물질화  = 어댑터가 저작한 턴으로 핸드오프를 디스크에 쓰게 하고 **파일이 실제로 바뀌었는지 확인**
 *       ② 압축    = thread/compact/start
 *       ③ 재주입  = thread/inject_items
 *   이게 성립하려면 **자동압축이 꺼져 있어야** 해요. 하네스가 제 문턱으로 먼저 압축하면 그 경계
 *   하나가 정확히 물질화를 건너뛰고, §3 이 경고하는 게 바로 그거예요. 그래서 자동압축 차단은
 *   설정이 아니라 **관문 조건**으로 두고, 미충족이면 상주를 거부해요.
 *
 * **문이 둘이에요** (§4). 보드가 저작한 글은 가드를 통과하는 문으로만 들어가고, 어댑터가 저작한
 * 절차 명령은 다른 문으로 들어가요. 보드 내용이 두 번째 문에 닿을 인자 자리가 아예 없어요.
 * 가드 코드는 `submit-envelope.cjs` 를 **재사용**해요 — 사실 파일만 이 경로 것으로 갈아끼워요.
 * 하네스마다 가드를 복사하는 게 그 모듈이 스스로 금지한 «조용히 갈라지는 사본» 이라서요.
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const envelope = require('./submit-envelope.cjs');

const CODEX_FACTS = path.join(__dirname, 'dispatch-facts-codex.json');

/** 못 잰 값은 0 이 아니라 null 로 돌려요 — 0 은 「다 고정층」이라는 그럴듯한 거짓말이 돼요. */
const UNMEASURED = null;

class SeatUnavailable extends Error {
  constructor(msg, detail) {
    super(msg);
    this.name = 'SeatUnavailable';
    this.detail = detail || {};
  }
}

/** 턴 종료 신호. «살아 있음» 과도 «프로세스가 끝남» 과도 구분돼요 (§1-1). */
class TurnResult {
  constructor(o) {
    Object.assign(this, o);
  }
  /** 모델이 실제로 돌았나. 커서 전진의 유일한 근거예요 (§4 마지막 요건). */
  get processed() {
    return this.status === 'completed' && this.items.includes('agentMessage');
  }
  get interrupted() {
    return this.status === 'interrupted';
  }
}

class CodexSeat {
  /**
   * @param {object} o
   * @param {string} o.seatId          좌석 식별자 (재시작해도 유지 — §2)
   * @param {string} o.cwd             좌석이 붙박이는 작업 디렉터리
   * @param {string} [o.model]         모델 id
   * @param {string} [o.effort]        추론 강도
   * @param {string} [o.sandbox]       read-only | workspace-write | danger-full-access (§2.5-5 경계)
   * @param {string} o.handoffPath     압축 전 물질화 대상 파일 (§3-1)
   * @param {number} [o.compactAt]     문맥 점유 비율 임계 (기본 0.75)
   * @param {number} [o.autoCompactLimit] 하네스 자동압축 문턱. 드라이버가 경계를 쥐려면 손 닿지 않게 올려요.
   */
  constructor(o) {
    const opts = o || {};
    if (!opts.seatId) throw new SeatUnavailable('seatId 가 필요해요 — 좌석 정체성은 재시작을 넘어 유지돼요 (§2).');
    if (!opts.cwd) throw new SeatUnavailable('cwd 가 필요해요 — 좌석은 한 작업 디렉터리에 붙박여요.');
    if (!opts.handoffPath) {
      throw new SeatUnavailable('handoffPath 가 필요해요 — 물질화 대상이 없으면 §3 의 압축 주기를 닫을 수 없고, 그러면 상주로 돌면 안 돼요.');
    }
    this.seatId = opts.seatId;
    this.cwd = opts.cwd;
    this.model = opts.model || null;
    this.effort = opts.effort || null;
    this.sandbox = opts.sandbox || 'workspace-write';
    this.handoffPath = opts.handoffPath;
    this.compactAt = typeof opts.compactAt === 'number' ? opts.compactAt : 0.75;
    this.autoCompactLimit = typeof opts.autoCompactLimit === 'number' ? opts.autoCompactLimit : 100000000;

    this.child = null;
    this.threadId = null;
    this.currentTurnId = null;
    this._nextId = 1;
    this._pending = new Map();
    this._events = [];
    this._buf = '';
    this._usage = null;
    this._floor = UNMEASURED;
    this._turns = 0;
    this._compactions = 0;
    this._lastProcessedAt = null;
    this._heartbeatAt = null;
    this._exit = null;
    this._listeners = [];
    this._gate = null;
    this._denials = [];
    /** 감독자가 승인 판단을 끼우고 싶으면 여기에. 없으면 거부가 기본 — 침묵은 기본값이 아니에요. */
    this.onApproval = opts.onApproval || null;

    envelope.useFacts(CODEX_FACTS);
  }

  // ── 관측 ────────────────────────────────────────────────────────────────
  /** 주입도 화면에 보여야 해요 (§2.5-2: 출처가 안 보이면 운영자는 안 친 글자의 출처를 몰라요). */
  on(fn) { this._listeners.push(fn); return this; }
  _emit(ev) { for (const fn of this._listeners) { try { fn(ev); } catch (e) { /* 관측자 사고가 좌석을 죽이지 않아요 */ } } }

  /** 작업 루프 **안에서** 찍어요. 별도 타이머가 찍으면 루프가 박혀도 계속 올라가요 (§6-2). */
  _beat(where) {
    this._heartbeatAt = Date.now();
    this._emit({ kind: 'heartbeat', where, at: this._heartbeatAt });
  }

  // ── 전송 ────────────────────────────────────────────────────────────────
  _call(method, params) {
    if (!this.child) return Promise.reject(new SeatUnavailable('좌석이 안 떠 있어요.'));
    const id = this._nextId++;
    this.child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params: params || {} }) + '\n');
    return new Promise((res, rej) => {
      this._pending.set(id, { res, rej });
      setTimeout(() => {
        if (this._pending.has(id)) { this._pending.delete(id); rej(new Error('timeout: ' + method)); }
      }, 300000);
    });
  }
  _notify(method, params) {
    this.child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method, params: params || {} }) + '\n');
  }
  _onData(d) {
    this._buf += d.toString('utf8');
    let i;
    while ((i = this._buf.indexOf('\n')) >= 0) {
      const line = this._buf.slice(0, i).trim();
      this._buf = this._buf.slice(i + 1);
      if (!line) continue;
      let m;
      try { m = JSON.parse(line); } catch (e) { continue; }
      if (m.id !== undefined && (m.result !== undefined || m.error !== undefined)) {
        const p = this._pending.get(m.id);
        this._pending.delete(m.id);
        if (p) { m.error ? p.rej(new Error(JSON.stringify(m.error))) : p.res(m.result); }
        continue;
      }
      // 서버 → 클라이언트 **요청**. 답하지 않으면 거부가 아니라 **정지**예요 — 턴이 영원히
      // 안 끝나고, 감시 층에는 「오래 걸리는 작업」과 똑같이 보여요. 실측으로 한 번 물렸어요.
      if (m.id !== undefined && m.method) { this._answerServerRequest(m); continue; }
      if (!m.method) continue;
      this._events.push(m);
      if (m.method === 'thread/tokenUsage/updated' && m.params) this._usage = m.params.tokenUsage;
      this._emit({ kind: 'notification', method: m.method, params: m.params });
    }
  }
  /**
   * 승인 요청에 **반드시** 답해요. 기본은 거부이고, 거부도 기록으로 남겨요.
   *
   * 왜 기본이 거부인가: 무인 좌석엔 물어볼 사람이 없어요. 그리고 진짜 경계는 이 층이 아니라
   * `--sandbox` 예요 (§2.5-5) — 승인 요청이 온다는 건 이미 샌드박스 **밖**을 시도했다는 뜻이라,
   * 무인 상태에서 예 라고 답하는 건 경계를 설정 한 줄로 여는 것과 같아요. 감독자가 판단을
   * 끼우고 싶으면 `onApproval` 로 주세요 — 없으면 거부가 기본값이지 침묵이 기본값이 아니에요.
   */
  _answerServerRequest(m) {
    const method = m.method;
    const reject = '무인 상주 좌석이라 승인권자가 없어요. 샌드박스 안에서 되는 방법으로 진행하세요.';
    let result;
    try {
      const decided = typeof this.onApproval === 'function' ? this.onApproval(method, m.params) : null;
      if (decided) result = decided;
      else if (method === 'execCommandApproval' || method === 'applyPatchApproval') result = { decision: { denied: { rejection: reject } } };
      else if (method === 'item/commandExecution/requestApproval' || method === 'item/fileChange/requestApproval') result = { decision: 'decline' };
      else if (method === 'item/permissions/requestApproval') result = { permissions: [] };
      else if (method === 'item/tool/requestUserInput') result = { answers: [] };
      else result = {};
    } catch (e) {
      result = {};
    }
    this._denials.push({ method, at: Date.now() });
    this._emit({ kind: 'approval', method, answered: true, denied: !this.onApproval });
    this.child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: m.id, result }) + '\n');
  }

  _waitFor(method, ms) {
    const start = this._events.length;
    const t0 = Date.now();
    return new Promise((res) => {
      const iv = setInterval(() => {
        this._beat('wait:' + method);
        const hit = this._events.slice(start).find((e) => e.method === method);
        if (hit) { clearInterval(iv); return res(hit); }
        if (this._exit) { clearInterval(iv); return res(null); }
        if (Date.now() - t0 > (ms || 600000)) { clearInterval(iv); return res(null); }
      }, 250);
    });
  }

  // ── 기동 ────────────────────────────────────────────────────────────────
  async start() {
    const args = [];
    // 자동압축은 드라이버가 경계를 쥐기 위해 손 닿지 않게 올려요 (§3 관문 조건).
    args.push('-c', 'model_auto_compact_token_limit=' + this.autoCompactLimit);
    args.push('-c', 'sandbox_mode="' + this.sandbox + '"');
    // 무인 좌석엔 승인권자가 없어요. 물어보지 않게 하되, 그래도 물어오면 답은 해요
    // (`_answerServerRequest`) — 「안 물어볼 것」과 「물어와도 안 멎을 것」은 다른 보장이에요.
    args.push('-c', 'approval_policy="never"');
    if (this.model) args.push('-c', 'model="' + this.model + '"');
    if (this.effort) args.push('-c', 'model_reasoning_effort="' + this.effort + '"');
    args.push('app-server', '--listen', 'stdio://');

    this.child = spawn('codex', args, { cwd: this.cwd, stdio: ['pipe', 'pipe', 'pipe'], shell: false });
    this.child.stdout.on('data', (d) => this._onData(d));
    this.child.stderr.on('data', (d) => {
      const s = d.toString('utf8').trim();
      if (s) this._emit({ kind: 'stderr', text: s.slice(0, 500) });
    });
    // 상주에서는 프로세스가 살아 있는 게 정상이라, 종료는 그 자체로 고장이에요 (§2.5-4).
    this.child.on('exit', (code, sig) => {
      this._exit = { code, sig, at: Date.now() };
      this._emit({ kind: 'exit', code, sig });
    });

    const init = await this._call('initialize', {
      clientInfo: { name: 'pantty-seat-codex', version: '0.1.0', title: 'Pantty resident seat (' + this.seatId + ')' },
      capabilities: { experimentalApi: true },
    });
    this._notify('initialized', {});
    this.userAgent = init && init.userAgent;

    const th = await this._call('thread/start', { cwd: this.cwd });
    this.threadId = th.thread.id;
    this._emit({ kind: 'thread', threadId: this.threadId });

    this._gate = await this._checkCompactionCycle();
    if (!this._gate.ok) {
      const why = this._gate.why.join(' · ');
      await this.stop();
      throw new SeatUnavailable('압축 주기(§3)를 닫을 수 없어요 — 상주로 돌리지 않아요: ' + why, this._gate);
    }
    this._beat('start');
    return { threadId: this.threadId, gate: this._gate };
  }

  /**
   * §3 관문. 세 단계가 **전부** 가능한가. 하나라도 아니면 상주 거부예요 —
   * 턴마다 새로 뜨는 배치보다 나쁜 걸 조용히 굴리지 않으려고요.
   */
  async _checkCompactionCycle() {
    const why = [];
    // ① 물질화 — 쓸 수 있는 자리인가.
    let materialize = false;
    try {
      fs.mkdirSync(path.dirname(this.handoffPath), { recursive: true });
      fs.appendFileSync(this.handoffPath, '');
      materialize = true;
    } catch (e) {
      why.push('물질화 대상에 쓸 수 없어요 (' + this.handoffPath + '): ' + e.message);
    }
    // ③ 재주입 — 프로토콜이 정말 받는가. 있다고 믿지 않고 빈 호출로 물어봐요.
    let reinject = false;
    try {
      await this._call('thread/inject_items', { threadId: this.threadId, items: [] });
      reinject = true;
    } catch (e) {
      const msg = String(e.message || '');
      // 인자 트집은 «메서드는 있다» 는 뜻이라 통과, 메서드 부재는 실패.
      if (/method not found|unknown method|-32601/i.test(msg)) why.push('thread/inject_items 가 없어요 — 재주입 경로 부재.');
      else reinject = true;
    }
    // ②' 자동압축이 꺼져 있는가. 이게 안 되면 ①이 있어도 «건너뛰는 경계» 가 남아요.
    const autoHeld = this.autoCompactLimit >= 10000000;
    if (!autoHeld) why.push('자동압축 문턱이 드라이버 손 밖이에요 — 하네스가 먼저 압축하면 그 경계가 물질화를 건너뛰어요.');

    return { ok: materialize && reinject && autoHeld, materialize, reinject, autoHeld, why };
  }

  // ── ① submit — 문 두 개 (§4) ────────────────────────────────────────────
  /** 보드가 저작한 글. 가드를 반드시 지나요. 명령이 될 수 없어요. */
  async submitBoard(content, origin, task) {
    const built = envelope.buildSubmission({ content, origin, task });
    this._emit({ kind: 'submit', door: 'board', origin: origin || null, mentions: envelope.countMentions(content), preview: built.text.slice(0, 200) });
    return this._send(built.text);
  }

  /** 어댑터가 저작한 글. 절차 명령을 쓸 수 있어요 — 보드 내용은 이 문에 닿을 자리가 없어요. */
  async submitOwn(text) {
    if (typeof text !== 'string' || !text.length) throw new envelope.UnsafeSubmission('빈 제출은 보내지 않아요.', {});
    this._emit({ kind: 'submit', door: 'own', preview: text.slice(0, 200) });
    return this._send(text);
  }

  async _send(text) {
    if (!this.threadId) throw new SeatUnavailable('스레드가 없어요 — start() 를 먼저.');
    const t0 = Date.now();
    const mark = this._events.length;
    const r = await this._call('turn/start', { threadId: this.threadId, input: [{ type: 'text', text }] });
    this.currentTurnId = r && r.turn && r.turn.id;
    const done = await this._waitFor('turn/completed', 900000);
    this.currentTurnId = null;
    this._beat('turn-end');

    const after = this._events.slice(mark);
    const items = after
      .filter((e) => e.method === 'item/completed' && e.params && e.params.item)
      .map((e) => e.params.item.type);
    const texts = after
      .filter((e) => e.method === 'item/completed' && e.params && e.params.item && e.params.item.type === 'agentMessage')
      .map((e) => e.params.item.text);
    const status = done && done.params && done.params.turn ? done.params.turn.status : (this._exit ? 'process-exited' : 'unknown');

    const tr = new TurnResult({
      status,
      items,
      text: texts.join('\n'),
      submitted: text,
      elapsedS: (Date.now() - t0) / 1000,
      usage: this._usage,
      turnId: r && r.turn && r.turn.id,
    });
    this._turns += 1;
    if (tr.processed) this._lastProcessedAt = Date.now();
    // 고정 바닥은 **이 스레드의 첫 턴** 에서만 잴 수 있어요 (§3 의 «줄지 않는 몫»).
    if (this._floor === UNMEASURED && this._turns === 1 && this._usage && this._usage.last) {
      this._floor = this._usage.last.inputTokens;
      this._emit({ kind: 'floor-measured', floor: this._floor });
    }
    this._emit({ kind: 'turn-end', status, processed: tr.processed, elapsedS: tr.elapsedS });
    return tr;
  }

  // ── ② cancel ────────────────────────────────────────────────────────────
  /** 턴 밖에서 진행 중인 턴을 끊어요. 프로세스를 죽이지 않아서 스레드는 그대로예요. */
  async cancel() {
    if (!this.currentTurnId) return { cancelled: false, why: '진행 중인 턴이 없어요' };
    const turnId = this.currentTurnId;
    await this._call('turn/interrupt', { threadId: this.threadId, turnId });
    this._emit({ kind: 'cancel', turnId });
    return { cancelled: true, turnId };
  }

  // ── ③ context signal ────────────────────────────────────────────────────
  /**
   * §1-3 은 «회수 가능한 몫 / 회수 불가한 고정 바닥» 으로 **분해된** 값을 요구해요.
   * 이 하네스는 그 축으로 안 줘요 — 주는 분해는 토큰 «종류» 예요. 그래서 유도해요.
   *
   * **`total` 을 점유로 읽으면 안 돼요.** 실측: 한 스레드에서 45457 → 68361 → 91385 → 114652 로
   * 오르기만 하고, 성공한 압축을 지나서도 **안 떨어져요**. 누적 계수기예요. 그걸 문맥 여유로 쓰면
   * 임계는 반드시 넘고 다시는 안 내려와요 — §1 이 경고한 thrash 가 다른 문으로 들어오는 거예요.
   */
  context() {
    const u = this._usage;
    if (!u || !u.last) {
      return { occupied: UNMEASURED, floor: this._floor, reclaimable: UNMEASURED, window: null, ratio: null, why: '아직 턴이 없어서 못 쟀어요' };
    }
    const occupied = u.last.inputTokens;
    const window = u.modelContextWindow || null;
    const floor = this._floor;
    const reclaimable = floor === UNMEASURED ? UNMEASURED : Math.max(0, occupied - floor);
    return {
      occupied,
      floor,
      reclaimable,
      window,
      ratio: window ? occupied / window : null,
      cumulativeTotal: u.total ? u.total.totalTokens : null,
      note: 'cumulativeTotal 은 누적이에요 — 점유가 아니고 정책의 근거로 쓰면 안 돼요.',
    };
  }

  // ── ④ compaction cycle (§3) ─────────────────────────────────────────────
  /** 정책은 «비율» 로. 토큰 상수는 설정이 바뀌면 틀려요. */
  async maybeCompact() {
    const c = this.context();
    if (c.ratio === null) return { compacted: false, why: '문맥 비율을 못 쟀어요 — 추측으로 압축하지 않아요', context: c };
    if (c.ratio < this.compactAt) return { compacted: false, why: '여유 있음 (' + c.ratio.toFixed(2) + ' < ' + this.compactAt + ')', context: c };
    return this.compact();
  }

  /**
   * 물질화 → 압축 → 재주입. 세 단계 전부 드라이버가 쥐어요.
   * 물질화는 «시켰다» 가 아니라 **파일이 실제로 바뀌었나** 로 확인해요 — 시킨 것과 된 것은 달라요.
   */
  async compact() {
    const before = this.context();

    // ① 물질화 — 그리고 검증.
    const beforeStat = statOrNull(this.handoffPath);
    const ask = [
      'Before this session is compacted, write everything you know that exists only in this context',
      'to the handoff file at:',
      '  ' + this.handoffPath,
      'Include: in-flight procedure detail, agreed policy, resume pointers, and anything a summary would lose.',
      'Overwrite the file. Reply with the number of lines you wrote.',
    ].join('\n');
    const wrote = await this.submitOwn(ask);
    const afterStat = statOrNull(this.handoffPath);
    const materialized = !!afterStat && (!beforeStat || afterStat.mtimeMs > beforeStat.mtimeMs || afterStat.size !== beforeStat.size);
    if (!materialized) {
      // §3 은 세 단계가 전부여야 한다고 적어요. 하나가 실제로 안 됐으면 압축하지 않아요 —
      // 압축은 되돌릴 수 없고, 여기서 밀어붙이면 잃는 게 정확히 요약이 제일 못 지키는 부분이에요.
      this._emit({ kind: 'compact-refused', why: 'materialize-unverified' });
      return { compacted: false, why: '물질화가 확인되지 않았어요 (핸드오프 파일이 안 바뀜) — 압축을 중단해요', turn: wrote, context: before };
    }

    // ② 압축.
    const mark = this._events.length;
    await this._call('thread/compact/start', { threadId: this.threadId });
    await this._waitFor('turn/completed', 300000);
    const compacted = this._events.slice(mark).some(
      (e) => e.method === 'item/completed' && e.params && e.params.item && /ontextCompaction/i.test(String(e.params.item.type))
    );
    this._beat('compact');

    // ③ 재주입.
    let reinjected = false;
    try {
      const card = fs.readFileSync(this.handoffPath, 'utf8');
      await this._call('thread/inject_items', {
        threadId: this.threadId,
        items: [{ type: 'text', text: '[pantty] handoff re-injected after compaction\n\n' + card }],
      });
      reinjected = true;
    } catch (e) {
      this._emit({ kind: 'reinject-failed', why: String(e.message).slice(0, 300) });
    }

    this._compactions += 1;
    const after = this.context();
    return {
      compacted,
      materialized,
      reinjected,
      before,
      after,
      // 비용 레버가 아니에요 — 고정 바닥은 그대로라 총량은 덜 줄거나 안 줄 수도 있어요 (§3).
      reclaimedFromReclaimable:
        before.reclaimable !== UNMEASURED && after.reclaimable !== UNMEASURED ? before.reclaimable - after.reclaimable : UNMEASURED,
    };
  }

  // ── ⑤ liveness (§5 · §6) ────────────────────────────────────────────────
  /**
   * 세 상태예요 — ok / dead / unknown. unknown 은 «관측하지 못함» 이지 «괜찮음» 이 아니에요.
   * unknown 으로 재시작하지 않고, 조용히 지나가지도 않아요 (§6-1).
   */
  liveness(maxAgeS) {
    const maxAge = typeof maxAgeS === 'number' ? maxAgeS : 900;
    if (this._exit) return { state: 'dead', why: '프로세스가 종료됐어요 (상주에서는 종료 자체가 고장)', exit: this._exit };
    if (!this.child) return { state: 'dead', why: '좌석이 안 떠 있어요' };
    if (this._lastProcessedAt === null) {
      return { state: 'unknown', why: '모델이 도는 턴이 아직 한 번도 없어요 — 존재는 능력이 아니에요 (§5)', ageS: null };
    }
    const ageS = (Date.now() - this._lastProcessedAt) / 1000;
    const beatAgeS = this._heartbeatAt ? (Date.now() - this._heartbeatAt) / 1000 : null;
    // 살아 있는 프로세스가 살아 있는 좌석은 아니에요 — 작업 루프 안에서 찍힌 맥이 멎었으면 죽음으로 읽어요 (§6-2).
    if (beatAgeS !== null && beatAgeS > maxAge) {
      return { state: 'dead', why: '작업 루프 맥박이 멎었어요 (' + beatAgeS.toFixed(0) + '초) — 프로세스는 살아 있어요', ageS, beatAgeS };
    }
    return {
      state: ageS <= maxAge ? 'ok' : 'unknown',
      why: '마지막 처리된 턴 ' + ageS.toFixed(0) + '초 전',
      ageS,
      beatAgeS,
      turns: this._turns,
      compactions: this._compactions,
    };
  }

  /** 진짜 왕복. 예산이 소진된 좌석은 여기서만 드러나요 — 모델을 안 부르는 신호는 모델을 시험하지 않아요. */
  async probe() {
    const r = await this.submitOwn('Reply with exactly: PANTTY_OK');
    return { healthy: r.processed && /PANTTY_OK/.test(r.text || ''), turn: r };
  }

  /** 커서를 밀기 직전에 부르세요. 봉투가 아니라 처리 증거를 봐요 (§4 마지막 요건). */
  static assertAdvanceable(turnResult) {
    if (!turnResult || !turnResult.processed) {
      throw new envelope.UnsafeSubmission(
        '모델 턴 0 — 제출이 처리되지 않았어요. 커서를 전진시키면 이 메시지를 잃어요.',
        { status: turnResult && turnResult.status, items: turnResult && turnResult.items }
      );
    }
    return true;
  }

  async stop() {
    if (this.child) { try { this.child.kill(); } catch (e) {} }
    this.child = null;
  }
}

function statOrNull(p) {
  try { return fs.statSync(p); } catch (e) { return null; }
}

module.exports = { CodexSeat, TurnResult, SeatUnavailable, CODEX_FACTS };

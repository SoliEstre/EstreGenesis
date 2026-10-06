'use strict';
// index.cjs — 업링크 조립: 설정 읽기 → 투영기 · 상태/키/스풀 · 전송층을 엮고 서버가 부를 «세 개의 손잡이» 를 돌려줘요.
//
//   start({dir, getState, getAgents, inject, notice, selectionState, selectionIssuer, log}) → {onBoardBroadcast(msg), onStateChange(text), stop()} | null
//
// **서버와의 계약 (가산 · 읽기 전용).** 서버는 «uplink.json 이 있을 때만» 이 파일을 require 해요(지연 require — 없으면 이 코드는 로드조차 안 돼요: 타이머 0 · 네트워크 0 · 파일 0).
//   이 모듈이 서버에서 읽는 건 셋뿐이에요 — ① 보드로 가는 프레임(onBoardBroadcast) ② state.json 의 새 텍스트(onStateChange) ③ 접속 현황 getter(getAgents).
//   명령 실행은 서버가 «verb 마다 하나씩» 넘기는 고정 실행기(inject — 열쇠 집합이 정확히 exec.cjs 의 INJECTORS)로만 일어나요. 범용 «프레임을 통째로 받는» hook 은 없어요.
//   notice 는 «운영자 목소리가 아닌» 서버 알림 함수 한 개(고정 · 얼린 객체 — 열쇠 집합이 정확히 exec.cjs 의 NOTICERS)예요: 실행기가 TOTP 대치를 의심할 때 보드·메인에 서버 이름으로 알려요. 운영자 실행기(inject)와 별개의 객체라 실행기 집합은 그대로 5개예요.
//   inject 가 없거나 규격이 아니면 받은 명령은 전부 거절돼요(exec-unavailable). selectionState 는 서버가 «이 선택지는 이미 닫혔다» 를 아는 만큼만, selectionIssuer 는 서버가 «이 선택지의 답을 보낼 발급자» 로 아는 에이전트를 알려 주는 읽기 전용 조회예요(둘 다 읽기만 — 서버 상태를 바꾸지 않아요).
//
// **start 는 던지지 않아요.** 설정이 틀렸거나 토큰·잠금이 안 되면 «이 업링크는 안 켠다» 를 한 줄로 말하고 null 을 돌려줘요 — 서버는 업링크 없이 그대로 돌아요.
//   (한 줄만: 같은 사유를 반복해서 말하지 않아요.)

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { validate } = require('./config.cjs');
const { createProjector, ID_RE } = require('./project.cjs');
const { UplinkStore } = require('./store.cjs');
const { KeyReader, DecisionSync } = require('./items.cjs');
const { Transport, UPLINK_VERSION } = require('./uplink.cjs');
const { createExecutor, SelectionTracker } = require('./exec.cjs');

const REACHABLE_MS = 7 * 24 * 3600 * 1000;      // §13.9.4 reachable = «최근 붙은 이력이 있는 임시 피어» — 최근의 기준은 7일(그보다 오래 안 보이면 offline)
const EPHEMERAL_KINDS = new Set(['peer', 'upstream', 'collab']);
const MAX_AGENTS = 64;
const ROLE_RE = /^[A-Za-z0-9_.-]{1,32}$/;
const PRESENCE_NAMES = new Set(['MainChanged', 'AgentHello', 'ConnectionInfo']);
const TOKEN_RE = /^[\x21-\x7e]{8,512}$/;

function start(opts) {
  const log = (opts && opts.log) || (() => {});
  let store = null;
  try {
    const dir = opts.dir;
    let raw;
    try { raw = JSON.parse(fs.readFileSync(path.join(dir, 'uplink.json'), 'utf8')); } catch (_) {
      log('[uplink] 비활성 — uplink.json 을 읽거나 파싱할 수 없어요');
      return null;
    }
    const v = validate(raw, { dir });
    if (!v.ok) { log('[uplink] 비활성 — uplink.json 이 규격이 아니에요: ' + v.error); return null; }
    const cfg = v.cfg;

    // 토큰 — 값은 어디에도 안 찍어요(길이도). 읽기는 요청마다 하되 mtime 이 같으면 캐시를 써요(회전을 재시작 없이 따라가요).
    let tokCache = null;
    let tokSig = null;
    const readToken = () => {
      const st = fs.statSync(cfg.tokenFile);
      const sig = st.mtimeMs + ':' + st.size;
      if (sig !== tokSig || tokCache === null) {
        const t = fs.readFileSync(cfg.tokenFile, 'utf8').trim();
        if (!TOKEN_RE.test(t)) throw new Error('토큰 파일 내용이 규격이 아니에요');
        tokCache = t; tokSig = sig;
      }
      return tokCache;
    };
    try { readToken(); } catch (e) {
      log('[uplink] 비활성 — 토큰 파일을 읽을 수 없거나 규격이 아니에요 (tokenFile)');
      return null;
    }

    store = new UplinkStore(dir, log, { boardId: cfg.boardId });
    try { store.open(); } catch (e) {
      log('[uplink] 비활성 — ' + (e && e.message ? e.message : '상태를 열 수 없어요'));
      store = null;
      return null;
    }

    const clock = (opts && opts.clock) || { now: () => Date.now() };
    const projector = createProjector({ channels: cfg.channels, secret: store.secret });   // 가명 열쇠는 store 가 쥔 보드 로컬 비밀(밖으로 안 나가요)
    const keys = new KeyReader(cfg.keysFile, log);
    const sync = new DecisionSync({ boardId: cfg.boardId, visibility: cfg.visibility, store, keys, log, clock });
    const startedAt = clock.now();
    const boardVersion = (opts && opts.boardVersion) || process.env.EG_BOARD_VERSION || 'unknown';
    let lastStateText = null;
    let lastTurnAt = null;
    const seenSenders = new Set();
    let primaryId = null;

    const iso = (ms) => (Number.isFinite(ms) && ms > 0 ? new Date(ms).toISOString() : null);
    const ids = (s) => projector.ident(s, ID_RE);

    // ── 하트비트 ──
    function declaredChannels() {
      const out = cfg.channels.map((c) => ({ id: c.id, obs: c.obs }));
      // native:* — «모른다» 가 기본이에요. 선언이 없는 채널을 «관측 안 함» 으로 접으면 조용한 채널이 «아무 일도 없었다» 처럼 읽혀요.
      if (!out.some((c) => c.id === 'native:*')) out.push({ id: 'native:*', obs: 'unknown' });
      return out;
    }
    function agentRows(now) {
      let a = null;
      try { a = opts.getAgents ? opts.getAgents() : null; } catch (_) { a = null; }
      const live = a && Array.isArray(a.live) ? a.live : [];
      const known = a && Array.isArray(a.known) ? a.known : [];
      primaryId = a && typeof a.primaryId === 'string' ? ids(a.primaryId) : null;
      const rows = new Map();
      for (const l of live) {
        const id = ids(l && l.agentId);
        if (!id) continue;
        rows.set(id, { id, role: typeof l.role === 'string' && ROLE_RE.test(l.role) ? l.role : 'unknown', presence: 'present', lastSeen: iso(now) });
      }
      for (const k of known) {
        const id = ids(k && k.agentId);
        if (!id || rows.has(id)) continue;
        const seen = Number.isFinite(k.lastSeenAt) ? k.lastSeenAt : 0;
        const kind = typeof k.kind === 'string' && ROLE_RE.test(k.kind) ? k.kind : 'unknown';
        const presence = EPHEMERAL_KINDS.has(kind) && seen > 0 && now - seen <= REACHABLE_MS ? 'reachable' : 'offline';
        rows.set(id, { id, role: kind, presence, lastSeen: iso(seen) });
      }
      return [...rows.values()].sort((x, y) => (x.id < y.id ? -1 : x.id > y.id ? 1 : 0)).slice(0, MAX_AGENTS);
    }
    function buildHeartbeat() {
      const now = clock.now();
      const agents = agentRows(now);
      const keyInfo = cfg.visibility === 'sealed' ? keys.read() : { version: 'envelope' };
      const item = {
        kind: 'heartbeat', boardVersion, uplinkVersion: UPLINK_VERSION, uptimeS: Math.max(0, Math.floor((now - startedAt) / 1000)), clock: iso(now),
        agents, channels: declaredChannels(),
        hub: { present: !!primaryId && agents.some((x) => x.id === primaryId && x.presence === 'present'), lastTurnAt },
        openItems: sync.openCount, spool: transport.stats(), keysVersion: keyInfo.version,
      };
      if (cfg.dashboardUrl) item.dashboardUrl = cfg.dashboardUrl;
      // «변했는가» 의 서명 — 시계·가동 시간·스풀 수(프레임마다 변함)·«지금 붙어 있는 에이전트의 lastSeen»(=지금)은 빼요. 안 빼면 매 호출이 변화로 읽혀요.
      const sig = crypto.createHash('sha256').update(JSON.stringify({
        a: agents.map((x) => [x.id, x.role, x.presence, x.presence === 'present' ? null : x.lastSeen]), c: item.channels, h: item.hub.present, o: item.openItems, k: item.keysVersion, v: boardVersion,
      })).digest('hex');
      return { item, sig };
    }

    function syncDecisions() {
      if (!lastStateText) return;
      const r = sync.run(lastStateText);
      if (!r) return;
      if (r.keysChanged) transport.requestFull();
      else if (r.changes.length) transport.mergeSnapshot(r.changes);
      if (r.keysChanged || r.changes.length) transport.notifyChange();
    }

    // 명령 실행 레인 — 서버가 «고정 실행기» 를 안 줬거나 상태를 못 열면 `createExecutor` 가 «전부 거절» 실행기를 돌려줘요(던지지 않아요).
    const selections = new SelectionTracker({ secret: store.secret, serverState: opts.selectionState, serverIssuer: opts.selectionIssuer });
    const executor = createExecutor({
      cfg, dir: opts.dir, keys, store, getState: () => (opts.getState ? opts.getState() : lastStateText), selections,
      inject: opts.inject, notice: opts.notice, now: () => clock.now(), audit: (row) => store.audit(row), log,
    });

    const transport = new Transport({
      cfg, store, log, clock, readToken, executor: (c) => executor.handle(c), spends: () => (typeof executor.spendRecords === 'function' ? executor.spendRecords() : []),
      timers: opts.timers, rand: opts.rand, spoolMaxBytes: opts.spoolMaxBytes,
      flushMs: opts.flushMs, heartbeatMs: opts.heartbeatMs, pollWaitS: opts.pollWaitS, requestTimeoutMs: opts.requestTimeoutMs,
      buildHeartbeat,
      snapshotProvider: () => { syncDecisions(); return sync.fullEntries(); },
      onTick: () => { syncDecisions(); },
    });

    // 시작 시점의 상태로 한 번 동기 — 변경분은 버려요(첫 성공 전송이 «전체» 스냅샷을 싣기 때문).
    try { lastStateText = opts.getState ? opts.getState() : null; } catch (_) { lastStateText = null; }
    if (lastStateText) sync.run(lastStateText);

    log('[uplink] 시작 — board=' + cfg.boardId + ' relay=' + cfg.relay + ' visibility=' + cfg.visibility);
    transport.start();

    return {
      onBoardBroadcast(msg) {
        selections.note(msg);
        const env = projector.project(msg);
        const nm = msg && msg.type === 'CUSTOM' && typeof msg.name === 'string' ? msg.name : null;
        if (nm && PRESENCE_NAMES.has(nm)) transport.notifyChange();
        if (!env) return;
        // 처음 보는 발신자는 «접속 현황이 바뀌었을 수 있다» 는 신호예요(접속 해제는 안 보여요 — 30초 주기가 잡아요).
        if (env.from && !seenSenders.has(env.from)) { if (seenSenders.size < 512) seenSenders.add(env.from); transport.notifyChange(); }
        if (primaryId && env.from === primaryId && env.class !== 'transport' && env.class !== 'liveness' && env.class !== 'handshake' && env.class !== 'notice') lastTurnAt = iso(env.ts !== null ? env.ts : clock.now());
        transport.enqueue(env);
      },
      onStateChange(text) {
        if (typeof text !== 'string') return;
        lastStateText = text;
        syncDecisions();
      },
      stop() {
        try { transport.stop(); } catch (_) { /* noop */ }
        try { executor.close(); } catch (_) { /* noop */ }
        if (store) { store.close(); store = null; }
      },
      _transport: transport,
    };
  } catch (e) {
    if (store) { try { store.close(); } catch (_) { /* noop */ } }
    try { log('[uplink] 비활성 — 시작 중 오류: ' + String((e && e.message) || e).slice(0, 160)); } catch (_) { /* noop */ }
    return null;
  }
}

module.exports = { start, REACHABLE_MS };

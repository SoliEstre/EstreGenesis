#!/usr/bin/env node
// §13.30 roundtable server-core smoke — self-contained: spawns the reference server on a
// scratch port inside a temp dir (no state pollution), attaches 3 fake agents + 1 board,
// and exercises the deterministic floor end-to-end: room lifecycle, fan-out + single
// summary ack, all four guards (rate / consecutive / autoHop / stall-signal), human
// soft-yield reset, notice-reply surfacing, floor-queue registration (including the
// "raise a hand while the chain is capped" case), room artifacts (fetch / update with
// delta broadcast / persistence / non-participant rejection), and closed-room rejection.
//
// Usage: node roundtable-smoke.cjs            (from this scripts/ dir)
//        SMOKE_PORT=17878 node roundtable-smoke.cjs
// Exit 0 = all checks pass. Requires Node >= 22 (global WebSocket client).
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const PORT = Number(process.env.SMOKE_PORT) || 17878;
const URL_ = `ws://127.0.0.1:${PORT}/ws`;
const SERVER = path.join(__dirname, '..', 'server.cjs');
const results = [];
const T = (name, ok, note) => { results.push({ name, ok }); console.log((ok ? '  ✓ ' : '  ✗ ') + name + (note ? ' — ' + note : '')); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function mkClient(kind, agentId) {
  const c = { kind, agentId, ws: new WebSocket(URL_), inbox: [], open: false };
  c.ws.onopen = () => { c.open = true; if (kind === 'agent') c.ws.send(JSON.stringify({ type: 'HELLO', agentId, agentName: agentId, clientId: agentId + '-c', protocolVersion: '0.1' })); };
  c.ws.onmessage = (e) => { try { c.inbox.push(JSON.parse(e.data)); } catch {} };
  c.send = (o) => c.ws.send(JSON.stringify(o));
  c.find = (fn) => c.inbox.filter(fn);
  c.custom = (name) => c.inbox.filter((m) => m.type === 'CUSTOM' && m.name === name);
  return c;
}

(async () => {
  // isolated server copy in a temp dir — rooms.json / ws-history land there, not in the repo
  const td = fs.mkdtempSync(path.join(os.tmpdir(), 'rt-smoke-'));
  fs.mkdirSync(path.join(td, 'public'), { recursive: true });
  for (const f of ['server.cjs', 'push.cjs', 'ws-core.cjs']) fs.copyFileSync(path.join(__dirname, '..', f), path.join(td, f));
  const srv = spawn(process.execPath, ['server.cjs'], { cwd: td, env: Object.assign({}, process.env, { PORT: String(PORT) }), stdio: 'ignore' });
  await sleep(1500);

  try {
    const A = mkClient('agent', 'agent-a'), B = mkClient('agent', 'agent-b'), C = mkClient('agent', 'agent-c');
    const BOARD = mkClient('board');
    await sleep(600);
    if (!(A.open && B.open && C.open && BOARD.open)) { console.error('CONNECT FAIL'); process.exit(1); }

    BOARD.send({ type: 'CUSTOM', name: 'RoomCreate', value: { topic: 'smoke room', mode: 'temporary', participants: ['agent-a', 'agent-b', 'agent-c'], budgets: { maxConsecutive: 2, ratePerMin: 5, maxAutoHop: 3, stallRounds: 3 } } });
    await sleep(300);
    const created = A.custom('RoomCreated')[0];
    T('RoomCreate reaches participants', !!created, created && created.value.roomId);
    const roomId = created && created.value.roomId;

    A.send({ type: 'CUSTOM', name: 'Say', roomId, msgId: 'sm-1', value: { text: 'hello room' } });
    await sleep(250);
    T('fan-out: b receives', B.find((m) => m.msgId === 'sm-1').length === 1);
    T('fan-out: c receives', C.find((m) => m.msgId === 'sm-1').length === 1);
    T('fan-out: sender not echoed', A.find((m) => m.msgId === 'sm-1' && m.name === 'Say').length === 0);
    const ack = A.custom('Ack').find((m) => m.value && m.value.ackFor === 'sm-1');
    T('single summary delivered ack (from=room:*)', !!ack && String(ack.value.from).startsWith('room:') && ack.value.recipients === 2);

    A.send({ type: 'CUSTOM', name: 'Say', roomId, msgId: 'sm-2', value: { text: '2' } });
    await sleep(120);
    A.send({ type: 'CUSTOM', name: 'Say', roomId, msgId: 'sm-3', value: { text: '3' } });
    await sleep(250);
    T('consecutive cap: 3rd utterance parked', B.find((m) => m.msgId === 'sm-3').length === 0);
    T('consecutive cap: RoomGuard notified', A.custom('RoomGuard').some((m) => m.value.rule === 'consecutive'));

    B.send({ type: 'CUSTOM', name: 'Say', roomId, msgId: 'sm-4', value: { text: 'b1' }, addressee: ['agent-c'] });
    await sleep(120);
    C.send({ type: 'CUSTOM', name: 'Say', roomId, msgId: 'sm-5', value: { text: 'c1' } });
    await sleep(250);
    T('autoHop: within-cap delivered', C.find((m) => m.msgId === 'sm-4').length === 1);
    T('autoHop: over-cap parked', A.find((m) => m.msgId === 'sm-5').length === 0);
    T('autoHop: RoomStall broadcast', A.custom('RoomStall').some((m) => m.value.reason === 'autoHop-cap'));

    BOARD.send({ type: 'CUSTOM', name: 'Say', roomId, msgId: 'sm-6', value: { text: 'human input' } });
    await sleep(250);
    T('human msg: delivered with speakerClass stamp', A.find((m) => m.msgId === 'sm-6' && m.speakerClass === 'human-operator').length === 1);
    T('human msg: RoomYield event', B.custom('RoomYield').length >= 1);
    B.send({ type: 'CUSTOM', name: 'Say', roomId, msgId: 'sm-7', value: { text: 'after reset' } });
    await sleep(250);
    T('autoHop reset by human input', C.find((m) => m.msgId === 'sm-7').length === 1);

    B.send({ type: 'CUSTOM', name: 'Say', roomId, msgId: 'sm-8', notice: true, value: { text: 'automated notice' } });
    await sleep(120);
    C.send({ type: 'CUSTOM', name: 'Say', roomId, msgId: 'sm-9', replyTo: 'sm-8', value: { text: 'auto-reply to notice (violation)' } });
    await sleep(250);
    T('notice-reply surfaced as RoomGuard', C.custom('RoomGuard').some((m) => m.value.rule === 'notice-reply'));

    A.send({ type: 'CUSTOM', name: 'Say', roomId, msgId: 'sm-10', floorIntent: { intent: 'request', bid: 5 }, value: { text: 'floor request' } });
    await sleep(250);
    const fl = B.custom('RoomFloor').pop();
    T('floor request registered even when chain-capped', !!fl && fl.value.queue.some((q) => q.agentId === 'agent-a' && q.bid === 5));

    // §13.30.5 artifacts — fetch(empty) → update(header+decision+summary) → delta broadcast → versioned re-fetch
    A.send({ type: 'CUSTOM', name: 'RequestRoomArtifacts', value: { roomId } });
    await sleep(250);
    const art0 = A.custom('RoomArtifacts').pop();
    T('artifacts fetch: empty initial state, version 0', !!art0 && art0.value.version === 0 && art0.value.artifacts && art0.value.artifacts.header === null);
    B.send({ type: 'CUSTOM', name: 'RoomArtifactsUpdate', value: { roomId, header: { text: 'objective: smoke' }, decision: { text: 'use two layers' }, summary: { text: 'digest v1', covers_until: 'sm-9' } } });
    await sleep(250);
    const artEv = C.custom('RoomArtifacts').pop();
    T('artifacts update: delta broadcast to participants', !!artEv && artEv.value.delta && !!artEv.value.delta.header && !!artEv.value.delta.decision && !!artEv.value.delta.summary && artEv.value.version === 1);
    A.send({ type: 'CUSTOM', name: 'RequestRoomArtifacts', value: { roomId } });
    await sleep(250);
    const art1 = A.custom('RoomArtifacts').pop();
    T('artifacts re-fetch: persisted with version', !!art1 && art1.value.version === 1 && art1.value.artifacts.header && art1.value.artifacts.header.text === 'objective: smoke' && art1.value.artifacts.decisions.length === 1 && art1.value.artifacts.summary.covers_until === 'sm-9');

    C.send({ type: 'CUSTOM', name: 'RoomLeave', value: { roomId } });
    await sleep(200);
    C.send({ type: 'CUSTOM', name: 'Say', roomId, msgId: 'sm-11', value: { text: 'after leave' } });
    await sleep(250);
    T('non-participant parked after RoomLeave', A.find((m) => m.msgId === 'sm-11').length === 0 && C.custom('RoomGuard').some((m) => m.value.rule === 'not-participant'));
    C.send({ type: 'CUSTOM', name: 'RoomArtifactsUpdate', value: { roomId, header: { text: 'hijack attempt' } } });
    await sleep(250);
    T('non-participant artifacts update ignored', C.custom('RoomGuard').some((m) => m.value.rule === 'not-participant' && m.value.action === 'ignored'));

    BOARD.send({ type: 'CUSTOM', name: 'RoomClose', value: { roomId, reason: 'smoke done' } });
    await sleep(250);
    T('RoomClosed broadcast', A.custom('RoomClosed').length === 1);
    A.send({ type: 'CUSTOM', name: 'Say', roomId, msgId: 'sm-12', value: { text: 'post-close' } });
    await sleep(250);
    T('closed-room utterance rejected (no-such-room)', B.find((m) => m.msgId === 'sm-12').length === 0);

    const fail = results.filter((r) => !r.ok).length;
    console.log(`\nSMOKE: ${results.length - fail}/${results.length} PASS${fail ? ' — ' + fail + ' FAIL' : ''}`);
    process.exitCode = fail ? 1 : 0;
  } finally {
    try { srv.kill(); } catch {}
    setTimeout(() => { try { fs.rmSync(td, { recursive: true, force: true }); } catch {} process.exit(process.exitCode || 0); }, 300);
  }
})();

'use strict';
// 격리 회귀 — C9a(레거시 입양 + 별칭 발급 등록) · C9b(authz 게이트) · C11(MCP HTTP 폴백) · C8(ws 재-require)
// MCP 쪽은 실제 서버 프로세스를 띄워 JSON-RPC(line-delimited) 로 호출한다 — 소스 추출/eval 없음.
const fs = require('fs'); const path = require('path'); const os = require('os');
const { spawn } = require('child_process');
const SRC = 'c:/Dev/EstreGenesis/EstreGenesis/constellation/reference';
const MCP_SRC = 'c:/Dev/EstreGenesis/EstreGenesis/plugins/constellation/mcp';
const T = path.join(os.tmpdir(), 'eg-c9-' + process.pid);
const PORT = 27995;
const fails = []; const ok = (m) => console.log('  ok  ' + m); const bad = (m) => { fails.push(m); console.log('  FAIL ' + m); };
function cpDir(f2, t2) { fs.mkdirSync(t2, { recursive: true }); for (const e of fs.readdirSync(f2, { withFileTypes: true })) { if (e.name === 'node_modules' || e.name.startsWith('.')) continue; const f = path.join(f2, e.name), t = path.join(t2, e.name); if (e.isDirectory()) cpDir(f, t); else fs.copyFileSync(f, t); } }

const LEGACY_ORPHAN = 'uk-' + 'deadbeef'.repeat(3);
const LEGACY_COLLAB = 'ck-' + 'feedface'.repeat(3);

// ---- 최소 MCP 클라이언트 (line-delimited JSON-RPC over stdio) ----
function mcpClient(serverPath, env) {
  const p = spawn(process.execPath, [serverPath], { env: { ...process.env, ...env }, stdio: ['pipe', 'pipe', 'pipe'] });
  let buf = ''; const pending = new Map(); let stderr = '';
  p.stdout.setEncoding('utf8');
  p.stdout.on('data', (d) => {
    buf += d;
    let i;
    while ((i = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
      if (!line) continue;
      let m; try { m = JSON.parse(line); } catch { continue; }
      const r = pending.get(m.id); if (r) { pending.delete(m.id); r(m); }
    }
  });
  p.stderr.on('data', (d) => { stderr += d; });
  let id = 0;
  const call = (method, params) => new Promise((res, rej) => {
    const myId = ++id;
    const to = setTimeout(() => rej(new Error(method + ' timeout')), 15000);
    pending.set(myId, (m) => { clearTimeout(to); res(m); });
    p.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: myId, method, params: params || {} }) + '\n');
  });
  return { call, kill: () => { try { p.kill(); } catch {} }, stderr: () => stderr };
}

(async () => {
  cpDir(path.join(SRC, 'runtime'), T); cpDir(path.join(SRC, 'dashboard'), path.join(T, 'public'));
  fs.writeFileSync(path.join(T, 'ws-keys.json'), JSON.stringify([
    { key: LEGACY_ORPHAN, label: 'legacy-upstream', role: 'upstream', createdAt: '2026-06-06T02:14:20.415Z' },
    { key: LEGACY_COLLAB, label: 'legacy-collab', role: 'collab', createdAt: '2026-06-06T03:19:14.903Z' },
  ]));

  const srv = spawn(process.execPath, [path.join(T, 'server.cjs')], { env: { ...process.env, PORT: String(PORT), WS_PRIMARY_AGENT: 'test-main' }, stdio: ['ignore', 'pipe', 'pipe'] });
  let sl = ''; srv.stdout.on('data', d => sl += d); srv.stderr.on('data', d => sl += d);
  for (let i = 0; i < 60 && !/live dashboard/.test(sl); i++) await new Promise(r => setTimeout(r, 200));
  if (!/live dashboard/.test(sl)) throw new Error('server did not start: ' + sl.slice(0, 900));
  if (/레거시 키 2건 입양/.test(sl)) ok('boot: 2 legacy-only keys adopted into keyStore');
  else bad('adoption log missing: ' + sl.split('\n').filter(l => /KEY-MGMT/.test(l)).join(' | '));

  const conn = (url) => new Promise((res, rej) => { const w = new WebSocket(url); w.onopen = () => res(w); w.onerror = () => rej(new Error('open failed')); setTimeout(() => rej(new Error('open timeout')), 8000); });
  const waitFor = (w, names, ms = 8000) => new Promise((res, rej) => {
    const list = [].concat(names); const to = setTimeout(() => rej(new Error(list.join('/') + ' timeout')), ms);
    const h = (ev) => { let m; try { m = JSON.parse(ev.data); } catch { return; }
      if (m && m.type === 'CUSTOM' && list.includes(m.name)) { clearTimeout(to); w.removeEventListener('message', h); res(m); } };
    w.addEventListener('message', h);
  });

  // ── C9a-1: 입양된 레거시 키가 canonical KeyList 에 보이고 KeyRevoke 로 폐기되는가 ──
  const board = await conn(`ws://localhost:${PORT}/ws`);
  board.send(JSON.stringify({ type: 'CUSTOM', name: 'KeyList', value: { includeRevoked: true } }));
  const rows = (((await waitFor(board, 'KeyListResult')).value) || {}).keys || [];
  const orphanRow = rows.find((k) => k.key === LEGACY_ORPHAN);
  if (!orphanRow) bad('adopted legacy key not visible in KeyList (' + rows.length + ' rows)');
  else {
    ok(`adopted legacy key visible in KeyList (kind=${orphanRow.kind} state=${orphanRow.state})`);
    if (orphanRow.adoptedFromLegacy) ok('provenance flag adoptedFromLegacy present'); else bad('adoptedFromLegacy flag missing');
  }
  board.send(JSON.stringify({ type: 'CUSTOM', name: 'KeyRevoke', value: { key: LEGACY_ORPHAN, mode: 'immediate' } }));
  const revoked = await waitFor(board, ['KeyRevoked', 'KeyError']);
  if (revoked.name !== 'KeyRevoked') bad('canonical KeyRevoke on adopted key failed: ' + JSON.stringify(revoked.value));
  else ok('canonical KeyRevoke works on the adopted legacy key (was KEY_NOT_FOUND before)');

  // ── C9a-2: deprecated RegisterUpstreamKey 가 keyStore 에 등록하는가 ──
  board.send(JSON.stringify({ type: 'CUSTOM', name: 'RegisterUpstreamKey', value: { label: 'alias-issued' } }));
  const aliasIssued = ((await waitFor(board, 'UpstreamKeyIssued')).value) || {};
  board.send(JSON.stringify({ type: 'CUSTOM', name: 'KeyList', value: {} }));
  const list2 = (((await waitFor(board, 'KeyListResult')).value) || {}).keys || [];
  if (!list2.some((k) => k.key === aliasIssued.key)) bad('RegisterUpstreamKey-issued key absent from keyStore');
  else ok('RegisterUpstreamKey now registers in keyStore (canonical verbs can see it)');
  if (Array.isArray(aliasIssued.joinUrls) && aliasIssued.joinUrls.length) ok('alias path carries joinUrls too (v2.4.85 parity)');

  // ── C9b-1 (에이전트 표면): 레거시 collab 키로 **HELLO** 를 보내 role=agent/collab 으로 등록된 뒤 키 관리 시도 ──
  const agent = await conn(`ws://localhost:${PORT}/ws?key=${encodeURIComponent(LEGACY_COLLAB)}`);
  agent.send(JSON.stringify({ type: 'HELLO', agentId: 'intruder', agentName: 'intruder', key: LEGACY_COLLAB }));
  await new Promise(r => setTimeout(r, 700));
  for (const verb of ['RevokeUpstreamKey', 'RevokeCollabKey', 'RegisterUpstreamKey', 'RegisterCollabKey', 'KeyRevoke']) {
    agent.send(JSON.stringify({ source: 'agent', agentId: 'intruder', type: 'CUSTOM', name: verb, value: { key: aliasIssued.key, label: 'x', mode: 'immediate' } }));
    let got = null;
    try { got = await waitFor(agent, ['KeyError', 'KeyRevoked', 'UpstreamKeyIssued', 'CollabKeyIssued'], 4000); } catch (_) {}
    if (!got) bad(verb + ': no reply at all (expected PERMISSION_DENIED)');
    else if (got.name === 'KeyError' && got.value && got.value.code === 'PERMISSION_DENIED') ok(verb + ' from non-main → PERMISSION_DENIED');
    else bad(verb + ' from non-main was ALLOWED → ' + got.name);
  }
  board.send(JSON.stringify({ type: 'CUSTOM', name: 'KeyList', value: { includeRevoked: true } }));
  const still = ((((await waitFor(board, 'KeyListResult')).value) || {}).keys || []).find((k) => k.key === aliasIssued.key);
  if (still && !/REVOK/i.test(String(still.state))) ok('target key survived unauthorized revoke attempts (state=' + still.state + ')');
  else bad('target key state after intruder attempts = ' + (still ? still.state : '(gone)'));

  // ── AgentList 신선도 (어댑터 질문 → 실측 결함): 에이전트도 갱신 push 를 받아 자기 자신 + 후속 합류자가 보이는가 ──
  {
    const lateAgent = await conn(`ws://localhost:${PORT}/ws`);
    const snapshots = [];
    lateAgent.addEventListener('message', (ev) => { let m; try { m = JSON.parse(ev.data); } catch { return; } if (m && m.name === 'AgentList') snapshots.push((m.value || {}).agents || []); });
    lateAgent.send(JSON.stringify({ type: 'HELLO', agentId: 'late-joiner', agentName: 'late-joiner' }));
    await new Promise(r => setTimeout(r, 900));
    const last = snapshots[snapshots.length - 1] || [];
    if (snapshots.length < 2) bad('agent received only ' + snapshots.length + ' AgentList (no post-HELLO update — stale cache)');
    else ok('agent receives AgentList updates after its own HELLO (' + snapshots.length + ' snapshots)');
    if (last.some((a) => a.agentId === 'late-joiner')) ok('agent now sees ITSELF in the list (was permanently absent)');
    else bad('agent still absent from its own AgentList: ' + JSON.stringify(last).slice(0, 160));
    lateAgent.close();
  }

  // ── C9b-2 (board 표면): 별도 서버를 노출(0.0.0.0) + ui allowlist 로 이 호스트를 배제한 채 LAN 주소로 board 연결 ──
  //    무-HELLO 연결이 예전엔 무조건 운영자 권한이었다 — 이제 loopback 이거나 ui allowlist 통과 주소만 허용돼야 한다.
  {
    const lanIp = Object.values(os.networkInterfaces()).flat().filter((a) => a && !a.internal && String(a.family).match(/^(IPv4|4)$/)).map((a) => a.address)[0];
    if (!lanIp) console.log('  note: 비-loopback IPv4 없음 — board-표면 deny 경로 미검증');
    else {
      const T2 = T + '-exposed'; cpDir(path.join(SRC, 'runtime'), T2); cpDir(path.join(SRC, 'dashboard'), path.join(T2, 'public'));
      fs.writeFileSync(path.join(T2, 'access.json'), JSON.stringify({ expose: true, ui: { allowlist: ['203.0.113.9'] }, agent: { allowlist: null, requireKey: false }, mcp: { allowlist: null } }));
      const P2 = PORT + 1;
      const srv2 = spawn(process.execPath, [path.join(T2, 'server.cjs')], { env: { ...process.env, PORT: String(P2), WS_PRIMARY_AGENT: 'test-main' }, stdio: ['ignore', 'pipe', 'pipe'] });
      let s2 = ''; srv2.stdout.on('data', d => s2 += d); srv2.stderr.on('data', d => s2 += d);
      for (let i = 0; i < 60 && !/live dashboard/.test(s2); i++) await new Promise(r => setTimeout(r, 200));
      if (!/live dashboard/.test(s2)) bad('exposed test server did not start');
      else {
        if (/§13\.25\.9 운영자 authz/.test(s2)) ok('exposed boot log states the operator-authz gate is closed by ui allowlist');
        else bad('boot log missing the §13.25.9 line: ' + s2.split('\n').filter(l => /13\.25|authz|⚠/.test(l)).join(' | ').slice(0, 200));
        const outsider = await conn(`ws://${lanIp}:${P2}/ws`);   // 무-HELLO board 연결, 주소는 allowlist 밖
        outsider.send(JSON.stringify({ type: 'CUSTOM', name: 'KeyIssue', value: { label: 'stranger', kind: 'upstream' } }));
        let got = null; try { got = await waitFor(outsider, ['KeyError', 'KeyIssued'], 5000); } catch (_) {}
        if (got && got.name === 'KeyError' && got.value && got.value.code === 'PERMISSION_DENIED') ok('remote no-HELLO board connection outside ui allowlist → PERMISSION_DENIED on KeyIssue');
        else bad('remote board KeyIssue was ' + (got ? got.name : 'unanswered') + ' (expected PERMISSION_DENIED)');
        outsider.send(JSON.stringify({ type: 'CUSTOM', name: 'SetMain', value: { agentId: 'intruder', reason: 'takeover' } }));
        let g2 = null; try { g2 = await waitFor(outsider, ['KeyError'], 4000); } catch (_) {}
        if (g2 && g2.value && g2.value.code === 'PERMISSION_DENIED') ok('SetMain from the same connection → PERMISSION_DENIED (role takeover closed)');
        else bad('SetMain from remote board was not denied');
        // loopback 은 계속 허용돼야 한다 (대시보드 회귀 방지)
        const localBoard = await conn(`ws://127.0.0.1:${P2}/ws`);
        localBoard.send(JSON.stringify({ type: 'CUSTOM', name: 'KeyList', value: {} }));
        let g3 = null; try { g3 = await waitFor(localBoard, ['KeyListResult', 'KeyError'], 5000); } catch (_) {}
        if (g3 && g3.name === 'KeyListResult') ok('loopback board connection still authorized (dashboard unaffected)');
        else bad('loopback board was denied — dashboard regression: ' + (g3 ? JSON.stringify(g3.value) : 'no reply'));
        outsider.close(); localBoard.close();
      }
      srv2.kill(); await new Promise(r => setTimeout(r, 300));
      try { fs.rmSync(T2, { recursive: true, force: true }); } catch {}
    }
  }

  // ── C11b: 거부는 말해주고 끊는가 + 성공 시 자기 권한을 알려주는가 + History 축약을 신호하는가 ──
  {
    const lanIp = Object.values(os.networkInterfaces()).flat().filter((a) => a && !a.internal && String(a.family).match(/^(IPv4|4)$/)).map((a) => a.address)[0];
    // 성공 경로: ConnectionInfo 가 role/권한을 실어 오는가 (loopback board 서버 재사용)
    // 리스너를 소켓 생성 직후 동기 부착 — History 는 upgrade 시점에 오므로 open 이후 부착은 놓친다(레이스)
    let info = null, hist = null;
    const okConn = new WebSocket(`ws://localhost:${PORT}/ws`);
    okConn.addEventListener('message', (ev) => { let m; try { m = JSON.parse(ev.data); } catch { return; } if (m && m.name === 'ConnectionInfo') info = m.value; if (m && m.name === 'History') hist = m.value; });
    await new Promise((res, rej) => { okConn.onopen = res; okConn.onerror = () => rej(new Error('open failed')); setTimeout(res, 6000); });
    okConn.send(JSON.stringify({ type: 'HELLO', agentId: 'info-probe', agentName: 'info-probe' }));
    await new Promise(r => setTimeout(r, 700));
    if (!info) bad('no ConnectionInfo after successful HELLO (client cannot know its own authority)');
    else {
      ok(`ConnectionInfo delivered: role=${info.role} mayManageKeys=${info.mayManageKeys} keyed=${info.keyed}`);
      if (info.role === 'local' && info.mayManageKeys === false) ok('  authority stated honestly for a keyless local agent');
      else bad('  authority fields wrong: ' + JSON.stringify(info));
    }
    // History 프레임은 보드 상태에 따라 발송 조건이 있어(활성 events/cold/archived/manifests 중 하나 이상) 이 시점엔 없을 수 있다 —
    // 왔을 때 scope 를 반드시 실었는지만 단정한다 (프레임 발송 자체는 별도 seeded 프로브로 확인).
    if (!hist) console.log('  note: 이 시점엔 History 프레임 없음 — scope 단정 스킵 (seeded 프로브에서 확인)');
    else if (hist.scope && hist.scope.policy) ok('History carries an explicit scope signal (' + hist.scope.policy + ', active=' + hist.scope.activeEvents + ' cold=' + hist.scope.coldChannels + ')');
    else bad('History arrived without a scope field — abridgement still unsignaled');
    okConn.close();

    // 거부 경로: requireKey=true + 원격 주소 + 무키 → ConnectionRejected 이벤트 + close code 4403
    if (!lanIp) console.log('  note: 비-loopback IPv4 없음 — 거부 통지 경로 미검증');
    else {
      const T3 = T + '-reqkey'; cpDir(path.join(SRC, 'runtime'), T3); cpDir(path.join(SRC, 'dashboard'), path.join(T3, 'public'));
      fs.writeFileSync(path.join(T3, 'access.json'), JSON.stringify({ expose: true, ui: { allowlist: null }, agent: { allowlist: null, requireKey: true }, mcp: { allowlist: null } }));
      const P3 = PORT + 2;
      const srv3 = spawn(process.execPath, [path.join(T3, 'server.cjs')], { env: { ...process.env, PORT: String(P3), WS_PRIMARY_AGENT: 'test-main' }, stdio: ['ignore', 'pipe', 'pipe'] });
      let s3 = ''; srv3.stdout.on('data', d => s3 += d); srv3.stderr.on('data', d => s3 += d);
      for (let i = 0; i < 60 && !/live dashboard/.test(s3); i++) await new Promise(r => setTimeout(r, 200));
      if (!/live dashboard/.test(s3)) bad('requireKey test server did not start');
      else {
        const w = new WebSocket(`ws://${lanIp}:${P3}/ws`);
        const seen = []; let closeCode = null;
        w.addEventListener('message', (ev) => { let m; try { m = JSON.parse(ev.data); } catch { return; } seen.push(m.name || m.type); if (m && m.name === 'ConnectionRejected') seen.rejected = m.value; });
        w.addEventListener('close', (ev) => { closeCode = ev.code; });
        await new Promise((res, rej) => { w.onopen = res; w.onerror = () => rej(new Error('open failed')); setTimeout(res, 6000); });
        // HELLO 직후 같은 버스트로 targeted CUSTOM 을 파이프라인 — 어댑터가 당한 그 형상
        w.send(JSON.stringify({ type: 'HELLO', agentId: 'keyless-peer', agentName: 'keyless-peer', role: 'collab' }));
        w.send(JSON.stringify({ source: 'agent', agentId: 'keyless-peer', type: 'CUSTOM', name: 'SpecGapReport', targetAgentId: 'test-main', msgId: 'kp-1', value: { topic: 'pipelined' } }));
        await new Promise(r => setTimeout(r, 1500));
        if (seen.rejected) ok('keyless remote HELLO → ConnectionRejected{reason=' + seen.rejected.reason + '} (was a silent close)');
        else bad('no ConnectionRejected event — rejection still silent (' + seen.join(',') + ')');
        if (closeCode === 4403) ok('close code 4403 carries the refusal (distinguishable from a normal close)');
        else bad('close code was ' + closeCode + ' (expected 4403)');
        if (seen.rejected && /requireKey/.test(seen.rejected.hint || '') ) ok('rejection hint names the setting + warns follow-ups are not relayed');
        try { w.close(); } catch {}
      }
      srv3.kill(); await new Promise(r => setTimeout(r, 300));
      try { fs.rmSync(T3, { recursive: true, force: true }); } catch {}
    }
  }

  // ── C11: 실제 MCP 서버 프로세스 — 원격 보드(로컬 state 파일 없음)에서 HTTP 폴백으로 state 를 읽는가 ──
  {
    const cli = mcpClient(path.join(MCP_SRC, 'server.cjs'), { CONSTELLATION_WS_URL: `ws://localhost:${PORT}/ws`, CONSTELLATION_AGENT_ID: 'mcp-probe', CONSTELLATION_STATE_PATH: '' });
    const init = await cli.call('initialize', {});
    if (init.result && init.result.serverInfo) ok('MCP server initialize OK (v' + init.result.serverInfo.version + ')');
    else bad('initialize failed: ' + JSON.stringify(init).slice(0, 200));
    const r = await cli.call('tools/call', { name: 'board_state_get', arguments: {} });
    const res = r.result || {};
    const txt = (res.content && res.content[0] && res.content[0].text) || '';
    let parsed = null; try { parsed = JSON.parse(txt); } catch (_) {}
    if (parsed && !res.isError) ok('board_state_get read the REMOTE board over HTTP fallback (' + Object.keys(parsed).length + ' keys, isError absent)');
    else bad('board_state_get did not return state JSON: isError=' + res.isError + ' text=' + txt.slice(0, 160));
    // ws 미설치 환경인데도 state 읽기가 성공했는지 = 상태 조회가 ws 의존을 벗었다는 뜻
    if (parsed && !/ws npm package/.test(txt)) ok('state read no longer depends on the ws dependency (no wasted connect)');
    const tl = await cli.call('tools/list', {});
    const desc = ((tl.result && tl.result.tools) || []).find((t) => t.name === 'board_state_get');
    if (desc && /api\/state/.test(desc.description) && /isError/.test(desc.description)) ok('tool description states the resolution order + error contract');
    else bad('tool description not updated: ' + (desc ? desc.description.slice(0, 90) : '(missing)'));
    cli.kill();
  }
  {
    const cli = mcpClient(path.join(MCP_SRC, 'server.cjs'), { CONSTELLATION_WS_URL: 'ws://127.0.0.1:1/ws', CONSTELLATION_AGENT_ID: 'mcp-probe2', CONSTELLATION_STATE_PATH: '' });
    await cli.call('initialize', {});
    const r = await cli.call('tools/call', { name: 'board_state_get', arguments: {} });
    const res = r.result || {};
    if (res.isError === true) ok('unreachable board → isError:true (silent success-shaped failure gone)');
    else bad('failure path did not set isError: ' + JSON.stringify(res).slice(0, 200));
    cli.kill();
  }

  // ── C8: ws 부재 → 나중 설치 시 재-require 되는가 (실서버 2회 호출, 사이에 ws 심기) ──
  {
    const mdir = path.join(T, 'mcp-c8');
    fs.mkdirSync(mdir, { recursive: true });
    for (const f of ['server.cjs', 'package.json']) fs.copyFileSync(path.join(MCP_SRC, f), path.join(mdir, f));
    const cli = mcpClient(path.join(mdir, 'server.cjs'), { CONSTELLATION_WS_URL: `ws://localhost:${PORT}/ws`, CONSTELLATION_AGENT_ID: 'c8-probe', NODE_PATH: '' });
    await cli.call('initialize', {});
    const r1 = await cli.call('tools/call', { name: 'a2a_emit', arguments: { targetAgentId: 'test-main', name: 'Report', value: { hi: 1 } } });
    const t1 = JSON.stringify(r1).slice(0, 300);
    if (/ws npm package not installed/.test(t1)) ok('C8 baseline: ws absent → explicit ws-missing error');
    else bad('C8 baseline unexpected: ' + t1);
    // 이제 ws 를 심는다 (프로세스는 그대로 살아있음)
    const wsdir = path.join(mdir, 'node_modules', 'ws');
    fs.mkdirSync(wsdir, { recursive: true });
    fs.writeFileSync(path.join(wsdir, 'package.json'), JSON.stringify({ name: 'ws', version: '0.0.0-fake', main: 'index.js' }));
    fs.writeFileSync(path.join(wsdir, 'index.js'), 'module.exports = function FakeWS(){ throw new Error("FAKE_WS_MARKER"); };\n');
    const r2 = await cli.call('tools/call', { name: 'a2a_emit', arguments: { targetAgentId: 'test-main', name: 'Report', value: { hi: 2 } } });
    const t2 = JSON.stringify(r2).slice(0, 300);
    if (/ws npm package not installed/.test(t2)) bad('C8 NOT fixed — still reports ws missing after install (' + t2 + ')');
    else { ok('C8 fixed: same live process picked up the newly installed ws on the next call'); if (/FAKE_WS_MARKER/.test(t2)) ok('  (proof: the freshly required fake ws module actually ran)'); }
    cli.kill();
  }

  board.close(); agent.close(); srv.kill();
  await new Promise(r => setTimeout(r, 400));
  try { fs.rmSync(T, { recursive: true, force: true }); } catch {}
  console.log(fails.length ? '\nFAILURES (' + fails.length + '):\n - ' + fails.join('\n - ') : '\nC8/C9/C11 REGRESSION PASS');
  process.exit(fails.length ? 1 : 0);
})().catch((e) => { console.error('HARNESS ERROR', e); process.exit(2); });

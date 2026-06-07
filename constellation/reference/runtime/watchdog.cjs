#!/usr/bin/env node
'use strict';
/**
 * watchdog.cjs — Constellation Live Board 상시연결 워치독 (deps0, generic).
 *
 * 서버(server.cjs)와 메인 브릿지(local-bridge.cjs)의 생존을 감시하고
 * 죽으면 자동 재시작한다. "상시연결 유지" 의 인프라 보장 계층 — 이 세션이 끝나도
 * 워치독이 detached 로 상주하면 연결이 끊기지 않는다.
 *
 * 감시 방식 (board role 상시 WS 연결로 능동·이벤트 병행):
 *   - board role 로 ws://127.0.0.1:7878/ws 상시 연결 → 연결 가능 = 서버 생존.
 *   - WS 끊김/연결 실패 → 서버 다운 의심 → TCP 재확인 후 server.cjs 재시작 → 재연결(backoff).
 *   - 서버가 푸시하는 AgentList envelope({type:'CUSTOM', name:'AgentList', value:{agents}}) 에
 *     main agentId(기본 'main-agent') 없음 → 브릿지 다운 → 브릿지 재시작.
 *   - 15초 백업 타이머: WS 미연결 지속 시 서버 살리기. AgentList 능동 재요청 불필요
 *     (서버는 연결·해제 변화 시 AgentList 를 푸시하므로 이벤트로 충분).
 *
 * 무중단(no-interrupt) 원칙: 이미 떠 있는 서버·브릿지는 건드리지 않고 죽었을 때만 새로 띄운다.
 * 재시작은 detached spawn(워치독이 죽어도 자식 생존) + 같은 대상 SPAWN_COOLDOWN 쿨다운.
 *
 * 환경변수 (silent-disable 대신 WARN):
 *   PORT          — WS 서버 포트 (기본 7878)
 *   HOST          — WS 서버 호스트 (기본 127.0.0.1)
 *   SERVER_PATH   — server.cjs 절대경로 (기본 <DIR>/server.cjs) — 파일 없으면 WARN
 *   BRIDGE_PATH   — local-bridge.cjs 절대경로 (기본 <DIR>/local-bridge.cjs) — 파일 없으면 WARN
 *   MAIN_ID       — 메인 브릿지 agentId (기본 'main-agent') — generic placeholder
 *   LOG_PATH      — 로그 파일 경로 (기본 <DIR>/watchdog.log)
 *
 * 실행(상주):  Start-Process node -ArgumentList 'watchdog.cjs' -WindowStyle Hidden  (PowerShell)
 *        또는: node watchdog.cjs   (포그라운드 — 로그가 콘솔에도)
 *
 * 부팅 자동시작 (선택):
 *   머신 재부팅 시 워치독도 종료되므로, 로그온 시 자동 기동하려면 작업 스케줄러에 등록한다.
 *   워치독은 단일 진입점 — 등록하면 부팅 후 워치독이 서버·브릿지까지 전부 복구한다.
 *   등록(PowerShell, 1회, 경로는 환경에 맞게 치환):
 *     $node = (Get-Command node).Source
 *     $dir  = '<runtime dir absolute path>'
 *     $a = New-ScheduledTaskAction -Execute $node -Argument 'watchdog.cjs' -WorkingDirectory $dir
 *     $t = New-ScheduledTaskTrigger -AtLogOn
 *     Register-ScheduledTask -TaskName 'ConstellationWatchdog' -Action $a -Trigger $t -Description 'Constellation Live Board WS watchdog'
 *   해제:  Unregister-ScheduledTask -TaskName 'ConstellationWatchdog' -Confirm:$false
 */
const { spawn } = require('child_process');
const net = require('net');
const fs = require('fs');
const path = require('path');

const DIR = __dirname;
const HOST = process.env.HOST || '127.0.0.1';
const PORT = Number(process.env.PORT) || 7878;
const WS_URL = `ws://${HOST}:${PORT}/ws`;
const SERVER = process.env.SERVER_PATH || path.join(DIR, 'server.cjs');
const BRIDGE = process.env.BRIDGE_PATH || path.join(DIR, 'local-bridge.cjs');
const LOG = process.env.LOG_PATH || path.join(DIR, 'watchdog.log');
const MAIN_ID = process.env.MAIN_ID || 'main-agent';
const NODE = process.execPath;
const SPAWN_COOLDOWN = 8000;   // 같은 대상 연속 재시작 억제(기동 중 중복 spawn 방지)

// single-instance 가드 (2026-06-07 incident 후속): watchdog 중복 spawn 차단 — 두 개가 동시에
// server/bridge 재시작 trigger 하면 SPAWN_COOLDOWN 우회 + AgentList 다중 구독 등 혼선 발생.
require('./single-instance').acquire(path.join(DIR, `.watchdog.${PORT}.pid`), 'watchdog');

function log(...a) {
  const line = `[${new Date().toISOString()}] ${a.join(' ')}`;
  console.log(line);
  try { fs.appendFileSync(LOG, line + '\n'); } catch {}
}
function warn(...a) { log('[WARN]', ...a); }

// ---- silent-disable 대신 WARN: env 누락·파일 없음 진단 ----
function checkConfig() {
  if (!process.env.HOST) warn(`HOST not set — fallback '${HOST}'`);
  if (!process.env.PORT) warn(`PORT not set — fallback ${PORT}`);
  if (!process.env.MAIN_ID) warn(`MAIN_ID not set — fallback '${MAIN_ID}' (generic placeholder)`);
  if (!process.env.SERVER_PATH) warn(`SERVER_PATH not set — fallback '${SERVER}'`);
  if (!process.env.BRIDGE_PATH) warn(`BRIDGE_PATH not set — fallback '${BRIDGE}'`);
  if (!fs.existsSync(SERVER)) warn(`SERVER not found at '${SERVER}' — spawn will fail (set SERVER_PATH or place server.cjs next to watchdog)`);
  if (!fs.existsSync(BRIDGE)) warn(`BRIDGE not found at '${BRIDGE}' — spawn will fail (set BRIDGE_PATH or place local-bridge.cjs next to watchdog)`);
}

// ---- detached spawn (워치독이 죽어도 자식 생존, 자식이 죽으면 워치독이 재감지) ----
let lastServerSpawn = 0, lastBridgeSpawn = 0;
function spawnDetached(file, cwd, tag) {
  if (!fs.existsSync(file)) { warn(`spawn skip: ${tag} file missing at '${file}'`); return; }
  let out;
  try { out = fs.openSync(LOG, 'a'); } catch { out = 'ignore'; }
  let child;
  try {
    child = spawn(NODE, [file], { cwd, detached: true, stdio: ['ignore', out, out] });
  } catch (err) {
    warn(`spawn fail: ${tag} (${file}) — ${err.message}`);
    return;
  }
  child.unref();
  log(`[watchdog] spawned ${tag} pid=${child.pid} (${file})`);
}
function restartServer() {
  const now = Date.now(); if (now - lastServerSpawn < SPAWN_COOLDOWN) return; lastServerSpawn = now;
  log('[watchdog] server DOWN → restart server.cjs');
  spawnDetached(SERVER, path.dirname(SERVER), 'server');
}
function restartBridge() {
  const now = Date.now(); if (now - lastBridgeSpawn < SPAWN_COOLDOWN) return; lastBridgeSpawn = now;
  log(`[watchdog] main bridge(${MAIN_ID}) MISSING → restart local-bridge.cjs`);
  spawnDetached(BRIDGE, path.dirname(BRIDGE), 'bridge');
}

// ---- 서버 TCP 생존 체크 ----
function checkServerAlive() {
  return new Promise((res) => {
    const s = net.connect({ host: HOST, port: PORT });
    const done = (v) => { try { s.destroy(); } catch {} res(v); };
    s.on('connect', () => done(true));
    s.on('error', () => done(false));
    s.setTimeout(2000, () => done(false));
  });
}

// ---- 상시 WS board 연결: AgentList envelope 로 브릿지 생존 추적 ----
// envelope 규약 (v2.2.x server.cjs 정합):
//   { type:'CUSTOM', name:'AgentList', value:{ agents:[{ agentId, role, ... }, ...] } }
let ws = null, wsConnected = false, backoff = 1000, reconnectT = null;
function connectWs() {
  try { ws = new WebSocket(WS_URL); } catch { scheduleReconnect(); return; }
  ws.onopen = () => { wsConnected = true; backoff = 1000; log('[watchdog] WS connected — server alive, watching AgentList'); };
  ws.onmessage = (e) => {
    let m; try { m = JSON.parse(e.data); } catch { return; }
    if (m.type === 'CUSTOM' && m.name === 'AgentList') {
      const agents = (m.value && m.value.agents) || [];
      const hasMain = agents.some((a) => a.agentId === MAIN_ID);
      if (!hasMain) restartBridge();
      else log(`[watchdog] AgentList ok — agents=${agents.map((a) => a.agentId + ':' + a.role).join(',')}`);
    }
  };
  ws.onerror = () => {};
  ws.onclose = () => { if (wsConnected) log('[watchdog] WS closed'); wsConnected = false; ws = null; scheduleReconnect(); };
}
function scheduleReconnect() {
  if (reconnectT) return;
  reconnectT = setTimeout(async () => {
    reconnectT = null;
    const alive = await checkServerAlive();
    if (!alive) restartServer();
    connectWs();
  }, backoff);
  backoff = Math.min(backoff * 2, 8000);
}

// 백업 타이머: WS 미연결이 지속되면 서버 살리기(이벤트 경로 누락 대비)
setInterval(async () => {
  if (!wsConnected) { const alive = await checkServerAlive(); if (!alive) restartServer(); }
}, 15000);

checkConfig();
log(`[watchdog] start — guarding server(${HOST}:${PORT}) + main bridge(${MAIN_ID}); node=${NODE}`);
connectWs();
process.on('SIGINT', () => { log('[watchdog] SIGINT — bye'); try { ws && ws.close(); } catch {} process.exit(0); });
process.on('SIGTERM', () => { log('[watchdog] SIGTERM — bye'); try { ws && ws.close(); } catch {} process.exit(0); });

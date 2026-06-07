#!/usr/bin/env node
// scripts/join-local.cjs — v2.4.1 local 워커 합류 helper (reference impl).
// 사용: LOCAL_KEY_FILE=local-keys/<label>.key WS_AGENT_ID=<label> node scripts/join-local.cjs
// 메인이 KeyIssue{kind:'local', label, roleDescription} 발급 → 서버가 local-keys/<label>.key 에 키 저장
// → 본 스크립트가 파일에서 키 읽어 ws 합류. 키 자체는 외부 wire 안 노출.

'use strict';
const fs = require('fs');
const path = require('path');

const DIR = path.resolve(__dirname, '..');
const KEY_FILE = process.env.LOCAL_KEY_FILE;
const AGENT_ID = process.env.WS_AGENT_ID;
const HOST = process.env.COLLAB_HOST || ('localhost:' + (process.env.PORT || '7878'));
const AGENT_NAME = process.env.WS_AGENT_NAME || (AGENT_ID || 'local-worker');
const MAIN = process.env.WS_MAIN || 'main-agent';
const THREAD_ID = process.env.WS_THREAD_ID || AGENT_ID || 'local-worker';

if (!KEY_FILE) { console.error('[join-local] LOCAL_KEY_FILE env required'); process.exit(1); }
if (!AGENT_ID) { console.error('[join-local] WS_AGENT_ID env required'); process.exit(1); }

// single-instance 가드 (2026-06-07 incident 후속): 같은 agentId 로 중복 spawn 차단.
require('../single-instance').acquire(path.join(DIR, `.join-local.${AGENT_ID}.pid`), 'join-local');

const resolvedKeyFile = path.isAbsolute(KEY_FILE) ? KEY_FILE : path.join(DIR, KEY_FILE);
let key;
try { key = fs.readFileSync(resolvedKeyFile, 'utf8').trim(); }
catch (e) { console.error('[join-local] key file read fail:', resolvedKeyFile, String(e.message || e)); process.exit(1); }
if (!/^lk-[a-f0-9]+$/.test(key)) { console.error('[join-local] key file does not contain valid local key (lk- prefix)'); process.exit(1); }

const WS_URL = `ws://${HOST}/ws?key=${encodeURIComponent(key)}`;
const LOG = path.join(DIR, 'local-' + AGENT_ID + '.log');
const OUTBOX = process.env.LOCAL_OUTBOX || path.join(DIR, 'local-' + AGENT_ID + '-outbox.jsonl');   // v2.4.7: 워커 세션이 append → drain 송신 (gateway-client 패턴). 워커 emit 경로.
const OUT_CURSOR = path.join(DIR, '.local-' + AGENT_ID + '-outbox-cursor');

let ws = null, connected = false, seq = 0, backoff = 500;
function log(obj) { try { fs.appendFileSync(LOG, JSON.stringify({ t: Date.now(), ...obj }) + '\n'); } catch {} }
function send(type, extra) {
  if (!ws || ws.readyState !== 1) return false;
  const msg = Object.assign({ type, id: 'a-' + Date.now().toString(36) + '-' + (++seq), seq, threadId: THREAD_ID, timestamp: Date.now(), source: 'agent', agentId: AGENT_ID }, extra);
  try { ws.send(JSON.stringify(msg)); log({ ev: 'sent', name: msg.name || msg.type }); return true; } catch (e) { log({ ev: 'send-fail', e: String(e) }); return false; }
}
function loadOutCursor() { try { return parseInt(fs.readFileSync(OUT_CURSOR, 'utf8'), 10) || 0; } catch { return 0; } }
function saveOutCursor() { try { fs.writeFileSync(OUT_CURSOR, String(outCursor)); } catch {} }
let outCursor = loadOutCursor();
// 워커 세션(IDE/CLI 에이전트)이 OUTBOX 에 append 한 줄을 connected 이후 drain 송신.
// 줄 형식: 완성된 envelope (type/name/targetAgentId/value …) — agentId/seq/timestamp 는 send() 가 보강.
function drainOutbox() {
  if (!connected) return;
  let data = ''; try { data = fs.readFileSync(OUTBOX, 'utf8'); } catch { return; }
  const lines = data.split('\n').filter(Boolean);
  for (let i = outCursor; i < lines.length; i++) {
    let m; try { m = JSON.parse(lines[i]); } catch { log({ ev: 'outbox-parse-fail', line: i }); continue; }
    send(m.type || 'CUSTOM', m);   // send() 가 id/seq/threadId/timestamp/source/agentId 보강
  }
  if (outCursor !== lines.length) { outCursor = lines.length; saveOutCursor(); }
}

function connect() {
  console.log(`[join-local] connecting ${WS_URL.replace(key, key.slice(0, 8) + '…')} (agentId=${AGENT_ID})`);
  ws = new WebSocket(WS_URL);
  ws.onopen = () => {
    connected = true; backoff = 500;
    send('HELLO', { clientId: AGENT_ID + '-1', agentName: AGENT_NAME, role: 'local', protocolVersion: '0.3', runId: null, capabilities: { inbound: ['UserPrompt', 'Command', 'Cancel', 'Delegate', 'OnboardAck', 'WorkerAck'], outbound: ['CUSTOM'] } });
    console.log(`[join-local] connected; HELLO sent (role=local). 메인(${MAIN}) Delegate 대기.`);
    log({ ev: 'connected' });
    setTimeout(() => { send('CUSTOM', { name: 'AgentHello', targetAgentId: MAIN, value: { agentId: AGENT_ID, env: 'local worker @ ' + DIR, role: 'local', idle: true, note: 'Local worker 합류 — Delegate 대기 standby.' } }); log({ ev: 'agenthello-sent', to: MAIN }); }, 600);
  };
  ws.onmessage = (e) => {   // v2.4.7: CUSTOM/A2A 는 full msg 로깅 (워커가 Delegate value 등 본문 read 가능), History/AgentList 노이즈는 요약
    let m; try { m = JSON.parse(e.data); } catch { return; }
    if (m.type === 'History' || m.type === 'AgentList' || m.type === 'SERVER_HELLO') log({ ev: 'inbound-meta', type: m.type });
    else log({ ev: 'inbound', msg: m });
  };
  ws.onerror = (err) => { log({ ev: 'ws-error', e: String((err && err.message) || err) }); };
  ws.onclose = (ev) => { connected = false; ws = null; log({ ev: 'closed', code: ev && ev.code }); setTimeout(connect, backoff); backoff = Math.min(backoff * 2, 8000); };
}

connect();
setInterval(drainOutbox, 1500);   // v2.4.7 워커 outbox drain
process.on('SIGINT', () => { try { ws && ws.close(); } catch {} process.exit(0); });
process.on('SIGTERM', () => { try { ws && ws.close(); } catch {} process.exit(0); });

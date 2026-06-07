#!/usr/bin/env node
// register-session.cjs — v2.4.7 단일 워크스페이스 멀티에이전트 세션 등록.
//
// 같은 워크스페이스에 두 Claude 세션(예: main + worker)이 있으면 동일 Stop hook(pre-send-probe)을
// 공유 실행 → 동일 cursor 를 advance → 경쟁 (worker 가 main 의 A2A surfacing cursor 를 가로챔).
// 본 도구로 worker 세션을 레지스트리에 등록하면, pre-send-probe 가 그 세션의 hook 실행 시
// 자기 소유 inbox 가 아닌 probe 를 skip → main 의 cursor 를 건드리지 않음.
//
// 사용 (worker 세션의 Bash 에서 1회 실행 — CLAUDE_CODE_SESSION_ID 가 env 에 있어야 함):
//   node register-session.cjs <role> [--inbox <path> ...] [--registry <path>]
//   node register-session.cjs board-observer --inbox c:/Dev/EstreGenesis/collab-self/local-board-observer.log
//
// role 만 주고 --inbox 생략 시: worker 는 어떤 default probe inbox 도 소유 안 함 →
//   그 세션의 모든 pre-send-probe hook 실행이 skip (worker 가 자기 inbox 를 별도 수단으로 self-monitor).
//
// 해제: node register-session.cjs --unregister  (자기 session_id 를 레지스트리에서 제거)

'use strict';
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const SELF = process.env.CLAUDE_CODE_SESSION_ID || null;
if (!SELF) {
  console.error('[register-session] CLAUDE_CODE_SESSION_ID env 미존재 — Claude Code 세션의 Bash 에서 실행하세요. (등록 불가)');
  process.exit(1);
}

let role = null, registryPath = null, unregister = false;
const inboxes = [];
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--unregister') unregister = true;
  else if (a === '--inbox') inboxes.push(path.resolve(args[++i]));
  else if (a === '--registry') registryPath = path.resolve(args[++i]);
  else if (!a.startsWith('--') && !role) role = a;
}

const REGISTRY = registryPath
  || (process.env.AGENT_SESSIONS_PATH ? path.resolve(process.env.AGENT_SESSIONS_PATH) : path.join(process.cwd(), '.agent-sessions.json'));

function load() { try { const j = JSON.parse(fs.readFileSync(REGISTRY, 'utf8')); return (j && typeof j === 'object') ? j : {}; } catch { return {}; } }
function save(obj) {
  const line = JSON.stringify(obj, null, 2) + '\n';
  JSON.parse(line);   // roundtrip 검증
  fs.writeFileSync(REGISTRY, line);
}

const reg = load();
if (!reg.workers || typeof reg.workers !== 'object') reg.workers = {};

if (unregister) {
  if (reg.workers[SELF]) { delete reg.workers[SELF]; save(reg); console.log(`[register-session] unregistered session ${SELF.slice(0, 8)} from ${REGISTRY}`); }
  else console.log(`[register-session] session ${SELF.slice(0, 8)} not in registry — nothing to do`);
  process.exit(0);
}

if (!role) { console.error('[register-session] role 인자 필요. 예: node register-session.cjs board-observer --inbox <path>'); process.exit(1); }

reg.workers[SELF] = { role, ownInboxes: inboxes, registeredAt: new Date().toISOString() };
save(reg);
console.log(`[register-session] OK — session ${SELF.slice(0, 8)} role=${role} ownInboxes=[${inboxes.join(', ')}] → ${REGISTRY}`);
console.log(`[register-session] 이제 이 세션의 pre-send-probe hook 은 소유하지 않은 inbox probe 를 skip (primary cursor 미advance).`);

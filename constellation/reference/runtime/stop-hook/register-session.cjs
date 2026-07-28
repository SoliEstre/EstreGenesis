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

let role = null, registryPath = null, unregister = false, force = false;
const inboxes = [];
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--unregister') unregister = true;
  else if (a === '--inbox') inboxes.push(path.resolve(args[++i]));
  else if (a === '--registry') registryPath = path.resolve(args[++i]);
  else if (a === '--force') force = true;
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

// v2.4.112 — **소유는 조용히 넘어가지 않아요.** pre-send-probe 의 소유 판정은 «마지막 등재자 승»
//   (ownerOf Map 덮어쓰기) 이에요. 그래서 다른 세션이 같은 inbox 를 나중에 등재하면 원래 주인의
//   probe 가 그 순간부터 SKIP 으로 떨어져요 — 그 세션은 인바운드를 **못 보는 상태가 되는데 아무도
//   그 사실을 말해주지 않아요.**
//   이게 이론이 아니라 실측이에요 (2026-07-28): 이 워크스페이스에서 서브에이전트 팬아웃을 돌렸더니
//   서브에이전트가 프로젝트 지침의 «boot 의례 first-action» 을 그대로 따라 자기를 role=main 으로
//   등재했고, 진짜 main 세션이 inbox 소유를 잃었어요. 서브에이전트를 쓰는 어느 채택자에게나 나요.
//   그래서 **이미 다른 세션이 소유한 inbox 를 가져가려면 --force 를 요구**해요. 거절이 기본인 이유는
//   조용한 탈취의 증상이 «메시지가 없다» 라서, 고장으로 보이지 않기 때문이에요.
{
  const norm = (p) => path.resolve(String(p)).replace(/\\/g, '/').toLowerCase();
  const mine = new Set(inboxes.map(norm));
  const conflicts = [];
  for (const [sid, w] of Object.entries(reg.workers)) {
    if (sid === SELF) continue;
    for (const ib of (Array.isArray(w.ownInboxes) ? w.ownInboxes : [])) {
      if (mine.has(norm(ib))) conflicts.push({ sid, role: w.role, inbox: ib, at: w.registeredAt });
    }
  }
  if (conflicts.length && !force) {
    console.error('[register-session] 거부 — 아래 inbox 는 이미 다른 세션이 소유해요. 그대로 등재하면 그 세션의');
    console.error('                   pre-send-probe 가 조용히 SKIP 으로 떨어져서 인바운드를 못 보게 돼요.');
    for (const c of conflicts) console.error(`                     · ${c.inbox}\n                       ← ${c.sid.slice(0, 8)}(role=${c.role || '?'}, 등재 ${c.at || '?'})`);
    console.error('[register-session] 서브에이전트라면 애초에 role=main 으로 등재하지 마세요 — 소유는 세션 하나만 가져요.');
    console.error('[register-session] 앞 세션이 정말 끝났다면: 그 세션에서 --unregister, 또는 여기서 --force.');
    process.exit(2);
  }
  if (conflicts.length && force) {
    console.warn(`[register-session] ⚠ --force — ${conflicts.length}건의 기존 소유를 넘겨받아요: ${conflicts.map((c) => c.sid.slice(0, 8)).join(', ')}`);
  }
}

reg.workers[SELF] = { role, ownInboxes: inboxes, registeredAt: new Date().toISOString() };
save(reg);
console.log(`[register-session] OK — session ${SELF.slice(0, 8)} role=${role} ownInboxes=[${inboxes.join(', ')}] → ${REGISTRY}`);
console.log(`[register-session] 이제 이 세션의 pre-send-probe hook 은 소유하지 않은 inbox probe 를 skip (primary cursor 미advance).`);

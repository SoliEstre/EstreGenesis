'use strict';
// activity-emit.cjs — 실시간 «지금 무엇을» 활성 스트림의 emit 길목 (Pantty §8 확장).
//
// 무엇인가: PreToolUse 훅으로 붙어, 에이전트가 도구를 쓰기 직전에 «지금: <도구> <대상>» 한 줄을
//   AgentActivity 프레임으로 보드에 흘려요. §8 규율대로 **선언이 아니라 파생** — 자유서술 「나
//   지금 X 생각중」이 아니라 하네스가 실제로 호출하는 도구에서 뽑아요(위조·드리프트 불가).
//
// 왜 telemetry:true 인가: 관측 전용이라 §13.8 응답창 짝짓기/main 라우팅에서 빠져야 해요. 안 그러면
//   매 도구호출이 «빈 수신자» 를 채워 협업 상대를 깨우고 자기증식해요(frame-class.cjs 가 존재하는 이유).
//
// 왜 플래그 게이트인가: telemetry 는 원래 공짜(파일 읽기)라 게이트하면 안 되지만, 이건 훅이라 매
//   도구호출마다 **프로세스 spawn 비용**(레이턴시)이 있어요 — echo 처럼 «비용이 있으니 정당하게
//   토글». 기본 off. 켜는 건 플래그 파일 생성(ACTIVITY_FLAG, 기본 .agent/activity-stream.on).
//
// 절대 규율: **도구를 차단하지 않아요.** 무슨 일이 있어도 exit 0 — PreToolUse 가 비-0 이면 도구가
//   막혀요. 관측이 작업을 멈추면 관측이 아니에요.
//
// env: ACTIVITY_OUTBOX(필수 경로·기본 collab-self/outbox.jsonl) · ACTIVITY_AGENT_ID · ACTIVITY_FLAG

const fs = require('fs');
const path = require('path');

function envOr(name, dflt) { const v = process.env[name]; return (v && v.length) ? v : dflt; }
const OUTBOX = envOr('ACTIVITY_OUTBOX', path.join(process.cwd(), 'collab-self', 'outbox.jsonl'));
const AGENT_ID = envOr('ACTIVITY_AGENT_ID', 'agent');
const FLAG = envOr('ACTIVITY_FLAG', path.join(process.cwd(), '.agent', 'activity-stream.on'));

function done() { process.exit(0); }                 // 언제나 0 — 도구를 막지 않아요.

// 게이트: 플래그 없으면 조용히 통과 (비용 0에 가깝게).
try { if (!fs.existsSync(FLAG)) done(); } catch (_) { done(); }

// 자격증명 «표준 형태» 경량 마스킹 — 긴 토큰류·Bearer·env 대입을 요약에서 지워요(§6 미해결의
//   축소판: 스크롤백엔 비밀이 표준 형태로 들어와요). 명령줄에 비밀을 안 싣는 게 1차 규율이고,
//   이건 방어심층이에요.
function redact(s) {
  return String(s)
    .replace(/\b(Bearer|token|api[_-]?key|secret|password|pwd)\b\s*[:=]\s*\S+/gi, '$1=«…»')
    .replace(/[A-Za-z0-9_\-]{28,}/g, '«…»');
}
function oneline(s, n) { return redact(String(s).replace(/\s+/g, ' ').trim()).slice(0, n); }
function base(p) { try { return path.basename(String(p)); } catch (_) { return String(p); } }

// PreToolUse 는 stdin 으로 JSON 을 줘요: {tool_name, tool_input, ...}. 없거나 깨져도 통과.
let raw = '';
try { raw = fs.readFileSync(0, 'utf8'); } catch (_) { done(); }
let hook; try { hook = JSON.parse(raw); } catch (_) { done(); }
if (!hook || !hook.tool_name) done();

const tool = String(hook.tool_name);
const inp = hook.tool_input || {};
let summary;
switch (tool) {
  case 'Bash': case 'PowerShell': summary = oneline(inp.command || inp.script || '', 80); break;
  case 'Edit': case 'Write': case 'Read': case 'NotebookEdit': summary = base(inp.file_path || inp.notebook_path || ''); break;
  case 'Glob': summary = oneline(inp.pattern || '', 60); break;
  case 'Grep': summary = oneline(inp.pattern || '', 60); break;
  case 'Task': case 'Agent': summary = oneline(inp.description || inp.subagent_type || '', 60); break;
  case 'WebFetch': case 'WebSearch': summary = oneline(inp.url || inp.query || '', 60); break;
  case 'TodoWrite': summary = 'todo 갱신'; break;
  default: summary = oneline(inp.description || inp.summary || '', 60) || tool;
}

const frame = {
  type: 'CUSTOM',
  name: 'AgentActivity',
  telemetry: true,                       // ← 관측 전용 태그 (frame-class.cjs ①). 이게 없으면 자기증식.
  agentId: AGENT_ID,                     // 서버가 인증된 신원으로 덮어씀 (§8.4 결속을 공짜로 만족).
  value: { tool, summary, ts: Date.now() },
};

// echo-emit 과 같은 안전 append: stringify → roundtrip parse → 한 줄 append.
try {
  const line = JSON.stringify(frame);
  JSON.parse(line);
  fs.appendFileSync(OUTBOX, line + '\n');
} catch (_) { /* 삼켜요 — 관측이 작업을 못 막게 */ }
done();

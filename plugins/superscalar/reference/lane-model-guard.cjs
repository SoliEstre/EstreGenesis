#!/usr/bin/env node
'use strict';
/**
 * lane-model-guard.cjs — PreToolUse guard for `Agent` and `Workflow` (Superscalar §5.1.4, /subscaler Step 0).
 *
 * What it protects: a fan-out lane that omits its model inherits the main conversation's model, and a lane
 *   that omits its effort inherits the session's. When the main runs on a T1 model (a Fable-class flagship),
 *   "no choice" therefore silently selects the most expensive tier — at the top effort rung if the session
 *   runs `ultracode` — for lanes whose work shape mostly belongs two tiers down. Measured 2026-08-02: two
 *   workflows, 24 lanes, every one inheriting the frontier model with the delegation rule already written down.
 *   A rule without a mechanism is a document; this file is the mechanism.
 *
 * Verdicts (`judge` is a pure function so a checker can call it directly):
 *   session model = last "model":"…" in the transcript tail (the hook input has no model field). Unreadable ⇒ strict.
 *   Agent    · no `model` while the main is T1 or unknown            → deny (bind sonnet/haiku · opus · fable-when-justified)
 *            · `model` is fable-class and session effort is xhigh|max → deny unless the prompt carries «fable-xhigh-ok»
 *   Workflow · per agent(...) span in the script:
 *              a lane without `model:` while the main is T1/unknown  → deny, naming the lane labels
 *              a fable-class lane with effort xhigh|max              → deny unless «// lane-model-guard: allow-fable-xhigh»
 *              a lane without `effort:` while main is T1 and session effort is xhigh|max → deny
 *            · a named workflow (no script) or an unreadable scriptPath → allow (cannot judge ⇒ pass, never block)
 *   FORCE pin (Claude Code v2.1.257+): CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1 applies CLAUDE_CODE_SUBAGENT_MODEL (or the
 *     main model) to EVERY subagent and ignores per-spawn and definition `model` — it sits above the whole resolution
 *     order (v2.1.251+: per-invocation → frontmatter → CLAUDE_CODE_SUBAGENT_MODEL default → main), so a binding this
 *     guard approves is void while FORCE is on. The guard reads the env: FORCE on and the forced model empty or T1 while
 *     the main is T1 ⇒ deny every Agent/Workflow lane; FORCE on with a non-T1 forced model ⇒ allow (all lanes cheap).
 *   Off: env LANE_MODEL_GUARD=off (tell a human why) · «// lane-model-guard: off» inside the script.
 *
 * Hook contract: PreToolUse JSON on stdin. Deny = exit 2 + hookSpecificOutput.permissionDecision:"deny" on stdout
 *   (+ the same reason on stderr for older clients). Unparseable input ⇒ exit 0: a guard that kills the tool on
 *   its own bug is the first incident.
 *
 * Wiring (Claude Code): settings hooks.PreToolUse += { matcher: "Agent|Workflow",
 *   hooks: [{ type: "command", command: "node <path-to-this-file>", timeout: 10 }] }.
 */
const fs = require('fs');

const FABLE = /fable|mythos/i;
const HEAVY = /^(xhigh|max)$/i;

function sessionModelFromTranscript(p) {
  try {
    const st = fs.statSync(p);
    const len = Math.min(st.size, 400000);
    const fd = fs.openSync(p, 'r');
    const buf = Buffer.alloc(len);
    fs.readSync(fd, buf, 0, len, st.size - len);
    fs.closeSync(fd);
    const all = [...buf.toString('utf8').matchAll(/"model":"([^"]+)"/g)];
    return all.length ? all[all.length - 1][1] : null;
  } catch (_) { return null; }
}

// agent( … ) spans by paren depth. Parens inside string literals are not tracked — the heuristic errs only
//   toward under-detection (missing a lane it should block), never toward blocking a well-formed one.
function agentSpans(script) {
  const spans = [];
  const re = /\bagent\s*\(/g;
  let m;
  while ((m = re.exec(script))) {
    let depth = 0;
    for (let k = m.index + m[0].length - 1; k < script.length; k++) {
      const c = script[k];
      if (c === '(') depth++;
      else if (c === ')') { depth--; if (depth === 0) { spans.push(script.slice(m.index, k + 1)); re.lastIndex = k; break; } }
    }
  }
  return spans;
}
function laneLabel(span) {
  const l = /label\s*:\s*[`'"]([^`'"]*)[`'"]/.exec(span);
  return l ? l[1] : span.slice(0, 48).replace(/\s+/g, ' ') + '…';
}
const allow = () => ({ deny: false, reason: '' });
const deny = (reason) => ({ deny: true, reason });

function judge(input, ctx) {
  const tool = input && input.tool_name;
  const ti = (input && input.tool_input) || {};
  const model = ctx && ctx.sessionModel;
  const eff = String((ctx && ctx.sessionEffort) || '').toLowerCase();
  const mainFable = model == null ? true : FABLE.test(model);   // unknown ⇒ strict
  const modelNote = model ? `세션 모델 ${model}` : '세션 모델 미상(엄격 적용)';
  const RULE = '규칙: T1(Fable 급)은 «실패 비용이 그 값을 정당화하는 레인» 에만 (Superscalar §5.1.4 · /subscaler Step 0). 탐색·수집·기계적 편집 = sonnet 또는 haiku · 적대 검증·판정 = opus · 필요한 레인만 fable, 그 이유를 label 에.';

  // FORCE 핀은 레인 바인딩 전체를 무효로 만들어요 — 이 가드가 방금 승인한 model 도 포함해서요.
  if ((tool === 'Agent' || tool === 'Workflow') && ctx && ctx.forceEnv && !/^(0|false|off|)$/i.test(String(ctx.forceEnv))) {
    const forced = String(ctx.forceModel || '').trim();
    if (mainFable && (!forced || FABLE.test(forced))) {
      return deny(`[lane-model-guard] CLAUDE_CODE_SUBAGENT_MODEL_FORCE 가 켜져 있어요 — 모든 서브에이전트가 ${forced ? forced : '(CLAUDE_CODE_SUBAGENT_MODEL 비어 있음 → main ' + (model || '미상') + ')'} 로 강제되고, 호출에 적은 model 은 무시돼요(v2.1.257+). ${modelNote}이라 레인 전부가 Fable 로 가요. FORCE 를 끄거나 CLAUDE_CODE_SUBAGENT_MODEL 을 T1 아닌 모델로 두세요. ${RULE}`);
    }
    return allow();   // 비-T1 모델로 전부 강제 — 비용 축에선 안전(반증 레인의 opus 도 덮이지만 그건 품질 축의 선택)
  }

  if (tool === 'Agent') {
    const lm = ti.model;
    if (!lm) {
      if (!mainFable) return allow();
      return deny(`[lane-model-guard] Agent 호출에 model 이 없어요 — ${modelNote}이라 서브에이전트가 Fable 을 상속해요. ${RULE}`);
    }
    if (FABLE.test(String(lm)) && HEAVY.test(eff)) {
      const txt = `${ti.prompt || ''} ${ti.description || ''}`;
      if (!/fable-xhigh-ok/.test(txt)) return deny(`[lane-model-guard] Fable 레인을 세션 effort ${eff}(ultracode 급)로 띄우려 해요 — Agent 도구엔 레인별 effort 가 없어 세션 값을 그대로 상속해요. 정말 필요하면 prompt 에 «fable-xhigh-ok» 를 적어 의도를 남기고, 아니면 model 을 opus/sonnet 으로 내리거나 Workflow agent() 의 opts.effort 로 낮추세요.`);
    }
    return allow();
  }

  if (tool === 'Workflow') {
    let script = ti.script;
    if (!script && ti.scriptPath) { try { script = fs.readFileSync(ti.scriptPath, 'utf8'); } catch (_) { script = null; } }
    if (!script) return allow();                                 // named workflow / unreadable — cannot judge ⇒ pass
    if (/lane-model-guard:\s*off/.test(script)) return allow();
    const spans = agentSpans(script);
    if (!spans.length) return allow();
    const noModel = spans.filter((s) => !/\bmodel\s*:/.test(s));
    const heavyFable = spans.filter((s) => /\bmodel\s*:\s*[`'"]?(claude-)?fable/i.test(s) && /\beffort\s*:\s*[`'"](xhigh|max)[`'"]/i.test(s));
    const noEffort = spans.filter((s) => !/\beffort\s*:/.test(s));
    const problems = [];
    if (mainFable && noModel.length) problems.push(`model 없는 레인 ${noModel.length}/${spans.length} (${noModel.map(laneLabel).join(' · ')}) — ${modelNote}이라 Fable 을 상속해요`);
    if (heavyFable.length && !/lane-model-guard:\s*allow-fable-xhigh/.test(script)) problems.push(`Fable × xhigh|max 레인 ${heavyFable.length} (${heavyFable.map(laneLabel).join(' · ')}) — 필요하면 스크립트에 «// lane-model-guard: allow-fable-xhigh» 를 적어 의도를 남기세요`);
    if (mainFable && HEAVY.test(eff) && noEffort.length) problems.push(`effort 없는 레인 ${noEffort.length} (${noEffort.map(laneLabel).join(' · ')}) — 세션 effort 가 ${eff} 라 그대로 상속돼요: 리서치 low~medium · 반증 high 로 명시`);
    if (!problems.length) return allow();
    return deny(`[lane-model-guard] ${problems.join(' | ')}. ${RULE} 끄기: 스크립트에 «// lane-model-guard: off» (사유 필수).`);
  }
  return allow();
}

function main() {
  if (String(process.env.LANE_MODEL_GUARD || '').toLowerCase() === 'off') return process.exit(0);
  let input;
  try { input = JSON.parse(fs.readFileSync(0, 'utf8')); } catch (_) { return process.exit(0); }
  const ctx = {
    sessionModel: process.env.LANE_MODEL_GUARD_MODEL || sessionModelFromTranscript(input.transcript_path),
    sessionEffort: (input.effort && input.effort.level) || process.env.CLAUDE_CODE_EFFORT_LEVEL || '',
    forceEnv: process.env.CLAUDE_CODE_SUBAGENT_MODEL_FORCE || '',
    forceModel: process.env.CLAUDE_CODE_SUBAGENT_MODEL || '',
  };
  const v = judge(input, ctx);
  if (!v.deny) return process.exit(0);
  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: v.reason } }) + '\n');
  process.stderr.write(v.reason + '\n');
  process.exit(2);
}

if (require.main === module) main();
else module.exports = { judge, agentSpans, sessionModelFromTranscript, FABLE, HEAVY };

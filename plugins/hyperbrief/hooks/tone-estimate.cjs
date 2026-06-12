#!/usr/bin/env node
// tone-estimate.cjs — Stop-hook post-response tone evaluation (v0.7.0, Hyperbrief §5.6.7-pre post-response tier).
//
// The deferred-candidate #5 ("hook post-response tone evaluation layer") landed once the host's Stop
// hook was recognized as the PostResponse-equivalent timing. This is NOT a new architectural layer —
// it extends the existing §11.4 hook tier (advise mode, exit 0, never block).
//
// Flow (zero-cost when no brief is active):
//   1. Gate: .hyperbrief/active-profile.json must exist (the skill writes it at IR-emit time with the
//      declared {audience, abbreviation, jargon} + decision_id + emitted_at). Absent → exit 0 silently.
//   2. Stale guard: emitted_at older than TTL (default 24h, HYPERBRIEF_TONE_TTL_MS) → advise removal, exit 0.
//   3. Extract the last assistant text from the transcript (stdin payload .transcript_path).
//   4. estimateSurfaceProfile(text, declared) — the same deterministic 6-heuristic the renderer uses
//      (re-exported from mini-engine.cjs; declared-vs-estimate gap threshold |Δ| ≥ 2, renderer-consistent).
//   5. Gap on any axis → ONE stderr advisory line (next-turn injection): suggests the tone-floor
//      fallback / re-render. Repeat-advise suppressed per decision_id (last_advised_gap recorded back
//      into active-profile.json) — alert-fatigue discipline per §2.4.
'use strict';
const fs = require('fs');
const path = require('path');

const CWD = process.cwd();
const PROFILE_PATH = path.join(CWD, '.hyperbrief', 'active-profile.json');
const TTL_MS = parseInt(process.env.HYPERBRIEF_TONE_TTL_MS || '', 10) || 24 * 60 * 60 * 1000;

function out(line) { process.stderr.write(line + '\n'); }

// 1. gate — no active brief → zero-cost exit
let profile;
try { profile = JSON.parse(fs.readFileSync(PROFILE_PATH, 'utf8')); } catch { process.exit(0); }
const declared = profile && profile.declared;
if (!declared || typeof declared.audience !== 'number') process.exit(0);

// 2. stale guard
const emittedAt = Date.parse(profile.emitted_at || '') || 0;
if (emittedAt && Date.now() - emittedAt > TTL_MS) {
  out(`[hyperbrief/tone] active-profile (decision ${profile.decision_id || '?'}) 이 TTL(${Math.round(TTL_MS / 3600000)}h)을 넘겼어요 — 브리핑 사이클이 끝났다면 .hyperbrief/active-profile.json 을 삭제하세요.`);
  process.exit(0);
}

// 3. last assistant text from transcript
let payload = {};
try { if (!process.stdin.isTTY) payload = JSON.parse(fs.readFileSync(0, 'utf8') || '{}'); } catch { /* no payload */ }
const tPath = payload.transcript_path;
let text = '';
try {
  const lines = fs.readFileSync(tPath, 'utf8').split('\n').filter(Boolean);
  for (let i = lines.length - 1; i >= 0; i--) {
    let o; try { o = JSON.parse(lines[i]); } catch { continue; }
    const msg = o.message || o;
    if ((o.type === 'assistant' || msg.role === 'assistant') && Array.isArray(msg.content)) {
      text = msg.content.filter((c) => c.type === 'text').map((c) => c.text).join('\n');
      if (text.trim()) break;
    }
  }
} catch { process.exit(0); }
if (!text || text.length < 200) process.exit(0); // 짧은 확인 응답은 평가 대상 아님

// 4. deterministic estimate — renderer 와 동일 heuristic 재사용
let est;
try {
  const engine = require(path.join(__dirname, '..', 'renderers', 'mini-engine.cjs'));
  est = engine.estimateSurfaceProfile(text, declared);
} catch { process.exit(0); }
const e = est.estimated_profile || est; // engine 반환 형태 호환
const gaps = [];
for (const axis of ['audience', 'abbreviation', 'jargon']) {
  const dv = declared[axis];
  const ev = e[`${axis}_est`] != null ? e[`${axis}_est`] : (e[axis] != null ? e[axis] : null);
  if (typeof dv === 'number' && typeof ev === 'number' && Math.abs(dv - ev) >= 2) gaps.push(`${axis} L${dv}→실측 L${ev}`);
}
if (!gaps.length) process.exit(0);

// 5. repeat-advise suppression per decision_id + gap signature
const sig = gaps.join(',');
if (profile.last_advised_gap === sig) process.exit(0);
try { profile.last_advised_gap = sig; fs.writeFileSync(PROFILE_PATH, JSON.stringify(profile, null, 2), 'utf8'); } catch { /* advisory only */ }
out(`[hyperbrief/tone] 선언 톤과 실측 표면이 어긋나요 (${sig}) — 독자가 어렵다고 느낄 수 있어요. tone-floor fallback(§5.6.7) 재렌더 또는 다음 응답의 평이화를 고려하세요. (decision ${profile.decision_id || '?'})`);
process.exit(0);

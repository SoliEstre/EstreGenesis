// Hyperbrief mini-engine — IR → MD/HTML deterministic renderer (v0.4.0 / Phase 2).
// Load-bearing invariant: same IR + same options → byte-identical output (Hyperbrief.md §7).
// Self-engineered placeholder substitution + tone-axis transform. Single npm dep (ajv) for schema validation.

"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const TEMPLATES_DIR = path.resolve(__dirname, "..", "templates");
const SCHEMA_PATH = path.resolve(__dirname, "..", "schema", "hyperbrief.schema.json");

const DEFAULT_PROFILE = Object.freeze({ audience: 2, abbreviation: 2, jargon: 2 });

// ─── Hashing (canonical / output) ───────────────────────────────────────────

function sha256(s) {
  return crypto.createHash("sha256").update(s, "utf8").digest("hex");
}

// Stable JSON serialization with sorted keys at every depth → same logical IR → same hash.
function canonicalize(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return "[" + value.map(canonicalize).join(",") + "]";
  }
  const keys = Object.keys(value).sort();
  const parts = keys.map((k) => JSON.stringify(k) + ":" + canonicalize(value[k]));
  return "{" + parts.join(",") + "}";
}

function canonicalIrHash(ir) {
  return sha256(canonicalize(ir));
}

// ─── Schema validation (ajv) ────────────────────────────────────────────────

let _validator = null;
function getValidator() {
  if (_validator) return _validator;
  let Ajv;
  try {
    // ajv default export is draft-07; our schema is draft 2020-12 → use the 2020-12 dialect entrypoint.
    // Without this, ajv.compile(schema) throws "no schema with key or ref draft/2020-12/schema" on every IR.
    Ajv = require("ajv/dist/2020");
  } catch (e) {
    // Schema validation skipped when ajv not installed (Phase 1 fallback territory).
    return null;
  }
  const ajv = new (Ajv.default || Ajv)({ strict: false, allErrors: true });
  const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, "utf8"));
  _validator = ajv.compile(schema);
  return _validator;
}

function validateIr(ir) {
  const v = getValidator();
  if (!v) return { ok: true, errors: [], skipped: true };
  const ok = v(ir);
  return { ok, errors: ok ? [] : (v.errors || []), skipped: false };
}

// ─── Placeholder substitution ───────────────────────────────────────────────

function resolvePath(obj, dotted) {
  const parts = dotted.split(".");
  let cur = obj;
  for (const p of parts) {
    if (cur === null || cur === undefined) return "";
    // numeric array index
    if (Array.isArray(cur) && /^\d+$/.test(p)) cur = cur[Number(p)];
    else cur = cur[p];
  }
  if (cur === null || cur === undefined) return "";
  if (typeof cur === "object") return JSON.stringify(cur);
  return String(cur);
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const PLACEHOLDER_RE = /\{\{([^}]+)\}\}/g;

function substitute(template, ir, surface) {
  return template.replace(PLACEHOLDER_RE, (_, raw) => {
    const expr = raw.trim();
    const val = resolvePath(ir, expr);
    return surface === "html" ? escapeHtml(val) : val;
  });
}

// ─── Tone axis transforms ───────────────────────────────────────────────────
// All transforms operate on the substituted surface, NOT on IR content.
// IR field contents (including the canonical epistemic tag forms) remain authoritative;
// surface variants are the rendered projection per §5.6.

const EPISTEMIC_TAG_KO = {
  "[verified]": "확인됨 — ",
  "[inferred]": "추론 — ",
  "[assumed]": "가정 — ",
  "[unknown]": "미상 — ",
};

const JARGON_GLOSS = {
  RAPID: "RAPID(역할 배분 표)",
  Cynefin: "Cynefin(상황 분류 프레임워크)",
  MCDA: "MCDA(다기준 의사결정)",
  Toulmin: "Toulmin(논증 모델)",
  "blast radius": "blast radius(영향 범위)",
  idempotent: "idempotent(같은 결과 보장)",
  Hyrum: "Hyrum(외부 의존성 법칙)",
};

function applyAudienceTransform(text, level) {
  if (level <= 2) {
    // L1-L2: epistemic bracket tags → 한국어 단어형 (prose flow 보존)
    let out = text;
    for (const [bracket, korean] of Object.entries(EPISTEMIC_TAG_KO)) {
      out = out.split(bracket).join(korean);
    }
    return out;
  }
  if (level >= 4) {
    // L4-L5: bracket tags → superscript shorthand
    return text
      .replace(/\[verified\]\s*/g, "ᵛ ")
      .replace(/\[inferred\]\s*/g, "ⁱ ")
      .replace(/\[assumed\]\s*/g, "ᵃ ")
      .replace(/\[unknown\]\s*/g, "ᵘ ");
  }
  return text; // L3: canonical bracket form
}

function applyAbbreviationTransform(text, level) {
  if (level <= 2) return text;
  let out = text;
  if (level >= 3) {
    // Bullet-heavy: convert leading "- " runs to compact spaced bullets, collapse short sentences.
    out = out.replace(/\.\s+(?=[A-Z가-힣])/g, ". ");
  }
  if (level >= 4) {
    // Telegraphic: symbolic operators.
    out = out
      .replace(/\bversus\b/gi, "vs")
      .replace(/\bleads to\b/gi, "→")
      .replace(/\bbecause\b/gi, "∵")
      .replace(/\btherefore\b/gi, "∴");
  }
  return out;
}

function applyJargonTransform(text, level, warnings) {
  if (level <= 2) {
    // L1-L2: add inline gloss to first occurrence of each canonical term.
    let out = text;
    const seen = new Set();
    for (const [term, glossed] of Object.entries(JARGON_GLOSS)) {
      const re = new RegExp("\\b" + term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b");
      if (re.test(out) && !seen.has(term)) {
        out = out.replace(re, glossed);
        seen.add(term);
      }
    }
    if (level <= 1 && /\b(RAPID|Cynefin|MCDA|Toulmin)\b/.test(out)) {
      warnings.push("L1 jargon transform attempted on canonical framework names — surface still contains residual technical terms; consider rephrasing IR content.");
    }
    return out;
  }
  return text;
}

function applyToneAxes(text, profile, warnings) {
  let out = text;
  out = applyAudienceTransform(out, profile.audience);
  out = applyAbbreviationTransform(out, profile.abbreviation);
  out = applyJargonTransform(out, profile.jargon, warnings);
  return out;
}

// ─── v0.5 surface_profile_estimate (auto-computed, declared-vs-effective gap) ──

const CANONICAL_JARGON_TERMS = ["RAPID", "Cynefin", "MCDA", "Toulmin", "Hyrum", "AHP", "Floridi", "Sennett", "Habermas", "Gadamer", "Bezos", "Snowden", "Drucker", "Klein", "Kahneman", "Lehman", "Brooks", "Fowler", "Hickey", "Ousterhout", "Wirfs-Brock", "Nygard", "Bostrom", "Jonas", "Rawls", "Aristotle", "Toulmin", "Popper", "Goldman", "Zagzebski"];

function estimateSurfaceProfile(text, declaredProfile) {
  const lower = text.toLowerCase();
  const tokens = text.split(/\s+/).filter(Boolean);
  const tokenCount = tokens.length || 1;

  // english_noun_ratio: rough — tokens that match /^[A-Z][a-zA-Z]+$/ + camelCase + ACRONYM patterns / total tokens
  const englishWord = tokens.filter((t) => /^[A-Za-z][A-Za-z]+$/.test(t)).length;
  const english_noun_ratio = Math.min(1, englishWord / tokenCount);

  // avg_sentence_length_chars: text length / sentence terminators
  const sentences = text.split(/[.!?。！？\n]+/).filter((s) => s.trim().length > 0);
  const avg_sentence_length_chars = sentences.length ? Math.round(text.length / sentences.length) : 0;

  // jargon_terms_per_1000_tokens
  let jargonHits = 0;
  for (const term of CANONICAL_JARGON_TERMS) {
    const re = new RegExp("\\b" + term + "\\b", "g");
    const matches = lower.match(re);
    if (matches) jargonHits += matches.length;
  }
  const jargon_terms_per_1000_tokens = (jargonHits / tokenCount) * 1000;

  // bullet_density: lines starting with "-" or "*" / total lines
  const lines = text.split("\n").filter((l) => l.trim().length > 0);
  const bulletLines = lines.filter((l) => /^\s*[-*•]/.test(l)).length;
  const bullet_density = lines.length ? bulletLines / lines.length : 0;

  // first_use_gloss_present: heuristic — at least one "X(설명)" or "X — gloss" pattern
  const first_use_gloss_present = /\([^)]{2,}\)/.test(text) || / — [가-힣A-Za-z]+/.test(text);

  // epistemic_tag_form
  let epistemic_tag_form = "mixed";
  const hasBracket = /\[(verified|inferred|assumed|unknown)\]/.test(text);
  const hasKorean = /(확인됨|추론|가정|미상)\s*—/.test(text);
  const hasSuper = /[ᵛⁱᵃᵘ]\s+/.test(text);
  if (hasBracket && !hasKorean && !hasSuper) epistemic_tag_form = "bracket";
  else if (hasKorean && !hasBracket && !hasSuper) epistemic_tag_form = "korean";
  else if (hasSuper && !hasBracket && !hasKorean) epistemic_tag_form = "superscript";

  // Map metrics → estimated levels (heuristic; surfaces drift rather than overrides declaration)
  // audience: english_noun_ratio + gloss presence
  let audience_est = 3;
  if (english_noun_ratio >= 0.5) audience_est = 5;
  else if (english_noun_ratio >= 0.35) audience_est = 4;
  else if (english_noun_ratio >= 0.20) audience_est = 3;
  else if (english_noun_ratio >= 0.10) audience_est = 2;
  else audience_est = 1;

  // abbreviation: avg_sentence_length_chars (shorter → higher level)
  let abbreviation_est = 2;
  if (avg_sentence_length_chars >= 200) abbreviation_est = 1;
  else if (avg_sentence_length_chars >= 120) abbreviation_est = 2;
  else if (avg_sentence_length_chars >= 70) abbreviation_est = 3;
  else if (avg_sentence_length_chars >= 40) abbreviation_est = 4;
  else abbreviation_est = 5;

  // jargon: jargon_terms_per_1000_tokens
  let jargon_est = 2;
  if (jargon_terms_per_1000_tokens >= 40) jargon_est = 5;
  else if (jargon_terms_per_1000_tokens >= 20) jargon_est = 4;
  else if (jargon_terms_per_1000_tokens >= 8) jargon_est = 3;
  else if (jargon_terms_per_1000_tokens >= 2) jargon_est = 2;
  else jargon_est = 1;

  const declared_vs_estimate_gap_warning =
    Math.abs(declaredProfile.audience - audience_est) >= 2 ||
    Math.abs(declaredProfile.abbreviation - abbreviation_est) >= 2 ||
    Math.abs(declaredProfile.jargon - jargon_est) >= 2;

  return {
    audience: audience_est,
    abbreviation: abbreviation_est,
    jargon: jargon_est,
    raw_metrics: {
      english_noun_ratio: Number(english_noun_ratio.toFixed(3)),
      avg_sentence_length_chars,
      jargon_terms_per_1000_tokens: Number(jargon_terms_per_1000_tokens.toFixed(2)),
      first_use_gloss_present,
      bullet_density: Number(bullet_density.toFixed(3)),
      epistemic_tag_form,
    },
    declared_vs_estimate_gap_warning,
  };
}

// ─── v0.5 recommended_artifacts auto-stamping (line_count + body_hash) ─────

function stampRecommendedArtifacts(ir) {
  const recs = ir?.section_8_recommendation?.recommendation_conditional?.recommended_artifacts;
  if (!Array.isArray(recs)) return;
  for (const a of recs) {
    if (typeof a.body === "string" && a.body.length > 0) {
      if (typeof a.line_count !== "number") a.line_count = a.body.split("\n").length;
      if (typeof a.body_hash !== "string") a.body_hash = sha256(a.body);
    }
  }
}

// ─── v0.6 slot renderers ───────────────────────────────────────────────────
// Each renderer is pure: same input slot → same string output. No timestamps,
// no Math.random, no Date.now. Output is rendered as markdown text; the HTML
// surface re-uses the same markdown blocks since the existing template pipeline
// inlines the MD-style placeholders as text fragments (escaping handled at
// substitute time for IR-path placeholders; v0.6 blocks are pre-rendered and
// injected after substitution to remain deterministic).

function tagText(v) {
  // tagged_text may be a string OR an object {tag, text}. Normalize to display string.
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  if (typeof v === "object") {
    const tag = v.tag ? `[${v.tag}]` : "";
    const text = v.text || "";
    return tag ? `${tag} ${text}` : text;
  }
  return String(v);
}

// §0 — evaluation_lenses[] table renderer (markdown). Empty input → "".
function renderEvaluationLensesMd(lenses) {
  if (!Array.isArray(lenses) || lenses.length === 0) return "";
  const lines = [];
  lines.push("### §0.6 Evaluation lenses (multi-lens)");
  lines.push("");
  lines.push("| Lens id | Name | Dimensions | Current (simple) | Threshold (simple) | Current (weighted) | Threshold (weighted) | Verdict | Methodology |");
  lines.push("|---|---|---|---|---|---|---|---|---|");
  for (const l of lenses) {
    const dims = Array.isArray(l.dimensions) ? l.dimensions.join(", ") : "";
    const ts = (l.threshold_simple_mean === null || l.threshold_simple_mean === undefined) ? "—" : String(l.threshold_simple_mean);
    const tw = (l.threshold_weighted_mean === null || l.threshold_weighted_mean === undefined) ? "—" : String(l.threshold_weighted_mean);
    const cs = (l.current_simple === null || l.current_simple === undefined) ? "—" : String(l.current_simple);
    const cw = (l.current_weighted === null || l.current_weighted === undefined) ? "—" : String(l.current_weighted);
    const verdict = l.verdict || "—";
    const methodology = l.methodology_ref || "—";
    lines.push(`| \`${l.id || ""}\` | ${l.name || ""} | ${dims} | ${cs} | ${ts} | ${cw} | ${tw} | **${verdict}** | ${methodology} |`);
  }
  // Optional rationale rows underneath
  const rationales = lenses
    .map((l) => ({ id: l.id, r: tagText(l.rationale_one_line) }))
    .filter((x) => x.r);
  if (rationales.length > 0) {
    lines.push("");
    for (const x of rationales) {
      lines.push(`- \`${x.id}\` — ${x.r}`);
    }
  }
  lines.push("");
  return lines.join("\n");
}

// §8 — recommended_methodology[] list renderer (markdown). Empty → "".
function renderRecommendedMethodologyMd(items) {
  if (!Array.isArray(items) || items.length === 0) return "";
  const lines = [];
  lines.push("### §8.6 Recommended methodology (meta-decision)");
  lines.push("");
  for (const m of items) {
    const ver = m.version ? ` v${m.version}` : "";
    const applic = Array.isArray(m.applicability) && m.applicability.length
      ? ` *(applicability: ${m.applicability.join(", ")})*`
      : "";
    const rationale = tagText(m.rationale_one_line);
    lines.push(
      `- \`${m.id || ""}\`${ver} — **${m.name || ""}** — \`${m.anchor_path || ""}\`${applic}` +
        (rationale ? ` — ${rationale}` : "")
    );
  }
  lines.push("");
  return lines.join("\n");
}

// Top-level — maturity_anchor box (markdown). Absent → "".
function renderMaturityAnchorMd(ma) {
  if (!ma || typeof ma !== "object") return "";
  const cs = ma.current_score || {};
  const th = ma.threshold || {};
  const lines = [];
  lines.push("### §M Maturity anchor");
  lines.push("");
  lines.push(`> **Claimed label:** \`${ma.claimed_label || ""}\` — anchored to methodology \`${ma.anchor_methodology || ""}\``);
  lines.push("");
  lines.push("| Metric | Current | Threshold |");
  lines.push("|---|---|---|");
  lines.push(`| Simple mean | ${cs.simple_mean ?? "—"} | ${th.simple_mean ?? "—"} |`);
  lines.push(`| Weighted mean | ${cs.weighted_mean ?? "—"} | ${th.weighted_mean ?? "—"} |`);
  if (ma.verdict) {
    lines.push("");
    lines.push(`**Verdict:** \`${ma.verdict}\``);
  }
  const gap = tagText(ma.gap_analysis);
  if (gap) {
    lines.push("");
    lines.push(`**Gap analysis:** ${gap}`);
  }
  lines.push("");
  return lines.join("\n");
}

// AudienceProfileFallback — term_pairing display row (markdown line list). Absent → "".
function renderTermPairingMd(tp) {
  if (!tp || typeof tp !== "object") return "";
  const mode = tp.mode || "N";
  const scope = Array.isArray(tp.scope) && tp.scope.length ? tp.scope.join("+") : "—";
  const retro = tp.retroactive_apply || "prompt";
  const dictRef = tp.dictionary_ref || "";
  const dictInline = tp.dictionary_inline && typeof tp.dictionary_inline === "object"
    ? Object.keys(tp.dictionary_inline).length
    : 0;
  const lines = [];
  lines.push("**Term-pairing policy** (v0.6):");
  lines.push(`- Mode: \`${mode}\` *(E=every / I=initial-with-low-frequency-override / N=none)*`);
  lines.push(`- Scope: \`${scope}\` *(C=conversation, D=document, B=board, R=review)*`);
  lines.push(`- Retroactive apply: \`${retro}\``);
  if (dictRef) lines.push(`- Dictionary ref: \`${dictRef}\``);
  if (dictInline > 0) lines.push(`- Dictionary inline: ${dictInline} entries`);
  return lines.join("\n");
}

// ─── v0.6 term_pairing post-process stub ────────────────────────────────────
// Applies first-occurrence (I) or every-occurrence (E) pairing for terms found
// in a minimal inline dictionary, extended by tp.dictionary_inline. v0.6 ships
// a placeholder hard-coded map; v0.7+ will load full dictionary via dictionary_ref.
//
// Determinism contract:
//   - Dictionary keys are sorted alphabetically before substitution → stable order
//   - Pairing format: `TERM (expansion)` — fixed, no locale/timestamp variance
//   - mode === 'N' is a no-op (return input unchanged)
//   - scope must include 'D' for document/MD or HTML rendering; otherwise no-op
//
// Low-frequency override (I mode): if a term appears <= 3 times in the surface,
// pair every occurrence (treats it as effectively the same as E for that term).
// Counted on the input text BEFORE rewriting.
//
// TODO(v0.7+): replace TERM_PAIRING_DEFAULT_DICT with dictionary_ref-loaded map;
// add C/B/R surface re-emit hooks (currently only D is in-band for this renderer).

const TERM_PAIRING_DEFAULT_DICT = Object.freeze({
  IR: "intermediate representation",
  ADR: "architecture decision record",
  GA: "general availability",
  MCDA: "multi-criteria decision analysis",
  RAPID: "역할 배분 표 (Recommend/Agree/Perform/Input/Decide)",
  MCP: "model context protocol",
  // Keep minimal — full dictionary deferred per v0.6 placeholder discipline.
});

function buildTermPairingDict(tp) {
  const inline = (tp && tp.dictionary_inline && typeof tp.dictionary_inline === "object") ? tp.dictionary_inline : {};
  // Inline overrides default on key collision.
  const merged = Object.assign({}, TERM_PAIRING_DEFAULT_DICT, inline);
  // Sort keys for deterministic substitution order.
  const keys = Object.keys(merged).sort();
  return { keys, map: merged };
}

function applyTermPairing(text, tp, surfaceCode /* 'D' for document */, warnings) {
  if (!tp || typeof tp !== "object") return text;
  const mode = tp.mode || "N";
  if (mode === "N") return text;
  const scope = Array.isArray(tp.scope) && tp.scope.length ? tp.scope : ["D"];
  if (!scope.includes(surfaceCode)) return text;

  const { keys, map } = buildTermPairingDict(tp);
  if (keys.length === 0) return text;

  let out = text;
  for (const term of keys) {
    const expansion = map[term];
    if (!expansion) continue;
    // Word-boundary match on canonical surface form. Skip terms already paired (TERM (...)).
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const reCountAll = new RegExp("\\b" + escaped + "\\b", "g");
    const matches = out.match(reCountAll);
    const count = matches ? matches.length : 0;
    if (count === 0) continue;

    // Skip if every occurrence already paired (heuristic: same number of "TERM (" sequences).
    const reAlreadyPaired = new RegExp("\\b" + escaped + "\\s*\\(", "g");
    const pairedMatches = out.match(reAlreadyPaired);
    const pairedCount = pairedMatches ? pairedMatches.length : 0;
    if (pairedCount >= count) continue;

    const lowFreqOverride = count <= 3;
    const effectiveMode = (mode === "I" && lowFreqOverride) ? "E" : mode;

    if (effectiveMode === "E") {
      // Pair every occurrence not already followed by "(".
      out = out.replace(
        new RegExp("\\b" + escaped + "\\b(?!\\s*\\()", "g"),
        `${term} (${expansion})`
      );
    } else {
      // I mode (high-frequency): pair first occurrence only.
      out = out.replace(
        new RegExp("\\b" + escaped + "\\b(?!\\s*\\()"),
        `${term} (${expansion})`
      );
    }
  }

  // Surface re-emit signal for non-document scopes (Hyperbrief.md §13 cross-module hook).
  // The renderer only handles surface 'D'; B/R scopes are signaled to caller via warnings
  // so Constellation A2A can re-emit. C (conversation) is structurally forward-only and
  // handled outside the renderer.
  for (const s of scope) {
    if (s !== "D" && s !== "C") {
      warnings.push(`term_pairing scope '${s}' requires cross-surface re-emit via Constellation A2A — handled outside renderer (v0.6 placeholder).`);
    }
  }
  return out;
}

// ─── v0.6 IR-based section injection ────────────────────────────────────────
// Compose the 4 v0.6 blocks into a single appended section. Order is fixed for
// determinism. Empty individual blocks are skipped so absent slots produce no
// output drift.

function buildV06Sections(ir) {
  const blocks = [];
  const lenses = ir?.section_0_decision_header?.evaluation_lenses;
  const lensesBlock = renderEvaluationLensesMd(lenses);
  if (lensesBlock) blocks.push(lensesBlock);

  const methodologies = ir?.section_8_recommendation?.recommended_methodology;
  const methBlock = renderRecommendedMethodologyMd(methodologies);
  if (methBlock) blocks.push(methBlock);

  const ma = ir?.maturity_anchor;
  const maBlock = renderMaturityAnchorMd(ma);
  if (maBlock) blocks.push(maBlock);

  const tp = ir?.section_0_decision_header?.audience_profile_fallback?.term_pairing;
  const tpBlock = renderTermPairingMd(tp);
  if (tpBlock) blocks.push(tpBlock);

  if (blocks.length === 0) return "";
  return "\n---\n\n## §v0.6 Extensions\n\n" + blocks.join("\n") + "\n";
}

// HTML variants — emit minimal semantic HTML so the HTML surface stays valid.
// Same determinism contract as the MD variants.

function renderEvaluationLensesHtml(lenses) {
  if (!Array.isArray(lenses) || lenses.length === 0) return "";
  const parts = [];
  parts.push('<section class="v06-evaluation-lenses">');
  parts.push("<h3>§0.6 Evaluation lenses (multi-lens)</h3>");
  parts.push("<table><thead><tr>");
  parts.push("<th>Lens id</th><th>Name</th><th>Dimensions</th><th>Current (simple)</th><th>Threshold (simple)</th><th>Current (weighted)</th><th>Threshold (weighted)</th><th>Verdict</th><th>Methodology</th>");
  parts.push("</tr></thead><tbody>");
  for (const l of lenses) {
    const dims = Array.isArray(l.dimensions) ? l.dimensions.join(", ") : "";
    const ts = (l.threshold_simple_mean === null || l.threshold_simple_mean === undefined) ? "—" : String(l.threshold_simple_mean);
    const tw = (l.threshold_weighted_mean === null || l.threshold_weighted_mean === undefined) ? "—" : String(l.threshold_weighted_mean);
    const cs = (l.current_simple === null || l.current_simple === undefined) ? "—" : String(l.current_simple);
    const cw = (l.current_weighted === null || l.current_weighted === undefined) ? "—" : String(l.current_weighted);
    const verdict = l.verdict || "—";
    const methodology = l.methodology_ref || "—";
    parts.push(
      `<tr><td><code>${escapeHtml(l.id || "")}</code></td>` +
        `<td>${escapeHtml(l.name || "")}</td>` +
        `<td>${escapeHtml(dims)}</td>` +
        `<td>${escapeHtml(cs)}</td><td>${escapeHtml(ts)}</td>` +
        `<td>${escapeHtml(cw)}</td><td>${escapeHtml(tw)}</td>` +
        `<td><strong>${escapeHtml(verdict)}</strong></td>` +
        `<td>${escapeHtml(methodology)}</td></tr>`
    );
  }
  parts.push("</tbody></table>");
  const rationales = lenses
    .map((l) => ({ id: l.id, r: tagText(l.rationale_one_line) }))
    .filter((x) => x.r);
  if (rationales.length > 0) {
    parts.push("<ul>");
    for (const x of rationales) {
      parts.push(`<li><code>${escapeHtml(x.id)}</code> — ${escapeHtml(x.r)}</li>`);
    }
    parts.push("</ul>");
  }
  parts.push("</section>");
  return parts.join("\n");
}

function renderRecommendedMethodologyHtml(items) {
  if (!Array.isArray(items) || items.length === 0) return "";
  const parts = [];
  parts.push('<section class="v06-recommended-methodology">');
  parts.push("<h3>§8.6 Recommended methodology (meta-decision)</h3>");
  parts.push("<ul>");
  for (const m of items) {
    const ver = m.version ? ` v${escapeHtml(m.version)}` : "";
    const applic = Array.isArray(m.applicability) && m.applicability.length
      ? ` <em>(applicability: ${escapeHtml(m.applicability.join(", "))})</em>`
      : "";
    const rationale = tagText(m.rationale_one_line);
    parts.push(
      `<li><code>${escapeHtml(m.id || "")}</code>${ver} — <strong>${escapeHtml(m.name || "")}</strong> — ` +
        `<code>${escapeHtml(m.anchor_path || "")}</code>${applic}` +
        (rationale ? ` — ${escapeHtml(rationale)}` : "") +
        "</li>"
    );
  }
  parts.push("</ul>");
  parts.push("</section>");
  return parts.join("\n");
}

function renderMaturityAnchorHtml(ma) {
  if (!ma || typeof ma !== "object") return "";
  const cs = ma.current_score || {};
  const th = ma.threshold || {};
  const parts = [];
  parts.push('<section class="v06-maturity-anchor">');
  parts.push("<h3>§M Maturity anchor</h3>");
  parts.push(
    `<blockquote><strong>Claimed label:</strong> <code>${escapeHtml(ma.claimed_label || "")}</code> — ` +
      `anchored to methodology <code>${escapeHtml(ma.anchor_methodology || "")}</code></blockquote>`
  );
  parts.push("<table><thead><tr><th>Metric</th><th>Current</th><th>Threshold</th></tr></thead><tbody>");
  parts.push(`<tr><td>Simple mean</td><td>${escapeHtml(cs.simple_mean ?? "—")}</td><td>${escapeHtml(th.simple_mean ?? "—")}</td></tr>`);
  parts.push(`<tr><td>Weighted mean</td><td>${escapeHtml(cs.weighted_mean ?? "—")}</td><td>${escapeHtml(th.weighted_mean ?? "—")}</td></tr>`);
  parts.push("</tbody></table>");
  if (ma.verdict) {
    parts.push(`<p><strong>Verdict:</strong> <code>${escapeHtml(ma.verdict)}</code></p>`);
  }
  const gap = tagText(ma.gap_analysis);
  if (gap) {
    parts.push(`<p><strong>Gap analysis:</strong> ${escapeHtml(gap)}</p>`);
  }
  parts.push("</section>");
  return parts.join("\n");
}

function renderTermPairingHtml(tp) {
  if (!tp || typeof tp !== "object") return "";
  const mode = tp.mode || "N";
  const scope = Array.isArray(tp.scope) && tp.scope.length ? tp.scope.join("+") : "—";
  const retro = tp.retroactive_apply || "prompt";
  const dictRef = tp.dictionary_ref || "";
  const dictInline = tp.dictionary_inline && typeof tp.dictionary_inline === "object"
    ? Object.keys(tp.dictionary_inline).length
    : 0;
  const parts = [];
  parts.push('<section class="v06-term-pairing">');
  parts.push("<p><strong>Term-pairing policy</strong> (v0.6):</p>");
  parts.push("<ul>");
  parts.push(`<li>Mode: <code>${escapeHtml(mode)}</code> <em>(E=every / I=initial-with-low-frequency-override / N=none)</em></li>`);
  parts.push(`<li>Scope: <code>${escapeHtml(scope)}</code> <em>(C=conversation, D=document, B=board, R=review)</em></li>`);
  parts.push(`<li>Retroactive apply: <code>${escapeHtml(retro)}</code></li>`);
  if (dictRef) parts.push(`<li>Dictionary ref: <code>${escapeHtml(dictRef)}</code></li>`);
  if (dictInline > 0) parts.push(`<li>Dictionary inline: ${dictInline} entries</li>`);
  parts.push("</ul>");
  parts.push("</section>");
  return parts.join("\n");
}

function buildV06SectionsHtml(ir) {
  const blocks = [];
  const lenses = ir?.section_0_decision_header?.evaluation_lenses;
  const lensesBlock = renderEvaluationLensesHtml(lenses);
  if (lensesBlock) blocks.push(lensesBlock);

  const methodologies = ir?.section_8_recommendation?.recommended_methodology;
  const methBlock = renderRecommendedMethodologyHtml(methodologies);
  if (methBlock) blocks.push(methBlock);

  const ma = ir?.maturity_anchor;
  const maBlock = renderMaturityAnchorHtml(ma);
  if (maBlock) blocks.push(maBlock);

  const tp = ir?.section_0_decision_header?.audience_profile_fallback?.term_pairing;
  const tpBlock = renderTermPairingHtml(tp);
  if (tpBlock) blocks.push(tpBlock);

  if (blocks.length === 0) return "";
  return '\n<hr>\n<section class="v06-extensions"><h2>§v0.6 Extensions</h2>\n' + blocks.join("\n") + "\n</section>\n";
}

// ─── Render entrypoints ─────────────────────────────────────────────────────

function resolveProfile(ir, opts) {
  const fromOpts = opts && opts.audience_profile_override;
  const fromIr = ir && ir.section_0_decision_header && ir.section_0_decision_header.audience_profile;
  const p = fromOpts || fromIr || DEFAULT_PROFILE;
  const clamp = (n) => Math.max(1, Math.min(5, Number.isFinite(n) ? Math.round(n) : 2));
  return {
    audience: clamp(p.audience),
    abbreviation: clamp(p.abbreviation),
    jargon: clamp(p.jargon),
  };
}

function loadTemplate(filename) {
  return fs.readFileSync(path.join(TEMPLATES_DIR, filename), "utf8");
}

// v0.5.2 H5: epistemic-tag form is a doughnut-chart metadata signal, not heading content. Strip
// the canonical `[verified|inferred|assumed|unknown]` prefix from §6.essence_one_line *only* — IR
// field always carries the canonical tag form; surface heading variant strips. Per bundle 008 H5.
function stripHeadingEpistemicTag(ir) {
  const e = ir?.section_6_decision_prompt;
  if (!e || typeof e.essence_one_line !== "string") return;
  e.essence_one_line = e.essence_one_line.replace(
    /^\[(verified|inferred|assumed|unknown)\](\[(관찰|추론|외부:[^\]]+|가정)\])?\s+/,
    ""
  );
}

// v0.5.2 H2: status-based template selection. BlockedStub gets the compact stub template; FullBrief
// gets the full brief template. Per bundle 008 H2.
function selectTemplate(ir, surface) {
  const isStub = ir && ir.status === "blocked_low_escalation";
  if (surface === "html") return isStub ? "brief-stub.html.template" : "brief.html.template";
  return isStub ? "brief-stub.md.template" : "brief.md.template";
}

function renderMd(ir, opts = {}) {
  const warnings = [];
  const profile = resolveProfile(ir, opts);

  // v0.5: auto-stamp recommended_artifacts metadata (line_count + body_hash) — intentional IR mutation
  // (the stamped fields are part of the IR contract and travel with archive_config archives).
  stampRecommendedArtifacts(ir);

  // v0.5.4 H7 fix: validate on the canonical IR BEFORE applying surface-only transforms.
  // Pre-v0.5.4 code applied stripHeadingEpistemicTag(ir) here, which removed the §6.essence_one_line
  // `[verified|inferred|assumed|unknown]` prefix from the IR proper — but the schema declares that
  // field as tagged_text with the prefix REQUIRED, so the subsequent validateIr(ir) call rejected
  // every FullBrief (the default validation-on code path crashed for the canonical case). The fix
  // is to (a) validate the canonical IR first, then (b) deep-clone for rendering and apply the
  // heading-strip to the clone only — IR original stays invariant, archive_config sees pristine IR,
  // and the surface still ships without the bracket prefix in the H1 heading. Per bundle 008 H7
  // (reported in _proposals/008_2026-06-03_hyperbrief-adoption/002_resync-and-H7.md).
  if (!opts.skip_validate) {
    const v = validateIr(ir);
    if (!v.ok) {
      throw new Error(
        "Hyperbrief IR schema validation failed:\n" +
          v.errors.map((e) => `  ${e.instancePath || "(root)"} ${e.message}`).join("\n")
      );
    }
    if (v.skipped) warnings.push("ajv not installed; schema validation skipped (Phase 1 fallback territory).");
  }

  // Surface-only clone — strip applies to the rendering copy only; archive sees the original IR.
  const renderIr = JSON.parse(JSON.stringify(ir));
  stripHeadingEpistemicTag(renderIr);

  const template = loadTemplate(selectTemplate(ir, "md"));
  const substituted = substitute(template, renderIr, "md");

  // v0.6: append optional v0.6 sections (evaluation_lenses / recommended_methodology /
  // maturity_anchor / term_pairing display) BEFORE tone-axis transforms so the same
  // bracket-tag rewrites apply to the new sections too. Each block is empty when the
  // corresponding IR slot is absent, preserving back-compat output for v0.5 IRs.
  const withV06 = substituted + buildV06Sections(renderIr);
  let output = applyToneAxes(withV06, profile, warnings);

  // v0.6: term_pairing post-process — applies to document surface ('D') when policy
  // declares it. Deterministic dictionary; no-op on mode 'N' or scope without 'D'.
  const tpPolicy = renderIr?.section_0_decision_header?.audience_profile_fallback?.term_pairing;
  output = applyTermPairing(output, tpPolicy, "D", warnings);

  // v0.5: surface_profile_estimate + AF-18 declared-vs-estimate gap warning
  const estimate = estimateSurfaceProfile(output, profile);
  if (estimate.declared_vs_estimate_gap_warning) {
    warnings.push(
      `AF-18: declared audience_profile {A${profile.audience}·B${profile.abbreviation}·J${profile.jargon}} ` +
      `vs rendered-surface estimate {A${estimate.audience}·B${estimate.abbreviation}·J${estimate.jargon}} ` +
      "gap >= 2 on at least one axis — consider tone-floor fallback or IR-content reconciliation."
    );
  }

  return {
    output,
    output_hash: sha256(output),
    ir_hash: canonicalIrHash(ir),
    audience_profile_applied: profile,
    surface_profile_estimate: estimate,
    warnings,
  };
}

function renderHtml(ir, opts = {}) {
  const warnings = [];
  const profile = resolveProfile(ir, opts);

  // v0.5: auto-stamp recommended_artifacts metadata — intentional IR mutation
  stampRecommendedArtifacts(ir);

  // v0.5.4 H7 fix: validate on the canonical IR BEFORE applying surface-only transforms.
  // See renderMd above for the full rationale (bundle 008 H7 — strip-then-validate ordering crashed
  // the validation-on default code path because schema requires the essence_one_line tag prefix).
  if (!opts.skip_validate) {
    const v = validateIr(ir);
    if (!v.ok) {
      throw new Error(
        "Hyperbrief IR schema validation failed:\n" +
          v.errors.map((e) => `  ${e.instancePath || "(root)"} ${e.message}`).join("\n")
      );
    }
    if (v.skipped) warnings.push("ajv not installed; schema validation skipped (Phase 1 fallback territory).");
  }

  // Surface-only clone — strip applies to the rendering copy only; IR original preserved for archive.
  // Note: the IR_JSON inlined into the HTML below is also the cloned (stripped) version so the
  // surface and the embedded debug-IR agree; archive_config callers pass the original ir separately.
  const renderIr = JSON.parse(JSON.stringify(ir));
  stripHeadingEpistemicTag(renderIr);

  let template = loadTemplate(selectTemplate(ir, "html"));

  // §5.6.7 tone-floor fallback button label resolution from IR or default.
  const fallback = (ir.section_0_decision_header && ir.section_0_decision_header.audience_profile_fallback) || {};
  const buttonLabel = fallback.button_label || "뭔 소리야? 한국어로 번역해줘 (내가 알아들을 수 있는 말로)";
  template = template
    .replace(/\{\{button_label\}\}/g, escapeHtml(buttonLabel))
    .replace(/\{\{IR_JSON\}\}/g, JSON.stringify(renderIr).replace(/<\/script>/gi, "<\\/script>"));

  // Inline the IR_JSON before regular substitution so {{...}} markers inside the IR string don't recurse.
  const substituted = substitute(template, renderIr, "html");

  // v0.6: append optional v0.6 sections as semantic HTML so they live alongside the
  // template-rendered HTML body. Order + emptiness rules match the MD path.
  const withV06 = substituted + buildV06SectionsHtml(renderIr);

  let output = applyToneAxes(withV06, profile, warnings);

  // v0.6: term_pairing post-process on the HTML surface. Applies the same dictionary
  // rewrites; since HTML escaping already happened for IR placeholders, we operate
  // on the assembled string and trust that pairing inserts plain parentheses (no
  // angle-bracket injection).
  const tpPolicy = renderIr?.section_0_decision_header?.audience_profile_fallback?.term_pairing;
  output = applyTermPairing(output, tpPolicy, "D", warnings);

  if (opts.self_contained_assets) {
    warnings.push("self_contained_assets requested but inline asset bundling is deferred to v0.4.3 — output still references external CDN scripts.");
  }

  // v0.5: surface_profile_estimate + AF-18 warning (text-only estimate over HTML; tag presence still detectable)
  const estimate = estimateSurfaceProfile(output, profile);
  if (estimate.declared_vs_estimate_gap_warning) {
    warnings.push(
      `AF-18: declared audience_profile {A${profile.audience}·B${profile.abbreviation}·J${profile.jargon}} ` +
      `vs rendered-surface estimate {A${estimate.audience}·B${estimate.abbreviation}·J${estimate.jargon}} ` +
      "gap >= 2 on at least one axis — consider tone-floor fallback button or IR-content reconciliation."
    );
  }

  return {
    output,
    output_hash: sha256(output),
    ir_hash: canonicalIrHash(ir),
    audience_profile_applied: profile,
    surface_profile_estimate: estimate,
    warnings,
  };
}

module.exports = {
  renderMd,
  renderHtml,
  canonicalIrHash,
  DEFAULT_PROFILE,
};

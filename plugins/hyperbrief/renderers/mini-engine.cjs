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

  // v0.5: auto-stamp recommended_artifacts metadata (line_count + body_hash)
  stampRecommendedArtifacts(ir);
  // v0.5.2 H5: strip epistemic tag from heading content
  stripHeadingEpistemicTag(ir);

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

  const template = loadTemplate(selectTemplate(ir, "md"));
  const substituted = substitute(template, ir, "md");
  const output = applyToneAxes(substituted, profile, warnings);

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

  // v0.5: auto-stamp recommended_artifacts metadata
  stampRecommendedArtifacts(ir);
  // v0.5.2 H5: strip epistemic tag from heading content
  stripHeadingEpistemicTag(ir);

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

  let template = loadTemplate(selectTemplate(ir, "html"));

  // §5.6.7 tone-floor fallback button label resolution from IR or default.
  const fallback = (ir.section_0_decision_header && ir.section_0_decision_header.audience_profile_fallback) || {};
  const buttonLabel = fallback.button_label || "뭔 소리야? 한국어로 번역해줘 (내가 알아들을 수 있는 말로)";
  template = template
    .replace(/\{\{button_label\}\}/g, escapeHtml(buttonLabel))
    .replace(/\{\{IR_JSON\}\}/g, JSON.stringify(ir).replace(/<\/script>/gi, "<\\/script>"));

  // Inline the IR_JSON before regular substitution so {{...}} markers inside the IR string don't recurse.
  const substituted = substitute(template, ir, "html");

  let output = applyToneAxes(substituted, profile, warnings);

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

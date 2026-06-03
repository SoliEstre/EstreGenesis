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
    Ajv = require("ajv");
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

function renderMd(ir, opts = {}) {
  const warnings = [];
  const profile = resolveProfile(ir, opts);

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

  const template = loadTemplate("brief.md.template");
  const substituted = substitute(template, ir, "md");
  const output = applyToneAxes(substituted, profile, warnings);

  return {
    output,
    output_hash: sha256(output),
    ir_hash: canonicalIrHash(ir),
    audience_profile_applied: profile,
    warnings,
  };
}

function renderHtml(ir, opts = {}) {
  const warnings = [];
  const profile = resolveProfile(ir, opts);

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

  let template = loadTemplate("brief.html.template");

  // §5.6.7 tone-floor fallback button label resolution from IR or default.
  const fallback = (ir.section_0_decision_header && ir.section_0_decision_header.audience_profile_fallback) || {};
  const buttonLabel = fallback.button_label || "뭔 소리야? 한국어로 번역해줘";
  template = template
    .replace(/\{\{button_label\}\}/g, escapeHtml(buttonLabel))
    .replace(/\{\{IR_JSON\}\}/g, JSON.stringify(ir).replace(/<\/script>/gi, "<\\/script>"));

  // Inline the IR_JSON before regular substitution so {{...}} markers inside the IR string don't recurse.
  const substituted = substitute(template, ir, "html");

  let output = applyToneAxes(substituted, profile, warnings);

  if (opts.self_contained_assets) {
    warnings.push("self_contained_assets requested but inline asset bundling is deferred to v0.4.1 — output still references external CDN scripts.");
  }

  return {
    output,
    output_hash: sha256(output),
    ir_hash: canonicalIrHash(ir),
    audience_profile_applied: profile,
    warnings,
  };
}

module.exports = {
  renderMd,
  renderHtml,
  canonicalIrHash,
  DEFAULT_PROFILE,
};

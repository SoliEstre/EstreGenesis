// Hyperbrief mini-engine — IR → MD/HTML deterministic renderer (v0.4.0 / Phase 2).
// Load-bearing invariant: same IR + same options → byte-identical output (Hyperbrief.md §7).
// Self-engineered template handling + tone-axis transform. Single npm dep (ajv) for schema validation.
//
// Three template paths, chosen by the IR's status and the output surface:
//   · Markdown, full brief and stub  → the block-template engine below («Block template engine»):
//     each / if / else / unless / ifEquals, expanded for real.
//   · Markdown, summary              → dot-path substitution + list blocks built in code and injected at sentinel
//     comments (injectSummaryBlocks), + the v0.6 sections built in code and appended (buildV06Sections).
//   · HTML, every tier               → dot-path substitution, and no template blocks. The summary tier's lists are
//     built in code and injected at sentinel comments, as in its Markdown; the v0.6 sections are built in code
//     and appended as HTML for every tier (buildV06SectionsHtml); the full brief's page builds its other lists in
//     the browser from the IR embedded in it, and the stub's HTML template holds dot-path placeholders only.
//   Both v0.6 builders read the full brief's paths only (section_0_decision_header.evaluation_lenses,
//   section_8_recommendation.recommended_methodology, maturity_anchor,
//   section_0_decision_header.audience_profile_fallback.term_pairing). The summary and stub schemas declare none
//   of them; an IR of those tiers that carries one anyway (the schemas do not reject extra fields) gets it shown
//   where a builder runs — the summary's Markdown and every tier's HTML, not the stub's Markdown.
//   A summary's own term-pairing policy (section_0_summary) is applied to its text but not shown; a stub's (at
//   its root) is shown by the stub's Markdown template but applied on neither surface and not shown in its HTML.
//   The policy that is applied is the one under the IR's header (headerOf: section_0_summary, else
//   section_0_decision_header). A stub with a policy at the full brief's path has it applied on both surfaces (a
//   stub has no section_0_summary, so that path is its header) and shown in its HTML; a summary with one at that
//   path has it shown but not applied (its header is section_0_summary).

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
// Dot-paths only. Used by the HTML surface (all tiers) and by the summary Markdown. It does NOT read
// `{{#each}}` / `{{#if}}` blocks — those belong to the block-template engine further down, which the
// full-brief and stub Markdown templates are run through instead.

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

// ─── Block template engine (Markdown surface: full brief + stub) ────────────
//
// The two Markdown templates that carry blocks are read as the block language they are written in. This
// section builds exactly the constructs those templates use, and nothing else; anything else is an error,
// not a silent skip.
//
// Constructs
//   {{path}}                     a value. Dot-path against the current scope; numeric segments index lists.
//   {{this}}                     the current item (inside an each). `this.path` is `path` read from the current
//                                item, as in Handlebars.
//   {{../path}}                  a value of the enclosing scope (one `../` per each level up).
//   {{@index}} {{@key}} {{@last}} loop data of the innermost each.
//   {{#each path}}…{{/each}}     over a list (in order) or over an object's keys (sorted, so the same
//                                logical IR gives the same bytes whatever order the keys were written in).
//   {{#if path}}…{{else}}…{{/if}}  `else` is accepted in `if` only.
//   {{#unless path}}…{{/unless}}
//   {{#ifEquals path "literal"}}…{{/ifEquals}}
//   {{!-- comment --}} / {{! comment }}   dropped. A short comment may not hold `{{` (its first `}}` would end
//                                it and leave the rest in the output); a long one may hold anything but `--}}`.
// Blocks nest, a construct inside itself included.
//
// Where this differs from Handlebars (on purpose)
//   · @index starts at 1. Every use in the templates is an ordinal a reader sees (a scenario number, a
//     milestone number, an ordered-list marker).
//   · «Empty» (false for if / unless, no iteration for each): a missing path, null, false, a string that is
//     empty or only whitespace, a list with no items, an object with no keys. NOT empty: the number 0 and
//     the boolean true. The IR's numbers are measurements (a threshold, a confidence); `{{#if threshold}}`
//     asks «is there a value», and a threshold of 0 is a value.
//   · A value that is an object or a list, asked for directly, prints as compact JSON (the same thing the
//     dot-path substitution has always printed) and adds a warning, since a template asking for text got
//     structure.
//   · ifEquals compares the printed text of a scalar with the literal. A missing path equals nothing, not
//     even the empty string.
//   · Object keys are visited in sorted order.
//   · `if` / `unless` / `ifEquals` do not open a scope; only `each` does. `../` climbs `each` levels.
//
// Errors — problems of the template itself, so they fail every render (each names the template, line, column)
//   an unknown block name · an unsupported tag form ({{{x}}}, {{>x}}, {{else if}}, a helper call, …) ·
//   a block that is not closed · a closing with no opening or the wrong opening · `else` outside an `if`
//   or twice · @index/@key/@last outside an each · `../` above the root · `{{` inside a short comment.
// Warnings — problems of the data's shape. The schema does not type every field a template reads (a stub's
//   audience_profile_fallback is one), so a schema-valid IR can put a string where a template expects a list.
//   That prints nothing at that place and adds a warning naming the template, line and path; it does not stop
//   the render: an each over a value that is neither list nor object (a non-empty string, a number, true) —
//   the warning names that each's path · @key inside an each over a list — the warning names the path of the
//   each it is in.
//
// Three rules the engine keeps by construction
//   1. A value substituted inside a block is handled exactly as a top-level value: nothing in this engine
//      escapes or alters a value except the table-row rule below, and the transforms that run after
//      expansion (epistemic-tag rewriting, tone axes, term pairing) see the whole expanded text — except
//      the values in code (next paragraph), which they see in neither place. (`opts.escape`, when given, is
//      applied to the template's own text and to each ifEquals literal, for a caller that passes a context
//      escaped the same way; renderMd uses it for the protected-value lead character, see «Protected values».)
//   2. Text from the IR is never read as template. The template is parsed to a tree first; values are only
//      ever appended to the output, never re-scanned.
//   3. Nothing is dropped silently: the parser's counts of block tokens are checked against an independent
//      count taken from the template source outside its comments, and the template text between tags is
//      checked to hold no `{{`.
//
// Values in code
//   A value tag that sits inside an inline code span of its template line (`{{target_file}}`) or between the
//   lines of a literal code fence in the template (```mermaid … ```) is a value «in code»: a path, an id, a
//   key the reader copies. The engine hands each such printed value to `opts.protect`, when given, and emits
//   what it returns; renderMd passes a function that swaps the value for a marker and puts it back after the
//   tone and term-pairing transforms, so term pairing, the jargon gloss and the abbreviation rewrites never
//   reach code. The one surface form it does get on the way back is the epistemic tag's (a tagged value in
//   backticks shows `확인됨 — …` at audience 1–2 like every other value). Rule 1 above is about where a value
//   sits in the block structure; this rule is about whether it sits in code, and it holds at the top level and
//   inside blocks alike. When an inline code span holds one value tag and nothing else, the engine prints the
//   span's delimiters: the template's own for a value with no backtick, and for a value that holds one a run of
//   backticks longer than any run in the value, with a space inside on both sides when the value begins or ends
//   with a backtick — otherwise a backtick in the value would close the span early.
//
// Table rows
//   A template line that starts with `|` (after any block tags) is a Markdown table row. A value expanded
//   anywhere on such a line — top-level or inside a block — is made row-safe, and only there: each line break
//   becomes `<br/>` and each `|` becomes `\|` (an unescaped `|` or a line break would split or end the row).
//   A GFM table removes one backslash before every `|` before it reads the cell, in code spans too; what
//   happens next depends on where the value sits.
//   · In prose, the cell is then read as Markdown, so a run of backslashes directly before a `|` is doubled as
//     well: a value's `a\|b` prints as `a\\\|b`, the table leaves `a\\|b`, and the reader sees `a\|b`. Without
//     the doubling the reader would see `a|b` — the backslash lost, not a cell added.
//   · In code (a value «in code», above), nothing reads the cell after that step, so the backslashes are not
//     doubled: `a\|b` prints as `a\\|b`, the table leaves `a\|b`, and that is what the code span shows.
//   Values outside table rows are printed verbatim; other backslashes are not touched.
//
// Standalone tag lines (as in Handlebars): a block tag or comment that is alone on its line takes the whole
// line with it, so `{{#if x}}` on its own line leaves no blank line behind. A line with two tags, or a tag
// and text, is not standalone and keeps its line break.

const BLOCK_NAMES = new Set(["each", "if", "unless", "ifEquals"]);
const PATH_SEGMENT = "[A-Za-z0-9_-]+";
const REF_RE = new RegExp("^((?:\\.\\./)*)(this|@index|@key|@last|" + PATH_SEGMENT + "(?:\\." + PATH_SEGMENT + ")*)$");

function lineOf(src, pos) {
  let line = 1;
  let lineStart = 0;
  for (let i = 0; i < pos && i < src.length; i++) {
    if (src.charCodeAt(i) === 10) { line++; lineStart = i + 1; }
  }
  return { line, col: pos - lineStart + 1 };
}

function templateError(src, name, pos, message) {
  const { line, col } = lineOf(src, pos);
  const err = new Error(`${name}:${line}:${col}: ${message}`);
  err.name = "HyperbriefTemplateError";
  err.templateName = name;
  err.templateLine = line;
  return err;
}

function parseRef(expr) {
  const m = REF_RE.exec(expr);
  if (!m) return null;
  const up = m[1].length / 3;
  const rest = m[2];
  if (rest[0] === "@") return up === 0 ? { up: 0, special: rest.slice(1), isThis: false, segs: [] } : null;
  if (rest === "this") return { up, special: null, isThis: true, segs: [] };
  // `this.name` is `name` on the current item (Handlebars reads it the same way), not a field called `this`.
  if (rest.startsWith("this.")) return { up, special: null, isThis: false, segs: rest.slice(5).split(".") };
  return { up, special: null, isThis: false, segs: rest.split(".") };
}

// Code regions of a template line, from the template text alone (tags are skipped, never read as text): the
// ranges between the backtick runs of an inline code span, CommonMark-style — an opening run is closed by the
// next run of the same length on the line, and a run with no closer is literal.
function inlineCodeRanges(src, ls, le, tagAt) {
  const runs = [];
  for (let p = ls; p < le;) {
    const t = tagAt.get(p);
    if (t) { p = t.end; continue; }
    if (src[p] === "`") {
      let q = p;
      while (q < le && src[q] === "`") q++;
      runs.push([p, q - p]);
      p = q;
      continue;
    }
    p++;
  }
  const ranges = [];
  for (let i = 0; i < runs.length;) {
    const j = runs.findIndex((r, k) => k > i && r[1] === runs[i][1]);
    if (j < 0) { i++; continue; }
    ranges.push([runs[i][0] + runs[i][1], runs[j][0], runs[i][1]]); // [content start, content end, delimiter length]
    i = j + 1;
  }
  return ranges;
}

// The delimiter of an inline code span that holds one printed value and nothing else. A value with no backtick
// keeps the template's delimiter. A value with one gets a run of backticks longer than any run in it (the rule
// the engine already follows for an artifact body's fence), with a space inside on both sides when the value
// begins or ends with a backtick (CommonMark strips one such space from each side).
function codeSpanDelimiter(value, templateDelim) {
  if (!value.includes("`")) return { open: templateDelim, close: templateDelim };
  const longest = (value.match(/`+/g) || []).reduce((m, r) => Math.max(m, r.length), 0);
  const fence = "`".repeat(Math.max(templateDelim.length, longest + 1));
  const pad = value.startsWith("`") || value.endsWith("`") ? " " : "";
  return { open: fence + pad, close: pad + fence };
}

// Literal code fences of the template: [start, end) source ranges of the lines between an opening fence line
// and its closing one. A fence line is template text (``` or ~~~, three or more, up to three spaces in).
function fenceRanges(src) {
  const ranges = [];
  let open = null;
  let pos = 0;
  for (const line of src.split("\n")) {
    const next = pos + line.length + 1;
    const m = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(line.replace(/\r$/, ""));
    if (open) {
      if (m && m[1][0] === open.ch && m[1].length >= open.len && m[2].trim() === "") {
        ranges.push([open.from, pos]);
        open = null;
      }
    } else if (m && !(m[1][0] === "`" && m[2].includes("`"))) {
      open = { ch: m[1][0], len: m[1].length, from: next };
    }
    pos = next;
  }
  if (open) ranges.push([open.from, src.length]);
  return ranges;
}

// Source text → flat list of text and tag tokens, with standalone lines removed and each tag marked with
// whether it sits on a Markdown table row.
function lexBlockTemplate(src, name) {
  const fail = (pos, msg) => { throw templateError(src, name, pos, msg); };
  const tags = [];
  for (let i = 0; ;) {
    const open = src.indexOf("{{", i);
    if (open < 0) break;
    if (src.startsWith("{{{", open)) fail(open, "unsupported construct `{{{` (raw output)");
    const dashed = src.startsWith("{{!--", open);
    const closer = dashed ? "--}}" : "}}";
    const innerStart = open + (dashed ? 5 : 2);
    const close = src.indexOf(closer, innerStart);
    if (close < 0) fail(open, "tag is never closed (no `" + closer + "` after it)");
    const end = close + closer.length;
    const inner = src.slice(innerStart, close).trim();
    const tag = { start: open, end, kind: null, name: null, args: "", ref: null };
    if (src[open + 2] === "!") {
      tag.kind = "comment";
      if (!dashed && inner.includes("{{")) fail(open, "`{{` inside a short comment — its first `}}` ends it; use {{!-- … --}}");
    } else {
      if (inner.includes("{{")) fail(open, "`{{` inside a tag");
      if (inner.startsWith("#")) {
        const m = /^#(\S+)(?:\s+([\s\S]*))?$/.exec(inner);
        if (!m || !BLOCK_NAMES.has(m[1])) {
          fail(open, "unknown block `" + inner.split(/\s+/)[0] + "` — the engine knows each, if, unless, ifEquals");
        }
        tag.kind = "open"; tag.name = m[1]; tag.args = (m[2] || "").trim();
      } else if (inner.startsWith("/")) {
        const nm = inner.slice(1).trim();
        if (!BLOCK_NAMES.has(nm)) fail(open, "unknown block closing `{{" + inner + "}}`");
        tag.kind = "close"; tag.name = nm;
      } else if (inner === "else") {
        tag.kind = "else";
      } else if (/^else\b/.test(inner)) {
        fail(open, "unsupported `" + inner + "` — `else` stands alone, and only inside an `if`");
      } else if (/^[>&^=<]/.test(inner)) {
        fail(open, "unsupported construct `{{" + inner + "}}`");
      } else {
        tag.kind = "var";
        tag.ref = parseRef(inner);
        if (!tag.ref) fail(open, "unsupported expression `{{" + inner + "}}` — a value is a dot-path, `this`, `../path`, @index, @key or @last");
      }
    }
    tags.push(tag);
    i = end;
  }

  const byStart = new Map(tags.map((t) => [t.start, t]));
  const lineStartOf = (pos) => src.lastIndexOf("\n", pos - 1) + 1;
  const lineEndOf = (pos) => { const e = src.indexOf("\n", pos); return e < 0 ? src.length : e; };
  const fences = fenceRanges(src);
  const items = [];
  let cursor = 0;
  for (const tag of tags) {
    const ls = lineStartOf(tag.start);
    const le = lineEndOf(tag.end);
    if (tag.kind === "var") {
      const span = inlineCodeRanges(src, ls, lineEndOf(tag.start), byStart).find(([a, b]) => tag.start >= a && tag.start < b);
      tag.inCode = fences.some(([a, b]) => tag.start >= a && tag.start < b) || !!span;
      // An inline code span whose whole content is this one tag (outside a fence): the engine prints the span's
      // delimiters itself, so it can lengthen them for a value that holds a backtick (codeSpanDelimiter).
      if (span && span[0] === tag.start && span[1] === tag.end && !fences.some(([a, b]) => tag.start >= a && tag.start < b)) {
        tag.span = { open: span[0] - span[2], close: span[1] + span[2], delim: src.slice(span[0] - span[2], span[0]) };
      }
    }
    // Row detection: the line's first thing, after any block tags / comments, is `|`.
    let p = ls;
    for (;;) {
      while (p < le && (src[p] === " " || src[p] === "\t")) p++;
      const t = byStart.get(p);
      if (t && t.kind !== "var") { p = t.end; continue; }
      break;
    }
    tag.inRow = src[p] === "|";
    tag.standalone = tag.kind !== "var" &&
      /^[ \t]*$/.test(src.slice(ls, tag.start)) && /^[ \t\r]*$/.test(src.slice(tag.end, le));
    const textEnd = tag.standalone ? ls : tag.span ? tag.span.open : tag.start;
    if (textEnd > cursor) items.push({ type: "text", s: src.slice(cursor, textEnd) });
    items.push({ type: "tag", tag });
    cursor = tag.standalone ? Math.min(le + 1, src.length) : tag.span ? tag.span.close : tag.end;
  }
  if (cursor < src.length) items.push({ type: "text", s: src.slice(cursor) });

  for (const it of items) {
    if (it.type === "text" && it.s.includes("{{")) {
      throw new Error(`${name}: engine assertion failed — template text holds an unparsed \`{{\``);
    }
  }
  // The template source with its comments cut out, for the parser's independent token count: a comment may
  // mention a block by name, and that is not a block.
  let bare = "";
  let from = 0;
  for (const t of tags) {
    if (t.kind !== "comment") continue;
    bare += src.slice(from, t.start) + " "; // a space, so cutting a comment out never joins two halves into a token
    from = t.end;
  }
  bare += src.slice(from);
  return { items, bare };
}

// Tokens → tree. Static rules are enforced here (unknown / unclosed / unmatched blocks, `else` placement,
// loop data and `../` depth), so a broken template fails on every render, not only on the data that reaches it.
function parseBlockTemplate(src, name) {
  const { items, bare } = lexBlockTemplate(src, name);
  const fail = (pos, msg) => { throw templateError(src, name, pos, msg); };
  const root = [];
  const stack = [{ nodes: root, block: null }];
  let eachDepth = 0;
  const seen = { open: 0, close: 0, else: 0 };

  const checkRef = (ref, pos) => {
    if (ref.special && eachDepth === 0) fail(pos, "`@" + ref.special + "` outside an each");
    if (ref.special && !["index", "key", "last"].includes(ref.special)) fail(pos, "unsupported `@" + ref.special + "`");
    if (ref.up > eachDepth) fail(pos, "`../` reaches above the template's root (" + eachDepth + " each level(s) open here)");
  };

  for (const it of items) {
    const top = stack[stack.length - 1];
    if (it.type === "text") { top.nodes.push({ type: "text", s: it.s }); continue; }
    const tag = it.tag;
    if (tag.kind === "comment") continue;
    if (tag.kind === "var") {
      checkRef(tag.ref, tag.start);
      top.nodes.push({ type: "var", ref: tag.ref, inRow: tag.inRow, inCode: tag.inCode, delim: tag.span ? tag.span.delim : null, pos: tag.start, line: lineOf(src, tag.start).line });
    } else if (tag.kind === "open") {
      seen.open++;
      const node = { type: "block", name: tag.name, ref: null, literal: null, body: [], elseBody: null, pos: tag.start };
      let argText = tag.args;
      if (tag.name === "ifEquals") {
        const m = /^(\S+)\s+"([^"]*)"$/.exec(argText);
        if (!m) fail(tag.start, "`ifEquals` takes a path and a double-quoted literal, e.g. {{#ifEquals mode \"E\"}}");
        argText = m[1];
        node.literal = m[2];
      }
      node.ref = parseRef(argText);
      if (!node.ref || (tag.name === "each" && node.ref.special)) {
        fail(tag.start, "`" + tag.name + "` takes a path (or `this`" + (tag.name === "each" ? "" : ", @index, @key, @last") + ") — got `" + tag.args + "`");
      }
      checkRef(node.ref, tag.start);
      top.nodes.push(node);
      stack.push({ nodes: node.body, block: node });
      if (tag.name === "each") eachDepth++;
    } else if (tag.kind === "else") {
      seen.else++;
      if (!top.block || top.block.name !== "if") fail(tag.start, "`else` outside an `if`");
      if (top.block.elseBody) fail(tag.start, "second `else` in the same `if`");
      top.block.elseBody = [];
      top.nodes = top.block.elseBody;
    } else if (tag.kind === "close") {
      seen.close++;
      if (!top.block) fail(tag.start, "closing `{{/" + tag.name + "}}` has no opening");
      if (top.block.name !== tag.name) fail(tag.start, "closing `{{/" + tag.name + "}}` does not match the `{{#" + top.block.name + "}}` that is open");
      stack.pop();
      if (tag.name === "each") eachDepth--;
    }
  }
  if (stack.length > 1) {
    const b = stack[stack.length - 1].block;
    fail(b.pos, "`{{#" + b.name + "}}` is never closed");
  }
  // Independent count, taken from the template source (outside its comments) and not from the tokens: every
  // block token must have been consumed by the tree. (This asserts on the template's own tokens, never on
  // rendered content.)
  const count = (re) => (bare.match(re) || []).length;
  const srcOpen = count(/\{\{\s*#/g);
  const srcClose = count(/\{\{\s*\//g);
  const srcElse = count(/\{\{\s*else\s*\}\}/g);
  if (srcOpen !== seen.open || srcClose !== seen.close || srcElse !== seen.else) {
    throw new Error(`${name}: engine assertion failed — template source has ${srcOpen} open / ${srcClose} close / ${srcElse} else tokens, the parser consumed ${seen.open} / ${seen.close} / ${seen.else}`);
  }
  return root;
}

function lookupDotPath(v, segs) {
  for (const s of segs) {
    if (v === null || v === undefined) return undefined;
    if (Array.isArray(v)) {
      if (!/^\d+$/.test(s)) return undefined;
      v = v[Number(s)];
    } else if (typeof v === "object") {
      if (!Object.prototype.hasOwnProperty.call(v, s)) return undefined;
      v = v[s];
    } else {
      return undefined;
    }
  }
  return v;
}

function isPresent(v) {
  if (v === undefined || v === null || v === false) return false;
  if (typeof v === "string") return v.trim() !== "";
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "object") return Object.keys(v).length > 0;
  return true;
}

function rowSafe(s, inCode) {
  // The table-row rule («Table rows» above): a value in code keeps its backslashes, a prose value has the run
  // before each `|` doubled.
  return s.replace(/\r\n|\r|\n/g, () => "<br/>").replace(/(\\*)\|/g, (m, bs) => (inCode ? bs : bs + bs) + "\\|");
}

function expandBlockTemplate(src, ctx, opts = {}) {
  const name = opts.name || "<template>";
  const tree = parseBlockTemplate(src, name);
  const warnings = opts.warnings || [];
  const esc = opts.escape || ((s) => s);
  const out = [];

  const refText = (ref) => (ref.isThis ? "this" : ref.special ? "@" + ref.special : ref.segs.join("."));
  const warnAt = (pos, msg) => {
    const { line, col } = lineOf(src, pos);
    warnings.push(`${name}:${line}:${col}: ${msg}`);
  };

  const resolve = (ref, scopes, pos) => {
    if (ref.special) {
      const f = scopes[scopes.length - 1];
      if (ref.special === "index") return f.index;
      if (ref.special === "last") return f.last;
      if (!f.isObj) {
        warnAt(pos, "`@key` inside the each over `" + f.path + "`, which is a list (an object was expected) — printed as empty");
        return undefined;
      }
      return f.key;
    }
    const f = scopes[scopes.length - 1 - ref.up];
    return ref.isThis ? f.value : lookupDotPath(f.value, ref.segs);
  };

  const printValue = (v, node) => {
    if (v === undefined || v === null) return "";
    if (typeof v === "string") return v;
    if (typeof v === "object") {
      warnings.push(`${name}:${node.line}: \`${refText(node.ref)}\` is ${Array.isArray(v) ? "a list" : "an object"} — printed as JSON`);
      return JSON.stringify(v);
    }
    return String(v);
  };

  const run = (nodes, scopes) => {
    for (const n of nodes) {
      if (n.type === "text") { out.push(esc(n.s)); continue; }
      if (n.type === "var") {
        const v = resolve(n.ref, scopes, n.pos);
        if (opts.onValue) opts.onValue({ path: refText(n.ref), line: n.line, empty: !isPresent(v) });
        let s = printValue(v, n);
        if (n.inRow) s = rowSafe(s, n.inCode);
        const span = n.delim ? codeSpanDelimiter(s, n.delim) : null;
        if (span) out.push(span.open);
        out.push(n.inCode && opts.protect ? opts.protect(s) : s);
        if (span) out.push(span.close);
        continue;
      }
      const v = resolve(n.ref, scopes, n.pos);
      if (n.name === "if") {
        run(isPresent(v) ? n.body : (n.elseBody || []), scopes);
      } else if (n.name === "unless") {
        if (!isPresent(v)) run(n.body, scopes);
      } else if (n.name === "ifEquals") {
        const scalar = typeof v === "string" || typeof v === "number" || typeof v === "boolean";
        if (scalar && String(v) === esc(n.literal)) run(n.body, scopes);
      } else {
        let entries;
        let isObj = false;
        if (Array.isArray(v)) {
          entries = v.map((x) => [undefined, x]);
        } else if (v !== null && typeof v === "object") {
          isObj = true;
          entries = Object.keys(v).sort().map((k) => [k, v[k]]);
        } else {
          entries = [];
          if (isPresent(v)) {
            warnAt(n.pos, "`each` over `" + refText(n.ref) + "`, which is " + (typeof v) + " — an each takes a list or an object; nothing printed");
          }
        }
        entries.forEach(([k, item], i) => {
          run(n.body, scopes.concat([{ value: item, index: i + 1, key: k, last: i === entries.length - 1, isObj, path: refText(n.ref) }]));
        });
      }
    }
  };
  run(tree, [{ value: ctx }]);
  return out.join("");
}

// Names the templates use that are not IR fields. They are computed on a copy of the IR, and a computed value
// always wins over an IR field of the same name — a fact the renderer can measure is derived, never filled in
// only when absent.
//   reversibility_badge_emoji        from section_0_decision_header.reversibility_badge_color
//   domain_format_is_<format>        from section_7_decision_tree.domain_format (exactly one is true)
//   mcda_rows                        [{alternative, cells:[{value, rationale}]}] — mcda_table.cells[] laid out
//                                    alternative × criterion, so every table row has one cell per criterion
//   _fence / _lang  (per recommended artifact)  a backtick fence longer than any backtick run in the body,
//                                    and the language as a safe fence info string
// One thing is filled in rather than computed: the term-pairing policy's schema defaults (mode `N`, scope
// [`D`], retroactive_apply `prompt`) when the IR leaves them out, because those are the values the policy has
// when they are absent (applyTermPairing uses the same mode and scope), and the policy table should show them rather
// than a blank.
// A recommended artifact's body is the text the reader is voting on, so it must reach the output untouched:
// the template receives a marker for it (and for its language), and the marker is swapped back after the
// tone / term-pairing transforms have run (otherwise they would gloss «jargon» inside code and rewrite
// tag-like text). Values the template prints in code get the same treatment through the engine's `protect`.
const BADGE_EMOJI = { green: "🟢", yellow: "🟡", red: "🔴" };
const TERM_PAIRING_DEFAULTS = [["mode", "N"], ["scope", ["D"]], ["retroactive_apply", "prompt"]];

// Protected values. A value the transforms must not touch (a recommended artifact's body and language, and every
// value the template prints in code) is replaced by a marker until they have run, then put back.
//
// The marker is five characters, the same five for every template and IR: U+E000 (the lead), U+E002, then the
// value's number in three characters of U+E100–U+E1FF (base 256, most significant first). Its length never
// depends on the input, so the text the transforms see grows by five characters per protected value, whatever
// the IR holds. The text around the markers is escaped instead: every U+E000 in the expanded text — in the
// template's own text and in every value printed outside code (the context is escaped before expansion) — is
// written as U+E000 U+E001. After that, a U+E000 in the text is always the first of a pair: followed by U+E001 it
// is one of the text's own, followed by U+E002 it starts a marker. `restore` decodes both in one left-to-right
// scan (find the next U+E000, read a fixed number of characters after it), builds no pattern from the input, and
// takes time linear in the text. A U+E000 followed by anything else, or a marker whose number names no value,
// cannot come out of the transforms (below), so it is an engine fault and throws.
//
// Why the transforms cannot split, reorder or duplicate a marker or an escape. Each transform is a pattern
// replacement. The fixed patterns (epistemic tags, sentence ends, the abbreviation and jargon words) match ASCII
// letters, brackets, periods, Hangul and whitespace; markers and escapes are private-use characters only, none of
// them a letter, digit, underscore or whitespace, so those patterns match none of their characters. The
// term-pairing pattern is built from the dictionary, and renderMd escapes the dictionary the same way as the
// text, so in a term U+E000 only ever stands as the first half of U+E000 U+E001: a term cannot match the
// U+E000 U+E002 that starts a marker and cannot end between the halves of a pair; and since a term must begin
// and end at a word boundary, and there is no word boundary between two private-use characters, it cannot begin
// inside a marker or on the second half of a pair. A match is replaced by itself followed by « (expansion)», and
// the expansion is escaped too. Every replacement text either holds no U+E000 or holds it only inside an escape,
// so every marker and every pair comes out whole and in its place, and none is added.
//
// Each value has a kind: «body» comes back exactly as it was; «code» comes back through `restore`'s second
// argument (renderMd passes the epistemic-tag rewrite, so a tagged value the template prints in backticks shows
// its tag in the same form as every other value, while the word-level transforms — term pairing, jargon gloss,
// abbreviation — never reach it). With `keepMarkers`, `restore` decodes the escapes only and leaves every marker
// in place: that is the text the surface estimate is measured on.
const PROTECT_LEAD = String.fromCharCode(0xE000);
const PROTECT_ESCAPE = 0xE001;
const PROTECT_MARKER = 0xE002;
const PROTECT_DIGIT0 = 0xE100;
const PROTECT_MARKER_LENGTH = 5;
const PROTECT_MAX_VALUES = 256 * 256 * 256;
const PROTECT_ESCAPED_LEAD = PROTECT_LEAD + String.fromCharCode(PROTECT_ESCAPE);

function escapeLead(s) {
  return s.indexOf(PROTECT_LEAD) < 0 ? s : s.split(PROTECT_LEAD).join(PROTECT_ESCAPED_LEAD);
}

// Inverse of escapeLead. In escaped text every U+E000 begins a pair, so splitting on the pair finds every one.
function unescapeLead(s) {
  return s.indexOf(PROTECT_LEAD) < 0 ? s : s.split(PROTECT_ESCAPED_LEAD).join(PROTECT_LEAD);
}

// escapeLead over every string of a JSON value, object keys included (an `each` over an object prints its keys).
// Escaping keeps the sorted order of keys and the emptiness of every value, so the block engine visits and tests
// the escaped context exactly as it would the original. An object whose keys are rewritten is rebuilt in the same
// key order; property definition, not assignment, so no key is read as a prototype setter.
function escapeLeadDeep(v) {
  if (typeof v === "string") return escapeLead(v);
  if (Array.isArray(v)) {
    for (let i = 0; i < v.length; i++) v[i] = escapeLeadDeep(v[i]);
    return v;
  }
  if (v === null || typeof v !== "object") return v;
  const keys = Object.keys(v);
  if (!keys.some((k) => k.indexOf(PROTECT_LEAD) >= 0)) {
    for (const k of keys) v[k] = escapeLeadDeep(v[k]);
    return v;
  }
  const out = {};
  for (const k of keys) {
    Object.defineProperty(out, escapeLead(k), { value: escapeLeadDeep(v[k]), enumerable: true, writable: true, configurable: true });
  }
  return out;
}

function makeProtector() {
  const values = [];
  const protect = (value, kind = "body") => {
    const k = values.length;
    if (k >= PROTECT_MAX_VALUES) throw new Error(`Hyperbrief render: more than ${PROTECT_MAX_VALUES} protected values in one brief`);
    values.push({ value, kind });
    return PROTECT_LEAD + String.fromCharCode(PROTECT_MARKER, PROTECT_DIGIT0 + (k >> 16), PROTECT_DIGIT0 + ((k >> 8) & 255), PROTECT_DIGIT0 + (k & 255));
  };
  const putBack = (index, codeTransform) => {
    const { value, kind } = values[index];
    return kind === "code" && codeTransform ? codeTransform(value) : value;
  };
  const digit = (text, at) => {
    const d = text.charCodeAt(at) - PROTECT_DIGIT0;
    return d >= 0 && d < 256 ? d : NaN;
  };
  const restore = (text, codeTransform, keepMarkers) => {
    let at = text.indexOf(PROTECT_LEAD);
    if (at < 0) return text;
    const parts = [];
    let from = 0; // start of the text not yet copied to `parts`
    while (at >= 0) {
      const kind = text.charCodeAt(at + 1);
      if (kind === PROTECT_ESCAPE) {
        parts.push(text.slice(from, at + 1)); // a U+E000 of the text itself: keep it, drop its escape character
        from = at + 2;
      } else if (kind === PROTECT_MARKER) {
        const index = digit(text, at + 2) * 65536 + digit(text, at + 3) * 256 + digit(text, at + 4); // NaN if cut short
        if (!(index < values.length)) throw new Error("engine assertion failed — a protected-value marker that names no value");
        if (keepMarkers) parts.push(text.slice(from, at + PROTECT_MARKER_LENGTH));
        else parts.push(text.slice(from, at), putBack(index, codeTransform));
        from = at + PROTECT_MARKER_LENGTH;
      } else {
        throw new Error("engine assertion failed — a U+E000 in the transformed text that is neither escaped nor a marker");
      }
      at = text.indexOf(PROTECT_LEAD, from);
    }
    parts.push(text.slice(from));
    return parts.join("");
  };
  return { protect, restore };
}

// The context the block engine expands: a copy of the IR with the computed names added, every string escaped
// (escapeLead), and each recommended artifact's body and language replaced by a marker.
function buildMdContext(renderIr, warnings) {
  const ctx = JSON.parse(JSON.stringify(renderIr));
  const { protect, restore } = makeProtector();
  const hdr = ctx.section_0_decision_header;
  ctx.reversibility_badge_emoji = (hdr && BADGE_EMOJI[hdr.reversibility_badge_color]) || "";

  const fmt = ctx.section_7_decision_tree && ctx.section_7_decision_tree.domain_format;
  for (const f of ["tree_mermaid", "probe_safe_to_fail", "single_action_card"]) ctx["domain_format_is_" + f] = fmt === f;

  const mt = ctx.section_5_consequences_block && ctx.section_5_consequences_block.mcda_table;
  if (mt && Array.isArray(mt.alternatives) && Array.isArray(mt.criteria)) {
    const cells = Array.isArray(mt.cells) ? mt.cells : [];
    const used = new Set();
    ctx.mcda_rows = mt.alternatives.map((alt) => ({
      alternative: alt,
      cells: mt.criteria.map((crit) => {
        const idx = cells.findIndex((c, i) => c && c.alternative === alt && c.criterion === crit && !used.has(i));
        if (idx < 0) return { value: "—", rationale: "" };
        used.add(idx);
        return { value: cells[idx].value, rationale: cells[idx].rationale };
      }),
    }));
    cells.forEach((c, i) => {
      if (!used.has(i)) warnings.push(`mcda_table.cells[${i}] (${JSON.stringify(c && c.alternative)} × ${JSON.stringify(c && c.criterion)}) matches no listed alternative × criterion, or repeats one already placed — not rendered`);
    });
  }

  // The full brief's policy sits under the header, the stub's at the root.
  for (const holder of [ctx.section_0_decision_header, ctx]) {
    const apf = holder && typeof holder === "object" ? holder.audience_profile_fallback : undefined;
    const tp = apf && typeof apf === "object" ? apf.term_pairing : undefined;
    if (!tp || typeof tp !== "object" || Array.isArray(tp)) continue;
    for (const [k, d] of TERM_PAIRING_DEFAULTS) if (tp[k] === undefined || tp[k] === null) tp[k] = JSON.parse(JSON.stringify(d));
  }

  // Each artifact's body and language are read before the escape: they are protected as the IR holds them.
  const rc0 = ctx.section_8_recommendation && ctx.section_8_recommendation.recommendation_conditional;
  const raw = (rc0 && Array.isArray(rc0.recommended_artifacts) ? rc0.recommended_artifacts : []).map((a) => {
    if (!a || typeof a !== "object" || typeof a.body !== "string") return null;
    const longest = (a.body.match(/`+/g) || []).reduce((m, r) => Math.max(m, r.length), 0);
    a._fence = "`".repeat(Math.max(3, longest + 1));
    return { body: a.body, lang: typeof a.language === "string" ? a.language.trim().split(/\s+/)[0].replace(/`/g, "") : "" };
  });

  const escaped = escapeLeadDeep(ctx);
  const rc = escaped.section_8_recommendation && escaped.section_8_recommendation.recommendation_conditional;
  const arts = rc && Array.isArray(rc.recommended_artifacts) ? rc.recommended_artifacts : [];
  for (let i = 0; i < raw.length; i++) {
    const r = raw[i];
    if (!r) continue;
    const a = arts[i];
    const lang = r.lang;
    a._lang = lang ? protect(lang) : "";
    a.body = protect(r.body);
  }
  return { ctx: escaped, protect, restore };
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

// `sameLine`: the tag's trailing whitespace is consumed only up to the end of its line. The Markdown block
// path sets it — a list item that ends in a tag would otherwise swallow the line break and pull the next
// bullet into the item. The other paths keep the original `\s*` so their output stays byte-identical.
function applyAudienceTransform(text, level, sameLine) {
  const ws = sameLine ? "[ \\t]*" : "\\s*";
  if (level <= 2) {
    // L1-L2: epistemic bracket tags → 한국어 단어형 (prose flow 보존)
    // The replacement string already ends in "— ", so the tag's own trailing whitespace must be
    // consumed too; a plain split/join left "추론 —  텍스트" with a doubled space in every brief
    // rendered at L1-L2. The L4-L5 branch below already used \s* — this is the same rule, applied
    // symmetrically rather than in one of the two places.
    let out = text;
    for (const [bracket, korean] of Object.entries(EPISTEMIC_TAG_KO)) {
      const re = new RegExp(bracket.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ws, "g");
      out = out.replace(re, () => korean);
    }
    return out;
  }
  if (level >= 4) {
    // L4-L5: bracket tags → superscript shorthand
    return text
      .replace(new RegExp("\\[verified\\]" + ws, "g"), "ᵛ ")
      .replace(new RegExp("\\[inferred\\]" + ws, "g"), "ⁱ ")
      .replace(new RegExp("\\[assumed\\]" + ws, "g"), "ᵃ ")
      .replace(new RegExp("\\[unknown\\]" + ws, "g"), "ᵘ ");
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

function applyToneAxes(text, profile, warnings, opts = {}) {
  let out = text;
  out = applyAudienceTransform(out, profile.audience, !!opts.sameLine);
  out = applyAbbreviationTransform(out, profile.abbreviation);
  out = applyJargonTransform(out, profile.jargon, warnings);
  return out;
}

// ─── v0.5 surface_profile_estimate (auto-computed, declared-vs-effective gap) ──

const CANONICAL_JARGON_TERMS = ["RAPID", "Cynefin", "MCDA", "Toulmin", "Hyrum", "AHP", "Floridi", "Sennett", "Habermas", "Gadamer", "Bezos", "Snowden", "Drucker", "Klein", "Kahneman", "Lehman", "Brooks", "Fowler", "Hickey", "Ousterhout", "Wirfs-Brock", "Nygard", "Bostrom", "Jonas", "Rawls", "Aristotle", "Toulmin", "Popper", "Goldman", "Zagzebski"];

// A token without its leading and trailing characters that are not ASCII letters or digits — the result of
// replacing /^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g with "", by a loop from each end. That pattern retries its second
// branch at every position of a run that does not reach the end of the token, which is quadratic in the token.
function trimToAlphanumeric(t) {
  const alnum = (c) => (c >= 48 && c <= 57) || (c >= 65 && c <= 90) || (c >= 97 && c <= 122);
  let a = 0;
  let b = t.length;
  while (a < b && !alnum(t.charCodeAt(a))) a++;
  while (b > a && !alnum(t.charCodeAt(b - 1))) b--;
  return t.slice(a, b);
}

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

  // gloss_pattern_present: heuristic — the text glosses *something* anywhere ("X(설명)" / "X — gloss").
  //   v0.7.6 rename: this was called `first_use_gloss_present`, which claimed far more than it tested —
  //   any parenthetical anywhere satisfied it, including one unrelated to any abbreviation. The name is now
  //   what the expression measures; the abbreviation-specific measurement is the ratio below.
  const gloss_pattern_present = /\([^)]{2,}\)/.test(text) || / — [가-힣A-Za-z]+/.test(text);

  // ── abbreviation metrics (v0.7.6) ──────────────────────────────────────────
  // The abbreviation axis had no abbreviation metric at all — it was estimated from
  //   `avg_sentence_length_chars`, so a text of short plain sentences scored as "uses bare
  //   abbreviations" and a long-sentenced text full of bare acronyms scored as "expands them".
  //   Sentence length is a real metric; it is just not this axis. Level semantics: **1 = expanded
  //   on first use (plainest), 5 = bare**. So the driver is «how often is an abbreviation left
  //   bare», not «how long are the sentences».
  const ABBREV_RE = /^[A-Z][A-Z0-9]{1,7}$/;
  const abbrevTokens = tokens
    .map((t) => trimToAlphanumeric(t))
    .filter((t) => ABBREV_RE.test(t));
  const abbrev_occurrences = abbrevTokens.length;
  const abbrevDistinct = [...new Set(abbrevTokens)];
  const abbrev_distinct = abbrevDistinct.length;
  const abbrevs_per_1000_tokens = Number(((abbrev_occurrences / tokenCount) * 1000).toFixed(2));

  // Glossed at first use? Two shapes, checked at the **first** occurrence only:
  //   "ABBR (expansion)"  ·  "expansion (ABBR)". Later expansions do not count — the axis is about
  //   whether a reader meeting the term for the first time was given its meaning.
  let glossedFirstUse = 0;
  for (const a of abbrevDistinct) {
    const re = new RegExp("(^|[^A-Za-z0-9])" + a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "([^A-Za-z0-9]|$)");
    const m = re.exec(text);
    if (!m) continue;
    const at = m.index + m[1].length;
    const after = text.slice(at + a.length, at + a.length + 80);
    const before = text.slice(Math.max(0, at - 80), at);
    const followedByParen = /^\s*[（(][^)）]{3,}[)）]/.test(after);
    const wrappedInParen = /[（(]\s*$/.test(before) && /^\s*[)）]/.test(text.slice(at + a.length))
      && /[A-Za-z가-힣][^（(]{2,}[（(]\s*$/.test(before);
    if (followedByParen || wrappedInParen) glossedFirstUse++;
  }
  const abbrev_first_use_glossed = glossedFirstUse;
  // 3-valued on purpose: a text with no abbreviations has not "expanded them all" — there was
  //   nothing to expand. Reporting 0 or 1 there would make «not measurable» look like a measurement
  //   and drive a declared-vs-estimate gap warning off nothing.
  const abbrev_bare_ratio = abbrev_distinct
    ? Number(((abbrev_distinct - glossedFirstUse) / abbrev_distinct).toFixed(3))
    : null;

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

  // abbreviation: bare-abbreviation ratio, weighted by density (v0.7.6 — was sentence length).
  //   null when the text carries no abbreviations: nothing to expand is not the same as expanding
  //   everything, and the gap check below skips a null rather than scoring it.
  let abbreviation_est = null;
  if (abbrev_bare_ratio !== null) {
    if (abbrev_bare_ratio >= 0.8) abbreviation_est = 5;
    else if (abbrev_bare_ratio >= 0.6) abbreviation_est = 4;
    else if (abbrev_bare_ratio >= 0.35) abbreviation_est = 3;
    else if (abbrev_bare_ratio > 0) abbreviation_est = 2;
    else abbreviation_est = 1;
    // A single bare acronym in a long plain document is not a level-5 surface. Density pulls the
    //   estimate back toward plain when bare terms are rare in absolute terms.
    if (abbreviation_est >= 4 && abbrevs_per_1000_tokens < 3) abbreviation_est -= 1;
  }

  // jargon: jargon_terms_per_1000_tokens
  let jargon_est = 2;
  if (jargon_terms_per_1000_tokens >= 40) jargon_est = 5;
  else if (jargon_terms_per_1000_tokens >= 20) jargon_est = 4;
  else if (jargon_terms_per_1000_tokens >= 8) jargon_est = 3;
  else if (jargon_terms_per_1000_tokens >= 2) jargon_est = 2;
  else jargon_est = 1;

  // v0.7.6 — a null axis is «not measurable on this surface», never a gap. Comparing against null
  //   would coerce to 0 and manufacture a 2-level gap out of an absent measurement.
  const gapOn = (declared, est) => est !== null && typeof declared === "number" && Math.abs(declared - est) >= 2;
  const declared_vs_estimate_gap_warning =
    gapOn(declaredProfile.audience, audience_est) ||
    gapOn(declaredProfile.abbreviation, abbreviation_est) ||
    gapOn(declaredProfile.jargon, jargon_est);

  return {
    audience: audience_est,
    abbreviation: abbreviation_est,
    jargon: jargon_est,
    raw_metrics: {
      english_noun_ratio: Number(english_noun_ratio.toFixed(3)),
      avg_sentence_length_chars,
      jargon_terms_per_1000_tokens: Number(jargon_terms_per_1000_tokens.toFixed(2)),
      gloss_pattern_present,
      abbrev_occurrences,
      abbrev_distinct,
      abbrevs_per_1000_tokens,
      abbrev_first_use_glossed,
      abbrev_bare_ratio,
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

// `literal`: the pairing is inserted through a function, so a `$&` / `$1` / `$$` in a dictionary value prints as
// written. The Markdown block path sets it; the other paths keep the string replacement so their output stays
// byte-identical (there, a dictionary value holding `$&` is still read as a substitution escape).
function applyTermPairing(text, tp, surfaceCode /* 'D' for document */, warnings, opts = {}) {
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
    const paired = `${term} (${expansion})`;
    const replacement = opts.literal ? () => paired : paired;

    if (effectiveMode === "E") {
      // Pair every occurrence not already followed by "(".
      out = out.replace(
        new RegExp("\\b" + escaped + "\\b(?!\\s*\\()", "g"),
        replacement
      );
    } else {
      // I mode (high-frequency): pair first occurrence only.
      out = out.replace(
        new RegExp("\\b" + escaped + "\\b(?!\\s*\\()"),
        replacement
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
  // v0.8.0: headerOf() so a SummaryBrief's section_0_summary is read too. Before this, a summary's
  // declared tone silently fell through to DEFAULT_PROFILE — a declaration nobody honored.
  const hdr = headerOf(ir);
  const fromIr = hdr && hdr.audience_profile;
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
// v0.8.0: SummaryBrief (status 'summary') gets its own pair — the §2.5 tier between the two.
function selectTemplate(ir, surface) {
  const status = ir && ir.status;
  const html = surface === "html";
  if (status === "summary") return html ? "brief-summary.html.template" : "brief-summary.md.template";
  if (status === "blocked_low_escalation") return html ? "brief-stub.html.template" : "brief-stub.md.template";
  return html ? "brief.html.template" : "brief.md.template";
}

// v0.8.0 — the §0 header lives at a different key per tier: `section_0_decision_header` on a FullBrief,
// `section_0_summary` on a SummaryBrief. Everything that reads the header (tone profile, term-pairing
// policy) goes through here, so adding the tier did not require teaching each reader about both keys —
// which is the shape in which one reader gets missed and silently falls back to a default.
function headerOf(ir) {
  if (!ir) return undefined;
  return ir.section_0_summary || ir.section_0_decision_header;
}

// ─── SummaryBrief block builders (v0.8.0) ───────────────────────────────────
//
// The summary templates are substituted by dot-path only (`substitute`), not by the block-template
// engine — their lists and conditionals are built here and injected at sentinel comments in the template,
// for both surfaces. Values are escaped per surface at build time, because `substitute` only escapes
// what IT substitutes.
//
// Every `.replace` below uses a FUNCTION replacement. A string replacement would treat `$` in the
// built block as a substitution escape (`$&`, `$1`, `$$`) and silently mangle any content containing
// it — the same trap that collapsed a `$` to nothing in a CHANGELOG entry once already.

function injectSummaryBlocks(template, ir, surface) {
  const html = surface === "html";
  const esc = html ? escapeHtml : (s) => String(s == null ? "" : s);
  const core = (ir && ir.summary_core) || {};
  const put = (tpl, sentinel, block) => tpl.replace(sentinel, () => block);

  // ── options: ≥2, each with BOTH directions. Gain-only would be a pitch (§4 MUST-carry table).
  const options = Array.isArray(core.options) ? core.options : [];
  let optionsBlock;
  if (!options.length) {
    optionsBlock = html
      ? '<p><b>⚠ 선택지가 비어 있어요</b> — SummaryBrief 스키마는 ≥2 를 요구해요 (AF-30).</p>'
      : "> ⚠ **선택지가 비어 있어요** — SummaryBrief 스키마는 ≥2 를 요구해요 (AF-30).";
  } else if (html) {
    optionsBlock =
      "<table><thead><tr><th>선택지</th><th>얻는 것</th><th>잃는 것</th></tr></thead><tbody>" +
      options.map((o) =>
        `<tr><td><b>${esc(o.label)}</b></td>` +
        `<td class="gain">${esc(o.gain)}</td>` +
        `<td class="loss">${esc(o.loss)}</td></tr>`
      ).join("") +
      "</tbody></table>";
  } else {
    optionsBlock =
      "| 선택지 | 얻는 것 | 잃는 것 |\n|---|---|---|\n" +
      options.map((o) => `| **${o.label}** | ${o.gain} | ${o.loss} |`).join("\n");
  }

  // ── key unknowns: ≥1. An all-[verified] summary is a summary that stopped looking.
  const unknowns = Array.isArray(core.key_unknowns) ? core.key_unknowns : [];
  const unknownsBlock = unknowns.length
    ? (html
        ? "<ul>" + unknowns.map((u) => `<li>${esc(u)}</li>`).join("") + "</ul>"
        : unknowns.map((u) => `- ${u}`).join("\n"))
    : (html
        ? '<p><b>⚠ 모르는 것이 하나도 없다고 적혀 있어요</b> — 스키마는 ≥1 을 요구해요.</p>'
        : "> ⚠ **모르는 것이 하나도 없다고 적혀 있어요** — 스키마는 ≥1 을 요구해요.");

  // ── meta branch: the reader's right to refuse, identical shape to §7's (shared $def).
  const mb = core.meta_branch || {};
  const MB = [
    ["accept", "받아들이기", mb.accept],
    ["reject", "질문 자체를 거부", mb.reject_framing],
    ["defer", "보류", mb.defer],
    ["investigate", "조사 먼저", mb.request_investigation],
  ];
  const metaBlock = html
    ? '<div class="meta-branch">' +
      MB.map(([cls, ko, txt]) => `<div class="mb ${cls}"><b>${esc(ko)}</b>${esc(txt || "—")}</div>`).join("") +
      "</div>"
    : MB.map(([, ko, txt]) => `- **${ko}** — ${txt || "—"}`).join("\n");

  // ── recommendation metadata: confidence + switch_if (+ optional escalate_note).
  const s8 = (ir && ir.section_8_summary) || {};
  const recRows = [["신뢰도", s8.confidence == null ? "—" : String(s8.confidence)], ["뒤집히는 조건", s8.switch_if || "—"]];
  if (s8.escalate_note) recRows.push(["전체 브리핑이 더 주는 것", s8.escalate_note]);
  const recBlock = html
    ? "<ul>" + recRows.map(([k, v]) => `<li><b>${esc(k)}</b> — ${esc(v)}</li>`).join("") + "</ul>"
    : recRows.map(([k, v]) => `- **${k}**: ${v}`).join("\n");

  // ── §5.6.10 escalation affordance. Phrases go through the ONE normalizer (MUST-25); an empty
  //    result means no phrases, never the default list, so an empty list is surfaced as a defect.
  const fbf = (ir && ir.full_brief_fallback) || {};
  const phrases = normalizeTriggerPhrases(fbf.trigger_phrases_md);
  const label = fbf.button_label || "풀 브리핑으로 보여줘 (근거까지)";
  let fallbackBlock;
  if (html) {
    fallbackBlock = "";
  } else if (fbf.enabled === false) {
    fallbackBlock = "> ⚠ **전체 브리핑 어포던스가 꺼져 있어요** — 요약은 근거를 압축한 것이라, 근거로 가는 길이 없으면 브리핑이 아니라 주장이에요 (AF-30).";
  } else {
    const list = phrases.length
      ? phrases.map((p) => `\`${p}\``).join(" · ")
      : "**(문구 목록이 비어 있어요 — 스키마 기본값이 대신 적용되지 않아요, AF-30)**";
    fallbackBlock = `> 🔎 **근거까지 보시려면**: “${label}” — 또는 이 중 아무 말이나 하시면 돼요: ${list}\n>\n> 같은 결정 번호로 전체 브리핑을 드려요. 요구하신 것 자체는 답으로 기록되지 않아요.`;
  }

  // HTML surface: the two affordance buttons + the reversibility chip.
  const toneBtn = '<button id="tone-floor-btn" type="button" data-default-label="' +
    escapeHtml(((headerOf(ir) || {}).audience_profile_fallback || {}).button_label || "뭔 소리야? 한국어로 번역해줘 (내가 알아들을 수 있는 말로)") + '">' +
    escapeHtml(((headerOf(ir) || {}).audience_profile_fallback || {}).button_label || "뭔 소리야? 한국어로 번역해줘 (내가 알아들을 수 있는 말로)") + "</button>";
  const fullBtn = fbf.enabled === false
    ? '<span class="chip red">전체 브리핑 어포던스 꺼짐 (AF-30)</span>'
    : '<button id="full-brief-btn" type="button" data-decision-id="' + escapeHtml((ir && ir.decision_id) || "") +
      '" data-trigger-phrases="' + escapeHtml(phrases.join("|")) + '">' + escapeHtml(label) + "</button>";
  const h = headerOf(ir) || {};
  const color = ["green", "yellow", "red"].includes(h.reversibility_badge_color) ? h.reversibility_badge_color : "";
  const revChip = `<span class="chip ${color}">되돌림 ${escapeHtml(h.reversibility_class || "?")}</span>`;

  let out = template;
  out = put(out, "<!--SUMMARY_OPTIONS-->", optionsBlock);
  out = put(out, "<!--SUMMARY_UNKNOWNS-->", unknownsBlock);
  out = put(out, "<!--SUMMARY_METABRANCH-->", metaBlock);
  out = put(out, "<!--SUMMARY_REC_META-->", recBlock);
  out = put(out, "<!--SUMMARY_FALLBACK-->", fallbackBlock);
  out = put(out, "<!--SUMMARY_TONE_BTN-->", toneBtn);
  out = put(out, "<!--SUMMARY_FULL_BTN-->", fullBtn);
  out = put(out, "<!--SUMMARY_REVERSIBILITY_CHIP-->", revChip);
  return out;
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

  // Two template paths. The summary tier: list/conditional blocks are built in code and injected into the
  // template BEFORE substitution, so injected content still flows through the tone-axis transforms that
  // follow (epistemic-tag rewriting in particular). The full brief and the stub: the template is written in
  // the block language and is expanded by the block-template engine; the expanded text then flows through
  // the same transforms. `restore` swaps protected values (recommended-artifact bodies, values the template
  // prints in code) back in after them.
  const templateName = selectTemplate(ir, "md");
  let template = loadTemplate(templateName);
  let substituted;
  let restore = (text) => text;
  const isSummary = !!(ir && ir.status === "summary");
  if (isSummary) {
    template = injectSummaryBlocks(template, renderIr, "md");
    substituted = substitute(template, renderIr, "md");
  } else {
    const built = buildMdContext(renderIr, warnings);
    // The context is escaped (escapeLead), so the engine escapes the template's own text the same way; a value in
    // code reaches `protect` escaped and is stored as the IR holds it.
    substituted = expandBlockTemplate(template, built.ctx, {
      name: templateName, warnings, onValue: opts.on_template_value, escape: escapeLead,
      protect: (s) => built.protect(unescapeLead(s), "code"),
    });
    restore = built.restore;
  }
  // The block path's two corrections to the shared transforms (a tag never swallows a line break; a dictionary
  // value is inserted literally). The summary path keeps the original behaviour, byte for byte.
  const blockPath = !isSummary;

  // v0.6: append optional v0.6 sections (evaluation_lenses / recommended_methodology /
  // maturity_anchor / term_pairing display) BEFORE tone-axis transforms so the same
  // bracket-tag rewrites apply to the new sections too. Each block is empty when the
  // corresponding IR slot is absent, preserving back-compat output for v0.5 IRs.
  // The full-brief template now expands those four slots itself, in place (§0 and §8), so appending
  // them again would print each twice; only the summary path (whose template has no such blocks) appends.
  const withV06 = isSummary ? substituted + buildV06Sections(renderIr) : substituted;
  let output = applyToneAxes(withV06, profile, warnings, { sameLine: blockPath });

  // v0.6: term_pairing post-process — applies to document surface ('D') when policy
  // declares it. Deterministic dictionary; no-op on mode 'N' or scope without 'D'.
  const tpPolicy = headerOf(renderIr)?.audience_profile_fallback?.term_pairing;
  // On the block path the text is escaped («Protected values»), so the dictionary is escaped the same way: a term
  // matches where it matches in the unescaped text, and an expansion adds no U+E000 of its own.
  const tpInline = tpPolicy && typeof tpPolicy === "object" ? tpPolicy.dictionary_inline : undefined;
  const tpApplied = blockPath && tpInline && typeof tpInline === "object"
    ? Object.assign({}, tpPolicy, { dictionary_inline: escapeLeadDeep(JSON.parse(JSON.stringify(tpInline))) })
    : tpPolicy;
  output = applyTermPairing(output, tpApplied, "D", warnings, { literal: blockPath });

  // v0.5: surface_profile_estimate + AF-18 declared-vs-estimate gap warning. Measured on the text the tone
  // transforms worked on — protected values still as markers, escapes decoded — so code the transforms may not
  // touch (an artifact body, a path) does not drive a gap that no tone setting could close. (On the summary path
  // there is nothing protected or escaped, and this is the output itself.)
  const estimate = estimateSurfaceProfile(restore(output, null, true), profile);
  output = restore(output, (v) => applyAudienceTransform(v, profile.audience, true));
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

  // v0.8.0: summary-tier blocks injected before substitution (see renderMd for the ordering rationale).
  if (ir && ir.status === "summary") template = injectSummaryBlocks(template, renderIr, "html");

  // §5.6.7 tone-floor fallback button label resolution from IR or default. headerOf() so the summary
  // tier's section_0_summary is read too.
  const fallback = (headerOf(ir) && headerOf(ir).audience_profile_fallback) || {};
  const buttonLabel = fallback.button_label || "뭔 소리야? 한국어로 번역해줘 (내가 알아들을 수 있는 말로)";
  // FUNCTION replacements, not strings: `String.prototype.replace` reads `$&` / `$'` / `$1` / `$$` in a
  // string replacement as substitution escapes. The IR_JSON payload is the dangerous one — a `$` inside
  // any IR string (`$ref`, a price, a regex) silently rewrote the inlined JSON, and the corruption
  // surfaces as a client-side parse failure far from its cause. The label has the same exposure.
  const irJson = JSON.stringify(renderIr).replace(/<\/script>/gi, "<\\/script>");
  template = template
    .replace(/\{\{button_label\}\}/g, () => escapeHtml(buttonLabel))
    .replace(/\{\{IR_JSON\}\}/g, () => irJson);

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
  const tpPolicy = headerOf(renderIr)?.audience_profile_fallback?.term_pairing;
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

// ── v0.7.7 §5.6.7 — `trigger_phrases_md` 정규화 (단일 구현) ────────────────────
// 이 칸의 이름은 `_md` 로 끝나요. 그 접미사는 «여기엔 마크다운 글이 들어간다» 로 읽히는데, 규격은
//   **배열**을 요구했어요. 이름이 요구와 어긋나면 처음 쓰는 쪽은 이름을 믿어요 — 실제로 이 저장소의
//   `ultrasafe` MCP 가 `trigger_phrases_md: ""` (문자열) 을 실어 출시됐어요. 그래서 규격을 넓혀 **둘 다**
//   받게 하고, 정규화를 **한 곳에** 둬요. N 곳이 각자 해석하면 서로 다른 목록을 갖게 되고, 그 증상은
//   «어떤 표면에서는 되돌리기 문구가 안 먹힘» 이라 조용해요 (§13.13.3(h) 와 같은 부류).
//
// 받아들이는 형태와 규칙:
//   · string[]  → 그대로 (공백 제거 · 빈 항목 제거)
//   · string    → 마크다운 목록 항목(`- x` / `* x` / `1. x`)이 하나라도 있으면 **그 항목만** 취해요.
//                 없으면 줄 단위로 나눠요. 어느 쪽이든 trim + 빈 줄 제거.
//   · 그 밖 / 부재 → `[]`. **문자열이 아닌 원소는 조용히 문자열로 만들지 않고 버려요** — 숫자를 문구로
//                 바꾸면 «절대 매칭되지 않는 문구» 가 목록에 앉아서, 있는데 없는 것과 같아져요.
// 빈 결과는 «문구 없음» 이고 «기본 목록» 이 아니에요. 기본값은 규격이 선언해요 — 여기서 기본 목록을
//   복제하면 그게 N+1 번째 사본이 되고, 이 파일이 막으려는 드리프트가 됩니다.
function normalizeTriggerPhrases(value) {
  if (Array.isArray(value)) {
    return value.filter((x) => typeof x === 'string').map((x) => x.trim()).filter(Boolean);
  }
  if (typeof value !== 'string') return [];
  const items = [...value.matchAll(/^[ \t]*(?:[-*+]|\d+[.)])[ \t]+(.+)$/gm)].map((m) => m[1].trim()).filter(Boolean);
  if (items.length) return items;
  return value.split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
}

module.exports = {
  renderMd,
  renderHtml,
  canonicalIrHash,
  DEFAULT_PROFILE,
  estimateSurfaceProfile,   // v0.7.0 — post-response tone-estimate hook 재사용 (additive export)
  normalizeTriggerPhrases,  // v0.7.7 — §5.6.7 `_md` 칸의 두 형태를 한 곳에서 해석 (additive export)
  expandBlockTemplate,      // the Markdown block-template engine, exposed so its rules can be tested directly (additive export)
};

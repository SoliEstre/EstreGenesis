// Compendium MCP server — the v0.2 runtime for the §10 tool surface (Compendium.md §10).
// Exposes 8 tools over line-delimited JSON-RPC stdio (mirrors plugins/hyperbrief/mcp/server.cjs framing):
//   wiki_read · wiki_search · wiki_upsert · term_define · term_frequency_scan · term_promote · compendium_backlinks · compendium_lint
// 0 npm deps. Operates on the inner compendium/ content store; reuses plugins/compendium/lint.cjs for parsing + lints + pointer-resolution.
"use strict";

const fs = require("fs");
const path = require("path");
const L = require("../lint.cjs"); // { runLint, ghSlug, headingSlugs, loadEntries, frontmatter, field, listField, defText, STORE, INNER, SUBDIRS }

const PROMOTE_N = 10;   // §7.1 default occurrence threshold
const PROMOTE_S = 3;    // §7.1 default distinct_sources threshold
const INTERNAL_DEF_CAP = 300; // §9.2(3) no-competing-full-def

// ---- richer entry parsing (frontmatter + glosses[] + terms[] + body) ----
function blockOf(fm, key) {
  // lines from `^key:` until the next top-level (col-0, non-list) key
  const lines = fm.split("\n");
  let i = lines.findIndex((l) => new RegExp("^" + key + ":\\s*$").test(l));
  if (i < 0) return "";
  const out = [];
  for (let j = i + 1; j < lines.length; j++) {
    if (/^[A-Za-z_][\w-]*:/.test(lines[j])) break; // next top-level key
    out.push(lines[j]);
  }
  return out.join("\n");
}
function parseGlosses(fm) {
  const blk = blockOf(fm, "glosses");
  const out = [];
  for (const chunk of blk.split(/-\s*\{/).slice(1)) {
    const reg = (chunk.match(/register:\s*(\w+)/) || [])[1] || null;
    const txt = (chunk.match(/text:\s*"?([^"}]+?)"?\s*\}/) || chunk.match(/text:\s*"([^"]*)"/) || [])[1] || "";
    out.push({ register: reg, text: txt.trim() });
  }
  return out;
}
function parseTerms(fm) {
  const blk = blockOf(fm, "terms");
  const out = [];
  for (const chunk of blk.split(/-\s*\{/).slice(1)) {
    out.push({
      text: ((chunk.match(/text:\s*([^,}\n]+)/) || [])[1] || "").trim(),
      register: (chunk.match(/register:\s*(\w+)/) || [])[1] || null,
      role: (chunk.match(/role:\s*(\w+)/) || [])[1] || null,
      source: (chunk.match(/source:\s*(\w+)/) || [])[1] || null,
      occurrence_count: Number((chunk.match(/occurrence_count:\s*(\d+)/) || [])[1] || 0),
      distinct_sources: Number((chunk.match(/distinct_sources:\s*(\d+)/) || [])[1] || 0),
    });
  }
  return out;
}
function parseEntryFull(abs) {
  const src = fs.readFileSync(abs, "utf8");
  const fm = L.frontmatter(src);
  const body = src.replace(/^---\n[\s\S]*?\n---\n?/, "").trim();
  return {
    file: path.relative(L.INNER, abs).replace(/\\/g, "/"),
    id: L.field(fm, "id"),
    title: L.field(fm, "title"),
    type: L.field(fm, "type"),
    register_class: L.field(fm, "register_class"),
    owner_spec: L.field(fm, "owner_spec"),
    status: L.field(fm, "status"),
    superseded_by: L.field(fm, "superseded_by"),
    aliases: L.listField(fm, "aliases"),
    links: L.listField(fm, "links"),
    defText: L.defText(fm),
    redactionPass: L.field(fm, "redaction_pass"),
    glosses: parseGlosses(fm),
    terms: parseTerms(fm),
    body,
  };
}
function allEntries() {
  const out = [];
  for (const sub of L.SUBDIRS) {
    const dir = path.join(L.STORE, sub);
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".md"))) out.push(parseEntryFull(path.join(dir, f)));
  }
  return out;
}
function byId(id) { return allEntries().find((e) => e.id === id) || null; }

// ---- tool handlers ----
async function wiki_read({ slug } = {}) {
  if (!slug) throw new Error("slug is required");
  const e = byId(slug);
  if (!e) return { found: false, slug };
  return { found: true, entry: e };
}

async function wiki_search({ query, limit = 20 } = {}) {
  if (!query) throw new Error("query is required");
  const q = String(query).toLowerCase();
  const hits = [];
  for (const e of allEntries()) {
    const hay = [e.id, e.title, e.defText, ...(e.aliases || []), ...e.glosses.map((g) => g.text), ...e.terms.map((t) => t.text)]
      // NUL 은 «내용에 절대 안 나오는 구분자» 로 의도된 것이지만, 소스에 **리터럴로** 박혀 있어서 git 이 이
      //   파일 전체를 binary 로 취급했어요 — 생성 컷(v2.5.114) 이래 모든 변경이 numstat 에서 `-	-` 로
      //   나오고 줄 단위 diff 가 한 번도 보이지 않았어요(리뷰 불가). 이스케이프로 바꾸면 거동은 동일하고
      //   파일이 다시 텍스트가 돼요. 도구가 «없다» 고 말하는 게 아니라 «침묵» 하는 부류.
      .filter(Boolean).join(" \u0000 ").toLowerCase();
    if (hay.includes(q)) {
      // hidden_search_only terms match without being surfaced as the preferred label
      const matchedHidden = e.terms.some((t) => t.role === "hidden_search_only" && t.text.toLowerCase().includes(q));
      hits.push({ id: e.id, title: e.title, register_class: e.register_class, status: e.status,
        owner_spec: e.owner_spec, snippet: e.defText.slice(0, 160), via_hidden_label: matchedHidden });
    }
  }
  return { query, count: hits.length, results: hits.slice(0, limit) };
}

async function term_define({ term, register } = {}) {
  if (!term) throw new Error("term is required");
  const q = String(term).toLowerCase();
  for (const e of allEntries()) {
    const surfaces = [e.id, e.title, ...(e.aliases || []), ...e.terms.map((t) => t.text)].filter(Boolean).map((s) => s.toLowerCase());
    if (surfaces.includes(q)) {
      let gloss = null;
      if (register) gloss = (e.glosses.find((g) => g.register === register) || {}).text || null;
      // neutral-definition fallback when the requested register has no gloss
      return {
        found: true, id: e.id, title: e.title, register_class: e.register_class,
        definition: e.defText, gloss: gloss, gloss_register: gloss ? register : null,
        glosses: e.glosses, owner_spec: e.owner_spec,
        note: e.register_class === "internal" ? "internal-register: definition.text is an orientation gloss; the full definition lives in owner_spec." : null,
      };
    }
  }
  return { found: false, term };
}

function scanFiles(fileAbsList, term) {
  const q = String(term).toLowerCase();
  let occ = 0; const sources = [];
  for (const f of fileAbsList) {
    let t; try { t = fs.readFileSync(f, "utf8").toLowerCase(); } catch { continue; }
    let n = 0, i = 0;
    while ((i = t.indexOf(q, i)) !== -1) { n++; i += q.length; }
    if (n > 0) { occ += n; sources.push(path.relative(L.INNER, f).replace(/\\/g, "/")); }
  }
  return { occurrence_count: occ, distinct_sources: sources.length, sources };
}

async function term_frequency_scan({ term, scope = "store", text } = {}) {
  if (!term) throw new Error("term is required");
  if (scope === "conversation") {
    // §10: conversation scope is READ-only — entry authoring follows passage of the §2.2 redaction gate.
    if (typeof text !== "string") return { scope, read_only: true, wired: false, note: "conversation scope is READ-only; supply `text` to count occurrences in caller-provided conversation content (no store write)." };
    const t = text.toLowerCase(); const q = String(term).toLowerCase(); let n = 0, i = 0;
    while ((i = t.indexOf(q, i)) !== -1) { n++; i += q.length; }
    return { scope, read_only: true, term, occurrence_count: n, distinct_sources: n > 0 ? 1 : 0, note: "single caller-supplied source; redaction gate (§2.2) applies before any upsert." };
  }
  if (scope === "store") {
    const files = [];
    for (const sub of L.SUBDIRS) { const d = path.join(L.STORE, sub); if (fs.existsSync(d)) for (const f of fs.readdirSync(d)) if (f.endsWith(".md")) files.push(path.join(d, f)); }
    return { scope, term, ...scanFiles(files, term) };
  }
  if (scope === "docs") {
    const files = [];
    const docs = path.join(L.INNER, "docs"); if (fs.existsSync(docs)) for (const f of fs.readdirSync(docs)) if (/\.(html|md)$/.test(f)) files.push(path.join(docs, f));
    for (const m of ["Constellation.md", "Superscalar.md", "Hyperbrief.md", "Greatpractice.md", "Ultrasafe.md", "Compendium.md", "README.md"]) { const p = path.join(L.INNER, m); if (fs.existsSync(p)) files.push(p); }
    return { scope, term, ...scanFiles(files, term) };
  }
  return { scope, wired: false, note: `scope '${scope}' (board/review) needs the dashboard/A2A integration — deferred to v0.2-d. Use scope=store|docs|conversation.` };
}

async function term_promote({ term } = {}) {
  if (!term) throw new Error("term is required");
  const e = allEntries().find((x) => [x.id, x.title, ...(x.aliases || []), ...x.terms.map((t) => t.text)].filter(Boolean).map((s) => s.toLowerCase()).includes(String(term).toLowerCase()));
  if (!e) return { promotable: false, reason: `no entry surfaces the term '${term}'.` };
  // §7.3: internal-register is not a frequency-promotion target.
  if (e.register_class === "internal") return { promotable: false, id: e.id, reason: "internal-register is not a frequency-promotion target (§7.3) — the owning module spec authors it." };
  // §7.1: occurrence_count >= N AND distinct_sources >= S AND mono-sense.
  const t = e.terms.find((x) => x.role === "preferred") || e.terms[0] || {};
  const occ = t.occurrence_count || 0, ds = t.distinct_sources || 0;
  const convNeedsRedaction = e.terms.some((x) => x.source === "conversation") && !e.redactionPass;
  const pass = occ >= PROMOTE_N && ds >= PROMOTE_S && !convNeedsRedaction;
  if (!pass) {
    const why = [];
    if (occ < PROMOTE_N) why.push(`occurrence_count ${occ} < N=${PROMOTE_N}`);
    if (ds < PROMOTE_S) why.push(`distinct_sources ${ds} < S=${PROMOTE_S}`);
    if (convNeedsRedaction) why.push("conversation-sourced term lacks redaction_pass (§2.2)");
    return { promotable: false, id: e.id, occurrence_count: occ, distinct_sources: ds, reason: why.join("; ") + " — kept as candidate (at EG scale this gate almost never fires, §7.1)." };
  }
  // queue a Hyperbrief brief stub (board emission is the v0.2-d dashboard/A2A surface).
  return {
    promotable: true, id: e.id, occurrence_count: occ, distinct_sources: ds,
    hyperbrief_brief: {
      decision_id: `compendium-promote-${e.id}`,
      situation: `General-register term '${term}' crossed the §7.1 promotion gate (occ ${occ} >= ${PROMOTE_N}, sources ${ds} >= ${PROMOTE_S}, mono-sense).`,
      question: `Promote '${term}' from harvested candidate to a canonical Compendium entry?`,
      options: ["approve -> canonical upsert", "reject -> keep as candidate"],
      recommend: "human disposes (§7.1) — frequency proposes, you decide.",
    },
    note: "Brief is returned for the caller to emit to the Constellation decisions panel (board A2A emission is the deferred v0.2-d surface).",
  };
}

async function compendium_backlinks({ id } = {}) {
  if (!id) throw new Error("id is required");
  const inbound = allEntries().filter((e) => (e.links || []).includes(id)).map((e) => e.id);
  return { id, inbound, count: inbound.length };
}

async function compendium_lint({ reindex = false } = {}) {
  const r = L.runLint({ reindex });
  return { entries: r.entries.length, hard: r.hard, warn: r.warn, ok: r.hard.length === 0 };
}

// v0.2.8 (Ultrasafe it-1 web-02, high) — 호출자가 준 문자열로 경로를 만들 때는 경계를 확인해요.
//   `wiki_upsert` 는 slug 를 그대로 path.join 에 넣었고 검사는 «비었나 · frontmatter.id 와 같나» 뿐이었어요
//   (둘 다 호출자 값). 검증된 재현: slug 에 상위 이동을 넣으면 저장소 밖으로 임의 파일 쓰기가 됐어요.
//   형제 플러그인(hyperbrief resolveLedgerPath)이 이미 올바른 방식을 쓰고 있어서, 그 방식을 옮겼어요 —
//   ① 문자 집합을 좁히고 ② 해소한 절대경로가 기준 밖이면 거부. 둘 다 두는 건 우회 경로가 다르기 때문이에요
//   (패턴은 형태를, 경계 검사는 결과를 봐요).
const SAFE_SLUG = /^[a-z0-9][a-z0-9-]{0,63}$/;
function assertInside(base, candidate, what) {
  const abs = path.resolve(base, candidate);
  const rel = path.relative(base, abs);
  if (rel === "" || rel.startsWith("..") || path.isAbsolute(rel)) {
    throw new Error(`${what} must resolve inside ${base} (no traversal/absolute): ${candidate}`);
  }
  return abs;
}

async function wiki_upsert({ slug, body = "", frontmatter } = {}) {
  if (!slug) throw new Error("slug is required");
  if (!SAFE_SLUG.test(String(slug))) throw new Error(`slug '${slug}' must match ${SAFE_SLUG} — it becomes a filename`);
  if (typeof frontmatter !== "string") throw new Error("frontmatter is required (a YAML string for the entry's --- block per Compendium.md §4.1)");
  const fm = frontmatter;
  const required = ["id", "title", "type", "register_class", "status"];
  for (const k of required) if (!L.field(fm, k)) throw new Error(`frontmatter.${k} is required (§4.1)`);
  const id = L.field(fm, "id"), type = L.field(fm, "type"), reg = L.field(fm, "register_class");
  if (id !== slug) throw new Error(`slug '${slug}' must equal frontmatter.id '${id}' (immutable anchor)`);
  if (!["concept", "glossary", "index", "runbook"].includes(type)) throw new Error(`type '${type}' invalid (§4.1)`);
  if (!["internal", "general"].includes(reg)) throw new Error(`register_class '${reg}' invalid`);
  const owner = L.field(fm, "owner_spec"), dtext = L.defText(fm);
  // §9.2(3) no-competing-full-def (internal) + §5.1 internal needs owner_spec
  if (reg === "internal") {
    if (!owner || owner === "null") throw new Error("internal-register entry requires owner_spec (§5.1)");
    if (dtext && dtext.length > INTERNAL_DEF_CAP) throw new Error(`internal definition.text ${dtext.length} > cap ${INTERNAL_DEF_CAP} — must be a one-line gloss + pointer (§9.2)`);
  } else {
    if (owner && owner !== "null") throw new Error("general-register entry must have owner_spec: null (§5.1)");
    if (!dtext) throw new Error("general-register entry requires a full definition.text (§5.1 / §6)");
  }
  // §9.2(1)(2) pointer-resolution
  if (owner && owner !== "null") {
    const h = owner.indexOf("#"); if (h < 0) throw new Error(`owner_spec must be <file>#<slug>`);
    const file = owner.slice(0, h), s = owner.slice(h + 1);
    const slugs = L.headingSlugs(assertInside(L.INNER, file, "owner_spec target file"));   // v0.2.8 web-02 동종 — owner_spec 의 <file> 도 호출자 값 (읽기 측 탈출)
    if (!slugs) throw new Error(`owner_spec target file missing: ${file}`);
    if (!slugs.has(s)) throw new Error(`owner_spec slug '#${s}' is not a heading in ${file} (§9.2)`);
  }
  // §2.2 redaction gate
  if (/source:\s*conversation/.test(fm) && !L.field(fm, "redaction_pass")) {
    throw new Error("entry has a conversation-sourced term but no redaction_pass marker — §2.2 redaction gate blocks the upsert");
  }
  const subdir = type === "concept" ? "concept" : type === "runbook" ? "runbook" : "glossary";
  const dir = path.join(L.STORE, subdir);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const abs = assertInside(dir, `${slug}.md`, "entry file");
  const existed = fs.existsSync(abs);
  fs.writeFileSync(abs, `---\n${fm.replace(/^\n+|\n+$/g, "")}\n---\n\n${body.trim()}\n`);
  const after = L.runLint({ reindex: true });
  return { ok: after.hard.length === 0, action: existed ? "updated" : "created", file: path.relative(L.INNER, abs).replace(/\\/g, "/"), lint_hard: after.hard, lint_warn: after.warn.length };
}

// ---- tool registry ----
const TOOLS = [
  { name: "wiki_read", description: "Fetch a Compendium wiki page / glossary entry by id (slug) — returns parsed frontmatter + body.", inputSchema: { type: "object", required: ["slug"], properties: { slug: { type: "string", description: "the entry id (immutable slug)" } } } },
  { name: "wiki_search", description: "Search entries by id/title/alias/gloss/term text (matches hidden_search_only labels for messy-input recall). Returns id+title+register+snippet.", inputSchema: { type: "object", required: ["query"], properties: { query: { type: "string" }, limit: { type: "integer", default: 20 } } } },
  { name: "wiki_upsert", description: "Author/update an entry. Validates §4.1 frontmatter + §9.2 pointer-resolution + §9.2 no-competing-full-def + §2.2 redaction gate, then writes the file and re-lints. frontmatter is the YAML string for the entry's --- block.", inputSchema: { type: "object", required: ["slug", "frontmatter"], properties: { slug: { type: "string" }, body: { type: "string" }, frontmatter: { type: "string", description: "YAML for the entry --- block per §4.1 (id must equal slug)" } } } },
  { name: "term_define", description: "term -> concept definition + register-targeted gloss (click-to-define backend; register=expert|plain, neutral-definition fallback). Matches preferred/admitted/hidden term surfaces + aliases.", inputSchema: { type: "object", required: ["term"], properties: { term: { type: "string" }, register: { type: "string", enum: ["expert", "plain"] } } } },
  { name: "term_frequency_scan", description: "General-register frequency + distinct_sources count (promotion signal). scope=store|docs scans real files; conversation is READ-only (supply `text`); board/review deferred to v0.2-d.", inputSchema: { type: "object", required: ["term"], properties: { term: { type: "string" }, scope: { type: "string", enum: ["store", "docs", "conversation", "board", "review"], default: "store" }, text: { type: "string", description: "(conversation scope) caller-supplied content to count in" } } } },
  { name: "term_promote", description: "Run the §7.1 count->queue gate (occurrence_count >= 10 AND distinct_sources >= 3 AND mono-sense, conversation passes §2.2). Returns a Hyperbrief brief stub to queue to the decisions panel, or why it stays a candidate. Internal-register is rejected (§7.3).", inputSchema: { type: "object", required: ["term"], properties: { term: { type: "string" } } } },
  { name: "compendium_backlinks", description: "Compute inbound references to an entry id (derived from other entries' links[], never stored).", inputSchema: { type: "object", required: ["id"], properties: { id: { type: "string" } } } },
  { name: "compendium_lint", description: "Run the §9.1 four gardening lints + the §9.2 pointer-resolution check over the store. reindex=true regenerates INDEX.md. Returns hard failures + soft warnings.", inputSchema: { type: "object", properties: { reindex: { type: "boolean", default: false } } } },
];

// ----- MCP 응답 봉투 (프로토콜 규격) -----
// `tools/call` 의 result 는 `{content:[{type:'text',…}]}` 여야 해요. 결과 객체를 그대로 반환하면
// 프로토콜 «오류» 가 아니라 **렌더할 내용이 없는 성공**이 되어 호출자에게 «출력 없음» 으로 보여요 —
// 오류보다 나쁜 조용한 실패예요 (v0.2.10: 서버 3종이 이 상태로 출시돼 있었고, 무응답을 도구 부재로
// 오진하게 만들었어요). 봉투는 **디스패치 한 자리**에서만 씌워요 — 도구별로 씌우면 새 도구가 잊는
// 순간 그 도구만 조용해지고, 그건 정확히 이 결함이 퍼진 방식이에요.
function toolEnvelope(v) {
  if (v && Array.isArray(v.content)) return v;   // 이미 규격이면 통과 — 멱등
  const text = typeof v === 'string' ? v : v === undefined ? '' : JSON.stringify(v, null, 2);
  return { content: [{ type: 'text', text }] };
}

const handlers = {
  initialize: async () => ({ protocolVersion: "2024-11-05", serverInfo: { name: "compendium-mcp", version: require("./package.json").version }, capabilities: { tools: {} } }),
  "tools/list": async () => ({ tools: TOOLS }),
  "tools/call": async (params) => toolEnvelope(await callTool(params.name, params.arguments || {})),
};

// 도구 분기는 **날 결과**를 돌려줘요 — 봉투는 위 한 자리에서만 씌워요.
async function callTool(name, args) {
  L.assertStore();   // v0.2.9 — 저장소 미해소면 여기서 오류로 끊어요. 도구별로 넣으면 새 도구에서 «조용한 0건» 이 되살아나요.
  switch (name) {
    case "wiki_read": return wiki_read(args);
    case "wiki_search": return wiki_search(args);
    case "wiki_upsert": return wiki_upsert(args);
    case "term_define": return term_define(args);
    case "term_frequency_scan": return term_frequency_scan(args);
    case "term_promote": return term_promote(args);
    case "compendium_backlinks": return compendium_backlinks(args);
    case "compendium_lint": return compendium_lint(args);
    default: throw new Error("Unknown tool: " + name);
  }
}

// v0.2.8 — stdio 루프는 **엔트리포인트일 때만** 돌아요. 종전엔 require 하는 순간 stdin 리스너가 붙어서
//   이 파일의 도구 함수를 밖에서 호출할 방법이 없었어요(검사 스크립트가 «미실행» 으로 끝남). MCP 호스트가
//   직접 실행할 때의 거동은 그대로예요. 아래 export 는 그 검사 표면이고 프로토콜 표면이 아니에요.
module.exports = {
  wiki_read, wiki_search, wiki_upsert, term_define, term_frequency_scan, term_promote,
  compendium_backlinks, compendium_lint, TOOLS, handlers, SAFE_SLUG, assertInside,
  toolEnvelope, callTool,
};

if (require.main !== module) { /* 검사/도구 적재 — stdio 루프 미기동 */ } else {

let buffer = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", async (chunk) => {
  buffer += chunk;
  let idx;
  while ((idx = buffer.indexOf("\n")) !== -1) {
    const line = buffer.slice(0, idx).trim();
    buffer = buffer.slice(idx + 1);
    if (!line) continue;
    try {
      const req = JSON.parse(line);
      const handler = handlers[req.method];
      if (!handler) { process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id: req.id, error: { code: -32601, message: "Method not found: " + req.method } }) + "\n"); continue; }
      try { const result = await handler(req.params || {}); process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id: req.id, result }) + "\n"); }
      catch (e) { process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id: req.id, error: { code: -32603, message: e.message } }) + "\n"); }
    } catch (_) { /* bad JSON */ }
  }
});
process.stdin.on("end", () => process.exit(0)); // clean shutdown when the host disconnects

}

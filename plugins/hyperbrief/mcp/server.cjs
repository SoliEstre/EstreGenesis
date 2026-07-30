// Hyperbrief MCP server — v0.4.2 (Phase 2 MCP exposure).
// Exposes 4 tools over stdio JSON-RPC:
//   hyperbrief_render          — IR → MD/HTML via renderers/mini-engine.cjs
//   hyperbrief_validate        — IR → ajv schema validation
//   decision_ledger_append     — append a row to .agent/_decisions/<module>-ledger.jsonl
//   decision_ledger_query      — read rows from the ledger (with optional filter)
//
// Per Hyperbrief.md §11.1 v0.4.2 adoption-path item.
// Per Constellation MCP-server convention (mirrors plugins/constellation/mcp/server.cjs JSON-RPC framing).

"use strict";

const fs = require("fs");
const path = require("path");
const {
  PROTOCOL_VERSIONS,
  LATEST,
  LEGACY,
  requestedVersion,
  versionError,
  discoverResult,
  complete,
  cacheable,
} = require("../../_shared/mcp-protocol.cjs");

const { renderMd, renderHtml, canonicalIrHash, DEFAULT_PROFILE } = require("../renderers/mini-engine.cjs");

const SCHEMA_PATH = path.resolve(__dirname, "..", "schema", "hyperbrief.schema.json");
const SERVER_INFO = { name: "hyperbrief-mcp", version: require("./package.json").version };
const CAPABILITIES = { tools: {} };

// Lazy ajv validator (graceful fallback when ajv not installed).
let _validator = null;
let _validatorErr = null;
function getValidator() {
  if (_validator || _validatorErr) return _validator;
  try {
    // ajv default export is draft-07; our schema is draft 2020-12 → use the 2020-12 dialect entrypoint.
    const Ajv = require("ajv/dist/2020");
    const ajv = new (Ajv.default || Ajv)({ strict: false, allErrors: true });
    const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, "utf8"));
    _validator = ajv.compile(schema);
  } catch (e) {
    _validatorErr = e;
  }
  return _validator;
}

function resolveLedgerPath(ledger_path) {
  // Caller-supplied ledger_path is confined to the project root (cwd): resolve,
  // then reject traversal / absolute paths that escape it. A poisoned IR or call
  // arg must not be able to write/read outside the repo. The operator-set env var
  // and the default are trusted (set in the shell, not from tool input).
  if (ledger_path && typeof ledger_path === "string") {
    const base = process.cwd();
    const candidate = path.resolve(base, ledger_path);
    const rel = path.relative(base, candidate);
    if (rel === "" || rel.startsWith("..") || path.isAbsolute(rel)) {
      throw new Error(
        `ledger_path must resolve inside the project root (no traversal/absolute): ${ledger_path}`
      );
    }
    return candidate;
  }
  const env = process.env.HYPERBRIEF_LEDGER_PATH;
  if (env) return env;
  return path.resolve(process.cwd(), ".agent", "_decisions", "hyperbrief-ledger.jsonl");
}

function ensureDir(p) {
  const d = path.dirname(p);
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}

// ----- Tool handlers -----

async function handleHyperbriefRender({ ir, format = "md", audience_profile_override, self_contained_assets, skip_validate } = {}) {
  if (!ir || typeof ir !== "object") throw new Error("ir is required (object)");
  if (format !== "md" && format !== "html") throw new Error("format must be 'md' or 'html'");
  const fn = format === "html" ? renderHtml : renderMd;
  const result = fn(ir, { audience_profile_override, self_contained_assets, skip_validate });
  return {
    output: result.output,
    output_hash: result.output_hash,
    ir_hash: result.ir_hash,
    audience_profile_applied: result.audience_profile_applied,
    warnings: result.warnings,
  };
}

async function handleHyperbriefValidate({ ir } = {}) {
  if (!ir || typeof ir !== "object") throw new Error("ir is required (object)");
  const v = getValidator();
  if (!v) {
    // v0.7.4 — 여기는 `ok: true` 를 돌려주던 자리예요. `skipped`/`reason` 을 함께 실었지만 호출자가
    //   실제로 게이트하는 필드는 `ok` 라서, **검사한 적 없는 IR 이 «유효함» 으로 읽혔어요.** 부품이
    //   없으면 이 도구는 계산하지 않은 판정을 내놓지 않아요 — 관측 불가는 통과가 아니라 거부예요.
    //   같은 저장소의 보드 도구가 `ws` 부재에서 이미 이렇게 해요(부재를 이름으로 말하며 거부). 기능을
    //   못 하는 것보다 «못 한다고 말하지 않는 것» 이 나쁘고, 조용한 초록이 정확히 그 경우예요.
    throw new Error(
      "ajv npm package not installed — run `npm install ajv` in the plugin dir " +
      "(plugins/hyperbrief/mcp). Schema validation cannot run, and this tool does not report a " +
      "verdict it did not compute" +
      (_validatorErr ? ` (${String(_validatorErr.message).split("\n")[0]})` : "") + "."
    );
  }
  const ok = v(ir);
  return {
    ok,
    skipped: false,
    ir_hash: canonicalIrHash(ir),
    errors: ok
      ? []
      : (v.errors || []).map((e) => ({
          path: e.instancePath || "(root)",
          message: e.message,
          keyword: e.keyword,
          params: e.params,
        })),
  };
}

async function handleDecisionLedgerAppend({ row, ledger_path } = {}) {
  if (!row || typeof row !== "object") throw new Error("row is required (object)");
  const required = ["decision_id"];
  for (const k of required) if (!row[k]) throw new Error(`row.${k} is required`);
  const p = resolveLedgerPath(ledger_path);
  ensureDir(p);
  const line = JSON.stringify(row);
  if (line.indexOf("\n") !== -1) throw new Error("row JSON must not contain newlines (jsonl invariant)");
  fs.appendFileSync(p, line + "\n", "utf8");
  return { ok: true, appended_to: p, decision_id: row.decision_id, byte_offset: fs.statSync(p).size };
}

async function handleDecisionLedgerQuery({ ledger_path, filter, limit = 100, offset = 0 } = {}) {
  const p = resolveLedgerPath(ledger_path);
  if (!fs.existsSync(p)) return { rows: [], total: 0, ledger_path: p, exists: false };
  const raw = fs.readFileSync(p, "utf8").split("\n").filter(Boolean);
  const rows = [];
  for (const line of raw) {
    try {
      const obj = JSON.parse(line);
      let match = true;
      if (filter && typeof filter === "object") {
        for (const [k, v] of Object.entries(filter)) {
          if (obj[k] !== v) { match = false; break; }
        }
      }
      if (match) rows.push(obj);
    } catch (_) { /* skip malformed */ }
  }
  return {
    rows: rows.slice(offset, offset + limit),
    total: rows.length,
    ledger_path: p,
    exists: true,
  };
}

// ----- Tools -----

const TOOLS = [
  {
    name: "hyperbrief_render",
    description: "Render a HyperbriefIR to MD or HTML via the deterministic mini-engine. Same IR + same options → byte-identical output (Hyperbrief.md §7 invariant).",
    inputSchema: {
      type: "object",
      required: ["ir"],
      properties: {
        ir: { type: "object", description: "HyperbriefIR object — validated against hyperbrief.schema.json unless skip_validate is true." },
        format: { type: "string", enum: ["md", "html"], default: "md" },
        audience_profile_override: {
          type: "object",
          description: "Override the IR's §0 audience_profile (§5.6). Each axis 1-5.",
          properties: {
            audience: { type: "integer", minimum: 1, maximum: 5 },
            abbreviation: { type: "integer", minimum: 1, maximum: 5 },
            jargon: { type: "integer", minimum: 1, maximum: 5 },
          },
        },
        self_contained_assets: { type: "boolean", description: "(html only) Inline chart.js + mermaid for offline / stealth adapters. Deferred to v0.4.3 (currently a warning)." },
        skip_validate: { type: "boolean", description: "Skip ajv schema validation (caller validated already)." },
      },
    },
  },
  {
    name: "hyperbrief_validate",
    description: "Validate a HyperbriefIR against hyperbrief.schema.json (ajv). Returns ok=true if valid; otherwise returns the error list. ir_hash is the canonical sha256 of the IR.",
    inputSchema: {
      type: "object",
      required: ["ir"],
      properties: {
        ir: { type: "object" },
      },
    },
  },
  {
    name: "decision_ledger_append",
    description: "Append a single row to a Hyperbrief decision ledger (jsonl). Per Hyperbrief.md §11.2 + §10.2 SHOULD-8 — operational telemetry layer. Default path: .agent/_decisions/hyperbrief-ledger.jsonl (override via HYPERBRIEF_LEDGER_PATH env or ledger_path arg).",
    inputSchema: {
      type: "object",
      required: ["row"],
      properties: {
        row: {
          type: "object",
          required: ["decision_id"],
          description: "Ledger row — must include decision_id. Recommended: date, reversibility, outcome, archive pointer.",
        },
        ledger_path: { type: "string", description: "Override ledger file path (default: HYPERBRIEF_LEDGER_PATH env or .agent/_decisions/hyperbrief-ledger.jsonl)" },
      },
    },
  },
  {
    name: "decision_ledger_query",
    description: "Read rows from a Hyperbrief decision ledger (jsonl) with optional filter. Returns rows + total count + ledger_path + exists.",
    inputSchema: {
      type: "object",
      properties: {
        ledger_path: { type: "string" },
        filter: { type: "object", description: "Match rows whose top-level fields equal the given values (shallow strict equality)." },
        limit: { type: "integer", default: 100, minimum: 1 },
        offset: { type: "integer", default: 0, minimum: 0 },
      },
    },
  },
];

// ----- MCP stdio protocol -----

// ----- MCP 응답 봉투 (프로토콜 규격) -----
// `tools/call` 의 result 는 `{content:[{type:'text',…}]}` 여야 해요. 결과 객체를 그대로 반환하면
// 프로토콜 «오류» 가 아니라 **렌더할 내용이 없는 성공**이 되어 호출자에게 «출력 없음» 으로 보여요 —
// 오류보다 나쁜 조용한 실패예요 (v0.7.3: 서버 3종이 이 상태로 출시돼 있었고, 무응답을 도구 부재로
// 오진하게 만들었어요). 봉투는 **디스패치 한 자리**에서만 씌워요 — 도구별로 씌우면 새 도구가 잊는
// 순간 그 도구만 조용해지고, 그건 정확히 이 결함이 퍼진 방식이에요.
function toolEnvelope(v) {
  if (v && Array.isArray(v.content)) return v;   // 이미 규격이면 통과 — 멱등
  const text = typeof v === 'string' ? v : v === undefined ? '' : JSON.stringify(v, null, 2);
  return { content: [{ type: 'text', text }] };
}

const handlers = {
  "server/discover": async () => discoverResult(SERVER_INFO, CAPABILITIES),
  initialize: async () => ({
    protocolVersion: LEGACY,
    serverInfo: { name: "hyperbrief-mcp", version: require("./package.json").version },
    capabilities: CAPABILITIES,
  }),
  "tools/list": async () => complete(cacheable({ tools: TOOLS }), SERVER_INFO),
  "tools/call": async (params) => complete(toolEnvelope(await callTool(params.name, params.arguments || {})), SERVER_INFO),
};

// 도구 분기는 **날 결과**를 돌려줘요 — 봉투는 위 한 자리에서만 씌워요.
async function callTool(name, args) {
  switch (name) {
    case "hyperbrief_render": return handleHyperbriefRender(args);
    case "hyperbrief_validate": return handleHyperbriefValidate(args);
    case "decision_ledger_append": return handleDecisionLedgerAppend(args);
    case "decision_ledger_query": return handleDecisionLedgerQuery(args);
    default: throw new Error("Unknown tool: " + name);
  }
}

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
      const requested = requestedVersion(req.params || {});
      if (requested !== null && !PROTOCOL_VERSIONS.includes(requested)) {
        process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id: req.id, error: versionError(requested) }) + "\n");
        continue;
      }
      const handler = handlers[req.method];
      if (!handler) {
        process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id: req.id, error: { code: -32601, message: "Method not found: " + req.method } }) + "\n");
        continue;
      }
      try {
        const result = await handler(req.params || {});
        process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id: req.id, result }) + "\n");
      } catch (e) {
        process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id: req.id, error: { code: -32603, message: e.message } }) + "\n");
      }
    } catch (_) { /* bad JSON */ }
  }
});

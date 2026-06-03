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

const { renderMd, renderHtml, canonicalIrHash, DEFAULT_PROFILE } = require("../renderers/mini-engine.cjs");

const SCHEMA_PATH = path.resolve(__dirname, "..", "schema", "hyperbrief.schema.json");

// Lazy ajv validator (graceful fallback when ajv not installed).
let _validator = null;
let _validatorErr = null;
function getValidator() {
  if (_validator || _validatorErr) return _validator;
  try {
    const Ajv = require("ajv");
    const ajv = new (Ajv.default || Ajv)({ strict: false, allErrors: true });
    const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, "utf8"));
    _validator = ajv.compile(schema);
  } catch (e) {
    _validatorErr = e;
  }
  return _validator;
}

function resolveLedgerPath(ledger_path) {
  if (ledger_path && typeof ledger_path === "string") return ledger_path;
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
    return {
      ok: true,
      skipped: true,
      reason: `ajv not installed (${_validatorErr ? _validatorErr.message : "unknown"}); schema validation skipped — install ajv ^8.17.0 to enable.`,
      ir_hash: canonicalIrHash(ir),
      errors: [],
    };
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

const handlers = {
  initialize: async () => ({
    protocolVersion: "2024-11-05",
    serverInfo: { name: "hyperbrief-mcp", version: "0.4.2" },
    capabilities: { tools: {} },
  }),
  "tools/list": async () => ({ tools: TOOLS }),
  "tools/call": async (params) => {
    const { name, arguments: args } = params;
    switch (name) {
      case "hyperbrief_render": return handleHyperbriefRender(args || {});
      case "hyperbrief_validate": return handleHyperbriefValidate(args || {});
      case "decision_ledger_append": return handleDecisionLedgerAppend(args || {});
      case "decision_ledger_query": return handleDecisionLedgerQuery(args || {});
      default: throw new Error("Unknown tool: " + name);
    }
  },
};

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

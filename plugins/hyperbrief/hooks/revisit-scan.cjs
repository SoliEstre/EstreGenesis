#!/usr/bin/env node
// hyperbrief Stop hook — v0.5.3 (bundle 008/dogfood Entry 03).
//
// Fires at turn-end. Scans the decision ledger for revisit_date arrivals and any
// pending-reviews still queued. Emits a single advisory stderr message (or stays
// silent if nothing to surface). NEVER blocks.

"use strict";

const fs = require("fs");
const path = require("path");

function findRepoRoot(startDir) {
  let dir = startDir;
  for (let i = 0; i < 16; i++) {
    if (fs.existsSync(path.join(dir, ".git")) || fs.existsSync(path.join(dir, ".hyperbrief"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return startDir;
}

const REPO_ROOT = findRepoRoot(process.cwd());

function resolveLedgerPath() {
  const env = process.env.HYPERBRIEF_LEDGER_PATH;
  if (env) return env;
  return path.join(REPO_ROOT, ".agent", "_decisions", "hyperbrief-ledger.jsonl");
}

function todayIsoDate() {
  const t = new Date();
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, "0")}-${String(t.getUTCDate()).padStart(2, "0")}`;
}

function scanLedger() {
  const ledgerPath = resolveLedgerPath();
  if (!fs.existsSync(ledgerPath)) return [];
  const today = todayIsoDate();
  const due = [];
  const lines = fs.readFileSync(ledgerPath, "utf8").split("\n");
  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const row = JSON.parse(line);
      const rd = row.revisit_date;
      if (typeof rd === "string" && rd.length >= 10 && rd.slice(0, 10) <= today) {
        // Skip already-resolved rows.
        if (row.outcome_actual) continue;
        due.push({ decision_id: row.decision_id, revisit_date: rd });
      }
    } catch (_) { /* skip malformed */ }
  }
  return due;
}

function scanPendingReviews() {
  const dir = path.join(REPO_ROOT, ".hyperbrief", "pending-reviews");
  if (!fs.existsSync(dir)) return [];
  try {
    return fs.readdirSync(dir).filter((f) => f.endsWith(".md") && !f.startsWith("_"));
  } catch { return []; }
}

function main() {
  const dueRevisits = scanLedger();
  const pending = scanPendingReviews();

  if (dueRevisits.length === 0 && pending.length === 0) {
    process.exit(0); // silent
  }

  const parts = [];
  if (dueRevisits.length > 0) {
    const sample = dueRevisits.slice(0, 3).map((r) => `${r.decision_id}(${r.revisit_date})`).join(", ");
    const more = dueRevisits.length > 3 ? ` 외 ${dueRevisits.length - 3}건` : "";
    parts.push(`재검토 도래 ${dueRevisits.length}건: ${sample}${more} — hyperbrief-revisit skill 호출 권장`);
  }
  if (pending.length > 0) {
    parts.push(`보류 중 검토 사안 ${pending.length}건 (.hyperbrief/pending-reviews/) — 검토 또는 archive 권장`);
  }

  process.stderr.write(`[hyperbrief] ${parts.join(" · ")}\n`);
  process.exit(0);
}

main();

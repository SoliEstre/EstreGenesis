#!/usr/bin/env node
// Hyperbrief renderer CLI — read IR from stdin or --ir <path>, write output to stdout.
// Usage:
//   hyperbrief-render --format md  --ir path/to/ir.json
//   hyperbrief-render --format html --ir path/to/ir.json --self-contained
//   cat ir.json | hyperbrief-render --format md
//
// Tone profile override:
//   --audience N --abbreviation N --jargon N    (each 1-5)
//
// Exit codes: 0 OK · 1 IR read failure · 2 schema validation failure · 3 unknown format.

"use strict";

const fs = require("fs");
const { renderMd, renderHtml } = require("../mini-engine.cjs");

function parseArgs(argv) {
  const out = {
    format: "md",
    irPath: null,
    audience: null,
    abbreviation: null,
    jargon: null,
    self_contained: false,
    skip_validate: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--format") out.format = argv[++i];
    else if (a === "--ir") out.irPath = argv[++i];
    else if (a === "--audience") out.audience = Number(argv[++i]);
    else if (a === "--abbreviation") out.abbreviation = Number(argv[++i]);
    else if (a === "--jargon") out.jargon = Number(argv[++i]);
    else if (a === "--self-contained") out.self_contained = true;
    else if (a === "--skip-validate") out.skip_validate = true;
    else if (a === "--help" || a === "-h") {
      process.stdout.write(
        "Usage: hyperbrief-render --format md|html [--ir <path>] [--audience 1-5] [--abbreviation 1-5] [--jargon 1-5] [--self-contained] [--skip-validate]\n"
      );
      process.exit(0);
    }
  }
  return out;
}

function readIr(irPath) {
  if (irPath) return fs.readFileSync(irPath, "utf8");
  return fs.readFileSync(0, "utf8");
}

function main() {
  const args = parseArgs(process.argv);
  let raw;
  try {
    raw = readIr(args.irPath);
  } catch (e) {
    process.stderr.write(`hyperbrief-render: failed to read IR: ${e.message}\n`);
    process.exit(1);
  }

  let ir;
  try {
    ir = JSON.parse(raw);
  } catch (e) {
    process.stderr.write(`hyperbrief-render: IR is not valid JSON: ${e.message}\n`);
    process.exit(1);
  }

  const profileOverride = (args.audience || args.abbreviation || args.jargon)
    ? {
        audience: args.audience || 2,
        abbreviation: args.abbreviation || 2,
        jargon: args.jargon || 2,
      }
    : undefined;

  const renderFn = args.format === "html" ? renderHtml : args.format === "md" ? renderMd : null;
  if (!renderFn) {
    process.stderr.write(`hyperbrief-render: unknown format '${args.format}' (expected md or html)\n`);
    process.exit(3);
  }

  let result;
  try {
    result = renderFn(ir, {
      audience_profile_override: profileOverride,
      self_contained_assets: args.self_contained,
      skip_validate: args.skip_validate,
    });
  } catch (e) {
    process.stderr.write(`hyperbrief-render: render failed:\n${e.message}\n`);
    process.exit(2);
  }

  process.stdout.write(result.output);
  for (const w of result.warnings) {
    process.stderr.write(`[warning] ${w}\n`);
  }
}

main();

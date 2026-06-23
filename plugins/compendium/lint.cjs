#!/usr/bin/env node
'use strict';
/*
 * plugins/compendium/lint.cjs — Compendium content-store gardening lints + pointer-resolution (Compendium.md §9).
 *   0 npm deps. The v0.2 runtime implementation of the §9.1 four lints + the §9.2 pointer-resolution check.
 *   Operates on the inner `compendium/` content store; resolves owner_spec pointers against the inner module specs.
 *
 * Usage:  node plugins/compendium/lint.cjs [--reindex] [--quiet]
 *   --reindex   (re)generate compendium/INDEX.md (computed MOC) from frontmatter
 *   exit 0 = no hard failures; exit 1 = >=1 hard failure (broken-link · unresolved-pointer · competing-full-def · redaction)
 *   soft warnings (orphan · stale · duplicate-concept) never fail the build — they are a gardening signal.
 *
 * Reused by scripts/verify-nway-version.cjs (outer) as the pointer-resolution axis (module.exports.runLint).
 */
const fs = require('fs');
const path = require('path');

const HERE = __dirname;                          // EstreGenesis/plugins/compendium
const INNER = path.resolve(HERE, '..', '..');    // EstreGenesis/
const STORE = path.join(INNER, 'compendium');
const SUBDIRS = ['glossary', 'concept', 'runbook'];
const INTERNAL_DEF_CAP = 300;                    // §9.2(3) no-competing-full-def: internal def.text is a one-line orientation gloss

// GitHub-compatible heading slug: lowercase → drop non [word/space/hyphen] → each whitespace run → that many hyphens.
function ghSlug(text) {
  return text.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, (m) => '-'.repeat(m.length));
}
function headingSlugs(fileAbs) {
  let t; try { t = fs.readFileSync(fileAbs, 'utf8'); } catch { return null; }
  const set = new Set();
  for (const line of t.split('\n')) {
    const m = line.match(/^#{1,6}\s+(.+?)\s*$/);
    if (m) set.add(ghSlug(m[1]));
  }
  return set;
}

function frontmatter(src) {
  const m = src.match(/^---\n([\s\S]*?)\n---/);
  return m ? m[1] : '';
}
function field(fm, key) {
  const m = fm.match(new RegExp('^' + key + ':\\s*(.+?)\\s*$', 'm'));
  return m ? m[1].trim() : null;
}
function listField(fm, key) {
  const m = fm.match(new RegExp('^' + key + ':\\s*\\[(.*)\\]\\s*$', 'm'));
  if (!m) return [];
  return m[1].split(',').map((s) => s.trim()).filter(Boolean);
}
function defText(fm) {
  // definition.text — the 2-space-indented `text:` directly under `definition:` (gloss/term text: are brace-inline)
  const m = fm.match(/^definition:\s*\n\s{2,}text:\s*"?(.*?)"?\s*$/m);
  return m ? m[1] : '';
}

function loadEntries() {
  const entries = [];
  for (const sub of SUBDIRS) {
    const dir = path.join(STORE, sub);
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.md'))) {
      const abs = path.join(dir, f);
      const src = fs.readFileSync(abs, 'utf8');
      const fm = frontmatter(src);
      entries.push({
        file: path.relative(INNER, abs).replace(/\\/g, '/'),
        id: field(fm, 'id'),
        type: field(fm, 'type'),
        register_class: field(fm, 'register_class'),
        owner_spec: field(fm, 'owner_spec'),
        status: field(fm, 'status'),
        superseded_by: field(fm, 'superseded_by'),
        title: field(fm, 'title'),
        links: listField(fm, 'links'),
        defText: defText(fm),
        hasConvTerm: /source:\s*conversation/.test(fm),
        redactionPass: field(fm, 'redaction_pass'),
        glosses: [...fm.matchAll(/\{\s*register:\s*(\w+),\s*text:\s*"([^"]*)"\s*\}/g)].map((m) => ({ register: m[1], text: m[2] })),
      });
    }
  }
  return entries;
}

function runLint(opts = {}) {
  const entries = loadEntries();
  const ids = new Set(entries.map((e) => e.id));
  const inbound = new Map();
  for (const e of entries) for (const l of e.links) inbound.set(l, (inbound.get(l) || 0) + 1);

  const hard = [];   // build-failing
  const warn = [];   // gardening signal

  for (const e of entries) {
    // broken-link (HARD)
    for (const l of e.links) if (!ids.has(l)) hard.push(`broken-link: ${e.id} -> [[${l}]] (no such entry)`);
    // pointer-resolution (HARD) — §9.2(1)(2)
    if (e.owner_spec && e.owner_spec !== 'null') {
      const hash = e.owner_spec.indexOf('#');
      if (hash < 0) hard.push(`pointer: ${e.id} owner_spec '${e.owner_spec}' not of form <file>#<slug>`);
      else {
        const file = e.owner_spec.slice(0, hash), slug = e.owner_spec.slice(hash + 1);
        const slugs = headingSlugs(path.join(INNER, file));
        if (slugs == null) hard.push(`pointer: ${e.id} owner_spec target file missing: ${file}`);
        else if (!slugs.has(slug)) hard.push(`pointer: ${e.id} owner_spec slug '#${slug}' not a heading in ${file}`);
      }
    }
    // no-competing-full-def (HARD) — §9.2(3)
    if (e.register_class === 'internal' && e.defText && e.defText.length > INTERNAL_DEF_CAP) {
      hard.push(`competing-full-def: internal ${e.id} definition.text ${e.defText.length} chars > cap ${INTERNAL_DEF_CAP} (must be one-line gloss + pointer)`);
    }
    // redaction (HARD) — §9.2(4) / §2.2 gate
    if (e.hasConvTerm && !e.redactionPass) {
      hard.push(`redaction: ${e.id} has a conversation-sourced term but no redaction_pass marker`);
    }
    // orphan (WARN) — §9.1
    if (e.type !== 'index' && !(inbound.get(e.id) > 0)) warn.push(`orphan: ${e.id} (zero inbound links)`);
  }
  // duplicate-concept (WARN) — same title-slug across two active entries
  const byTitle = new Map();
  for (const e of entries) if (e.status === 'active') {
    const k = ghSlug(e.title || '');
    if (byTitle.has(k)) warn.push(`duplicate-concept: '${e.title}' shared by ${byTitle.get(k)} and ${e.id}`);
    else byTitle.set(k, e.id);
  }

  if (opts.reindex) reindex(entries);
  return { entries, hard, warn };
}

function reindex(entries) {
  const lines = ['# Compendium INDEX — computed MOC', '',
    '> Auto-generated by `plugins/compendium/lint.cjs --reindex` from entry frontmatter. Do not hand-edit.', ''];
  for (const sub of SUBDIRS) {
    const inSub = entries.filter((e) => e.file.startsWith(`compendium/${sub}/`));
    if (!inSub.length) continue;
    lines.push(`## ${sub} (${inSub.length})`, '');
    for (const e of inSub.sort((a, b) => a.id.localeCompare(b.id))) {
      const tgt = e.owner_spec && e.owner_spec !== 'null' ? ` -> ${e.owner_spec}` : '';
      const st = e.status !== 'active' ? ` [${e.status}]` : '';
      lines.push(`- **${e.id}** (${e.register_class})${st} — ${e.title}${tgt}`);
    }
    lines.push('');
  }
  fs.writeFileSync(path.join(STORE, 'INDEX.md'), lines.join('\n'));
  // machine-readable export for the dashboard wiki tab (v0.2-d) — derived, never hand-edited.
  const json = entries.map((e) => ({
    id: e.id, title: e.title, type: e.type, register_class: e.register_class,
    owner_spec: e.owner_spec === 'null' ? null : e.owner_spec, status: e.status,
    superseded_by: e.superseded_by === 'null' ? null : e.superseded_by,
    links: e.links, definition: e.defText, glosses: e.glosses || [],
  })).sort((a, b) => a.id.localeCompare(b.id));
  fs.writeFileSync(path.join(STORE, 'index.json'), JSON.stringify({ generated: 'compendium/lint.cjs --reindex', count: json.length, entries: json }, null, 2) + '\n');
  const obs = obsidianProjection(entries);
  console.log(`[compendium-lint] Obsidian projection (§11/§8): ${obs} entr${obs === 1 ? 'y' : 'ies'} updated ([[wikilink]] peers + owner_spec pointer)`);
}

// §11/§8 Obsidian-compatible projection (v0.2.2) — emit an auto-managed block in each entry body so the SAME
//   markdown store lights up in Obsidian's graph (peer relations as in-vault `[[id]]` edges) while frontmatter
//   stays the typed SSoT. The `owner_spec` authority pointer renders as a relative link OUT of the store — the
//   pointer-not-paraphrase charter made visual (peer = graph edge; authority = external pointer). Idempotent:
//   the delimited block is stripped + regenerated each `--reindex`; frontmatter is never touched.
const OBS_START = '<!-- compendium:obsidian:start (auto — lint.cjs --reindex; do not hand-edit) -->';
const OBS_END = '<!-- compendium:obsidian:end -->';
function obsidianProjection(entries) {
  let n = 0;
  for (const e of entries) {
    const abs = path.join(INNER, e.file);
    let src;
    try { src = fs.readFileSync(abs, 'utf8'); } catch { continue; }
    let body = src;
    const s = body.indexOf(OBS_START);
    if (s >= 0) { const en = body.indexOf(OBS_END, s); if (en >= 0) body = body.slice(0, s) + body.slice(en + OBS_END.length); }
    body = body.replace(/\s+$/, '');
    const rows = [];
    const peers = (e.links || []).filter(Boolean);
    if (peers.length) rows.push('**관련 / Related:** ' + peers.map((id) => `[[${id}]]`).join(' · '));
    if (e.owner_spec && e.owner_spec !== 'null') rows.push(`**정의 원본 / Source:** [${e.owner_spec}](../../${e.owner_spec})`);
    const next = rows.length
      ? `${body}\n\n${OBS_START}\n${rows.join('  \n')}\n${OBS_END}\n`
      : `${body}\n`;
    if (next !== src) { fs.writeFileSync(abs, next); n++; }
  }
  return n;
}

module.exports = { runLint, ghSlug, headingSlugs, loadEntries, frontmatter, field, listField, defText, STORE, INNER, SUBDIRS, obsidianProjection };

if (require.main === module) {
  const argv = process.argv.slice(2);
  const r = runLint({ reindex: argv.includes('--reindex') });
  const quiet = argv.includes('--quiet');
  if (!quiet) {
    console.log(`[compendium-lint] ${r.entries.length} entries · ${r.hard.length} hard · ${r.warn.length} warn`);
    for (const h of r.hard) console.log(`  FAIL  ${h}`);
    for (const w of r.warn) console.log(`  warn  ${w}`);
  }
  process.exit(r.hard.length ? 1 : 0);
}

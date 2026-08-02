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

const HERE = __dirname;                          // 소스 레포에서는 EstreGenesis/plugins/compendium

// v0.2.9 §10 — 저장소 위치를 «자기가 설치된 자리» 로부터 추측하면 안 돼요. 종전엔 `__dirname/../..` 하나
//   였는데 그건 소스 레포 배치를 가정해요. 플러그인으로 설치되면 그 자리는 플러그인 캐시라, 두 단계 위의
//   `compendium` 은 **버전 폴더 모음**(0.2.1 / 0.2.6 / …)이에요. 디렉터리가 실재하니 존재 검사는 통과하고
//   하위 폴더만 없어서 **0건이 조용히** 나왔어요 — 오류가 아니라 «찾은 게 없음» 으로 보이는 실패였고,
//   검사가 엉뚱한 이유로 통과한 사례예요. 그래서 판정을 «존재» 가 아니라 «내용» 으로 바꿔요.
const SUBDIRS = ['glossary', 'concept', 'runbook'];

function isDir(p) { try { return fs.statSync(p).isDirectory(); } catch { return false; } }
function isFile(p) { try { return fs.statSync(p).isFile(); } catch { return false; } }

// 내용 marker 로만 판정해요. 디렉터리가 있다는 사실은 근거가 아니에요 — 그게 정확히 이 버그였어요.
function storeLooksReal(store) {
  if (!isDir(store)) return false;
  if (isFile(path.join(store, 'index.json')) || isFile(path.join(store, 'INDEX.md'))) return true;
  return SUBDIRS.some((s) => {
    const d = path.join(store, s);
    if (!isDir(d)) return false;
    try { return fs.readdirSync(d).some((f) => f.endsWith('.md')); } catch { return false; }
  });
}

// 조립된 사본은 **자기가 사본이라고 선언**해요 (`.eg-composed`). 발견은 그 표식이 있는 트리를
//   건너뜁니다. 이름으로 제외하지 않는 이유가 요점이에요 — 배포판을 어디에 두는지는 운용자가 정하고,
//   다음 사람은 다른 이름을 쓰니까 이름 기반 제외는 그날 조용히 뚫려요. 실측(2026-08-02): 배포판을
//   워크스페이스 안에 조립하자 저장소가 두 벌이 됐고, 리졸버는 «모호하면 거부» 로 옳게 반응했지만
//   운용자 눈에는 「저장소를 못 찾는다」로만 보였어요.
const COMPOSED_MARKER = '.eg-composed';
function isComposedCopy(dir) { return isFile(path.join(dir, COMPOSED_MARKER)); }

// 한 루트 아래의 저장소 후보: 루트 자신 + 바로 아래 한 겹. 한 겹을 보는 이유는 내부 repo 배치가 흔하고
//   (EG 자신이 그 형태 — 워크스페이스 밑에 공개 repo 가 들어앉아 있어요) 그 경우 루트만 봐선 못 찾아요.
function storesUnder(root) {
  const out = [];
  if (!isDir(root)) return out;
  const self = path.join(root, 'compendium');
  if (storeLooksReal(self) && !isComposedCopy(root)) out.push(self);
  let kids = [];
  try { kids = fs.readdirSync(root, { withFileTypes: true }); } catch { return out; }
  for (const d of kids) {
    if (!d.isDirectory() || d.name.startsWith('.') || d.name === 'node_modules') continue;
    const kid = path.join(root, d.name);
    if (isComposedCopy(kid)) continue;                     // 조립된 배포판 — 원본이 따로 있어요
    const s = path.join(kid, 'compendium');
    if (storeLooksReal(s)) out.push(s);
  }
  return out;
}

function resolveStore() {
  const tried = [];
  // ① 명시 지정이 최우선 — 운용자가 말한 것이 어떤 추측보다 세요. 지정했는데 내용이 없으면 **다른 데를
  //    뒤지지 않고 즉시 거부**해요: 조용히 다른 저장소로 흘러가는 게 못 찾는 것보다 나빠요.
  const envStore = process.env.COMPENDIUM_STORE;
  if (envStore) {
    const s = path.resolve(envStore);
    tried.push('COMPENDIUM_STORE = ' + s);
    if (storeLooksReal(s)) return { store: s, inner: path.dirname(s), via: 'COMPENDIUM_STORE', tried };
    return { store: null, inner: null, via: null, tried, hardFail: 'COMPENDIUM_STORE 가 가리키는 곳에 저장소 내용이 없어요: ' + s };
  }
  // ② 모듈 상대 — 소스 레포 안에서 도는 경우. 종전 동작을 글자 그대로 보존해요(검증 축이 이 경로로 돌아요).
  const legacy = path.join(path.resolve(HERE, '..', '..'), 'compendium');
  tried.push('module-relative = ' + legacy);
  if (storeLooksReal(legacy)) return { store: legacy, inner: path.dirname(legacy), via: 'module-relative', tried };
  // ③④ 프로젝트 디렉터리 · cwd 상향 탐색. 각 단계에서 «루트 자신 + 한 겹 아래» 를 봐요.
  const roots = [];
  if (process.env.CLAUDE_PROJECT_DIR) roots.push(path.resolve(process.env.CLAUDE_PROJECT_DIR));
  let cur = process.cwd();
  for (let i = 0; i < 6; i++) { roots.push(cur); const up = path.dirname(cur); if (up === cur) break; cur = up; }
  for (const r of roots) {
    const found = storesUnder(r);
    tried.push('search ' + r + ' → ' + (found.length ? found.join(' , ') : '없음'));
    if (found.length === 1) return { store: found[0], inner: path.dirname(found[0]), via: 'search:' + r, tried };
    // 여럿이면 **고르지 않아요**. 임의로 하나를 집으면 «왜 그 저장소를 읽었는지» 를 아무도 설명할 수 없어요.
    if (found.length > 1) return { store: null, inner: null, via: null, tried, hardFail: '저장소 후보가 여럿이라 고를 수 없어요 — COMPENDIUM_STORE 로 지정해 주세요: ' + found.join(' , ') };
  }
  return { store: null, inner: null, via: null, tried, hardFail: '저장소를 못 찾았어요. COMPENDIUM_STORE 에 저장소 절대 경로를 지정해 주세요.' };
}

const STORE_RESOLUTION = resolveStore();
const STORE = STORE_RESOLUTION.store;
const INNER = STORE_RESOLUTION.inner;

// 못 찾았으면 **빈 결과가 아니라 거부**. 침묵은 «항목이 없음» 과 구분되지 않고, 운용자에게 무엇을 설정해야
//   하는지 알려주지 않아요 — 시도한 경로를 함께 실어서 «어디를 봤는지» 가 답에 남게 해요.
function assertStore() {
  if (STORE) return STORE;
  const e = new Error('[compendium] ' + (STORE_RESOLUTION.hardFail || '저장소 미해소')
    + '\n시도한 곳:\n  - ' + STORE_RESOLUTION.tried.join('\n  - '));
  e.code = 'COMPENDIUM_STORE_UNRESOLVED';
  throw e;
}
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
  assertStore();
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

module.exports = { runLint, ghSlug, headingSlugs, loadEntries, frontmatter, field, listField, defText, STORE, INNER, SUBDIRS, obsidianProjection, assertStore, storeLooksReal, STORE_RESOLUTION };

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

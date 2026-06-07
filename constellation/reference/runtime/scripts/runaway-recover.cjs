#!/usr/bin/env node
'use strict';
/**
 * runaway-recover.cjs — inbox.log runaway backup 에서 의미 있는 inbound 만 streaming 추출 (deps-0).
 *
 * 2026-06-07 incident 후속: collab-client 중복 → reconnect loop → inbox.log 2.5GB 폭증 →
 * 응급조치로 backup (`<inbox>.runaway-bak-*`) 보존 + 원본 비움. 본 도구는 그 backup 에서
 * 의미 있는 application-tier inbound (Constellation §13.16.9 A2A-intent allowlist 매치)
 * 만 골라 cleaned 파일로 추출 → 사용자가 확인 후 원본 inbox.log 로 수동 복원하는 흐름.
 *
 * 동작:
 *   - readline streaming (메모리 안전, GB 단위 파일 가능)
 *   - skip: ev='sent' (self-emission echo), parse 실패, allowlist 미매치, transport-only 이벤트
 *   - keep: application-tier intent name 매치한 inbound
 *   - 통계: total / parsed / kept / dropped (reason breakdown)
 *
 * 사용:
 *   node runaway-recover.cjs <backup_path> [--to <out_path>] [--from-cursor <N>] [--keep-all]
 *   node runaway-recover.cjs collab/inbox.log.runaway-bak-155606
 *     → collab/inbox.log.runaway-bak-155606.cleaned 생성
 *
 * 옵션:
 *   --to <path>         출력 파일 (기본: <backup>.cleaned)
 *   --from-cursor <N>   line N (1-based) 부터 처리. 폭주 전 cursor 시점부터 복원 시 유용
 *   --keep-all          allowlist 필터 끄고 모든 parseable 라인 보존 (단 ev='sent' 는 여전히 제외)
 *
 * cleaned 파일을 inbox.log 로 복원하려면:
 *   wc -l <cleaned>                # 라인 수 확인
 *   cp <cleaned> collab/inbox.log
 *   echo 0 > collab/.last-surfaced-cursor   # 또는 적절한 값으로
 *   # cleaned 라인 수에 따라 cursor 조정 — 모두 surface 받으려면 0, 이미 본 만큼은 그 값.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// pre-send-probe.cjs 의 ALLOWLIST 동기 복사 (의도적 duplication — 둘이 동시에 진화하는 것이 정합).
// §13.16.9 A2A-intent allowlist + EG-side 운영 메시지.
const ALLOWLIST = new Set([
  // §13.16.9 canonical A2A-intent
  'UserPrompt', 'Command', 'Cancel',
  'Delegate', 'WorkerReport', 'WorkerAck', 'WorkerError',
  'OnboardAck', 'AgentHello',
  'Report',
  // Hyperbrief
  'DECISION_REQUEST', 'DECISION_RESPONSE', 'DECISION_DEFER', 'DECISION_REJECT_FRAMING', 'HyperbriefCard',
  // Ultrasafe
  'ULTRASAFE_FINDING', 'ULTRASAFE_ITERATION_BOUNDARY', 'ULTRASAFE_RELEASE_GATE',
  'SECURITY_DISCLOSURE_INTAKE', 'MPCVD_COORDINATION',
  // KEY-MGMT (v2.4.0+)
  'KeyIssue', 'KeyIssued', 'KeyList', 'KeyListResult', 'KeyRevoke', 'KeyRevoked', 'KeyLabel', 'KeyLabeled', 'KeyError',
  'AgentNameChanged', 'UpstreamKeyIssued', 'CollabKeyIssued', 'KeyRevokePending',
]);

function parseArgs() {
  const args = { backup: null, out: null, fromCursor: 0, keepAll: false };
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--to') args.out = argv[++i];
    else if (a === '--from-cursor') args.fromCursor = parseInt(argv[++i], 10) || 0;
    else if (a === '--keep-all') args.keepAll = true;
    else if (!args.backup) args.backup = a;
  }
  if (!args.backup) {
    console.error('Usage: node runaway-recover.cjs <backup_path> [--to <out_path>] [--from-cursor <N>] [--keep-all]');
    process.exit(1);
  }
  if (!args.out) args.out = args.backup + '.cleaned';
  return args;
}

async function main() {
  const { backup, out, fromCursor, keepAll } = parseArgs();
  if (!fs.existsSync(backup)) { console.error(`[recover] backup not found: ${backup}`); process.exit(1); }
  const st = fs.statSync(backup);
  console.error(`[recover] backup: ${backup} (${(st.size / 1048576).toFixed(1)} MiB)`);
  console.error(`[recover] output: ${out}`);
  console.error(`[recover] from-cursor: ${fromCursor}  keep-all: ${keepAll}`);

  const rl = readline.createInterface({
    input: fs.createReadStream(backup, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  });

  const outStream = fs.createWriteStream(out, { flags: 'w', encoding: 'utf8' });
  const stats = { total: 0, parsed: 0, kept: 0, droppedSent: 0, droppedAllowlist: 0, droppedParse: 0, droppedBeforeCursor: 0 };
  const kindCount = Object.create(null);
  let lineNo = 0;
  const start = Date.now();
  let lastReport = start;

  for await (const line of rl) {
    lineNo++; stats.total++;
    if (lineNo <= fromCursor) { stats.droppedBeforeCursor++; continue; }
    if (!line) continue;
    let o;
    try { o = JSON.parse(line); } catch { stats.droppedParse++; continue; }
    stats.parsed++;
    // skip self-emission echoes (pre-send-probe 의 v2.5.44 gate 동기)
    if (o && o.ev === 'sent') { stats.droppedSent++; continue; }
    // allowlist 매치 (keep-all 면 모두 보존)
    const outerName = o?.msg?.name || o?.name;
    const innerName = o?.msg?.value?.name || o?.value?.name;
    const name = (outerName && ALLOWLIST.has(outerName)) ? outerName
               : (innerName && ALLOWLIST.has(innerName) && (outerName === 'CUSTOM' || !outerName)) ? innerName
               : null;
    if (!name && !keepAll) { stats.droppedAllowlist++; continue; }
    stats.kept++;
    if (name) kindCount[name] = (kindCount[name] || 0) + 1;
    outStream.write(line + '\n');

    const nowT = Date.now();
    if (nowT - lastReport > 2000) {
      const elapsed = ((nowT - start) / 1000).toFixed(1);
      console.error(`[recover] ${elapsed}s — total=${stats.total} parsed=${stats.parsed} kept=${stats.kept} droppedSent=${stats.droppedSent} droppedAllowlist=${stats.droppedAllowlist}`);
      lastReport = nowT;
    }
  }

  await new Promise((res) => outStream.end(res));
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.error('');
  console.error(`[recover] DONE ${elapsed}s`);
  console.error(`[recover] total=${stats.total} parsed=${stats.parsed} kept=${stats.kept}`);
  console.error(`[recover]   dropped: sent=${stats.droppedSent} allowlist=${stats.droppedAllowlist} parse=${stats.droppedParse} before-cursor=${stats.droppedBeforeCursor}`);
  if (Object.keys(kindCount).length) {
    console.error('[recover] kept by name:');
    Object.entries(kindCount).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.error(`  ${k}: ${v}`));
  }
  console.error(`[recover] output written: ${out}`);
}

main().catch((e) => { console.error('[recover] FAIL:', e.stack || e.message); process.exit(1); });

#!/usr/bin/env node
'use strict';
/**
 * single-instance.cjs — process-level single-instance PID lock helper (deps-0).
 *
 * 2026-06-07 incident 후속: 동일 agentId 로 중복 client 가 동시에 서버에 합류하면
 * server 가 중복 연결을 close(1005) 로 끊고 양쪽 backoff reconnect loop 무한 발생 →
 * AgentHello 폭주 + inbox 폭증 + Stop hook surface 폭발 → API Usage Policy block.
 *
 * 패턴:
 *   const { acquire } = require('<runtime>/single-instance');
 *   acquire(path.join(DIR, `.<basename>.${AGENT_ID}.pid`), '<basename>');
 *
 * agentId 별 lock 파일을 권장 (서로 다른 agentId 는 동시 운영 가능).
 * lock 파일 위치는 caller 가 결정 — caller 의 DIR (status.txt 등과 같은 곳) 정합.
 *
 * 보장:
 *   - 같은 lock path 로 이미 띄운 프로세스가 살아있으면 신규 프로세스는 exit(2)
 *   - 죽은 PID 의 stale lock 은 자동 정리 후 신규 진행
 *   - exit / SIGINT / SIGTERM 에 lock 자동 정리 (kill -9 / 비정상 종료는 stale 로 남음 — 다음 spawn 이 정리)
 */
const fs = require('fs');

function pidAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  // POSIX: process.kill(pid, 0) — ESRCH = dead, EPERM = alive (다른 user 소유). Windows: 같은 패턴 동작.
  try { process.kill(pid, 0); return true; }
  catch (e) { return e && e.code === 'EPERM'; }
}

function acquire(lockPath, label) {
  try {
    if (fs.existsSync(lockPath)) {
      const oldPid = parseInt(fs.readFileSync(lockPath, 'utf8').trim(), 10);
      if (oldPid && pidAlive(oldPid)) {
        console.error(`[${label}] ALREADY RUNNING pid=${oldPid} (lock=${lockPath}). Duplicate same-agentId connect causes server close(1005) + reconnect loop runaway. Kill existing first.`);
        process.exit(2);
      }
      // stale (process dead) — clean up
      try { fs.unlinkSync(lockPath); } catch {}
    }
    fs.writeFileSync(lockPath, String(process.pid));
    const cleanup = () => { try { fs.unlinkSync(lockPath); } catch {} };
    process.on('exit', cleanup);
    process.on('SIGINT', () => { cleanup(); process.exit(130); });
    process.on('SIGTERM', () => { cleanup(); process.exit(143); });
  } catch (e) {
    console.error(`[${label}] PID lock setup failed: ${e.message} — proceeding without guard (NOT recommended)`);
  }
}

module.exports = { acquire, pidAlive };

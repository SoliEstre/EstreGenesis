#!/bin/sh
# hub-loop.sh — Constellation 헤드리스 hub-main 자율 추론 루프 supervisor (§13.27, POSIX sh / busybox).
#
# 흐름:  self-wake-watcher(의미있는 inbox 변화 / 재arm 타임아웃까지 블록) → hub-turn.sh(git pull
#        + 새 inbox 분류 + 모델 라우팅 헤드리스 턴) → hub-backup.sh(board 변동 백업) → 반복.
#        이벤트 구동이라 유휴 시 sh sleep(≈0 RAM), 추론 프로세스는 의미있는 A2A 도착 시에만 스폰
#        (쿼터·RAM 절약 — §13.27 invariant 1 wake economy).
#
# provenance: MangoEdu hub-peer dogfood 실배치 검증본(2026-07-09, §13.14 redaction 적용) 업스트림.
# 치환 포인트: /data(배포 마운트 프리픽스) · hub-main(canonical-id) · WS_WAIT_TICKS(재arm 주기).
#
# self-wake-watcher 는 WS_STANDBY_MODE=always(v2.4.47) 로 board 의 공개 standby 필드와 무관하게
# 상시-arm — inbox 의미 변화·feedback 만 감시한다.
set -u
cd /data/hub || exit 1
export PATH="/data/npm-global/bin:/usr/local/bin:/usr/bin:/bin"
export HOME=/data/home
export WS_INBOX=/data/hub/inbox.jsonl
export WS_STANDBY_MODE=always          # v2.4.47 1급 env — 사설 standby 우회파일 불요
export WS_AGENT_ID=hub-main
export WS_WAIT_INTERVAL=5
export WS_WAIT_TICKS=180               # 5s×180 ≈ 15분 재arm → 주기 housekeeping(git pull) tick
LOG=/data/hub/loop.log

# B5 관측성: 기동 시 의존성 경로 echo — 컨테이너 재시작으로 임시 설치가 소실되면 즉시 관측된다.
echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] hub-loop start pid=$$ claude=$(command -v claude || echo MISSING) git=$(command -v git || echo MISSING)" >> "$LOG"

# 첫 기동 시 커서를 현재 inbox 총줄수로 초기화(기존 noise 재처리 방지)
if [ ! -f /data/hub/.inbox-cursor ]; then
  wc -l < "$WS_INBOX" 2>/dev/null | tr -d ' ' > /data/hub/.inbox-cursor || echo 0 > /data/hub/.inbox-cursor
fi

while true; do
  bash /data/hub/self-wake-watcher.sh >> "$LOG" 2>&1  # 블록: 의미있는 inbox / 재arm 타임아웃 (레퍼런스 watcher=bash 전용)
  sh /data/hub/hub-turn.sh                            # 한 턴(housekeeping + 필요시 헤드리스 추론)
  sh /data/hub/hub-backup.sh                          # board 변동 백업(변경 시에만 commit+push, §13.28)
  sleep 2
done

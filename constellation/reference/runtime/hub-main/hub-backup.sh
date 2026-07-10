#!/bin/sh
# hub-backup.sh — board 변동 백업: 추적 파일 변경을 commit+push (private repo). (§13.28)
# 방어: 스테이징 내용에 시크릿 패턴이 있으면 push 중단(.gitignore 실수 대비 2차 게이트).  [§13.28.3 secret gate]
# provenance: MangoEdu hub-peer dogfood 실배치 검증본(2026-07-09) 업스트림. 치환: /data 프리픽스, 스캔 패턴, 커밋 메시지.
cd /data || exit 0
export HOME=/data/home
export PATH="/usr/local/bin:/usr/bin:/bin"
[ -f /data/config/hub.env ] && { set -a; . /data/config/hub.env; set +a; }
LOG=/data/hub/loop.log
blog() { echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] [backup] $*" >> "$LOG"; }

command -v git >/dev/null 2>&1 || { blog "git 없음 — 백업 skip"; exit 0; }
[ -d /data/.git ] || { blog ".git 없음 — 백업 skip"; exit 0; }

git add -A 2>/dev/null
git diff --cached --quiet 2>/dev/null && exit 0   # 변경 없음 → no-op

# 시크릿 재검증 게이트 — 감지 시 unstage 후 중단(절대 push 안 함).
# 실토큰 구조만 매칭(패턴 정의 문자열 자기오탐 방지 — §13.28.3): sk-ant-oat01-<20+>, ghp_<20+>, PEM 헤더.
if git grep --cached -nIE 'sk-ant-oat01-[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9]{20,}|-----BEGIN [A-Z ]*PRIVATE KEY-----' -- . >/dev/null 2>&1; then
  blog "ABORT — 스테이징에 시크릿 패턴 감지, commit/push 중단"
  git reset -q
  exit 1
fi

git commit -q -m "board snapshot $(date -u +%Y-%m-%dT%H:%M:%SZ)" 2>/dev/null || { blog "commit 실패"; exit 1; }
if GIT_ASKPASS=/data/hub/git-askpass.sh GIT_TERMINAL_PROMPT=0 git push -q origin main 2>/dev/null; then
  blog "pushed board snapshot ($(git rev-parse --short HEAD))"
else
  blog "push 실패 — 다음 tick 재시도(로컬 커밋은 보존)"   # 오프라인 내성 (§13.28.5)
fi
exit 0

#!/bin/sh
# git-askpass.sh — 헤드리스 git PAT 인증 헬퍼 (§13.28.5).
#   사용: GIT_ASKPASS=/path/to/git-askpass.sh GIT_TERMINAL_PROMPT=0 git pull/push
# 시크릿 값 없음(env 참조만) → repo 추적 안전. 호출측(hub-turn/hub-backup)이 hub.env 를 source 해 GH_PAT 주입.
# credential.helper store 대비: 디스크에 평문 자격증명 파일이 안 생김 — HOME 이 백업 대상 디렉토리
# 안에 있는 배치에서 특히 중요 (§13.28.2 transient 분류와 맞물림).
case "$1" in
  *[Uu]sername*) echo "x-access-token" ;;
  *) printf '%s\n' "${GH_PAT:-}" ;;
esac

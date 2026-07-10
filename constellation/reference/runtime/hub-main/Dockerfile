# Constellation 헤드리스 hub-main 런타임 이미지 — 재시작 내성 (§13.27.3 / §13.28.5 ops).
#
# 이중화 전략: 자주 갱신되는 CLI(claude)는 영속 마운트 npm prefix 에 설치
#   (npm i -g --prefix /data/npm-global @anthropic-ai/claude-code — 무재빌드 업데이트),
# 안정 의존성(git·bash)은 이미지에 베이크 — 컨테이너 재시작/호스트 재부팅에도 소실되지 않는다.
#   (실측 함정: docker exec 로 임시 설치한 npm/apk 패키지는 재시작 시 소실 → 루프가 조용히 무력화.)
#   build:  docker build -t constellation-hub-runtime:latest -f Dockerfile .
FROM node:22-alpine
RUN apk add --no-cache git bash
# git: 문서 repo pull + board 백업 repo push. bash: self-wake-watcher.sh(레퍼런스, bash 전용)용.
# hub-loop.sh / hub-turn.sh / hub-backup.sh 는 POSIX sh(busybox) 로 실행.

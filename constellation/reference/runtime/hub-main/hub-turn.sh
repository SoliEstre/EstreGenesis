#!/bin/sh
# hub-turn.sh — Constellation 헤드리스 hub-main 의 한 번의 추론 턴 (§13.27, POSIX sh / busybox).
#
# 1) 문서 repo git pull(best-effort)  2) 미처리 inbox 분류(noise 흡수 / §13.16.9 tier 판정)
# 3) tier→모델·effort 라우팅으로 헤드리스 one-shot — routine=저비용/low, escalation=고성능/high
# 4) 성공 시에만 커서 전진(실패 시 다음 wake 에 idempotent 재시도)  [§13.27 invariant 2]
#
# 보안: cwd=/data/hub 라 config/(시크릿) 는 접근 경로 밖. 허용 도구는 Read/Edit/Write 뿐(셸 불가)
#       → 셸 탈출/exfil 불가. add-dir 로 board(state) 와 문서 repo(읽기)만 확장.  [§13.27 invariant 4]
#
# provenance: MangoEdu hub-peer dogfood 실배치 검증본(2026-07-09) 업스트림.
# 업스트림 시 정합 조정 2건(원본 대비): ① NOISE 에 AgentHello 추가(§13.16.9 handshake 그룹 —
# v2.4.47 watcher 정렬과 동일) ② tier 리스트를 §13.16.9 tier 컬럼(SSoT)과 정렬 + fail-safe 를
# 스펙대로 unknown non-noise → escalation 으로 (원본은 unknown→routine 이었음). SSoT 변경 시 lockstep 갱신.
set -u
DATA=/data
REPO="$DATA/repo/<docs-repo>"          # 치환: 허브가 pull 하는 문서 repo(읽기전용)
INBOX="$DATA/hub/inbox.jsonl"
CURSOR="$DATA/hub/.inbox-cursor"
OUTBOX="$DATA/hub/outbox.jsonl"
LOG="$DATA/hub/loop.log"
export PATH="/data/npm-global/bin:/usr/local/bin:/usr/bin:/bin"
export HOME="$DATA/home"
[ -f "$DATA/config/hub.env" ] && { set -a; . "$DATA/config/hub.env"; set +a; }

log() { echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] $*" >> "$LOG"; }

# 1) 문서 최신화(best-effort — git 없거나 실패해도 board 큐레이션은 계속)
#    GH_PAT(hub.env)은 GIT_ASKPASS 로 주입 → .git/config·ps args 에 PAT 안 남김.  [§13.28.5]
if command -v git >/dev/null 2>&1 && [ -d "$REPO/.git" ]; then
  if GIT_ASKPASS=/data/hub/git-askpass.sh GIT_TERMINAL_PROMPT=0 git -C "$REPO" pull --ff-only >/dev/null 2>&1; then
    log "git pull ok"; else log "git pull skip/err"; fi
else
  log "git unavailable — pull skipped"
fi

# 2) 미처리 inbox 줄
total=$(wc -l < "$INBOX" 2>/dev/null | tr -d ' ' || echo 0)
cur=$(cat "$CURSOR" 2>/dev/null || echo 0)
[ "$total" -le "$cur" ] && { log "no new inbox (cur=$cur total=$total)"; exit 0; }
new=$(sed -n "$((cur+1)),${total}p" "$INBOX")

# 3) 의미필터 + tier 판정 — node 1패스. 리스트는 §13.16.9 의 4-group + tier 컬럼(SSoT) 미러.
route=$(printf '%s\n' "$new" | node -e '
  // NOISE === §13.16.9 non-A2A-intent 그룹(transport∪liveness∪handshake∪notice∪board-directed) — v2.4.47 watcher 와 정합.
  const NOISE=["ServerNotice","AgentList","Status","ConnectionRestored","Heartbeat","Typing","UserPromptAccepted","PersistentAdapterSmoke","OnboardAck","AgentHello","WorkerInboxReceived","EditMessage","MainChanged","History","Ack","AckProcessed","AckCumulative","AckPolicyUpdate","Ping","Pong"];
  // ROUTINE / ESC === §13.16.9 tier 컬럼. 미분류 non-noise 는 fail-safe escalation (스펙 정합).
  const ROUTINE=["Report","WorkerReport","WorkerAck","Command","Cancel","UserPrompt","PRRequest","PRDraftReady","PRReviewAck","PRMergeAck","PRStatusUpdate","ReviewSLAAck"];
  let names=[];
  require("fs").readFileSync(0,"utf8").trim().split("\n").filter(Boolean).forEach(function(s){try{var o=JSON.parse(s);var n=o.name||o.type||"";if(!NOISE.includes(n))names.push(n);}catch(e){}});
  if(!names.length){process.stdout.write("NONE");}
  else if(names.every(function(n){return ROUTINE.includes(n);})){process.stdout.write("ROUTINE "+names.join(","));}
  else{process.stdout.write("ESC "+names.join(","));}
' 2>/dev/null)

class=${route%% *}
names=${route#* }

if [ "$class" = "NONE" ] || [ -z "$class" ]; then
  log "new inbox all-noise/empty — advance cursor $cur->$total, no turn"   # [§13.27 invariant 3]
  echo "$total" > "$CURSOR"
  exit 0
fi

# 치환 포인트: tier→모델·effort 매핑 (§13.27 invariant 6 — 조율계 권장 프로파일)
if [ "$class" = "ESC" ]; then MODEL=opus; EFFORT=high; else MODEL=sonnet; EFFORT=low; fi
log "turn: class=$class model=$MODEL effort=$EFFORT names=$names"

# 4) 헤드리스 추론 턴 (cwd=/data/hub)
cd "$DATA/hub" || exit 1

PROMPT="새 인박스 이벤트가 도착했다(분류: $class, 이름: $names). 아래 원문 줄을 처리하라.

--- 새 인박스 줄 ---
$new
--- 끝 ---

할 일:
1) ../board/state.json 을 읽고 이 이벤트를 반영해 current/done/planned/decisions 트랙을 큐레이션하고 updatedAt(ISO Z)을 갱신한다. WorkerReport→해당 작업을 current↔done 정리, DECISION_REQUEST/EscalationRequest→decisions 에 항목 추가(사람 표면화), Handoff→planned/current 조정. state.json 구조/스키마는 유지.
2) 회신이 필요하면 outbox.jsonl(현재 폴더) 에 JSON 한 줄을 append 한다. 예: {\"type\":\"CUSTOM\",\"name\":\"WorkerAck\",\"value\":{...},\"targetAgentId\":\"<보낸이>\"}. AgentHello 의 OnboardAck 는 브리지가 자동 처리하니 중복 금지.
3) 자격증명/토큰/PAT 값을 state.json 이나 outbox 에 절대 쓰지 마라.
완료 후 한 줄로 무엇을 갱신·발신했는지 보고하라. 소스 편집·config 접근·문서 커밋 금지."

CHARTER="너는 Constellation 허브 main(hub-main), 조율계다(§13.9.3 duty profile). board/state.json 큐레이션 + blocker/decision 표면화 + 문서 최신화만 한다. 소스 편집·config 접근·자격증명 기록 금지. 피어는 자율(§13.9)이니 명령하지 말고 조율만."

timeout 900 claude -p "$PROMPT" \
  --model "$MODEL" --effort "$EFFORT" \
  --append-system-prompt "$CHARTER" \
  --permission-mode acceptEdits \
  --allowedTools Read Edit Write \
  --add-dir "$DATA/board" --add-dir "$REPO" \
  --output-format text \
  >> "$LOG" 2>&1
rc=$?

if [ "$rc" -eq 0 ]; then
  echo "$total" > "$CURSOR"
  log "turn ok ($class) — cursor $cur->$total"
else
  log "turn FAILED rc=$rc ($class) — cursor held at $cur (retry next wake)"   # [§13.27 invariant 2]
fi
exit 0

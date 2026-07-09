#!/usr/bin/env bash
# ⚠ bash 전용 — busybox/dash 등 POSIX sh 불가 (meaningful() 의 node heredoc 인용 구조 + $'\r' 등).
#    alpine 컨테이너에서는 `apk add bash` 후 `bash self-wake-watcher.sh` 로 실행할 것.
# self-wake-watcher.sh — 무한대기(standby) 모드의 self-wake 패턴 레퍼런스 구현.
#
# 의도: turn-based 로컬 IDE 에이전트가 작업 턴 종료 후 idle 에 빠지더라도, 외부 새 입력
# (라이브보드 inbox·feedback) 이나 standby 해제가 발생하면 다음 턴을 깨우는 self-wake 메커니즘.
#
# 사용: 에이전트가 백그라운드로 띄움(`bash self-wake-watcher.sh &`).
# 변경 감지 시 프로세스가 exit → 에이전트의 다음 턴이 깨어남(self-wake).
# 깨어난 에이전트는 새 항목을 처리하고, 다시 watcher 를 재기동한다.
#
# 멀티 에이전트 합류:
#   메인:  bash self-wake-watcher.sh &
#   워커:  WS_INBOX=runtime/w2-inbox.jsonl WS_AGENT_ID=worker-2 bash self-wake-watcher.sh &
#          (커서 파일은 inbox 경로에서 자동 파생 → runtime/.w2-inbox-cursor, 메인 커서와 충돌 없음)
#
# ▣ 의미 필터 (Constellation §13.16.9 Message classification by intent SSoT 참조):
#   noise blocklist === §13.16.9 board-directed allowlist + transport-tier + handshake-group
#     (ServerNotice/AgentList/Status/ConnectionRestored/Heartbeat/Typing/UserPromptAccepted/
#      PersistentAdapterSmoke/OnboardAck/AgentHello/WorkerInboxReceived/EditMessage/MainChanged/History/
#      Ack/AckProcessed/AckCumulative/AckPolicyUpdate) — 흡수(커서 전진, 깨우지 않음).
#     (v2.4.47: AgentHello 는 §13.16.9 4-group SSoT[v2.4.37] 에서 handshake 그룹 = non-wake.
#      종전 레퍼런스 watcher 는 meaningful 로 남아 피어 connect 마다 불필요 wake 했음 — SSoT 정렬.)
#   meaningful allowlist === §13.16.9 A2A-intent allowlist
#     (Report/Delegate/WorkerReport/WorkerAck/Handoff/HandoffRequested/HandoffReady/
#      Command/Priority/Cancel/UserPrompt/BlockerManifest/BlockerNudge/PRRequest/PRDraftReady/
#      PRReviewAck/PRMergeRequest/PRMergeAck/PRStatusUpdate/DeadlockProbe/ReviewSLAAck/
#      PreemptRequest/PreemptForce/MediationProposal/MediationAck/EscalationRequest) — 깨움.
#   알려지지 않은 name은 fail-safe default = 깨움 (silent-drop-of-A2A이 더 큰 cost).
#   local-bridge.cjs 의 telemetry filter(AgentList/History/CloseChannel drop) 와 정합.
#   feedback.jsonl 새 줄·standby=false 는 항상 깨움.
#
# ▣ envelope CUSTOM-wrap 정합:
#   inbox 한 줄은 {at, name, value, source} (CUSTOM envelope 의 name/value 그대로). 의미 필터는
#   `o.name || o.type` 을 보므로 raw bare framing(예: RUN_STARTED) 도 자동 깨움 대상.
#
# ▣ 2축 분담:
#   본 watcher 는 Axis B(turn-held drain) 의 외곽 트리거일 뿐 — 새 입력 감지 시 프로세스만 exit 한다.
#   실제 drain·재처리·중복 방지는 host(IDE 에이전트) 가 깨어난 다음 턴에 수행한다.
#
# 커서(처리 완료 지점): 각 파일의 처리 완료 줄수.
# - 깨어나 새 항목을 처리한 뒤 커서를 현재 총줄수로 갱신하고 재기동할 것.
# - server/브릿지 생존 감시는 별개 watchdog 가 담당 — 본 스크립트는 "수신 깨우기" 전용.
#
# ▣ silent-disable WARN: optional config 누락은 silent dead 가 아니라 armed 로그에 표면화한다.
#   - WS_INBOX 미지정 → 기본 경로 derive + [WARN] inbox derived
#   - WS_INBOX_CURSOR 미지정 → inbox 경로에서 derive (default behavior)
#   - feedback.jsonl 부재 → [WARN] feedback file missing — fc=0 폴백, standby/feedback 깨우기는 정상 동작
#
# 환경변수:
#   WS_INBOX        감시할 inbox (기본 inbox.jsonl, 본 스크립트와 동일 디렉토리)
#   WS_INBOX_CURSOR 커서 파일 (기본 = inbox 경로에서 파생: .<name>-cursor)
#   WS_FEEDBACK     보드 feedback (기본 feedback.jsonl) — 부재 시 WARN 후 무시
#   WS_STATE        보드 state.json (기본 state.json) — standby 키 읽기용
#   WS_STANDBY_MODE standby 판정 소스: state(기본 — board state.json 의 standby) |
#                   always(board standby 무시, inbox 의미변화·feedback 만 감시 — 헤드리스 hub-main
#                   supervisor 루프용: 공개 standby 값과 무관하게 상시-arm; 사설 우회파일 불요)
#   WS_AGENT_ID     내 agentId (기본 main-agent) — armed 로그 표시용
#   WS_WAIT_TICKS   폴 횟수 (기본 588 ≈ 49분 = 5초×588)
#   WS_WAIT_INTERVAL 폴 간격 초 (기본 5)

cd "$(dirname "$0")" || exit 1
INBOX="${WS_INBOX:-inbox.jsonl}"
ICUR="${WS_INBOX_CURSOR:-$(dirname "$INBOX")/.$(basename "${INBOX%.jsonl}")-cursor}"
FB="${WS_FEEDBACK:-feedback.jsonl}"
FCUR=".$(basename "${FB%.jsonl}")-cursor"
STATE_FILE="${WS_STATE:-state.json}"
SBMODE="${WS_STANDBY_MODE:-state}"   # state | always (헤드리스 상시-arm — board standby 무시)
WID="${WS_AGENT_ID:-main-agent}"
INTERVAL=${WS_WAIT_INTERVAL:-5}
MAX=${WS_WAIT_TICKS:-588}

# silent-disable WARN — optional 설정 누락 표면화
if [ -z "$WS_INBOX" ]; then
  echo "[ws-wait][WARN] WS_INBOX 미지정 — 기본 경로 사용: $INBOX"
fi
if [ ! -f "$FB" ]; then
  echo "[ws-wait][WARN] feedback 파일 부재: $FB — fc=0 폴백, standby/inbox 깨우기는 정상 동작"
fi
if [ ! -f "$STATE_FILE" ]; then
  echo "[ws-wait][WARN] state 파일 부재: $STATE_FILE — standby 기본 true 폴백"
fi

ic=$(cat "$ICUR" 2>/dev/null || echo 0)
fc=$(cat "$FCUR" 2>/dev/null || echo 0)
echo "[ws-wait] armed: inbox=$INBOX cursor=$ic agent=$WID feedback=$FB feedback_cursor=$fc standby_mode=$SBMODE (의미필터 · interval=${INTERVAL}s max=${MAX})"

# 새 줄(인자=시작 커서 이후) 중 의미 있는 항목이 있으면 1, 아니면 0 출력.
# blocklist — inbox 는 이미 나에게 라우팅된 큐이므로 알려진 noise 만 흡수하고 나머지는 모두 깨운다.
#
# ▣ ev-agnostic, name-only (Constellation §13.16.6 v2.4.16 정합 + §13.16.9 v2.4.17 SSoT):
#   이 필터는 line 의 `name`/`type` 필드만 본다. `ev` 필드를 prepend-grep 하면 안 됨.
#   inbox.log 는 두 가지 envelope 포맷을 모두 담는다 — (a) legacy event-relay
#   `{"t":..., "ev":"inbound", "msg":{"name":...}}` (bridge 의 라이프사이클 로그)
#   (b) direct inbound `{"at":..., "name":..., "value":..., "source":"agent"}` (bridge
#   가 server 로부터 실제 A2A envelope 를 deliver 할 때 쓰는 포맷). ev-stage 는 (b)
#   를 통째로 걸러내므로 bridge-alive 트래픽이 모두 silent 하게 dropped 됨.
#   진단 anchor: 2026-06-01 watcher bv0u5h95p + bd7k7xoy3 REARM-timeout 사례
#   — direct 포맷 inbound 4건이 v2.4.2 ev-gate 에 의해 silently 누락.
#   name blocklist 만으로 self-emission echo + transport noise 양쪽을 모두 커버한다.
#   v2.4.17: NOISE 와 MEANINGFUL 모두 §13.16.9 SSoT 와 정합. 알려지지 않은 name 은
#   fail-safe default = 깨움 (silent-drop-of-A2A 이 더 큰 cost).
meaningful() {
  node -e '
    const fs = require("fs"), f = process.argv[1], from = +process.argv[2];
    const NOISE = ["ServerNotice", "AgentList", "Status", "ConnectionRestored", "Heartbeat", "Typing", "UserPromptAccepted", "PersistentAdapterSmoke", "OnboardAck", "AgentHello", "WorkerInboxReceived", "EditMessage", "MainChanged", "History", "Ack", "AckProcessed", "AckCumulative", "AckPolicyUpdate"];
    let ls = []; try { ls = fs.readFileSync(f, "utf8").trim().split("\n").filter(Boolean); } catch {}
    const ok = ls.slice(from).some(s => { try { const o = JSON.parse(s);
      return !NOISE.includes(o.name || o.type || ""); } catch { return false; } });
    process.stdout.write(ok ? "1" : "0");
  ' "$INBOX" "$1" 2>/dev/null || echo 0
}

n=0
while [ "$n" -lt "$MAX" ]; do
  sleep "$INTERVAL"; n=$((n + 1))
  # B1(v2.4.47): 파일 부재 시 `< "$FB"` 입력 리다이렉션 실패는 wc 실행 전에 셸이 자기 stderr 로
  # 보고하므로 `2>/dev/null`(wc 적용)로 안 잡힘 → 매 폴 stderr 누수. -f 가드로 리다이렉션 자체를 회피.
  it=$([ -f "$INBOX" ] && wc -l < "$INBOX" || echo 0)
  ft=$([ -f "$FB" ] && wc -l < "$FB" || echo 0)
  # B4(v2.4.47): WS_STANDBY_MODE=always 면 board standby 무시(항상 standby 취급) — 헤드리스 상시-arm.
  if [ "$SBMODE" = "always" ]; then
    sb=true
  else
    sb=$(node -e 'try{process.stdout.write(String(require("./'"$STATE_FILE"'").standby))}catch(e){process.stdout.write("true")}' 2>/dev/null)
  fi
  # feedback 새 줄 · standby 해제 → 즉시 깨움
  if [ "$ft" -gt "$fc" ] || [ "$sb" != "true" ]; then
    echo "[ws-wait] WAKE (feedback/standby) inbox:$ic->$it feedback:$fc->$ft standby:$sb"
    exit 0
  fi
  # inbox 새 줄 → 의미 필터. 의미 있으면 깨움, 아니면 비의미(broadcast/Status/AgentList) 흡수=커서만 전진
  if [ "$it" -gt "$ic" ]; then
    if [ "$(meaningful "$ic")" = "1" ]; then
      echo "[ws-wait] WAKE (action) inbox:$ic->$it (의미 있는 수신)"
      exit 0
    fi
    ic=$it
  fi
done
echo "[ws-wait] re-arm (timeout ~$((MAX * INTERVAL / 60))min, no meaningful change)"
exit 0

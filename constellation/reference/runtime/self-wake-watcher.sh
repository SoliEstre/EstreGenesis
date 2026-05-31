#!/usr/bin/env bash
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
# ▣ 의미 필터 (broadcast 노이즈만 흡수, blocklist):
#   inbox 는 이미 '나에게 라우팅된' 큐다. 알려진 noise(ServerNotice/AgentList/Status/Heartbeat/
#   UserPromptAccepted/OnboardAck 등)만 흡수(커서 전진)하고, 그 외 실제 액션·보고(UserPrompt·
#   Delegate·WorkerReport·WorkerAck·AgentHello·Handoff* 등)는 모두 깨운다.
#   (allowlist 가 아닌 blocklist — 새 의미 name 이 생겨도 놓치지 않음.)
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
#   WS_AGENT_ID     내 agentId (기본 main-agent) — armed 로그 표시용
#   WS_WAIT_TICKS   폴 횟수 (기본 196 ≈ 49분 = 15초×196)
#   WS_WAIT_INTERVAL 폴 간격 초 (기본 15)

cd "$(dirname "$0")" || exit 1
INBOX="${WS_INBOX:-inbox.jsonl}"
ICUR="${WS_INBOX_CURSOR:-$(dirname "$INBOX")/.$(basename "${INBOX%.jsonl}")-cursor}"
FB="${WS_FEEDBACK:-feedback.jsonl}"
FCUR=".$(basename "${FB%.jsonl}")-cursor"
STATE_FILE="${WS_STATE:-state.json}"
WID="${WS_AGENT_ID:-main-agent}"
INTERVAL=${WS_WAIT_INTERVAL:-15}
MAX=${WS_WAIT_TICKS:-196}

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
echo "[ws-wait] armed: inbox=$INBOX cursor=$ic agent=$WID feedback=$FB feedback_cursor=$fc (의미필터 · interval=${INTERVAL}s max=${MAX})"

# 새 줄(인자=시작 커서 이후) 중 의미 있는 항목이 있으면 1, 아니면 0 출력.
# blocklist — inbox 는 이미 나에게 라우팅된 큐이므로 알려진 noise 만 흡수하고 나머지는 모두 깨운다.
meaningful() {
  node -e '
    const fs = require("fs"), f = process.argv[1], from = +process.argv[2];
    const NOISE = ["ServerNotice", "AgentList", "Status", "ConnectionRestored", "Heartbeat", "Typing", "UserPromptAccepted", "PersistentAdapterSmoke", "OnboardAck", "WorkerInboxReceived", "EditMessage"];
    let ls = []; try { ls = fs.readFileSync(f, "utf8").trim().split("\n").filter(Boolean); } catch {}
    const ok = ls.slice(from).some(s => { try { const o = JSON.parse(s);
      return !NOISE.includes(o.name || o.type || ""); } catch { return false; } });
    process.stdout.write(ok ? "1" : "0");
  ' "$INBOX" "$1" 2>/dev/null || echo 0
}

n=0
while [ "$n" -lt "$MAX" ]; do
  sleep "$INTERVAL"; n=$((n + 1))
  it=$(wc -l < "$INBOX" 2>/dev/null || echo 0)
  ft=$(wc -l < "$FB" 2>/dev/null || echo 0)
  sb=$(node -e 'try{process.stdout.write(String(require("./'"$STATE_FILE"'").standby))}catch(e){process.stdout.write("true")}' 2>/dev/null)
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

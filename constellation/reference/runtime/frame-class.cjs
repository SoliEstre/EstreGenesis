'use strict';
// frame-class.cjs — §2 telemetry exclusion 의 «태그» 를 정하는 단 하나의 부품 (v2.4.138).
//
// 무엇이 있었나: 규격은 「observation-only telemetry **is tagged** so the server … excludes it from
//   both A2A reply-window pairing AND main routing」이라고만 적혀 있었어요. **어떻게** 태그하는지를
//   안 말해서, 구현자는 그 시점의 유일한 계측원이던 워처의 **이름 자체**(`codex-watch`)를 태그로
//   삼았어요. 그 뒤에 생긴 좌석 계측은 규격의 정의상 명백한 telemetry 인데 태그를 가질 방법이 없었고,
//   그래서 §13.8 응답창 되돌림이 «비어 있는 수신자» 를 «최근에 나에게 말 건 사람» 으로 채워
//   **협업 상대에게 부쳤어요.** 그쪽 에이전트가 박동마다 깨어 회신했고(실측 회신에 「Interrupting
//   current task」 포함 — 비용만이 아니라 돌던 작업을 선점), 회신이 응답창을 다시 열어 자기증식했어요.
//
// 그래서 목록을 늘리는 대신 «누가 아는가» 로 옮겼어요. 관측인지 아닌지는 **발행자가 알아요** —
//   서버가 이름으로 추측할 일이 아니에요. 판정 갈래 셋의 우선순위가 그 순서예요:
//     ① 명시 선언 `telemetry: true` — 정본. 관측 프로세스는 자기 emit 길목에서 한 번 찍어요.
//     ② 레거시 `codex-watch` — 기존 채택자가 쓰던 태그. 계속 인식해요(무영향이 계약).
//     ③ 이름 꼬리 — ①을 아직 안 붙인 발신 표면을 위한 **안전망**. 사유 없이 늘리지 마세요.
//
// ③이 목록인 건 맞지만, 이 목록이 낡아도 조용하지 않아야 해요 — 서버가 빈 수신자를 채우는 순간을
//   한 번은 말하게 해 뒀어요(server.cjs `_telFillWarn`). 분류 안 된 상시 스트림은 그 줄로 드러나요.

// ③ 안전망. 사유가 붙은 최소 집합이에요 — 사유를 못 쓰면 그건 여기 들어올 게 아니라 발행자가
//    ①을 붙일 자리예요.
const TELEMETRY_NAMES = new Map([
  ['SeatTelemetry', '좌석 계측 스냅샷 (§13.35.8) — 하네스가 디스크에 쓴 사실을 읽어 보드 지표로만 씀'],
  ['SubagentStatus', '서브에이전트 활동 스냅샷 — 관측 프로세스의 주기 발행'],
  ['WorkflowStatus', '워크플로 런 스냅샷 — 같은 부류'],
  ['AgentActivity', '에이전트 활성 스트림 (Pantty §8 확장) — 실제 도구 호출/현재-초점에서 파생한 «지금 무엇을» 표시. 관측 전용이라 응답창 짝짓기/main 라우팅에서 빠져야 함(안 그러면 매 도구호출이 협업 상대를 깨움)'],
]);

/**
 * 이 봉투가 «관측» 인가 «말 걸기» 인가.
 * 관측이면 서버는 보드 방송·이력에는 그대로 두고, **응답창 짝짓기와 main 라우팅에서 뺍니다**.
 */
function isTelemetryFrame(msg) {
  if (!msg) return false;
  if (msg.telemetry === true) return true;                                            // ① 명시 선언
  if (msg.threadId === 'codex-watch' || msg.runId === 'codex-watch'                   // ② 레거시 태그
    || (msg.type === 'STATE_SNAPSHOT' && msg.scope === 'codex-watch')) return true;
  if (msg.type === 'CUSTOM' && TELEMETRY_NAMES.has(msg.name)) return true;            // ③ 안전망
  return false;
}

/**
 * 발행 길목에서 한 번 찍어요 — 호출부마다 손으로 넣으면 새 프레임이 생길 때마다 하나씩 빠지고,
 *   **빠진 자리는 오류가 아니라 «잘 보낸 것» 처럼 보여요** (relay-key.cjs 와 같은 이유).
 */
function stampTelemetry(msg) {
  if (msg && typeof msg === 'object') msg.telemetry = true;
  return msg;
}

// §13.16.9 의 «군» 분류 — 위 텔레메트리 판정과 같은 부품에 둬요(프레임이 어떤 성격인지 아는 곳이 하나여야 해서).
//   표는 Constellation.md §13.16.9 의 4-군 표(transport · liveness · handshake · notice)와 board-directed(UX 잔여), 그리고 A2A-intent 의
//   «문서쪽 정본 이름들» 이에요. 이 표는 **소비자(상향 전송 등)가 프레임에 붙이는 라벨용**이지 «깨울지 말지» 의 판정이 아니에요 —
//   깨움 판정은 probe 의 합집합 분류(지목 여부 포함)가 따로 있고, 여기엔 그 규칙이 없어요. 이름이 어느 표에도 없으면 'other' 예요
//   (추측해서 a2a-intent 로 접지 않아요 — 모르는 이름을 의미 있다고 라벨 붙이면 라벨이 거짓말이 돼요).
const GROUPS = Object.freeze({
  transport: ['Ack', 'AckProcessed', 'AckCumulative', 'AckPolicyUpdate', 'Ping', 'Pong'],
  liveness: ['Heartbeat', 'PersistentAdapterSmoke', 'Typing'],
  handshake: ['AgentHello', 'OnboardAck', 'AgentList', 'History', 'ConnectionInfo'],
  notice: ['ServerNotice'],
  'board-directed': ['Status', 'UserPromptAccepted', 'ConnectionRestored', 'MainChanged', 'EditMessage', 'WorkerInboxReceived'],
  'a2a-intent': [
    'Report', 'Delegate', 'WorkerReport', 'WorkerAck', 'Handoff', 'HandoffRequested', 'HandoffReady', 'Command', 'Priority', 'Cancel', 'UserPrompt',
    'BlockerManifest', 'BlockerNudge', 'PRRequest', 'PRDraftReady', 'PRReviewAck', 'PRMergeRequest', 'PRMergeAck', 'PRStatusUpdate', 'PRRequestRejected',
    'DeadlockProbe', 'ReviewSLAAck', 'PreemptRequest', 'PreemptForce', 'MediationProposal', 'MediationAck', 'EscalationRequest',
    'DECISION_REQUEST', 'DECISION_RESPONSE', 'DECISION_DEFER', 'DECISION_REJECT_FRAMING', 'HyperbriefCard',
    'ULTRASAFE_FINDING', 'ULTRASAFE_ITERATION_BOUNDARY', 'ULTRASAFE_RELEASE_GATE', 'SECURITY_DISCLOSURE_INTAKE', 'MPCVD_COORDINATION',
    // probe 의 열거(stop-hook/pre-send-probe.cjs ALLOWLIST)가 문서 표보다 넓어요 — 와이어 실측으로 늘어난 이름들. 이 목록이 그 열거에서
    //   뒤처지지 않는지는 smoke-uplink 가 probe 파일을 읽어 «전 이름이 a2a-intent 인가» 로 재요(손 목록이라 단정이 필요해요).
    'RelayUnreachable', 'Response', 'SelectionPrompt', 'SelectionExpired', 'SelectionResolved', 'SpecGapReport', 'SpecGapCode', 'Proposal',
    'ReturnPackage', 'PhaseBScopeShare', 'TaskEnvelope', 'Request', 'Reply', 'Attachment', 'AgentText', 'ArtifactManifest', 'ArtifactComplete',
  ],
});
const _GROUP_OF = new Map();
for (const g of Object.keys(GROUPS)) for (const n of GROUPS[g]) _GROUP_OF.set(n, g);

/** 이름 하나의 군. 표에 없으면 'other'. */
function groupOfName(name) { return (typeof name === 'string' && _GROUP_OF.get(name)) || 'other'; }

module.exports = { isTelemetryFrame, stampTelemetry, TELEMETRY_NAMES, GROUPS, groupOfName };

'use strict';
// relay-key.cjs — §13.13.2 회수 열쇠(msgId)를 **만들고 붙이는 단 하나의 부품** (v2.4.127).
//
// 왜 부품인가: 이 저장소의 발신 표면은 13곳이었고, 그중 11곳이 회수 열쇠 없이 프레임을 내보내고
//   있었어요. 표면마다 손으로 넣는 방식은 반드시 실패해요 — 새 표면이 생길 때마다 하나씩 빠지고,
//   **빠진 자리는 오류가 아니라 «잘 보낸 것» 처럼 보이거든요.** 열쇠 없는 봉투는 서버가 delivered
//   ack 도 pending 등재도 하지 않아서, 상대가 재시작하는 창에 들어가면 조용히 사라지고 발신자는
//   그 사실조차 못 받아요(「보냈다」와 「닿았다」가 구분되지 않는 상태).
//
// 그래서 규율은 «모든 발신 지점에 msgId 를 적자» 가 아니라 **«봉투가 소켓으로 나가는 마지막
//   길목에서 한 번 통과시키자»** 예요. 호출 지점이 몇 개든 길목은 파일당 하나예요.
//
// 자격 판정은 서버의 wsRelayKey() 와 **같은 집합**을 봐야 해요. 어긋나면 클라가 붙인 열쇠를 서버가
//   무시하거나(재전달 없음), 서버가 등재한 걸 클라가 ack 하지 않아요(허위 미전달). 두 곳이 같은
//   목록을 손으로 들고 있는 건 이미 드리프트라, 여기 정의를 정본으로 삼고 서버는 그 이름을 따라요.

let _n = 0;

// 프로세스-로컬 단조 증가 + 시각. 재시작해도 시각이 앞서므로 충돌하지 않아요.
//   전역 유일성은 필요 없어요 — 회수 상관관계는 (agentId, msgId) 쌍으로 잡으니까요.
function makeMsgId(prefix) {
  return (prefix || 'm') + '-' + Date.now().toString(36) + '-' + (++_n).toString(36);
}

// ack/ping 류는 **등재되면 안 되는** 쪽이에요. 여기에 열쇠를 달면 수신자의 자동 ack 가 ack 를
//   되받아 서로를 먹여요(ack 스톰). 서버의 _WS_ACK_KINDS 와 같은 집합이어야 해요.
const ACK_KINDS = new Set(['Ack', 'AckProcessed', 'AckCumulative', 'Ping', 'Pong']);

// 회수 열쇠가 **필요한** 봉투인가: 받을 사람이 적혔고(1:1 관계라야 회수가 뜻이 있어요),
//   ack/ping 류가 아니고, 아직 열쇠가 없을 때.
function needsRelayKey(msg) {
  if (!msg || !msg.targetAgentId) return false;
  if (ACK_KINDS.has(msg.name)) return false;
  return !msg.msgId;
}

// 길목에서 한 번 통과시켜요. 이미 열쇠가 있으면 **건드리지 않아요** — 상위에서 부여한 msgId 가
//   재전달 상관관계의 정본이에요. 레거시 철자 messageId 는 승계해서 두 철자가 갈라지지 않게 해요.
function stampRelayKey(msg, prefix) {
  if (needsRelayKey(msg)) msg.msgId = msg.messageId || makeMsgId(prefix);
  return msg;
}

module.exports = { makeMsgId, needsRelayKey, stampRelayKey, ACK_KINDS };

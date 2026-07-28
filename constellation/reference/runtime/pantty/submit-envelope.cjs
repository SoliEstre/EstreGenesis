'use strict';
/**
 * submit-envelope.cjs — 보드에서 온 글을 상주 좌석에 **명령이 아니라 데이터로** 넣어요.
 *
 * 왜 필요한가 (§13.35.4):
 *   슬래시 명령을 평범한 텍스트와 같은 채널로 받는 하네스에서는, 인바운드 한 줄이 좌석을 통째로
 *   비울 수 있어요. 실측으로 `/clear` 한 줄이 좌석 문맥을 전량 날리고 비용 상한을 0으로 되돌렸는데,
 *   결과 봉투는 «오류 아님» 이었어요. 전송 계층에서는 아무 신호도 안 나요.
 *
 * 무엇이 실제로 막아주나 (dispatch-facts.json):
 *   디스패치 판정은 **제출 문자열의 첫 문자**만 봐요. 앞뒤를 다듬지 않고, 둘째 줄부터는 보지 않아요.
 *   그리고 그 판정은 **모델보다 앞서요** — 선두 슬래시 뒤에 「데이터로 보세요」를 붙여도 그대로
 *   디스패치되고, 반대로 슬래시가 선두만 아니면 아무 지시가 없어도 디스패치되지 않아요.
 *   ⇒ 첫 문자를 어댑터가 제 것으로 채우면 이 층은 **모델의 협조 없이** 닫혀요.
 *
 * 무엇이 안 막히나 — 이걸 헷갈리면 설계가 틀려요:
 *   디스패치가 없어도 모델은 그 글을 **읽어요**. 안에 든 지시를 따를지는 완전히 다른 층이고,
 *   구분자로 감싸거나 「데이터입니다」라고 적는 걸로는 닫히지 않아요(그건 부탁이지 보장이 아니에요).
 *   그 층의 통제 수단은 좌석의 **권한 범위**(쓸 수 있는 도구·승인 모드)예요. 이 모듈은 그 층을
 *   해결하지 않고, 해결한 척도 하지 않아요.
 *   특히 **구조화 입력은 보호가 아니에요** — content 블록 배열로 감싸도 그대로 디스패치돼요(o-18).
 *
 * 계약 (검사 가능한 형태로):
 *   P1  제출 문자열의 첫 문자는 어댑터 헤더에서 와요. 보드 내용은 절대 선두에 오지 않아요.
 *   P2  보드 내용은 어댑터가 고른 구분자 안에만 있고, 그 구분자는 내용 안에 나타나지 않아요.
 *   P3  build 는 안전하지 않은 문자열을 **반환하지 않아요** — 던져요. 반환값은 이미 통과한 것이에요.
 *   P4  커서 전진은 **처리 증거**로만 — 봉투 상태로는 안 돼요(디스패치된 입력도 «성공» 을 내요).
 */
const fs = require('fs');
const path = require('path');

const FACTS_PATH = path.join(__dirname, 'dispatch-facts.json');

let _facts = null;
/** 실측 사실을 읽어요. sigil 목록을 여기 상수로 복제하지 않는 게 요점이에요 — 사본은 조용히 갈라져요. */
function facts() {
  if (!_facts) _facts = JSON.parse(fs.readFileSync(FACTS_PATH, 'utf8'));
  return _facts;
}

function sigils() {
  const s = facts().predicate && facts().predicate.sigils;
  if (!Array.isArray(s) || s.length === 0) {
    throw new Error('dispatch-facts.json 에 predicate.sigils 가 없어요 — 무엇을 막는지 모르는 채로 통과시키지 않아요.');
  }
  return s;
}

const DEFAULT_OPEN = '--- INBOUND (data) ---';
const DEFAULT_CLOSE = '--- END INBOUND ---';

// 접두는 «있다» 가 아니라 «이것이다» 여야 해요. 헤더를 출처 필드 조립으로만 만들면, 출처가 전부
// 빈 인바운드 하나로 헤더가 빈 문자열이 되고 그때 보드 글이 첫 문자가 돼요. 상수 접두는 그 경로를
// 없애요 — 단정이 「비어 있지 않다」가 아니라 「이 리터럴로 시작한다」가 되니까요.
const HEADER_PREFIX = '[pantty] ';

// 헤더에 실리는 출처 값은 **보드가 통제해요**. 헤더는 모델이 «어댑터가 쓴 글» 로 읽는 자리라,
// 거기에 임의 문장이 들어가면 디스패치와 무관하게 어댑터의 목소리를 빌려 쓰는 셈이 돼요.
const ORIGIN_SAFE = /^[A-Za-z0-9._:@-]{1,64}$/;

// 확장 층 관측용. 하네스는 본문 **어디서나** 이 모양을 찾아 파일·서브에이전트·자원을 자동으로
// 끌어와요(모델에게 묻지 않고). 선두 불변식은 이 층을 건드리지 않아요 — 그래서 막는 대신 세요.
const MENTION = /(^|[\s。、？！])@[\w:.@/\\-]+/g;

class UnsafeSubmission extends Error {
  constructor(msg, detail) {
    super(msg);
    this.name = 'UnsafeSubmission';
    this.detail = detail || {};
  }
}

/** 첫 문자가 sigil 인가. 다듬지 않아요 — 하네스도 안 다듬으니까요. */
function startsWithSigil(text, sigilList) {
  const list = sigilList || sigils();
  if (typeof text !== 'string' || text.length === 0) return false;
  return list.some((s) => text.startsWith(s));
}

/**
 * P1 관문. build 가 내부에서 부르고, 직접 제출하는 경로도 이걸 통과시켜야 해요.
 * 통과 조건 하나뿐이라 짧아요 — 짧은 게 이 계약의 성질이에요.
 */
function assertSafe(text) {
  if (typeof text !== 'string') {
    throw new UnsafeSubmission('제출값이 문자열이 아니에요.', { type: typeof text });
  }
  if (text.length === 0) {
    throw new UnsafeSubmission('빈 제출은 좌석에 보내지 않아요.', {});
  }
  if (startsWithSigil(text)) {
    throw new UnsafeSubmission(
      '제출 문자열이 명령 sigil 로 시작해요 — 이대로 넣으면 모델을 거치지 않고 명령으로 실행돼요.',
      { firstChar: text[0], sigils: sigils() }
    );
  }
  return text;
}

/**
 * 내용 안에 닫는 구분자가 들어 있으면 모델이 경계를 잘못 읽을 수 있어요(P2).
 * 디스패치 층과는 무관해요 — 그 층은 P1 이 이미 닫았어요. 이건 «어디까지가 데이터인가» 의 문제라
 * 모델층 완화이고, 그래서 보장이 아니라 성실한 최선이에요.
 */
function chooseMarkers(content, open, close, header) {
  // 헤더도 같이 봐요. 헤더의 값(board·channel·from·msgId)은 **보드에서 온 것**이라 신뢰 대상이
  // 아니에요 — 그중 하나가 닫는 구분자 문자열이면 경계 표시가 두 번 나타나요. 첫 판은 content 만
  // 봤고, 그건 「신뢰 못 할 입력」의 범위를 본문으로만 잡은 실수였어요.
  const scan = content + '\n' + (header || '');
  let o = open || DEFAULT_OPEN;
  let c = close || DEFAULT_CLOSE;
  let n = 0;
  while (scan.includes(o) || scan.includes(c)) {
    n += 1;
    if (n > 64) throw new UnsafeSubmission('구분자를 고를 수 없어요.', { tries: n });
    const tag = `#${n}`;
    o = `${open || DEFAULT_OPEN} ${tag}`;
    c = `${close || DEFAULT_CLOSE} ${tag}`;
  }
  return { open: o, close: c, nonced: n > 0 };
}

/**
 * 보드발 내용을 좌석에 넣을 제출 문자열을 만들어요.
 *
 * @param {object}  a
 * @param {string}  a.content   보드에서 온 글 (신뢰하지 않는 입력)
 * @param {string} [a.header]   선두를 차지할 어댑터 헤더 (기본값 제공)
 * @param {object} [a.origin]   헤더에 실을 출처 표시 {board, channel, from, msgId}
 * @param {string} [a.task]     좌석에게 시키는 일 (봉투 밖, 어댑터가 쓴 글)
 * @returns {{text:string, open:string, close:string, nonced:boolean, header:string}}
 */
function buildSubmission(a) {
  const opts = a || {};
  const content = opts.content;
  if (typeof content !== 'string') {
    throw new UnsafeSubmission('보드 내용이 문자열이 아니에요.', { type: typeof content });
  }

  // 출처 값은 검사해서 통과한 것만 실어요. 못 미더운 값을 «청소» 하지 않고 **빼요** — 청소는
  // 무엇이 지워졌는지 안 보이지만, 뺀 건 목록에 남아 호출부가 알 수 있어요.
  const origin = opts.origin || {};
  const dropped = [];
  const fields = ['board', 'channel', 'from', 'msgId']
    .filter((k) => origin[k] != null && String(origin[k]).length > 0)
    .filter((k) => {
      if (ORIGIN_SAFE.test(String(origin[k]))) return true;
      dropped.push(k);
      return false;
    })
    .map((k) => `${k}=${String(origin[k])}`);

  const mentions = (content.match(MENTION) || []).length;
  const marks = [`mentions=${mentions}`];
  if (dropped.length) marks.push(`dropped=${dropped.join(',')}`);

  const header = HEADER_PREFIX + fields.concat(marks).join(' ');
  if (startsWithSigil(header)) {
    throw new UnsafeSubmission('헤더가 sigil 로 시작해요.', { firstChar: header[0] });
  }

  const m = chooseMarkers(content, opts.open, opts.close, header + '\n' + (opts.task || ''));
  const parts = [header, m.open, content, m.close];
  if (opts.task) parts.push(String(opts.task));
  const text = parts.join('\n');

  assertSafe(text); // P3 — 안전하지 않은 문자열은 반환하지 않고 던져요.
  if (!text.startsWith(HEADER_PREFIX)) {
    // 「헤더가 비어 있지 않다」가 아니라 「상수 접두로 시작한다」를 단정해요.
    throw new UnsafeSubmission('제출 문자열이 어댑터 상수 접두로 시작하지 않아요.', { prefix: HEADER_PREFIX });
  }
  return { text, open: m.open, close: m.close, nonced: m.nonced, header, mentions, dropped };
}

/**
 * 와이어에 실릴 content 를 그대로 검사해요. 문자열이면 그 문자열을, **블록 배열이면 마지막
 * 텍스트 블록**을 봐요 — 하네스가 보는 게 그거예요(블록은 합쳐지지 않아요).
 *
 * 이게 왜 별도 함수인가: 「헤더를 첫 블록에, 보드 글을 뒷 블록에」 두는 배치가 직관적으로
 * 안전해 보이는데 **정확히 뚫리는 배치**예요. 헤더는 반드시 같은 문자열 안의 접두여야 해요.
 * 직관이 틀리는 자리는 규율이 아니라 함수로 막는 게 맞아요.
 */
function assertSafeWireContent(content) {
  if (typeof content === 'string') return assertSafe(content);
  if (Array.isArray(content)) {
    const last = content[content.length - 1];
    if (!last || last.type !== 'text' || typeof last.text !== 'string') {
      throw new UnsafeSubmission(
        '블록 배열의 마지막이 텍스트 블록이 아니에요 — 하네스가 무엇을 검사할지 이 모듈이 단정할 수 없어요.',
        { lastType: last && last.type }
      );
    }
    if (content.length > 1) {
      throw new UnsafeSubmission(
        '여러 블록으로 나눠 보내지 마세요 — 하네스는 **마지막** 텍스트 블록만 봐요. 앞 블록의 헤더는 보호가 아니에요.',
        { blocks: content.length }
      );
    }
    return assertSafe(last.text);
  }
  throw new UnsafeSubmission('알 수 없는 content 형태예요.', { type: typeof content });
}

/**
 * P4 — 처리 증거. 디스패치된 입력은 모델 턴 0으로 «성공» 봉투를 내므로, 봉투 상태를 근거로
 * 커서를 전진시키면 그 메시지는 조용히 버려져요. 훅이 막은 경우도 같은 모양이라 구분이 안 돼요.
 */
function isProcessed(result) {
  if (!result || typeof result !== 'object') return false;
  const turns = result.num_turns != null ? result.num_turns : result.numTurns;
  return typeof turns === 'number' && turns >= 1;
}

/** 커서 전진 직전에 부르세요. 통과 못 하면 이유를 이름 대며 거절해요. */
function assertProcessedBeforeAdvance(result) {
  if (!isProcessed(result)) {
    const turns = result && (result.num_turns != null ? result.num_turns : result.numTurns);
    throw new UnsafeSubmission(
      '모델 턴 0 — 제출이 처리되지 않았어요(명령으로 디스패치됐거나 거부됨). 커서를 전진시키면 이 메시지를 잃어요.',
      { num_turns: turns === undefined ? null : turns }
    );
  }
  return true;
}

/** 확장 층은 막지 않고 **셉니다** — 어댑터가 새로 만들지 않았음을 단정할 수 있게. */
function countMentions(text) {
  return (String(text).match(MENTION) || []).length;
}

module.exports = {
  FACTS_PATH,
  HEADER_PREFIX,
  countMentions,
  facts,
  sigils,
  startsWithSigil,
  assertSafe,
  chooseMarkers,
  buildSubmission,
  assertSafeWireContent,
  isProcessed,
  assertProcessedBeforeAdvance,
  UnsafeSubmission,
  DEFAULT_OPEN,
  DEFAULT_CLOSE,
};

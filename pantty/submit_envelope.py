"""submit_envelope.py — submit-envelope.cjs 의 파이썬 짝.

왜 두 벌인가:
  가드가 필요한 자리는 두 곳이에요. 참조 런타임은 Node 이고, 좌석을 실제로 모는 층은
  하네스 SDK 를 따라 파이썬이에요. 매 제출마다 하위 프로세스를 띄우는 건 뜨거운 경로에
  Node 의존을 박는 일이고, 그렇다고 손으로 두 벌을 유지하면 이 저장소가 이미 여러 번 겪은
  «평행 구현이 조용히 갈라짐» 이 그대로 재현돼요.

  그래서 두 벌을 **기계로 묶었어요**: sigil·구분자 같은 값은 양쪽 다 dispatch-facts.json
  하나에서 읽고, 검사(verify-pantty-submission.cjs)가 **같은 코퍼스를 두 구현에 통과시켜
  결과가 글자까지 같은지** 확인해요. 갈라지면 컷이 실패해요.

  문자 클래스를 축약형(\\w·\\s)으로 쓰지 않는 이유도 같아요 — 파이썬의 \\w 는 한글을
  포함하고 자바스크립트는 안 해요. 같은 정규식을 적어두고 다른 답을 내는 부류라서,
  양쪽 다 명시 클래스만 씁니다.
"""
import json
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
FACTS_PATH = os.path.join(HERE, "dispatch-facts.json")

DEFAULT_OPEN = "--- INBOUND (data) ---"
DEFAULT_CLOSE = "--- END INBOUND ---"
HEADER_PREFIX = "[pantty] "
ORIGIN_SAFE = re.compile(r"^[A-Za-z0-9._:@-]{1,64}$")
MENTION = re.compile(r"(^|[ \t\n\r\f\v。、？！])@[A-Za-z0-9_:.@/\\-]+")

_facts = None


class UnsafeSubmission(Exception):
    def __init__(self, message, detail=None):
        super().__init__(message)
        self.detail = detail or {}


def facts():
    global _facts
    if _facts is None:
        with open(FACTS_PATH, encoding="utf-8") as f:
            _facts = json.load(f)
    return _facts


def sigils():
    s = (facts().get("predicate") or {}).get("sigils")
    if not isinstance(s, list) or not s:
        raise RuntimeError("dispatch-facts.json 에 predicate.sigils 가 없어요 — 무엇을 막는지 모르는 채로 통과시키지 않아요.")
    return s


def starts_with_sigil(text, sigil_list=None):
    lst = sigil_list if sigil_list is not None else sigils()
    if not isinstance(text, str) or text == "":
        return False
    return any(text.startswith(s) for s in lst)


def assert_safe(text):
    if not isinstance(text, str):
        raise UnsafeSubmission("제출값이 문자열이 아니에요.", {"type": type(text).__name__})
    if text == "":
        raise UnsafeSubmission("빈 제출은 좌석에 보내지 않아요.", {})
    if starts_with_sigil(text):
        raise UnsafeSubmission(
            "제출 문자열이 명령 sigil 로 시작해요 — 이대로 넣으면 모델을 거치지 않고 명령으로 실행돼요.",
            {"firstChar": text[0], "sigils": sigils()},
        )
    return text


def choose_markers(content, open_mark=None, close_mark=None, header=None):
    scan = content + "\n" + (header or "")
    o = open_mark or DEFAULT_OPEN
    c = close_mark or DEFAULT_CLOSE
    n = 0
    while o in scan or c in scan:
        n += 1
        if n > 64:
            raise UnsafeSubmission("구분자를 고를 수 없어요.", {"tries": n})
        tag = "#%d" % n
        o = "%s %s" % (open_mark or DEFAULT_OPEN, tag)
        c = "%s %s" % (close_mark or DEFAULT_CLOSE, tag)
    return {"open": o, "close": c, "nonced": n > 0}


def count_mentions(text):
    return len(MENTION.findall(str(text)))


def build_submission(content=None, origin=None, task=None, open_mark=None, close_mark=None):
    if not isinstance(content, str):
        raise UnsafeSubmission("보드 내용이 문자열이 아니에요.", {"type": type(content).__name__})

    origin = origin or {}
    dropped = []
    fields = []
    for k in ("board", "channel", "from", "msgId"):
        v = origin.get(k)
        if v is None or str(v) == "":
            continue
        if ORIGIN_SAFE.match(str(v)):
            fields.append("%s=%s" % (k, v))
        else:
            dropped.append(k)

    mentions = count_mentions(content)
    marks = ["mentions=%d" % mentions]
    if dropped:
        marks.append("dropped=%s" % ",".join(dropped))

    header = HEADER_PREFIX + " ".join(fields + marks)
    if starts_with_sigil(header):
        raise UnsafeSubmission("헤더가 sigil 로 시작해요.", {"firstChar": header[0]})

    m = choose_markers(content, open_mark, close_mark, header + "\n" + (task or ""))
    parts = [header, m["open"], content, m["close"]]
    if task:
        parts.append(str(task))
    text = "\n".join(parts)

    assert_safe(text)
    if not text.startswith(HEADER_PREFIX):
        raise UnsafeSubmission("제출 문자열이 어댑터 상수 접두로 시작하지 않아요.", {"prefix": HEADER_PREFIX})
    return {
        "text": text,
        "open": m["open"],
        "close": m["close"],
        "nonced": m["nonced"],
        "header": header,
        "mentions": mentions,
        "dropped": dropped,
    }


def assert_safe_wire_content(content):
    """하네스가 보는 것을 그대로 검사해요 — 배열이면 **마지막** 텍스트 블록."""
    if isinstance(content, str):
        return assert_safe(content)
    if isinstance(content, list):
        last = content[-1] if content else None
        if not isinstance(last, dict) or last.get("type") != "text" or not isinstance(last.get("text"), str):
            raise UnsafeSubmission(
                "블록 배열의 마지막이 텍스트 블록이 아니에요 — 하네스가 무엇을 검사할지 이 모듈이 단정할 수 없어요.",
                {"lastType": (last or {}).get("type") if isinstance(last, dict) else None},
            )
        if len(content) > 1:
            raise UnsafeSubmission(
                "여러 블록으로 나눠 보내지 마세요 — 하네스는 **마지막** 텍스트 블록만 봐요. 앞 블록의 헤더는 보호가 아니에요.",
                {"blocks": len(content)},
            )
        return assert_safe(last["text"])
    raise UnsafeSubmission("알 수 없는 content 형태예요.", {"type": type(content).__name__})


def is_processed(result):
    """봉투가 아니라 **처리 증거**. 디스패치된 입력도, 훅이 막은 입력도 «성공 + 턴 0» 이에요."""
    if not isinstance(result, dict):
        return False
    turns = result.get("num_turns", result.get("numTurns"))
    return isinstance(turns, int) and not isinstance(turns, bool) and turns >= 1


def assert_processed_before_advance(result):
    if not is_processed(result):
        turns = (result or {}).get("num_turns", (result or {}).get("numTurns")) if isinstance(result, dict) else None
        raise UnsafeSubmission(
            "모델 턴 0 — 제출이 처리되지 않았어요(명령으로 디스패치됐거나 거부됨). 커서를 전진시키면 이 메시지를 잃어요.",
            {"num_turns": turns},
        )
    return True


# 동치 검사용 진입점 — 검사기가 코퍼스를 stdin 으로 주고 결과 JSON 을 받아 Node 판과 대조해요.
if __name__ == "__main__":
    import sys

    # 표준 입출력을 **명시적으로** UTF-8 로. 이 창구는 콘솔 코드페이지를 따르는데(윈도우 기본 cp949),
    # 그러면 한글이 든 코퍼스가 조용히 깨져서 들어와요 — 동치 검사가 «두 구현에 서로 다른 입력» 을
    # 주면서 「같다」고 보고하게 돼요. 실제로 그 상태로 한 번 통과했고, 돌연변이가 그걸 잡았어요.
    # 호출부 환경변수에 기대지 않고 여기서 못박는 이유는, 이게 이 모듈이 공개한 창구이기 때문이에요.
    sys.stdin.reconfigure(encoding="utf-8")
    sys.stdout.reconfigure(encoding="utf-8")

    cases = json.load(sys.stdin)
    out = []
    for c in cases:
        rec = {"id": c.get("id")}
        try:
            r = build_submission(
                content=c.get("content"),
                origin=c.get("origin") or {},
                task=c.get("task"),
            )
            rec.update({k: r[k] for k in ("text", "open", "close", "nonced", "header", "mentions", "dropped")})
            rec["error"] = None
        except UnsafeSubmission as e:
            rec["error"] = str(e)
        rec["mentions_only"] = count_mentions(c.get("content") or "")
        rec["starts_with_sigil"] = starts_with_sigil(c.get("content") or "")
        out.append(rec)
    json.dump(out, sys.stdout, ensure_ascii=False)

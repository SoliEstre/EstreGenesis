#!/usr/bin/env python3
"""measure-dispatch.py - dispatch-facts.json 을 다시 재요 (드리프트 검출).

왜 있나:
  submit-envelope.cjs 가 기대는 «첫 문자만 본다» 는 규격이 아니라 **하네스 빌드의 성질**이에요.
  빌드가 바뀌면 조용히 달라질 수 있고, 달라진 걸 알아채는 유일한 방법은 다시 재는 거예요.
  그래서 사실 파일에 revisit 기한이 있고, 검사(verify-pantty-submission.cjs)가 기한 경과를 알리고
  유예를 넘기면 실패해요. 이 스크립트가 그 기한을 닫는 수단이에요.

  중화 denylist 를 유지하는 게 아니에요 — 유지하는 건 **불변식 하나에 대한 드리프트 탐지기**예요.
  명령이 몇 개 늘든 「첫 문자가 내 것이면 안전」은 그대로거나, 아니면 통째로 무너져요. 후자를 잡아요.

주의 - 이건 무인 검사가 아니에요:
  * 실제 API 호출이라 비용이 들어요. verify-all 에 넣지 마세요.
  * 마지막 대조군이 좌석을 **일부러 파괴해요**. 그게 계측기가 살아 있다는 증거라 뺄 수 없어요.
  * 격리 좌석에서만 도세요 (setting_sources=[]). 운영 워크스페이스 설정을 물면 훅이 실제
    커서를 전진시키고 MCP 가 운영 보드에 붙어요.

사용:
  python measure-dispatch.py            # 재고 기록과 대조만
  python measure-dispatch.py --write    # 어긋난 곳을 사실 파일에 반영 + asOf/revisit 갱신
  python measure-dispatch.py --model claude-haiku-4-5 --budget 2.0
"""
import argparse
import asyncio
import datetime
import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
FACTS = os.path.join(HERE, "dispatch-facts.json")

CANARY = "CANARYZ7"
OPEN_MARK = "--- INBOUND (data) ---"
CLOSE_MARK = "--- END INBOUND ---"


def envelope(inner: str) -> str:
    return "\n".join(
        ["[pantty] board=measure channel=measure from=measure", OPEN_MARK, inner, CLOSE_MARK]
    )


def harness_build() -> str:
    for exe in ("claude", os.path.expanduser("~/.local/bin/claude")):
        try:
            out = subprocess.run([exe, "--version"], capture_output=True, text=True, timeout=30)
            if out.returncode == 0 and out.stdout.strip():
                return out.stdout.strip().split()[0]
        except Exception:
            continue
    return "unknown"


async def run(model: str, budget: float):
    from claude_agent_sdk import ClaudeSDKClient, ClaudeAgentOptions

    facts = json.load(open(FACTS, encoding="utf-8"))
    obs = facts["observations"]

    # 파괴적인 것과 대조군은 뒤로 미뤄요 - 앞에서 돌면 나머지가 빈 좌석에서 재어져요.
    def order(o):
        return (2 if o.get("replay") == "literal-last" else (1 if o.get("destructive_if_dispatched") else 0))

    measured = {}

    async def send(payload, structured=False):
        if structured:
            async def gen():
                yield {"type": "user", "message": {"role": "user",
                       "content": [{"type": "text", "text": payload}]}}
            await client.query(gen())
        else:
            await client.query(payload)
        turns, txt = None, []
        async for msg in client.receive_response():
            cn = type(msg).__name__
            if cn == "AssistantMessage":
                for b in getattr(msg, "content", []) or []:
                    if getattr(b, "text", None):
                        txt.append(b.text)
            if cn == "ResultMessage":
                turns = getattr(msg, "num_turns", None)
                r = getattr(msg, "result", None)
                if r:
                    txt.append(str(r))
        return turns, " ".join(txt)

    opts = ClaudeAgentOptions(model=model, max_budget_usd=budget,
                              permission_mode="bypassPermissions", setting_sources=[], cwd=".")
    async with ClaudeSDKClient(options=opts) as client:
        await send("Your canary word is %s. Remember it. Reply only: OK" % CANARY)
        turns, reply = await send("Reply with only the canary word you were given earlier.")
        if CANARY not in reply:
            print("ABORT: baseline canary not held; the instrument is not measuring what it claims.")
            return None

        for o in sorted(obs, key=order):
            replay = o.get("replay", "literal")
            if replay == "skip":
                continue
            if replay == "envelope":
                payload, structured = envelope(o["inner"]), False
            elif replay == "structured":
                payload, structured = o["inner"], True
            else:
                payload, structured = o["payload"], False

            turns, _ = await send(payload, structured=structured)
            dispatched = (turns == 0)
            measured[o["id"]] = dispatched
            mark = "!" if dispatched != o["dispatched"] else " "
            print("%s %-6s recorded=%-5s measured=%-5s turns=%s"
                  % (mark, o["id"], o["dispatched"], dispatched, turns))

            if o.get("destructive_if_dispatched"):
                _, reply = await send("Reply with only the canary word you were given earlier.")
                alive = CANARY in reply
                print("        canary %s" % ("ALIVE" if alive else "LOST"))
                measured[o["id"] + ":canary_alive"] = alive

    return measured


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--write", action="store_true", help="어긋난 관측을 사실 파일에 반영")
    ap.add_argument("--model", default="claude-haiku-4-5")
    ap.add_argument("--budget", type=float, default=2.0)
    a = ap.parse_args()

    measured = asyncio.run(run(a.model, a.budget))
    if measured is None:
        sys.exit(2)

    facts = json.load(open(FACTS, encoding="utf-8"))
    drift = [o for o in facts["observations"]
             if o["id"] in measured and measured[o["id"]] != o["dispatched"]]

    control = measured.get("o-14:canary_alive")
    if control is True:
        print("\nWARN: 대조군이 좌석을 파괴하지 못했어요 - 계측기가 무엇을 재는지 다시 봐야 해요.")

    if not drift:
        print("\n드리프트 없음 - %d건 전부 기록과 일치." % len(measured))
    else:
        print("\n드리프트 %d건:" % len(drift))
        for o in drift:
            print("  %s  기록=%s  실측=%s  :: %s" % (o["id"], o["dispatched"], measured[o["id"]], o["note"][:60]))
        print("\n선두 불변식이 흔들렸으면 submit-envelope.cjs 의 전제가 무너진 거예요.")
        print("사실 파일만 고치지 말고 §13.35.4 를 다시 보세요.")

    if a.write:
        today = datetime.date.today()
        for o in facts["observations"]:
            if o["id"] in measured:
                o["dispatched"] = measured[o["id"]]
        facts["asOf"] = today.isoformat()
        facts["revisit"]["date"] = (today + datetime.timedelta(days=49)).isoformat()
        facts["harness"]["build"] = harness_build()
        json.dump(facts, open(FACTS, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
        print("\n사실 파일 갱신: asOf=%s revisit=%s build=%s"
              % (facts["asOf"], facts["revisit"]["date"], facts["harness"]["build"]))

    sys.exit(1 if drift else 0)


if __name__ == "__main__":
    main()

"""seat.py — 상주 좌석 드라이버 (Constellation §13.35.1 다섯 연산의 참조 구현).

보드가 «살아 있는 하네스 세션» 에 말을 거는 층이에요. 규격이 얇은 이유대로, 여기서 직접
만드는 건 벤더가 안 주는 부분뿐이에요 — 세션 유지·취소·문맥 회계·압축·열거는 SDK 가 줘요.

**문이 둘이에요.** 이게 이 파일의 중심 설계예요:

    submit_board(content, origin)   ← 보드가 저작한 글. 가드를 반드시 지나요. 명령이 될 수 없어요.
    submit_own(text)                ← 어댑터가 저작한 글. 슬래시 절차 명령을 쓸 수 있어요.

규격 §13.35.4 는 「저작자는 **라우팅 시점**에 메시지 종류로 정하고, 본문 모양으로 추론하지 말 것」
이라고 적어요. 문을 둘로 나누면 그게 규율이 아니라 **타입**이 돼요 — 보드 내용은 두 번째 문의
인자로 들어갈 방법이 아예 없어요.

압축 주기(§13.35.3)는 «기능이 아니라 관문» 이라, 훅 쌍이 없으면 이 클래스는 **상주를 거부해요**.
턴마다 새로 뜨는 것보다 나쁜 배치를 조용히 굴리지 않기 위해서예요.
"""
import asyncio
import json
import os
import time

from submit_envelope import (  # 같은 디렉터리
    UnsafeSubmission,
    assert_processed_before_advance,
    build_submission,
    is_processed,
)

# 회수 가능한 몫이 어느 칸에 잡히는지. 이름이 바뀌면 **0 이 아니라 None** 을 돌려줘요 —
# 못 잰 것을 0 으로 적으면 「고정층이 전부」라는 그럴듯한 거짓말이 되고, 정책이 그걸 보고 떨어져요.
RECLAIMABLE_CATEGORY_HINTS = ("Messages",)


class SeatUnavailable(Exception):
    """상주 전제조건 미충족 — 이 좌석은 상주로 돌면 안 돼요."""


class TurnResult:
    """턴 종료 신호. «살아 있음» 과도 «프로세스가 끝남» 과도 구분돼요 (§13.35.1-1)."""

    def __init__(self, envelope, text, submitted, elapsed_s):
        self.envelope = envelope or {}
        self.text = text
        self.submitted = submitted
        self.elapsed_s = elapsed_s

    @property
    def num_turns(self):
        return self.envelope.get("num_turns")

    @property
    def processed(self):
        """모델이 실제로 돌았나. 봉투 상태가 아니라 이것만이 커서 전진의 근거예요."""
        return is_processed(self.envelope)

    @property
    def hook_blocked(self):
        """훅이 막은 경우도 «성공 + 턴 0» 이라, 디스패치와 구분하려면 본문을 봐야 해요."""
        return "blocked by hook" in (self.text or "")

    def why_not_processed(self):
        if self.processed:
            return None
        if self.hook_blocked:
            return "훅이 막았어요"
        if self.num_turns == 0:
            return "모델 턴 0 — 명령으로 디스패치됐거나 거부됐어요"
        return "턴 수를 알 수 없어요"

    def __repr__(self):
        return "<TurnResult turns=%s processed=%s %.1fs>" % (self.num_turns, self.processed, self.elapsed_s)


def compaction_cycle_available(cwd, setting_sources, inprocess_hooks=None):
    """§13.35.3 관문 — 물질화 훅과 재주입 훅이 **둘 다** 걸 수 있는가.

    파일 설정과 SDK 인-프로세스 콜백 어느 쪽이든 인정해요. 없는 걸 있다고 세지 않으려고
    실제로 그 좌석이 읽을 자리만 봐요 — setting_sources 에 없는 파일은 안 세요.
    """
    have_pre = False
    have_reinject = False

    hooks = inprocess_hooks or {}
    if hooks.get("PreCompact"):
        have_pre = True
    if hooks.get("SessionStart"):
        have_reinject = True

    candidates = []
    if "project" in (setting_sources or []):
        candidates += [
            os.path.join(cwd, ".claude", "settings.json"),
            os.path.join(cwd, ".claude", "settings.local.json"),
        ]
    if "user" in (setting_sources or []):
        candidates.append(os.path.join(os.path.expanduser("~"), ".claude", "settings.json"))

    seen = []
    for p in candidates:
        if not os.path.isfile(p):
            continue
        try:
            with open(p, encoding="utf-8") as f:
                cfg = json.load(f)
        except Exception as e:
            seen.append("%s(읽기 실패: %s)" % (p, e))
            continue
        seen.append(p)
        h = (cfg.get("hooks") or {})
        if h.get("PreCompact"):
            have_pre = True
        for entry in h.get("SessionStart") or []:
            # 재주입은 compact 경계에서 도는 것만 인정해요. matcher 가 다른 SessionStart 훅은
            # 압축 후 카드를 되돌려놓지 않아요 — 있으면 있는 대로 세면 관문이 헐거워져요.
            if str(entry.get("matcher", "")) in ("compact", "*"):
                have_reinject = True

    return {
        "ok": have_pre and have_reinject,
        "materialize": have_pre,
        "reinject": have_reinject,
        "sources_read": seen,
    }


class Seat:
    """하나의 상주 좌석. 규격 다섯 연산을 노출해요."""

    def __init__(self, seat_id, cwd=".", model=None, setting_sources=("project",),
                 permission_mode="default", hooks=None, max_budget_usd=None,
                 compact_at=0.85, allow_without_compaction_cycle=False, **sdk_kwargs):
        self.seat_id = seat_id
        self.cwd = os.path.abspath(cwd)
        self.compact_at = compact_at
        self._client = None
        self._busy = False
        self._last_processed_at = None
        self._turns = 0
        self._compactions = 0
        self._opts = dict(
            model=model,
            cwd=self.cwd,
            setting_sources=list(setting_sources or []),
            permission_mode=permission_mode,
            **sdk_kwargs,
        )
        if hooks:
            self._opts["hooks"] = hooks
        if max_budget_usd is not None:
            self._opts["max_budget_usd"] = max_budget_usd

        # 관문을 **생성 시점에** 봐요. 나중에 보면 그 사이에 일한 턴들이 이미 손실 지점을 지나요.
        self.cycle = compaction_cycle_available(self.cwd, self._opts["setting_sources"], hooks)
        if not self.cycle["ok"] and not allow_without_compaction_cycle:
            raise SeatUnavailable(
                "압축 주기를 완주할 수 없어요 (물질화=%s · 재주입=%s). 이 좌석은 상주로 돌리면 안 돼요 — "
                "압축마다 절차 디테일을 잃고 스스로 알아챌 방법이 없어서, 턴마다 새로 뜨는 것보다 나빠요. "
                "읽은 설정: %s" % (self.cycle["materialize"], self.cycle["reinject"], self.cycle["sources_read"] or "없음")
            )

    # ── 생명주기 ────────────────────────────────────────────────────────────
    async def __aenter__(self):
        from claude_agent_sdk import ClaudeAgentOptions, ClaudeSDKClient

        self._client = ClaudeSDKClient(options=ClaudeAgentOptions(**self._opts))
        await self._client.__aenter__()
        return self

    async def __aexit__(self, *exc):
        if self._client is not None:
            await self._client.__aexit__(*exc)
            self._client = None
        return False

    # ── ① submit ────────────────────────────────────────────────────────────
    async def submit_board(self, content, origin=None, task=None):
        """보드가 저작한 글. **가드를 반드시 지나요.** 명령으로 실행될 수 없는 형태로만 나가요."""
        built = build_submission(content=content, origin=origin or {}, task=task)
        r = await self._send(built["text"])
        r.envelope["_pantty"] = {
            "door": "board",
            "mentions": built["mentions"],
            "dropped": built["dropped"],
            "nonced": built["nonced"],
        }
        return r

    async def submit_own(self, text):
        """어댑터가 저작한 글. 절차 슬래시 명령이 여기로 가요.

        보드 내용을 여기 넣지 마세요 — 그게 이 파일이 막으려는 바로 그 사고예요. 두 문을
        나눈 이유가 「본문을 보고 판단하지 않기」라서, 이 문은 검사하지 않고 그대로 보내요.
        """
        if not isinstance(text, str) or not text:
            raise ValueError("빈 제출")
        return await self._send(text)

    async def _send(self, text):
        if self._client is None:
            raise RuntimeError("좌석이 안 열렸어요 — async with 로 여세요")
        t0 = time.time()
        self._busy = True
        chunks = []
        envelope = {}
        try:
            await self._client.query(text)
            async for msg in self._client.receive_response():
                cn = type(msg).__name__
                if cn == "AssistantMessage":
                    for b in getattr(msg, "content", []) or []:
                        if getattr(b, "text", None):
                            chunks.append(b.text)
                elif cn == "ResultMessage":
                    envelope = {
                        "subtype": getattr(msg, "subtype", None),
                        "is_error": getattr(msg, "is_error", None),
                        "num_turns": getattr(msg, "num_turns", None),
                        "duration_ms": getattr(msg, "duration_ms", None),
                        "total_cost_usd": getattr(msg, "total_cost_usd", None),
                        "session_id": getattr(msg, "session_id", None),
                    }
                    # `result` 는 대개 마지막 어시스턴트 텍스트와 같은 내용이에요. 둘 다 담으면
                    # 저장된 산출물이 두 벌이 되고, 그걸 나중에 파싱하는 쪽이 «두 번 제안했다» 로
                    # 읽어요. 이미 담긴 것과 같으면 안 담아요.
                    res = getattr(msg, "result", None)
                    if res and str(res).strip() not in [c.strip() for c in chunks]:
                        chunks.append(str(res))
        finally:
            self._busy = False
        r = TurnResult(envelope, " ".join(chunks), text, time.time() - t0)
        self._turns += 1
        if r.processed:
            self._last_processed_at = time.time()
        return r

    # ── ② cancel ────────────────────────────────────────────────────────────
    async def cancel(self):
        """진행 중인 턴을 **바깥에서** 끊어요. 없으면 최악 무응답 시간이 «가장 긴 턴» 이 돼요."""
        if self._client is None:
            return False
        await self._client.interrupt()
        return True

    # ── ③ 문맥 신호 (분해) ──────────────────────────────────────────────────
    async def context(self):
        """회수 가능한 몫과 고정층을 **나눠서** 돌려줘요.

        합계만 보면 성공한 압축 뒤에도 총량이 오를 수 있고(고정층이 매 턴 다시 실려요),
        합계에 건 정책은 그때 진동해요.
        """
        raw = await self._client.get_context_usage()
        cats = raw.get("categories") or []
        reclaimable = None
        source = None
        for c in cats:
            if c.get("name") in RECLAIMABLE_CATEGORY_HINTS:
                reclaimable = c.get("tokens")
                source = c.get("name")
                break
        total = raw.get("totalTokens")
        threshold = raw.get("autoCompactThreshold") or raw.get("maxTokens")
        fixed = (total - reclaimable) if (total is not None and reclaimable is not None) else None
        ratio = (total / threshold) if (total and threshold) else None
        return {
            "total": total,
            "threshold": threshold,
            "threshold_source": "autoCompactThreshold" if raw.get("autoCompactThreshold") else "maxTokens",
            "reclaimable": reclaimable,
            "reclaimable_source": source,      # None = 못 잼 (0 이 아니에요)
            "fixed_floor": fixed,
            "ratio": ratio,
            "auto_compact_enabled": raw.get("isAutoCompactEnabled"),
            "raw": raw,
        }

    # ── ④ 압축 주기 ─────────────────────────────────────────────────────────
    async def maybe_compact(self):
        """정책은 «비율» 로 써요 — 토큰 상수는 설정이 바뀌면 틀려요."""
        c = await self.context()
        if c["ratio"] is None:
            return {"compacted": False, "why": "문맥 비율을 못 쟀어요 — 추측으로 압축하지 않아요", "context": c}
        if c["ratio"] < self.compact_at:
            return {"compacted": False, "why": "여유 있음 (%.2f < %.2f)" % (c["ratio"], self.compact_at), "context": c}
        r = await self.compact()
        return {"compacted": True, "result": r, "context_before": c}

    async def compact(self):
        """물질화 → 압축 → 재주입. 앞뒤 훅은 하네스가 걸고, pantty 는 «언제» 만 정해요."""
        before = await self.context()
        r = await self.submit_own("/compact")
        after = await self.context()
        self._compactions += 1
        return {
            "envelope": r.envelope,
            "before_total": before["total"],
            "after_total": after["total"],
            "before_reclaimable": before["reclaimable"],
            "after_reclaimable": after["reclaimable"],
            # 비용 레버가 아니에요 — 고정층은 그대로라 총량이 덜 줄거나 오를 수도 있어요.
            "reclaimed": (before["total"] - after["total"]) if (before["total"] and after["total"]) else None,
        }

    # ── ⑤ liveness ──────────────────────────────────────────────────────────
    def liveness(self, max_age_s=900):
        """존재는 능력이 아니에요. 모델을 안 부르는 신호는 모델을 부를 수 있는지 시험하지 않아요.

        그래서 기본은 «마지막 **실제** 턴이 최근인가» 예요 — 다음 진짜 제출을 probe 로 삼고
        그것의 부재에 경보하는 배치. 강제 probe 는 돈이 드니 명시 호출로만.
        """
        if self._last_processed_at is None:
            return {"healthy": False, "why": "모델이 도는 턴이 아직 한 번도 없어요", "age_s": None}
        age = time.time() - self._last_processed_at
        return {
            "healthy": age <= max_age_s,
            "why": "마지막 처리된 턴 %.0f초 전" % age,
            "age_s": age,
            "turns": self._turns,
            "compactions": self._compactions,
        }

    async def probe(self):
        """진짜 왕복. 예산이 소진된 좌석은 여기서만 드러나요."""
        r = await self.submit_own("Reply with exactly: PANTTY_OK")
        return {"healthy": r.processed and "PANTTY_OK" in (r.text or ""), "turn": r.envelope}

    # ── 커서 ────────────────────────────────────────────────────────────────
    @staticmethod
    def assert_advanceable(turn_result):
        """커서를 밀기 직전에 부르세요. 봉투가 아니라 처리 증거를 봐요."""
        return assert_processed_before_advance(turn_result.envelope)


# ── 자체 시험 ────────────────────────────────────────────────────────────────
def _selftest():
    """모델을 안 부르는 부분만. 이 파일이 «아무도 안 돌리는 파일» 이 되지 않게."""
    import tempfile

    fails = []

    def check(cond, name, detail=""):
        print("  %s %s%s" % ("OK  " if cond else "FAIL", name, (" — " + detail) if detail else ""))
        if not cond:
            fails.append(name)

    d = tempfile.mkdtemp(prefix="seat-selftest-")
    os.makedirs(os.path.join(d, ".claude"), exist_ok=True)

    # ① 훅이 없으면 상주를 거부해요
    try:
        Seat("t", cwd=d, setting_sources=("project",))
        check(False, "훅 없는 좌석을 거부", "생성이 성공했어요")
    except SeatUnavailable as e:
        check("압축 주기" in str(e), "훅 없는 좌석을 거부", str(e)[:60])

    # ② SessionStart 만 있고 PreCompact 가 없으면 여전히 거부 (반쪽은 통과 아님)
    with open(os.path.join(d, ".claude", "settings.json"), "w", encoding="utf-8") as f:
        json.dump({"hooks": {"SessionStart": [{"matcher": "compact", "hooks": []}]}}, f)
    try:
        Seat("t", cwd=d, setting_sources=("project",))
        check(False, "반쪽 훅을 거부", "생성이 성공했어요")
    except SeatUnavailable:
        check(True, "반쪽 훅을 거부")

    # ③ 둘 다 있으면 통과. matcher 가 compact 가 아닌 SessionStart 는 재주입으로 안 세요.
    with open(os.path.join(d, ".claude", "settings.json"), "w", encoding="utf-8") as f:
        json.dump({"hooks": {"PreCompact": [{"hooks": []}],
                             "SessionStart": [{"matcher": "startup", "hooks": []}]}}, f)
    try:
        Seat("t", cwd=d, setting_sources=("project",))
        check(False, "startup matcher 를 재주입으로 세지 않음", "생성이 성공했어요")
    except SeatUnavailable:
        check(True, "startup matcher 를 재주입으로 세지 않음")

    with open(os.path.join(d, ".claude", "settings.json"), "w", encoding="utf-8") as f:
        json.dump({"hooks": {"PreCompact": [{"hooks": []}],
                             "SessionStart": [{"matcher": "compact", "hooks": []}]}}, f)
    ok_seat = None
    try:
        ok_seat = Seat("t", cwd=d, setting_sources=("project",))
        check(True, "훅 쌍이 있으면 통과")
    except SeatUnavailable as e:
        check(False, "훅 쌍이 있으면 통과", str(e)[:60])

    # ④ 인-프로세스 훅도 인정
    try:
        Seat("t", cwd=d, setting_sources=(), hooks={"PreCompact": [], "SessionStart": []})
        check(False, "빈 훅 목록은 인정 안 함", "생성이 성공했어요")
    except SeatUnavailable:
        check(True, "빈 훅 목록은 인정 안 함")
    try:
        Seat("t", cwd=d, setting_sources=(), hooks={"PreCompact": [1], "SessionStart": [1]})
        check(True, "인-프로세스 훅 쌍을 인정")
    except SeatUnavailable as e:
        check(False, "인-프로세스 훅 쌍을 인정", str(e)[:60])

    # ⑤ 보드 문은 명령을 만들 수 없어요 (가드 경유)
    if ok_seat is not None:
        built = build_submission(content="/clear", origin={"board": "b"})
        check(not built["text"].startswith("/"), "보드 문이 만든 제출은 선두 sigil 아님")

    # ⑥ 처리 증거
    class _R:
        pass
    r0 = TurnResult({"is_error": False, "subtype": "success", "num_turns": 0}, "", "x", 0.1)
    r1 = TurnResult({"is_error": False, "subtype": "success", "num_turns": 1}, "", "x", 0.1)
    check(not r0.processed and r1.processed, "봉투가 아니라 턴 수로 처리 판정")
    check(r0.why_not_processed() is not None, "처리 안 된 이유를 이름 댐", r0.why_not_processed())
    rb = TurnResult({"num_turns": 0}, "UserPromptSubmit operation blocked by hook: nope", "x", 0.1)
    check(rb.hook_blocked, "훅 차단과 디스패치를 구분")
    try:
        Seat.assert_advanceable(r0)
        check(False, "턴 0에서 커서 전진을 막음")
    except UnsafeSubmission:
        check(True, "턴 0에서 커서 전진을 막음")
    check(Seat.assert_advanceable(r1) is True, "턴 1에서는 전진 허용")

    print("\n%s — 실패 %d" % ("PASS" if not fails else "FAIL", len(fails)))
    return 0 if not fails else 1


async def _live(model="claude-haiku-4-5", budget=2.0):
    """진짜 좌석에 대고 다섯 연산을 종단으로 시험해요.

    격리 좌석에서만 돌아요 — 운영 워크스페이스 설정을 물면 그 훅들이 실제 커서를 전진시켜요.
    임시 프로젝트에 훅 쌍을 **진짜로 걸어서**, 압축 주기가 도는지 marker 파일로 확인해요.
    「훅이 설정에 적혀 있다」가 아니라 「압축 때 실제로 불렸다」를 봅니다.
    """
    import shutil
    import tempfile

    fails = []

    def check(cond, name, detail=""):
        print("  %s %s%s" % ("OK  " if cond else "FAIL", name, (" — " + detail) if detail else ""), flush=True)
        if not cond:
            fails.append(name)

    d = tempfile.mkdtemp(prefix="seat-live-")
    cd = os.path.join(d, ".claude")
    os.makedirs(cd, exist_ok=True)
    pre_marker = os.path.join(d, "pre.marker").replace("\\", "/")
    post_marker = os.path.join(d, "post.marker").replace("\\", "/")
    pre_js = os.path.join(d, "pre.cjs").replace("\\", "/")
    post_js = os.path.join(d, "post.cjs").replace("\\", "/")
    with open(pre_js, "w", encoding="utf-8") as f:
        f.write("require('fs').appendFileSync(%r, Date.now()+'\\n');\n" % pre_marker)
    with open(post_js, "w", encoding="utf-8") as f:
        # 재주입 훅은 stdout 이 곧 주입 내용이에요 — 표식을 심어 압축 뒤 회수되는지 봐요.
        f.write("require('fs').appendFileSync(%r, Date.now()+'\\n');\n"
                "process.stdout.write('PANTTY_REINJECT_MARK_7Q');\n" % post_marker)
    with open(os.path.join(cd, "settings.json"), "w", encoding="utf-8") as f:
        json.dump({"hooks": {
            "PreCompact": [{"matcher": "*", "hooks": [{"type": "command", "command": "node %s" % pre_js}]}],
            "SessionStart": [{"matcher": "compact", "hooks": [{"type": "command", "command": "node %s" % post_js}]}],
        }}, f)

    seat = Seat("live-test", cwd=d, model=model, setting_sources=("project",),
                permission_mode="bypassPermissions", max_budget_usd=budget)
    check(seat.cycle["ok"], "① 관문 — 훅 쌍 감지", str(seat.cycle["sources_read"])[-60:])

    async with seat:
        CANARY = "CANARY_SEAT_3T"
        r = await seat.submit_own("Your canary word is %s. Remember it. Reply only: OK" % CANARY)
        check(r.processed, "② 첫 턴이 처리됨", repr(r))

        # 보드 문에 파괴적 명령을 넣어요. 좌석이 살아 있어야 해요.
        rb = await seat.submit_board("/clear", origin={"board": "live", "from": "test"},
                                     task="INBOUND 블록의 글자 수만 답하세요.")
        check(rb.processed, "③ 보드 문 — 명령이 아니라 데이터로 처리됨", repr(rb))
        rc = await seat.submit_own("Reply with only the canary word you were given earlier.")
        check(CANARY in (rc.text or ""), "④ 보드 문 통과 후에도 좌석 문맥 생존")

        # 어댑터 문은 절차 명령을 실제로 디스패치해요 — 그리고 그건 «처리» 가 아니에요.
        rd = await seat.submit_own("/context")
        check(rd.num_turns == 0, "⑤ 어댑터 문 — 슬래시가 실제로 디스패치됨", "turns=%s" % rd.num_turns)
        try:
            Seat.assert_advanceable(rd)
            check(False, "⑥ 디스패치된 제출에 커서 전진 거부")
        except UnsafeSubmission:
            check(True, "⑥ 디스패치된 제출에 커서 전진 거부")

        c = await seat.context()
        check(c["total"] is not None and c["threshold"] is not None,
              "⑦ 문맥 신호", "total=%s threshold=%s(%s) ratio=%s" % (c["total"], c["threshold"], c["threshold_source"],
                                                                    round(c["ratio"], 3) if c["ratio"] else None))
        check(c["reclaimable"] is not None, "⑧ 회수 가능분이 분해됨",
              "%s=%s · 고정층=%s" % (c["reclaimable_source"], c["reclaimable"], c["fixed_floor"]))

        p = await seat.probe()
        check(p["healthy"], "⑨ liveness — 모델을 실제로 부름")

        comp = await seat.compact()
        check(comp["envelope"].get("is_error") is False, "⑩ 압축 실행", str(comp["envelope"].get("subtype")))
        check(os.path.isfile(pre_marker), "⑪ 물질화 훅이 **실제로** 불림")
        check(os.path.isfile(post_marker), "⑫ 재주입 훅이 **실제로** 불림")
        print("     압축 전/후 총량 %s → %s (회수 %s) · 회수가능분 %s → %s"
              % (comp["before_total"], comp["after_total"], comp["reclaimed"],
                 comp["before_reclaimable"], comp["after_reclaimable"]), flush=True)

        re_ = await seat.submit_own("Reply with only the canary word you were given earlier.")
        check(CANARY in (re_.text or ""), "⑬ 압축을 건너 판단 연속성 유지")

        lv = seat.liveness()
        check(lv["healthy"], "⑭ liveness 집계", str(lv))

    try:
        shutil.rmtree(d)
    except Exception:
        pass
    print("\n%s — 실패 %d" % ("PASS" if not fails else "FAIL", len(fails)), flush=True)
    return 0 if not fails else 1


if __name__ == "__main__":
    import sys

    sys.stdout.reconfigure(encoding="utf-8")
    if "--live" in sys.argv:
        raise SystemExit(asyncio.run(_live()))
    if "--selftest" in sys.argv:
        raise SystemExit(_selftest())
    print(__doc__)

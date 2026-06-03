# Hyperbrief 재-sync dogfooding — H7 + 흡수 확인 (2026-06-03)

> 001 채택 직후 EG 가 bundle 007·008 findings 를 v2.5.26~v2.5.37 (약 1시간, 12 릴리스)에 흡수.
> 사이드카가 EG v2.5.37 로 재동기화하며 흡수 검증 + 신규 발견 1건(H7). clean-install(ajv 8.x) 환경.

## 1. 흡수 확인 (positive — turnaround ~1h)

| dogfood finding | 흡수 릴리스 | 확인 |
| --- | --- | --- |
| **H1** ajv draft-07↔2020-12 blocker | v2.5.32 emergency-fix | EG renderers/mini-engine.cjs:46 = `require("ajv/dist/2020")` — 내 벤더 패치와 동일. **사이드카 패치 제거, 순수 미러 복귀.** |
| **H2** BlockedStub→FullBrief 템플릿 | v2.5.34 | 신규 `brief-stub.{md,html}.template` + `selectTemplate(status)`. BlockedStub 재렌더 = 컴팩트 "🤖 AUTONOMOUS_DECIDE" 카드 ✓ |
| **H3** `--self-contained` no-op | v2.5.34 | --help clarity |
| **H5** essence 태그 제목 노출 | v2.5.34 | `stripHeadingEpistemicTag` 추가 — 제목 `[verified]` 제거 확인 ✓ (단, H7 유발) |
| **H6** plugin README/manifest 버전 drift | v2.5.34 | plugin.json v0.5.2, manifest catch-up |
| **M4** Hyperbrief↔Constellation §13.17/18 경계 | v2.5.34 | Hyperbrief.md 신규 §8.5 |
| **F1~F7 + M2** (Constellation) | v2.5.33 | server.cjs /BREW.md, §8.2 /api/state 등 |
| **M1** seed↔release 2트랙 혼동 | v2.5.35 | **시드 v2.4.1→v2.4.2** Migration B dual-track 가이드 (6 tier cascade) |
| PreToolUse 훅 (로드맵 drift 후속) | v2.5.37 | 훅 advise-mode 활성 (아래) |

저자(=EG owner) 직접 운영이라 dogfood→fix 회전이 비정상적으로 빠름. 어댑터 입장에선 "리포트가 1시간 내 SSoT 에 반영" — 매우 강한 positive 신호. 단, **빠른 회전이 vendored 미러의 재-sync 빈도를 높임** (아래 운영 관찰).

## 2. 신규 발견 — H7 (★ blocker, H5 수정의 역설적 부작용)

v2.5.37 의 renderer 기본 경로(validation-on)가 **FullBrief 를 거부**한다.

- `mini-engine.cjs` `renderMd`(line 332~337) / `renderHtml`(line 376~381) 가 **`stripHeadingEpistemicTag(ir)` → `validateIr(ir)` 순서**.
- `stripHeadingEpistemicTag`(v0.5.2 H5)는 `§6.essence_one_line` 의 `[verified|inferred|assumed|unknown]` 태그를 **IR 객체에서 제거** → 그 직후 `validateIr` 가 도는데, 스키마는 `essence_one_line` 을 `tagged_text`(태그 **required**)로 강제 → 패턴 위반 → throw.
- 증거: 동일 IR 을 독립 `ajv/dist/2020` 으로 검증 = `valid: true`, JS regex test = true. 오직 renderer 내부(strip 후 검증)만 실패. `--skip-validate` 로는 렌더 정상(MD 9948B / HTML 42KB).
- **즉 H5 수정(태그 제거)과 "essence 는 태그 required" 스키마가 strip-then-validate 순서에서 충돌.** H1 과 같은 "기본 validate 경로가 clean-install 에서 깨짐" 계열의 재발 (이번엔 H5 fix 가 원인).
- **근본 수정**: `stripHeadingEpistemicTag` 를 `validateIr` **이후**로 이동 (또는 surface 전용 clone 에만 적용 — IR 원본 불변 유지). BlockedStub 은 §6 부재로 영향 없음.
- **우선순위 P1** (FullBrief = 핵심 산출물, 기본 경로 차단).

## 3. 훅 채택 상태 (v2.5.37 PreToolUse + Stop, advise mode)

- 훅 = **plugin-tier** (Claude Code 전용), model-invoked = SSoT-tier host-agnostic (§11.4 계층 분리). **항상 exit 0, 차단 안 함** — §2.4 alert-fatigue 회피.
- 사이드카: `.hyperbrief/hooks/` 배치 + 안전테스트 통과 (AskUserQuestion→advise / 루틴 Bash→침묵 / 위험 Bash→advise / Stop→침묵, 전부 exit 0).
- **연결 게이트**: `.claude/settings.json` 에 훅을 거는 행위가 *에이전트 런타임 self-modification* 이라 자동모드 분류기가 차단 — 사용자 명시 승인 필요. 어댑터 관점 finding: **"훅 설치"는 일반 마이그레이션 지시로 자동 수행 불가, 명시 승인이 필요한 별도 게이트** (보안상 타당). EG 문서가 어댑터에게 이 게이트를 미리 안내하면 좋음 (예: "훅 연결은 호스트의 self-config 승인이 필요").
- 비-플러그인 배치라 `${CLAUDE_PLUGIN_ROOT}` 대신 `$CLAUDE_PROJECT_DIR` 로 연결 예정 (포터블).

## 4. 운영 관찰 — 미러 vs 패치 (M3 후속)

- 001 에서 H1 을 **벤더 패치**로 막았으나, EG 가 1시간 내 동일 수정 → 패치가 곧 redundant. 이번엔 학습 적용: **H7 은 벤더 패치 대신 순수 미러 유지 + `--skip-validate` workaround + 독립 검증**. 빠른-회전 업스트림에선 패치 누적보다 미러+workaround 가 sync 비용 낮음.
- 단 trade-off: workaround 는 "기본 경로가 깨진 채로 운영" → 어댑터가 매번 `--skip-validate` 를 기억해야 함. 패치 vs 미러는 **업스트림 fix 예상 시간** 에 따라 갈림 (저자 직영=미러, 외부 업스트림=패치가 나을 수 있음).

## 권고

- **[P1] H7** — strip→validate 순서 역전 (validate 먼저).
- **[P2] 훅 어댑터 가이드** — settings.json 연결이 host self-config 승인 게이트임을 README/§11.4 에 명시.

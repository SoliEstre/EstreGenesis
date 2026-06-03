# Hyperbrief Dogfood Ledger — EG canonical

> 📒 모듈 레벨 운영 ledger. `Hyperbrief.md §11.2` SSoT body 의 외부 분리본 (§10.2 SHOULD-8 정합).
>
> **Scope**: EG 본체에서 발생한 Hyperbrief decision 사이클의 시간순 인덱스 + 학습 요약. EstreUF / 기타 EG-seed fork 어댑터는 자기 ledger 를 별도 운영 (cross-seed adoption §11.3 정합 — adopter 별 `decision_id` namespace 분리).
>
> **갱신 cadence**: 매 dogfood entry 박제 (`.archive` 또는 `dogfood-entry-NN.md`) 시 본 파일에 한 row 추가. SSoT body 의 `§11.2 Recent entries` 표는 본 ledger 의 최근 3 row mirror.

---

## Ledger table

| Entry | Decision id | Date | Reversibility | Outcome | Brier delta | Archive |
|---|---|---|---|---|---|---|
| 01 | `hb-20260603-a1b2c3` | 2026-06-03 | `one_way_with_migration_path` 🟡 | accept (alt-B + 5 follow-up patches → v0.1.1) | _pending revisit 2026-09-01_ | [dogfood-entry-01.md](./dogfood-entry-01.md) |
| 02 | `hb-20260603-r2nd02` | 2026-06-03 | `one_way_with_migration_path` 🟡 | accept (alt-B mini-engine + ajv + CLI; MCP tool deferred to v0.4.1) → v0.4.0 | _pending revisit 2026-09-01_ | [dogfood-entry-02.md](./dogfood-entry-02.md) |
| 03 | `hb-20260603-hooke3` | 2026-06-03 | `two_way` 🟢 | accept (alt-(a) advise hook + Constellation/standalone review-queue routing extension) → v0.5.3 | _pending revisit 2026-09-01_ | [dogfood-entry-03.md](./dogfood-entry-03.md) |
| 04 | `hb-20260603-mktp04` | 2026-06-03 | `one_way_with_migration_path` 🟡 | defer Claude marketplace registration to v1.0 GA + codify §11.5 v1.0 readiness rubric (Lens A 7-dim + Lens B 6-dim) — both lenses currently sub-threshold (≈ 5/10) → v0.5.5 | _pending revisit 2026-09-01_ | [dogfood-entry-04.md](./dogfood-entry-04.md) |

---

## Per-entry meta-learnings summary

### Entry 01 — v0.1 → v0.1.1 5 patches accept (2026-06-03)

학습 요약 (전체: [dogfood-entry-01.md §5](./dogfood-entry-01.md)):

- §5.6 audience_profile 3축 × 5단계 — 사용자 R1 첫 브리핑 가독성 실패 → L2/L2/L2 기본값 도입
- §5.6.7 tone-floor fallback affordance — knob 모르는 사용자도 floor 도달 escape hatch
- §8 `recommended_artifacts[]` schema slot — 사용자 *"patch 본문이 어디 있어?"* 지적 → 권장안 artifact body 강제 슬롯화 (AF-20)
- §9 `archive_config` (옵션, default ON) — 결정 + 사용자 추가 prompt + 브리핑 원문 5-element 박제
- §10.3 Phase 1 transition rules — renderer 부재 구간 운영 규칙 (v0.4.0 ship 후 historical record 유지)
- §11.3 cross-seed adoption — EstreUF 등 EG-seed fork 어댑터 도입 규율

### Entry 02 — Phase 2 renderer accept · v0.1.1 → v0.4.0 (2026-06-03)

학습 요약 (전체: [dogfood-entry-02.md §5](./dogfood-entry-02.md)):

- v0.4.0 ship: `plugins/hyperbrief/renderers/` 4 파일 (mini-engine.cjs + types.d.ts + bin/render.cjs + package.json `ajv ^8.17.0` 단일 의존)
- 결정성 invariant smoke test PASS (MD/HTML 양형 run1==run2 byte 일치)
- §10.3 transition rules **유지** (deprecate 하지 않음, agent 판단) — historical record + 외부 adopter 점진 이주 + drift-log 의미 진화
- §5.6.7 trigger_phrases_md default 보강 6개 (`한국어로`, `한국말로`, `level 2 라고`, `L2 라고`, `이게 level`, `이게 L`) — 사용자 *"이게 level 2라고? 한국어로 부탁해"* 발화 → AF-22 자기 인정 → trigger 목록 culture-bound 확장
- 3 schema 갭 v0.5 후보: (a) declared vs effective `audience_profile` gap — `surface_profile_estimate` 자동 측정 (b) trigger_phrases_md telemetry 기반 자동 학습 (c) `recommended_artifacts[].body` 정형 코드 sub-schema (`language` + `line_count`)
- MCP tool 노출 v0.4.1 deferred (scope 통제 agent 판단)

---

## Pending revisit queue

| Entry | revisit_date | 측정 대상 |
|---|---|---|
| 01 | 2026-09-01 | outcome_actual + Brier delta + 5 patches 의 실 사용 빈도 + AF surface 횟수 |
| 02 | 2026-09-01 | renderer 사용 빈도 + warning 발생률 + 외부 adopter (EstreUF 등) 의존 |

`hyperbrief-revisit` skill 이 session-start / Stop / cron 시점에 본 큐를 scan.

---

## Cross-seed mirror (informational)

본 ledger 는 **EG 본체 canonical**. 다른 adopter (EstreUF 등) 의 ledger 는 각 adopter project 의 `_proposals/<bundle>/hyperbrief-ledger.md` 에 별도 존재. cross-cutting spec gap 발견 시 표준 `_proposals/` lifecycle 로 EG 로 미러링 (§11.3 정합).

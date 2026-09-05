<!-- spec: greatpractice/INDEX; layer: practice-codification/working-set-index; auto-gen: plugins/greatpractice/runtime/eg_build_index.cjs (v0.2+); token-cap: ≤300 (canonical §1.4 Summary Style); v0.1 status: manually curated placeholder -->

# Greatpractice Tree INDEX

> macro tier 의 always-on chunk summary 예요. ≤300 token cap 으로 본 spec 의 macro entry 들을 1 줄씩 요약. v0.1 은 manual curation, v0.2+ 에 `eg_build_index.cjs` 가 macro entry frontmatter 의 `title` + `binding` + `enforcement_level` 발췌해서 자동 생성해요.

## Macro Tier (1 entry on disk)

- `release-cadence` (v2.5.55 ratified, N=1 user steering) — Pre-publish 11-item checklist (9 hub-validated + 2 conditional) + N-way sync discipline. mezzo decomposition (8 candidates) shipped v2.5.61. enforcement_level: recommended.
- (corrected 2026-09-05) an earlier line here listed a `communication-discipline` macro with six mezzo children; no such files exist under `greatpractice/macro/` or `greatpractice/mezzo/` and none ever did — the index had drifted ahead of the tree. The A2A/bridge family currently has three mezzo entries and no macro parent (`outbox-json-validation`, `a2a-relay-echo-verify`, `adopter-report-intake`); a macro is a candidate once a fourth lands. Discovery is `ls greatpractice/*/`, not this list.

## Mezzo Tier (12 entries on disk)

- `outbox-json-validation` (v2.5.50 ratified, mandatory) — outbox.jsonl append 는 eg_outbox_push 경유 + roundtrip 검증.
- `a2a-relay-echo-verify` (v2.6.120 ratified, recommended) — outbox append 는 전송이 아니다: 다리의 `ev:'sent'` 에코를 msgId 로 확인하기 전엔 «보냈다» 라 말하지 않는다 (MISSING → 다리 재spawn + 재발신).
- `adopter-report-intake` (v2.6.120 ratified, recommended, phronesis_boundary) — 채택자 리포트는 ① HEAD 에서 기전 재현 ② 패치/규격 티어 분리 ③ 가드 먼저(빨강→초록) 다음 수정 ④ 컷 세부 + 뺀 것 + 회귀 하네스로 loop-close.
- `nested-repo-write-routing` (v2.6.28 ratified, recommended) — 겹치는 쓰기 대상이 있으면 명령이 대상을 이름으로 지목할 것(`git -C <abs>`). 잘못된 대상이 «유효» 하면 조심으로는 신호가 안 나오므로, 상대 규약 커밋 메시지를 거절하는 commit-msg 훅으로 신호를 만든다.
- release-cadence 계열 8종 (v2.5.61 batch ratified): `n-way-sync-registry` · `package-files-validate` · `bin-entry-validate` · `link-integrity-check` · `dry-run-smoke-test` · `pre-publish-user-gate` · `naming-hygiene-grep` · `auth-2fa-discipline`.

## Micro Tier (v0.3.1 — 20 atoms)

- mezzo 9건 전부 atom 분해 완료 — 각 2개 (n-way-sync-registry 만 3개). 전부 command-check-decision 3-tuple.
- 발견: `ls greatpractice/micro/` (파일명 = atom id). 정본: `micro/<id>.md`. mezzo→atom 매핑은 각 atom frontmatter `source_evidence` 가 보유.

## Retired (v0.3.0 retire 축, §7.7)

- Retired: 0 — retired entry 는 tier 섹션에서 제외, 카운트만 유지. 목록 발견: `grep -l "status: retired" greatpractice/*/`.

---


**SSoT**: 각 entry 의 정본은 `greatpractice/{tier}/<id>.md`. 본 INDEX 가 정의가 아니라 *발견 path* — 자세한 정의는 entry 본문 참조.

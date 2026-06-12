<!-- spec: greatpractice/INDEX; layer: practice-codification/working-set-index; auto-gen: plugins/greatpractice/runtime/eg_build_index.cjs (v0.2+); token-cap: ≤300 (canonical §1.4 Summary Style); v0.1 status: manually curated placeholder -->

# Greatpractice Tree INDEX

> macro tier 의 always-on chunk summary 예요. ≤300 token cap 으로 본 spec 의 macro entry 들을 1 줄씩 요약. v0.1 은 manual curation, v0.2+ 에 `eg_build_index.cjs` 가 macro entry frontmatter 의 `title` + `binding` + `enforcement_level` 발췌해서 자동 생성해요.

## Macro Tier (v0.1 — 2 entries)

- `communication-discipline` (v0.1.1+ shipped) — A2A · bridge · outbox · inbox cursor 계열의 macro parent. mezzo: outbox-json-validation, pre-send-inbound-check, n-way-sync-registry, session-resume-bridge-spawn, watcher-liveness, a2a-relay-reliability.
- `release-cadence` (v2.5.55 ratified, N=1 user steering) — Pre-publish 11-item checklist (9 hub-validated + 2 conditional) + N-way sync discipline. mezzo decomposition (8 candidates) scheduled v2.5.56+. enforcement_level: recommended.

## Mezzo Tier (v0.3.1 — 9 entries)

- `outbox-json-validation` (v2.5.50 ratified, mandatory) — outbox.jsonl append 는 eg_outbox_push 경유 + roundtrip 검증.
- release-cadence 계열 8종 (v2.5.61 batch ratified): `n-way-sync-registry` · `package-files-validate` · `bin-entry-validate` · `link-integrity-check` · `dry-run-smoke-test` · `pre-publish-user-gate` · `naming-hygiene-grep` · `auth-2fa-discipline`.

## Micro Tier (v0.3.1 — 20 atoms)

- mezzo 9건 전부 atom 분해 완료 — 각 2개 (n-way-sync-registry 만 3개). 전부 command-check-decision 3-tuple.
- 발견: `ls greatpractice/micro/` (파일명 = atom id). 정본: `micro/<id>.md`. mezzo→atom 매핑은 각 atom frontmatter `source_evidence` 가 보유.

## Retired (v0.3.0 retire 축, §7.7)

- Retired: 0 — retired entry 는 tier 섹션에서 제외, 카운트만 유지. 목록 발견: `grep -l "status: retired" greatpractice/*/`.

---


**SSoT**: 각 entry 의 정본은 `greatpractice/{tier}/<id>.md`. 본 INDEX 가 정의가 아니라 *발견 path* — 자세한 정의는 entry 본문 참조.

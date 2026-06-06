<!-- spec: greatpractice/INDEX; layer: practice-codification/working-set-index; auto-gen: plugins/greatpractice/runtime/eg_build_index.cjs (v0.2+); token-cap: ≤300 (canonical §1.4 Summary Style); v0.1 status: manually curated placeholder -->

# Greatpractice Tree INDEX

> macro tier 의 always-on chunk summary 예요. ≤300 token cap 으로 본 spec 의 macro entry 들을 1 줄씩 요약. v0.1 은 manual curation, v0.2+ 에 `eg_build_index.cjs` 가 macro entry frontmatter 의 `title` + `binding` + `enforcement_level` 발췌해서 자동 생성해요.

## Macro Tier (v0.1 — 2 entries)

- `communication-discipline` (v0.1.1+ shipped) — A2A · bridge · outbox · inbox cursor 계열의 macro parent. mezzo: outbox-json-validation, pre-send-inbound-check, n-way-sync-registry, session-resume-bridge-spawn, watcher-liveness, a2a-relay-reliability.
- `release-cadence` (v2.5.55 ratified, N=1 user steering) — Pre-publish 11-item checklist (9 hub-validated + 2 conditional) + N-way sync discipline. mezzo decomposition (8 candidates) scheduled v2.5.56+. enforcement_level: recommended.

## Mezzo Tier (v0.1 — 1 entry)

- `outbox-json-validation` (v2.5.50 ratified) — every outbox.jsonl append MUST be valid single-line JSON via scripts/eg_outbox_push.cjs + roundtrip parse + deep_equal check. enforcement_level: mandatory.

## Micro Tier (v0.1 — 1 atom)

- `outbox-append-json-roundtrip` (v2.5.50) — atom: (JSON.stringify input) → appendFileSync → readback parse → assert deep_equal(input, readback). exit 2 on mismatch.

---

**v0.1 cadence note**: 본 INDEX 는 v2.5.50 ship 시점의 1-mezzo + 1-micro minimal scope. v2.5.51-v2.5.55 에 macro 3 추가 (release-cadence, workspace-cleanliness, codification-boundary) + mezzo 6 추가 (pre-send-inbound-check, session-resume-bridge-spawn, a2a-priority, n-way-sync-registry, watcher-liveness, a2a-relay-reliability) + micro 7+ 추가 예정 (`Greatpractice.md §8.2` cadence 표).

**SSoT**: 각 entry 의 정본은 `greatpractice/{tier}/<id>.md`. 본 INDEX 가 정의가 아니라 *발견 path* — 자세한 정의는 entry 본문 참조.

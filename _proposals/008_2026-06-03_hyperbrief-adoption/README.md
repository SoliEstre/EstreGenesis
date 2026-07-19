# 007 · 2026-06-03 · hyperbrief-adoption

> 다운스트림 어댑터(사이드카)가 EG Hyperbrief 모듈을 **전면 채택**(툴체인 `.hyperbrief/` 배치 + AGENTS.md §3.13 결정-위임 게이트 박제)하며 렌더 파이프라인을 clean-install 환경에서 end-to-end dogfood. 1 blocker(H1) + 4 정련(H2/H3/H5/H6) + positive(H4).
>
> **Staging note**: 어댑터가 staging(`E:\WorkBase\temp`)에 작성. EG 제출 시 기존 `_proposals/006_2026-06-03_hyperbrief/` 의 dogfood-ledger 에 Entry 로 합치거나 별도 bundle 로 이동.

## Bundle 정의

EG `plugins/hyperbrief` (v0.4.1 사양 / renderers v0.4.0) → 사이드카 `.hyperbrief/` 배치, `npm install`(ajv), BlockedStub + FullBrief IR 작성 → MD/HTML 렌더 검증. **핵심 blocker**: shipped 렌더러가 clean ajv8 설치에서 자기 schema(draft 2020-12)를 validate 못 함(H1) — `require("ajv/dist/2020")` 1줄로 해소.

헤드라인:
- **H1 (blocker)**: `mini-engine.cjs` ajv draft-07 import ↔ 2020-12 schema → validation 전부 throw. 기본 경로 깨짐.
- **H2 (Med)**: BlockedStub 가 FullBrief 템플릿으로 렌더 → 빈 필드 + 무관 배너. 변종 분기 없음.
- **H4 (positive)**: FullBrief IR 첫 시도 valid + 렌더 PASS — schema↔renderer coherent.

## Documents

| # | topic | type |
|---|---|---|
| 001 | [Hyperbrief 채택 findings (H1~H6)](001_findings.md) | blocker + 정련 findings + positives + 우선순위 권고 |

검증 산출물(사이드카 repo): `.hyperbrief/ledger/hb-20260603-tcplac.{json,md}` (BlockedStub), `.hyperbrief/ledger/hb-20260603-adopt1.{json,md}` (FullBrief — 채택 결정 자체 기록).

## Closure log

| date | status | note |
|---|---|---|
| 2026-06-03 | drafted (staging) | 전면 채택 + 렌더 검증. H1 blocker(ajv/dist/2020) + H2/H3/H5/H6 + H4. `_proposals/006` ledger 합류 또는 별도 bundle 대기. |

## Privacy

`_proposals/` privacy default — 어댑터 서비스명/호스트/내부 식별자 미노출. 대상은 `Hyperbrief.md` / plugin 산출물 / generic 렌더 메커니즘만.

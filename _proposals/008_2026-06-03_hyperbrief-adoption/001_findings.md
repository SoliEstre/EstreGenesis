# Hyperbrief 전면 채택 dogfooding — findings (2026-06-03)

> 다운스트림 어댑터(MangoClass 사이드카)가 EG `plugins/hyperbrief` 를 `.hyperbrief/` 로 배치하고
> 렌더 파이프라인을 end-to-end 검증한 dogfood. **clean `npm install` 환경**(ajv 8.x)에서 재현.
> 환경: Node v24.14.0 / npm 11.9.0 / Windows.

## 요약

전면 채택은 성공했으나, **shipped 렌더러의 기본(validation-on) 경로가 clean 설치에서 즉시 깨진다**(H1, blocker).
1줄 패치로 복구 후 BlockedStub·FullBrief 양쪽 MD/HTML 렌더 PASS. 나머지는 템플릿 변종 처리·표시 정련·문서 버전 drift.

## Findings

### H1 — ajv draft-07 ↔ schema draft 2020-12 mismatch (★ blocker)
- `renderers/mini-engine.cjs` `getValidator()` 가 `require("ajv")` (기본 export = **draft-07**) 로 인스턴스화.
  schema 는 `"$schema": ".../draft/2020-12/schema"`. → `ajv.compile(schema)` 시
  **`no schema with key or ref "https://json-schema.org/draft/2020-12/schema"`** throw.
- 영향: `render.cjs` 의 **기본 경로(validation 켜짐)가 전부 실패** (exit 2). `--skip-validate` 로만 렌더 가능.
  즉 shipped 패키지를 `npm install` 한 어댑터는 validation 을 한 번도 못 씀.
- 검증: 동일 schema 를 `require("ajv/dist/2020")` 로 compile → BlockedStub·FullBrief 둘 다 `valid: true`,
  그리고 mini-engine 을 그 import 로 1줄 패치하니 validation-on 렌더 exit 0.
- 추정: EG v2.5.24 "determinism smoke PASS" 는 `--skip-validate` 였거나 clean-install 의 ajv8 default 를 안 탔을 것.
- **수정**: `mini-engine.cjs` 의 ajv import → `require("ajv/dist/2020")`. (사이드카는 마커 주석 패치 적용, 업스트림 수정 시 제거.)

### H2 — BlockedStub 가 FullBrief 템플릿으로 렌더됨 (Med)
- IR 은 `oneOf [FullBrief, BlockedStub]`. 그러나 렌더러가 변종 분기 없이 **FullBrief 템플릿을 BlockedStub 에 적용**.
- 결과: BlockedStub MD 에 빈 `Reversibility / Decider / Recommender / Deadline / Reading time` 행 + 무관한
  **"⚠ Low-confidence brief (inferred+unknown >40%)"** 배너가 출력 (BlockedStub 엔 해당 필드 자체가 없음).
- 기대: BlockedStub 은 "자율 결정함 + 사후 통보" 컴팩트 카드로 렌더 (escalation 합 / autonomous_action_taken / post_notify 만).
- 제안: 렌더러가 `status` 로 변종 분기, BlockedStub 전용 짧은 템플릿 추가.

### H3 — `--self-contained` 플래그 no-op (Low)
- `--help` 에 `--self-contained` 광고. 실제로는 v0.4.1 로 deferred — HTML 이 여전히 chart.js/mermaid **CDN 참조**.
  stderr 경고만 1줄(`inline asset bundling is deferred`). 오프라인/air-gap 에선 차트·다이어그램 blank.
- 제안: `--help` 에 "(deferred)" 표기 또는 미구현 플래그는 hard-fail. 정직성(silent-disable WARN 원칙)과 정합.

### H5 — epistemic 태그가 MD 제목에 그대로 노출 (Low)
- `essence_one_line` (tagged_text) 가 H1 제목에 verbatim → `# ADR-hb-... — [verified] 결정 위임을...`.
  `[verified]` 는 doughnut 차트용 메타라 **표시 헤딩에선 strip** 권장.

### H6 — plugin README / plugin.json 버전·상태 drift (Low)
- `plugins/hyperbrief/README.md` = "Phase 1 prototype (v0.1.0)", "렌더러는 별도로 ship 되지 않으며 … Phase 2 예정".
  `plugin.json` `version: 0.1.0`. 그러나 **렌더러가 실제 ship 됨**(renderers/ v0.4.0, `Hyperbrief.md` v0.4.1).
- 제안: README/plugin.json 을 산출물 버전(v0.4.x)에 동기화 (N-way sync: 본문 ↔ plugin manifest ↔ renderers/package.json).

### H4 — (positive) 스키마 ↔ 렌더러 coherent, schema 단독으로 작성 가능
- FullBrief IR(10 섹션, ~200줄, 거의 모든 string 이 epistemic-tagged, Toulmin CI / MCDA do_nothing / minItems 다수)을
  **schema 만 보고 작성 → 첫 시도 valid** → MD(10KB)/HTML(42KB) 렌더 PASS. 스키마 강제성이 잘 설계됨.
- (positive) 트리거 루브릭이 저-stake 채택 sub-결정을 **AUTONOMOUS_DECIDE(BlockedStub)** 로 정확히 분류 —
  모듈의 핵심 가치(인위적 brief 제조 방지)를 dogfood 가 그대로 입증.

## 우선순위 권고

- **[P1] H1** — 1줄 import 수정. clean-install 어댑터의 기본 경로가 깨지는 blocker.
- **[P2] H2** — BlockedStub 템플릿 분기 (저-escalation 이 가장 흔한 경로라 사용 빈도 높음).
- **[P3] H3·H5·H6** — 정직성/표시/문서 동기화 정련.

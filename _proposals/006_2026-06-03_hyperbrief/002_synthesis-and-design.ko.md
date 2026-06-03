# Hyperbrief — 합성과 모듈 설계

> 6 축 딥리서치 (문서 001) 의 합성과 그로부터 도출된 단일 설계 제안: `Constellation.md` · `Superscalar.md` 와 동급의 새 EG 최상위 모듈 `Hyperbrief.md` + `plugins/hyperbrief/` Claude Code 플러그인 스캐폴딩. 문서는 두 부분. **Part A — 합성** 은 축 간 수렴과 긴장을 추출하고, 8 섹션 사양을 정제하며, 규범 규칙을 통합. **Part B — 설계** 는 모듈 위치, 파일 레이아웃, IR JSON 스키마, MD/HTML 템플릿, Constellation A2A 통합, 기계 판독 가능한 trigger 규칙, Superscalar 인터록, 도입 경로를 명세.

---

# Part A — 합성

## A.1 Core thesis

Hyperbrief 는 *"AI 가 사용자에게 결정을 묻는 행위 그 자체"* 를 규율하는 **게이팅 의례** 다. 즉 정보 패키지가 아니라 5 단 파이프라인:

1. **위임 자격 검증** (trigger rubric) — 이 사안이 위임 대상인가, 아니면 에이전트가 결정 후 사후 통보해야 하는가?
2. **인식론적 정직성 강제** — 모든 주장은 inline tag, 모든 권장은 falsifier, 모든 옵션 셋은 pruned alternatives, 모든 옵션 분해는 hidden assumptions 를 동반.
3. **인지 디바이싱** — 단일 narrative 대신 2x2 framing matrix; soft gate 가 있는 progressive disclosure; active-choice pre-mortem; reject-the-framing 메타 분기를 일등 옵션으로.
4. **가역성 우선 의사결정 거버넌스** — RAPID 역할; Cynefin 도메인 분기 트리 형식; reversibility-as-lexicographic-prior; 모든 권장에 reversible-fallback 짝.
5. **사후 학습 루프 폐쇄** — decision lineage; revisit-date 자동 등록; outcome vs decision-quality 회고; Brier-score 보정; alert-fatigue 자기 throttle.

8 섹션은 markdown 양식이 아니라 JSON IR 의 required field 이며, MD/HTML 은 LLM 이 아니라 **deterministic 코드** 가 렌더한다. 모듈의 본질적 기능은 *"결정을 더 잘 내리게 돕는다"* 가 아니라 **"에이전트가 사용자를 동의 강요 회로에 끌어들이는 것을 구조적으로 차단한다"** 다.

## A.2 Cross-axis themes (수렴)

10 개 load-bearing 테마. 여러 축이 다른 어휘를 통해 같은 진단에 독립적으로 도달한 지점들. 수렴은 합성의 가장 강력한 신호 — 무관한 6 학제가 같은 처방에 이른다면 그 처방은 stylistic 이 아니라 *구조적*.

### Theme 1 — Trigger Rubric: Hyperbrief 발동이 첫 번째 결정이다

**지지 축**: AI Harness, Philosophy, Management, Psychology, Long-horizon Development.

5 개 축이 독립적으로 *"모든 분기에서 hyperbrief 가 발동하면 alert fatigue 와 false escalation 으로 모듈 자체가 형해화된다"* 에 수렴. AI Harness 는 5 yes/no 조건 (비가역성 / blast radius / 외부 통보 / 리소스 임계 / prior 결정 번복); Philosophy 는 Jonas 의 4 지표 minimax (비가역성 / 규모 / 시간지평 / 가역비용); Management 는 Bezos Type 1/2 + Cynefin domain; Psychology 는 alarm fatigue 통계 추적; Development 는 reversibility 분류를 요구. 5 가지 어휘, 1 개의 공유 gate.

**설계 귀결**: 본문 8 섹션 위 §0 *Escalation Justification* 메타 헤더 — 4~5 정량 지표 + "AI 가 자율 결정하지 않은 이유 1 줄" 명시. 점수 합산 임계 미만이면 brief 생성 차단하고 *autonomous decide + post-notify* 라우팅.

### Theme 2 — 가역성의 lexicographic prior

**지지 축**: Philosophy, Management, Development, Humanities.

Philosophy (Jonas 책임 비대칭 + precautionary principle), Management (Bezos Type 1/2 + Real Options), Development (one-way door + strangler-fig 점진 경로), Humanities (Arendt 행위 비가역성) 가 다른 정당화 경로로 모두 *"가역 옵션과 비가역 옵션을 같은 EV 로 계산하면 안 된다"* 를 도출. boolean 이 아니라 0~3 스케일 + rollback cost + reversal window + point-of-no-return 다차원 표현이 필요하다는 데도 합의.

**설계 귀결**: §0 reversibility 배지 (녹/황/적); §5 reversibility panel (rollback cost + reversal window + trigger-to-revisit); §7 트리 루트 노드를 reversibility check 로 고정; §8 권장에 *Reversible Fallback* 짝 의무. 비가역 권장 채택 시 'I accept irreversibility' 체크박스 강제.

### Theme 3 — 인식적 정직성 표면

**지지 축**: AI Harness, Philosophy, Development, Humanities.

AI Harness 는 4 단계 epistemic tag `[verified | inferred | assumed | unknown]`; Philosophy 는 Toulmin 6 요소 (qualifier + rebuttal) + Bayesian calibration + Popper falsification trigger; Development 는 `verified | inferred | assumed | unknown` + inferred 비율 임계 경고; Humanities 는 Habermas 진정성 + provenance tagging (`[관찰]` / `[추론]` / `[외부:source]` / `[가정]`) 을 독립적으로 요구. 공통 진단: *"추측과 사실이 동일한 인쇄 무게로 출력되면 사용자는 매개의 두께를 인지 못 한다"*.

**설계 귀결**: 모든 사실 진술에 inline epistemic tag 의무; 무태그는 validator reject. HTML 에서 brief 전체의 인식적 형상을 doughnut chart 로 시각화 ("70% verified, 20% inferred, 10% unknown"). `inferred + unknown > 40%` 면 'low-confidence — additional reconnaissance recommended' 헤더 배너 자동.

### Theme 4 — 권장 방향의 anti-anchoring

**지지 축**: AI Harness, Psychology, Humanities, Management, Philosophy.

Psychology (anchoring + default + IKEA), Humanities (Gadamer 해석학적 선이해 공시 + Sennett dialogic), AI Harness (`§8 = f(§7)` 함수 의존성), Management (MECE conditional recommendation: "X assuming A,B / fallback Y / switch Z"), Philosophy (virtue epistemology confidence + falsifier 동반) 가 모두 *"단일 권고 + 마지막 위치 = 앞 7 섹션이 정당화 회로로 환원"* 을 진단. 6 분야가 같은 실패 모드를 6 가지 어휘로 지목.

**설계 귀결**: §8 을 5 블록으로 재구조화 — Recommendation + Epistemic Profile + Defeaters + Pre-mortem + Reversible Fallback. 단일 단언 금지. §7 노드 ID 인용 없는 권장은 invalid. HTML 에서 §8 은 default collapsed, §7 통과 후 expand. 'AI 권장' 어휘 자체를 'AI 추정' 또는 'tentative recommendation' 으로 다운그레이드.

### Theme 5 — 프레임 거부할 권리를 첫 분기로

**지지 축**: Humanities, Psychology, Philosophy.

Humanities (Floridi informed consent 자발성 + Habermas 이상적 담화 상황의 비강제성), Psychology (default effect 로 인한 over-delegation 방지), Philosophy (옵션 1 개이거나 false dichotomy 인 brief 는 부적합) 가 독립적으로 *"yes/no/option-A/B 만 제시하면 프레임이 강제된 상태"* 에 도달. helpful-mode AI 가 좁힌 선택지는 사용자 자율성 침해.

**설계 귀결**: §7 트리 최상위에 `reject-framing` / `defer` / `request-investigation` 메타 분기 hardcode. §8 에 `pruned options + 제외 사유` 의무. brief 헤더에 '이 질문에 답하지 않아도 됩니다' 고지문. Constellation A2A 응답 타입에 `frame-rejection` enum 추가.

### Theme 6 — Decision lineage 와 학습 루프 폐쇄

**지지 축**: Management, Development, AI Harness.

Management (Annie Duke decision journal + OODA loop), Development (ADR supersedes/superseded by + parent_decisions 그래프), AI Harness (Brier score 누적 calibration + 권장 채택률 통계) 가 모두 *"결정 시점의 brief 만 있고 사후 outcome 이 연결되지 않으면 같은 함정에 반복 빠진다"* 를 진단. Hyperbrief 가 시간축 학습 자산이 되려면 결정-결과 페어링이 모듈 일부여야 함.

**설계 귀결**: §0 에 `decision_lineage`(parent_ids[]); 신설 §9 *Decision Capture* (선택한 옵션 + 그 시점 confidence + falsification trigger + revisit date). Constellation 에 `decision ledger` 인덱스 누적. revisit date 도래 시 자동 'actual outcome + outcome quality vs decision quality 회고' 카드 발송.

### Theme 7 — Pre-mortem 을 의무 인식 의례로

**지지 축**: Management, Psychology, Philosophy, Humanities.

Klein 의 pre-mortem (prospective hindsight) 이 4 개 축에서 독립 도출: Management (HBR 2007 실증), Psychology (active choice + sunk cost 차단), Philosophy (falsification trigger 의 운영형태), Humanities (Sennett 의 subjunctive 어법). 단일 기법이 4 축의 정당화 경로를 동시에 만족하는 드문 케이스 — load-bearing 강도 최고.

**설계 귀결**: §5b 또는 §8 직전에 *Pre-mortem* 서브섹션 강제 — '6 개월 후 이 권장이 명백한 실패로 판명났다면 가장 가능성 높은 실패 경로 + 조기 경보 신호'. 결정 확정 전 사용자의 pre-mortem 자유 입력 1 문장 이상 의무 (active-choice gate). 없으면 결정 확정 차단.

### Theme 8 — Deterministic IR 렌더링을 통한 SSoT

**지지 축**: AI Harness, Long-horizon Development.

AI Harness ("LLM stochastic sampling 으로 MD/HTML 따로 생성 시 drift") + Development (Constellation §13.11 attachment transport-mode discipline 의 source-of-truth 분리 금지) 가 같은 결론. LLM 은 IR (JSON) 만 생성, MD/HTML 렌더는 deterministic 코드여야 동일 결정 컨텍스트에서 정보 정합성 보장.

**설계 귀결**: 파이프라인 `LLM → Hyperbrief JSON IR → MD renderer (코드) / HTML renderer (코드)`. mermaid 다이어그램과 chart.js 데이터도 JSON 내 데이터 필드; LLM 이 직접 MD/HTML/mermaid 를 free-form 으로 생성하는 것은 prompt-level 금지.

### Theme 9 — Cynefin / 도메인 적응 트리 형식

**지지 축**: Management, Psychology, Philosophy.

Management (Snowden Cynefin: Clear/Complicated 에서만 결정론적 분기 트리, Complex 는 probe-sense-respond, Chaotic 은 즉시 행동) + Psychology (체크박스 IKEA effect 차단을 위한 rank-and-preview 인터랙션) + Philosophy (information gain 원칙: cheapest discriminator first) 가 *"체크박스 분기 트리는 도메인 잘못 적용 시 false confidence 생성기"* 를 공유 진단.

**설계 귀결**: §7 진입 전 Cynefin 도메인 판정. Clear/Complicated → mermaid decision tree (체크박스 leaf + 노드 ID); Complex → safe-to-fail probe 3 개 + 관찰 지표; Chaotic → '즉시 행동 + 24h 회고 예약' 단일 카드. 루트 3 노드는 (reversibility, blast radius, time pressure) 로 고정.

### Theme 10 — Constellation A2A 타입 규율

**지지 축**: AI Harness, Long-horizon Development, Management.

AI Harness (신규 DECISION_REQUEST/RESPONSE 메시지 타입) + Development (Constellation §13.13.2 at-least-once relay + ack 3-tier) + Management (RAPID 역할 표기 + pending queue 해소). 일반 TEXT_MESSAGE fallback 은 ack semantics 와 redelivery 보장을 모두 잃고 결정 추적성을 파괴한다.

**설계 귀결**: Hyperbrief 카드를 `DECISION_REQUEST` A2A 타입으로 정의, ack tier 3 단 (received / acknowledged / decided) 확장. 사용자 결정은 `DECISION_RESPONSE` 로 sender pending queue 해소. 비호환 adopter 는 fallback 메시지 헤더 (transport-tier) 에 `decision response required` 메타플래그.

## A.3 긴장과 해소

축 간 7 개 구조적 긴장 — 두 정당한 원칙이 충돌하는 지점. 각 긴장은 승자를 고르지 않고 *구조적 메커니즘* 으로 해소한다.

| # | 긴장 | 충돌 축 | 해소 |
|---|---|---|---|
| 1 | **권고의 명시성 vs 사용자 자율성 보호** — 경영학은 '권고 없는 brief 는 결정 도구가 아니다', 인문학 · 심리학은 '권고 단독 제시는 anchoring + 해석학적 폭력' 경고. | management × humanities × psychology × philosophy | 권고를 함수로 표현: `§8 = f(§7 노드 ID + 가중치)`. 5 블록 구조 (recommendation + 3 defeater + pre-mortem + reversible fallback + confidence + brittleness). 단일 단언 금지하되 경합 옵션 + trade-off 를 모두 제시 + AI 가 어떤 가중치 가정 하에 어느 가지를 추정하는지 추적 가능. 사용자는 가중치 슬라이더로 자기 컨텍스트로 재계산 가능. |
| 2 | **8 섹션 강제 vs 인지부하 임계** — 경영학 · 개발론은 'Type 1 결정에는 깊이 있는 brief 필수', 심리학은 'progressive disclosure 없이는 사용자가 §1 + §6 + §8 만 본다'. | management × development × psychology × ai_harness | Door-type classifier 로 두 요구 합류: Type 1 (비가역) — 8 섹션 전부 default expanded. Type 2 (가역) — §0 + §1 + §6 + §8 minimal default + 나머지 progressive disclosure. §7 (사용자 액션 강제 지점) 은 어떤 모드에서도 expanded. §4 와 §8 은 결정 확정 전 최소 1 회 펼친 기록 soft gate. '결정 등급에 비례하는 깊이', 균일 강제도 무차별 축약도 아님. |
| 3 | **수치 확률 강제 vs calibration collapse 위험** — 철학 · AI Harness 는 수치 확률 요구하나, AI Harness 자체 경고: 모델이 안전빵으로 모두 `assumed` 마킹할 위험. | philosophy × ai_harness | 수치 확률 + brittleness 진술 짝지어 의무. '0.7 point estimate / 90% CI [0.5, 0.85] / 이 추정이 빗나갈 가장 그럴듯한 시나리오 1 줄'. 단일 숫자만 anchoring 위험이라 brittleness 진술이 carrier. 누적 Brier score 추적 + epistemic tag 분포 모니터링으로 calibration collapse 자가 감지 (모든 진술이 `[assumed]` 마킹되는 패턴은 validator 경고). Few-shot 예시로 verified/inferred/assumed/unknown 분포의 정상 범위를 학습. |
| 4 | **Hidden Assumptions 명시 강제 vs LLM motivated reasoning** — 철학은 명시 가정 요구, AI Harness 는 결론 먼저 commit 하면 evidence 선별 위험 경고. | philosophy × ai_harness | 단계별 생성 파이프라인 + IR 의존성으로 해소: (a) §0 escalation 점수 → (b) §1 · §6 frame + decision prompt → (c) §2 · §3 · §4 (왜 + hidden assumptions + rejected alternatives) → (d) §5 (2x2 framing matrix + pre-mortem + reversibility panel) → (e) §7 트리 → (f) §8 = f(§7) → (g) self-critique (누락 3 개 식별) → (h) IR 확정 → (i) 렌더. §4 에서 hidden assumptions 강제 surface 시점에는 §8 권장이 아직 작성되지 않음 — motivated selection 회로 차단. |
| 5 | **Default 선택지 제시 vs default effect 로 인한 over-delegation** — 심리학 · 경영학은 satisficing 보호 (default 옵션) 필요, 심리학 자체 경고: default effect 가 over-delegation 유발. | psychology × management × humanities | Default 옵션을 'AI 추정 1 안 + 권장 채택 시 잃는 것 + 의도적으로 제외한 옵션 + 거부/보류/재구성 메타 옵션' 으로 둘러쌈. 채택 시 사용자가 'AI 권장 채택' 버튼이 아니라 '나는 X 를 이유로 이 권장에 동의한다' 1 문장 직접 입력하는 active-choice gate. IKEA effect 를 디바이싱 도구로 역이용. 권장 채택률 통계 임계 초과 시 (> 70%) 사용자에게 자가 경고 카드 발송. |
| 6 | **MD ADR 호환성 vs HTML 인터랙티브 풍부함** — 개발론은 archival ADR 호환 MD 원함, 심리학 · AI Harness 는 인터랙티브 시각화 원함. | development × psychology × ai_harness | 단일 IR + 두 deterministic 렌더러 분기. MD: ADR 호환 정적 양식 (Title/Status/Context/Decision/Consequences) + mermaid 블록만, GitHub-flavored 표준. HTML: self-contained 인터랙티브 (chart.js radar/gauge/doughnut + mermaid + 가중치 슬라이더 + collapsible + decision receipt 폼). 동일 결정에 대해 두 형식이 정보 drift 없이 보존; MD 는 archived ADR 로 정착, HTML 은 라이브 결정 인터페이스. Constellation 카드는 HTML expand fallback + MD permalink 짝. |
| 7 | **긴급성 수용 vs 긴급성 자체가 강제 메커니즘** — 경영학의 deadline 명시 vs 인문학 · 심리학의 '긴급성은 강제 메커니즘' 경고. | management × humanities × psychology | Deadline 필드는 §0 에 명시하되, AI 가 'urgent/critical/must decide now' 어휘를 쓸 때 자동으로 '이 긴급성의 근거: [외부 데드라인 사실 / AI 추정 / 시스템 제약]' 을 epistemic tag 와 함께 surface. 시간 압박 상황에서도 brief 품질 게이트 (epistemic tag + falsifier + reversibility 분류) 는 생략 불가. 시간 부족 시 brief 단축이 아니라 '결정 보류 권유 + 추가 조사 승인 요청' fallback. |

## A.4 정제된 8 섹션 사양

원안 "1 간단 개요 / 2 무엇을 / 3 어떻게 / 4 왜 / 5 결과예상 / 6 3 줄요약 / 7 분기트리 / 8 권장" 을 재구조화. 아래는 8 섹션 + 신설 §0 헤더 + §9 capture stub. 각 섹션은 이름 (재명명 이유) / purpose / content rules / anti-patterns / visual recommendations.

### §0 Decision Header (신설)

*근거.* 5 개 축 (경영 · 철학 · 개발 · AI Harness · 심리) 이 *"브리핑 본문 전에 결정 등급 메타데이터가 30 초 안에 식별되어야 한다"* 에 수렴. 원안에는 없는 escalation justification + classifier 메타 블록 — 트리거 게이팅과 책임 귀속의 출발점.

*Purpose.* 사용자가 본문을 읽기 전 '이 결정의 등급 · 되돌림 가능성 · 시급성 · 책임 구조' 를 즉시 파악하고 라우팅 (읽음 / 연기 / escalate / 거부). AI 가 자율 결정하지 않은 이유의 자기 검증 게이트.

*Content rules.*
- **MUST**: escalation 4 지표 점수 (비가역성 0~3, blast radius 0~3, 시간지평 0~3, 가역비용 0~3) + 합산 점수. 합산 < 4 면 brief 생성 차단 → "AI 자율 결정 + 사후 통보" 라우팅.
- **MUST**: reversibility 분류 `{two_way / one_way / one_way_with_migration_path}` + 배지 색상 (녹/황/적).
- **MUST**: RAPID 역할 표기 — Recommender (agent_id) / Decider (user) / Performer / Input-contributors / Agree (거부권 보유자).
- **MUST**: Cynefin 도메인 판정 (Clear/Complicated/Complex/Chaotic/Confused) — §7 트리 형식이 이 판정으로 분기.
- **MUST**: `decision_lineage`{parent_decision_ids[], assumed_invariants[]} — parent 폐기 시 자동 재검토 큐 진입.
- **MUST**: deadline (ISO8601 또는 'no rush') + recommended reading time + stake (재정/평판/기술부채 추정).
- **SHOULD**: 'AI 가 자율 결정하지 않은 이유 1 줄' — 위임 자체의 정당화.

*Anti-patterns.*
- Escalation 4 지표 점수 작성하지 않고 본문 직진 — false escalation 또는 false autonomy 의 출발점.
- Reversibility 를 boolean 으로만 표기 — '되돌리기 어렵지만 가능' 사안이 가역으로 misclassify.
- RAPID 역할 미명시 — 사후 책임 핑퐁 ('AI 가 권했으니까' vs '사용자가 결정했으니까') 으로 학습 루프 폐쇄.

*Visual recommendations.* MD: 헤더 표 (4 지표 점수 + reversibility 색상 코드 텍스트 + RAPID 행). HTML: 좌상단 reversibility 배지 (녹/황/적 큰 원), 우측 chart.js radar 로 4 지표 시각화, Cynefin 도메인 색상 라벨, decision_lineage 는 mermaid 소형 그래프 (parent → current).

### §1 Context Horizon (원안 '간단 개요' 에서 재명명)

*근거.* 인문학 (Gadamer 선이해/지평) 과 심리학 (맥락 사전 활성화 + Endsley situation awareness) 이 *"맥락 없는 사실 요약은 이해가 아니라 추측을 유발"* 에 합류. 단순 한 줄 요약은 부족 — 결정이 서 있는 역사적 연속성을 명시해야.

*Purpose.* 사용자가 이 결정을 바라봐야 할 해석학적 지평 (전제 · 이전 결정과의 연속성 · 맥락) 부여. §6 decision prompt 를 마주하기 전 자기 위치를 재구성.

*Content rules.*
- **MUST**: 3 소절 구조 — (a) 전제, (b) 이전 결정과의 연속성, (c) 영향 범위.
- **MUST**: '왜 지금 결정이 필요한가' 의 forcing function 명시 — 외부 데드라인 vs AI 추정.
- **SHOULD**: 직전 N 턴 대화 요약 또는 prior decision 링크 (`decision_id` 형식).
- **SHOULD**: 사용자가 이 brief 에 투자해야 할 시간 추정 (예: '3 분 read').
- **MUST**: 모든 사실 진술에 epistemic tag inline.

*Anti-patterns.*
- §6 3 줄 요약과 내용 중복 (cosine similarity 임계 초과 → validator reject).
- 맥락 없이 사실만 나열 — Gadamer 적 자기 소외.
- 긴급성 어휘 ('urgent', 'critical') 무근거 사용 — epistemic tag 없는 긴급성은 강제 메커니즘.

*Visual recommendations.* MD: 3 소절 bullet. HTML: 좌측 텍스트 + 우측 mermaid timeline (prior decisions → current) 으로 decision lineage 시각화 + epistemic tag 분포 mini doughnut chart.

### §2 What — Blast Radius Surface (원안 '무엇을' 확장)

*근거.* 개발론 (Hyrum + SRE blast radius) 과 AI Harness (coupling delta) 가 *"변경 표면을 명시하지 않으면 사용자는 국소 변경처럼 보이는 전역 변경에 동의"* 진단. Blast radius 는 §0 점수에 들어가지만 본문에서 표면 목록으로 구체화 필요.

*Purpose.* 이 결정이 건드리는 코드 · 계약 · 데이터 · 외부 의존자 · 운영 절차의 표면을 구체적으로 열거. 영향 범위를 시각적으로 식별.

*Content rules.*
- **MUST**: blast radius surface 5 필드 — `{touched_modules, touched_contracts, touched_data_at_rest, touched_external_consumers, touched_operational_runbooks}`. 비어 있는 슬롯은 `verified empty`; `unknown` 은 적색 플래그.
- **MUST**: coupling delta — `{new_dependencies, new_consumers, interface_surface_delta, depth_to_interface_ratio_change}`.
- **SHOULD**: observability cost — `{new_signals_needed, debuggability_delta}`. 새 결합/새 데이터 흐름이 있는데 observability 증분 0 이면 'silent failure risk' 경고.
- **SHOULD**: Hyrum exposure check — 외부 가시 동작 변경이 사실상 계약 락인을 유발할 가능성.

*Anti-patterns.*
- 변경 라인 수만으로 blast radius 표현 — Hyrum 법칙 회피 실패.
- `unknown` 슬롯 방치 — 미조사가 verified empty 로 misread.
- 새 결합 추가했는데 observability 증분 0 — silent failure 영역 무료 따라옴.

*Visual recommendations.* MD: 5 필드 표 (행 = surface 종류, 열 = touched/empty/unknown). HTML: 동일 표 + 각 surface 별 chip 시각화 + mermaid component diagram 으로 새 의존성/새 consumer 흐름. Hyrum 노출 항목 적색 강조.

### §3 How — Incremental Path Check (원안 '어떻게' + 점진 경로 검증, §4 · §5 뒤로 재배치)

*근거.* 개발론 (strangler fig + branch-by-abstraction + feature flag) 이 *"big-bang 권장 출력 전 세 점진 경로 검토 강제"* 요구. 심리학의 sunk-cost 점화 회피를 위해 §3 을 §4 · §5 뒤로 재배치 (원안 순서 변경): 절차 디테일을 먼저 읽으면 본질적 회의가 무게를 잃음.

*Purpose.* 권장 실행의 절차적 구현. big-bang vs 점진 경로 검토 결과를 명시하여 일방향 결정을 양방향 결정으로 변환 가능성 표면화.

*Content rules.*
- **MUST**: big-bang 권장이면 (a) strangler fig 불가 사유 (b) branch-by-abstraction 불가 사유 (c) feature flag 분할 불가 사유. 미명시 시 'tentative' 다운그레이드.
- **MUST**: 실행 단계별 milestone + 각 milestone 의 rollback 가능성 표기.
- **SHOULD**: §2 의 blast radius surface 와 매칭되어 어떤 단계에서 어떤 surface 가 영향받는지 추적 가능.
- **MUST**: epistemic tag — 추정 절차 vs 검증된 절차 구분.

*Anti-patterns.*
- Big-bang 권장 출력하면서 점진 경로 검토 누락.
- Milestone 없는 단일 phase 절차 — rollback 시점 불명.
- §5 결과 예상 전에 §3 절차 디테일을 읽게 만들면 sunk-cost 점화로 §5 회의가 무게를 잃음 (원안 순서 변경의 핵심 이유).

*Visual recommendations.* MD: 단계별 체크리스트 + 각 단계 옆 rollback 가능성 아이콘. HTML: mermaid sequenceDiagram 또는 gantt chart 로 milestone 표기, 각 milestone 에 rollback cost 호버 툴팁.

### §4 Why + Boundary Conditions + Hidden Assumptions + Rejected Alternatives (원안 '왜' 4 분할 확장)

*근거.* 경영학 (Drucker boundary conditions), 철학 (transcendental hidden assumptions), 개발론 (ADR rejected alternatives), AI Harness (motivated reasoning 차단을 위한 단계별 생성) 이 모두 단일 '왜' 를 분할해야 함을 도출.

*Purpose.* 결정의 필요성 · 만족 사양 · 암묵 전제 · 기각 대안을 모두 표면화하여 사후 협상에서 must-have 가 양보되거나 같은 결정이 재논의되는 비용 차단.

*Content rules.*
- **MUST**: 4a Decision Driver — forcing function (왜 지금?).
- **MUST**: 4b Boundary Conditions — must-have (위반 시 결정 무효) / should-have (양보 가능하지만 비용 큼) / nice-to-have 3 계층. must-have < 2 면 brief 생성 중단 + 사용자에게 사양 질문 반환.
- **MUST**: 4c Hidden Assumptions — 옵션을 구성하면서 채택한 전제 ≥ 3. '없음' 은 lint 실패 (가정 없는 옵션 분해는 불가능).
- **MUST**: 4d Rejected Alternatives — ≥ 2 + 각 기각 사유. ≤ 1 이면 'forcing function 이 대안 공간을 닫는 이유' 명시.
- **MUST**: 모든 진술에 epistemic tag + provenance tag.

*Anti-patterns.*
- Hidden Assumptions '없음' 채우는 자기기만.
- Rejected Alternatives 1 개 이하 → false dichotomy 강요.
- Boundary conditions 누락 → 결정 직후 must-have 가 슬그머니 양보 (Drucker 의 가장 빈번한 실패 모드).
- Forcing function 이 AI 추정인데 외부 데드라인처럼 진술 → epistemic tag 로 차단.

*Visual recommendations.* MD: 4 분할 헤더 + boundary conditions 는 3 계층 표 (must/should/nice). HTML: 4 분할 카드 레이아웃, boundary conditions 는 우선순위 색상 코드, hidden assumptions 는 각각 'if this assumption fails → option space invalid' 토글, rejected alternatives 는 mermaid branch 다이어그램 (rejected 가지 회색).

### §5 Consequences — Framing Matrix + Reversibility Panel + Pre-mortem + Most-Affected Stakeholder + MCDA Table (원안 '결과 예상' 다층화)

*근거.* 심리학 (2x2 framing matrix), 철학 (Toulmin qualifier+rebuttal, Rawls reversed veil), 경영학 (MCDA + reversibility panel + Klein pre-mortem), 개발론 (do-nothing cost + 시간축 비용) 이 모두 단일 narrative 를 거부하고 다층 구조 요구. Hyperbrief 에서 가장 무거운 섹션.

*Purpose.* 선택의 결과를 framing 균형 + 가역성 + 실패 시나리오 + 외부효과 + 정량 비교 5 각으로 동시 제시하여 framing effect 와 single-narrative 종속을 차단.

*Content rules.*
- **MUST**: 2x2 framing matrix — 행 = {선택, 거부} × 열 = {얻는 것, 잃는 것} + 'no-action (do nothing)' 을 5 번째 사분면. 단일 narrative 금지.
- **MUST**: Reversibility Panel — rollback cost (시간/금전/관계자본) + reversal window (D-N 일 카운트다운) + trigger-to-revisit (어떤 신호가 오면 재결정).
- **MUST**: MCDA 표 — 행 = 대안 (do nothing 포함), 열 = 평가기준 (§4b boundary conditions 에서 도출), 셀 = 정량값 또는 5 점 척도 + 한 줄 근거. 미지 셀 = UNKNOWN + 조사 비용 추정. 빈 셀 금지.
- **MUST**: Pre-mortem 시나리오 2 개 — (a) 권장안 6 개월 후 명백한 실패로 판명났다면 가장 가능성 높은 실패 경로 (b) 그 경로의 조기 경보 신호.
- **MUST**: Most-Affected Stakeholder 시점 재서술 — 결정 비용을 가장 크게 부담할 행위자 시점에서 결과 1 줄. 식별 불가하면 경고 신호.
- **MUST**: Null Option Cost — do nothing 의 `{30d / 90d / 1y}` 비용 추정. 0 으로 추정되면 Lehman 법칙 위반 플래그.
- **MUST**: Toulmin 5 필드 — 각 옵션의 결과 예측에 {claim, grounds, warrant, qualifier (확률), rebuttal (반박 조건)}.
- **MUST**: 모든 예측 · 확률에 수치 구간 (point estimate + 90% CI + 빗나갈 가장 그럴듯한 시나리오). 자연어 확률 ('아마도', 'likely') 금지.

*Anti-patterns.*
- 단일 gain frame 또는 단일 loss frame narrative — framing effect 직격.
- Do nothing 을 비용 0 baseline 처리 — Lehman 법칙 위반.
- MCDA 표 빈 셀로 비교 — '느낌적으로 A 가 좋다' 합리화.
- Rebuttal '없음' — Toulmin plausibility check 실패.
- Reversibility 를 boolean 으로만 처리.
- 긴 narrative 후반부 reasoning collapse 로 pre-mortem 과 stakeholder 재서술이 hand-waving.

*Visual recommendations.* MD: 2x2 매트릭스 (mermaid quadrantChart 또는 표), MCDA 표, reversibility 패널은 텍스트 표. HTML: 2x2 는 chart.js scatter quadrant 또는 mermaid quadrantChart, MCDA 는 사용자 조정 가능한 가중치 슬라이더 + radar chart 로 대안 비교, reversibility 는 D-N 일 카운트다운 위젯 + 색상 게이지, pre-mortem 은 expandable 카드 2 개, stakeholder 는 mermaid actor diagram, Null Option Cost 는 시간축 line chart, Toulmin 은 각 화살표에 qualifier 라벨.

### §6 Decision Prompt (원안 '3 줄 요약' 에서 재정의)

*근거.* AI Harness ('§1 과 §6 의 기능 중복 → 하나를 decision prompt 로 재정의'), 인문학 (Gadamer Wirkungsgeschichte: 압축은 항상 해석이므로 단일 요약 금지), 철학 (self-coherence test: 3 줄만으로 동일 권장 도달 가능해야) 이 §6 의 역할을 *'사용자가 답해야 할 정확한 질문 1 개 + 선택지 N 개의 1 줄 요약'* 으로 분리할 것을 요구.

*Purpose.* 사용자가 정확히 무엇에 답해야 하는지, 어떤 선택지가 경합하는지, 핵심 trade-off 가 무엇인지를 압축. brief 본문 없이 §6 만 봐도 결정 라우팅 (승인 / 거부 / 연기 / 재구성) 가능해야.

*Content rules.*
- **MUST**: 슬롯 형식 강제 — (1) 사안의 본질 1 줄 (2) 핵심 trade-off 1 줄 (3) 권장 + confidence 수치 1 줄.
- **MUST**: Self-coherence test — §6 만 읽고 §8 권장에 도달 가능. validator 가 §6 ↔ §8 정합성 확인.
- **MUST**: §1 과 cosine similarity 임계 초과 시 redundant 로 reject.
- **SHOULD**: 'AI 관점 요약' + '가상 반대자 관점 요약' 2 열 대조 또는 '사실 / 쟁점 / 요약이 놓치는 것' 3 구조 중 하나.
- **MUST**: 사용자가 답해야 할 정확한 질문 1 개를 의문문으로 명시.

*Anti-patterns.*
- §1 간단 개요의 paraphrase — lazy-fill 패턴.
- Free-form 3 줄 (사실/쟁점/요약 슬롯 미충족) — availability heuristic 직격.
- 단일 시점 요약 — Wirkungsgeschichte 위반.
- §8 권장 어휘를 그대로 §6 에 반복 — anchoring 강화.

*Visual recommendations.* MD: 3 슬롯 명시 표 (사안 본질 / trade-off / 권장+confidence). HTML: 좌 (AI 관점) vs 우 (반대자 관점) 2 열 카드, decision prompt 는 큰 의문문 헤더로 시각적 강조.

### §7 Decision Criteria Tree (원안 '판단기준 분기 트리') — Cynefin-Adaptive + Meta-Branch + Ranked + Information-Gain Ordered

*근거.* 경영학 (Cynefin domain-adaptive format), 인문학 (reject-framing / defer / request-investigation 메타 분기), 심리학 (체크박스 IKEA 회피를 위한 rank-and-preview), 철학 (cheapest discriminator first + Minimal Information Set), 개발론 (루트 3 노드 표준 고정: reversibility/blast radius/time pressure) 이 모두 단순 체크박스 트리를 거부하고 다축 재구조화 요구. §8 권장은 본 섹션의 *함수* 로 derive.

*Purpose.* 결정에 진정으로 충분한 정보의 최소집합을 식별하고, 사용자가 자기 우선순위를 표면화하며, 메타 분기로 프레임 거부 권리를 보장. §8 권장의 함수 입력.

*Content rules.*
- **MUST**: 최상위 메타 분기 — `accept / reject-framing / defer / request-investigation` 4 분기 hardcode.
- **MUST**: 루트 3 노드 표준 — (reversibility, blast radius, time pressure). 도메인 질문은 4 번째 레벨부터.
- **MUST**: Cynefin domain-adaptive format — Clear/Complicated → mermaid decision tree (체크박스 leaf + 노드 ID), Complex → safe-to-fail probe 3 개 + 관찰 지표, Chaotic → '즉시 행동 + 24h 회고 예약' 단일 카드.
- **MUST**: 각 노드의 decision-relevance test — '이 질문에 대한 답이 다른 옵션을 선택하게 만드는가?' 통과 못한 노드는 제거.
- **MUST**: 노드 ID 부여 — §8 권장에서 노드 ID 인용 의무.
- **SHOULD**: 사용자가 직접 우선순위 순서를 드래그로 정하는 ranked list + 각 항목 옆에 '이 항목을 최우선으로 두면 도출되는 결론' 실시간 미리보기.
- **SHOULD**: Pruned options 표기 — '의도적으로 제외한 선택지와 그 사유'. Pruned 0 개는 명시적 선언 필요.
- **SHOULD**: 트리 깊이 3 초과 시 사용자 인지부하 경고.

*Anti-patterns.*
- 사실/가치 혼합 체크박스 — 사용자가 가치 판단을 회피하고 사실로 도피.
- 메타 분기 누락 — 모든 응답이 이미 AI 가 정한 프레임 안 (Floridi 자발성 위반).
- Complex 도메인에 결정론적 분기 트리 강제 — false confidence.
- 체크 후 자동 결론 회로 — IKEA effect 합리화.
- Pruned options 미표기 — false dichotomy 강요.

*Visual recommendations.* MD: mermaid flowchart (메타 분기 → 루트 3 노드 → 도메인 질문), 각 leaf 에 노드 ID 표기. HTML: 인터랙티브 mermaid + 드래그 가능한 우선순위 리스트, 실시간 미리보기 패널, Cynefin 도메인에 따라 시각화 자동 전환 (Complex → probe diagram, Chaotic → single action card), Pruned options 는 collapsed 'show pruned' 토글.

### §8 Recommendation (원안 '권장' 5 블록 재구조화)

*근거.* 6 개 축이 모두 단일 단언 권장을 §7 함수 + 조건 구조로 분할해야 함을 도출.

*Purpose.* 권장을 §7 의 함수로 표현 — 명시 가정, defeater, pre-mortem, reversible fallback, confidence 동반. 단일 무조건 단언 금지.

*Content rules.*
- **MUST**: Recommendation + assumptions (조건부: "X assuming A,B / fallback Y if A fails / switch Z if B tightens").
- **MUST**: Confidence 수치.
- **MUST**: §7 노드 ID 최소 1 개 이상 인용.
- **MUST**: Defeaters 3 개 (어느 하나라도 권장을 뒤집음).
- **MUST**: Pre-mortem inline.
- **MUST**: Reversible Fallback 짝 (fallback path + rollback cost + trigger conditions).
- **MUST**: Falsification trigger (관측 대상 + 시점 + 임계값).
- **MUST**: 비가역 권장은 'I accept irreversibility' 체크박스 강제.
- **MUST**: confidence < 0.6 면 '권장' → '제안 후보' 다운그레이드.

*Anti-patterns.*
- 단일 단언 권장.
- Reversible fallback 부재 — 구조적으로 '되돌릴 수 없는 권장' 생산.
- §7 노드 ID 인용 없음 — 권장이 트리와 분리.
- 'Falsifier: 없음' — vacuous, 가중치 0.

*Visual recommendations.* MD: 5 블록 구조 + 3-defeater 리스트 + fallback 표 + 비가역 시 체크박스. HTML: confidence chart.js gauge, default collapsed (§7 통과 후 expand), active-choice gate (pre-mortem textarea + 비가역 시 'I accept irreversibility' 체크박스) 가 confirm 버튼 바로 위.

### §9 Decision Capture (신설 — 학습 루프 폐쇄)

*근거.* Synthesis fail-mode "Fire-and-forget brief" 가 6 개월 후 같은 함정을 반복하게 만드는 가장 비용 큰 누수. revisit-date 카드 발송은 Constellation 기존 cron / Stop hook 인프라를 재사용해 Phase 1 에서 구현 가능.

*Purpose.* revisit date 자동 등록; outcome vs decision-quality delta 기록; Brier-score 보정 누적; `decision_id` chain supersede/affirm.

*Content rules.*
- **MUST**: revisit_date (ISO8601) + ledger_pointer (`.agent/_decisions/<id>.json` 또는 Constellation ledger SSE id).
- **MUST**: outcome_actual (revisit 후 채워짐).
- **MUST**: outcome_vs_decision_quality_delta (revisit 후 채워짐).

*Visual recommendations.* HTML: footer section 에 revisit countdown + Constellation `/api/decision-response` POST 폼 (chosen meta-branch + user pre-mortem + accepted irreversibility 플래그).

## A.5 Trigger 기준 (기계 판독 요약)

- **MUST trigger** (any one → FULL_HYPERBRIEF): 비가역성 점수 ≥ 2; blast radius 가 모듈 경계 초과; 외부 통보 필요; 리소스 임계 초과; 이전 decision_id supersede.
- **MUST trigger** (sum 기반): escalation 4 지표 합산 ≥ 4.
- **SHOULD trigger**: inferred + assumed + unknown > 40%; 명시적 가치 판단 > 사실 판단; do-nothing 비용이 30d/90d/1y 임계 초과.
- **NOT trigger** (자율 결정 + 사후 통보): sum < 4 AND MUST 조건 발동 없음; Type 2 가역; Clear 도메인의 모든 must-have 검증된 단일 옵션.
- **Anti-trigger** (alert-fatigue 자기 throttle): 권장 자동 채택률 > 70% 가 최근 20 사이클 누적 → trigger 임계 한 단계 상향 + 자기 경고 카드.

## A.6 차단되는 실패 모드 (16 개)

Schema-cosplay · sycophantic over-delegation · 권장으로의 anchoring slide · framing capture · false dichotomy / pruned-options 은닉 · calibration collapse / hallucinated certainty · reversibility blindness · Lehman 법칙 위반 (null option cost = 0) · decision orphaning · fire-and-forget brief (학습 루프 부재) · boundary-condition slippage · alert fatigue / auto-approval 패턴 · MD ↔ HTML 정보 drift · Constellation A2A 타입 fallback · 권고자에 의한 motivated reasoning · 시간 압박 quality drift. 각 실패 모드는 정제된 8 섹션 사양과 아래의 기계 판독 trigger 규칙으로 차단됨.

## A.7 규범 규칙 요약

통합 규칙 리스트. 각 규칙은 validator / renderer / prompting 레벨에서 강제 가능. 전체 강제 체인이 Part B 의 `Hyperbrief.md` SSoT 를 형성한다.

- **MUST** — 모든 결정 요청 출력은 Hyperbrief JSON IR 을 통과; LLM 은 IR 만 생성; MD/HTML 은 deterministic 코드.
- **MUST** — §0 발동 — escalation 4 지표 합산 < 4 → 자율 결정 + 사후 통보; ≥ 4 OR 5 MUST-trigger 조건 1 개 이상 → Hyperbrief 발동.
- **MUST** — §0 에 reversibility class + RAPID + Cynefin + decision_lineage + deadline + stake.
- **MUST** — 모든 사실 진술에 inline epistemic tag + provenance; > 40% inferred + unknown → low-confidence 배너.
- **MUST** — §4 는 4 블록 (Decision Driver / Boundary Conditions must-have ≥ 2 / Hidden Assumptions ≥ 3 / Rejected Alternatives ≥ 2).
- **MUST** — §5 는 6 블록 (2x2 framing + Reversibility Panel + MCDA + pre-mortem 2 + Most-Affected Stakeholder + Toulmin 5 필드). Null Option Cost 0 = Lehman 위반 플래그.
- **MUST** — 자연어 확률 금지; 수치 구간 의무.
- **MUST** — §7 은 meta-branch + 루트 3 노드 + Cynefin-adaptive + 노드 ID 부여.
- **MUST** — §8 은 5 블록 (Recommendation + Confidence + Defeaters 3 + Pre-mortem + Reversible Fallback); §7 노드 ID ≥ 1 인용; 비가역 시 'I accept' 체크박스.
- **MUST** — big-bang 권장은 3 점진 경로 불가 사유 명시 또는 tentative 다운그레이드.
- **MUST** — Falsification trigger (3 요소: 대상, 시점, 임계값) 의무.
- **MUST** — 결정 확정 전 사용자 pre-mortem 자유 입력 (active-choice gate).
- **MUST** — §9 Decision Capture 자동 등록; revisit-date 가 회고 카드 발화.
- **MUST** — Constellation 카드는 `DECISION_REQUEST` 로 emit, ack tier `decided`; 비호환 adopter 는 `decision response required` 메타플래그 fallback.
- **SHOULD** — 단계별 생성 파이프라인 (9 단계).
- **SHOULD** — 채택률 / 결정시간 / pre-mortem 미입력률 / epistemic 분포 누적 통계 + 임계 초과 시 자기 경고.
- **SHOULD** — HTML 기본 뷰 §0 + §1 + §5 + §7 + §6; §4 / §8 은 확정 전 펼침 필요; Type 1 은 default expanded.
- **SHOULD** — 사용자 거부 권리 고지를 헤더에 노출.

---

# Part B — 모듈 설계

## B.1 모듈 위치 결정

루트 SSoT 는 `C:\Dev\EstreGenesis\Hyperbrief.md` (Constellation.md / Superscalar.md 와 동일 레벨, 동일 헤더 주석 컨벤션: `<!-- module: Hyperbrief; layer: decision-gating; part-of: EstreGenesis 2.5.x; ... -->`). 플러그인은 `C:\Dev\EstreGenesis\plugins\hyperbrief\`.

**설계의 6 개 결정축:**

(1) **루트 SSoT + 플러그인 디렉토리 이분화.** EG 의 기존 2 모듈 (Constellation/Superscalar) 모두 이 패턴 채택. Hyperbrief 는 추가 의미론 없이 동일 패턴을 적용 — 학습 비용 0. SSoT 마크다운이 *spec source*, 플러그인은 *Claude Code 런타임 어댑터*. 둘이 동일 버전으로 진화하되 SSoT 는 라이선스/사양 인용 surface, 플러그인은 모델 발견 (invoke) surface.

(2) **deterministic IR 분리 원칙을 Phase 1 부터 강제.** Synthesis 의 가장 load-bearing 한 fail-mode ("information drift between MD and HTML") 가 LLM 이 두 형식을 직접 생성하면 발생. 따라서 LLM 출력은 JSON IR 단일, MD/HTML 렌더러는 코드 (node script). Phase 1 에서도 `renderer-md.cjs` / `renderer-html.cjs` ship — skill 만 ship 후 Phase 2 에서 렌더러 추가는 IR drift 를 6 개월간 방치하는 함정.

(3) **Constellation 통합은 CUSTOM/HyperbriefCard 1 차 타입 + DECISION_REQUEST/RESPONSE A2A 분리.** Constellation §13.16.9 의 A2A-intent allowlist 에 `DECISION_REQUEST` / `DECISION_RESPONSE` / `DECISION_DEFER` / `DECISION_REJECT_FRAMING` 4 개 추가. 비호환 adopter 는 §13.16.12 Pattern 7 (TEXT_MESSAGE fallback) 을 그대로 활용하되 헤더에 `[Hyperbrief decision required — see linked card]` 메타 prefix.

(4) **trigger rubric 은 §0 escalation 점수 4 지표 합산 < 4 → 발동 차단** 의 양방향 게이트. 발동도 막고 (자기 권장 자율 결정), 무발동도 막는다 (escalation 점수 ≥ 4 면 brief 없이는 결정 요청 invalid). 이것이 Synthesis 의 "Hyperbrief 발동 자체가 첫 결정" 을 운영화하는 단일 메커니즘.

(5) **Superscalar 와는 직교 게이트지만 동일 사건에서 직렬 평가.** fan-out 결정에서 Superscalar 게이트가 통과한 후라도, fan-out 이 (a) 외부 통보 (b) 비가역 lane (c) cross-system blast radius 중 하나에 해당하면 Hyperbrief 게이트로 escalate. Superscalar 의 cost-benefit gate 는 *"이 fan-out 을 할 가치가 있나"* 를, Hyperbrief 는 *"이 fan-out 자체를 사용자가 인가해야 하나"* 를 묻는다. 둘은 보완 (Synthesis 의 trigger 5 조건 중 "외부 통보 필요" 조건이 Superscalar 결과를 Hyperbrief 로 escalate 하는 자연스러운 hook).

(6) **§9 Decision Capture + revisit-date 를 1 차 ship.** Synthesis 의 fail-mode "Fire-and-forget brief" 가 6 개월 후 같은 함정을 반복하게 만드는 가장 비용 큰 누수. revisit-date 카드 발송은 Constellation 의 기존 cron/Stop hook 인프라를 재사용해 Phase 1 에서 구현 가능.

Hyperbrief.md 는 `depends-on: none (optional synergy: Constellation §13 A2A, Superscalar §3 cost-benefit gate)` 메타로 선언.

## B.2 파일 레이아웃

| 경로 | 목적 | 스케치 |
|---|---|---|
| `Hyperbrief.md` | 루트 SSoT — Hyperbrief 사양 단일 진실 소스 (외부 인용 surface). | 메타 헤더 주석 + 11 개 섹션: §1 Concept (결정 위임 의례로서 Hyperbrief; schema-cosplay 와 sycophantic over-delegation 양방향 차단), §2 Trigger Rubric (4 지표 escalation 점수 + 5 MUST conditions + Anti-trigger), §3 §0 Decision Header 사양, §4 8 섹션 본문 사양 + §9 Decision Capture, §5 Epistemic Discipline, §6 Anti-patterns + 16 개 fail-mode 매핑, §7 IR-driven Rendering Pipeline, §8 Constellation Integration, §9 Superscalar 협업, §10 Adoption thresholds, §11 Reference dogfood ledger placeholder. Constellation.md / Superscalar.md 의 어조 · 구조를 그대로 따라감. |
| `plugins/hyperbrief/.claude-plugin/plugin.json` | Claude Code 플러그인 매니페스트. | Constellation/Superscalar plugin.json 과 동일 schema 준수. `name=hyperbrief`, `version=0.1.0`, description 은 Phase 1 (skill + renderer scripts) 과 Phase 2 로드맵 (PreToolUse hook + MCP server) 명시. `homepage` = Hyperbrief.md raw URL. `mcp` 블록은 Phase 1 생략. |
| `plugins/hyperbrief/README.md` | 플러그인 사용자 (installer) 대상 설명서. | Superscalar README 구조 모방 — Section 1 ('무엇을 주는가'), 2 (설치 옵션 A: claude-community 마켓플레이스 / B: self-hosted EstreGenesis 마켓플레이스), 3 ('v0.1.0 에 든 것 / Phase 2 로드맵'), 4 (빠른 사용법), 5 ('Constellation/Superscalar 와의 관계'), 6 (spec source link to Hyperbrief.md raw URL). |
| `plugins/hyperbrief/skills/hyperbrief/SKILL.md` | 모델-invoked 메인 skill. 에이전트가 결정 요청 직전 자동 발견. | Frontmatter: `name: hyperbrief / description: Use BEFORE asking the user to approve, choose between options, or commit to any action whose reversal cost is non-trivial. MUST invoke when (a) the next message would contain '괜찮을까요/할까요/which/should we' patterns AND any of {irreversibility≥2, cross-module blast radius, external-party notification, resource threshold, prior-decision supersede}, (b) Superscalar fan-out gate just opened a write/deploy/send lane, (c) Constellation A2A DECISION_REQUEST is inbound. SKIP when escalation 4-score sum < 4 (autonomous decide + post-notify instead).` 본문은 trigger rubric 자가판정 의사코드 + §0 6 필드 작성 요령 + §1 ~ §9 IR JSON 채우기 가이드 + renderer 호출 + Constellation 동시 통보 + revisit-date 등록 + anti-patterns 7 개. |
| `plugins/hyperbrief/schema/hyperbrief-ir.schema.json` | Hyperbrief JSON IR 의 정형 스키마 (validator + renderer 공통 입력 계약). | JSON Schema 2020-12. Root `HyperbriefIR` 객체 — 10 개 top-level 필드 (§0 ~ §9). 모든 사실 진술 string 필드는 `tagged_text` 패턴 강제. escalation score 합산 < 4 면 schema 자체가 `blocked` stub 분기 (oneOf: full IR vs blocked stub). |
| `plugins/hyperbrief/renderers/renderer-md.cjs` | IR → ADR 호환 MD 결정론적 렌더러. | Node CJS. stdin JSON → schema validate (ajv) → 섹션별 deterministic 문자열 조립 → stdout MD. mermaid 블록은 `cynefin_domain` 으로 자동 선택. 자연어 확률 단어 감지 시 validation fail. Front-matter 는 ADR 호환 (`# ADR-{decision_id} — {title} / Status / Date / Reversibility badge / RAPID roles`). |
| `plugins/hyperbrief/renderers/renderer-html.cjs` | IR → 인터랙티브 self-contained HTML 결정론적 렌더러. | Node CJS. IR → HTML5 단일 파일 (chart.js + mermaid CDN 임베드 또는 inline). §0 reversibility 배지 색상 게이지, §0 4 지표 radar, §5 MCDA radar + 가중치 슬라이더, epistemic-tag doughnut, Reversibility Panel D-N 일 카운트다운 위젯, §7 interactive mermaid tree + 드래그 가능한 priority list, §8 progressive disclosure, active-choice-gate (pre-mortem textarea + 'I accept irreversibility' 체크박스), Decision Receipt POST 폼. data 필드는 모두 IR JSON 에서 직접 주입 — LLM 이 HTML 본문을 만지지 않음. |
| `plugins/hyperbrief/templates/md-template.hbs` | MD 렌더러가 사용할 Handlebars (또는 mustache) 템플릿 — 섹션 골격. | `{{#hyperbrief}}` 블록 안에 §0 ~ §9 헤딩 + IR 변수 슬롯. 조건부 블록 (`{{#if blocked}}` → blocked stub, `{{else}}` → full brief), mermaid 다이어그램 위치 placeholder, 비가역 권장 시 'I accept irreversibility' 체크박스 추가 라인. 템플릿 자체는 deterministic — 모든 값은 IR 에서 주입. |
| `plugins/hyperbrief/templates/html-template.hbs` | HTML 렌더러 템플릿 — chart.js/mermaid 임베드 위치 + 컴포넌트 슬롯. | `<head>` CDN/inline chart.js + mermaid + minimal CSS, `<body>` 는 grid layout 10 영역 (§0 헤더 / §1 컨텍스트 / §2 표 / §3 단계 / §4 4 분할 / §5 MCDA+radar+pre-mortem / §6 decision prompt / §7 interactive tree / §8 collapsed-by-default 권장 + active gate / §9 receipt 폼). 모든 동적 데이터는 `data-ir-path='...'` 속성으로 IR 주소 참조 → 페이지 하단 단일 `<script id='hyperbrief-ir' type='application/json'>` 블록에서 일괄 hydration. |
| `plugins/hyperbrief/skills/hyperbrief-trigger-check/SKILL.md` | 모델이 모든 사용자-요청-결정 시점에 호출하는 경량 게이트 skill. | Frontmatter: `name: hyperbrief-trigger-check / description: ALWAYS run before composing any message that asks the user for a decision, approval, or choice. Computes escalation 4-score + 5-condition rubric, returns one of {AUTONOMOUS_DECIDE, FULL_HYPERBRIEF, MINIMAL_BRIEF, BLOCK_FRAMING}. Cheaper than full hyperbrief skill — invokes hyperbrief skill only if outcome ≠ AUTONOMOUS_DECIDE.` 본문은 30 초 의사코드. |
| `plugins/hyperbrief/skills/hyperbrief-revisit/SKILL.md` | 결정 사후 학습 루프 폐쇄 skill — revisit-date 도래 시 발화. | Frontmatter: `name: hyperbrief-revisit / description: Invoke when a stored decision's revisit_date is reached, or when an assumed_invariant in decision_lineage is violated. Loads the original IR from decision ledger, prompts user for actual outcome, computes outcome-quality vs decision-quality delta (Brier score increment), appends retrospective to ledger, supersedes/affirms decision_id chain.` 본문은 ledger 위치, 회고 8 질문, supersede 룰. |
| `plugins/hyperbrief/hooks/hooks.json` | (Phase 2 예약) PreToolUse / Stop 훅 등록. | Phase 1 에서는 placeholder 파일만 commit, 본문은 `{}` + 주석. Phase 2 에서 PreToolUse 매처로 'AskUserQuestion' · 'Bash(git push|gh ...)' · outbound A2A emit 직전에 hyperbrief-trigger-check 자동 호출 등록. Stop hook 으로 revisit-date 도래 ledger 스캔 → hyperbrief-revisit 트리거. |

## B.3 Output 스키마 (HyperbriefIR JSON Schema 2020-12 — 발췌)

전체 스키마는 `plugins/hyperbrief/schema/hyperbrief-ir.schema.json` (Phase 1 ship 산출물). 핵심 구성:

- `$id` 와 `oneOf: [FullBrief, BlockedStub]` — escalation sum 에 따라 스키마 분기.
- `tagged_text` 패턴: `^\[(verified|inferred|assumed|unknown)\](\[(관찰|추론|외부:[^\]]+|가정)\])?\s+\S.+$` — 모든 사실 진술 string 에 inline epistemic + optional provenance tag 강제.
- `score_0_3` integer 제약을 모든 escalation 지표에 적용.
- `BlockedStub` 은 `status: "blocked_low_escalation"`, decision_id, escalation_header, autonomous action taken 요구.
- `FullBrief` 는 10 필드 객체: `decision_id` (패턴 `^hb-[0-9]{8}-[a-z0-9]{6}$`), `section_0_decision_header` ~ `section_9_decision_capture_stub`, plus computed `epistemic_distribution` 블록 (HTML doughnut chart 용).

각 섹션이 자체 content rule 을 `required` 배열과 `minItems` 제약으로 강제:

- `section_0_decision_header` 가 `escalation`, `reversibility_class`, `rapid`, `cynefin_domain`, `decision_lineage`, `deadline`, `recommended_reading_minutes`, `stake` 요구.
- `section_4_why_block.boundary_conditions.must_have` 가 `minItems: 2`.
- `section_4_why_block.hidden_assumptions` 가 `minItems: 3`, 각 항목이 `{assumption: tagged_text, if_violated: tagged_text}`.
- `section_4_why_block.rejected_alternatives` 가 `minItems: 2`.
- `section_5_consequences_block.pre_mortem_scenarios` 가 `minItems: 2`.
- `section_5_consequences_block.mcda_table.alternatives` 가 `minItems: 2` (`do_nothing` 포함 의무 설명).
- `section_5_consequences_block.toulmin_predictions[].rebuttal` 필수 (missing 또는 "none" 금지).
- `section_5_consequences_block.framing_matrix_2x2_plus_no_action` 5 사분면 (`accept_gain`, `accept_loss`, `reject_gain`, `reject_loss`, `no_action`) 모두 요구.
- `section_5_consequences_block.toulmin_predictions[].qualifier` 는 `point_estimate` (0~1), `ci_90_low`, `ci_90_high`, `most_likely_to_miss_scenario` 가진 객체.
- `section_6_decision_prompt.question_to_user` 는 description `"MUST end with '?'"` (렌더러 post-validate 체크).
- `section_7_decision_tree.meta_branch` 가 4 메타 분기 (`accept`, `reject_framing`, `defer`, `request_investigation`) 모두 요구.
- `section_7_decision_tree.root_nodes` 가 `{reversibility, blast_radius, time_pressure}` 요구.
- `section_7_decision_tree.domain_format` enum 은 `{tree_mermaid, probe_safe_to_fail, single_action_card}`.
- `section_7_decision_tree.nodes[].node_id` 패턴: `^N[0-9]+$`.
- `section_8_recommendation.cited_tree_node_ids` 가 `minItems: 1`.
- `section_8_recommendation.defeaters` 가 `minItems: 3`.
- `section_8_recommendation.falsification_trigger` 가 `{what_to_observe, when, threshold}` 요구.
- `section_8_recommendation.reversible_fallback` 필수 (path 가 `"none"` 이면 reversibility 가 자동 적색으로 promote).

## B.4 MD 템플릿 outline (발췌)

MD 렌더러는 ADR Nygard 양식에 정렬된 deterministic 구조 조립:

```markdown
# ADR-{decision_id} — {essence_one_line}

<!-- Hyperbrief v0.1 — rendered from IR. Do not hand-edit; edit ir.json and re-render. -->

| Field | Value |
|---|---|
| Status | {status} |
| Reversibility | {reversibility_class} ({badge_color_emoji}) |
| Decider | {rapid.decider} |
| Cynefin Domain | {cynefin_domain} |
| Deadline | {deadline} |
| Reading time | {recommended_reading_minutes} min |

## §0 Decision Header — Escalation Justification
[4 지표 점수 표 + autonomy refusal reason + decision lineage mermaid]

## §1 Context Horizon
[preconditions + continuity + scope + forcing function]

## §2 What — Blast Radius Surface
[5 필드 surface 표 + coupling delta + Hyrum exposure flag]

## §4 Why
### 4a · Decision Driver
### 4b · Boundary Conditions (must / should / nice)
### 4c · Hidden Assumptions (≥ 3, with if-violated)
### 4d · Rejected Alternatives (≥ 2 with reasons)

## §5 Consequences
### 5a · Framing Matrix (2×2 + no-action) — mermaid quadrantChart
### 5b · Reversibility Panel (rollback cost / reversal window / trigger-to-revisit)
### 5c · MCDA Table (alternatives × criteria, rows include do-nothing)
### 5d · Pre-mortem (2 scenarios + early warnings)
### 5e · Most-Affected Stakeholder — first-person blockquote
### 5f · Null Option Cost (30d / 90d / 1y; Lehman violation flag if 0)
### 5g · Toulmin Predictions (claim / grounds / qualifier / rebuttal)

## §3 How — Incremental Path Check
[Strangler/BBA/Feature-flag 표 + tentative flag + milestone 표]

## §6 Decision Prompt
[question_to_user as quote + 3 슬롯 표 + AI view vs devil's advocate]

## §7 Decision Criteria Tree
[meta-branch 리스트 + Cynefin-adaptive mermaid + pruned options]

## §8 Recommendation
[conditional recommendation + confidence + brittleness + cited node IDs +
 defeaters 리스트 + pre-mortem inline + reversible fallback + falsification trigger +
 "I accept irreversibility" 체크박스 if applicable]

## §9 Decision Capture
[revisit date + ledger pointer + outcome placeholder]

---
*Pre-mortem 입력이 결정 확정 전 의무 (active-choice gate).*
*`ir.json` 으로부터 `renderer-md.cjs` 가 렌더링. 손으로 편집 금지.*
```

## B.5 HTML 템플릿 outline (발췌)

HTML 렌더러는 self-contained HTML5 단일 파일 산출. 핵심 설계:

- **IR 한 번 주입**: `<script id="hyperbrief-ir" type="application/json">{IR_JSON}</script>` — 모든 컴포넌트가 `DOMContentLoaded` 에서 이로부터 hydrate.
- **Reversibility 배지** 는 60px 원 (녹/황/적) 좌상단 §0.
- **chart.js 렌더**: escalation radar (4 지표), MCDA radar (대안 × 기준, 가중치 슬라이더), 2x2 framing scatter quadrant, null-option line chart (30d/90d/1y), confidence gauge, epistemic-tag doughnut.
- **mermaid 렌더**: decision lineage graph, blast-radius coupling diagram, milestone Gantt, §7 Cynefin-adaptive tree (또는 probe diagram 또는 single action card).
- **Progressive disclosure**: §0 + §1 + §5 + §6 + §7 default 노출; §2 / §3 / §4 / §8 은 `<details>` collapsed; §8 은 §7 인터랙션 후에만 expand.
- **메타 분기 버튼** 이 §7 트리 위에: `accept` (녹) / `reject-framing` (적) / `defer` (황) / `request-investigation` (청).
- **Active-choice gate**: pre-mortem `<textarea>` 의무; `confirm-decision-btn` 은 입력 길이 > 10 자 AND (비가역 권장 시) 'I accept irreversibility' 체크박스 체크 전까지 `disabled`.
- **Decision Receipt 폼** 하단에서 Constellation `/api/decision-response` 로 POST (`decision_id` + `chosen_meta_branch` + `user_premortem` + `accepted_irreversibility`).
- **헤더 고지문**: '이 질문에 답하지 않아도 됩니다 — 거부 / 보류 / 재구성 옵션이 §7 메타 분기에 있습니다'.
- **Low-confidence 배너** `inferred + unknown > 40%` 일 때 자동 노출.

## B.6 Constellation 통합

### Envelope set

Constellation §13.16.9 A2A-intent allowlist 에 4 신규 이름 + `HyperbriefCard` 추가. 발신 측은 두 envelope 을 **세트로** 발송:

1. **`DECISION_REQUEST`** — 라우팅 · dedup · ack 추적용 경량 envelope.

```jsonc
{ "type": "CUSTOM",
  "name": "DECISION_REQUEST",
  "targetAgentId": "<user-board-agent>",
  "value": {
    "decision_id": "hb-20260603-a1b2c3",
    "card_msg_id": "<msgId of paired HyperbriefCard>",
    "reversibility_class": "one_way",
    "reversibility_badge_color": "red",
    "escalation_sum": 9,
    "deadline": "2026-06-10T18:00Z",
    "rapid_decider": "user",
    "cynefin_domain": "complicated",
    "ack_tier_required": "decided"
  }
}
```

2. **`HyperbriefCard`** — 카드 본문 (IR + 렌더된 HTML 임베드).

```jsonc
{ "type": "CUSTOM",
  "name": "HyperbriefCard",
  "targetAgentId": "<user-board-agent>",
  "parentId": "<DECISION_REQUEST msgId>",
  "value": {
    "decision_id": "hb-20260603-a1b2c3",
    "ir": { /* Full HyperbriefIR JSON */ },
    "render_artifacts": {
      "md_permalink": "file:///.../briefs/hb-20260603-a1b2c3.md",
      "html_inline_b64": "<base64 of self-contained HTML>"
    },
    "expand_hint": "open inline HTML in board card; MD permalink for archive"
  }
}
```

### Ack 3-tier 확장 (Hyperbrief 전용)

Constellation 기존 3-tier: `received` (transport) / `acknowledged` (commitment) / `processed` (application). Hyperbrief 는 application-tier 를 더 세분화:

- `received` — server hop 도달 (transport ack — 즉시).
- `acknowledged` — user board 가 카드를 화면에 렌더 (commitment ack — Stop hook 또는 client beacon).
- `decided` — user 가 active-choice-gate 통과 + decision-receipt POST 완료 (Hyperbrief 전용 application tier).

`a2a_wait_ack(msgId, tier='decided', timeoutMs)` MCP 도구 (Phase 2 에서 plugins/constellation/mcp/server.cjs 확장) 가 이 tier 인지. Timeout 시 §13.13 escalation ladder 따라 nudge 또는 fallback (예: 자율 결정 + 사후 통보로 다운그레이드).

### 비호환 adopter (§13.16.12 Pattern 7) — TEXT_MESSAGE fallback

Constellation board 가 `HyperbriefCard` 를 모르면 §13.16.12 Pattern 7 대로 TEXT_MESSAGE 로 렌더. Hyperbrief 는 fallback 시 정보 손실을 최소화하도록 카드 본문 첫 줄에 표준 prefix 강제:

```
[Hyperbrief decision required | id=hb-20260603-a1b2c3 | reversibility=one_way(red) | deadline=2026-06-10T18:00Z | link=<md_permalink>]
... §6 question_to_user ...
... §6 essence + tradeoff + recommendation ...
```

이렇게 하면 비호환 adopter 라도 (a) 사람이 `decision_id` 로 추적 가능, (b) reversibility 색상이 텍스트로 명시되어 위급도 인지 가능, (c) MD permalink 로 전체 brief 접근 가능.

### Decision ledger — `state.json` 확장 + SSE 엔드포인트

Constellation board 의 `state.json` 에 신규 top-level 필드 `decisions[]` 추가:

```jsonc
"decisions": [
  { "decision_id": "hb-20260603-a1b2c3",
    "status": "pending" | "decided" | "deferred" | "framing_rejected",
    "card_msg_id": "...",
    "reversibility_class": "one_way",
    "deadline": "...",
    "decider": "user",
    "outcome_chosen": null,
    "user_premortem": null,
    "revisit_date": "2026-09-03",
    "parent_decision_ids": ["hb-..."],
    "ledger_pointer": ".agent/_decisions/hb-20260603-a1b2c3.json"
  }
]
```

신규 SSE endpoint `/api/decisions/stream` — revisit-date 도래 + parent 폐기 이벤트 broadcast. `hyperbrief-revisit` skill 이 이 stream 을 구독.

### Board UI 렌더링 컴포넌트

기존 Constellation board 의 chip 영역 옆에 `Decision Card` zone 추가:

- **카드 상단**: reversibility 배지 (녹/황/적 큰 원, 좌상단), escalation score chip (우상단), Cynefin 도메인 라벨, deadline 카운트다운.
- **본문**: `HyperbriefCard.value.render_artifacts.html_inline_b64` 를 `<iframe sandbox srcdoc=...>` 로 임베드 (XSS 격리 + chart.js 자체 동작).
- **하단**: meta-branch 4 버튼. 클릭 시 해당 DECISION_RESPONSE/DEFER/REJECT envelope 자동 emit.

### AckProcessed → AckDecided 매핑

비호환 adopter 용 호환 모드: 일반 `AckProcessed` 응답이 오면 Hyperbrief 는 `decided` tier 로 promote 하되 `value.decision_outcome` 필드 누락 시 'unknown_outcome' 플래그 + 사용자에게 fallback 질문. 호환 adopter 는 `AckDecided{ outcome: 'accepted' | 'rejected_framing' | 'deferred' | 'investigation_requested', user_premortem: '...', accepted_irreversibility: bool }` 회신.

## B.7 기계 판독 가능 trigger 규칙

압축 규칙 리스트. `Hyperbrief.md §2` 와 `hyperbrief-trigger-check` skill 본문의 소스로 적합.

1. 다음 어시스턴트 메시지가 `['괜찮을까요','할까요','should we','which option','approve','confirm','choose between','OK to']` 중 하나 이상을 포함하면, 메시지 작성 전 MUST `hyperbrief-trigger-check` 실행; bypass 는 invalid output (anti-sycophantic-over-delegation gate).

2. `escalation_sum = 비가역성(0-3) + blast_radius(0-3) + 시간지평(0-3) + 가역비용(0-3)` 정의. 합산 < 4 AND MUST-trigger 없음 → 라우팅 = `AUTONOMOUS_DECIDE` + 사후 통보 (hyperbrief 발송 금지; 한 줄 사후 결정 요약 emit). 합산 ≥ 4 OR MUST-trigger 발동 → 라우팅 = `FULL_HYPERBRIEF` (IR + 렌더 + `DECISION_REQUEST` emit).

3. **MUST-trigger 조건** (어느 하나 → `FULL_HYPERBRIEF`, escalation_sum 무관): (a) irreversibility_score ≥ 2, (b) blast_radius 가 모듈 경계 초과 (touched_contracts non-empty 또는 touched_external_consumers non-empty), (c) touched_external_consumers 가 out-of-band 통보 요구, (d) resource_estimate 가 임계 초과 (tokens > 200k OR money > $50 OR time > 4h OR 새 외부 API/service), (e) `decision_lineage.parent_decision_ids` 의 기존 decision_id supersede.

4. **Cynefin 자동 라우팅**: domain == `chaotic` → `MINIMAL_BRIEF` (single-action card, §3/§5 없음, 즉시 행동 + 24h-retrospective 자동 schedule). domain == `complex` → §7 domain_format = `probe_safe_to_fail`, §5 MCDA 가중치 완화. domain == `confused` → `FULL_HYPERBRIEF` 차단 + `DECISION_REJECT_FRAMING` emit, 이유 = "domain unclear; clarify first".

5. **Superscalar 인터록**: Superscalar 가 write/deploy/send lane 을 열기 전 (issue_width_write > 0 AND lane 이 §3 비가역 barrier 'default-forbidden' 리스트 — 외부 API, shell 부작용, DB write, deploy, deletion, send/broadcast — 의 action 포함), MUST 해당 lane intent 에 `hyperbrief-trigger-check` 실행. `FULL_HYPERBRIEF` 발동 시 Superscalar fan-out PAUSE, `DECISION_REQUEST` emit, ack_tier='decided' OR timeout-fallback 까지 대기. Read lane (issue_width_read only) 은 면제.

6. **Schema validation gates** (validator MUST reject; LLM MUST retry): (1) 사실 진술 위치 string 이 epistemic tag 누락 → reject; (2) §4b must_have.length < 2 → reject + 'specification incomplete' 질문 반환; (3) §4c hidden_assumptions.length < 3 → reject; (4) §4d rejected_alternatives.length < 2 AND forcing_function 정당화 없음 → reject; (5) §5g rebuttal missing 또는 == 'none' → reject; (6) §5c 빈 셀 → reject (UNKNOWN+investigation_cost 필요); (7) §5f any of {d30, d90, y1} == 0 → lehman_violation_flag=true; (8) §6.question_to_user 가 '?' 로 끝나지 않음 → reject; (9) §8 cited_tree_node_ids.length < 1 → reject; (10) §8 falsification_trigger 누락 → reject.

7. **Reversibility 다운그레이드**: reversibility_class == 'one_way' AND §8.reversible_fallback.fallback_path == 'none' AND §8.confidence.point_estimate < 0.75 → 자동 `proposal_candidate` 다운그레이드 AND 'I accept irreversibility' 체크박스 강제 AND §5b reversibility_panel 을 §6 영역에 surface.

8. **Big-bang 인터록**: §3.chosen_path == 'big_bang' AND any of {strangler_fig_check, branch_by_abstraction_check, feature_flag_check} == 'not_explored' 또는 'unknown' → §3.tentative_flag_if_big_bang = true AND §8 status MUST be 'tentative'.

9. **Alert-fatigue 자기 throttle**: 최근 20 hyperbriefs 의 rolling stats — user_acceptance_rate > 70% AND user_premortem_input_avg_length < 30 자 → 자기 경고 카드 emit AND 다음 10 사이클 동안 escalation_sum 임계를 4 → 5 로 상향.

10. **Constellation A2A discipline**: `DECISION_REQUEST`/`HyperbriefCard` emit 전, MUST constellation-board read-tail (§13.16.10 pre-send probe) 실행. inbound 에 이 lineage 의 parent 에 대한 `DECISION_REJECT_FRAMING` 또는 `DEFER` 가 있으면 emit ABORT, parent 결정 state 먼저 surface.

11. **Revisit trigger**: session-start AND 모든 Stop hook AND 6h cron tick 마다 `hyperbrief-revisit` 가 decision-ledger 스캔 — `(revisit_date <= now AND outcome_actual == null)` 또는 `(decision_lineage 의 assumed_invariant 가 최근 A2A 신호로 위반)`. 매치마다 `CUSTOM/HyperbriefRevisit` 카드 emit, 다른 저우선 작업 차단.

12. **Time-pressure fallback**: `deadline - now < 1h` AND `FULL_HYPERBRIEF` 발동 AND 전체 IR 생성이 남은 시간 초과 → 섹션 축약 금지 — `DECISION_DEFER` emit, 이유 = "insufficient time for proper hyperbrief; recommend deadline extension OR autonomous-decision-with-post-notify acceptance".

13. **Frame-rejection 라우팅**: §7 사용자가 reject-framing 클릭 시 main agent MUST decision_id 를 status='framing_rejected' 로 로그, reframing_reason 을 ledger 에 append, 발생 작업을 'requires reframing' 으로 처리 — 약간 수정된 frame 으로 silent retry 금지.

## B.8 Superscalar 인터록 — 직교 게이트 + 직렬 평가

**개념 정리:**

- **Superscalar 게이트**: *"이 fan-out 을 할 가치가 있나"* — 비용 · 편익 · hazard · worktree isolation 계산해 lane 개수와 lane 종류 결정.
- **Hyperbrief 게이트**: *"이 fan-out (또는 단일 행동) 자체를 사용자가 인가해야 하나"* — 비가역성 · blast radius · 외부 통보 · resource · prior 결정 supersede 평가.

두 게이트는 *직교* (서로 다른 차원을 묻는다). 그러나 동일 결정 시점에 *직렬* 로 평가되어야 한다 — Superscalar 의 cost-benefit 이 통과해도 Hyperbrief 게이트가 차단하면 fan-out 대기.

**직렬 평가 순서 (의사코드):**

```
on fan_out_request(intent, lanes):
  # 1단계 — Superscalar cost-benefit gate
  if not superscalar.cost_benefit_gate(intent, lanes):
    return RUN_INLINE   # fan-out 가치 없음

  # 2단계 — Hyperbrief escalation check (Superscalar 게이트 통과 후)
  for lane in lanes:
    if lane.class == 'write' and lane.action in IRREVERSIBLE_ALLOWLIST:
      verdict = hyperbrief.trigger_check(lane.intent)
      if verdict == FULL_HYPERBRIEF:
        superscalar.pause_lane(lane)
        emit DECISION_REQUEST + HyperbriefCard for lane
        await ack_tier='decided' or timeout
        if   user_outcome == reject_framing: superscalar.cancel_lane(lane)
        elif user_outcome == defer:          superscalar.queue_lane(lane, defer_until)
        elif user_outcome == accepted:       superscalar.resume_lane(lane)
        elif user_outcome == investigate:    superscalar.spawn_research_lane(lane)
      elif verdict == MINIMAL_BRIEF:
        emit one-line summary, proceed
      elif verdict == AUTONOMOUS_DECIDE:
        proceed without ask

  # 3단계 — 정상 dispatch
  superscalar.dispatch(lanes)
```

**보완 관계 (서로 강화하는 5 지점):**

1. **Superscalar §3 irreversibility barrier ↔ Hyperbrief MUST-trigger (a)**: Superscalar 는 speculation lane 안에서 비가역 행동을 'default-forbidden' 으로 차단; Hyperbrief 는 irreversibility-score ≥ 2 에서 사용자 가시화 강제 — 같은 차원의 다른 깊이.
2. **Superscalar Lane Manifest ↔ Hyperbrief §0 RAPID**: lane_manifest (intent + gate_dependency + planned_commit_subject + sibling_lanes) 가 RAPID 역할 (recommender = AI, performer = lane, decider = user-on-escalation) 에 직접 매핑. lane 이 hyperbrief escalate 되면 RAPID 의 decider/performer/recommender 명시.
3. **Superscalar §6 adoption thresholds ↔ Hyperbrief alert-fatigue self-throttle**: Superscalar 는 merge-conflict > 15% 시 issue_width_write 하향; Hyperbrief 는 user_acceptance_rate > 70% 시 escalation 임계 상향. 동일 패턴 (운영 시그널 → 정책 조정). Phase 2 권장: 공통 텔레메트리 채널 공유 (Constellation board stats SSE).
4. **Superscalar Entry 06 retire stage ↔ Hyperbrief §9 Decision Capture**: Superscalar 의 retire stage (dedup + consistency gate + completeness critic) 는 lane outcomes 를 단일 결정으로 통합. §9 는 그 결정의 outcome 을 시간축 회고로 폐쇄. Phase 2: Superscalar PM agent 가 retire 직후 `hyperbrief-revisit-schedule` 자동 호출.
5. **Superscalar §2 issue_width_read ↔ Hyperbrief 면제**: Read 전용 fan-out 은 Hyperbrief 게이트 면제 (no side effects). 양 SKILL.md 에 명시 — false-positive 게이팅 차단.

**충돌 가능성 (관리 필요):**

1. **Latency 충돌**: Hyperbrief 가 lane 을 pause 하면 Superscalar 의 latency-hiding 이 무너진다. **해소**: Hyperbrief 는 게이트만 — IR/render 생성은 *백그라운드 speculative lane* 에서 진행 (Superscalar §1 speculation 재사용). `DECISION_REQUEST` envelope 만 즉시 emit. 사용자 응답 대기 중 다른 read lane 과 reversible write lane 은 계속 진행. 사용자 응답 도착 시 retire 시점에 검증.

2. **Decision-flood 충돌**: 한 fan-out 이 5 개 lane 에 5 개 hyperbrief 를 trigger 하면 alert fatigue. **해소**: Superscalar lane_manifest 의 `sibling_lanes` 활용해 Hyperbrief 가 *배치 모드* 발송 — 한 fan-out 의 형제 lane 들을 단일 HyperbriefCard 에 multi-option 으로 통합 (§5 MCDA 의 alternatives 에 각 lane 을 행으로). 사용자는 단일 결정으로 N lane 을 한꺼번에 인가.

3. **Speculative lane 의 hyperbrief 차단**: Superscalar §1 의 speculation lane 이 비가역 행동을 시도하면 (default-forbidden 이지만 allowlist 확장 시) Hyperbrief 가 차단해야. **해소**: speculation allowlist 확장 자체가 hyperbrief MUST-trigger 사안 — Superscalar SKILL.md 에 "speculation allowlist 추가 = configuration decision = hyperbrief 필요" 명시.

**Hyperbrief.md §9 신설 통합 선언 (SSoT 차원):**

> *"Hyperbrief and Superscalar are orthogonal gates evaluated serially at every fan-out decision and at every write/deploy/send action — Superscalar asks 'is this fan-out worth the cost', Hyperbrief asks 'does this require user delegation'. Read-only lanes are exempt from Hyperbrief by construction. Write/deploy/send lanes that pass Superscalar's cost-benefit gate enter Hyperbrief's escalation check; if FULL_HYPERBRIEF, the lane is paused (Constellation DECISION_REQUEST in flight) while sibling reversible lanes continue under Superscalar latency-hiding. Multi-lane batching prevents decision-flood. The retire stage (Superscalar) feeds the decision-capture stage (Hyperbrief §9) automatically, closing the cross-module learning loop."*

## B.9 도입 경로

### EG 본체 (this repo)

1. **v2.5.14 — Hyperbrief 모듈 초기 ship**: `Hyperbrief.md v0.1.0` (루트 SSoT) + `plugins/hyperbrief/` (skill 2 개 + schema + 두 렌더러 + 템플릿) commit. CHANGELOG: "feat(hyperbrief): v0.1.0 — decision-delegation gating SSoT + plugin (skill + IR schema + MD/HTML deterministic renderers; Phase 1)".
2. **v2.5.15 — Constellation A2A allowlist 확장**: `Constellation.md §13.16.9` 에 4 신규 이름 + `HyperbriefCard` 추가; `plugins/constellation/mcp/server.cjs` 의 `a2a_wait_ack` 에 `tier='decided'` 인지 추가; board UI 에 Decision Card zone 추가 (Constellation v0.3.0).
3. **v2.5.16 — Superscalar 인터록 ship**: `Superscalar.md §3 cost-benefit gate` 다음 단계로 "§3b irreversibility-gate → escalate to hyperbrief-trigger-check" 문단 추가; `plugins/superscalar` SKILL.md 에 hyperbrief 게이트 호출 명시.
4. **v2.5.17 — Phase 2 hooks + MCP**: `plugins/hyperbrief/hooks/hooks.json` 활성화 (PreToolUse 매처 = AskUserQuestion / git push / gh release / A2A emit); `plugins/hyperbrief/mcp/server.cjs` 추가 (도구: `hyperbrief_render`, `hyperbrief_validate`, `decision_ledger_append`, `decision_ledger_query`).
5. **v2.5.18 — Dogfood ledger 시작**: `Hyperbrief.md §11` 에 실제 사용 케이스 Entry 01 ~ 05 누적. user_acceptance_rate / Brier score / pre-mortem 입력 길이 분포 등 텔레메트리 공개.

### 어댑터 (Hermes 같은 외부 에이전트 게이트웨이)

Hermes-EG (또는 동급 게이트웨이) 는 외부 에이전트가 EG board 에 join 하는 상시 경로. 도입은 **graceful degradation 우선**:

1. **Level 0 — passthrough**: Hermes 는 `DECISION_REQUEST` / `HyperbriefCard` envelope 을 그대로 외부 에이전트에 relay. 외부가 미인지 시 Constellation §13.16.12 Pattern 7 TEXT_MESSAGE fallback (prefix 표준 line 자동 prepend). 어댑터 코드 0 줄.
2. **Level 1 — outcome-tier shim**: Hermes 가 외부 에이전트의 일반 텍스트 응답을 파싱해 keyword 매칭으로 DECISION_RESPONSE outcome 추정 ('동의/agree' → accepted, '보류/later' → deferred, '거부/no' → rejected). `value.confidence < 1` 메타플래그 부착해 main 에 전달. ~30 줄 shim.
3. **Level 2 — full Hyperbrief consumer**: Hermes 어댑터가 `HyperbriefCard.value.ir` 을 직접 파싱해 외부 에이전트용 native prompt (§6 decision_prompt + §8 recommendation_conditional 만 주입) 로 변환. `ack_tier='decided'` 회신은 외부 에이전트의 회신을 DECISION_RESPONSE envelope 으로 정상 변환. 어댑터 README 에 "Hyperbrief v0.1 conformant" 배지.
4. **공유 라이브러리**: `plugins/hyperbrief/schema/hyperbrief-ir.schema.json` 을 npm `@estregenesis/hyperbrief-ir` 패키지로 published — Hermes 같은 어댑터가 schema validation 을 sharing.

### 외부 사용자 (claude-community marketplace)

Superscalar/Constellation 이 이미 사용한 동일 경로 답습:

1. **자체 호스팅 마켓플레이스 우선**: `/plugin marketplace add SoliEstre/EstreGenesis` → `/plugin install hyperbrief@estregenesis-plugins`. 항상 main 브랜치 최신 추적.
2. **claude-community 마켓플레이스 신청**: v0.2.0 도달 시 (Phase 2 hooks + MCP 검증 후) claude-community 에 PR. 승인 후 `/plugin install hyperbrief@claude-community` 일행 설치.
3. **standalone 모드**: Constellation 없는 환경에서도 동작 — Hyperbrief 는 단독 skill (LLM 이 IR 생성 → 로컬 renderer 가 MD/HTML 생성 → 사용자에게 직접 표시). decision-ledger 는 `.agent/_decisions/` 파일 기반 (Constellation 없을 때 fallback). README 에 "Constellation optional synergy" 명시.
4. **README 빠른 시작**: 설치 후 첫 결정 요청에서 자동 skill 발견 → trigger-check skill 이 escalation 점수 출력 → `FULL_HYPERBRIEF` 시 IR JSON 생성 + 양 형식 렌더 + 사용자에게 두 파일 경로 + 카드 미리보기 제시.
5. **Anthropic plugin discovery listing**: Constellation/Superscalar 와 동일하게 `homepage` 필드를 raw github URL 로 가리켜 LLM-discoverable.

---

## 맺으며 — 모듈 스캐폴딩 다음 단계

합성은 수렴했다. 설계는 구체적으로 크기가 맞춰져 있다 — Phase 1 은 약 12 개 파일 (루트 SSoT 1 + plugin.json 1 + 플러그인 README 1 + SKILL.md 2 + JSON 스키마 1 + 렌더러 2 + 템플릿 2 + 예약 skill SKILL.md 2) 로 ship. Phase 1 commit 은 v2.5.14 에 작은 CHANGELOG 엔트리와 함께 land 가능.

유지자 검토를 위한 권장 다음 액션:

1. **§0 escalation rubric 임계 검증** (sum < 4 → autonomous; sum ≥ 4 → fire) — 이 repo 의 5 ~ 10 개 역사적 결정 시점에 대입해 over-fire (alert fatigue) 도 under-fire (silent risk) 도 없는지 확인.
2. **§9 ledger 저장 결정**: 파일 기반 `.agent/_decisions/` only (Phase 1) vs Constellation `state.json.decisions[]` 부터 v0.1 (Phase 1 + Constellation v0.3.0 한 사이클).
3. **Phase 2 scope 분할 결정**: hooks-only (빠름) vs hooks + MCP 서버 (무겁지만 IR validation 을 도구로 unlock). MCP 도구 `hyperbrief_validate` 가 있으면 *다른* 에이전트가 emit 전 Hyperbrief IR 을 validate 할 수 있어 Hermes Level-2 어댑터에 유용.
4. **Constellation §13.16.9 allowlist 확장이 adopter 프로젝트의 in-flight A2A intent name 과 충돌하지 않는지 검증** (4 신규 이름은 충분히 unique 하지만 1 패스 체크 권장).
5. **Brier-score baseline 설정** — §11 dogfood ledger 에 첫 결정들이 캡처되면 초기 calibration 설정. 이 시점에 adopter 가 "AI confidence 가 누적 정확도에 의해 재가중된다" 를 사용자 대면 trust 메커니즘으로 인지하도록.

본 묶음은 `Hyperbrief.md` 의 v2.5.14 최상위 모듈 흡수와 위에서 설명한 Constellation / Superscalar / state.json 의 3 가지 연결 확장을 요청한다. Closure log 는 유지자 결정 시 `_proposals/006_2026-06-03_hyperbrief/README.md` 에 갱신된다.

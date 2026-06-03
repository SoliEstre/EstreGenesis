# Hyperbrief — 6 축 딥리서치

> Hyperbrief 모듈의 토대 문서. 다음 질문에 대해 6 개의 독립 학제 축을 각각 탐색했다: *"결정 위임 브리핑이 동의를 사후 강요하는 sycophantic 장치가 아니라 정당한 위임 의례가 되려면 어떤 규율을 따라야 하는가?"* 각 축은 자체 core insights, prompting implications, structural recommendations, pitfalls, concrete rules, 그리고 의존하는 cross-axis connections 를 산출. 다음 문서 (002) 가 이들을 8 섹션 사양과 모듈 설계로 합성한다.

축 목록:

1. **AI 하니스 (AI Harness)** — LLM 이 sycophancy bias 와 reasoning collapse 를 견디는 브리핑을 만들도록 강제하는 방법.
2. **인문학 (Humanities)** — AI 가 사람에게 결정을 묻는 행위의 의사소통적 정당성 (Habermas / Gadamer / Arendt / Ihde / Sennett / Floridi).
3. **심리학 (Psychology)** — 브리핑의 형식 자체가 유발하는 인지편향 (anchoring / framing / IKEA effect / availability / alert fatigue).
4. **경영학 (Management)** — 60 년의 결정 품질 문헌 (Bezos Type 1/2 / Drucker boundary conditions / Saaty AHP / Klein pre-mortem / Snowden Cynefin / Annie Duke decision journal / Bain RAPID / Real Options).
5. **철학 (Philosophy)** — "중대" 의 규범적 정의와 브리핑이 내장해야 할 인식적 겸손 장치 (Jonas / Toulmin / Bayesian calibration / Popper / Aristotle phronesis / Rawls / precautionary principle).
6. **장기 개발론 (Long-Horizon Development)** — 같은 결정이 6 개월 후 우리에게 어떤 비용을 부담시키는가 (코드 차원의 Bezos one-way door / Hyrum's law / Fowler 기술부채 분면 / Lehman 진화법칙 / Postel's law 비판 / ADR + decision lineage / observability cost).

---

## 축 1 — AI 하니스 (AI Harness)

### 렌즈

AI 에이전트가 결정 위임 시 발생시키는 "정보 비대칭 → 강제 동의" 패턴은 본질적으로 **프롬프트·시스템 프롬프트 설계의 forcing-function 부재** 에서 비롯된다. Hyperbrief 는 "보고서를 잘 써라" 가 아니라 *"이 스키마 없이는 결정을 요청할 수 없다"* 는 LLM 측 출력 트리거를 메타 수준에서 강제하는 게이팅 장치다.

### Core insights

**1. 결정 위임은 '결정-요청 액션' 으로 명시적 분류되어 시스템 프롬프트의 forcing-function 에 의해 게이팅되어야 한다.** 자유 서술 안에 끼어든 "어떻게 할까요?" 는 모두 invalid output 으로 거부.

*근거.* Anthropic prompt-engineering best practices 의 'explicit instruction + structured output' 원칙 + OpenAI function-calling 류 schema-enforced output 패턴. 자유 서술 안에서는 LLM 이 sycophancy bias 로 결정을 사용자에게 떠넘기되 자료는 생략하는 경향이 강함 (InstructGPT 의 helpfulness-overconfidence 패턴). 출력 형식 자체를 schema 로 잠그면 누락 필드가 곧 invalid 가 되어 모델이 *자기 보강을 강제* 당함.

*함의.* Hyperbrief 는 markdown 서식 가이드가 아니라 **JSON 스키마 기반 intermediate representation 을 먼저 생성하고 그 위에 MD/HTML 렌더러를 얹는 2 단 파이프라인** 이어야 한다. 섹션 1~8 각각이 schema 의 required field 이며, 비어 있으면 렌더링 자체가 실패해야 한다.

**2. LLM 은 자기가 아는 것과 모르는 것의 경계를 단편적으로 흘리는 경향이 강하다.** '왜' 섹션과 '결과 예상' 섹션에는 evidence-grounding tag (출처 / 추론 / 추정 / 불확실) 를 메타 필드로 의무화해야 한다.

*근거.* Anthropic 의 Constitutional AI self-critique loop + 'calibrated uncertainty' 연구 (Lin et al., 2022, *Teaching Models to Express Their Uncertainty in Words*). 모델은 명시적으로 'confidence 를 label 로 출력하라' 는 지시를 받을 때만 calibration 이 유의미하게 개선됨. 자유 서술에서는 epistemic status 가 동일한 평서문 어조로 뭉뚱그려져 사용자에게 false certainty 를 주입한다.

*함의.* 각 주장 옆에 `[verified | inferred | assumed | unknown]` 4 단계 epistemic tag 를 inline 으로 강제. HTML 렌더에서는 색상 코드, MD 에서는 emoji-free 텍스트 마커. 사용자는 'assumed' 비율이 임계치를 넘으면 결정 보류를 빠르게 선택할 수 있어야 함.

**3. '권장 방향 (§8)' 을 마지막에 두면 anchoring effect 로 인해 1~7 을 형식적으로 훑고 §8 만 보는 사용자 행동이 유도된다.** 권장 방향은 §7 판단기준 트리의 **함수** 로 derive 되도록 의존성을 강제해야 한다.

*근거.* Anthropic 의 'chain-of-thought before answer' 원칙 + Self-Refine (Madaan et al., 2023) 의 '결론을 먼저 쓰면 reasoning 이 정당화 모드로 전환된다' 는 발견. 결론을 먼저 commit 하면 LLM 은 그 결론을 옹호하는 방향으로만 evidence 를 선별. 구조적 해결책은 `§8 = f(§7)`.

*함의.* §8 은 자유 서술이 아니라 §7 분기 트리의 노드 ID + 가중치를 인용하는 형태 — `recommendation = aggregate(node_id_subset, weights)`. 노드 ID 인용 없는 권장 문장은 invalid.

**4. 에이전트의 '자기 시각에서 본 충분함' 과 사용자의 '결정에 필요한 충분함' 은 구조적으로 비대칭.** 브리핑 생성 직후 **self-elicitation** 단계에서 '사용자가 이 브리핑만으로 결정 못 할 가능성이 가장 큰 정보 누락 3 개' 를 모델 스스로 나열하게 한 뒤 본문에 반영해야 한다.

*근거.* Self-Refine + Reflexion (Shinn et al., 2023) 의 self-critique-then-revise 패턴. 1-shot 생성은 ego-centric bias 가 강해 sender 의 정보 우위를 그대로 받아들이게 만듦. 명시적 devil's advocate 프롬프트가 들어가야 receiver-perspective gap 이 채워짐.

*함의.* 파이프라인: hidden draft → self-critique ("이 브리핑 받는 사람이 못 물어볼 질문 3 개는?") → revise → 최종 출력 (사용자 노출). self-critique 로그는 디버그용으로 보존.

**5. '간단 개요 (§1)' 와 '3 줄 요약 (§6)' 은 기능이 중첩** 되며 LLM 은 두 곳에서 거의 동일 문장을 복제하는 경향이 강함. 두 섹션의 역할을 **상황 frame** 과 **decision prompt** 로 명확히 분리해야 한다.

*근거.* 프롬프트 엔지니어링의 'redundant instruction → diluted compliance' 패턴. 동일 목적의 섹션이 2 개면 모델은 둘 중 하나에만 진짜 정보를 넣고 다른 하나는 표면 paraphrase 로 처리. Anthropic prompt-eng 가이드의 'one job per section' 원칙.

*함의.* §1 = "상황 frame (왜 지금 결정이 필요한가, 마감 / 제약)", §6 = "decision prompt (사용자가 답해야 할 정확한 질문 1 개 + 선택지 N 개의 1 줄 요약)". 두 섹션의 의미적 중복을 schema validator 가 cosine similarity 임계치로 자동 검사.

**6. '중대분기 / 중요사항' 판정을 모델에게 맡기면 false-negative (중요한데 그냥 결정해버림) 와 false-positive (사소한데 매번 브리핑) 양쪽이 모두 발생** 한다. 브리핑 발동 트리거를 **명시적 rubric** 으로 system prompt 에 박아야 한다.

*근거.* Anthropic 의 'criterion-based gating' 패턴. 'important 한 결정은 보고하라' 처럼 형용사 기준은 LLM 마다 · 세션마다 drift 가 큼. '비가역성, blast radius, time-to-detect, 비가역 자원 소비 임계' 같은 조작적 기준이 안정적.

*함의.* Trigger rubric 을 모듈 SSoT 에 5 개 조건 (비가역성 / blast radius / 외부 통보 / 리소스 임계 / 이전 결정 번복) 으로 명문화. 각 조건은 yes/no 판정 가능. 1 개 이상 yes 면 Hyperbrief 강제, 0 개면 자체 결정 후 사후 통보.

**7. 선택지 (option set) 는 LLM 이 2~3 개로 자의적으로 좁히는 경향** 이 있어 사용자의 실질 선택권을 침해한다. '제시한 선택지 외 사용자 자유 입력' 필드와 '의도적으로 제외한 선택지와 그 사유' 를 의무 필드로 둬야 한다.

*근거.* Tversky & Kahneman 의 option framing 과 anchoring. LLM 은 helpful-mode 에서 '깔끔한 2~3 개 선택지' 를 선호 — 이는 사용자에게 false dichotomy 강요. Self-elicitation 으로 'pruned option + 이유' 를 surface 시키면 사용자가 그 가지를 되살릴 수 있음.

*함의.* §7 분기 트리에 'pruned branches' sub-section 추가. §8 권장 방향 옆에 '이 외 옵션을 원하면 어떤 정보가 추가로 필요한가' 자유 입력 prompt 명시. HTML 에서는 'show pruned' toggle 제공.

**8. MD/HTML 양형 출력을 두 번 생성하면 drift 발생.** 단일 IR (intermediate representation) 에서 두 형식을 **deterministic 하게 렌더링** 해야 한다.

*근거.* LLM 의 stochastic sampling 특성 + 'multiple generation = inconsistency' 일반 원칙. Constellation 의 attachment transport-mode discipline (§13.11) 과도 정합 — 동일 자료의 다중 표현은 source-of-truth 를 분리하면 안 됨.

*함의.* 파이프라인: `LLM → Hyperbrief JSON (IR) → MD renderer / HTML renderer (둘 다 deterministic 코드)`. LLM 은 JSON 만 생성. mermaid 다이어그램과 chart.js 데이터도 JSON 내 데이터 필드로 표현, 렌더러가 코드 생성.

**9. Constellation 카드 임베드 시 'sender = decision-requester agent, receiver = user, ack semantics = decision-recorded' 로 A2A 프로토콜에 정렬되어야 함.** 단순 텍스트 카드로 임베드하면 결정 추적성과 redelivery 보장이 무너진다.

*근거.* Constellation §13.13.2 at-least-once relay + §13.11 attachment-mode 원칙. 결정은 본질적으로 stateful event 이고, sender agent 는 user 의 ack (= 결정) 를 받기 전까지 pending 상태여야 함. 자유 텍스트 카드는 ack 의미를 잃어버림.

*함의.* Hyperbrief 카드는 별도 A2A 메시지 타입 `DECISION_REQUEST` 로 정의. ack tier 3 단 (received / acknowledged / decided) 으로 확장. 사용자의 결정은 `DECISION_RESPONSE` 로 반환되어 sender agent 의 pending queue 를 해소.

**10. 장문 briefing 은 LLM 의 'reasoning collapse' (긴 출력 후반부에 token-level quality 저하) 에 취약** 하므로 8 섹션을 한 번에 생성하지 말고 단계별 생성 + 병합으로 분할해야 한다.

*근거.* Long-context generation degradation 연구 + Anthropic 의 'decompose complex tasks into subtasks' 원칙. 한 turn 에 8 섹션을 모두 생성하면 후반 섹션 (권장 방향, 분기 트리) 이 hand-waving 경향. Self-Refine 처럼 각 섹션을 individual subtask 로 처리하면 quality 일관성 유지.

*함의.* 내부 파이프라인: (a) trigger rubric 판정 → (b) §1 · §6 작성 (frame + decision prompt) → (c) §2 · §3 · §4 작성 (무엇을 / 어떻게 / 왜) → (d) §5 작성 (결과 예상) with epistemic tags → (e) §7 작성 (분기 트리) → (f) §8 = f(§7) 도출 → (g) self-critique → (h) IR 확정 → (i) 렌더. 사용자에게는 최종 결과만 노출.

### Prompting implications

- 시스템 프롬프트 최상단에 **decision-delegation gating rule** 명시: 사용자에게 결정을 묻는 모든 출력은 Hyperbrief schema 를 통과한 IR 에서만 렌더링 가능. 자유 서술 안의 의문문은 invalid output.
- Trigger rubric 5 개 조건 (비가역성 / blast radius / 외부 통보 / 리소스 임계 / 번복) 을 명시적 체크리스트로 system prompt 에 박고, 매 결정 요청 직전에 모델이 yes/no 5 개를 출력하도록 강제. 1 개 이상 yes 일 때만 Hyperbrief 발동.
- 각 섹션 작성 후 모델에게 `[verified | inferred | assumed | unknown]` epistemic tag 를 inline annotation 으로 부착하도록 지시. 무태그 문장은 validator 에서 reject.
- Self-critique 단계 강제: 'draft → 사용자가 이 브리핑만으로 결정 불가능할 가능성이 가장 큰 정보 누락 3 개 식별 → 본문 보강 → 최종 출력'. 3 단을 시스템 프롬프트의 hidden chain 으로 명시.
- 권장 방향 (§8) 작성 시 "반드시 §7 분기 트리 노드 ID 를 인용하라" 는 제약을 system prompt 에 명시. ID 인용 없는 권장은 invalid.
- 선택지 작성 시 `presented_options` 와 `pruned_options + 제외 사유` 를 모두 의무 필드로 두어 helpful-mode 가 자의적으로 좁히는 false dichotomy 차단.
- LLM 은 IR (JSON) 만 생성하도록 출력 형식 잠그고, MD/HTML 렌더는 deterministic 코드가 담당. 'mermaid 다이어그램 그려라' 를 모델에게 시키면 동일 결정에서도 그림이 달라진다.
- Constellation 카드 임베드 시 `DECISION_REQUEST` / `DECISION_RESPONSE` A2A message type 을 system 수준에서 인식하도록 프롬프트에 명시. 일반 텍스트 메시지로 fallback 되면 결정 추적성 손실.
- Sycophancy bias 억제 지시 명시: "사용자에게 결정을 묻기 전, 네가 결정 가능한 범위면 결정 후 사후 통보하라. *묻는 것이 default 가 아니다.*"
- Trigger 발동 후 브리핑 생성에 실패하면 (예: 충분한 정보가 없음) '브리핑 불능 → 추가 조사 필요 → 사용자에 추가 조사 승인만 요청' escalation 경로 명시. 정보 부족 상태로 결정 요청하는 것이 가장 큰 실패 모드.

### Structural recommendations

- 8 섹션 원안 재배열: (1) 상황 frame [왜 지금 결정?] → (6 → 2 번 자리) decision prompt [답해야 할 질문 + 선택지 1 줄] → 무엇을 / 어떻게 / 왜 → 결과 예상 (epistemic tag) → 분기 트리 → 권장 방향. '간단 개요' 와 '3 줄 요약' 의 역할 분리.
- Trigger rubric 결과 (yes/no 5 개) 를 브리핑 상단 메타박스로 표시. 사용자가 '왜 이게 결정 위임 대상인가' 를 즉시 검증 가능.
- 각 섹션 옆에 epistemic tag 분포 미니 차트 (chart.js doughnut) 를 HTML 에 표시. '이 브리핑은 70% verified, 20% assumed, 10% unknown' 한눈에.
- 분기 트리 (§7) 는 mermaid flowchart 로 렌더하되, 각 leaf 노드에 체크박스 + 노드 ID 부착. 권장 방향 (§8) 은 '체크된 노드 ID 조합 → 권장 결과' 매핑 테이블로 표현.
- Pruned options 섹션을 collapsible 로 추가. 기본 접힘, '다른 선택지가 더 있나?' 클릭 시 펼쳐짐. 모델이 임의로 좁힌 선택지를 사용자가 회수.
- 결정 마감 (time-to-decide) 과 결정 비가역성 지표를 상단 배지로 표시. '24h 내 결정 필요, 비가역도 8/10' 형식.
- Constellation 카드는 collapsed 헤더 (상황 frame + decision prompt + 마감 + 비가역도) 만 노출, 본문은 'expand to brief' 클릭 시 전개. 사용자 inbox 폭증 방지.
- MD 출력은 GitHub-flavored 표준 + mermaid 블록만 사용. HTML 출력은 self-contained (인라인 CSS/JS) 로 첨부 · 아카이브 가능.
- 결정 응답 폼을 HTML 하단에 임베드: 선택지 라디오 + 자유 입력 + '브리핑 부족, 추가 조사 요청' 3 가지. 응답은 `DECISION_RESPONSE` A2A 메시지로 자동 변환.
- Self-critique 로그는 별도 collapsed footer 에 'agent's own uncertainty notes' 로 노출. 모델이 본인 답에 갖는 의심을 사용자가 볼 수 있어야 함.

### Pitfalls

- **Schema-cosplay** — LLM 이 brief 를 free-form prose 로 생성하고 8 섹션 헤더만 형식적으로 붙이는 실패. Schema validator 로 각 필드 타입 · 필수 · 관계 제약을 강제하지 않으면 발생.
- **Sycophancy 과잉 위임** — 모든 결정을 사용자에게 토스. Trigger rubric 없으면 Hyperbrief 자체가 결정 회피 도구로 전락.
- **Calibration collapse** — 모델이 안전빵으로 모든 정보를 [assumed] 로 마킹. Few-shot 예시와 tag 분포 임계치 모니터링 필요.
- **Motivated reasoning** — 권장 방향을 먼저 마음속에서 정해놓고 §1~§7 을 정당화. 단계별 생성과 `§8 = f(§7)` 의존성 강제로만 차단.
- **MD ↔ HTML drift** — 두 형식을 각각 free-form 으로 생성하면 동일 결정에서 다른 권장.
- **Attention collapse** — 사용자가 분기 트리 안 읽고 권장만 봄. 노드 ID 인용 없는 권장은 트리 건너뛰기 허용.
- **A2A type fallback** — 일반 TEXT_MESSAGE 로 fallback 되면 결정 추적 · redelivery 손실. `DECISION_REQUEST` 미인지 adopter 에 대한 graceful degradation 미설계 위험.
- **후반부 reasoning collapse** — 긴 brief 후반의 분기 트리 · 권장이 hand-waving. 단계별 생성으로만 완화.
- **모호한 trigger 조건** — false-positive 로 사소한 결정에도 매번 brief → alert fatigue. 조건의 조작적 정의가 매우 중요.
- **빈 pruned options 통과** — false dichotomy 강요. Validator 는 'pruned 0 개인가, 명시 안 한 것인가' 구분 못 함 — 0 개일 때 명시적 선언 강제.

### Concrete rules

- **MUST**: 사용자에게 결정을 요청하는 모든 출력은 Hyperbrief JSON IR 을 통과. Free-form 의문문은 invalid.
- **MUST**: Hyperbrief 발동 전 Trigger rubric 5 개 조건에 yes/no 판정 출력. 1 개 이상 yes 일 때만 발동. 0 개면 자체 결정 + 사후 통보.
- **MUST**: 모든 사실 주장과 예측에 `[verified | inferred | assumed | unknown]` 4 단계 epistemic tag inline. 무태그는 invalid.
- **MUST**: 권장 방향 (§8) 은 §7 분기 트리 노드 ID 를 최소 1 개 이상 인용. 무인용 권장은 invalid.
- **MUST**: LLM 은 Hyperbrief IR (JSON) 만 생성. MD/HTML 렌더는 deterministic 코드 렌더러가 담당. LLM 이 직접 MD/HTML 생성 금지.
- **SHOULD**: 브리핑 생성 파이프라인은 3 단 hidden chain (draft → self-critique '누락 3 개' → revise).
- **SHOULD**: 선택지에는 `presented_options` 와 `pruned_options + 제외 사유` 모두 포함. Pruned 0 개일 때는 명시적으로 0 개임을 선언.
- **SHOULD**: Constellation 카드 임베드는 `DECISION_REQUEST` / `DECISION_RESPONSE` A2A 메시지 타입 사용. 일반 TEXT_MESSAGE fallback 시 transport tier 에 '결정 응답 필요' 메타플래그 명시.

### Cross-axis connections

- **심리학**: epistemic tag · trigger rubric 은 사용자 인지편향 완화 도구이기도 함. AI Harness 는 '모델이 어떻게 그 tag 를 생성하도록 만드는가' 를, 심리학은 'tag 분포가 사용자 결정에 어떤 인지적 영향을 주는가' 를 다룸.
- **철학**: Trigger rubric 의 '비가역성 · blast radius' 5 개 조건은 중대 사고규칙 (철학) 에서 도출되어야 하며, AI Harness 는 그것을 LLM 이 운영 가능한 yes/no 체크리스트로 변환.
- **경영학**: `§8 = f(§7)` 의 함수적 derivation 패턴은 의사결정 방법론 (decision matrix, weighted scoring) 에 의존. AI Harness 는 그 함수를 LLM 이 정직하게 적용하도록 강제하는 프롬프팅 규율 담당.
- **인문학**: 결정 위임 시 사용자의 '판단 주권' 을 보호한다는 전제는 인문학 축. AI Harness 는 그 전제를 system prompt 수준의 forcing-function 으로 번역.
- **장기 개발론**: Hyperbrief IR (JSON) → MD/HTML 렌더의 2 단 파이프라인 설계, Constellation 카드 A2A 타입 신설은 장기 개발 판단과 직결. AI Harness 는 'LLM 출력 결정성 보장' 비기능 요구를 제공.

---

## 축 2 — 인문학 (Humanities)

### 렌즈

Hyperbrief 는 "AI 가 사람에게 결정을 묻는다" 는 의사소통 행위 그 자체의 의미론을 다룬다. 이 축은 그 물음이 정당한 위임이 되기 위한 인문학적 전제 — Habermas 의 타당성 주장 (진실 · 정당성 · 진정성 · 이해가능성), Gadamer 의 해석학적 선이해 명시화, Ihde 의 도구 매개 가시화, Arendt 의 결정 주체성 회복 — 을 점검하여 모듈이 "결정 동의 강요 장치" 가 아니라 **"진정한 위임 의례"** 로 작동하도록 한다.

### Core insights

**1. 결정 위임 요청은 의사소통 행위이며, Habermas 의 4 가지 타당성 주장 (진실 · 정당성 · 진정성 · 이해가능성) 을 모두 충족해야 정당한 위임이 된다.**

*근거.* Habermas, 『의사소통행위이론』 (1981) — 모든 발화 행위는 (1) 객관 세계에 대한 진실 (Wahrheit), (2) 사회적 규범에 대한 정당성 (Richtigkeit), (3) 화자의 내적 의도에 대한 진정성 (Wahrhaftigkeit), (4) 명료한 이해가능성 (Verständlichkeit) 이라는 4 중 타당성 주장을 동반. 어느 하나가 실패하면 합의가 아니라 전략적 행위 (은폐된 강제) 가 된다.

*함의.* 8 섹션은 이 4 축에 매핑되어야 한다. '무엇을 · 어떻게' (진실) / '왜 · 결과예상' (정당성) / '권장방향 + 자기이해관계 공시' (진정성) / '3 줄 요약 · 체크박스' (이해가능성). **진정성 축이 원안에 빠져 있다** — 에이전트의 선호 · 신뢰도 · 사각지대를 명시하는 '에이전트의 자기공시 (self-disclosure)' 섹션 추가가 필요하다.

**2. 이상적 담화 상황 (ideal speech situation) 의 부재 — 시간 압박과 정보 비대칭 하의 결정 요청은 '비강제적 합의' 가 아니라 '동의의 외양을 띤 강제' 다.**

*근거.* Habermas 의 이상적 담화 상황 조건: 모든 참여자의 동등한 발언 기회 · 반박 가능성 · 외부 강제로부터의 자유. AI → 인간 결정 위임은 구조적으로 비대칭 (에이전트가 정보 · 시간 · 프레임 모두 통제) 이므로 의도하지 않게 강제적이 된다.

*함의.* Hyperbrief 는 '반박 가능성' 을 구조적으로 보장해야 한다 — (a) '이 브리핑의 한계 / 누락 가능성' 명시 섹션, (b) '더 알고 싶다면 무엇을 물어야 하는가' 역질문 가이드, (c) '결정 보류 / 연기' 옵션을 권장방향과 동등하게 제시. 권장방향 단독 강조는 외부 강제로 작동.

**3. 해석학적 선이해 (Vorverständnis) 없는 정보 제시는 사용자에게 '판단의 지평' 을 부여하지 못한다 — 사실 나열은 이해가 아니다.**

*근거.* Gadamer, 『진리와 방법』 (1960) — 이해는 백지에서 시작하지 않고 선이해 (편견 · 지평) 에서 출발해 텍스트의 지평과 융합 (Horizontverschmelzung). 선이해 없이 던져진 정보는 의미화되지 못한다.

*함의.* '간단 개요' 섹션은 단순 요약이 아니라 **'사용자가 이 결정을 바라봐야 할 지평 (맥락 · 역사 · 이전 결정과의 연속성)'** 을 명시해야 한다. 'X 결정의 일환이며 Y 가정 위에 서 있고 Z 이전 결정을 전제한다' 형식. 맥락 없는 결정은 결정이 아니라 추측.

**4. 에이전트의 '권장방향' 제시는 Gadamer 의 의미에서 이미 해석된 결과** — 그 해석의 전제 (선이해 · 프레이밍) 가 투명화되지 않으면 사용자는 에이전트의 지평을 자기 지평으로 오인한다.

*근거.* 해석학적 순환 (hermeneutic circle): 부분의 이해는 전체에 의존하고 전체의 이해는 부분에 의존. 권장은 항상 '이미 어떤 전체상 안에서의 부분 추천'.

*함의.* §8 권장방향은 반드시 '이 권장이 서 있는 전제 3 가지' 를 동반. '만약 전제 A 가 거짓이면 권장은 뒤집힌다' 조건문 형식. 권장의 '근거' 가 아니라 권장의 '취소 조건 (defeater)' 을 명시하는 것이 해석학적으로 정직하다.

**5. 도구 매개성 (technological mediation) 의 비가시화 — AI 브리핑은 세계를 '직접 보는' 것이 아니라 AI 를 '통해' 보는 것이며, 이 매개의 두께가 가려지면 사용자는 자기 판단으로 착각한다.**

*근거.* Don Ihde, 『Technology and the Lifeworld』 (1990) — 도구의 '체현 관계 (embodiment relation)' 는 도구가 투명해질수록 강해지고, 사용자는 도구의 프레임을 자기 프레임으로 동화. AI 브리핑은 가장 강력한 체현 도구.

*함의.* 각 섹션 끝에 '이 정보가 어떻게 산출되었는지 (소스 · 추론 단계 · 불확실성 수준)' 의 매개 흔적을 남겨야 한다. `[관찰]` · `[추론]` · `[외부 출처 인용]` · `[에이전트 추론]` 을 구분하는 출처 마킹 (provenance tagging) 의무화. 매개의 가시화 없는 브리핑은 사용자를 AI 의 분신으로 만든다.

**6. 결정은 Arendt 적 의미에서 '시작 (initium)' 의 공적 행위** — 결정자는 행위의 비가역성 · 예측불가능성을 떠안는 자. AI 에게 결정을 위임받는 인간은 이 부담의 정확한 윤곽을 알 권리가 있다.

*근거.* Arendt, 『인간의 조건』 (1958) — 행위 (action) 는 시작 · 비가역성 · 예측불가능성을 본질로 한다. 행위자만이 행위의 '누구 (who)' 를 드러낸다. 결정의 위임은 이 'who' 의 위임이기도 하다.

*함의.* §5 '결과 예상' 은 단순 확률 나열이 아니라 *'비가역성의 정도 (rollback 가능성)' · '영향 범위 (누가/무엇이 영향받는가)' · '책임 귀속의 명확성'* 을 구분해 제시. '되돌릴 수 있는 결정인가, 되돌릴 수 없는 결정인가' 를 가장 먼저 시각적으로 표시.

**7. Sennett 의 의미에서 좋은 협업은 '대화적 (dialogic)' 이지 '변증법적 (dialectic)' 이지 않다** — 합의를 강요하지 않고 차이를 유지하며 함께 만드는 과정이다. 권장방향 단일 제시는 변증법적 (합으로의 수렴) 이며 대화를 죽인다.

*근거.* Sennett, 『Together』 (2012) — 장인의 협업은 'subjunctive' 어법으로 '~ 한다면 어떨까' 를 유지. 단정은 협업을 종료시킨다.

*함의.* §8 은 '권장방향' 이 아니라 '여러 정당한 길과 각각의 트레이드오프' 로 재구성. 하나의 권장 + 'why not 대안들' 의 명시적 기각 사유. 사용자에게 '나는 다르게 본다' 고 말할 수 있는 어법적 공간을 텍스트 구조로 보장.

**8. 위임받는 자의 '거부할 권리 (right to refuse the question)' 가 보장되지 않으면 위임은 위임이 아니다** — 정보윤리상 '동의' 는 거부 가능성을 전제로만 동의.

*근거.* Floridi, 『The Ethics of Information』 (2013) — 정보적 행위자의 자율성은 '응답하지 않을 자유' 를 포함. 강제된 응답은 자율의 외양일 뿐. 의료윤리의 informed consent 4 요건 중 '자발성 (voluntariness)' 에 해당.

*함의.* Hyperbrief 는 모든 결정 요청에 '이 질문 자체를 반려 (reject the framing)' / '결정을 보류 (defer)' / '더 조사 요청 (request more investigation)' 메타 옵션을 §7 분기트리의 최상위 분기로 의무 포함. yes/no/which-option 만 제시하면 이미 프레임이 강제된 상태.

**9. 8 섹션 원안의 순서는 '권장으로의 인지적 활강 (cognitive slide)' 구조** — 마지막에 권장이 오면 앞 7 섹션이 정당화 장치로 환원되고 사용자는 사실상 권장에 동의하게 된다.

*근거.* 수사학적 정렬 (rhetorical disposition) 전통 — 고대 수사학에서 결론을 마지막에 두는 것은 설득의 기법. 결정 위임에서 이는 *설득이 되어선 안 된다*.

*함의.* 권장방향 (§8) 은 '판단 후 검증용' 으로 위치하거나, 권장과 동시에 '권장에 반대하는 가장 강한 논거' 를 병기. Pre-mortem 형식으로 '6 개월 후 이 권장이 틀렸다면 왜 틀렸을까' 를 §8 안에 의무 포함.

**10. 브리핑의 '3 줄 요약 (§6)' 은 인문학적으로 가장 위험한 섹션** — 압축은 항상 해석이며, 요약자가 본 것이 결정자가 본 것으로 동화된다.

*근거.* Gadamer 의 'Wirkungsgeschichte (영향사)' — 텍스트는 그것이 어떻게 받아들여져 왔는가의 역사 안에서만 의미를 가진다. 3 줄 요약은 미래 영향사를 선규정한다.

*함의.* 3 줄 요약은 (a) 사실 1 줄 + (b) 쟁점 1 줄 + (c) '이 요약이 놓치는 것 1 줄' 3 구조로 강제. 또는 3 줄 요약을 '에이전트 관점 요약' 과 '반대 관점 요약' 의 2 쌍으로 제시. 단일 요약은 해석학적 폭력.

### Prompting implications

- 에이전트는 결정 요청 시 'I recommend X' 어법 전에 'I see this through the lens of [선이해 명시]' 자기공시를 강제 — 시스템 프롬프트에 '권장 전 선이해 공시' 의무 조항.
- 권장방향에는 항상 '이 권장이 뒤집히는 조건 3 가지 (defeaters)' 동반. 'X 를 권장하지만 만약 A · B · C 중 하나라도 참이면 권장은 무효'.
- 각 사실 주장에 출처 태그 강제: `[관찰]` / `[추론]` / `[외부 source]` / `[가정]`. 무태그 진술 금지. 사용자가 매개의 두께를 시각적으로 인지하도록.
- 결정 분기 트리 (§7) 생성 시 최상위 분기에 반드시 `reject-this-framing` / `defer` / `request-deeper-investigation` 메타옵션을 hardcode.
- 에이전트가 'urgent' · 'critical' · 'must decide now' 어휘를 사용할 때, Hyperbrief 는 자동으로 '이 긴급성의 근거는 무엇인가 — 외부 데드라인인가 에이전트의 추정인가' 메타 섹션 삽입.
- 3 줄 요약 생성 시 '에이전트 관점' + '가상의 반대자 관점' 2 쌍 강제. 단일 요약 금지.
- 권장방향 직전에 pre-mortem 1 문단 의무화: '6 개월 후 이 결정이 실패로 판명된다면, 가장 가능성 높은 이유는?' 비어 있거나 무성의하면 브리핑 거부.

### Structural recommendations

- §1 '간단 개요' 를 **'맥락 지평 (context horizon)'** 으로 재명명 — 결정이 서 있는 이전 결정 · 전제 · 역사적 연속성을 명시. 단순 한줄 요약은 Gadamer 적으로 부족.
- §0 (신설) **'에이전트 자기공시'** 섹션 — (a) 이 브리핑의 정보 한계, (b) 에이전트가 이 결정에 갖는 이해관계 / 선호, (c) 에이전트가 답을 모르는 부분의 명시. Habermas 진정성 충족.
- §5 '결과 예상' 에 비가역성 메트릭 시각화 — 'rollback 가능 (녹) / 부분 가능 (황) / 비가역 (적)' 신호등 + Arendt 적 '영향받는 행위자 범위' 다이어그램.
- §7 분기 트리 최상위에 **'메타 분기'** 노드 의무화 — `결정-수락` / `결정-보류` / `프레임-반려` / `추가조사-요청`. yes/no 만 있는 트리는 사실상 강제.
- §8 '권장방향' 을 `recommendation + defeater conditions + premortem` 3 블록으로 분할. 단일 권장 금지.
- 각 섹션에 'provenance footer' — 이 섹션의 정보가 `[관찰 / 추론 / 외부 / 가정]` 중 어디서 왔는가의 비율 막대그래프 (chart.js).
- HTML 출력에서 권장방향 섹션은 '반대 논거 토글' 을 기본 expanded — collapsed default 는 수사적 편향.
- 3 줄 요약을 '에이전트 관점 vs 가상 반대자 관점' 2 열 테이블로 시각화. mermaid 단순 flowchart 보다 대조표가 해석학적으로 정직.
- MD/HTML 헤더에 '이 브리핑을 거부할 권리 (이 질문 자체에 답하지 않아도 됩니다)' 고지문 의무 — Floridi 자발성의 가시화.

### Pitfalls

- 권장방향 단독 강조 → 사용자가 권장에 형식적 동의만 하는 '의례적 결정' 으로 전락. 8 섹션이 정당화 장치로 축소되어 위임의 외양만 갖춘 강제가 됨.
- 선이해 / 맥락 공시 없는 사실 나열 → 사용자는 '판단했다' 고 느끼지만 실제로는 에이전트의 프레이밍을 그대로 답습. 해석학적 자기소외.
- 출처 / 매개 마킹 부재 → 에이전트 추론과 외부 사실이 동일한 시각적 무게로 제시되어 사용자는 매개의 두께를 인지 못 함. Ihde 의 체현 관계가 비가시화.
- yes/no/option-A/B 분기만 제공 → `reject the framing` 옵션 부재로 메타 거부 불가. 모든 응답이 이미 에이전트가 정한 프레임 안.
- 긴급성 어휘 무비판 수용 → 에이전트가 'urgent' 라고 선언하면 이상적 담화 상황의 외부 강제 부재 조건이 즉시 무너짐. 시간 압박은 가장 흔한 강제 메커니즘.
- 3 줄 요약의 단일 시점화 → 미래 영향사 (Wirkungsgeschichte) 를 에이전트가 사전 결정. 압축이 항상 해석임을 잊고 압축을 '중립 요약' 으로 오인.
- 비가역성 미구분 → rollback 가능한 결정과 불가능한 결정이 동일 형식으로 제시되어 Arendt 의 행위 부담이 평탄화. 중대한 비가역 결정이 일상적 결정처럼 처리됨.
- 에이전트 자기이해관계 미공시 → Habermas 의 진정성 위반. 에이전트가 특정 권장에서 얻는 효율 / 완료 보상을 사용자가 모름.
- 권장의 'defeater' 부재 → 권장이 '조건 없는 단정' 으로 제시되어 해석학적 순환의 부분-전체 관계가 은폐됨. 사용자는 권장의 취소 조건을 모른 채 동의.
- Hyperbrief 를 통과한 결정에 '브리핑 받았으니 책임 이전' 효과 → 책임의 형식적 알리바이로 악용되어 오히려 위임 윤리를 약화. 의례적 동의 인플레이션.

### Concrete rules

- **MUST**: 모든 브리핑에 §0 '에이전트 자기공시' (정보 한계 + 이해관계 + 모르는 것) 를 헤더로 포함.
- **MUST**: 모든 사실 진술에 provenance 태그 (`[관찰]` / `[추론]` / `[외부:source]` / `[가정]`) 중 하나 부여. 무태그는 무효.
- **MUST**: §7 분기 트리 최상위에 `reject-framing / defer / request-investigation` 메타 분기 의무 포함.
- **MUST**: §8 권장방향은 `recommendation + 3 defeater conditions + premortem` 3 블록 구조. 단일 권장 금지.
- **SHOULD**: §1 을 '맥락 지평' 으로 명명하고 (a) 전제, (b) 이전 결정과의 연속성, (c) 영향 범위 3 소절.
- **SHOULD**: §5 에 비가역성 신호등과 영향 행위자 다이어그램 시각화.
- **SHOULD**: §6 3 줄 요약은 '에이전트 관점 vs 반대 관점' 2 열 대조 또는 '사실 / 쟁점 / 요약이 놓치는 것' 3 구조 중 하나.
- **MUST**: 브리핑 상단에 '이 질문에 답하지 않아도 됩니다 — 거부 / 보류 / 재구성 옵션이 §7 메타 분기에 있습니다' 고지.

### Cross-axis connections

- **심리학**: 권장방향의 '인지적 활강' 구조는 anchoring / framing 편향과 직결 — 인문학이 '왜 그 순서가 권력의 문제인가' 를 논증하면 심리학이 '어떤 인지편향이 그래서 활성화되는가' 를 메커니즘으로 보완.
- **철학**: `reject the framing` 메타 옵션과 '비가역성 시각화' 는 중대 사고 규칙 (precautionary principle, reversibility heuristic) 과 만난다 — 인문학적 자율성 보장이 철학적 의사결정 룰로 정형화 가능.
- **경영학**: pre-mortem (Klein) 의무화는 인문학적 정직성 (Habermas 진정성) 과 경영학적 의사결정 방법론의 합류점 — 양 축이 동일 산출물을 다른 정당화 경로로 요구.
- **AI Harness**: provenance 태그 의무화와 에이전트 자기공시는 시스템 프롬프트 레벨 구조적 강제 필요 — 인문학적 규범을 프롬프팅 메타로 번역하는 작업이 AI Harness 축의 몫.
- **장기 개발론**: 비가역성 신호등은 결정의 'rollback cost' 와 직결되어 장기 개발 판단기준 (Bezos type-1/type-2) 과 자연스럽게 연결 — Arendt 적 행위 비가역성이 개발 의사결정 분류로 운용화 가능.

---

## 축 3 — 심리학 (Psychology)

### 렌즈

사용자의 어텐션 · 작업기억 · 시스템 1 자동반응이 브리핑을 어떻게 왜곡 · 우회하는지를 모델링하고, 브리핑의 형식 · 순서 · 시각 · 기본값 자체가 인지편향을 유발하지 않도록 "디바이싱된 결정 인터페이스" 로 설계되도록 강제. 즉 hyperbrief 는 단순 정보 제공이 아니라 **사용자의 의사결정 시스템에 직접 개입하는 인지 도구**.

### Core insights

**1. 8 섹션을 선형으로 모두 읽게 강제하면 인지부하 한계 초과로 사용자는 §6 3 줄 요약과 §8 권장방향만 보고 결정** — 실질적으로 권장방향 앵커링 모듈로 전락.

*근거.* Sweller 인지부하이론 (intrinsic + extraneous + germane load) — 작업기억 동시처리 청크 한계 (Cowan 4 ± 1, Miller 7 ± 2). 8 개 섹션 + 분기트리 + mermaid 다이어그램은 extraneous load 가 임계치를 넘김.

*함의.* 8 섹션은 '전체 한 번 다 읽기' 모델이 아니라 **progressive disclosure** (개요 → 3 줄 → 상세 onDemand) 모델로 재설계. 기본 뷰는 §1 + §6 + §7 만, 나머지는 collapsible. 단 §7 은 사용자 액션 강제 지점이므로 항상 펼침.

**2. §8 '권장 방향' 을 마지막에 배치하면 사용자는 앞 7 섹션을 '권장방향 정당화' 로 읽게 됨** (anchoring + confirmation bias 동시).

*근거.* Tversky-Kahneman 앵커링 효과 + Wason confirmation bias. Kahneman/Sibony/Sunstein 「Noise」 의 'sequential information' 함정 — 먼저 본 결론은 이후 정보 해석을 편향. 「Decisive」 (Heath) WRAP 의 W = Widen options 도 단일 권장 제시의 위험을 지적.

*함의.* §8 은 기본 collapsed, 사용자가 §7 분기트리를 먼저 통과한 후에만 노출. 또는 권장방향을 단수가 아니라 '경합하는 2~3 옵션 + 각자의 trade-off + 권장 1 안 + 권장 안 채택 시 잃는 것' 으로 재구성. '권장' 이라는 단어 자체를 'AI 추정' 으로 약화.

**3. 체크박스로 구성된 분기트리 (§7) 는 IKEA 효과 + 일관성 욕구로 인해 '체크한 항목과 정합하는 결론' 으로 사용자를 끌어당김** — 분기트리가 결정 도구가 아니라 결정 합리화 도구가 된다.

*근거.* Norton-Mochon-Ariely IKEA effect + Festinger 인지부조화 회피 + Cialdini commitment-consistency.

*함의.* 체크박스 분기트리는 'AI 가 제시한 기준에 사용자가 답하기' 대신 '사용자가 직접 체크 우선순위를 재배열하기' + '체크된 항목으로 자동 도출되는 결론과 그 반대 결론 모두 표시'. 그리고 체크 직후 'pre-mortem 한 문장' 강제: '이 선택이 6 개월 후 실패한다면 가장 가능성 높은 원인은?'

**4. §5 '선택에 따른 결과 예상' 은 framing effect 의 직격탄** — gain frame 과 loss frame 중 하나만 제시되면 동일 사안에 대해 선택이 뒤바뀐다.

*근거.* Tversky-Kahneman prospect theory + Asian disease problem 실험 (동일 결과를 살리는 / 죽이는 프레임으로 제시 시 선호 역전). loss aversion 계수 약 2.0~2.5.

*함의.* §5 섹션은 반드시 '선택 시 얻는 것 / 선택 시 잃는 것 / 선택 안 할 시 얻는 것 / 선택 안 할 시 잃는 것' 의 **2x2 매트릭스** 로 강제 구조화. 단일 narrative 금지. status-quo bias 카운터를 위해 '아무것도 안 함' 옵션을 5 번째 사분면으로 명시.

**5. AI 의 '권장방향' 은 default effect 로 작동** — 사용자가 명시적으로 거부하지 않으면 채택되는 기본값이 되며, 이는 의사결정 위임을 *더 강화* 한다 (애초의 문제를 더 악화).

*근거.* Johnson-Goldstein 장기기증 default 연구 + Thaler-Sunstein 「Nudge」 default architecture. 인지노력 회피로 default 채택률 60~90% 도달.

*함의.* AI 권장방향에 '신뢰도 (confidence)' + '내가 모르는 것' + '이 권장이 틀릴 가능성이 있는 시나리오' 3 종 메타데이터 강제 첨부. 권장방향 채택 시 사용자가 'AI 권장 채택' 버튼이 아니라 '나는 X 를 이유로 이 권장에 동의한다' 를 1 문장 직접 입력 (active choice → IKEA 역이용).

**6. §3 '어떻게' 와 §4 '왜' 의 순서는 sunk-cost 점화** — '어떻게' 를 먼저 읽으면 이미 실행 절차에 인지적 투자가 발생해 §4 '왜' 에서 회의가 들어도 무게가 실리지 않는다.

*근거.* Arkes-Blumer 매몰비용 효과 + 인지적 진입 효과 (cognitive entrenchment). 「Decisive」 WRAP 의 R (reality test) 이 가장 늦게 나오면 안 된다는 지적과 일치.

*함의.* 순서를 1 (개요) → 2 (무엇을) → 4 (왜) → 5 (결과예상) → 7 (분기트리) → 3 (어떻게) → 6 (3 줄요약) → 8 (권장) 으로 재배치. '왜' 와 '결과예상' 이 '어떻게' 보다 앞에 와야 절차 디테일에 매몰되기 전에 본질적 회의가 들어갈 자리가 생긴다.

**7. mermaid · chart.js 비주얼 최대화는 처리유창성 착각 (processing fluency illusion)** — '이해했다' 는 감각만 주고 실제 비판적 사고를 떨어뜨릴 수 있다.

*근거.* Alter-Oppenheimer fluency-as-validity 효과 + Reber-Schwarz 'feels true' heuristic. 잘 디자인된 차트일수록 사용자는 데이터를 의심하지 않는다.

*함의.* 모든 시각화에 '이 다이어그램이 단순화한 것 / 보여주지 않는 것' 캡션 강제. 차트는 단일 시점이 아니라 '낙관/중립/비관 3 시나리오 토글' 을 기본 제공. 아름다운 다이어그램은 의도적으로 약간의 '불완전 마크 (?)' 를 두어 fluency 차단.

**8. 결정 위임의 본질적 문제는 정보 부족이 아니라 'AI 가 결정 직전 단계에서 위임을 던지는 타이밍' 자체** — 사용자는 이미 맥락에서 멀어진 상태에서 호출당한다.

*근거.* Mayer Cognitive Theory of Multimedia Learning 의 '맥락 사전 활성화' 원칙 + Endsley situation awareness 3 단계 (perception-comprehension-projection). 맥락 부재 상태에서의 결정은 시스템 1 휴리스틱으로 처리됨.

*함의.* §1 '간단 개요' 앞에 '§0: 지금까지의 맥락 (직전 N 턴 요약 + 이 분기가 발생한 이유)' 섹션 추가. 사용자가 '내가 왜 지금 이 결정을 강제받고 있는가' 를 먼저 재구성할 수 있어야 함.

**9. §6 '3 줄 요약' 은 availability heuristic 을 강하게 트리거** — 사용자는 결정 후 회상 시 3 줄 요약만 기억하고 나머지 7 섹션은 잊는다. 따라서 3 줄 요약의 wording 자체가 결정의 사후 정당화 회로가 된다.

*근거.* Tversky-Kahneman availability heuristic + Schacter '7 sins of memory' 의 misattribution. Loewenstein-Schkade affective forecasting 오류와 결합 시 사후 후회 / 만족 모두 왜곡.

*함의.* 3 줄 요약은 'AI 가 쓴 3 줄' 이 아니라 'AI 가 제시한 사실 후보 5~7 개에서 사용자가 직접 3 개를 고른 결과'. 또는 3 줄 요약 옆에 '이 사안의 다른 3 줄 요약 가능 버전' 2 개를 병기하여 framing 다양성 노출.

**10. 사용자가 이 모듈을 자주 사용할수록 alert fatigue + 자동승인 패턴이 형성되어 모듈 자체가 무력화된다.**

*근거.* Cvach 의료현장 alarm fatigue 연구 + Skinner 변동강화 스케줄 역효과. 일상화된 호출은 시스템 2 가 시스템 1 로 위임됨.

*함의.* hyperbrief 는 모든 분기에서 호출되면 안 된다. 모듈 자체에 '호출 트리거 기준 (중대성 · 되돌리기 어려움 · 외부영향)' 을 강제 메타데이터로 요구하고, 메타데이터 점수 임계 미만이면 호출 자체를 차단. 사용자 결정 통계 (승인률, 평균 결정시간, 권장 채택률) 를 모듈이 추적하여 '권장 자동 채택률 > 70%' 같은 패턴 감지 시 사용자에게 자체 경고.

### Prompting implications

- AI 에이전트는 '권장 방향' 작성 시 반드시 동시에 '권장 반대안' + '내가 권장에 확신이 낮은 이유' + '이 권장이 안 통하는 시나리오' 를 같은 분량으로 작성하도록 시스템 프롬프트로 강제. 비대칭 분량 자체가 앵커링 신호.
- AI 는 §5 결과예상을 작성할 때 'gain frame 1 문단 + loss frame 1 문단 + status-quo (no-action) frame 1 문단' 을 모두 작성하도록 강제. 한 프레임만 쓰면 schema validation fail.
- AI 는 사용자에게 결정 위임 직전 'pre-mortem 질문' 을 강제 생성: '이 결정이 6 개월 후 명백한 실패였다면, 지금 당신이 놓치고 있을 가장 가능성 높은 정보는 무엇이라고 생각하는가?' 사용자 답변 없이는 다음 단계 진행 불가.
- AI 는 '확신도 (confidence)' 를 단일 숫자가 아니라 '어떤 가정이 깨지면 권장이 뒤집히는가' 형태의 brittleness 진술로 작성. 숫자 confidence 는 anchor.
- AI 에이전트의 자기 권장방향 작성 직전, '내가 지금까지 이 사용자에게 비슷한 결정을 몇 번 권장했고 채택률이 얼마였는가' 를 self-prompt 하여 패턴 형성 위험을 자가 경고.
- AI 는 분기트리 (§7) 에서 체크박스 항목을 '사실 진술' 이 아니라 '사용자가 평가해야 하는 가치 / 선호 질문' 으로만 구성. 사실은 §4 '왜' 에서, 가치 판단은 §7 에서 분리. 사실 / 가치 혼합은 사용자가 가치 판단을 회피하고 사실로 도피.
- AI 는 모든 시각화 산출에 'showing / hiding / oversimplifying' 3 종 메타캡션을 함께 생성하도록 강제 — 시각화 단독 출력 금지.
- AI 는 결정 요청 호출 자체의 정당성을 메타로 평가: '이 사안이 정말 사용자 결정이 필요한가, 아니면 AI 가 결정하고 사후 보고로 충분한가' 를 hyperbrief 생성 전에 self-check. 임계 미만이면 hyperbrief 호출하지 않음.

### Structural recommendations

- 8 섹션 선형 순서를 [§0 맥락 → §1 개요 → §2 무엇을 → §4 왜 → §5 결과예상 (2x2 프레임 매트릭스) → §7 분기트리 + pre-mortem → §3 어떻게 → §6 3 줄요약 (사용자가 선택) → §8 옵션 비교 + AI 추정] 으로 재배치. '왜' 와 '결과예상' 이 '어떻게' 보다 반드시 앞.
- 기본 뷰는 §0 + §1 + §5 + §7 만 노출, 나머지는 progressive disclosure. 단 사용자가 결정 버튼을 누르려면 §4 와 §8 을 최소 1 회 펼친 기록이 있어야 함 (soft gate). '읽지 않고 승인 금지'.
- §5 결과예상은 narrative 금지, 2x2 매트릭스 (채택 / 거부 × 얻는 것 / 잃는 것) + 'no-action' 을 5 번째 사분면으로 강제. mermaid quadrantChart.
- §7 분기트리는 체크박스가 아니라 '사용자가 직접 우선순위 순서를 드래그로 정하는 ranked list' + 각 항목 옆에 '이 항목을 최우선으로 두면 도출되는 결론' 실시간 미리보기. 체크 후 자동 결론 회로 차단.
- §8 을 '권장 방향 (단수)' 에서 '옵션 비교표 (복수) + AI 추정 1 안 + 추정의 brittleness 진술' 로 재명명 · 재구조화. 'AI 권장' 이라는 강한 default 어휘 자체를 피함.
- 모든 시각화는 'AI 가 단순화한 것 / 보여주지 않는 것' 캡션 의무. 차트는 낙관 / 중립 / 비관 3 시나리오 토글 기본 제공.
- 결정 직전 'pre-mortem 1 문장 입력' 강제 위젯. 사용자가 직접 타이핑한 텍스트 없이는 결정 확정 불가. (active choice → IKEA effect 를 디바이싱 도구로 역이용)
- HTML 출력에 '결정 후 일정 기간 후 자동 회고 알림 등록' 옵션 — Constellation 에 카드 임베드 시 결정 시점 + 사용자 입력 pre-mortem + 실제 결과를 페어링하여 후일 검토. affective forecasting 오류 교정.
- Constellation 카드 임베드 시 '한눈에 보이는 부분 (above-the-fold)' 에는 권장방향이 아니라 'pre-mortem 질문 + 2x2 결과 매트릭스' 만 노출. 권장방향은 카드 펼치기 후.

### Pitfalls

- 권장방향 (§8) 을 가장 눈에 띄게 디자인 → 사용자가 §1 + §6 + §8 만 읽는 권장 채택 모듈로 전락. hyperbrief 가 원래 문제를 더 악화.
- 체크박스 분기트리 (§7) 가 IKEA effect 로 작동 → 사용자가 자기 입력값에 일관된 결론만 받아들이는 합리화 도구.
- 8 개 섹션을 모두 읽게 강제 → 인지부하 초과 → 사용자가 모듈 자체를 회피하거나 '읽지 않고 OK' 자동승인 습관 형성 (alert fatigue).
- §5 결과예상이 단일 narrative → framing effect 로 동일 사안에 대해 매번 다른 결정. AI 의 그날 어조에 사용자 결정이 종속.
- mermaid · chart.js 비주얼 풍부함이 processing fluency illusion → 사용자가 '이해함' 을 느끼지만 실제 비판은 줄어듦.
- AI confidence 점수 단일 숫자 노출 → 강한 anchor, 사용자가 자체 평가 없이 confidence 에 가중치 부여.
- 동일 모듈을 모든 분기에서 호출 → 일상화 → 시스템 2 가 시스템 1 로 위임 → 모듈이 형식적 서명 의식이 됨.
- 결정 시점의 사용자 정서 / 맥락 (피로, 시간압박, 멀티태스킹) 미고려 — 정서가 결정에 미치는 영향 (Loewenstein hot/cold empathy gap) 무시.
- 사후 검증 회로 부재 → 모듈이 사용자에게 단기적으로 'AI 에게 잘 위임했다' 는 감각을 주지만 affective forecasting 오류는 그대로 → 장기적 결정 품질 향상 없음.
- 권장방향의 wording 이 'AI 권장' 으로 명명 → status-quo bias + authority bias 결합으로 default 채택률 폭증.

### Concrete rules

- **MUST**: §5 섹션은 2x2 결과 매트릭스 (채택 × {얻는 것, 잃는 것}) + no-action 사분면 포함. 단일 narrative 는 schema validation 실패.
- **MUST**: §8 '권장 방향' 은 단수 권장이 아니라 옵션 비교표 + AI 추정 1 안 + brittleness 진술 (어떤 가정이 깨지면 추정이 뒤집히는지) 모두 포함.
- **MUST**: 결정 확정 전 사용자의 pre-mortem 자유 입력 1 문장 이상 필수 (active choice gate).
- **SHOULD**: 기본 뷰는 §0 (맥락) + §1 (개요) + §5 (결과 매트릭스) + §7 (분기트리) 만 노출, §3 · §4 · §6 · §8 은 progressive disclosure.
- **SHOULD**: 모든 시각화에 'showing / hiding / oversimplifying' 3 종 캡션 동반.
- **MUST**: AI confidence 는 단일 숫자 금지. 'X 가정이 깨지면 결론이 뒤집힘' 형태의 brittleness 진술로만 표현.
- **SHOULD**: 호출 트리거 메타데이터 (중대성 · 되돌리기 어려움 · 외부영향) 점수가 임계 미만이면 hyperbrief 호출 자체를 차단하고 일반 보고로 대체.
- **SHOULD**: 누적 통계 (권장 채택률 · 평균 결정시간 · pre-mortem 미입력률) 추적 + 임계 초과 시 사용자에게 자체 경고 카드 발송.

### Cross-axis connections

- **AI Harness**: 시스템 프롬프트에 'gain/loss/no-action 3 프레임 모두 작성', 'brittleness 진술 강제', 'pre-mortem 질문 자동 생성' 규칙을 hard constraint 로 내장하는 구체 프롬프트 설계는 AI Harness 축이 담당.
- **인문학**: 'AI 가 결정을 위임한다' 는 행위 자체가 책임 분산을 통한 사용자 자율성 침식인가에 대한 윤리적 검토는 인문학 축. 심리학은 그 안에서 인지적 메커니즘만 다룸.
- **경영학**: pre-mortem (Klein), WRAP (Heath), Noise (Kahneman/Sibony/Sunstein decision hygiene), Doerr OKR, RAPID/RACI 같은 의사결정 거버넌스 프레임워크의 구체 적용은 경영학 축. 심리학은 이들 프레임워크가 작동하는 인지 메커니즘만 제공.
- **철학**: '중대분기' 의 판단 자체 — 무엇이 reversible/irreversible 인가, 무엇이 1-way door 인가 (Bezos) 에 대한 사고규칙은 철학 축. 심리학은 그 판단을 사용자가 회피하지 않게 만드는 인터페이스만 다룸.
- **장기 개발론**: progressive disclosure UI, collapsible 섹션, 누적 통계 추적, Constellation 카드 임베드 같은 구현 판단은 개발론 축. 심리학은 '왜 그렇게 구현해야 하는가' 의 인지적 근거만 제공.

---

## 축 4 — 경영학 (Management)

### 렌즈

경영학은 "누가, 무엇을, 어떤 정보로, 어떤 되돌릴 수 있는 비용으로" 결정하는가를 70 년간 체계화한 분야. Hyperbrief 는 단순한 정보 패키지가 아니라 *"위임 결정 (delegation decision)"* 그 자체이므로, 결정의 유형 분류 → 정보 충분성 기준 → 책임 귀속 → 사후 검증 루프까지 **경영학적 의사결정 거버넌스 골격을 그대로 이식** 해야 한다.

### Core insights

**1. 8 섹션 브리핑을 모든 결정에 균일 적용하는 것은 비용 대비 효과가 비대칭** — 결정의 유형에 따라 브리핑 깊이가 동적으로 조정되어야 한다.

*근거.* Bezos 의 Type 1 (one-way door, irreversible) vs Type 2 (two-way door, reversible) decisions — Amazon 1997 shareholder letter & 2015 letter. Type 2 는 빠른 결정이 자체 가치를 가지며, Type 1 수준의 분석을 강제하면 조직 속도가 의사결정의 적절성보다 더 큰 손실을 낸다.

*함의.* Hyperbrief 는 진입 시점에 **'door-type classifier'** 를 통과해야 한다. Type 2 (가역) 결정은 §1 · §3 · §6 · §8 만 의무화하고 나머지는 옵션. Type 1 (비가역, 고비용 롤백) 은 8 섹션 전부 + §5 에 'rollback cost · rollback latency · point-of-no-return' 명시 필수. 분류 자체를 brief 헤더에 노출.

**2. 현재 8 섹션은 '누가 결정하는가' 를 암묵적으로 사용자 단독에게 떠넘기는데, 이는 결정 권한 · 자문 · 실행을 분리하는 경영학적 통념을 위반.**

*근거.* Bain 의 RAPID framework (Recommend · Agree · Perform · Input · Decide). 의사결정에서 'Recommend (권고자)' 와 'Decide (결정자)' 와 'Perform (실행자)' 은 명시적으로 분리되어야 하며, 각자의 책임 범위가 불명확하면 사후 책임 귀속이 무너진다. AI-사용자 협업에서 에이전트는 Recommend/Perform, 사용자는 Decide, 다른 에이전트는 Input 일 수 있다.

*함의.* §0 (헤더) 에 RAPID 역할 표기를 강제: `Recommender: <agent_id>, Decider: user, Performer: <agent_id 또는 system>, Input-contributors: [<other_agents>], Agree (거부권 가진 자): [optional]`. §8 권장 방향에서 권장자의 confidence 또는 dissent 표기.

**3. §4 '왜' 는 너무 자유서술적이라 사용자가 결정의 boundary condition 을 파악하지 못한다** — Drucker 의 'boundary conditions' 명시가 빠졌다.

*근거.* Peter Drucker, 'The Effective Decision' (HBR 1967): 효과적 결정의 5 단계 중 두 번째가 boundary conditions (이 결정이 만족해야 할 최소 사양 — '이것이 충족되지 않으면 결정 자체가 무의미') 정의. 이를 명시하지 않으면 결정 후 trade-off 협상에서 본질적 요구가 슬그머니 양보된다.

*함의.* §4 를 '왜 + boundary conditions' 로 재정의. 'must-have (위반 시 결정 무효)', 'should-have (양보 가능하지만 비용 큼)', 'nice-to-have' 3 계층 명시. §5 의 결과 예상은 반드시 이 boundary 와 매칭되어 'A 안은 must-have 2 개 중 1 개 미충족' 처럼 검증 가능하게.

**4. §5 '선택에 따른 결과' 는 정성 서술만으로는 비교 불가능** — MCDA (Multi-Criteria Decision Analysis) 구조가 필요.

*근거.* Thomas Saaty 의 AHP (Analytic Hierarchy Process, 1980) 및 weighted scoring model 의 기본 원리: 다대안 비교는 (a) 평가 기준 명시 (b) 기준별 가중치 (c) 대안별 기준 점수 (d) 가중합 — 이 4 요소가 모두 있어야 비교 가능. 정성 서술만으로는 '느낌적으로 A 가 좋다' 에 빠진다.

*함의.* §5 는 표 형태 의무화: 행 = 대안, 열 = 평가기준 (boundary conditions 에서 도출), 셀 = 정량 또는 5 점 척도 + 한 줄 근거. 가중치는 사용자가 조정 가능한 슬라이더로 HTML 출력에 노출 (chart.js radar/bar). 마지막 열에 'expected value' 또는 'worst-case regret' 수치.

**5. §5 에 '되돌림 비용 (rollback cost)' 과 '되돌림 시간 창 (reversal window)' 을 별도 필드로 분리해야 한다** — 결정 유형 분류와 사후 적응의 핵심 변수.

*근거.* Real Options 이론 (Dixit & Pindyck, 1994 *Investment under Uncertainty*): 불확실성 하 결정의 가치는 '미래에 더 나은 정보로 재결정할 옵션의 가치' 를 포함. 옵션 가치는 (a) 되돌릴 수 있는 창의 길이 (b) 새 정보가 도착할 확률 (c) 되돌림 비용에 의해 결정. 이 세 변수가 brief 에 없으면 'wait-and-see' 가 늘 보이지 않는 비교 대상이 된다.

*함의.* §5 에 'reversibility' 서브섹션 의무: rollback cost (시간/금전/관계자본), reversal window (이 시점까지는 무비용 철회 가능), trigger to revisit (어떤 신호가 오면 재결정해야 하는가). 'do nothing / defer N 일' 은 §8 권장 방향에 항상 명시 옵션으로 포함.

**6. §7 '판단기준 분기 트리 (체크박스)' 는 우수한 아이디어지만, Cynefin 도메인 분류가 선행되지 않으면 잘못된 도메인에 잘못된 트리를 강제** 한다.

*근거.* Dave Snowden 의 Cynefin framework (2007 HBR 'A Leader's Framework for Decision Making'): 결정 상황을 Clear (명확), Complicated (전문가 판단), Complex (시행 + 패턴), Chaotic (행동 우선), Confused 로 분류. Clear / Complicated 에서는 분기 트리가 유효하지만, Complex 에서는 'probe-sense-respond' 가 맞고 분기 트리는 거짓 확신을 만든다.

*함의.* §7 진입 전 Cynefin 도메인 판정 강제. Clear / Complicated 에서만 결정론적 분기 트리. Complex 에서는 분기 트리 대신 'safe-to-fail probe 후보 3 개 + 관찰 지표' 형식으로 자동 전환. Chaotic 에서는 분기 트리 자체를 막고 '즉시 행동 + 사후 학습' 템플릿 강제.

**7. Hyperbrief 가 결정-당시 정보만 제공하고 사후 학습 루프를 닫지 않으면, 같은 에이전트가 같은 함정에 반복해서 빠진다** — decision journal 통합이 필요.

*근거.* Ron Howard 의 decision analysis 학파 및 Annie Duke 'Thinking in Bets' (2018) 의 decision journal: 결정의 질을 결과의 질과 분리하기 위해 (a) 결정 시점의 정보 · 가정 · 예측 (b) 결정 후 실제 결과 (c) outcome quality vs decision quality 회고를 기록. OODA loop (John Boyd) 의 'Observe' 도 사후 데이터 없이는 회전하지 않는다.

*함의.* Hyperbrief 카드는 결정 후 'expected outcome (확률 분포 또는 시나리오) + revisit date' 를 자동 캡처. Constellation 에 'decision ledger' 인덱스로 누적. revisit date 도래 시 자동으로 'actual outcome 입력 prompt + decision-quality vs outcome-quality 회고' 카드를 띄움. 이것 없이는 §6 3 줄 요약이 학습 자산이 되지 못한다.

**8. §8 '권장 방향' 은 단일 권고가 아닌 'conditional recommendation' 으로 표현되어야 사용자가 자기 사정에 맞게 사용한다.**

*근거.* 전략 컨설팅 (McKinsey 의 MECE pyramid principle, Barbara Minto) 의 권고 구조: 'Given assumption A and constraint B, we recommend X; if A doesn't hold, fall back to Y; if B tightens, switch to Z.' 단일 권고는 컨텍스트가 변하면 즉시 무효가 되지만 conditional 권고는 사용자가 자기 컨텍스트로 변환 가능.

*함의.* §8 구조: `Primary recommendation: X (assumes <a>, <b>); If <a> fails → Y; If user prioritizes <c> over <d> → Z.` 권고의 '유효 가정' 명시. 사용자가 가정을 부정할 때 대안 경로 자동 라우팅.

**9. Brief 는 pre-mortem 요소를 §5 또는 별도 서브섹션으로 포함해야 한다** — post hoc 후회 최소화의 가장 강력한 도구.

*근거.* Gary Klein 의 pre-mortem (Harvard Business Review 2007, 'Performing a Project Premortem'): 결정 전에 '이 결정이 1 년 후 실패했다고 가정하고, 왜 실패했는지 거꾸로 추론' 하는 의식. Klein 의 연구에서 prospective hindsight 는 실패 원인 식별을 30% 향상.

*함의.* §5 또는 §5b 에 'pre-mortem 시나리오 2 개 의무': (a) 권장안이 6 개월 후 명백한 실패로 판명났다면 가장 가능성 높은 실패 경로 (b) 그 경로의 조기 경보 신호. 이는 §7 분기 트리의 'go-back-to-revisit' 트리거와 직접 연결.

**10. §1 '간단 개요' 는 의사결정 비용 (decision cost) 과 시급성 (deadline pressure) 을 헤더에 명시해야 한다** — 사용자가 brief 자체를 읽을지 말지 결정하는 첫 단계.

*근거.* Herbert Simon 의 bounded rationality (1957) 와 satisficing: 결정자는 모든 정보를 처리할 수 없으므로 'good enough' 기준에서 멈춘다. 결정의 stake (이 결정에 들일 시간 예산) 를 사전에 알려주지 않으면 사용자가 brief 에 과/저투자.

*함의.* §1 헤더에 4 필드 의무: (a) decision-type (Type 1/Type 2), (b) deadline (절대시각 또는 'no rush'), (c) stake (재정 · 평판 · 기술부채 추정 영향), (d) recommended reading time. 사용자가 §1 만 읽고 deferral / escalation / proceed 라우팅 가능.

### Prompting implications

- 에이전트에게 brief 를 작성하기 전 'door-type classifier' 를 먼저 실행하도록 시스템 프롬프트에 강제: 'Before writing the brief, classify this decision: (a) Is rollback cost > N hours? (b) Are there third-party irrevocable commitments? (c) Is data destruction involved? If any yes → Type 1, full 8 sections required. Else → Type 2, minimal brief (§1 · §3 · §6 · §8) acceptable.'
- 에이전트가 §4 를 작성할 때 'List boundary conditions (must-have / should-have / nice-to-have) BEFORE writing rationale. If you cannot list at least 2 must-haves, the decision is underspecified — request clarification from user instead of generating brief.' 규칙 부과.
- §5 표 생성 시 'Each row (alternative) must score on every criterion (column). Missing cells must be marked UNKNOWN with cost-to-investigate estimate. Do NOT fabricate scores to fill the table.' — MCDA 무결성.
- §8 권장 방향에서 'State your confidence (0-100%) and the top 2 reasons your recommendation could be wrong. If confidence < 60%, recommend deferral or smaller experiment instead of the alternative.' 강제.
- 에이전트에게 RAPID 역할 자기 식별 강제: 'You are the Recommender. The user is the Decider. Identify Performer and Input contributors explicitly. If you are also the Performer, flag potential conflict of interest in §4.'
- Cynefin 도메인 자기 판정 프롬프트: 'Before §7, classify: cause-effect relationship is (a) self-evident (Clear), (b) requires expertise (Complicated), (c) only knowable in retrospect (Complex), (d) no time to analyze (Chaotic). Adapt §7 format accordingly.'
- Pre-mortem 강제 프롬프트: 'Before finalizing §8, imagine the recommendation has failed catastrophically 6 months later. Write 2 failure narratives with early warning signals. Include these as §5b.'
- 결정 후 revisit-trigger 자동 등록: brief 생성 시 'Set a revisit-date or revisit-trigger (e.g., when metric X crosses threshold Y). Without this, the decision is fire-and-forget and will not accumulate learning.' — 시스템이 자동 schedule 등록.
- 에이전트가 brief 본문에 '권장합니다' 단정형을 쓸 때는 반드시 'assuming <조건>' 절을 동반하도록 강제. unconditional recommendation 금지.

### Structural recommendations

- §0 (헤더) 신설: decision-type, deadline, stake, recommended-reading-time, RAPID 역할 표기, Cynefin 도메인. 본문 8 섹션 위에 항상 노출. HTML 출력에서는 색상 코드 (빨강 = Type1/Chaotic, 노랑 = Complex, 초록 = Type2/Clear) 로 즉시 식별.
- §4 '왜' 를 '왜 + boundary conditions 표' 로 확장. must/should/nice 3 계층을 시각적으로 다른 굵기 · 색으로 표현. §5 의 대안 비교 표는 boundary conditions 를 컬럼으로 직접 차용해야 정합성 유지.
- §5 는 정성 서술 + MCDA 표 + 시각화 3 층 구조. mermaid 는 인과 흐름 (원인 → 결과 노드), chart.js 는 대안별 다기준 점수 (radar chart) · 기대값 (bar chart) · 시나리오별 분포 (box plot). 사용자가 가중치를 조정할 수 있는 인터랙티브 슬라이더 (HTML 한정).
- §5 에 'reversibility panel' 신설: rollback cost, reversal window 카운트다운 (deadline 까지 D-N 일), trigger-to-revisit 목록.
- §5b 'pre-mortem' 서브섹션 신설: 권장안 실패 시나리오 2 개 + 조기 경보 신호. 짧게 (시나리오당 3~5 줄).
- §7 분기 트리는 Cynefin 도메인에 따라 형식 자동 전환: Clear/Complicated → mermaid decision tree (체크박스 leaf), Complex → mermaid probe-sense-respond 다이어그램 (병렬 probe + 관찰 지표), Chaotic → '즉시 행동 카드 + 24h 회고 예약' 단일 카드.
- §8 권장 방향은 conditional 구조: `Primary X (assumes A,B) / If A fails → Y / If B tightens → Z`. confidence 수치와 '내가 틀릴 수 있는 top 2 이유' 동반 노출.
- §9 (신설) 'decision capture': 결정 후 사용자가 어느 option 을 선택했는지, revisit-date, expected outcome 기록 필드. Constellation 의 decision ledger 인덱스로 누적되어 사후 학습 루프 형성.
- Constellation 카드 임베드 시 §0 과 §6 과 §8 만 카드 표면에 노출 (접힘), 나머지는 'expand brief' 인터랙션으로 펼침. satisficing 사용자가 빠르게 라우팅 가능하고, deep-dive 사용자는 전체 brief 접근 가능.
- HTML 출력의 sidebar 에 'this brief was auto-classified as Type N / Cynefin <domain>. If you disagree, reclassify here.' 메타 컨트롤 노출 — 분류 자체가 결정의 첫 단계임을 사용자가 인지.

### Pitfalls

- 모든 결정에 8 섹션을 균일 강제하면 Type 2 (가역) 결정에서 brief 생성 비용이 결정 자체의 비용을 초과해 사용자가 brief 를 무시하기 시작 → 모듈 자체가 형해화. 결정 유형 분류 없이는 회피 불가능한 함정.
- §5 결과 예상이 정량 비교 없이 정성 서술만으로 채워지면 사용자가 'A 가 좋아 보인다' 에 빠지고 가중치 · 기준의 명시적 협상이 사라짐. MCDA 구조 없는 §5 는 의사결정 외양만 갖춘 합리화 도구로 전락.
- Boundary conditions 누락 시 결정 직후 협상에서 'must-have' 가 슬그머니 양보되어 결정의 목적 자체가 무너짐 — Drucker 가 가장 빈번한 실패 모드로 지목한 패턴.
- Reversibility 정보 누락 시 사용자가 Type 1 결정을 Type 2 로 착각해 충분한 숙고 없이 진행 → 비가역 손실. 반대로 Type 2 를 Type 1 로 오인하면 결정 지연이 누적 비용을 만듦.
- RAPID 역할 미명시 시 사후 'AI 가 권했으니까' · '사용자가 결정했으니까' 책임 핑퐁이 발생해 학습 루프가 닫히지 않음.
- Cynefin Complex 도메인에 분기 트리를 강제하면 거짓 확신을 생성해 'probe-and-learn' 이 필요한 영역에서 단일 경로에 베팅하게 만듦.
- Pre-mortem 부재 시 §8 권장 방향이 과확신 (overconfidence) 에 빠짐 — 평균적으로 권고자는 자기 권고의 실패 시나리오를 자발적으로 생성하지 않음 (Klein 연구).
- Decision journal / revisit-trigger 부재 시 같은 에이전트가 같은 함정에 반복 — brief 가 1 회성 산출물로 끝나면 조직 학습이 발생하지 않음.
- 단일 권고 형식이면 사용자의 컨텍스트 (가정 · 제약) 가 변경됐을 때 권고가 즉시 무용. 사용자는 '이 권고는 내 상황에 안 맞아' 로 brief 전체를 폐기.
- Stake/deadline 헤더 부재 시 사용자가 trivial 결정에 과투자하거나 critical 결정에 저투자 — Simon 의 bounded rationality 관점에서 무차별 brief 는 결정자 자원을 잘못 배분.

### Concrete rules

- **MUST**: 모든 brief 는 §0 헤더에 decision-type (Type1/Type2), deadline, stake, RAPID 역할, Cynefin 도메인 5 필드 포함. 누락 시 brief 는 invalid.
- **MUST**: Type 1 결정에는 8 섹션 전부 + §5 에 rollback cost, reversal window, point-of-no-return 명시. Type 2 결정은 §1 · §3 · §6 · §8 최소셋 허용.
- **MUST**: §4 는 boundary conditions 를 must-have / should-have / nice-to-have 3 계층으로 명시. must-have 가 2 개 미만이면 brief 생성 대신 사용자에게 사양 질문을 반환.
- **MUST**: §5 는 대안 비교 표를 포함하며 각 셀은 정량값 또는 5 점 척도 + 한 줄 근거. 미지 셀은 UNKNOWN + 조사 비용 추정. 빈 셀로 비교 허용 금지.
- **MUST**: §5 는 'do nothing / defer N 일' 옵션을 항상 비교 대안 중 하나로 포함 (real options 가치 보존).
- **SHOULD**: §5b pre-mortem 서브섹션 포함 — 권장안 실패 시나리오 2 개 + 조기 경보 신호. Type 1 에서는 MUST.
- **MUST**: §7 분기 트리는 Cynefin 도메인에 따라 형식 전환. Complex 도메인에서 결정론적 분기 트리 사용 금지.
- **MUST**: §8 권장 방향은 conditional 형식 — 'X assuming A,B / fallback Y if A fails / switch Z if B tightens' + confidence 수치 + '내가 틀릴 수 있는 top 2 이유' 동반.

### Cross-axis connections

- **심리학**: Type 1/Type 2 분류는 시스템 1 · 시스템 2 활성화와 직결 — 심리학이 다룰 '인지 부하 · 편향' 은 결정 유형별 brief 깊이 차등화의 심리적 근거 제공.
- **철학**: Boundary conditions 의 must-have 는 'non-negotiable' 사고규칙과 만남 — 철학이 다룰 가치 우선순위 · deontological constraints 가 boundary conditions 의 must-have 도출 규칙을 제공.
- **AI Harness**: door-type classifier 와 Cynefin domain classifier 는 프롬프팅 메타-레이어로 구현 — 본 축이 정의한 분류 규칙을 AI Harness 가 시스템 프롬프트에 어떻게 주입할지를 다룸.
- **인문학**: RAPID 의 책임 귀속 · decision journal 의 사후 회고는 '결정에 대한 서사적 책임' 이라는 인문학적 전제와 연결.
- **장기 개발론**: 'reversibility / rollback cost' 개념은 소프트웨어의 migration/feature flag/canary deploy 관행과 직접 매핑 — 개발론 축이 기술 결정에 특화된 reversibility 측정 도구를 정의할 수 있음.
- **심리학**: pre-mortem 은 prospective hindsight 라는 인지 기법 — 심리학이 그 효과 메커니즘과 진행 의례 (facilitation ritual) 를 보강.

---

## 축 5 — 철학 (Philosophy)

### 렌즈

철학 축은 *"무엇이 '중대' 한가"* 를 규범적으로 정의하고, 비가역성 · 규모 · 시간지평 · 책임귀속이라는 사고규칙으로 escalation 임계를 식별하며, Toulmin · Bayes · virtue epistemology 의 인식론적 겸손을 brief 의 정직성 장치 (qualifier, rebuttal, calibration) 로 내장한다. 다시 말해 hyperbrief 의 *"왜 이 사안이 사용자 결정으로 올라와야 하는가"* 와 *"에이전트는 무엇을 아는 척하면 안 되는가"* 의 토대를 제공.

### Core insights

**1. Hyperbrief 자체의 발동 조건 (escalation trigger) 을 Jonas 의 책임원칙 비대칭성으로 정식화** 해야 한다. '중대' 는 결과의 평균기대값이 아니라 (a) 비가역성, (b) 영향 규모, (c) 시간지평, (d) 가역 비용의 4 축 minimax 로 정의.

*근거.* Hans Jonas, 『Das Prinzip Verantwortung』 (1979) — heuristic of fear: 가역적 손해와 비가역적 손해는 같은 기대값이라도 비대칭적으로 다뤄야 하며, '나쁜 예언을 좋은 예언보다 더 진지하게 들으라'. 핵심 메커니즘은 unbounded downside 에 대한 expected utility 계산 거부와 lexicographic priority (비가역성이 다른 모든 기준에 사전적 우선).

*함의.* 8 섹션 앞에 §0 메타 섹션 'Escalation 정당화' 를 두어, 에이전트가 왜 이 사안을 사용자에게 위임했는지를 (비가역성 · 규모 · 시간지평 · 가역비용) 4 지표로 자기진단해 명시. 4 지표 모두 '낮음' 이면 brief 자체가 과잉이며 에이전트가 결정해야 한다. 이로써 brief 의 남발 (false escalation) 과 누락 (false autonomy) 둘 다 차단.

**2. §5 섹션 (선택에 따른 결과 예상) 은 Toulmin 논증 모델 6 요소로 분해해야 단순한 pros/cons 리스트가 아닌 반박가능한 논증이 된다.**

*근거.* Stephen Toulmin, 『The Uses of Argument』 (1958) — claim / grounds / warrant / backing / qualifier / rebuttal. 메커니즘: 결론 (claim) 만 제시하면 사용자는 검증할 수 없고, grounds (증거) 와 warrant (추론규칙) 를 분리해야 어느 지점이 약한지 식별 가능. qualifier ('대체로', '확률 X') 와 rebuttal ('단, Y 의 경우 성립 안 함') 은 인식적 겸손을 구조에 내장.

*함의.* 각 옵션의 결과 예측에 대해 {예측, 근거, 추론규칙, 신뢰도 qualifier, 반박조건 rebuttal} 을 강제. mermaid 로 옵션 → 결과 분기를 그릴 때 각 화살표에 qualifier (확률/조건) 를 라벨링. '확실하다' 는 표현 금지, 'rebuttal: 없음' 은 plausibility check 실패로 간주.

**3. §8 섹션 (권장 방향) 은 권장과 동시에 자기 권장의 인식론적 한계를 함께 명시해야 한다** — 그렇지 않으면 brief 는 '결정 위임' 이 아니라 '동의 요구' 로 변질된다.

*근거.* Linda Zagzebski, 『Virtues of the Mind』 (1996) — intellectual humility 로서 자신의 인식적 위치를 정직하게 표지하는 것이 인식적 덕. 또한 Goldman 의 veritistic value theory: 권고의 인식적 가치는 정답률만이 아니라 청자의 정당화 가능성 (justification transfer) 으로 평가됨. 권고만 있고 그 권고의 기반 · 반례 · confidence 가 없으면 청자는 검증 없이 신뢰하게 되어 인식적 가치 하락.

*함의.* §8 을 'Recommendation + Epistemic Profile' 로 확장: {권장안, 신뢰도 (0~1), 이 권장이 흔들리는 조건 3 가지, 에이전트가 모르는 것 명시, 다른 합리적 행위자가 다른 결론에 이를 수 있는 이유}. 신뢰도가 0.7 미만이면 '권장' 대신 '제안 후보' 로 다운그레이드.

**4. §7 분기 트리는 단순 체크박스가 아니라 '결정에 진정으로 충분한 정보의 최소집합 (MIS, Minimal Information Set)' 을 식별하는 도구여야 한다.**

*근거.* Aristoteles 『Nicomachean Ethics』 VI 권 phronesis (실천적 지혜) — 보편 원칙과 개별 상황 사이의 매개로서, 핵심 메커니즘은 '이 상황에서 무엇이 적실 (relevant) 한가' 의 판별. 결정에 무관한 정보는 인식적 잡음이며 사용자의 phronesis 를 마비시킨다. 또한 Herbert Simon 의 bounded rationality 관점: 정보 추가가 결정 품질을 항상 높이지 않고 임계 이후 감소.

*함의.* 분기 트리의 각 노드는 '이 질문에 대한 답이 다른 옵션을 선택하게 만드는가?' 라는 decision-relevance test 를 통과해야 한다. 통과 못한 노드는 제거. 트리 깊이 3 초과 시 사용자 인지부하 경고. 즉 §7 은 정보 적실성의 필터로 재정의.

**5. 신뢰도 표현은 자연어 ('아마도', '대체로') 가 아니라 명시적 확률 구간 + calibration 기록으로 강제** 해야 한다.

*근거.* Bayesian epistemology (특히 Tetlock 의 『Superforecasting』 및 Brier score 전통) — 자연어 확률 표현은 청자 간 20~80% 범위로 해석이 흩어지며 (Sherman Kent 의 NIE 연구), 사후 보정 (calibration) 불가능. 메커니즘: 확률 구간을 강제하면 에이전트가 자신의 불확실성을 정직하게 측정해야 하고, 누적된 brief 의 정확도가 사용자의 신뢰 가중치를 보정.

*함의.* 모든 예측 · 권장에 {point estimate, 90% credible interval, 이 추정이 빗나갈 가장 그럴듯한 시나리오} 를 강제. '높음/중간/낮음' 만 쓰면 lint 실패. HTML 출력에서 chart.js 로 confidence interval bar 를 시각화. 이는 모듈 운영 누적 후 retrospective calibration 가능.

**6. §5 섹션의 결과 예상은 Rawls 의 무지의 베일을 reverse 적용해 '이 결정의 영향을 가장 크게 받는 행위자 시점' 으로 한 번 재서술** 해야 한다.

*근거.* John Rawls, 『A Theory of Justice』 (1971) — veil of ignorance 는 본래 정의 원칙 도출용이지만 그 핵심 메커니즘 (자기 위치 모름 → 최약자 시점 강제) 을 결정 영향평가에 적용 가능. 결정자 (사용자) 는 자기 시점에 갇히기 쉬워 결정의 외부효과를 과소평가. 가장 큰 비용을 부담할 stakeholder 시점으로 한 번 재서술하면 외부효과 인식 강제.

*함의.* §5 에 'Most-affected stakeholder 시점' 서브섹션 추가: 이 결정의 비용을 가장 크게 부담할 행위자 (미래 자기 자신, 협력 에이전트, 코드 유지보수자, 사용자 외 인간) 를 식별하고 그 시점에서 결과 1 줄 재기술. 식별 불가하면 그 자체를 경고 신호로 표지.

**7. Popper 의 falsifiability 를 brief 의 self-check 메커니즘으로 내장** — '이 권장이 틀렸음을 무엇이 보여줄 것인가' 를 명시하지 못하는 brief 는 결정 위임 자격이 없다.

*근거.* Karl Popper, 『Logik der Forschung』 (1934) / 『Conjectures and Refutations』 (1963) — 반증 가능성이 없는 주장은 인식적 내용이 없다. 메커니즘: falsification condition 을 사전 명시하면 사후에 '맞았다/틀렸다' 판정 가능 → 누적적 학습 + 무책임한 권고 차단. AI 에이전트의 hallucination 은 본질적으로 unfalsifiable 형태의 단언으로 출현.

*함의.* §8 권장과 함께 'Falsification trigger' 를 강제: '향후 N 일 내 X 가 관측되면 이 권장은 기각되어야 함'. §5 결과 예상에도 각 시나리오별 falsifier 명시. 'falsifier: 없음' 이면 그 항목은 vacuous 로 표지하고 권장에서 가중치 0.

**8. Precautionary principle 은 §8 권장의 tie-breaking rule 로 명시적 작동** 시켜야 한다 — 비가역 옵션과 가역 옵션이 같은 기대값이면 가역 옵션이 lexically prior.

*근거.* 1992 Rio Declaration Principle 15 + Sunstein 의 『Laws of Fear』 (2005) 비판적 정식화 — 약한 precautionary principle: 불확실성이 행동 지연의 이유가 아니나, 비가역 손해 가능성 앞에서는 기대값 계산이 신뢰성을 상실하므로 reversibility 를 메타 기준으로 사용. 메커니즘: 옵션 공간을 (가역, 비가역) × (저비용, 고비용) 2x2 로 매핑 후 비가역 × 고비용을 별도 처리.

*함의.* §8 에 'Reversibility check': 권장안의 되돌리기 비용 (시간 · 자원 · 복구가능성) 을 0~3 스케일로 명시. 점수 3 (되돌릴 수 없음) 이면 brief 가 사용자에게 명시적 confirmation step 을 추가로 요구하도록 강제 (체크박스 형태로 §7 에서 'I accept irreversibility' 항목). 가역 대안이 존재하면 §7 트리 상단에 항상 표시.

**9. 에이전트가 '결정' 이라고 부르는 것의 상당수는 사실 '한 옵션의 unstated 가정 채택' 이다** — brief 는 이 숨은 가정을 표면화하는 transcendental analysis 단계를 거쳐야 한다.

*근거.* Collingwood 『An Essay on Metaphysics』 (1940) 의 absolute presupposition 분석 + Kant 의 transcendental argument 형식 — 어떤 주장이 의미를 가지려면 무엇이 참이어야 하는가를 역추적. 메커니즘: 옵션 A 와 B 가 다르게 보이는 이유는 종종 상이한 배경가정 (아키텍처 가정, 사용자 의도 추정, 시간지평 가정) 때문. 가정 자체가 결정의 진짜 분기점.

*함의.* §3 (어떻게) 와 §4 (왜) 사이에 'Hidden assumptions' 서브섹션: 이 사안을 옵션으로 분해할 때 에이전트가 채택한 전제 3 가지 이상을 명시 (예: '사용자가 X 를 우선시한다고 가정', '시스템이 Y 상태에 있다고 가정'). 가정이 틀리면 옵션 공간 자체가 무효임을 사용자가 즉시 식별 가능.

**10. §6 3 줄 요약은 인지적 압축이 아니라 '결정에 충분한 최소 정보' 의 정직성 테스트로 기능** 해야 한다 — 이 3 줄만 읽고 결정해도 brief 전체와 동일한 결론이 나와야 한다.

*근거.* Aristoteles 의 enthymeme (생략삼단논법) 개념 + 분석철학의 charitable reading 원칙 — 좋은 요약은 정보 손실이 아니라 핵심 보존. 메커니즘: 만약 3 줄 요약만으로 다른 결론에 이른다면, brief 본문이 결정에 무관한 정보 (혹은 호도하는 정보) 를 포함했거나 요약이 핵심을 누락한 것. 양방향 정합성 검사.

*함의.* §6 에 정합성 자기검사 강제: brief 작성 후 에이전트가 '3 줄 요약만으로 권장이 도출 가능한가' 를 self-check. 불가능하면 brief 는 incoherent 로 표지 후 재작성. 3 줄 각각은 (사안 본질 / 핵심 trade-off / 권장과 그 신뢰도) 로 슬롯 강제.

### Prompting implications

- 시스템 프롬프트에 'You are not deciding; you are equipping the user to decide' 원칙 명시. 에이전트가 권장을 표현할 때 'should/must' 대신 'I recommend X with confidence 0.X because Y; this would be wrong if Z' 형식 강제.
- Brief 생성 전 escalation 자가 진단을 강제: 4 지표 (비가역성/규모/시간지평/가역비용) 각각 0~3 점수와 그 근거 1 줄. 합산 점수 임계 이하면 brief 생성을 중단하고 에이전트가 결정.
- 확률 표현은 자연어 금지, 수치 구간 필수. 'might/could/possibly' 등은 lint 후 차단 후 명시적 확률로 재작성 요구.
- Falsification trigger 누락 시 brief 는 incomplete 로 표지 — '이 권장이 틀렸음을 무엇이 보여줄 것인가' 에 답하지 못한 brief 는 제출 불가.
- Hidden assumption 섹션을 강제하되 '없음' 을 답으로 허용하지 않음 — 가정 없는 옵션 분해는 불가능하므로 '없음' 은 자기기만 신호.
- 옵션이 1 개뿐인 경우 brief 자체가 부적합 — 진짜 분기가 아닌 통보이므로 다른 채널 (notification) 로 라우팅하도록 강제.
- 권장과 결정의 분리를 어휘 수준에서 강제: brief 는 'Recommendation' 섹션만 가질 뿐 'Decision' 섹션은 사용자만 채울 수 있도록 템플릿에 빈 슬롯 유지.
- 누적 calibration 로그: 각 brief 의 confidence 와 사후 결과를 추적해 에이전트별 Brier score 산출 → 다음 brief 에서 confidence 자동 보정.
- Brief 자체가 시간 압박 상황 (예: 빌드 진행중) 에서도 동일 품질을 유지하도록, escalation 발생 시점에 작업 일시정지를 시스템 차원에서 보장 (brief 작성 중 결정 강요 차단).

### Structural recommendations

- 섹션 §0 (Escalation 정당화) 를 §1 앞에 신설: 4 지표 점수 + 왜 에이전트가 자율 결정하지 않았는지 1 줄. 이게 없으면 brief 는 'AI 가 책임을 떠넘기는 도구' 로 전락.
- §5 를 'Toulmin 기반 결과 논증' 으로 재구조화: 옵션별로 {예측 claim, grounds, warrant, qualifier, rebuttal} 5 필드를 강제. mermaid 다이어그램에서 화살표 라벨에 qualifier (확률) 표기, 각 leaf 에 rebuttal 노드 부착.
- §7 분기 트리는 'Minimal Information Set' 원칙으로 가지치기: 답이 옵션 선택을 바꾸지 못하는 질문은 트리에서 제거. 트리 옆에 '이 질문이 결정에 어떻게 영향을 미치는가' 1 줄 라벨.
- §8 을 'Recommendation + Epistemic Profile' 로 확장: {권장안, confidence 0~1, falsification trigger, reversibility 점수 0~3, 합리적 반대자가 다른 결론에 이를 이유}. HTML 에서 confidence 를 chart.js gauge 로, reversibility 를 색상 스케일 (녹/황/적) 로 시각화.
- §3 ~ §4 사이에 'Hidden Assumptions' 미니 섹션: 에이전트가 옵션을 구성하면서 채택한 전제 3 가지 이상을 bullet 로. 이 가정이 사용자 관점에서 틀리면 brief 전체 무효임을 명시.
- §6 3 줄 요약은 슬롯 형식 강제: (1) 사안의 본질 (2) 핵심 trade-off (3) 권장과 confidence. 자유 서술 금지.
- HTML 출력에 'Decision Receipt' 영역 추가: 사용자가 선택 시 선택한 옵션, 그 시점의 brief confidence, falsification trigger, 후속 검토 시점이 자동 기록되어 retrospective calibration 의 입력이 됨.
- mermaid 다이어그램은 옵션 분기와 함께 'irreversible boundary' 를 시각적 경계선 (빨간 점선) 으로 명시 — 그 선을 넘는 옵션은 별도 confirmation step 요구.

### Pitfalls

- 권장의 강도와 confidence 가 분리되지 않으면 brief 가 'AI 가 사실상 결정하고 사용자는 추인' 하는 도구로 변질. 강한 어조 + 낮은 confidence 를 시스템이 차단해야 함.
- 비가역성을 단일 boolean 으로 다루면 '되돌리기 어렵지만 가능' 사안이 가역으로 분류되어 precautionary check 를 회피. 0~3 스케일과 '되돌리기 비용' 구체 명시 필수.
- Falsification trigger 를 형식적으로만 채우는 실패모드 (예: '향후 모든 것이 잘 안 되면'). 검증 가능한 관측 시점 · 관측 대상 · 임계값 3 요소가 없으면 무효로 처리.
- Hidden assumption 을 '없음' 으로 채우는 자기기만 — 가정 없는 옵션 분해는 논리적으로 불가능하므로 '없음' 은 lint 실패로 처리.
- 옵션 공간이 에이전트가 제시한 것으로 제한된다는 prompting framing 실패 — '이 brief 가 제시하지 않은 옵션이 존재할 수 있는가' 라는 메타 질문이 항상 사용자에게 보여야 함 (§7 트리 루트에).
- 확률을 자연어로 표현하면 calibration 불가 + 사용자 간 해석 분산 80% 까지 발생 (Sherman Kent 연구). 수치 강제 미이행은 모듈 전체의 인식적 가치를 무효화.
- 기대값 평균화의 함정: 비가역 catastrophic 옵션과 가역 minor 옵션을 동일 EV 로 계산하면 Jonas 의 책임 비대칭을 위반. lexicographic ordering (비가역성이 다른 기준에 우선) 미내장 시 brief 가 위험한 권장을 정당화.
- 권장의 자기 강화: 에이전트가 작성한 brief 가 자신의 권장을 합리화하는 방향으로 grounds 를 선별하는 motivated reasoning. devil's advocate 옵션을 명시적 섹션으로 강제하지 않으면 회피 불가.
- 시간 압박 상황에서 brief 가 단축되어 confidence · falsifier · assumption 이 누락되는 quality drift. brief 품질 게이트는 시간 압박과 무관해야 하며, 시간 부족 시 brief 생성을 거부하고 결정 보류를 권하는 fallback 필요.
- Brief 가 '결정 위임' 의 형식만 갖추고 실제로는 confirmation bias 동의 요구로 기능 — 사용자가 권장을 거부할 경로 (§7 트리에 '권장 거부 시 대안' 분기) 가 항상 명시되어야 함.

### Concrete rules

- **MUST**: 모든 brief 는 섹션 §0 에서 비가역성/규모/시간지평/가역비용 4 지표를 0~3 으로 평가하고 합산 ≥ 4 일 때만 brief 가 발동된다. 미만이면 에이전트가 결정한다.
- **MUST**: 권장 (§8) 에는 confidence (0~1 수치) 와 falsification trigger (관측 대상 · 시점 · 임계값 3 요소) 가 반드시 포함되어야 한다. 누락 시 brief 는 invalid.
- **MUST**: 옵션이 1 개인 brief 는 발행 금지 — 진짜 분기가 아닌 통보는 다른 채널로 라우팅한다.
- **MUST**: 권장안의 reversibility 점수가 3 (불가) 일 때 §7 트리에 'I accept irreversibility' 명시 체크박스가 강제되며, 동일 효과의 가역 대안이 존재하면 권장보다 상위에 표시된다.
- **SHOULD**: §5 의 각 옵션 결과는 Toulmin 5 필드 (claim/grounds/warrant/qualifier/rebuttal) 를 채워야 하며, rebuttal 이 '없음' 이면 plausibility 경고를 띄운다.
- **SHOULD**: §3 ~ §4 사이 Hidden Assumptions 섹션에 최소 3 개의 명시적 전제가 기재되어야 하며 '없음' 답은 lint 실패.
- **SHOULD**: 자연어 확률 표현 ('아마도', '대체로', 'likely') 은 brief 본문에서 금지하고 수치 구간으로 자동 재작성한다.
- **SHOULD**: §6 3 줄 요약은 (사안 본질 / 핵심 trade-off / 권장 + confidence) 슬롯 형식을 따르며, 본문 없이 요약만 읽어도 동일 권장에 도달 가능해야 한다 (self-coherence test).

### Cross-axis connections

- **AI Harness**: falsification trigger · confidence · hidden assumption 의 강제는 프롬프팅 · linting · output schema 레벨에서 구현되어야 하므로 AI Harness 가 enforcement 메커니즘을 담당.
- **심리학**: precautionary principle 과 reversibility lexicographic ordering 은 사용자의 loss aversion · status quo bias 와 상호작용 — 심리학 축이 편향 보정을 다룬다면 철학 축은 그 보정의 규범적 정당화를 제공.
- **경영학**: Toulmin · Bayesian calibration 은 경영학의 decision quality framework (Howard, Russo) 와 수렴 — 철학은 규범적 토대, 경영학은 운영 방법론 담당 분업.
- **인문학**: '중대' 의 정의에서 인문학이 사용자 · 문화 특수적 가치 차원을 다룬다면, 철학 축은 그 가치 차원을 가로지르는 형식적 사고규칙 (비가역성 · 책임귀속) 을 제공.
- **장기 개발론**: reversibility 점수는 코드/아키텍처 결정에서 'reversible vs one-way door' (Bezos) 구분과 연결 — 개발론이 도메인 특화 reversibility 판정 기준을 제공하면 철학 축이 그 메타 원칙을 정당화.
- **심리학 · 인문학**: 'Most-affected stakeholder 시점' 강제는 perspective-taking 인지 작업으로 심리학 영역과 겹치며, 누가 stakeholder 인지의 식별은 인문학적 사회 분석을 요구.

---

## 축 6 — 장기 개발론 (Long-Horizon Development)

### 렌즈

소프트웨어 장기 진화 관점에서 *"이 결정이 6 개월 후 우리를 어디에 묶어둘 것인가"* 를 묻는다. 결정의 즉각적 정합성보다 가역성 · blast radius · 결합 표면 · 하이럼 노출도 같은 **시간축 비용** 을 표면화하여, 단기 합리성이 장기 비합리로 누적되는 패턴을 차단한다.

### Core insights

**1. 결정의 본질적 비용은 '실행 비용' 이 아니라 '되돌리기 비용 × 발견 시점까지의 누적 결합' 이다.** 8 섹션 원안의 §5 '결과 예상' 은 비용을 단일 시점 스칼라로 다루는데, 가역성 차원이 누락되면 일방향 문 (one-way door) 을 양방향 문 (two-way door) 처럼 다루는 실수가 구조적으로 발생한다.

*근거.* Bezos 의 Type 1/Type 2 결정 분류 + Amazon API mandate 회고에서 정착된 reversibility 원칙. 일방향 결정은 의사결정 임계치 (증거 요구량) 를 양방향 결정보다 한 자릿수 높여야 하며, 두 부류를 동일 프로토콜로 처리하면 Type 1 은 과소심사, Type 2 는 과대심사되어 조직 전체가 느려진다.

*함의.* §5 섹션을 'Reversibility Classification' 필수 필드로 강화: `{two_way / one_way / one_way_with_migration_path} × {undo_cost: 시간/노력/관계 비용 추정} × {decay_horizon: 되돌릴 수 있는 시한}`. one_way 로 분류되면 권장 방향 (§8) 옆에 'Type 1 — 추가 증거 요구' 경고 배지를 강제.

**2. 에이전트가 제시하는 '권장 방향' (§8) 은 거의 항상 blast radius 를 과소표현한다.** 변경 표면이 코드 · 데이터 · 계약 · 외부 의존자 · 운영 절차로 어디까지 번지는지 명시하지 않으면, 사용자는 '국소 변경처럼 보이는 전역 변경' 에 동의하게 된다.

*근거.* Google SRE Workbook 의 'change blast radius' 개념 + Hyrum 의 법칙 (충분한 사용자가 있으면 관측 가능한 모든 동작에 의존자가 생긴다). API 가시 표면 한 줄 변경이 다운스트림 N 개에 silent breakage 를 유발한 사례가 표준화된 incident pattern.

*함의.* §2 '무엇을' 에 'blast radius surface' 명시 필드 추가: `{touched_modules, touched_contracts, touched_data_at_rest, touched_external_consumers, touched_operational_runbooks}`. 비어 있는 슬롯은 'verified empty' 로 명시되어야 하며 'unknown' 은 명시적 적색 플래그.

**3. ADR (Architecture Decision Record) 이 의사결정 직후가 아니라 의사결정 '요청 시점' 에 작성될 때 가장 큰 가치를 가진다.** 원안의 §4 '왜' 는 사후 합리화로 흐를 위험이 높다 — '왜 지금 이것을 하는가' 와 '왜 다른 대안을 기각하는가' 가 분리되어야 한다.

*근거.* Michael Nygard 「Documenting Architecture Decisions」 (2011) ADR 표준 양식: Context / Decision / Status / Consequences. 핵심은 'Considered Alternatives' 섹션이며, 이것이 없는 ADR 은 6 개월 후 '왜 X 를 안 했는지' 재논의를 유발하여 같은 결정을 반복 비용으로 두 번 지불하게 만든다.

*함의.* §4 '왜' 를 두 하위 슬롯으로 분할 강제: (a) Decision Driver — 무엇이 지금 이 결정을 강제하는가 (forcing function), (b) Rejected Alternatives — 최소 2 개 대안 + 각 대안의 기각 사유. 대안이 1 개거나 '대안 없음' 이면 false dichotomy 적색 플래그.

**4. 기술부채는 단일 차원이 아니다.** Fowler 의 4 분면 (deliberate/inadvertent × prudent/reckless) 을 적용하지 않으면, 'pragmatic shortcut' (신중한 의도적 부채) 와 'we'll fix it later' (무모한 의도적 부채) 가 같은 권장으로 묶여 사용자가 후자를 전자로 오인하고 승인한다.

*근거.* Fowler 'Technical Debt Quadrant' (2009) + Kelly Sutton 의 'tech-debt as inventory' 모델. 무모한 부채는 이자가 비선형으로 누적되어 6~12 개월 후 모듈 전체 재작성을 강제하는 통계적 패턴이 다수 post-mortem 에서 확인됨.

*함의.* §5 '결과 예상' 에 'Debt Profile' 명시 필드: `{quadrant: deliberate_prudent / deliberate_reckless / inadvertent_prudent / inadvertent_reckless, repayment_trigger: 언제 갚아야 하는가, interest_model: linear / compounding / cliff}`. cliff 부채 (특정 임계 전까지는 무료, 이후 폭발) 는 권장 방향에 차단성 경고.

**5. 결합도 (coupling) 는 권장 방향의 숨겨진 비용이다.** 원안에는 '이 결정이 어떤 결합을 새로 만드는가/끊는가' 를 묻는 섹션이 없어, 결합 표면이 늘어나는 결정이 '간단한 추가' 로 보고된다.

*근거.* Ousterhout 「Philosophy of Software Design」 의 'deep module' 원칙 + Hickey 「Simple Made Easy」 의 complect (엮음) 정의. 인터페이스 폭/구현 깊이 비율이 악화되는 변경은 그 자체로는 기능하지만 향후 모든 변경의 한계비용을 영구적으로 끌어올린다.

*함의.* §2 '무엇을' 에 'Coupling Delta' 필드 추가: `{new_dependencies, new_consumers, interface_surface_delta: +N methods/+M fields, depth_to_interface_ratio_change}`. 인터페이스 폭이 증가하면서 모듈 깊이가 증가하지 않으면 'shallow module growth' 경고.

**6. 에이전트의 '권장 방향' 은 거의 항상 strangler fig · branch-by-abstraction 같은 점진적 마이그레이션 경로를 제시하지 않고 big-bang 대안 1 개만 제시** 한다. 점진 경로의 부재는 '되돌릴 수 없는 결정' 을 만드는 가장 흔한 원인이다.

*근거.* Fowler 'StranglerFigApplication' (2004) + 'BranchByAbstraction' (2007). 대규모 리팩터링 · 교체 결정에서 점진 경로를 강제 검토한 팀과 그렇지 않은 팀의 롤백 가능성 차이가 post-mortem 데이터에서 일관되게 나타남.

*함의.* §8 '권장 방향' 에 'Incremental Path Check' 강제: 권장이 big-bang 이면 (a) 왜 strangler fig 가 불가능한지, (b) 왜 branch-by-abstraction 이 불가능한지, (c) feature flag 로 분할이 불가능한지 — 세 질문에 명시 답변 없이는 'recommended' 상태로 출력 금지.

**7. Lehman 의 진화법칙은 '시스템은 사용될수록 변경 압력이 증가하고, 변경 없이는 만족도가 하락한다' 를 말한다.** 원안의 결정 모델은 정적이라 'do nothing' 을 비용 없는 baseline 으로 다루지만, 실제로는 *do nothing 도 시간에 따라 비용이 누적되는 능동적 선택* 이다.

*근거.* Lehman 의 소프트웨어 진화 8 법칙 (특히 I. Continuing Change, II. Increasing Complexity, VI. Continuing Growth). 'no decision is a decision' 을 정량화한 가장 권위 있는 경험법칙.

*함의.* §5 '결과 예상' 에 'Null Option Cost' 필수 슬롯: 결정을 미루거나 거절했을 때 `{30d / 90d / 1y}` 시점에서 추정되는 비용. null option 이 '비용 0' 으로 보고되면 자동 적색 플래그 — Lehman 법칙 위반.

**8. 결정 사항은 '관측 가능성 (observability) 비용' 을 동반한다.** 새 기능 · 새 결합 · 새 데이터 흐름은 그 자체로 동작해도 '관측되지 않으면 디버깅 불가' 한 회색 영역을 만든다. 원안에는 이 차원이 없다.

*근거.* Charity Majors 『Observability Engineering』 + Google SRE 의 'unknown unknowns' 분류. 신규 결정의 30~40% 가 incident 후에야 'observability gap' 으로 식별되는 패턴은 production 시스템 post-mortem 의 표준 발견.

*함의.* §2 또는 §5 에 'Observability Cost' 명시 필드: `{new_signals_needed: 추가해야 할 metric/log/trace, debuggability_delta: 문제 발생 시 진단 시간 추정 변화}`. 새 결합/새 데이터 흐름이 있는데 observability 증분이 0 이면 'silent failure risk' 경고.

**9. Postel 의 법칙 (보낼 때 엄격, 받을 때 관대) 을 무비판적으로 적용한 결정은 Hyrum 노출도를 폭발시킨다.** 원안의 '권장 방향' 은 'compatibility' 를 단조 선이라고 가정하지만, 관대한 수신은 단기 호환성과 장기 결합을 교환한다.

*근거.* Postel 'robustness principle' (RFC 760) + 후속 비판 (Eric Allman 2011, Martin Thomson IETF draft 'The Harmful Consequences of the Robustness Principle' 2019). 관대한 파서는 비표준 입력을 silently 받아들여 그 동작 자체가 새로운 사실상 표준이 되는 락인을 만든다.

*함의.* §8 '권장 방향' 이 'be liberal in what you accept' 을 함의하면 'Hyrum exposure check' 강제: 어떤 비표준 동작이 사실상 계약이 될 위험이 있는가? 그것을 차단할 수 있는 strictness toggle 이 있는가?

**10. 원안의 §7 '판단기준 분기 트리' 는 트리 구조만 강제하고 노드의 '정보 가치' 를 강제하지 않는다.** 좋은 분기 트리는 *'cheapest discriminator first'* — 가장 적은 정보로 가장 큰 결정 공간을 가르는 질문이 루트에 와야 한다.

*근거.* 결정 트리 학습의 information gain 원칙 + Cynefin framework (Snowden) 의 도메인별 결정 접근. 복잡한 결정에서 '가장 비싼 질문' 을 먼저 묻는 트리는 사용자 인지 부하를 폭발시키고 실제로는 탐색되지 않는다.

*함의.* §7 트리의 루트 노드는 'reversibility check' (2-way door 인가?) 로 고정. 다음 레벨은 'blast radius check' (국소인가 전역인가?), 그 다음 'time pressure check' (지금 결정해야 하는가?). 도메인별 질문은 그 다음 레벨부터. 이 순서가 cheapest discriminator 원칙.

**11. 8 섹션 원안에는 'Decision Provenance' (이 결정 요청이 어떤 prior 결정에서 파생되었는가) 추적이 없다.** 후속 결정이 prior 결정의 가정을 상속하는 사실이 명시되지 않으면, prior 가 폐기될 때 후속이 좀비 결정이 된다.

*근거.* ADR 의 'Supersedes / Superseded by / Relates to' 링크 + RDBMS foreign key cascade 모델. 결정 그래프 (decision graph) 를 유지한 팀과 단발 ADR 만 쓴 팀의 6 개월 후 일관성 차이는 enterprise architecture 문헌에서 반복 보고됨.

*함의.* §1 '간단 개요' 머리에 'Decision Lineage' 메타 슬롯: `{parent_decisions: [id1, id2], assumed_invariants: [...]}`. parent 가 폐기/변경되면 이 결정도 재검토 큐에 자동 진입해야 한다는 메타데이터.

**12. AI 에이전트가 작성한 hyperbrief 는 '에이전트가 모르는 것' 을 표면화하지 못하는 경향이 강하다.** 8 섹션 원안은 'confidence' 와 'epistemic gap' 을 명시하는 칸이 없어, 추측이 사실과 동일한 인쇄 무게로 출력된다.

*근거.* post-incident review 표준의 'known unknowns vs unknown unknowns' 분류 + Calibrated forecasting 연구 (Tetlock 『Superforecasting』). 미보정 확신이 의사결정에 들어가는 비율과 후행 오류율의 상관은 강하게 양의 값.

*함의.* 모든 섹션에 'epistemic tag' 필수: `{verified / inferred / assumed / unknown}`. §5 와 §8 에서 inferred 이상 비율이 임계 (예: 40%) 를 넘으면 'low-confidence briefing — additional reconnaissance recommended' 헤더 자동 추가.

### Prompting implications

- 시스템 프롬프트에 'Type 1/Type 2 reversibility classification 은 모든 brief 의 선결 조건' 을 hard requirement 로 박는다. 분류 없는 brief 출력 금지.
- 에이전트에게 'Rejected Alternatives 최소 2 개' 를 강제. 1 개 또는 0 개면 self-check 단계에서 brief 재생성. '대안 없음' 은 명시적으로 'forcing function 이 이것을 강제하는 이유 N 문장' 으로 정당화해야 함.
- Big-bang 권장 출력 전에 internal checklist: strangler fig 가능? branch-by-abstraction 가능? feature flag 분할 가능? — 세 질문에 명시적 답변 없이는 'recommended' 를 'tentative' 로 다운그레이드.
- 'Null Option Cost' (do nothing 비용) 를 모든 brief 에서 별도 슬롯으로 계산하라고 지시. 비용 0 으로 보고하면 Lehman 법칙 검증 실패로 reroll.
- 'Hyrum exposure check' 프롬프팅: 권장 변경이 외부 가시 동작 (API, 출력 형식, 시간 동작, 에러 메시지 문자열까지) 을 건드리면, 어떤 의존자가 그 동작에 락인될 가능성이 있는지 명시 출력.
- Epistemic tagging 강제: 에이전트가 사실로 출력하는 모든 claim 에 `{verified | inferred | assumed | unknown}` 중 하나를 부착하지 않으면 sanity check fail.
- 권장 방향의 '비용' 추정에 반드시 시간 단위 (person-day) + 가역성 단위 (rollback cost in person-day) + 부채 단위 (quadrant) 세 차원을 분리해서 출력.
- 에이전트가 prior 결정을 참조할 때 'decision_id' 형식으로 명시 링크하도록 강제. 막연한 '전에 결정한 대로' 는 금지 — superseded 추적이 불가능해짐.
- 사용자가 'just do it' 이라고 말하면, 에이전트는 brief 를 생략하는 대신 'Express Brief' (섹션 1 + 5 + 7 만, reversibility 는 필수 유지) 로 다운그레이드. reversibility 는 어떤 모드에서도 생략 불가.

### Structural recommendations

- 원안 §1 '간단 개요' 위에 'Decision Header' 메타 블록을 신설: `{reversibility: 2way/1way/1way+migration, blast_radius: local/module/system/cross_system, time_pressure: now/this_week/this_month/none, decision_lineage: parent_ids[]}`. 사용자가 30 초 안에 결정 등급을 파악할 수 있어야 함.
- 원안 §4 '왜' 를 두 하위 섹션으로 분할: §4a Decision Driver (forcing function — 왜 지금?), §4b Rejected Alternatives (최소 2 개 + 각 기각 사유). §4b 가 비면 brief 미완성.
- 원안 §5 '결과 예상' 을 표 형식으로 강제 구조화: 행 = `{권장안, 대안1, 대안2, do_nothing}`, 열 = `{30d 비용, 90d 비용, 1y 비용, 롤백 비용, 부채 quadrant, blast radius}`. 표가 비어 있으면 시각적으로 즉시 식별되도록.
- 원안 §7 '판단기준 분기 트리' 의 루트 3 노드는 표준화 고정: (1) reversibility, (2) blast radius, (3) time pressure. 도메인 질문은 4 번째 레벨부터. mermaid flowchart 로 렌더링하되 루트 3 노드는 색상/굵기로 차별화.
- HTML 출력에 'Decision Cost Surface' Radar chart 추가: 축 = `{기능 비용, 가역 비용, 결합 비용, 부채 비용, observability 비용, Hyrum 비용}`. 권장안과 대안을 동일 차트에 오버레이하여 단일 비용 시점이 아니라 '비용 형상' 을 본다.
- HTML 출력에 'Decision Graph' mini-view: 현재 결정 노드와 parent/sibling/likely-children 결정 노드를 보여 prior 가정 의존성을 시각화. ADR 그래프의 라이트 버전.
- Constellation 카드 임베드 시 헤더 좌상단에 reversibility 배지 (녹/황/적) 를 강제 표기. 카드 한 줄로 'Type 1 — 신중 검토 필요' 가 보여야 결정 부담이 시각적으로 전달됨.
- 모든 섹션에 'last_verified' 타임스탬프를 footer 에 표기. 24 시간 이상 경과한 brief 는 사용자에게 '재검증 권장' 상태로 표시 — Lehman 법칙의 brief-level 적용.
- MD 출력은 ADR-compatible 헤더 (Title / Status / Context / Decision / Consequences) 와 1:1 매핑 가능하도록 섹션 ID 를 ADR 표준에 align. 사후 archived decision 으로 정착할 수 있도록.
- 권장 방향 (§8) 은 'Recommended path' 와 'Reversible fallback' 을 쌍으로 출력. fallback 없는 권장은 출력 금지 — '되돌릴 수 없는 권장' 을 구조적으로 차단.

### Pitfalls

- Reversibility 분류 없이 모든 결정을 동일 임계로 처리 → Type 1 결정이 Type 2 속도로 처리되어 일방향 문이 부주의하게 닫힘. 6 개월 후 'why did we do that' incident.
- 'do nothing' 을 비용 0 baseline 으로 다룸 → Lehman 법칙 위반. 미루기 · 거절도 능동적 비용을 발생시키지만 brief 가 그것을 숨기면 사용자는 '안전한 선택' 으로 misread.
- Big-bang 권장만 출력, 점진 경로 무검토 → strangler fig · branch-by-abstraction 이 가능한 결정도 일방향으로 처리. 롤백 옵션이 결정 시점에 잘려나감.
- Rejected Alternatives 미포함 → 6 개월 후 같은 결정이 '왜 X 를 고려 안 했는가' 로 재논의되어 결정 비용을 두 번 지불. ADR 결여 패턴.
- Blast radius 를 변경 라인 수로만 표현 → Hyrum 의 법칙 위반. 한 줄 변경이 외부 의존자에게 전역 변경인 경우를 표면화 못함.
- Coupling delta 누락 → 결합 표면이 늘어나는 결정이 '간단한 추가' 로 보고됨. 모든 후속 변경의 한계비용이 영구히 상승하는데 brief 에는 그 누적 비용이 안 보임.
- 기술부채를 단일 차원으로 다룸 → deliberate-prudent 와 inadvertent-reckless 가 같은 권장으로 묶임. 사용자가 'pragmatic shortcut' 으로 승인했는데 실제는 cliff 부채.
- Decision lineage 미추적 → parent 결정이 폐기되면 child 결정이 좀비 상태로 잔류. 일관성 붕괴의 가장 흔한 시스템적 원인.
- Epistemic tagging 부재 → 에이전트의 추측이 사실과 동일 인쇄 무게로 출력. 사용자는 자신감 차이를 식별 못하고 추측에 기반해 일방향 결정.
- Observability cost 미명시 → 새 결합/새 데이터 흐름이 silent failure 영역을 만들어도 brief 에 안 보임. 디버깅 불가 영역이 결정과 함께 무료로 따라옴.

### Concrete rules

- **MUST**: 모든 brief 는 Decision Header (reversibility / blast_radius / time_pressure / decision_lineage) 를 §1 섹션보다 앞에 출력해야 한다. 누락 시 brief 는 '미완성' 상태이며 권장으로 제출 불가.
- **MUST**: §4 '왜' 는 (a) Decision Driver 와 (b) Rejected Alternatives 최소 2 개를 모두 포함해야 한다. 대안이 1 개 이하이면 'forcing function 이 대안 공간을 닫는 이유' 를 명시해야 한다.
- **MUST**: §8 권장 방향은 항상 'Reversible Fallback' 을 짝으로 제시한다. fallback 이 'no fallback possible' 이면 reversibility 는 자동 one_way 로 분류되고 적색 배지가 강제된다.
- **MUST**: §5 결과 예상은 'do nothing' 옵션을 별도 행으로 포함하며 비용을 0 이 아닌 값으로 추정한다. 0 으로 추정되면 Lehman 법칙 위반 플래그.
- **SHOULD**: 모든 사실 claim 에 epistemic tag `{verified / inferred / assumed / unknown}` 을 부착한다. inferred 이상 비율이 40% 를 초과하면 헤더에 'low-confidence' 배너.
- **SHOULD**: Big-bang 권장 출력 전 strangler fig / branch-by-abstraction / feature flag 세 점진 경로의 불가능 사유를 명시한다. 세 사유 없이는 권장 상태 'tentative' 로 다운그레이드.
- **SHOULD**: §7 분기 트리의 루트 3 노드는 (reversibility, blast radius, time pressure) 로 고정한다. 도메인 질문은 그 다음 레벨부터 배치.
- **MUST**: Constellation 카드 임베드 헤더 좌상단에 reversibility 배지 (녹/황/적) 를 표기한다. 카드 한 줄로 결정 등급이 시각적으로 식별 가능해야 한다.

### Cross-axis connections

- **심리학**: reversibility 배지는 단순 정보 표기가 아니라 sunk cost / commitment escalation 편향을 차단하는 시각 장치다. 심리학 축이 '결정 후 변경 어려움' 편향을 다룬다면, 개발론은 '결정 전 가역성 명시' 로 보완한다.
- **경영학**: Type 1/Type 2 분류는 Bezos 의 의사결정 분류와 직접 연결되지만, 개발론은 그것을 '코드/계약/데이터 레이어에서 어떻게 식별하는가' 의 기술적 판정 기준으로 구체화한다. 경영학이 'what kind of decision' 을 다루면 개발론은 'what makes it that kind in code terms' 를 다룬다.
- **철학**: '되돌릴 수 없는 결정에는 더 높은 증거 임계' 는 철학의 비대칭 위험 원칙과 정합하지만, 개발론은 그것을 'one-way door / two-way door' 운영 정의로 변환한다.
- **AI Harness**: epistemic tagging 은 LLM 의 hallucination 차단 메타 프롬프팅과 직접 결합한다. AI Harness 가 '에이전트가 확신을 어떻게 보고하게 할 것인가' 를 다루면, 개발론은 'verified vs inferred vs assumed 구분이 왜 의사결정 임계에 영향을 주는가' 의 근거를 제공한다.
- **인문학**: ADR 의 'Considered Alternatives' 는 기록 문화 (record-keeping) 의 한 형태이며, 인문학이 다루는 '결정의 기억과 정당화' 전통과 연결된다. 개발론은 그것을 'parent_decisions 그래프' 로 운영화한다.
- **경영학**: 'Null Option Cost' (do nothing 비용) 는 경영학의 opportunity cost 개념과 직접 정합하지만, 개발론에서는 Lehman 법칙으로 정량화 근거가 강화된다.

---

## 맺으며

6 개 축을 고른 이유는, 각 축이 *독립적으로* **"브리핑의 형식 자체가 실패 모드"** 라는 진단에 도달했기 때문이다. AI Harness 는 prompt-level forcing-function 부재를, 인문학은 Habermas 식 강제된 동의를, 심리학은 anchoring + IKEA effect + alert fatigue 를, 경영학은 결정 유형과 무관한 균일 깊이 브리핑을, 철학은 인식적 겸손 장치 부재를, 장기 개발론은 reversibility blindness 를 본다. 이 수렴이 002 문서의 출발점이다 — 무관한 6 개 학제 문헌이 같은 산출물에 적용되었을 때 모두 *"브리핑의 내용이 아니라 형식에 규율이 필요하다"* 라는 결론에 이르는 것은 우연일 수 없다.

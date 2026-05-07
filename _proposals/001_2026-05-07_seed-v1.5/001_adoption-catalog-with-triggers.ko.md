# 제안 001 — Adoption Catalog with Triggers (트리거 기반 도입 카탈로그)

> 부분-도입 규율의 구체화. 명명된 메타패턴이 없으면 "일부만" 시드 표준을 도입한 적용 프로젝트마다 나머지를 조용히 떨어뜨리거나 (왜 떨어뜨렸는지도 잊고), 또는 거절 사유를 여러 노트에 흩어 적어 따로 노화시킨다.

## 왜 필요한가

시드 v1.4 는 **Migration Guides** 에서 이미 가산-비파괴 (additive-not-destructive) 정신을 따른다 — 적용 프로젝트가 표준 일부만 골라도 된다고 명시. 실제로 일부만 고르는 게 흔한 케이스다: 많은 프로젝트가 `_lessons/` 와 `PM/` 은 즉시 도입할 가치가 있으나 `_coordination/` / `_contracts/` / `_questions/` 는 팀 규모·인터페이스 복잡도 대비 시기상조라고 판단한다.

다만 본문에 빈 자리가 있다 — *적용 프로젝트는 나머지를 왜 건너뛰었는지, 언제 다시 보러 와야 하는지를 어떻게 기억하는가?* 두 가지 실패 모드가 따라온다:

1. **조용한 drift** — 프로젝트가 부분 집합을 적용한 후 거절 기준을 잊는다. 몇 년 뒤 새 에이전트가 같은 표준을 재평가할 때 맹목적으로 재도입하거나 기록 없이 다시 거절한다.
2. **흩어진 사유** — 프로젝트가 거절 기준을 commit 메시지, ad-hoc 기획 문서, AGENTS.md 본문 등에 적어 둔다. 각 위치가 다르게 노화한다; 어느 곳도 단일 진실 공급원이 아니다.

단순한 명명된 메타패턴이 둘 다 해결한다: **부분 도입 + 트리거 보존** — 단 하나의 영구 산출물에 *무엇이 보류됐는지*, *왜 보류됐는지*, *어떤 조건이 도입을 트리거할지*, *그 도입이 어떤 작업을 수반할지* 를 기록한다.

## 메타패턴

여러 옵션이 있는 시드 표준 family 를 적용할 때 적용 프로젝트는:

1. 프로젝트의 *현재* 운영 형태에서 비용을 회수할 옵션들을 도입.
2. 나머지 옵션들은 보류.
3. 보류된 각 옵션을 다음 컬럼의 단일 **트리거 표** 에 캡처:

| # | 옵션 | 들어갈 자리 | 트리거 (도입 시점) | 도입 작업 (scaffold) |
| --- | --- | --- | --- | --- |

4. 트리거 표를 안정적인 위치에 보관 — `PM/` 권장. 트리거-구동 도입은 개념상 "begin" 단계가 보류된 다단계 task 이므로.

5. 트리거 조건이 발화하면 행을 참조해 도입 작업 수행, 표 안에서 행을 DONE 표시 (또는 별도 완료-행 섹션으로 이동).

## 실제 적용 사례

EstreUI 적용 호스트 프로젝트가 시드 v1.4 를 적용하면서 `_lessons/` 와 `PM/` 만 도입했다. 나머지 5 표준 영역 (`rules.md`, `architecture.md`, `_coordination/`, `_contracts/`, `_questions/`) 을 `PM/001_seed_migration_triggers.md` 에 *프로젝트의 현재 운영 형태* 와 결부된 거절 사유와 함께 캡처:

- **단일 에이전트 운용** → `_coordination/` / `_questions/` 가 비용 회수 못 함.
- **AGENTS.md 가 컴팩트** (§3 9-rule 이 현 정책 모두 커버) → `rules.md` 분리는 명확화보다는 모호화.
- **Architecture 본체가 적용 라이브러리의 docs 폴더에 거주** → 호스트 고유 architecture (라우팅, service worker, 외부 연동) 가 충분히 누적되기 전까지 별도 `architecture.md` 는 시기상조.

위 운영-형태 조건 중 어느 것이 나중에 변하면 (두 번째 에이전트 합류, AGENTS.md §3 가 ~50 줄 초과, 호스트 고유 architecture 누적), `PM/001` 의 행이 진입점 — 재도출 없이, 재발견 없이.

## 옵션 카탈로그 (제안 v1.5 흡수)

메타패턴은 같은 묶음의 작은 제안 002 ~ N 과 미래 묶음들을 자연스럽게 흡수한다. 각 옵션을 자체 시드-본문 섹션으로 흩어 두는 대신, v1.5 가 모든 명명 가능한 옵션을 함께 나열하는 **단일 Adoption Catalog 표** 를 가질 수 있다:

| # | 옵션 | 트리거 (도입 시점) | `.agent/` 내 들어갈 자리 | 도입 작업 |
| --- | --- | --- | --- | --- |
| A | `_lessons/` (트러블슈팅 ledger) | 30+ 분 블로커 또는 비직관적 동작 재발생. | `.agent/<role>/_lessons/` | 폴더 + README 템플릿 + 인덱스. |
| B | `PM/` (다단계 task 추적) | task 가 한 sitting 을 넘기거나 DEFERRED 옵션이 있을 때. | `.agent/<role>/PM/` | 폴더 + README + 시번 task 파일들. |
| C | `_coordination/` (멀티에이전트 STATE/HANDOFF/CHANGELOG) | 2명 이상 에이전트가 같은 repo 에서 동시 작업. | `.agent/<role>/_coordination/` | STATE.md + HANDOFF.md + CHANGELOG.md + AGENTS.md coordination 섹션. |
| D | `_contracts/` (인터페이스 계약) | 부분 간 인터페이스 (API · 이벤트 · 타입) 가 단일 commit 에서 동시 수정되는 빈도가 늘어남. | `.agent/<role>/_contracts/` | api/ events/ types/ 하위 + DRAFT → REVIEW → ACTIVE 라이프사이클. |
| E | `_questions/` (비동기 Q&A) | 옵션 C 와 함께 — 단일 에이전트 운용에서는 가치 없음. | `.agent/<role>/_questions/` | open/ resolved/ 하위 + 우선순위 규칙. |
| F | `rules.md` (작업 규칙) | AGENTS.md §3 가 ~50 줄 초과 또는 작업 공간 한정 규칙이 프로젝트 전체 AGENTS 와 분리될 가치 발생. | `.agent/<role>/rules.md` | Markdown 파일 + AGENTS.md §1 행. |
| G | `architecture.md` (기술 스택 · shape) | 호스트 고유 architecture (라우팅 · SW · 외부 연동) 가 누적되어 기존 라이브러리 docs 가 더 이상 적합한 거주지가 아닐 때. | `.agent/<role>/architecture.md` | 다이어그램 + 외부-deps 리스트 markdown. |
| H | `open-implementation-markers.md` (보류 마커 punch list) | `// TODO` / `// FIXME` / inline 주석 마커가 코드에 흩어져 punch list 가 비용 회수. | `.agent/<role>/open-implementation-markers.md` | 같은-commit-제거 규율 단일 markdown. |
| I | `legacy-design-rationale.md` (대체된 디자인 보존) | 주석 처리된 옛 코드가 소스 파일에 누적되어 가독성 저하. | `.agent/<role>/legacy-design-rationale.md` | 부활/영구-폐기 규율 단일 markdown. |
| J | `archive/` (외부 협의 일자별) | 외부-인터페이스 협의가 다단계로 진행되고 계약 직전 협의가 보존 가치 발생. | `.agent/<role>/archive/` | 폴더 + 일자-prefix 파일 컨벤션 + README. |
| K | `adaptation-map.md` (외부-라이브러리 활용 매핑) | 프로젝트 자체 코드가 외부 라이브러리를 점점 더 많이 활용해 "내-것의-어디가-그쪽-어디를" 매핑 비용 회수. | `.agent/<role>/adaptation-map.md` | 단일 markdown. |
| L | 이중언어 docs parallel (`*.en.md` + `*.ko.md`) | 외부 공개 docs 가 다중 작업 언어 지원 필요. | 외부 공개되는 모든 doc | parallel 파일 컨벤션, README split. |
| M | `review/` + `roadmap/` 분리 | 발견된-버그 리스트와 계획된-개선 리스트 둘 다 단일 리스트로 관리 어려울 정도로 누적. | `.agent/<role>/review/` + `.agent/<role>/roadmap/` | 대시보드 README 두 폴더. |
| N | lint indexes spec | 인덱스 ↔ 파일 정합성 drift 빈도가 자동화 회수 가능 수준. | repo root 또는 `.agent/lint.mjs` | Lint 스크립트 + 검사-항목 spec. |
| O | upstream-vs-local + style-guide 페어 | 프로젝트가 라이브러리 + reference-호스트 hybrid 로 운영. | 제안 002 / 003 영역 | 파일-출처 분류기 + sanitization 규칙 두 markdown. |

행 A ~ G 는 시드 v1.4 표준 (이미 본문에 명명됨; 이 카탈로그는 단지 중앙 집계). 행 H ~ O 는 본 묶음과 후속 묶음들이 제안하는 신규 옵션.

카탈로그는 **메뉴**, 체크리스트가 아님. 적용 프로젝트는 *지금* 비용을 회수할 행을 골라 도입하고 미선택 행들을 그대로 나열하는 `PM/NNN_seed_migration_triggers.md` 를 작성한다. 미래 묶음은 신규 행으로 카탈로그를 확장 — 기존 행을 in-place 로 deprecate 하지 말 것; "superseded by" 메모만 추가.

## 시드 본문에 들어갈 자리

추천 위치: **Migration Guides** 직후 새 챕터 — 제목 **Adoption Catalog with Triggers**. Migration Guides 가 옆 자리로 적합한 이유 — 두 챕터 모두 *어떻게* 프로젝트가 시드를 적용하는지 다룸.

챕터 자체는 짧음 — 표가 본체, 산문은 메타패턴 진술 + Migration Guides 의 가산-비파괴 원칙으로 한 단락 후방 참조.

## 영향 받는 기존 시드 섹션

- **Migration Guides** — 섹션 첫머리에 새 챕터로의 forward 참조 한 줄.
- **Phase 3 (Document Management Structure)** — 제안 002 가 여기 끼워짐; 카탈로그의 `.agent/` 폴더 shape 행들이 002 로 link out.
- **Index Synchronization Policy** — 행 N (lint indexes spec) 이 여기 link; 정책에 "spec" appendix 가 추가되면 거기가 목적지.

## 시드 측 마이그레이션 비용

순수 추가만. 기존 챕터 rewrite 없음. v1.4 적용 프로젝트는 본 카탈로그를 가산으로 본다 — 카탈로그를 읽고, 자기 기존 `_lessons/` 와 `PM/` 행이 이미 표현됨을 확인하고, 트리거 발화 시 신규 행 어느 것이든 scaffold 옵션을 얻는다. v1.5+ 신규 부트스트랩 프로젝트는 원래의 Phase 3 + Migration Guides 순차 대신 카탈로그 읽기로 시작.

## 리버스 링크

- 트리거-표-as-PM-task 패턴: 묶음 작성자의 비공개 호스트 프로젝트 사례 (요청 시 commit hash — 묶음 작성자의 호스트 repo 검색).
- Migration Guides 가산-비파괴 원칙: 기존 시드 본문, line 1194 인근.

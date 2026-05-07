# 제안 003 — 라이브러리 + Reference-호스트 Hybrid 운영 케이스

> 제안 002 의 시나리오 3 (`라이브러리 docs mirror 호스트`) 와 시나리오 4 (`라이브러리 + reference 호스트 hybrid`) 에 특화된 5개 운영 패턴. 시드 본문에 현재 동등한 가이드 없음 — 이 시나리오의 적용 프로젝트가 각 패턴을 재도출.

## 왜 필요한가

제안 002 는 shape 를 명명. 본 제안은 *그 shape 들이 작동하기 위해 필요한 운영 규칙* 을 채움: mirror 가 어떻게 일관성을 유지하는지, 문서를 출처별로 어떻게 분류하는지, 외부 협의를 양쪽에 어떻게 archive 하는지, 보존된 디자인 motivation 이 라이브러리에서 왜 특별히 중요한지, 라이브러리 자체 공개 docs 가 적용자 식별자 누설을 어떻게 피하는지.

각 패턴은 제안 001 의 Adoption Catalog 행 한 개 이상에 대응. 공통 컨텍스트 (라이브러리 + reference-호스트 운영) 를 공유하고 운영상 서로 참조하므로 함께 기술.

## 패턴 1 — Mirror sync 정책

> 구체화: 호스트 `<library-name>/` 가 upstream 라이브러리 repo 로부터 단방향 pull 일 때, docs 를 읽으려면 *upstream 과 호스트 commit 양쪽* 을 모두 고려해야 함.

**규칙.** upstream 라이브러리 repo 가 `<library-name>/` 하위 파일들의 **단일 진실 공급원**. 호스트의 mirror 사본은 호스트 repo 에서 작업하는 에이전트를 위한 read-optimization — grep 경로를 단축하지만 콘텐츠를 author 하지 않음.

**Sync 트리거.** upstream 라이브러리 docs 의 어떤 commit (파일 추가 / rename / 실질 rewrite) 도 같은 author 의 다음 호스트-측 commit 에서 호스트-측 mirror sync 를 트리거. 호스트 commit 메시지에 추적성을 위해 upstream commit hash 명명.

**충돌 해결.** Upstream win. 호스트가 호스트-specific 일탈을 기록할 필요가 있으면 mirror 파일이 아닌 `project/upstream-vs-local.md` (패턴 2) 로.

**도구.** mirror-sync 헬퍼 스크립트 (호스트 측) 가 upstream HEAD 를 읽어 `<library-name>/` 으로 파일 복사. 스크립트는 의도적으로 단순 — 파일 복사이지 머지 아님 — 호스트가 이 폴더에서 절대 author 하지 않으므로.

**실제 적용 사례.** EstreUI 적용 호스트 프로젝트가 `.agent/estreui/` 를 공개 EstreUI repo 로부터 sync. 각 호스트-측 mirror sync commit 이 메시지에 upstream commit hash 명명 ("Synced upstream …"). 패턴은 ~50+ upstream commit (다크모드, 퀵패널, noti banner, timeline 등) 을 머지 마찰 없이 살아남았음 — 호스트의 `project/` 폴더가 mirror 영역 외부에 완전히 있어서.

## 패턴 2 — `upstream-vs-local.md` — 파일-출처 분류

> 구체화: 단일 분류기 표가 호스트 repo 의 주어진 파일이 mirror-from-upstream 인지 호스트-자체인지 에이전트에 알려줌.

**규칙.** `project/upstream-vs-local.md` 를 분류기 표로 유지:

| 경로 패턴 | 출처 | Sync 방향 | 호스트-측 수정 정책 |
| --- | --- | --- | --- |
| `<library-name>/**` | mirror | upstream → 호스트 (단방향 pull) | 금지 — upstream 수정 후 resync |
| `project/**` | 호스트-자체 | 없음 | 자유 |
| `scripts/<library-files>` | mirror | upstream → 호스트 | 금지 |
| `scripts/<host-files>` | 호스트-자체 | 없음 | 자유 |
| `styles/<library-files>` | mirror | upstream → 호스트 | 금지 |
| `styles/<host-files>` | 호스트-자체 | 없음 | 자유 |

**왜 별도 파일인가.** 이 분류는 패턴 1 의 *전제 조건*. 없으면 코드 변경하는 에이전트가 변경을 upstream 에 먼저 push 해야 할지, 호스트 측에 commit 할지 모름. 표가 답을 mechanical 하게 만듦.

**유지.** 프로젝트 구조가 변하면 (새 mirror 모듈, 새 host-only 파일 family) 구조 변경과 같은 commit 에서 이 표 갱신.

**실제 적용 사례.** EstreUI 적용 호스트 프로젝트가 `project/upstream-vs-local.md` 유지하면서 새 framework 파일이 mirror 셋에 합류할 때마다 행을 추가. 표는 lint 스크립트 입력 역할도 — "이 commit 이 mirror 파일을 수정하면 대응 upstream commit 도 기록됐는지" 같은 검사가 가능 — 모든 파일의 출처가 한 번의 표 lookup 거리에 있어서.

## 패턴 3 — Dual archive (호스트-측 + 라이브러리-측 양쪽 협의 거울 보관)

> 구체화: 호스트와 라이브러리가 협의 (예: 외부 임베드 통합 spec 을 다단계로) 할 때 *양쪽 모두* archive 폴더 보관. 어느 한 쪽도 단독으로는 권위적이지 않음; 둘이 모이면 협의 재구성.

**규칙.** 협의가 단일 진실 공급원 문서 family (specs, contracts, proposals) 이면 한 쪽을 master 로 정하고 다른 쪽은 redirect-only stub 보관. 협의가 *대화* 라면 — 회신, 검토, 라운드별 결정 — 양쪽 모두 전체 기록 보관. 대화는 본질적으로 양면이고 비대칭 archive 는 컨텍스트를 잃음.

**파일 명명.** 양쪽 모두 `archive/` (Adoption Catalog 행 J) 사용 + 일자-prefix 파일명 (`YYYY-MM-DD_<topic>.md`). 같은 라운드가 양쪽에 등장 시 파일 이름 정렬 — "주제 X 의 라운드 3" 이 양쪽에서 같은 파일명에 도달.

**프라이버시 상호작용.** 한 쪽 비공개 + 다른 쪽 공개 시 비공개 측이 전체 대화 보관; 공개 측은 sanitize 된 카드 (결정 결과만, 내부 식별자 없음) 만 보관. 패턴 5 가 sanitization 규칙 지배.

**실제 적용 사례.** 외부 채팅 라이브러리와 EstreUI 적용 호스트 프로젝트가 임베드 통합 spec 을 5 라운드 (v1 ~ v5) 협의. 각 라운드가 호스트 측에서는 회신을, 라이브러리 측에서는 spec 갱신본을 생성. 호스트의 `project/archive/` 가 호스트-author 회신 보관; 라이브러리가 spec 버전 보관; 라운드 번호가 양 archive 에서 정렬. 특정 필드 이름 변경 사유에 대한 질문이 나왔을 때 양쪽이 일자로 archive 를 grep 해 매칭 라운드 발견.

## 패턴 4 — 라이브러리 측의 `legacy-design-rationale.md` 가치

> 구체화: 디자인 경로를 옆으로 치워둔 *이유* 를 (그 경로가 *무엇이었는지* 와 함께) 보존하는 공개 라이브러리는 낮은 비용으로 적용자 신뢰 획득.

**규칙.** 라이브러리가 옛 디자인을 새 것으로 교체할 때 옛 코드를 단순 삭제하지 말 것. 옛 코드를 `library/legacy-design-rationale.md` 로 이동 + 다음과 함께: 디자인이 시도한 것, 프로젝트가 다른 길을 택한 이유, 언제 부활할 만한지, 미래 유지자가 git 고고학 없이 부활시킬 수 있도록 self-contained 스니펫.

**왜 호스트보다 라이브러리에서 더 중요한가.** 호스트의 옛 코드는 그 호스트의 미래 에이전트에게만 의미. 라이브러리의 옛 코드는 *라이브러리에 자신이 필요한 기능이 있는지 평가하는 모든 적용자* 에게 의미할 수 있음. 라이브러리에서 "이게 X 를 한 적이 있나?" 를 검색하는 적용자가 motivation doc 을 발견하고 완전한 답을 얻음 (네, 스케치됐고, 우리가 이러저러 이유로 ship 안 했고, 여기 스니펫). 이게 "아니, 이 라이브러리는 X 못해" 거절을 "X 하는 법은 알지만 안 하기로 결정했다 — trade-off 는 이거" 대화로 전환.

**라이프사이클.**

- *부활*: motivation doc 에서 스니펫 가져와 복원, 항목 제거.
- *영구 폐기*: 항목 삭제. doc 은 살아있는 motivation 만 보관.

**실제 적용 사례.** EstreUI 적용 호스트 프로젝트가 framework 가 정적 markup 컨벤션 위해 옆으로 치운 동적 root-tab fetch 디자인에 대한 라이브러리-측 `legacy-design-rationale.md` author. 단일 항목이 옛 디자인이 기대한 JSON shape, boot 시 호출 자리, 부활이 검증 필요할 외부 의존을 보존. 서버-구동 메뉴 구조가 필요한 미래 적용자가 본 항목을 발견하고 거기서 시작 가능. (EstreUI 공개 repo, 파일 `.agent/estreui/legacy-design-rationale.{en,ko}.md` 참고.)

## 패턴 5 — 공개 docs sanitization (`style-guide.md`)

> 구체화: 라이브러리 공개 docs 가 코드 예시를 포함할 때, 그 예시가 라이브러리를 적용한 비공개 호스트의 식별자를 누설하지 않아야 함.

**규칙.** `project/style-guide.md` 를 substitution 정책으로 유지:

- 서비스 / 브랜드 이름 → 중립 role (`<host-application>`, `<embedded-library>`).
- 도메인 이름 → example 도메인 (`host.example.com`, `embed.example.com`).
- 비즈니스 도메인이 들어간 클래스 / 함수 이름 → generic role 이름.
- 테넌트 / 파트너 이름이 노출되는 식별자 suffix → 제거 또는 치환.

**언제 발화.** 호스트-측 문서가 라이브러리-측 공개 docs 로의 승격 후보일 때 (예: 호스트-derived 사례가 라이브러리-측 adoption-guide 가 됨), 문서가 경계를 넘기 전 substitution 정책 적용.

**왜 라이브러리 측에도 필요한가.** 실제 적용자를 사례로 쓰고 싶은 라이브러리는 publish 전 sanitize 필수. 작성된 정책 없이는 sanitization 이 ad-hoc 이고 다음에 sanitize 하는 사람이 다른 substitution 을 골라 식별자가 점진적으로 누설.

**실제 적용 사례.** 본 제안 묶음 자체가 패턴 5 사용 — 묶음 작성자의 비공개 호스트 프로젝트가 001 / 002 / 003 의 모든 사례 출처이고, 모든 식별자가 호스트 자체 `style-guide.md` 따라 치환된 후 제안이 author 됨. EstreUI 자체는 직접 명명 — EstreUI 가 공개라서; 그 식별자는 sanitization 불필요.

## 시드 본문에 들어갈 자리

추천 위치: 제안 002 가 추가한 Phase 3 "Other shapes" 하위 섹션 직후 새 챕터. 제목: **Library + Reference-Host Hybrid Operation**. 챕터는 5 패턴을 시드 본문이 다른 곳 (Index Synchronization Policy, External-Interface N-Way Sync 등) 에서 사용하는 같은 `> 구체화: …` quote-prefix 와 함께 numbered 하위 섹션으로 담음.

각 패턴의 Adoption Catalog 행은 제안 001 이 추가한 행 (H, I, J, O) 에 대응 + 패턴 1 / 2 / 3 의 신규 행:

| 카탈로그 행 | 패턴 |
| --- | --- |
| Q | 패턴 1 (mirror sync 정책) |
| O | 패턴 2 (`upstream-vs-local.md`) — 001 카탈로그의 O 에 이미 있음 |
| R | 패턴 3 (dual archive) — 라이브러리 + reference-host 케이스 위한 행 J 의 확장 |
| I | 패턴 4 (legacy-design-rationale 가치) — 001 카탈로그의 I 에 이미 있음, 본 제안이 라이브러리-specific motivation 추가 |
| O | 패턴 5 (`style-guide.md`) — 001 카탈로그의 O 에 이미 있음 |

## 리버스 링크

- 패턴 1 / 2 / 3 / 5 사례: 묶음 작성자의 비공개 호스트 프로젝트. 요청 시 walkthrough.
- 패턴 4 사례: EstreUI 공개 repo, 파일 경로 위 명시. 패턴의 문서화를 트리거한 호스트 commit 은 호스트의 비공개 repo 에 있음 (요청 시 hash).

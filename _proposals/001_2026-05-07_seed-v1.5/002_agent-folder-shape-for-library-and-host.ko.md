# 제안 002 — 라이브러리·호스트 프로젝트의 `.agent/` 폴더 Shape

> 시드 본문 Phase 3 (Document Management Structure) 는 모든 프로젝트를 단일 role — *the project* — 으로 다룬다. 실제 적용은 role 라인 따라 갈라진다: 프로젝트는 호스트일 수도, 라이브러리일 수도, 둘 동시 (라이브러리 + reference-호스트 hybrid) 일 수도, 또는 외부 라이브러리 docs 를 자기 `.agent/` 에 mirror 하는 호스트일 수도 있다. 각각에 맞는 `.agent/` 폴더 shape 가 다르다.

## 왜 필요한가

Phase 3 는 현재 `.agent/` 를 role-무관 문서들의 평면 폴더 (`adaptation-map.md`, `domain-glossary.md`, `architecture.md` 등) 로 scaffold. 지배적 케이스 — 단일-role 호스트 프로젝트 — 는 잘 커버하지만 다음에 대한 명확한 가이드가 없음:

- **순수 라이브러리 프로젝트** — 대부분 문서가 라이브러리 자체에 관한 것이고 "호스트" 라는 질문이 무의미.
- **외부 라이브러리 docs 를 자기 `.agent/` 에 mirror 하는 호스트** — 호스트 repo 에서 작업하는 에이전트가 repo 간 컨텍스트 전환 없이 라이브러리 문서를 grep 으로 도달.
- **하이브리드 repo** — 같은 repo 가 라이브러리 *겸* 그것의 라이브 reference 호스트. 두 role 이 한 repo 를 공유하면서 문서들이 구분 가능해야 함.

명명된 시나리오와 의사결정 트리가 없으면 모든 적용 프로젝트가 layout 을 재발명한다. 어떤 곳은 라이브러리 docs 와 호스트 specific docs 를 단일 평면 폴더에 섞어 두고, 어떤 곳은 비일관 분할로 mirror sync / lint 같은 한 shape 를 가정한 도구를 깬다.

## 4 시나리오

### 시나리오 1 — 순수 호스트 (시드 v1.4 기본)

```
.agent/
├── README.md
├── adaptation-map.md
├── domain-glossary.md
├── architecture.md             (Adoption Catalog 행 G 도입 시)
├── _lessons/
├── PM/
└── ...
```

Phase 3 의 현재 shape 가 이 케이스 커버. 변경 불필요. 카탈로그 행 F (`rules.md`) 와 행 G (`architecture.md`) 가 트리거 발화 시 여기 끼움.

### 시나리오 2 — 순수 라이브러리

```
.agent/
├── README.md
├── core/                       (또는 library/)
│   ├── <topic>.md              (라이브러리 멘탈 모델, 공개 API, 내부 architecture)
│   └── ...
├── integration/                (또는 guides/)
│   ├── adoption-guide.md       (호스트가 라이브러리를 어떻게 적용하는지)
│   ├── migration-guide.md      (호스트가 라이브러리 버전 간 어떻게 업그레이드하는지)
│   └── ...
├── _lessons/
├── PM/
└── ...
```

`core/` (라이브러리 자체, role: 유지자 대상) 와 `integration/` (호스트 대상 가이드, role: 적용자 대상) 의 분할은 아래 시나리오 4 의 "host vs. project context" 의 변형 — 단 여기서 두 번째 role 은 *이 라이브러리를 적용하는 호스트* 로 현재 존재하는 프로젝트가 아닌 가상의 독자.

이 분할은 옵션. 작은 라이브러리는 `.agent/` 평면 유지 가능. 분할 트리거: integration 가이드가 평면 폴더 내 발견성을 잃을 만큼 누적.

### 시나리오 3 — 외부 라이브러리 docs 를 mirror 하는 호스트

```
.agent/
├── README.md
├── <library-name>/             (공개 라이브러리 repo 에서 mirror, 동기 유지)
│   ├── README.md
│   ├── <topic>.md
│   ├── review/
│   ├── roadmap/
│   └── ...
└── project/                    (이 호스트 자체 컨텍스트)
    ├── README.md
    ├── adaptation-map.md
    ├── domain-glossary.md
    ├── upstream-vs-local.md    (카탈로그 행 O — 어느 파일이 mirror 인지 호스트-확장인지 명명)
    ├── style-guide.md          (카탈로그 행 O — 외부 공개되는 docs 의 sanitization 규칙)
    ├── _lessons/
    ├── PM/
    ├── archive/                (카탈로그 행 J — 외부 협의 일자별)
    └── ...
```

최상위 분할: `<library-name>/` 가 mirror 라이브러리 docs, `project/` 가 호스트 자체 컨텍스트. mirror 폴더는 upstream 라이브러리 repo 로부터 단방향 pull (제안 003 이 mirror-sync 정책 상세).

이 shape 가 EstreUI 적용 호스트 프로젝트가 적용한 형태. 분할이 호스트 자체 컨텍스트 (`project/` 하위) 가 라이브러리 docs (라이브러리-이름 폴더 하위) 를 upstream 으로부터 완전 재동기 시 살아남게 만듦 — 충돌 없음, 머지 통증 없음.

### 시나리오 4 — 라이브러리 + reference-호스트 hybrid (단일 repo)

```
.agent/
├── README.md
├── <library-name>/             (라이브러리 role — 시나리오 2 의 core/+integration/ 와 동일 내용)
│   ├── core/
│   ├── integration/
│   ├── review/
│   ├── roadmap/
│   └── ...
└── project/                    (reference-호스트 role — 시나리오 3 의 project/ 와 동일 내용)
    ├── adaptation-map.md
    ├── _lessons/
    ├── PM/
    └── ...
```

덜 흔하지만 실재: 단일 repo 가 라이브러리 코드를 한 경로에, reference-호스트 application (예: 데모 앱, 라이브 테스트 하네스) 을 다른 경로에 보유. 두 role 모두 문서 필요가 있고 구분 가능해야 함.

shape 가 시나리오 3 와 거울 — 단 upstream mirror 없음 — `<library-name>/` 폴더가 이 repo 에서 author 됨, 다른 곳에서 동기되지 않음.

## 의사결정 트리

```
Q1. 이 repo 가 라이브러리를 author 또는 publish 하는가?
    No → 시나리오 1 (순수 호스트).
    Yes → Q2.
Q2. 이 repo 가 그 라이브러리 위에 구축된 reference application 도 호스팅하는가?
    No → 시나리오 2 (순수 라이브러리).
    Yes → Q3.
Q3. 라이브러리 코드가 reference 호스트와 같은 repo 인가, 별개 repo 인가?
    같은 repo → 시나리오 4 (hybrid).
    별개 repo, 이 repo 는 호스트 → 시나리오 3 (mirror 라이브러리 docs 호스트).
    별개 repo, 이 repo 는 라이브러리 → 여기는 시나리오 2, 호스트는 다른 곳 (그쪽이 시나리오 3).
```

트리의 잎이 4 시나리오에 직접 대응.

## 시드 본문에 들어갈 자리

Phase 3 (Document Management Structure) 는 현재 한 shape 만 보여줌. 제안: Phase 3 의 shape 를 **시나리오 1** 로 유지하고, 시나리오 2 / 3 / 4 를 의사결정 트리와 함께 명명하는 "Other shapes" 하위 섹션 추가.

시나리오 3 과 4 는 그것을 지배하는 운영 규칙 (mirror sync, upstream-vs-local 등) 으로 제안 003 으로 forward link. 시나리오 2 의 옵셔널 `core/` + `integration/` 분할은 여기서 명명되지만 별도 제안 불필요 — 트리거와 도입 작업이 단일 Adoption Catalog 행에 들어맞음.

## 추가되는 카탈로그 행

- **행 P** — `<library-name>/` + `project/` 최상위 분할. 트리거: 시나리오 3 또는 4 적용. 들어갈 자리: `.agent/` root. 도입 작업: 기존 평면 `.agent/` 콘텐츠를 `project/` 로 rename, `<library-name>/` 생성, README 갱신.
- 기존 **카탈로그 행 O** (`upstream-vs-local` + `style-guide` 페어) 는 시나리오 3 선택 시 구체적으로 활성.

## 실제 적용 사례

EstreUI 적용 호스트 프로젝트가 시나리오 3 적용. 최상위 분할: `.agent/estreui/` (공개 EstreUI repo 로부터 mirror) 와 `.agent/project/` (호스트 자체 컨텍스트). mirror 폴더는 이중언어 (카탈로그 행 L) — EstreUI 가 두 언어 모두 publish 하므로. 호스트 자체 폴더는 단일 언어 (한국어) — 비공개라 언어 경계 교차 없음.

호스트의 `project/` 폴더는 점진적으로 카탈로그 행 H (`open-implementation-markers.md`), I (`legacy-design-rationale.md`), J (`archive/`), K (`adaptation-map.md`), 그리고 v1.4 의 `_lessons/` + `PM/` 을 채움. 각 행이 자체 트리거에서 도입됨 — 어느 것도 layout 재구성 필요 없었음.

## 리버스 링크

- 시나리오 3 사례: 묶음 작성자의 비공개 호스트 프로젝트. 폴더 layout 위와 정확히 동일. 요청 시 walkthrough.
- 시나리오 2 reference (순수 라이브러리의 점진 도입 가이드): EstreUI repo (공개), 자체 `.agent/` 가 시나리오 2 분할 트리거에 도달할 때 예정. 본 제안의 라이브러리-측 적용은 v1.5 후속이지 v1.5 의존 아님.

# 제안 001 — Bootstrap Residency and Adoption Catalog

> 부분 도입 규율을 구체화하되, v1.5에서는 한 단계를 먼저 추가합니다. `.agent/` 문서를 고르기 전에, 에이전트 문서가 소스 repo와 어떤 관계로 거주해야 하는지 결정합니다.

## 왜 필요한가

시드 v1.4의 **Migration Guides**는 이미 additive-not-destructive 철학을 따릅니다. 적용 프로젝트는 표준 일부만 고르고 기존 흐름을 보존할 수 있습니다. 실제로 부분 도입은 흔합니다. 많은 프로젝트는 `_lessons/`와 `PM/`은 바로 필요하지만, `_coordination/`, `_contracts/`, `_questions/`는 팀 규모나 인터페이스 복잡도가 커지기 전까지 과할 수 있습니다.

v1.5 제안 검토 과정에서 더 상위의 빈틈이 드러났습니다. 현재 작업 폴더가 소스 repo가 아니거나, 소스 repo가 되어서는 안 되는 경우가 있습니다. public source repo, 협업 repo, 다른 조직 소유 repo는 private agent-docs repo를 따로 둘 수 있어야 합니다. 시드가 "어떤 `.agent/` 폴더를 만들까?"만 묻는다면 더 중요한 질문, 즉 **에이전트/개발 운영 문서가 어디에 살아야 하는가**를 놓칩니다.

두 가지 실패 모드가 생깁니다.

1. **부분 도입 drift** — 프로젝트가 일부만 도입한 뒤 나머지를 왜 보류했는지 잊고, 나중에 같은 선택을 근거 없이 반복 평가합니다.
2. **잘못된 repo 거주지** — bootstrap이 source와 agent docs가 같은 repo라고 가정해, private 계획·agent 노트·sanitize 전 사례가 public/collaboration source repo 안에 생성됩니다.

v1.5는 두 제어를 이름 붙여야 합니다.

- **Bootstrap residency check** — 현재 폴더가 source repo인지, private agent-docs sidecar repo인지, multi-project orchestration repo인지 먼저 결정.
- **Partial adoption with trigger preservation** — 보류한 옵션, 사유, 도입 트리거, 도입 작업을 하나의 durable trigger table에 기록.

## 최초 bootstrap 모드

Phase 3가 문서 폴더를 묻기 전에, 시드는 bootstrap 방식을 먼저 묻습니다.

1. **Minimal bootstrap (추천)** — 현재 폴더, git 상태, remotes, 명확한 repo shape를 검사하고 애매한 경우에만 질문.
2. **Full manual setup** — repo residency, source 위치, upstream, public/private 경계, multi-project orchestration 질문을 모두 명시적으로 진행.
3. **Repo provider assisted setup** — repo provider, local git metadata, 또는 사용자가 제공한 repo 목록을 통해 먼저 추론하고 필요한 질문만 진행.

Provider-assisted setup은 GitHub에 한정하지 않습니다. 지원 후보:

- GitHub
- GitLab
- Bitbucket
- Azure DevOps
- Gitea / Forgejo / self-hosted Git
- Local git remotes scan
- 사용자가 제공한 repo 목록 또는 repo 요약

보안 규칙: 사용자에게 password나 raw access token을 채팅에 붙여 넣으라고 요청하지 않습니다. private repo 접근이 필요하면 설치된 connector, 인증된 CLI, 또는 사용자가 제공한 repo 요약을 선호합니다. public repo는 username, org name, repo URL만으로 충분합니다.

Provider-assisted setup으로 repo shape를 확신할 수 없으면 두 선택지만 다시 묻습니다.

- Minimal bootstrap (추천)
- Full manual setup

## 빈 폴더 / seed-only 폴더 확인

현재 작업 폴더가 비어 있거나, seed prompt만 있거나, 아직 구체적 프로젝트 진행 내용이 없는 파일만 있다면 scaffold 전에 다음을 확인합니다.

1. 이 작업 폴더가 **개발/에이전트 문서만 독립 운영하는 repo**인가?
2. 맞다면 source project는 이 폴더 아래에 이미 있는가, 다른 local path에 있는가, remote-only인가, 아직 생성 전인가?
3. source repo가 local 또는 remote에 이미 있는가, 아니면 새 source project를 만들어야 하는가?

툴 접근성 경고:

- Antigravity IDE나 GitHub Copilot처럼 workspace 제한이 있는 에이전트는 열린 workspace 밖을 읽지 못할 수 있습니다. source project가 workspace 밖에 있으면, 해당 에이전트가 작업할 수 있도록 사용자가 작업 폴더 안으로 옮기거나 링크해야 한다고 안내합니다.
- Claude Code와 Codex는 외부 경로 접근이 가능한 경우가 많지만, 실제 read/write 권한은 에이전트가 직접 확인해야 합니다.

사용자가 나중에 source project 폴더가 현재 workspace 안에 준비되었다고 알려주면, 에이전트는 폴더 존재를 확인합니다. 그 폴더가 agent-docs repo에 commit되면 안 되는 별도 source repo 또는 linked project folder라면 root `.gitignore`에 root-relative path를 자동 추가합니다. 사용자가 폴더를 특정하기 전에는 추측 경로를 추가하지 않습니다. 이미 등록된 ignore entry는 중복 추가하지 않습니다. 사용자가 submodule/gitlink로 추적하려는 폴더라면 `.gitignore`에 추가하지 않습니다.

## 메타패턴

여러 옵션을 가진 seed standard family를 적용할 때, 적용 프로젝트는:

1. 현재 운영 shape에서 비용을 회수하는 옵션을 도입합니다.
2. 나머지 옵션은 보류합니다.
3. 보류한 각 옵션을 하나의 **trigger table**에 기록합니다.

| # | Option | Anchor (어디에 mount되는가) | Trigger (언제 도입하는가) | Adoption work (무엇을 scaffold하는가) |
| --- | --- | --- | --- | --- |

4. trigger table은 현재 scope의 `PM/` 폴더에 둡니다. 단일 프로젝트면 `.agent/PM/`, multi-project orchestration이면 `.agent/<unit-project-name>/PM/`일 수 있습니다.
5. trigger 조건이 발화하면 해당 row를 보고 adoption work를 수행한 뒤 DONE 표시하거나 completed rows 섹션으로 옮깁니다.

## Scope root

카탈로그는 하나의 layout을 하드코딩하지 않기 위해 `<scope-root>`를 사용합니다.

| 상황 | `<scope-root>` |
| --- | --- |
| source repo와 agent docs가 같은 단일 repo | `.agent/` |
| 하나의 source project를 위한 agent-docs-only sidecar repo | `.agent/` |
| multi-project orchestration repo | `.agent/<unit-project-name>/` |
| 선택된 scope 내부 upstream split | local/project context는 `<scope-root>/project/`, upstream context는 `<scope-root>/upstream/` 또는 `<scope-root>/<upstream-name>/` |

기본 단일 프로젝트 도입은 `.agent/` 바로 아래 flat 구조입니다. 트리거가 적용되지 않는 한 `<unit-project-name>/`, `project/`, `upstream/` 폴더를 만들지 않습니다.

## 옵션 카탈로그 (v1.5 흡수 제안)

카탈로그는 **메뉴**이지 체크리스트가 아닙니다. 적용 프로젝트는 지금 비용을 회수하는 row만 고르고, 보류한 row는 `PM/NNN_seed_migration_triggers.md`에 기록합니다.

| # | Option | Trigger (언제 도입하는가) | Anchor | Adoption work |
| --- | --- | --- | --- | --- |
| A | `_lessons/` (troubleshooting ledger) | 30분+ blocker 또는 비직관적 동작이 반복됨. | `<scope-root>/_lessons/` | 폴더 + README template + index. |
| B | `PM/` (multi-step task tracker) | task가 한 sitting을 넘기거나 deferred option이 생김. | `<scope-root>/PM/` | 폴더 + README + numbered task files. |
| C | `_coordination/` (multi-agent STATE/HANDOFF/CHANGELOG) | 둘 이상의 agent가 같은 repo에서 동시에 작업. | `<scope-root>/_coordination/` | STATE.md + HANDOFF.md + CHANGELOG.md + AGENTS.md coordination section. |
| D | `_contracts/` (interface contracts) | API, event, type 등 cross-part interface가 written contract 비용을 회수할 만큼 자주 변함. | `<scope-root>/_contracts/` | api/ events/ types/ 하위 폴더 + DRAFT → REVIEW → ACTIVE lifecycle. |
| E | `_questions/` (async Q&A) | Option C가 도입되고 질문을 durable하게 routing할 필요가 있음. | `<scope-root>/_questions/` | open/ resolved/ 하위 폴더 + priority rules. |
| F | `rules.md` (work rules) | AGENTS.md가 너무 커지거나 scope-specific rule이 project-wide rule과 갈라짐. | `<scope-root>/rules.md` | Markdown file + AGENTS.md read-order entry. |
| G | `architecture.md` (tech stack and shape) | scope-specific architecture가 누적되어 기존 docs가 더 이상 적절한 집이 아님. | `<scope-root>/architecture.md` | diagram + external dependency list를 포함한 Markdown file. |
| H | `source-map.md` (source repo locator) | agent docs가 source repo 밖에 있거나, 하나의 agent-docs repo가 여러 source repo를 가리킴. | `<scope-root>/source-map.md` | source repo URL/path, branch, local checkout, access note, current source commit 기록. |
| I | `public-boundary.md` / `style-guide.md` | source repo가 public/collaborative이거나 private agent note가 public docs로 승격될 수 있음. | `<scope-root>/public-boundary.md` 또는 `<scope-root>/style-guide.md` | 이름, domain, service, tenant, example에 대한 sanitization/no-leak 규칙. |
| J | Agent-docs `.gitignore` guard | 별도 source folder가 agent-docs repo 아래에 놓이거나 link됨. | root `.gitignore` | 사용자가 폴더를 특정하면 존재 확인 후 root-relative path 추가. submodule/gitlink는 제외. |
| K | Multi-project orchestration folders | 하나의 agent-docs repo가 여러 독립 project repo를 운영. | `.agent/<unit-project-name>/` | project별 scope root 사용 여부를 묻고 독립 project마다 scope 생성. |
| L | Upstream split | 개발자가 upstream repo를 운영/수정 가능하고, upstream-bound 변경이 현재 project에서 먼저 구현됨. | 기본 `<scope-root>/upstream/` + `<scope-root>/project/` | upstream/project 폴더 생성. 사용자가 지정한 upstream folder name 허용. |
| M | `upstream-vs-local.md` | upstream-bound와 local-only 파일을 기계적으로 분류해야 함. | `<scope-root>/project/upstream-vs-local.md` | path pattern, origin, sync direction, modification policy classifier table. |
| N | Mirror sync policy | upstream docs/files를 검색/읽기 편의상 현재 agent-docs scope로 mirror함. | `<scope-root>/upstream/` 또는 `<scope-root>/<upstream-name>/` | 단방향 copy/sync 규율. sync commit 또는 sync log에 upstream commit hash 기록. |
| O | `archive/` (external conversation by date) | external-interface 협의가 여러 round로 이어지고 pre-contract 대화 보존 가치가 있음. | `<scope-root>/archive/` | folder + dated-prefix file convention + README. |
| P | `open-implementation-markers.md` | TODO/FIXME/deferred marker가 코드에 흩어지고 punch list 비용을 회수함. | `<scope-root>/open-implementation-markers.md` | same-commit-removal discipline을 가진 단일 Markdown. |
| Q | `legacy-design-rationale.md` | commented-out 또는 set-aside design을 source에 남기지 않고 보존해야 함. | `<scope-root>/legacy-design-rationale.md` | revive/permanent-drop lifecycle을 가진 단일 Markdown. |
| R | `adaptation-map.md` | scope가 external library를 점점 많이 사용하고 use map 비용을 회수함. | `<scope-root>/adaptation-map.md` | local usage와 external/library surface mapping. |
| S | bilingual docs parallel (`*.en.md` + `*.ko.md`) | public-facing docs가 여러 working language를 지원해야 함. | 모든 public-facing doc | parallel file convention + README index split. |
| T | `review/` + `roadmap/` split | bug/review finding과 planned improvement가 모두 누적되어 한 list가 noisy해짐. | `<scope-root>/review/` + `<scope-root>/roadmap/` | 두 폴더 + dashboard 역할 README. |
| U | lint indexes spec | Index ↔ file consistency drift가 자주 생겨 automation 비용을 회수함. | repo root 또는 `<scope-root>/lint.mjs` | lint script + checklist spec. |

A-G는 기존 seed standard를 `<scope-root>`로 표현한 것입니다. H-U는 이번 bundle review에서 나온 v1.5 추가 또는 명확화 항목입니다.

## 실제 적용 사례

upstream 프레임워크 적용 host project는 seed v1.4 적용 당시 `_lessons/`와 `PM/`만 먼저 도입했습니다. 다른 표준 영역은 프로젝트의 현재 운영 shape에 묶인 rejection rationale과 함께 trigger table에 기록했습니다.

- 단일 agent operation → `_coordination/` / `_questions/`가 비용 회수 못 함.
- compact AGENTS.md → `rules.md` 분리는 명확화보다 모호화.
- architecture 본체가 적용 라이브러리 docs folder에 있었음 → host-specific `architecture.md`는 아직 시기상조.

v1.5 review는 이 교훈을 일반화합니다. trigger table은 여전히 유효하지만, bootstrap residency decision이 올바른 `<scope-root>`를 먼저 고른 뒤 mount해야 합니다.

## 시드 본문에 들어갈 자리

권장 위치:

1. 초기 bootstrap/migration mode 선택 뒤, Phase 3 전에 **Bootstrap Residency Check** 추가.
2. Phase 3 인근에 **Adoption Catalog with Triggers** 추가하고 Migration Guides에서 짧게 forward reference.
3. Phase 3에서 기본 `.agent/` shape가 단일 프로젝트 기본값이지 유일한 residency shape가 아님을 명시.

## 영향 받는 기존 시드 섹션

- **Bootstrap / Migration mode branching** — minimal/manual/provider-assisted setup 선택 추가.
- **Phase 3 (Document Management Structure)** — 선택된 `<scope-root>`를 사용하고 proposal 002의 shape decision tree로 연결.
- **Migration Guides** — partial adoption과 trigger preservation을 위해 catalog forward reference 추가.
- **Index Synchronization Policy** — row U가 여기로 연결. policy에 lint/spec appendix가 생기면 목적지가 됨.

## 시드 migration 비용

대체로 additive지만 순수 net-add는 아닙니다. `.agent/rules.md`, `.agent/architecture.md`, `.agent/_coordination/STATE.md`, `.agent/PM/`을 하드코딩한 기존 template은 flat 기본값을 유지하거나, non-default layout 선택 시 `<scope-root>` 인식형이 되어야 합니다. 일반 단일 프로젝트 bootstrap의 기본 경로는 변하지 않습니다.

## 리버스 참조

- Trigger-table-as-PM-task pattern: bundle 작성자의 private host project 사례 (hash-only reference는 out-of-band 제공 가능).
- Empty/source-sidecar 및 workspace-boundary concern: 본 bundle에 대한 seed maintainer review, 2026-05-07.
- Migration Guides additive-not-destructive principle: 기존 seed body line 1194 근처.

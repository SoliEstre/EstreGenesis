# 제안 002 — Repo Residency and `.agent/` Folder Shape

> 시드는 어떤 `.agent/` 폴더를 scaffold할지 결정하기 전에, 에이전트/개발 운영 문서가 어디에 살아야 하는지 먼저 결정해야 합니다. 기본값은 현재 프로젝트 안의 flat `.agent/`이지만, public/collaboration repo, sidecar agent-docs repo, multi-project orchestration, upstream-bound work는 이름 붙은 shape가 필요합니다.

## 왜 필요한가

기존 v1.5 draft는 library/host layout에 초점을 두었습니다. 검토 결과 첫 분기는 더 일반적이어야 합니다.

- 현재 작업 폴더가 실제 source repo일 수 있음.
- public 또는 collaboration source repo를 위한 private agent-docs-only repo일 수 있음.
- 여러 독립 project repo를 운영하는 coordinator repo일 수 있음.
- 개발자가 운영하거나 수정 가능한 upstream repo로 먼저 올라가야 할 작업을 포함할 수 있음.

시드가 너무 이르게 하나의 flat `.agent/`를 가정하면, private agent note가 public repo에 새어나가거나, workspace-limited agent가 접근 불가능한 경로를 대상으로 하거나, upstream-bound work가 local-only로 오분류됩니다.

## Bootstrap decision tree

Phase 3 scaffold 전에 실행합니다.

```
Q0. 어떤 bootstrap 방식을 사용할까?
    Minimal bootstrap (추천) → folder/git/remotes를 검사하고 애매할 때만 질문.
    Full manual setup → residency/source/upstream 질문을 모두 직접 진행.
    Repo provider assisted setup → provider/local git/repo list로 추론 후 진행.

Q1. 현재 폴더가 비어 있거나, seed-only이거나, 아직 구체적 project가 아닌가?
    No → Q4.
    Yes → Q2.

Q2. 이 폴더가 developer/agent-docs-only repo인가?
    No → 이후 답변이 바꾸지 않는 한 Scenario 1.
    Yes → Q3.

Q3. source project는 어디에 있는가?
    이미 이 작업 폴더 아래 → path 확인. 별도 source repo면 submodule/gitlink가 아닌 한 root .gitignore에 추가.
    다른 local path → workspace-limited agent가 접근 못할 수 있음을 안내. 필요 시 workspace 아래로 이동/link.
    remote-only → source-map.md 작성. clone/link는 사용자 요청 시.
    아직 없음 → source project를 별도 bootstrap하거나 사용자 지시에 따라 빈 source folder 생성.

Q4. 하나의 agent-docs repo가 여러 독립 project repo를 운영하는가?
    No → Q5.
    Yes → project별 .agent/<unit-project-name>/ 사용 여부 질문 (Scenario 3).

Q5. 개발자가 운영/수정 가능한 upstream repo가 있고,
    upstream-bound 변경이 현재 project에서 먼저 구현되는가?
    No → residency에 따라 Scenario 1 또는 2.
    Yes → 선택된 scope 안에 upstream split 적용 (Scenario 4).
```

Provider-assisted setup은 GitHub, GitLab, Bitbucket, Azure DevOps, Gitea/Forgejo/self-hosted Git, local git remotes, 사용자가 제공한 repo list를 사용할 수 있습니다. password나 raw token은 채팅으로 요청하지 않습니다.

## Scenario 1 — 단일 프로젝트, agent docs가 source repo 안에 있음 (기본)

```
.agent/
├── README.md
├── rules.md
├── architecture.md
├── _lessons/
├── PM/
└── ...
```

기본값은 그대로 유지합니다. 대부분의 프로젝트는 여기에 머물러야 합니다. 후속 scenario가 적용되지 않는 한 `project/`, `upstream/`, `<unit-project-name>/` 폴더를 만들지 않습니다.

## Scenario 2 — 하나의 source project를 위한 agent-docs-only sidecar repo

source repo가 public이거나, 외부 협업자와 공유되거나, 다른 조직 소유이거나, private agent/developer operation docs를 두기에 적절하지 않을 때 사용합니다.

```
agent-docs-repo/
├── .gitignore
└── .agent/
    ├── README.md
    ├── source-map.md
    ├── public-boundary.md       (또는 style-guide.md)
    ├── rules.md
    ├── architecture.md
    ├── _lessons/
    ├── PM/
    └── ...
```

source project가 이 repo 아래에 놓이거나 link되면, 사용자가 폴더를 특정하고 에이전트가 존재를 확인한 뒤에만 root `.gitignore`에 source folder path를 추가합니다. 추측 경로를 추가하지 않습니다. submodule/gitlink는 ignore하지 않습니다.

`source-map.md` 기록 항목:

- source repo URL 또는 local path
- branch / checkout path
- 필요 시 current source commit
- agent/tool별 access limitation
- source가 public, private, collaboration-owned, remote-only 중 무엇인지

`public-boundary.md` 또는 `style-guide.md`는 private agent docs에서 public/collaboration docs로 넘어가면 안 되는 내용을 기록합니다.

## Scenario 3 — Multi-project orchestration repo

하나의 agent-docs repo가 여러 독립 project repo를 운영할 때 사용합니다. 이는 FE/BE role folder보다 상위 단위입니다. 각 unit project가 이미 자체 FE+BE stack을 가질 수 있고, 의미 있는 독립성을 가집니다.

```
.agent/
├── orchestration/
│   ├── README.md
│   └── cross-project-map.md
├── <unit-project-name-a>/
│   ├── source-map.md
│   ├── rules.md
│   ├── architecture.md
│   ├── PM/
│   └── _lessons/
└── <unit-project-name-b>/
    ├── source-map.md
    ├── rules.md
    ├── architecture.md
    ├── PM/
    └── _lessons/
```

시드는 multi-project orchestration이 적용될 때만 `.agent/<unit-project-name>/` 사용 여부를 묻습니다. 한 프로젝트가 Frontend와 Backend 역할을 갖는다는 이유만으로 이 shape를 쓰지 않습니다. 그런 역할은 project scope 내부의 더 낮은 단계 folder입니다.

## Scenario 4 — 선택된 scope 안의 upstream split

개발자가 upstream repo를 운영하거나 수정 권한이 있고, 현재 project에서 upstream-bound 변경을 먼저 구현하거나 테스트할 때 사용합니다. upstream 전용이 아닙니다.

기본 folder name:

```
<scope-root>/
├── upstream/
│   ├── README.md
│   ├── architecture.md
│   ├── review/
│   └── roadmap/
└── project/
    ├── README.md
    ├── upstream-vs-local.md
    ├── style-guide.md
    ├── adaptation-map.md
    ├── PM/
    └── _lessons/
```

기본 upstream folder는 `upstream/`입니다. 사용자가 upstream 이름을 명시하면 (`estreui`, `payments-sdk`, `internal-platform` 등) 그 이름을 사용합니다.

```
<scope-root>/
├── <upstream-name>/
└── project/
```

일반 단일 project repo에서 `<scope-root>`는 `.agent/`입니다. multi-project orchestration repo에서는 `.agent/<unit-project-name>/`입니다.

기존에 제안된 `.agent/estreui/` + `.agent/project/` layout은 이 generic upstream split의 named instance입니다. 모든 project의 기본값이 아닙니다.

## Workspace access rule

source project가 현재 workspace 밖에 있으면:

- Antigravity IDE나 GitHub Copilot 같은 workspace-limited agent는 접근하지 못할 수 있습니다. 해당 agent가 작업해야 한다면 사용자가 source project를 workspace 아래로 옮기거나 link해야 한다고 안내합니다.
- Claude Code와 Codex는 외부 경로 접근이 가능할 수 있지만, 에이전트는 해당 path를 사용하기 전에 read/write access를 확인해야 합니다.

## 시드 본문에 들어갈 자리

Phase 3 prelude 또는 Phase 3 바로 앞 새 섹션으로 추가합니다.

1. bootstrap style 선택.
2. repo residency와 source location 결정.
3. multi-project orchestration 여부 결정.
4. upstream split 여부 결정.
5. 선택된 `.agent/` shape scaffold.

Migration Guides는 기존 repo에 흩어진 agent note, public repo 안 private docs, 보존해야 할 source/agent-docs split이 있을 때 여기로 연결해야 합니다.

## 추가 또는 명확화되는 catalog row

- **Row H** — sidecar 또는 multi-project source location을 위한 `source-map.md`.
- **Row I** — public/private sanitization을 위한 `public-boundary.md` / `style-guide.md`.
- **Row J** — agent-docs repo 아래 source folder에 대한 `.gitignore` guard.
- **Row K** — `.agent/<unit-project-name>/` multi-project scope folders.
- **Row L** — `upstream/` + `project/` split, user-provided upstream name 허용.
- **Row M** — `upstream-vs-local.md` classifier.
- **Row N** — agent-docs scope로 copy되는 upstream docs/files mirror sync policy.

## 실제 적용 사례

upstream 프레임워크 적용 host project는 user-named upstream folder를 사용하는 upstream split을 적용했습니다: `.agent/estreui/` + `.agent/project/`. 이는 구체적 사례이지 일반 기본값이 아닙니다. 일반 project는 사용자가 더 명확한 upstream 이름을 고르지 않는 한 `.agent/upstream/`을 사용해야 합니다.

## 리버스 참조

- upstream 프레임워크 upstream split 사례: bundle 작성자의 private host project 및 public upstream 프레임워크 repo context.
- Sidecar repo 및 workspace-boundary 사례: 본 bundle에 대한 seed maintainer review, 2026-05-07.

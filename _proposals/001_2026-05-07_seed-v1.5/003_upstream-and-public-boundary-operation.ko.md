# 제안 003 — Upstream and Public-Boundary Operation Cases

> local/project context와 upstream-bound context를 나누는 프로젝트, 또는 public/collaboration source repo 밖에 private agent docs를 두는 프로젝트를 위한 운영 패턴입니다.

## 왜 필요한가

제안 002는 residency와 folder shape를 명명합니다. 본 제안은 그 shape가 작동하려면 필요한 운영 규칙을 채웁니다. upstream split이 언제 적용되는지, upstream folder 이름을 어떻게 정하는지, mirrored docs를 어떻게 일관되게 유지하는지, file origin을 어떻게 분류하는지, agent-docs repo 내부 source folder를 어떻게 보호하는지, 협의 기록을 어떻게 archive하는지, public docs가 private identifier를 어떻게 누출하지 않는지 다룹니다.

이 패턴은 generic합니다. upstream 프레임워크는 실제 사례 중 하나지만, upstream operation은 upstream 전용이 아닙니다.

## Pattern 1 — Upstream 적용 조건

> 구체 운영: upstream split은 project가 library를 사용한다는 이유만으로 적용하지 않고, upstream-bound work가 실제로 있을 때만 적용합니다.

**규칙.** 다음 둘 다 참일 때 upstream split을 사용합니다.

- 개발자가 upstream repo를 운영하거나, 그 repo에 변경을 보낼 충분한 권한이 있음.
- 현재 project가 upstream-bound 변경을 upstream에 보내기 전에 먼저 구현, 테스트, 문서화하는 장소임.

project가 external library를 단순 소비할 뿐 upstream-bound 변경을 author하지 않는다면 기본 `.agent/` layout에 머물고, 필요할 때만 `adaptation-map.md`를 사용합니다.

## Pattern 2 — Upstream naming

> 구체 운영: 기본은 `upstream/`이지만, 사용자가 지정한 upstream name을 허용합니다.

**기본.**

```
<scope-root>/
├── upstream/
└── project/
```

**Named upstream.** 사용자가 upstream 이름을 명시하면 해당 folder name을 사용합니다.

```
<scope-root>/
├── <upstream-name>/
└── project/
```

예: `.agent/upstream/`, `.agent/estreui/`, `.agent/payments-sdk/`, `.agent/internal-platform/`.

선택한 이름은 scope README와 `project/upstream-vs-local.md`에 기록합니다.

## Pattern 3 — Mirror sync policy

> 구체 운영: upstream docs/files를 grep/read 편의상 agent-docs scope에 mirror해도, source of truth는 upstream입니다.

**규칙.** `upstream/` 또는 `<upstream-name>/` 아래 파일의 단일 진실 공급원은 upstream repo입니다. local mirrored copy는 현재 scope에서 작업하는 agent의 읽기 최적화입니다. lookup path를 줄일 뿐 upstream content를 author하지 않습니다.

**Sync trigger.** upstream docs/file add, rename, substantial rewrite가 있으면 다음 관련 local/agent-docs commit에서 mirror sync합니다. sync 기록에는 upstream commit hash를 명시합니다.

**Conflict resolution.** upstream wins. local deviation은 mirrored upstream file이 아니라 `project/upstream-vs-local.md` 또는 project-owned note에 기록합니다.

**Tooling.** mirror-sync helper는 단순 단방향 file copy여도 됩니다. mirrored folder에서 local authoring을 하지 않는다면 merge semantic이 필요 없습니다.

## Pattern 4 — `upstream-vs-local.md` file-origin classification

> 구체 운영: 단일 classifier table이 path가 upstream-owned인지, project-owned인지, mirrored인지, local-only인지 알려줍니다.

`project/upstream-vs-local.md`를 classifier table로 유지합니다.

| Path pattern | Origin | Sync direction | Local modification policy |
| --- | --- | --- | --- |
| `upstream/**` 또는 `<upstream-name>/**` | upstream mirror | upstream → local | local 수정 금지. upstream 수정 후 resync |
| `project/**` | project-owned | 없음 | 자유 |
| `source/<upstream-files>` | upstream-bound | local → upstream, then resync | upstream plan/commit과 짝지을 때만 허용 |
| `source/<project-files>` | project-owned | 없음 | 자유 |
| `scripts/<upstream-files>` | upstream-bound 또는 mirror | source-map에 따름 | classifier row 따름 |
| `scripts/<project-files>` | project-owned | 없음 | 자유 |

이 표는 "이 commit이 upstream target 기록 없이 upstream-bound file을 건드렸는가?" 같은 기계적 check의 전제 조건입니다.

새 file family를 추가하는 structure change가 있으면 같은 commit에서 classifier를 갱신합니다.

## Pattern 5 — Agent-docs repo 안 source folder guard

> 구체 운영: private agent-docs repo가 workspace access를 위해 source project를 포함하거나 link할 수 있지만, source folder가 실수로 commit되면 안 됩니다.

사용자가 source project folder가 현재 workspace 안에 준비되었다고 말하면:

1. folder 존재를 확인합니다.
2. 그 folder가 agent-docs repo에 commit되면 안 되는 별도 source repo 또는 linked project folder인지 판단합니다.
3. 맞다면 root `.gitignore`에 root-relative path를 추가합니다.
4. 추측 경로를 추가하지 않습니다.
5. 이미 있는 ignore entry를 중복 추가하지 않습니다.
6. folder가 submodule/gitlink로 추적되어야 한다면 ignore하지 않습니다.

이 pattern은 `source-map.md`와 함께 쓰입니다. `source-map.md`는 source folder가 왜 있고 authoritative source repo가 어디인지 기록합니다.

## Pattern 6 — Dual archive

> 구체 운영: local project와 upstream/public project가 interface를 여러 round로 협의하면, 결정을 복원할 수 있을 만큼 양쪽에 기록을 보존합니다.

협의가 single-source-of-truth document family라면 한쪽을 master로 정하고 다른 쪽은 redirect-only stub을 둡니다. 협의가 대화라면, 즉 reply, review, round별 decision이라면 양쪽 모두 record를 둘 수 있습니다.

한쪽이 private이고 다른 쪽이 public이면 private side가 full record를 가집니다. public side는 sanitized card만 둡니다: decision outcome, public-safe rationale, 내부 식별자 없는 내용.

`archive/` 안에서 date-prefixed file (`YYYY-MM-DD_<topic>.md`)을 사용합니다. 같은 round가 양쪽에 나타나면 filename을 맞춰 기계적으로 찾을 수 있게 합니다.

## Pattern 7 — upstream 측 `legacy-design-rationale.md` 가치

> 구체 운영: upstream library/platform이 왜 특정 design path를 보류했는지 보존하면 downstream adopter가 미래 적합성을 평가하기 쉬워집니다.

upstream이 old design을 new design으로 대체하면 source 안에 commented-out code를 남기지 않습니다. 관련 snippet과 rationale을 `legacy-design-rationale.md`로 옮기고 다음을 기록합니다.

- design이 하려던 일
- 다른 경로를 선택한 이유
- 언제 돌아올 수 있는지
- future revival에 충분한 self-contained snippet

Lifecycle:

- Revive: snippet을 복원하고 entry 제거.
- Permanently drop: entry 삭제. 이 문서는 살아 있는 motivation만 보관.

## Pattern 8 — Public-docs sanitization

> 구체 운영: private agent/project note에서 파생된 public docs는 private host, tenant, partner, service identifier를 누출하면 안 됩니다.

`project/public-boundary.md` 또는 `project/style-guide.md`를 substitution policy로 유지합니다.

- 서비스 / 브랜드 이름 → neutral role (`<host-application>`, `<embedded-library>`).
- 도메인 이름 → example domain (`host.example.com`, `embed.example.com`).
- business domain이 들어간 class / function name → generic role name.
- tenant / partner 이름을 노출하는 identifier suffix → 제거 또는 치환.

private note, case study, archive card, implementation example이 upstream/public docs로 넘어갈 때마다 이 policy를 적용합니다.

## 시드 본문에 들어갈 자리

권장 위치: 제안 002의 residency/folder-shape 섹션 바로 뒤. 제목은 **Upstream and Public-Boundary Operation**.

Catalog mapping:

| Catalog row | Pattern |
| --- | --- |
| L | Pattern 1 and 2 (upstream split and naming) |
| N | Pattern 3 (mirror sync policy) |
| M | Pattern 4 (`upstream-vs-local.md`) |
| J | Pattern 5 (source folder `.gitignore` guard) |
| O | Pattern 6 (dual archive) |
| Q | Pattern 7 (`legacy-design-rationale.md`) |
| I | Pattern 8 (public boundary / sanitization) |

## 리버스 참조

- upstream 프레임워크 upstream-named split 및 mirror 사례: bundle 작성자의 private host project 및 public upstream 프레임워크 repo context.
- Source sidecar, workspace-boundary, `.gitignore` guard 사례: 본 bundle에 대한 seed maintainer review, 2026-05-07.

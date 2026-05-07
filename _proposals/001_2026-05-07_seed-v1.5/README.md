# Bundle 001 — Seed v1.5 Proposals

> Submitted: 2026-05-07
> Bundle author: SoliEstre (via an EstreUI-adopting host project that applied seed v1.4)
> 한국어 버전은 아래로 → [한국어 버전](#묶음-001--시드-v15-제안)

This bundle proposes the additions queued for **seed v1.5**. The three documents began from an EstreUI-adopting host project that applied the seed and accumulated patterns the seed body did not yet name. Maintainer review then generalized the bundle: before the seed chooses `.agent/` folders, it must decide whether the current workspace is the source repo, a private agent-docs sidecar repo, a multi-project orchestration repo, or a scope with upstream-bound work.

## Inclusion summary

| # | Document | Theme | Anchor in seed body (proposed) |
| --- | --- | --- | --- |
| 001 | [`001_bootstrap-residency-and-adoption-catalog`](001_bootstrap-residency-and-adoption-catalog.en.md) ([KO](001_bootstrap-residency-and-adoption-catalog.ko.md)) | Bootstrap residency check, minimal/manual/repo-provider assisted setup, and the adoption catalog with trigger preservation. | New bootstrap prelude plus catalog near Phase 3 / Migration Guides. |
| 002 | [`002_repo-residency-and-agent-folder-shape`](002_repo-residency-and-agent-folder-shape.en.md) ([KO](002_repo-residency-and-agent-folder-shape.ko.md)) | Decision tree for repo residency and `.agent/` shape: flat default, agent-docs sidecar repo, multi-project orchestration, upstream split. | Phase 3 (Document Management Structure) prelude/extension. |
| 003 | [`003_upstream-and-public-boundary-operation`](003_upstream-and-public-boundary-operation.en.md) ([KO](003_upstream-and-public-boundary-operation.ko.md)) | Generic upstream and public-boundary operation: upstream applicability/naming, mirror sync, upstream-vs-local classification, `.gitignore` source guard, dual archive, legacy rationale, sanitization. | New subsection after 002 and as adoption-catalog rows. |

The bundle is internally cross-cited: 001 establishes the bootstrap and adoption meta-patterns; 002 turns those decisions into folder shapes; 003 gives the operating rules for upstream/public-boundary cases.

## Reverse reference policy (this bundle)

Cases are drawn from a **private host project** that adopts EstreUI. Per `_proposals/README.md`'s privacy default:

- Commit hashes are quoted as-is — they do not navigate without repo access.
- Identifiers from the host project (class names, service names, domain names) are sanitized to generic role names (`HostSessionManager`, `EmbedSDK`, `host.example.com`, etc.).
- The host repo is **not** named or linked. The seed maintainer can request the repo path from the bundle author out-of-band when a walkthrough is needed.
- EstreUI itself is named directly — it is a public repo owned by the same author and is where the library-side commits cited in 003 live.

When a cited commit hash exists in the public EstreUI repo, that is stated explicitly so the seed maintainer can navigate. When a cited commit hash exists only in the private host repo, the citation is hash-only without a repo target.

## Closure log

Updated by the seed maintainer as documents are absorbed:

| Doc | Status | Absorbed in seed commit | Notes |
| --- | --- | --- | --- |
| 001 | 🟡 submitted | — | — |
| 002 | 🟡 submitted | — | — |
| 003 | 🟡 submitted | — | — |

Status legend: 🟡 submitted · 🟢 absorbed · 🟠 deferred · 🔴 rejected.

When a document moves to 🟢 / 🟠 / 🔴, fill the absorbed-commit column (for 🟢) or add a notes-cell rationale (for 🟠 / 🔴). The bundle stays as the lineage record either way.

---

# 묶음 001 — 시드 v1.5 제안

> 제출: 2026-05-07
> 묶음 작성자: SoliEstre (시드 v1.4 를 적용한 EstreUI 적용 호스트 프로젝트 경유)

본 묶음은 **시드 v1.5** 에 들어갈 추가 사항을 제안합니다. 3 문서는 처음에는 EstreUI 를 적용한 호스트 프로젝트가 시드를 적용하면서 누적한 패턴에서 출발했습니다. 이후 유지자 검토를 거치며 일반화되었습니다. 시드는 `.agent/` 폴더를 고르기 전에 현재 workspace가 source repo인지, private agent-docs sidecar repo인지, multi-project orchestration repo인지, upstream-bound work를 가진 scope인지 먼저 결정해야 합니다.

## 포함 요약

| # | 문서 | 주제 | 시드 본문에 들어갈 자리 (제안) |
| --- | --- | --- | --- |
| 001 | [`001_bootstrap-residency-and-adoption-catalog`](001_bootstrap-residency-and-adoption-catalog.ko.md) ([EN](001_bootstrap-residency-and-adoption-catalog.en.md)) | Bootstrap residency check, minimal/manual/repo-provider assisted setup, trigger preservation 기반 adoption catalog. | Phase 3 / Migration Guides 인근 catalog 및 bootstrap prelude. |
| 002 | [`002_repo-residency-and-agent-folder-shape`](002_repo-residency-and-agent-folder-shape.ko.md) ([EN](002_repo-residency-and-agent-folder-shape.en.md)) | repo residency와 `.agent/` shape 의사결정 트리: flat 기본값, agent-docs sidecar repo, multi-project orchestration, upstream split. | Phase 3 (Document Management Structure) prelude/확장. |
| 003 | [`003_upstream-and-public-boundary-operation`](003_upstream-and-public-boundary-operation.ko.md) ([EN](003_upstream-and-public-boundary-operation.en.md)) | generic upstream 및 public-boundary 운영: upstream 적용 조건/이름, mirror sync, upstream-vs-local 분류, `.gitignore` source guard, dual archive, legacy rationale, sanitization. | 002 직후 새 섹션 및 adoption-catalog row. |

묶음은 내부 상호 인용 — 001 이 bootstrap 및 adoption 메타패턴을 세우고, 002 가 이를 folder shape로 변환하며, 003 이 upstream/public-boundary case 운영 규칙을 제공합니다.

## 리버스 링크 정책 (본 묶음)

사례는 EstreUI 를 적용한 **비공개 호스트 프로젝트** 에서 가져옴. `_proposals/README.md` 의 프라이버시 기본 정책에 따라:

- commit hash 는 raw 인용 — repo 접근 없이는 navigation 안 됨.
- 호스트 프로젝트 식별자 (클래스명, 서비스명, 도메인명) 는 generic role 명으로 sanitize (`HostSessionManager`, `EmbedSDK`, `host.example.com` 등).
- 호스트 repo 는 **이름·링크 노출 X**. walkthrough 필요 시 시드 유지자가 묶음 작성자에게 repo 경로를 외부 채널로 문의.
- EstreUI 자체는 직접 명명 — 같은 작성자 소유 공개 repo 이며 003 에 인용된 라이브러리 측 commit 이 존재하는 곳.

인용 commit hash 가 EstreUI (공개) 에 있는 경우 명시 — 시드 유지자가 navigate 가능. 비공개 호스트 repo 에만 있는 hash 는 repo target 없이 hash 만 인용.

## Closure 로그

문서가 흡수될 때 시드 유지자가 갱신:

| 문서 | 상태 | 흡수 시드 commit | 메모 |
| --- | --- | --- | --- |
| 001 | 🟡 submitted | — | — |
| 002 | 🟡 submitted | — | — |
| 003 | 🟡 submitted | — | — |

상태 범례: 🟡 submitted · 🟢 absorbed · 🟠 deferred · 🔴 rejected.

문서가 🟢 / 🟠 / 🔴 로 이동 시 흡수-commit 컬럼 (🟢 의 경우) 또는 메모 셀 사유 (🟠 / 🔴 의 경우) 채움. 묶음은 어느 쪽이든 lineage 기록으로 유지.

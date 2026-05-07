# Bundle 001 — Seed v1.5 Proposals

> Submitted: 2026-05-07
> Bundle author: SoliEstre (via an EstreUI-adopting host project that applied seed v1.4)
> 한국어 버전은 아래로 → [한국어 버전](#묶음-001--시드-v15-제안)

This bundle proposes the additions queued for **seed v1.5**. The three documents share a single motivation — an EstreUI-adopting host project applied the seed and accumulated patterns the seed body did not yet name. Rather than letting those patterns stay tacit in the host project, they are surfaced here as proposals so the seed body can absorb them and other adopting projects can reach for them by name.

## Inclusion summary

| # | Document | Theme | Anchor in seed body (proposed) |
| --- | --- | --- | --- |
| 001 | [`001_adoption-catalog-with-triggers`](001_adoption-catalog-with-triggers.en.md) ([KO](001_adoption-catalog-with-triggers.ko.md)) | Meta-pattern: partial adoption of the seed standard with trigger preservation, plus a named option catalog that absorbs all the smaller proposals 002 ~ N. | New chapter near the existing **Migration Guides** section. |
| 002 | [`002_agent-folder-shape-for-library-and-host`](002_agent-folder-shape-for-library-and-host.en.md) ([KO](002_agent-folder-shape-for-library-and-host.ko.md)) | Decision tree for `.agent/` folder layout across four scenarios: pure host, pure library, host that mirrors an external library's docs, and library + reference-host hybrid. | Phase 3 (Document Management Structure) extension. |
| 003 | [`003_library-reference-repo-cases`](003_library-reference-repo-cases.en.md) ([KO](003_library-reference-repo-cases.ko.md)) | Five additional patterns specific to library + reference-host hybrid operation: mirror sync policy, upstream-vs-local identification, dual archive, library-side legacy-design-rationale value, public-docs sanitization. | New subsection inside chapter 002 or as adoption-catalog rows. |

The bundle is internally cross-cited: 001 establishes the meta-pattern that 002 and 003 plug into; 003 builds on the scenarios 002 names.

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

본 묶음은 **시드 v1.5** 에 들어갈 추가 사항을 제안합니다. 3 문서는 하나의 동기를 공유 — EstreUI 를 적용한 호스트 프로젝트가 시드를 적용하면서 시드 본문이 아직 이름 붙이지 않은 패턴들이 누적됨. 그 패턴들을 호스트 프로젝트 안에 암묵적으로 두지 않고 여기 제안으로 끌어내, 시드 본문이 흡수하면 다른 적용 프로젝트들도 이름으로 호출할 수 있게 합니다.

## 포함 요약

| # | 문서 | 주제 | 시드 본문에 들어갈 자리 (제안) |
| --- | --- | --- | --- |
| 001 | [`001_adoption-catalog-with-triggers`](001_adoption-catalog-with-triggers.ko.md) ([EN](001_adoption-catalog-with-triggers.en.md)) | 메타패턴: 시드 표준의 부분 도입 + 트리거 보존, 더불어 작은 제안 002 ~ N 을 모두 흡수하는 옵션 카탈로그 명명. | 기존 **Migration Guides** 섹션 인근의 새 챕터. |
| 002 | [`002_agent-folder-shape-for-library-and-host`](002_agent-folder-shape-for-library-and-host.ko.md) ([EN](002_agent-folder-shape-for-library-and-host.en.md)) | 4 시나리오 (pure host · pure library · 외부 라이브러리 docs mirror 호스트 · 라이브러리+reference 호스트 hybrid) 의 `.agent/` 폴더 레이아웃 의사결정 트리. | Phase 3 (Document Management Structure) 확장. |
| 003 | [`003_library-reference-repo-cases`](003_library-reference-repo-cases.ko.md) ([EN](003_library-reference-repo-cases.en.md)) | 라이브러리 + reference 호스트 hybrid 운영 특화 추가 패턴 5개: mirror sync 정책, upstream vs. local 식별, dual archive, 라이브러리 측 legacy-design-rationale 가치, 공개 docs sanitization. | 002 내부 섹션 또는 adoption-catalog 행. |

묶음은 내부 상호 인용 — 001 이 002·003 가 끼워지는 메타패턴 확립; 003 은 002 가 명명한 시나리오 위에 구축.

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

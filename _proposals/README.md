# `_proposals/` — Incoming Updates from Adopting Projects

> 한국어 버전은 아래로 → [한국어 버전](#_proposals--적용-프로젝트로부터의-개선-제안)

This folder receives improvement proposals from projects that have adopted the EstreGenesis seed prompts (in part or in full) and have surfaced patterns the seed body did not yet anticipate. The proposals live here as bundled drafts until the seed maintainer absorbs them into the seed body — at which point each absorbed document is marked closed, optionally moved to `_archived/`, and its lineage stays visible in the bundle README.

This is the *inbound* side of the seed's improvement loop. It is intentionally separate from `PM/` (which tracks the seed maintainer's own multi-step work) and from `_lessons/` (which captures the seed maintainer's own troubleshooting). Proposals are external input — drafted by adopting projects, reviewed and absorbed by the seed.

## Folder shape

```
_proposals/
├── README.md                                                (this file — folder definition + active bundle index)
└── NNN_YYYY-MM-DD_<bundle-slug>/                            (one bundle per cohesive proposal set)
    ├── README.md                                            (bundle definition + per-document index + closure log)
    ├── 001_<topic>.en.md
    ├── 001_<topic>.ko.md
    ├── 002_<topic>.en.md
    ├── 002_<topic>.ko.md
    └── ...
```

Bundle folder name uses a triple prefix: **sequence number** (zero-padded, `_proposals/`-wide), **submission date** (ISO `YYYY-MM-DD`), **kebab-case slug**. The sequence number is monotone within `_proposals/`, the date is the bundle-author submission date, and the slug names the cohesive theme.

Documents inside a bundle use parallel bilingual files (`.en.md` + `.ko.md`) — same content, two languages — so external developers reading either language land on the same proposal text.

## Lifecycle

```
draft (in bundle) → submitted (pushed to repo) → under review (seed maintainer reads)
  → either:
       (a) absorbed into seed body (commit hash recorded in bundle README; document optionally moved to _archived/)
       (b) deferred (rationale recorded in bundle README; document stays for re-evaluation)
       (c) rejected (rationale recorded in bundle README; document either moved to _archived/ or deleted)
```

The bundle README is the *lineage record*. Even after every document in a bundle is absorbed, the bundle README stays as the trail back from a body section to the proposal that produced it.

## Reverse references — privacy default

Adopting projects may be private. When citing cases from a private project:

- Commit hashes are quotable as-is — a hash alone does not navigate.
- Identifiers (class names, domain names, service names) must be sanitized — substitute generic role names.
- Direct repo URLs / repo names are forbidden in the proposal body.
- For walkthroughs of cited code, the seed maintainer asks the bundle author for repo path out-of-band.

When the cited code is in a public repo (e.g., a public library the adopting project mirrors), citing the public repo by name is allowed.

## Index

| # | Bundle | Status | Summary |
| --- | --- | --- | --- |
| 001 | [`001_2026-05-07_seed-v1.5/`](001_2026-05-07_seed-v1.5/README.md) | 🟢 absorbed (`v1.5.0` / `21a1e31`) | Bootstrap residency check · adoption catalog with triggers · repo/agent-docs folder shapes · generic upstream/public-boundary operation |

---

# `_proposals/` — 적용 프로젝트로부터의 개선 제안

이 폴더는 EstreGenesis 시드 프롬프트를 적용 (부분 또는 전부) 한 프로젝트들이 시드 본문이 아직 예상하지 못했던 패턴을 발견했을 때 그 개선 제안을 받는 곳입니다. 제안은 묶음 단위 draft 로 여기 머물다가 시드 유지자가 본문에 흡수하는 시점에 closure 처리 — 흡수된 문서는 (옵션) `_archived/` 로 이동하고, 묶음 README 가 흡수 lineage 기록으로 남습니다.

이는 시드의 개선 루프 중 *유입* 쪽입니다. `PM/` (시드 유지자 본인의 다단계 작업) 와 `_lessons/` (시드 유지자 본인의 트러블슈팅) 와는 의도적으로 분리됩니다. 제안은 외부 입력 — 적용 프로젝트가 작성하고 시드가 검토·흡수.

## 폴더 구조

```
_proposals/
├── README.md                                                (본 파일 — 폴더 정의 + 활성 묶음 인덱스)
└── NNN_YYYY-MM-DD_<bundle-slug>/                            (응집된 제안 한 세트당 묶음 한 개)
    ├── README.md                                            (묶음 정의 + 문서별 인덱스 + closure 로그)
    ├── 001_<topic>.en.md
    ├── 001_<topic>.ko.md
    ├── 002_<topic>.en.md
    ├── 002_<topic>.ko.md
    └── ...
```

묶음 폴더 이름은 3종 prefix 사용: **순번** (zero-padded, `_proposals/` 전역 단조), **제출 날짜** (ISO `YYYY-MM-DD`), **kebab-case 슬러그**. 순번은 `_proposals/` 안에서 단조 증가, 날짜는 묶음 작성자의 제출 일자, 슬러그는 응집 주제명.

묶음 안의 문서는 영·한 parallel 파일 (`.en.md` + `.ko.md`) — 동일 내용 두 언어 — 외부 개발자가 어느 언어로 봐도 같은 제안 본문에 도달.

## 라이프사이클

```
draft (묶음 내) → submitted (repo push) → under review (시드 유지자 읽음)
  → 다음 중 하나:
       (a) 시드 본문 흡수 (묶음 README 에 commit hash 기록; 문서는 옵션으로 _archived/ 이동)
       (b) 보류 (묶음 README 에 사유 기록; 문서는 재평가용으로 유지)
       (c) 거절 (묶음 README 에 사유 기록; 문서는 _archived/ 이동 또는 삭제)
```

묶음 README 는 *lineage 기록*. 묶음 안 모든 문서가 흡수된 후에도 묶음 README 는 본문 섹션 → 그것을 만들어 낸 제안 으로 되돌아가는 흔적으로 남습니다.

## 리버스 링크 — 기본 정책: 프라이버시 우선

적용 프로젝트는 비공개일 수 있습니다. 비공개 프로젝트의 사례를 인용할 때:

- commit hash 는 raw 인용 OK — hash 자체는 navigation 안 됨.
- 식별자 (클래스명, 도메인명, 서비스명) 는 sanitize 필수 — generic role 명으로 치환.
- 직접 repo URL / repo 이름은 제안 본문에서 금지.
- 인용된 코드의 walkthrough 가 필요하면 시드 유지자가 묶음 작성자에게 repo 경로를 외부 채널로 문의.

인용 코드가 공개 repo (예: 적용 프로젝트가 mirror 하는 공개 라이브러리) 에 있다면 그 공개 repo 이름 인용은 허용.

## 인덱스

| # | 묶음 | 상태 | 요약 |
| --- | --- | --- | --- |
| 001 | [`001_2026-05-07_seed-v1.5/`](001_2026-05-07_seed-v1.5/README.md) | 🟢 absorbed (`v1.5.0` / `21a1e31`) | Bootstrap residency check · trigger 기반 adoption catalog · repo/agent-docs folder shape · generic upstream/public-boundary operation |

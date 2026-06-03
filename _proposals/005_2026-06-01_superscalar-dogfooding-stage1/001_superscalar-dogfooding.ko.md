# Superscalar Stage 1 — 다운스트림 도그푸딩 리포트 (n=8)

> **출처**: 한 다운스트림 적용 프로젝트 — 실시간 채팅 서비스 마이크로서비스; Superscalar·Constellation 모듈 포함 시드 전면 채택; Burst 페이스 모드(`issue_width` cap = 6).
> **대상**: `Superscalar.md` v0.2 Stage 1 — `§2` issue_width 공식 · `§3` reorder-buffer / worktree 격리 · `§5` adoption threshold · `§11` dogfood log.
> **표본**: \~3일간 retire 된 lane n = 8. case-based ledger, 실측값만(합성/이론치 없음).

`§11` dogfood-log 루프의 다운스트림 절반. actionable 신호 2건: (1) read/write lane-class cap 비대칭(n=7 업데이트), (2) **nested independent repo 에서 worktree 격리의 구조적 한계**(case 8 신규 — `§3` 에 직접 관련). + 정책 확인 + 미exercise 표면 정직한 목록.

## 1. Case ledger 요약

| # | 작업 분류 | 메커니즘 | width | OoO | spec | conflict | 결과 |
|---|---|---|---|---|---|---|---|
| 1 | 내부 PM 문서 현행화 | board worker (A2A) | 2 | Y | off | 없음 | retired |
| 2–6 | 코드베이스 context sweep (UI / 스타일 / git-history 매핑) ×5 | read-only subagent | 2 | Y | off | NA (read-only) | retired |
| 7 | 시드 업그레이드 델타 매핑 (본 리포트 자체의 리서치) | workflow: 7 readers + synthesis | **7** | Y | off | NA (read-only) | retired |
| 8 | 병렬 UI write 2건 (창 제목줄 컨텍스트 메뉴 + 다크모드 토큰 리팩터) + read-only 리서치 1 lane | Agent tool `isolation:"worktree"` (write 2) + read-only (1) | **3** | Y | off | 없음 (disjoint 파일; §2b 참조) | retired |

메커니즘 구성: board-worker 1, read-only 리서치 subagent 5, workflow fan-out 1, **worktree write dispatch 1 (case 8 — 첫 write-lane 병렬 + 첫 worktree 사용)**. 전부 OoO = Y. **write lane: 최대 width = 2** (case 8 의 disjoint UI 2건). **read-only lane: 6.** **speculation = 0/8. worktree-isolation: case 8 에서 첫 사용 — 단 아래 §3 caveat 참조.**

## 2. Finding A — read/write lane-class cap 비대칭 (n=7부터, 여전히 actionable)

**관찰 (case 7)**: 리서치 fan-out 이 **read-only reader 7 lane** + synthesis barrier dispatch — **`issue_width` cap 6 첫 초과**, downside 0. case 8 이 첫 다중-lane **write** 데이터 추가: write 2 lane, disjoint 파일, merge conflict 0.

cap 의 binding 제약은 read-only 리서치 lane 엔 안 걸리는 write-lane 관심사:

| `issue_width` 차원 (`§2`) | write lane binding? | read-only fan-out binding? |
|---|---|---|
| effort band | yes | yes |
| pace_mode cap (Burst = 6) | yes | 여기선 artificial — `R2` 참조 |
| Little's Law (review throughput ÷ 작업 길이) | yes (retire-merge 이 review-gated) | **no** — read lane 은 synthesis 소비로 retire |
| Kanban WIP ≈ team_size + 1 | yes (WAW / merge 경합) | **no** — disjoint read scope 는 공유 mutable contract 없음 |
| autonomy_available_workers | yes | yes |

read-only lane 은 store buffer·retire-merge ordering·WAW hazard 없음 — disposable. write width 를 조이는 두 항(Little's Law, Kanban WIP)이 read lane 엔 안 걸리고, `effort_band` 와 raw concurrency 한도만 binding.

**제안 P1**: `§2` `issue_width` 공식을 **lane-class-aware** 로 — read-only/analysis lane class(비가역 효과 없음, retire-merge 없음, synthesis 시 disposable)는 write/worktree lane class 보다 높은 cap 가능:

```
issue_width_read  = min(effort_band, runtime_concurrency_ceiling, autonomy_available_workers)
issue_width_write = min(effort_band, pace_mode_cap, Little's-Law, Kanban-WIP, autonomy_available_workers)
```

`§3` 이 irreversibility barrier 에 긋는 경계(read/analyze default-allowed; write/deploy/send retire-gated) 상속.

## 2b. Finding B (신규, case 8) — worktree 격리가 nested independent repo 를 span 못함

`§3` 은 Reorder Buffer 를 `git worktree` 격리에 매핑: 각 write lane 이 자기 worktree 에서 실행 = ROB 격리 경계. case 8 — 적용 프로젝트의 **첫 worktree write-lane dispatch** — 가 구조적 한계 노출: **agent-tool worktree 격리가 PARENT repo 를 worktree 하지만, 그 안의 nested *independent* git repo 는 span 못함.**

적용 프로젝트의 프론트엔드는 부모 프로젝트 repo 에 nested 된 **별도 git 저장소**(부모 미추적 — 흔한 monorepo-인접 형태: 부모 오케스트레이션/docs repo 안에 별도 앱 repo). `isolation:"worktree"` 로 write 2 lane dispatch 시, 각 lane 이 받은 parent-repo worktree 엔 **nested 프론트엔드 repo 가 아예 없었음**. 그래서 lane 들이 **실제(공유) nested 프론트엔드 repo** 에서 각자 *branch* 로 작업 — **worktree 격리 아닌 branch 격리**. 공유 working tree 가 cross-visible: 한 lane 이 다른 lane 의 uncommitted 변경을 mid-flight 목격.

**여기서 안 깨진 이유**: 두 lane 이 **disjoint 파일**을 만져 별도-branch merge 가 clean(conflict 0). 그러나 `§3` 이 약속한 ROB 격리는 **실제로 달성 안 됨** — 같은 파일을 만졌다면 parent 레벨에서 `isolation:"worktree"` 가 honored 됐음에도 공유 working tree 가 실제 WAW hazard 를 냈을 것.

**`§3` 함의**: worktree-as-ROB 매핑은 write 타깃이 worktree 된 repo 안에 있을 때만 성립. **nested independent sub-repo** 프로젝트에선 Stage-1 이 (a) lane 별로 *nested* repo 를 worktree 하거나, (b) 파일-disjoint 보장 + branch 격리로 fallback(여기선 운 좋게 후자). **Request R3**(아래): 한계 + mitigation 문서화 + 하네스가 nested-repo write 타깃을 감지해 nested repo 를 re-worktree 하거나 격리가 branch-level 로 떨어졌다 경고.

## 3. 확인 (n=8 이 기존 정책 corroborate)

- **Latency-hiding thesis — 확인.** 모든 lane 이 review-wait / 독립-작업 창에서 agent-time hidden. 진짜 병목은 review throughput + 독립-작업 가용성, 모델 처리량 아님.
- **MAST FM-1.3 (중복 작업) = 0.** case 7 readers·case 8 write lane 모두 disjoint scope; 겹침 없음. lane-manifest cross-check 가 width 7 + 첫 병렬-write dispatch 에서 유효.
- **In-order retire held** — 모든 synthesis/merge 단계 declared order 보존; finish-order ≠ retire-order 비일관 없음.
- **Speculation off-by-default — held (0/8).** 3 ask-trigger 동시 충족 case 없음; speculation-discard 로그 빈 채 유지.

## 4. `§5` adoption-threshold readout

n=8 에서 전부 green:

| Signal | 임계치 | 실측 (n=8) | 상태 |
|---|---|---|---|
| avg merge-conflict rate | `> 15%` → `issue_width −= 2` | 0% (0/3 write-mergeable: case 1 + case 8 두 lane; read-only 제외) | OK |
| speculative accuracy (last 10) | `< 60%` → spec off | n/a (spec 0건) | — |
| concurrent token cost vs in-order | `> 3×` → cap 재조정 | 정성적: hidden latency > token 추가분; 토큰을 review-wait 중 소비 | OK |
| FM-1.3 detection | `≥ 1/session` → 가드 강화 | 0 | OK |

임계치 trip 없음. case 7 cap 초과는 read-only lane(conflict NA); case 8 write 2 lane 은 clean merge.

## 5. Entry 04 와의 관계

Entry 04 (`§11`)는 width 4 고정에서 **in-lane sub-split ROI** 측정 — *스코프/추적성/`[추정]→[확정]` > equal-scope 효율*.

본 case 들은 대체로 **orthogonal**: Entry 04 는 lane *내부* 깊이 변화; 본 적용 프로젝트는 **review-wait 중 cross-lane fan-out**(latency-hiding). case 8 은 첫 *worktree write* lane 이나 두 lane 이 독립 UI 작업(in-lane sub-split 아님)이라 Entry 04 의 in-lane 오버헤드 추정은 여전히 **corroborate 불가**. case 8 이 대신 추가하는 건 §2b worktree 격리 caveat — Entry 04 의 단일-arm 순차 측정으로는 안 드러나는 한계(두 동시 worktree write lane 을 nested-repo 타깃에 돌린 적 없음).

## 6. 미exercise 표면 (정직한 gap)

- **worktree-isolation: case 8 에서 첫 사용, 단 parent-repo 레벨만** — nested-repo 타깃이 branch 격리로 degrade(§2b). worktree 격리가 의도한 *same-repo* same-file 동시 write 는 아직 **미검증**.
- **speculation (0/8)** — ask-trigger 미충족; Stage 2/3 기능 데이터 0.
- **wide write fan-out** — write width 2 도달(case 8); merge-conflict / Kanban-WIP 항은 write 쪽서 아직 약하게만 검증(disjoint 파일, 실제 경합 없음).

**부수 교훈 (검증 깊이)**: case 8 에서 한 write lane 산출물이 *구조적* self-verify(신규 UI 메뉴 element + 4 액션이 라이브 DOM 에 렌더)는 통과했으나 *동작* 버그(2개 액션이 widget 재오픈 시에만 효과 적용, 라이브 아님)를 안고 있었고 **사용자 동작 테스트**가 잡음. lane self-verify 규율 교훈: **존재(presence) 검증 ≠ 동작(behavioral) 검증** — 인터랙티브 기능을 검증하는 lane 은 컨트롤 렌더 확인뿐 아니라 action→state-change 경로를 실행하도록 지시 필요. (MAST FM-2.6 announce-vs-action 인접: "X 구현" 이 구조적으론 통과했으나 X 의 런타임 효과가 불완전.)

## 7. Upstream 요청

- **R1 — lane-class cap split** (`§2`/`§5`): read-only lane class 에 높은 cap 검토(Little's-Law + Kanban-WIP 항 제거). case 7 이 앵커: width 7 read-only, downside 0.
- **R2 — policy cap vs runtime concurrency ceiling** (`§2` clarification): runtime concurrency(`min(16, cores − 2)` per workflow)는 policy `issue_width` cap(6)과 별개; case 7 이 7 로 돈 건 runtime 이 허용·policy 는 6. `§2` 가 관계 명시 가능(policy cap 은 retire-merged lane, runtime ceiling 은 disposable read fan-out govern).
- **R3 (신규) — nested independent repo 에서의 worktree 격리** (`§3`): write 타깃이 worktree 된 부모가 미추적하는 nested independent git repo 일 때 worktree-as-ROB 매핑이 조용히 branch 격리로 degrade(§2b). `§3` 이 (a) 한계 + mitigation 2종(lane 별 nested repo worktree / 파일-disjoint 보장) 문서화, (b) 하네스가 nested-repo write 타깃 감지해 경고/re-worktree 제안.

세 요청 모두 read·worktree 표면의 캘리브레이션/정합성 신호 — irreversibility barrier, Andon 규율, budget circuit-breaker, speculation gating 은 건드리지 않으며 모두 명세대로 작동 확인.

---
*프라이버시: `_proposals/` 기본값 — adopter 서비스명·host·IP·repo 경로·내부 doc id 없음; 식별자는 role 로 일반화; `Superscalar.md` 정책 표면만 다룸.*

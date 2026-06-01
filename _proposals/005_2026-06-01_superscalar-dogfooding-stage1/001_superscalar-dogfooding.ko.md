# Superscalar Stage 1 — 다운스트림 도그푸딩 리포트 (n=7)

> **출처**: 한 다운스트림 적용 프로젝트 — 실시간 채팅 서비스 마이크로서비스; Superscalar·Constellation 모듈 포함 시드 전면 채택; Burst 페이스 모드(`issue_width` cap = 6).
> **대상**: `Superscalar.md` v0.2 Stage 1 — `§2` issue_width 공식 · `§5` adoption threshold · `§11` dogfood log.
> **표본**: \~3일간 retire 된 lane n = 7. case-based ledger, 실측값만(합성/이론치 없음).

`§11` dogfood-log 루프의 다운스트림 절반입니다. 적용 프로젝트가 Stage 1 lane dispatch 7건을 실사용 누적했고, `§5` adoption threshold + `§2` issue_width 캘리브레이션에 들어갈 telemetry 를 보고합니다. actionable 신호 1건 + 정책 확인 + 미exercise 표면의 정직한 목록.

## 1. Case ledger 요약

| # | 작업 분류 | 메커니즘 | width | OoO | spec | conflict | 결과 |
|---|---|---|---|---|---|---|---|
| 1 | 내부 PM 문서 현행화 | board worker (A2A) | 2 | Y | off | 없음 | retired |
| 2–6 | 코드베이스 context sweep (UI / 스타일 / git-history 매핑) ×5 | read-only subagent | 2 | Y | off | NA (read-only) | retired |
| 7 | 시드 업그레이드 델타 매핑 (본 리포트 자체의 리서치) | workflow: 7 readers + synthesis | **7** | Y | off | NA (read-only) | retired |

메커니즘 구성: board-worker(A2A relay) 1, read-only 리서치 subagent 5, workflow fan-out 1. 전부 OoO = Y(ready-first dispatch). **write lane: 최대 width = 1**(scope 격리 단일 파일). **read-only lane: 6.** **speculation = 0/7. worktree-isolation 직접 사용 = 0/7.**

## 2. 핵심 발견 — read/write lane-class cap 비대칭 (actionable)

**관찰 (case 7)**: 리서치 fan-out 이 **read-only reader 7 lane**(각각 작업의 disjoint slice 매핑) + synthesis barrier 를 dispatch — **`issue_width` cap 6 을 처음으로 초과**했고, **downside 0**.

**이 lane class 에서 cap 초과가 무해했던 이유**: cap 의 binding 제약은 전부 *write-lane* 관심사라 read-only 리서치 lane 엔 안 걸립니다.

| `issue_width` 차원 (`§2`) | write lane binding? | read-only fan-out binding? |
|---|---|---|
| effort band | yes | yes (large/complex 작업 → band ≥ 10) |
| pace_mode cap (Burst = 6) | yes | 여기선 artificial — `R2` 참조 |
| Little's Law (review throughput ÷ 작업 길이) | yes (retire-merge 이 review-gated) | **no** — read lane 은 *synthesis 소비*로 retire, review-gated merge 아님 |
| Kanban WIP ≈ team_size + 1 | yes (WAW / merge 경합) | **no** — disjoint read scope 는 공유 mutable contract 없음; conflict = NA |
| autonomy_available_workers | yes | yes (7개 전부 native auto worker) |

read-only lane 은 **store buffer 없음, retire-merge ordering 없음, WAW hazard 없음** — disposable(출력은 synthesis barrier 가 소비, 공유 표면에 merge 안 됨). write width 를 실제로 조이는 두 항(Little's Law, Kanban WIP)이 **안 걸리고**, 진짜 ceiling 은 `effort_band` 와 raw concurrency 한도뿐.

**제안 P1**: `§2` `issue_width` 공식을 **lane-class-aware** 로. 현재 단일 cap 은 암묵적으로 write-lane 형태. read-only / analysis lane class(비가역 효과 없음, retire-merge 없음, synthesis 시 disposable)는 write / worktree lane class 보다 **높은 cap** 을 가질 수 있음 — 예:

```
issue_width_read  = min(effort_band, runtime_concurrency_ceiling, autonomy_available_workers)
issue_width_write = min(effort_band, pace_mode_cap, Little's-Law, Kanban-WIP, autonomy_available_workers)
```

read lane 에서는 retire-merge 경합만 모델링하는 Little's-Law·Kanban-WIP 항을 제거. 이는 `§3` 이 irreversibility barrier 에 이미 긋는 경계(read/analyze = default-allowed; write/deploy/send = retire-gated)를 그대로 상속.

## 3. 확인 (n=7 이 기존 정책 corroborate)

- **Latency-hiding thesis — 확인.** 7 lane 전부 review-wait 또는 독립-작업 창에서 agent-time 을 hidden. write-lane width 는 1 을 안 넘음; 진짜 병목은 review throughput + 독립-작업 가용성이지 모델 처리량 아님. agent-time-vs-human-time 전제가 실사용에서 지배적 가치 동력, raw 병렬성 아님.
- **Speculation off-by-default — held (0/7).** 3 ask-trigger(고신뢰 likely branch + low downstream sensitivity + 의미있는 latency saving)를 동시 충족한 case 없음. 보수적 default 비용 0; speculation-discard 로그 비어있는 채 유지(설계대로).
- **MAST FM-1.3 (중복 작업) = 0.** case 7 의 7 reader 가 area-disjoint manifest 사용; 두 lane 이 겹친 적 없음. lane-manifest cross-check(`§3`–`§4` / MAST 가드)가 width 7 에서도 유효. FM-1.5 / FM-2.6 미발동.
- **In-order retire held** — 모든 다중-lane case 에서 synthesis/merge 단계에 declared order 보존; finish-order ≠ retire-order 가 비일관 유발 안 함.

## 4. `§5` adoption-threshold readout

n=7 에서 전부 green:

| Signal | 임계치 | 실측 (n=7) | 상태 |
|---|---|---|---|
| avg merge-conflict rate | `> 15%` → `issue_width −= 2` | 0% (0/1 write-mergeable; read-only = NA) | OK |
| speculative accuracy (last 10) | `< 60%` → spec off | n/a (spec 0건) | — |
| concurrent token cost vs in-order | `> 3×` → cap 재조정 | 정성적: hidden latency > token 추가분; case 7 은 fan-out 토큰을 전부 review-wait 중 소비 | OK |
| FM-1.3 detection | `≥ 1/session` → 가드 강화 | 0 | OK |

임계치 trip 없음; auto-adjust 미발동. case 7 의 cap 초과는 read-only lane(conflict = NA)이라 merge-conflict signal 에 안 잡힘.

## 5. Entry 04 와의 관계 (그리고 *커버 못 하는* 것)

Entry 04 (`§11`, 다운스트림 full-stack A/B)는 width 4 고정에서 **in-lane sub-split ROI** 측정 — *스코프 / 추적성 / `[추정]→[확정]` > equal-scope 효율* 결론, +127% wall-clock 은 단일-대시보드 *순차* 실행 아티팩트로 표시.

본 7 case 는 **orthogonal**:
- Entry 04 는 **lane 내부 깊이** 변화. 본 리포트는 **review-wait 중 cross-lane fan-out**(latency-hiding) 변화.
- 본 적용 프로젝트는 **worktree-isolation 0, speculation 0** 이라 Entry 04 의 ROI 분리·in-lane 오버헤드 추정을 **corroborate 불가**.
- Entry 04 가 surface 못 한 것을 추가: **read/write cap 비대칭** — Entry 04 는 width 를 4(cap 미만)로 고정해 read-only-fan-out-above-cap 영역을 probe 안 함.

`§5` 의 보완 입력; 어느 쪽도 다른 쪽을 subsume 안 함.

## 6. 미exercise 표면 (정직한 gap)

본 적용 프로젝트가 아직 안 한 것:
- **worktree-isolation lane (0/7)** — 사용 메커니즘은 board-worker A2A, read-only subagent, workflow fan-out. ROB-isolation 경계(`§3`)는 telemetry 0; 첫 same-file write-conflict 압력이 트리거.
- **speculation (0/7)** — ask-trigger 미충족; Stage 2/3 기능(register renaming, memory disambiguation, value prediction) 데이터 0.
- **wide *write* fan-out** — write width 가 1 을 안 넘어 merge-conflict / Kanban-WIP 항은 write 쪽에서 미검증.

함의: 보수적 Stage-1 default 는 강하게 validate(비용 0, 유용한 것 막은 적 없음)되나 Stage 2/3 진행 **신호는 없음** — "speculation-discard 로그 30+ entry 누적 후 트리거" 게이트와 일치.

## 7. Upstream 요청

- **R1 — lane-class cap split** (`§2`/`§5`): read-only lane class 에 더 높은 cap 검토(retire-merge 경합만 모델링하는 Little's-Law + Kanban-WIP 항 제거). case 7 이 실증 앵커: width 7 read-only, downside 0, cap 6 만 nominal "no".
- **R2 — policy cap vs runtime concurrency ceiling** (clarification): workflow 기반 fan-out 에서 실제 concurrency 는 runtime(`min(16, cores − 2)` per workflow)이 제한, policy `issue_width` cap(6)과 별개. case 7 이 7 로 돈 건 runtime 이 허용했고 policy 는 6 이라서. policy `issue_width` 가 read-only fan-out 을 *binding 하려는 의도인지*, 아니면 write/worktree-lane governor 이고 read fan-out 은 runtime ceiling 이 govern 하는지? 현재 둘이 silently diverge — `§2` 가 관계를 명시할 수 있음.

두 요청 모두 **read-side 캘리브레이션** 한정 — irreversibility barrier, Andon 규율, budget circuit-breaker, speculation gating 은 건드리지 않으며 본 적용 프로젝트가 명세대로 작동함을 확인.

---
*프라이버시: `_proposals/` 기본값 — adopter 서비스명·host·IP·repo 경로·내부 doc id 없음; 식별자는 role 로 일반화; `Superscalar.md` 정책 표면만 다룸.*

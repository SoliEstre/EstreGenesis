# hub-main/ — 헤드리스 hub-main 자율 추론 루프 (§13.27 레퍼런스 구현)

사람 세션이 전혀 없는 board main(조율계 — `Constellation.md` §13.9.3 `hub-main` duty profile)을 상주시키는 supervisor 루프. **hub-peer dogfood 실배치 검증본**(다운스트림 어댑터, 2026-07-09, §13.14 redaction 적용, 스모크: routine 턴 ~17s · escalation 턴 ~23s · board 자동 백업 push)을 업스트림한 것이에요. 스펙: `Constellation.md` **§13.27** (invariants) · **§13.28** (백업 계약) · **§13.9.3** (duty profile).

## 구성

| 파일 | 역할 | §13.27 invariant 대응 |
|---|---|---|
| `hub-loop.sh` | supervisor: watcher(블록) → turn → backup 무한 루프. 기동 시 의존성 경로 echo, 첫 기동 시 커서를 현재 줄수로 초기화 | ① wake economy (watcher 블록 + 추론은 non-noise 에만 스폰) |
| `hub-turn.sh` | ① 문서 repo pull(best-effort) ② 커서 이후 inbox 1패스 분류(noise 흡수 / §13.16.9 tier 판정) ③ tier→모델·effort 매핑 헤드리스 one-shot(도구 allowlist·add-dir 최소권한·timeout 900s) ④ 성공 시에만 커서 전진 | ② cursor at-least-once ③ noise 흡수 ④ 보안 경계 ⑤ timeout ⑥ 모델 라우팅 |
| `hub-backup.sh` | 변동 시 add→시크릿 게이트→commit→push; push 실패는 로컬 커밋 보존+다음 tick 재시도 | §13.28.3 시크릿 게이트 + §13.28.5 오프라인 내성 |
| `git-askpass.sh` | PAT 를 URL/.git/config/ps args 에 안 남기는 헤드리스 git 인증 (env 참조만) | §13.28.5 |
| `Dockerfile` | 재시작 내성: git/bash 이미지 베이크 + claude 는 영속 마운트 npm prefix | §13.27.3 ops (B5) |
| `CLAUDE.md.template` | hub-main 헌장 — 조율계 역할·금지사항·A2A 회신 규약 | §13.9.3 duty-profile 헌장 |

`self-wake-watcher.sh` 는 상위 `runtime/` 의 레퍼런스를 그대로 사용해요 (`WS_STANDBY_MODE=always` — v2.4.47).

## 일반화 치환 포인트

| 심볼 | 의미 | 예시값 |
|---|---|---|
| `/data` | 컨테이너 배포 마운트 프리픽스 | Synology `/volume1/docker_store/<proj>` |
| `<docs-repo>` | 문서 repo 디렉토리명(허브가 pull, 읽기전용) | 총괄 문서 repo |
| `hub-main` | 허브 main canonical-id (§13.9.2 · §13.25.7 — 역할 인스턴스별 분리) | 배치별 고유 |
| `WS_WAIT_TICKS` | 재arm 주기(housekeeping tick) | 180 (5s×180≈15분) |
| 모델·effort 매핑 | §13.16.9 tier → 모델 | routine=저비용/low · escalation=고성능/high |
| `hub.env` | repo-외 시크릿 (config/): `GH_PAT`(GIT_ASKPASS) · 헤드리스 에이전트 인증 토큰 | 값은 config/ 에만 — 코드·state·outbox 미노출 |

## 분류 리스트의 SSoT

`hub-turn.sh` 의 NOISE/ROUTINE 리스트는 **§13.16.9 4-group + tier 컬럼의 미러**예요 — SSoT 가 바뀌면 lockstep 갱신 (watcher 와 동일 규율). 미분류 non-noise 는 fail-safe `escalation`.

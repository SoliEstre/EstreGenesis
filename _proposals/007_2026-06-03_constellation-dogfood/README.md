# 006 · 2026-06-03 · constellation-dogfood

> 다운스트림 어댑터(MangoClass 사이드카, `c:\Dev\vibe works\MangoClass`)가 EstreGenesis 문서(SSoT)만 보고 **Constellation 라이브보드를 활성화**하고, 같은 날 EG가 또 업데이트되자 **릴리스 sync 마이그레이션**까지 따라간 dogfooding 기록. "문서를 처음 따라가는 어댑터" 관점에서 문서↔코드↔NOTES drift 와 가이드 명료성을 실시간 채집.
>
> **Staging note**: 어댑터 에이전트가 중립 staging 폴더(`E:\WorkBase\temp`)에 작성. EstreGenesis 제출 시 `_proposals/007_2026-06-03_constellation-dogfood/` (시번은 maintainer tail 기준 재조정) 로 이동. 시번 006 은 `_proposals/006_2026-06-03_hyperbrief` 다음 가정.

## Bundle 정의

사이드카에서 Constellation PM/003 활성화(Step 1~6 + 핸드셰이크)를 EG `constellation/reference` 만으로 수행 → 로컬 보드 LIVE @ `:17878`. 직후 "EG 또 업데이트됐으니 migrate" 지시로 릴리스 v2.5.25 sync (시드 프롬프트는 v2.4.1 불변, 런타임은 reference 와 전부 SAME — 재증류 0). 발견: 활성화 7건(F1~F7) + 마이그레이션 4건(M1~M4) + 긍정 검증.

헤드라인:
- **F1 (Med)**: `server.cjs` `/BREW.md` 가 외부 sibling 참조 → standalone 배치 404 (NOTES 는 고쳤다고 기재, 코드 미반영).
- **F2 (Med)**: 문서 `/state.json` ↔ 실제 `/api/state` 오기.
- **M1 (Med)**: 시드-프롬프트 버전 ↔ EG-릴리스 버전 2-트랙 혼동 — "migrate" 지시를 seed-version(불변)만 보고 "할 것 없음" 오판 위험.
- **M2 (Med)**: §13.9.1(AgentHello opt-in) ↔ §2 walkthrough 핸드셰이크 4-step 서술 텐션.

## Documents

| # | topic | type |
|---|---|---|
| 001 | [Constellation 활성화 + 릴리스 sync 마이그레이션 리포트](001_activation-and-migration.md) | findings (F1~F7 활성화 / M1~M4 마이그레이션) + positives + 권고 |
| 002 | [스크래치 로그 (OBS-1~12)](002_scratch-log.md) | 실시간 원시 관찰 |

## Closure log

| date | status | note |
|---|---|---|
| 2026-06-03 | drafted (staging) | 활성화 + 릴리스 sync. F1~F7 / M1~M4. `_proposals/` 이동 + maintainer review 대기 (Constellation.md §8.2/§13.9.1, server-NOTES §2/§6, plugin README 버전). |

## Privacy

`_proposals/` privacy default 준수 — 어댑터 서비스명/호스트/IP/내부 식별자 미노출. 대상은 Constellation.md / server-NOTES / plugin 문서 표면과 generic 런타임 메커니즘만. 사이드카는 generic role(EstreUI 기반 사이드카, EG 저자 환경) 로만 식별.

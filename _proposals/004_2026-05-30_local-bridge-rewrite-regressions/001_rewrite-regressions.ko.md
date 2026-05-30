# local-bridge.cjs 리라이트가 proposal-002 fix 를 regression

- **컴포넌트**: `constellation/reference/runtime/local-bridge.cjs`
- **발견**: 최신 reference 를 프로젝트로 마이그레이션하던 다운스트림 어댑터
- **Severity**: Bug 1/2 **medium-high**(functional) · 3–5 low(일반화)
- **A2A 계약 영향**: 없음

## 배경

v2.2.x 대규모 리라이트(**§13.13 ack 계층** + **§13.9 role 분기 OnboardAck** 를 올바르게 추가)가 pre-002 스냅샷에서 출발한 듯, proposal 002 가 이미 반영한 5개 fix 를 조용히 되돌렸다.

## Regression 1 — `state.json` 을 부모 디렉토리에서 로드 (functional)

```js
// regressed:
try { const sp = path.join(DIR, '..', 'state.json'); … modes = (require(sp).modes) || {}; } catch {}
// 재적용 (002 Bug 2):
try { const sp = path.join(DIR, 'state.json');       … modes = (require(sp).modes) || {}; } catch {}
```
평탄 `reference/runtime/` 레이아웃에서 `state.json` 은 `local-bridge.cjs` 의 **형제**(이고 `server.cjs` 는 이미 `path.join(DIR, 'state.json')` 사용). `'..'` 는 `MODULE_NOT_FOUND` → **모든 `OnboardAck` 이 `modes: {}`** 로 나감.

## Regression 2 — bridge vs watcher inbox 파일 불일치 (functional)

```js
// bridge (regressed):
const INBOX  = … : path.join(DIR, 'ws-inbox.jsonl');
const OUTBOX = … : path.join(DIR, 'ws-outbox.jsonl');
```
그런데 형제 `self-wake-watcher.sh` 의 기본은 **`inbox.jsonl`**(`INBOX="${WS_INBOX:-inbox.jsonl}"`). 즉 기본 상태에서 bridge 는 **`ws-inbox.jsonl` 에 쓰고** watcher 는 **`inbox.jsonl` 을 폴링** → bridge 의 inbound 가 에이전트 다음 턴을 절대 깨우지 못함(watcher 의 존재 이유). 재적용(002): bridge 가 `inbox.jsonl`/`outbox.jsonl` 사용 → watcher 와 정합.

> **근본 패턴**: 일치해야 하는 두 값(bridge `INBOX` 기본 ↔ watcher `INBOX` 기본)이 두 파일에서 독립 설정 — 전형적 drift 지점. 아래 가드 제안.

## Regression 3–5 — 일반화 (cosmetic, 어댑터 혼란)

| # | regressed | 재적용 (002) |
|---|---|---|
| 3 | 헤더 `ws-local-bridge.cjs — 로컬 IDE 에이전트(Claude Code 세션)` | `local-bridge.cjs — turn-based local IDE 에이전트` |
| 4 | `AGENT_NAME` 기본 `'Local IDE (Claude)'` | `'Local IDE Agent'` |
| 5 | `OnboardAck.guide` `'dashboard/live/AGENT-CONNECT.md §1.5~1.8 · WS-PROTOCOL.md §13'` | `'AGENT-CONNECT.md · WS-PROTOCOL.md'` |

upstream 환경의 비공개 경로/브랜딩이 공개 reference 로 재유입(§13.14 redaction 표면).

## Fix — 5개 전부 재적용 (흡수)

재적용 후 `node --check` PASS. §13.13 ack 계층 / §13.9 role 분기 / proposal-003 단일-인스턴스 가드는 그대로 보존.

## 제안 — regression 가드

reference 런타임에 작은 `node --test` 추가 → 향후 리라이트가 다시 divergence 하면 CI 실패:
```js
// 1) bridge 가 state.json 을 형제로 해소(부모 아님)
assert.ok(/path\.join\(DIR, 'state\.json'\)/.test(bridgeSrc));
assert.ok(!/path\.join\(DIR, '\.\.', 'state\.json'\)/.test(bridgeSrc));
// 2) bridge INBOX 기본 === watcher INBOX 기본 (drift 금지)
assert.equal(bridgeInboxDefault, watcherInboxDefault);   // 둘 다 'inbox.jsonl'
// 3) 공개 reference 에 env-특수 경로/브랜딩 미유입(§13.14)
assert.ok(!/dashboard\/live\/|\(Claude Code 세션\)/.test(bridgeSrc));
```
"리라이트가 일반화를 조용히 잃는" regression 부류를 다운스트림 발견이 아니라 CI 실패로 전환.

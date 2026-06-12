---
id: otp-env-fallback
tier: micro
trigger:
  if: "tty-publish-check 가 non-TTY 판정 + publish 가 2FA OTP 를 요구하는 환경에서 fallback path 로 route 됨"
  then: "publish 명령에 --otp=<6-digit> flag 명시 또는 NPM_CONFIG_OTP env var pre-set (OTP 는 user 가 TOTP app 에서 1회용 제공) → invocation 후 EOTP pattern detect → EOTP 1회는 재발급 + 1회 retry, 2회 연속 EOTP 는 abort + user steering. 자동 retry loop 금지."
  format: command-check-decision
  source: post-tool-use
source_evidence:
  - greatpractice/mezzo/auth-2fa-discipline.md §2 (otp-env-fallback row)
  - greatpractice/mezzo/auth-2fa-discipline.md §5.2 (PostToolUse EOTP detection + retry containment hook spec)
  - "greatpractice/macro/release-cadence.md §2.2 EG #11 (Hub ⑧ auth)"
last_referenced_turn: 2026-06-12T19:50:00Z
class: persistent
---

# Atom: OTP Env Fallback

> mezzo `auth-2fa-discipline` 의 executable atom 2/2. non-TTY publish 의 OTP routing + EOTP retry containment 이에요.

## Command

```shell
# OTP 는 사전 발급 — user 가 TOTP authenticator app 에서 직접 추출 후 1회용으로 제공
# (autonomous-execution gate (a) loss/external-publish gate 와 자연 합류 — gate 위배 아님)
NPM_CONFIG_OTP=<6-digit> npm publish
# 또는 flag 명시
npm publish --otp=<6-digit>
```

## Check

```javascript
// invocation 후 stdout/stderr 에서 EOTP pattern detect — 다른 transient error 와 구분
function detectEotp(exitCode, stdout, stderr) {
  const out = String(stdout) + String(stderr);
  const eotpHit = /\bEOTP\b|One-time pass.*required|npm error code EOTP/i.test(out);
  const published = exitCode === 0 && !eotpHit; // success exit 0 + tarball uploaded
  return { eotpHit, published };
}
```

## Decision

```javascript
const { eotpHit, published } = detectEotp(exitCode, stdout, stderr);
if (published) return { ok: true };
if (eotpHit) {
  eotpCount += 1;
  if (eotpCount >= 2) {
    // 2회 연속 EOTP → abort + user steering (interactive shell 직접 실행 권장)
    console.error('[otp-env-fallback] ABORT: 2회 연속 EOTP — 자동 retry 금지, user interactive shell 실행 요청.');
    process.exit(2);
  }
  // 1회 EOTP → OTP expired/invalid (TOTP 30초 window) — user 에게 재발급 요청 후 1회만 retry
  return { ok: false, action: 'request-fresh-otp-then-retry-once' };
}
// EOTP 아닌 다른 error → 통상 retry / 진단 path
return { ok: false, action: 'normal-diagnosis' };
```

## Invariants

- OTP 는 1회용 + window-bound (TOTP 30초 / HOTP 60초) — pre-set 후 즉시 invoke, 묵혀두지 않음
- EOTP 는 transient error 가 아님 — 같은 명령 blind 재시도는 같은 결과; retry 는 fresh OTP 재발급 동반 시에만 1회
- 2회 연속 EOTP = hard abort threshold; publish step 을 "완료" 로 잘못 mark 하지 않음

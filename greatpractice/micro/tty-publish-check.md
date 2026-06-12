---
id: tty-publish-check
tier: micro
trigger:
  if: "publish command (npm/yarn/pnpm publish, twine upload 등) about to execute on a 2FA-enforced registry"
  then: "invocation 전 현재 shell context 의 TTY 여부 판정 → TTY present 면 direct invoke, TTY absent 면 OTP routing 명시 여부 확인 후 미명시 시 block + otp-env-fallback 로 route. exit 2 on block."
  format: command-check-decision
  source: pre-tool-use
source_evidence:
  - greatpractice/mezzo/auth-2fa-discipline.md §2 (tty-publish-check row)
  - greatpractice/mezzo/auth-2fa-discipline.md §5.1 (PreToolUse hook spec)
  - "greatpractice/macro/release-cadence.md §2.2 EG #11 (Hub ⑧ auth)"
last_referenced_turn: 2026-06-12T19:50:00Z
class: persistent
---

# Atom: TTY Publish Check

> mezzo `auth-2fa-discipline` 의 executable atom 1/2. publish 명령 invocation 전 TTY precondition 검증이에요.

## Command

```javascript
// publish 명령 invocation 직전 — command pattern match + TTY 판정
function ttyPublishCheck(command) {
  const isPublishCmd = /\b(npm|yarn|pnpm)\s+publish\b|\btwine\s+upload\b|\bpip\s+upload\b/.test(command);
  if (!isPublishCmd) return { applicable: false };
  // agent tool 환경 (Claude Code Bash) 은 non-TTY 기본
  const isTTY = Boolean(process.stdout.isTTY && process.stdin.isTTY);
  return { applicable: true, isTTY };
}
```

## Check

```javascript
// non-TTY 일 때 OTP routing 이 명시되어 있는지 — --otp= flag 또는 NPM_CONFIG_OTP env var
function hasOtpRouting(command) {
  return /--otp=\d{6}/.test(command) || Boolean(process.env.NPM_CONFIG_OTP);
}
```

## Decision

```javascript
const { applicable, isTTY } = ttyPublishCheck(command);
if (!applicable) return { ok: true, skip: 'not a publish command' };
// 2FA 미활성화 registry / source-only release → not applicable (skip)
if (isTTY) return { ok: true, path: 'direct' }; // OTP prompt 정상 표출
if (hasOtpRouting(command)) return { ok: true, path: 'otp-routed' };
console.error('[tty-publish-check] BLOCK: non-TTY publish + OTP routing 미명시 — EOTP failure 확실. otp-env-fallback atom 또는 user interactive shell 로 route.');
process.exit(2);
```

## Invariants

- non-TTY + OTP routing 미명시 상태로 publish 명령을 blind invoke 하지 않음 — EOTP 는 agent 의 success signal pattern 과 어긋나 silent retry loop 로 흡수돼요
- TTY 판정은 binary (`process.stdout.isTTY && process.stdin.isTTY`) — judgement 개입 없음
- block 시 fallback chain: `otp-env-fallback` atom → 그것도 불가하면 user interactive shell 직접 실행 (mezzo §2 3-step fallback)

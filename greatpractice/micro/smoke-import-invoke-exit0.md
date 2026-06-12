---
id: smoke-import-invoke-exit0
tier: micro
trigger:
  if: "dry-run-file-list-review 통과 후, publish 명령 실행 직전"
  then: "tarball pack → 임시 디렉토리 install → entry point 1회 invoke (CLI --version|--help / library require + 1 call / Python import + entry invoke) → verify install exit 0 + invoke exit 0 + stderr clean + expected smoke surface → proceed/block/escalate/skip-conditional"
  format: command-check-decision
  source: "cross-axis-inheritance (hook candidate: post-build-smoke-invoke PostToolUse, v0.2+)"
source_evidence:
  - greatpractice/mezzo/dry-run-smoke-test.md §2 (micro atom row 2 — smoke-import-invoke-exit0)
  - greatpractice/mezzo/dry-run-smoke-test.md §1 (post-build / pre-publish 간극 — packaged form 에서만 깨지는 entry point/의존 누락)
  - greatpractice/mezzo/dry-run-smoke-test.md §6 (entry point ground truth = mezzo bin-entry-validate)
last_referenced_turn: 2026-06-12T19:50:00Z
class: persistent
---

# Atom: Smoke Import + Invoke Exit 0

> mezzo `dry-run-smoke-test` 의 executable atom 2/2. dist artifact 를 별도 환경에 install 한 뒤 minimal happy-path 1회 실행으로 packaging structure (entry point 경로 / 의존 누락 / bundling 실패) 를 publish 전에 검출하는 atom 이에요. dev 환경 통과가 packaged form 통과를 보장하지 않아요.

## Command

```bash
# npm (대표) — tarball pack 후 임시 디렉토리에서 격리 install + 1 invoke
TARBALL=$(npm pack --silent)
SMOKEDIR=$(mktemp -d)
cd "$SMOKEDIR" && npm init -y --silent && npm install --silent "$OLDPWD/$TARBALL"
echo "install_exit=$?"

# entry point 종류별 invoke 1회 (해당 1개만 실행):
npx <bin-name> --version                                # CLI bin
node -e "const m=require('<pkg-name>'); m.<oneMethod>()" # library main
# python -c "import <pkg>; <pkg>.<entry>()"              # Python entry point
echo "invoke_exit=$?"
```

## Check

```javascript
// install/invoke 의 exit code + stderr 를 capture 한 결과에 대해:
const checks = {
  // (a) install 단계 exit 0
  installExit0: installExitCode === 0,
  // (b) entry point 실행 exit 0
  invokeExit0: invokeExitCode === 0,
  // (c) stderr 에 의존 누락 / 경로 에러 패턴 없음
  stderrClean: !/(Cannot find module|MODULE_NOT_FOUND|ENOENT|ImportError|ModuleNotFoundError)/.test(stderr),
  // (d) 출력이 expected smoke surface 와 일치 (버전 문자열 / help 메시지 / 1 method 정상 반환)
  expectedOutput: new RegExp(EXPECTED_SMOKE_PATTERN).test(stdout), // 예: ^\d+\.\d+\.\d+
};
console.log(JSON.stringify(checks, null, 2));
```

## Decision

```javascript
if (!checks.installExit0 || !checks.invokeExit0 || !checks.stderrClean || !checks.expectedOutput) {
  // BLOCK: packaging structure 또는 의존 누락 수정 후 dry-run (atom 1) 부터 재실행
  console.error('[smoke-import-invoke-exit0] BLOCK: smoke failed — fix packaging, restart from dry-run');
  process.exit(2);
}
// ESCALATE: CLI 가 아닌 복합 artifact — smoke surface 정의에 user judgement 필요 (실행 전 분기)
// skip-conditional: entry point 없는 pure data package — smoke 비적용 (실행 전 분기)
console.log('[smoke-import-invoke-exit0] PROCEED — publish 명령 실행 가능');
```

## Invariants

- 반드시 **tarball/임시 install 환경** 에서 실행 — 프로젝트 working tree 의 `node_modules` 재사용 금지 (packaged form 검증이 목적).
- invoke 는 1회 minimal happy-path 만 — full test suite 대체가 아니에요.
- BLOCK 후 수정 시 atom 1 (`dry-run-file-list-review`) 부터 재진입 (file list 가 수정으로 바뀌었을 수 있음).
- entry point 의 valid 경로는 선행 mezzo `bin-entry-validate` 가 ground truth.

## Used By

- (v0.2+) `post-build-smoke-invoke` PostToolUse hook — mezzo §5 spec candidate

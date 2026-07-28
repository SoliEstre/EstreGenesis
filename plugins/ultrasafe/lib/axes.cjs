'use strict';
/**
 * Ultrasafe 선언 축 등록부 — `Ultrasafe.md §3.1` dispatch matrix 의 기계 판독 사본.
 *
 * 왜 파일 하나인가
 * ────────────────
 * §6.3 커버리지의 **분모**가 여기 걸려 있어요. 축 목록이 스펙과 코드에 두 벌로 존재하면
 * 「얼마나 덮었나」의 답이 *어디에 물어보느냐* 에 따라 달라져요. 같은 저장소에서 Tier 문턱이
 * 정확히 그렇게 갈렸던 적이 있어요 — 훅은 0.85 tier-무관, 도구는 50/75/90 을 쓰고 있었고,
 * 그래서 `lib/coverage-floor.cjs` 한 곳으로 모았어요. 이 파일은 **축에 대해 같은 일**을 해요.
 *
 * 드리프트 방어는 이 파일이 아니라 검사예요
 * ─────────────────────────────────────────
 * `scripts/verify-ultrasafe-coverage-denominator.cjs` 가 이 배열과 `Ultrasafe.md §3.1` 표를
 * **양방향 대조**해요. 한쪽만 바뀌면 빌드가 깨져요. 사본을 두는 게 안전한 건 사본이 검사받을
 * 때뿐이고, 안 그러면 사본은 조용히 뒤처지는 쪽이에요.
 *
 * 축을 늘리는 건 분모를 바꾸는 일이에요
 * ──────────────────────────────────────
 * 축이 하나 늘면 모든 과거 커버리지 수치의 의미가 바뀌어요(분모가 커지니 같은 작업의 비율이
 * 내려가요). 그래서 축 추가는 코드 편집이 아니라 **결정**이고, §3.1 + 이 파일 + N-way 등록부가
 * 같은 컷에서 함께 움직여야 해요. `usf-cloud-iam` / `usf-mobile` 같은 v0.2 후보가 그 대상이에요.
 *
 * 축이 아닌 것: 카탈로그 **분류(class)**
 * ────────────────────────────────────
 * 한 축 안에서 무엇을 팠고 무엇을 안 팠는지는 축이 아니라 분류예요 — 그걸 담는 칸이
 * `untested_classes[axis]` 이고요. 분류를 축으로 올리면 분모가 부풀어서, 「할 일을 늘리면
 * 비율이 오른다」는 거꾸로 된 유인이 생겨요.
 */

// §3.1 표의 13행, 표에 적힌 순서 그대로.
const DECLARED_AXES = Object.freeze([
  'usf-ai-llm',
  'usf-ai-agentic',
  'usf-ai-aml',
  'usf-web-sast-dast',
  'usf-web-infra',
  'usf-supply-chain',
  'usf-crypto',
  'usf-social-eng',
  'usf-stride',
  'usf-linddun',
  'usf-kill-chain',
  'usf-protocol-lifecycle',
  'usf-iam-config',
]);

/**
 * 스펙에 `usf-` 로 나오지만 **축이 아닌** id — 사유를 함께 적어요.
 *
 * 왜 목록이 필요한가: 검사가 「스펙의 모든 usf-* 가 등록부 안인가」를 물으면 미래 후보 언급까지
 * 위반으로 잡혀서, 검사를 끄거나 후보를 축으로 올리게 돼요. 둘 다 나빠요. 대신 **예외를 이름과
 * 사유로 적게** 하면, 새로 생긴 stray 는 여전히 빌드를 깨고 기존 예외는 매번 자기를 정당화해요.
 */
const NON_AXIS_IDS = Object.freeze({
  'usf-cloud-iam': '§3.1 이 명시한 **미래 축 후보** — 등재 시 분모가 넓어지므로 컷 결정 + N-way 동기 대상이에요.',
  'usf-mobile': '§3.1 이 명시한 **미래 축 후보** — 위와 같아요.',
  'usf-opportunistic-fuzzer':
    '**미해소 참조 (2026-07-28 발견).** §3.5 의 Tier 1/2 축 부분집합이 이 id 를 dispatch 하라고 적는데 §3.1 표에 없어요. ' +
    'v0.2.10 이 분모를 등록부로 못박은 뒤로는 이걸 dispatch 하면 `coverage_pct` 가 거부돼요 — 즉 스펙이 게이트가 ' +
    '거부할 축을 지시하는 상태예요. 축으로 올릴지(분모 13→14, 모든 과거 비율이 내려감) 아니면 축이 아닌 상시 기법으로 ' +
    '재서술할지는 **결정**이라 코드로 정할 수 없어요. 그때까지 `axis_set` 과 `coverage_pct` 어디에도 넣지 마세요.',
});

const _SET = new Set(DECLARED_AXES);

/** 선언된 축인가. 등록부에 없는 id 는 분모에도 분자에도 들어갈 수 없어요. */
function isDeclaredAxis(id) {
  return typeof id === 'string' && _SET.has(id);
}

/** 커버리지의 분모. 「신고된 축 수」가 아니라 **선언된 축 수** 예요 (§6.3). */
function declaredAxisCount() {
  return DECLARED_AXES.length;
}

/** 선언됐지만 이번에 값이 안 올라온 축 — 0 으로 세어질 축들이에요. */
function unreportedAxes(coveragePct = {}) {
  return DECLARED_AXES.filter((a) => !(a in coveragePct));
}

/** 등록부에 없는데 값이 올라온 id — 조용히 평균에 섞이면 안 되는 것들이에요. */
function unknownAxes(coveragePct = {}) {
  return Object.keys(coveragePct).filter((a) => !isDeclaredAxis(a));
}

module.exports = { DECLARED_AXES, NON_AXIS_IDS, isDeclaredAxis, declaredAxisCount, unreportedAxes, unknownAxes };

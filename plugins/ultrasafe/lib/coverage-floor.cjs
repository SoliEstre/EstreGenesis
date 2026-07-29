'use strict';
/**
 * coverage-floor.cjs — the coverage floor's single source, with a declared unit.
 *
 * Why this file exists: the same gate condition was implemented twice, differently.
 *
 *   · `hooks/ultrasafe-clean-signal.cjs` hardcoded **0.85**, tier-blind — a number the spec never
 *     states for any tier. That hook is what runs on every tool call, so the recorded gate state
 *     carried a threshold nobody had declared.
 *   · `mcp/server.cjs` used the per-tier table the spec does state (Ultrasafe.md §1.4, predicate d):
 *     **Tier 1: 50% · Tier 2: 75% · Tier 3: 90%**.
 *
 * So the release gate's threshold depended on which surface you asked. Worse, **the units differed
 * too**: the MCP compares against `75` (percent) while the hook compared against `0.85` (fraction).
 * A fraction handed to the MCP (0.538 >= 75) always fails, and a percent handed to the hook
 * (53.8 >= 0.85) **always passes** — the gate inverts silently, in the permissive direction.
 *
 * Therefore this module does two things and refuses a third:
 *   ① one table, taken from the spec, exported for both surfaces;
 *   ② the caller **declares the unit** — the value is never sniffed. Guessing is what inverted it;
 *   ③ an unknown tier throws instead of defaulting, and an unmeasurable coverage returns `null`
 *      rather than a verdict. An unobservable condition is not a satisfied one.
 */

// Ultrasafe.md §1.4 predicate (d) — per-Tier coverage/catalog gate. Percent, not fraction.
const TIER_FLOOR_PCT = Object.freeze({ 1: 50, 2: 75, 3: 90 });

function floorPctForTier(tier) {
  const f = TIER_FLOOR_PCT[Number(tier)];
  if (f === undefined) {
    throw new Error(
      'unknown tier ' + JSON.stringify(tier) + ' — floors are declared for tier ' +
      Object.keys(TIER_FLOOR_PCT).join('/') + ' only (Ultrasafe.md §1.4 predicate d). ' +
      'Defaulting a floor would let an undeclared tier pass a gate it was never measured against.'
    );
  }
  return f;
}

/** Normalize a coverage value to percent. `unit` is required — see ② above. */
function toPct(value, unit) {
  if (unit !== 'fraction' && unit !== 'percent') {
    throw new Error(
      "coverage unit must be declared as 'fraction' or 'percent'. It is not inferred: 0.538 and 53.8 " +
      'are the same measurement and sniffing them once inverted this gate in the permissive direction.'
    );
  }
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;   // unmeasured
  return unit === 'fraction' ? value * 100 : value;
}

/** true / false / null — `null` means the condition could not be evaluated, which is NOT a pass. */
function meetsFloor(opts) {
  const o = opts || {};
  const pct = toPct(o.coverage, o.unit);
  if (pct === null) return null;
  return pct >= floorPctForTier(o.tier);
}

/**
 * The coverage **numerator**, computed once. Added after the same split this file was written to
 * end reappeared one layer up: the threshold and the unit were unified here, but the *quantity*
 * being compared against them was still derived two different ways.
 *
 *   · the gate averaged per-axis coverage over the declared axes — surface actually examined;
 *   · the iteration writer divided attackers dispatched by attackers configured — agents launched.
 *
 * Those answer different questions and disagree whenever one attacker covers more or fewer than
 * one axis, which is the normal case (7 attackers reported across 8 axes in the measured run).
 * Both were called `coverage`, and the one stored in the ledger — the one a human reads — was the
 * agent ratio, while the one that decided the gate was the axis mean. A number that is displayed
 * and a number that decides must not be different numbers wearing one name.
 *
 * Returns percent, or `null` when coverage cannot be computed. `null` is not zero and not a pass.
 *
 * @param {Object<string, number>} coveragePct  per-axis coverage, in percent
 * @param {string[]} declaredAxes               the denominator — every declared axis, reported or not
 */
function coverageFromAxes(coveragePct, declaredAxes) {
  if (!coveragePct || typeof coveragePct !== 'object') return null;
  if (!Array.isArray(declaredAxes) || declaredAxes.length === 0) return null;
  // Unreported axes count as **zero**, never as absent. Averaging only what was submitted lets a
  // run raise its own score by skipping axes — the defect this project measured at 50% → 90%.
  let sum = 0, reported = 0;
  for (const axis of declaredAxes) {
    const v = coveragePct[axis];
    if (typeof v === 'number' && Number.isFinite(v)) { sum += v; reported++; }
  }
  if (reported === 0) return null;   // nothing submitted at all = unmeasured, not 0%
  return sum / declaredAxes.length;
}

module.exports = { TIER_FLOOR_PCT, floorPctForTier, toPct, meetsFloor, coverageFromAxes };

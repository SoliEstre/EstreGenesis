# Ultrasafe — Claude Code Plugin (v0.1.0)

Reference implementation of the Ultrasafe module spec (`Ultrasafe.md` v0.1.0) for Claude Code. Ultrasafe 는 *출시 직전 / 출시 시점 / 출시 직후* 의 공격자 시점 병렬 모의 침투 시험 + ≥3 iteration loop + clean-signal gate 통과 후에만 release 허가하는 *pre-release security attestation* 체계예요.

## What this v0.1.0 ships

- **Module spec** (`Ultrasafe.md` v0.1.0) — 2544 줄 사양 본문 (§1-§13 + 부록 A-C)
- **Plugin manifest** (`.claude-plugin/plugin.json`)
- **Plugin README** (이 파일)

본 v0.1.0 은 *advisory-only* mode 의 first cut — 사양 본문 + plugin manifest 만. 실제 runtime (공격 에이전트 dispatch / 합성 보고서 생성 / iteration loop runner / 5 A2A intent handler / hook) 은 v0.2.x roadmap.

## What's deferred to v0.2+

- **runtime/** — 공격 에이전트 dispatch runner + iteration loop driver + clean-signal gate evaluator + 3-layer synthesis report generator
- **schemas/** — finding JSON schema + OSCAL Assessment Result schema + 5 A2A intent schemas
- **skills/** — `/ultrasafe` model-invoked skill + sub-skills (8 attack agent persona + synthesizer)
- **hooks/** — PreToolUse hook (`git push --tags` / `npm publish` / `gh release` 등 7 종 매처) + Stop hook (iteration boundary)
- **mcp/** — MCP server exposing finding query + ledger append tools

## v0.2 → v1.0 roadmap

- **v0.2.x** — advisory → blocking mode transition (Tier 3 release strict / Tier 1/2 opt-in)
- **v0.3.x** — 17-axis full fan-out (현재 8-agent minimum 에서 확장)
- **v0.4.x** — post-release watcher + MPCVD coordination + 양방향 Greatpractice feedback loop
- **v1.0** — §11.5-style readiness rubric 통과 후 ship

## How to invoke (v0.1.0)

v0.1.0 은 사양 + manifest 만. 실제 동작은 v0.2.x runtime cut 후 가능. 현재는 spec 본문 읽기 + plan-only mode 가능:

```bash
# Module spec 읽기:
cat Ultrasafe.md
# 17-axis research backing 확인:
ls reports/2026-06-05-ultrasafe-research/
```

## Reference

- **Spec**: `Ultrasafe.md` (v0.1.0)
- **Research backing**: `reports/2026-06-05-ultrasafe-research/` (17 axes × research + patterns + 3 synthesis files)
- **Related modules**: Constellation (A2A integration), Superscalar (fan-out host), Hyperbrief (escalation routing), Greatpractice (tree promotion)

## License

Apache-2.0

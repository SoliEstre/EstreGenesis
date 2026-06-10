# Ultrasafe — Claude Code Plugin (v0.2.x)

Reference implementation of the Ultrasafe module spec (`Ultrasafe.md` v0.2.x) for Claude Code. Ultrasafe 는 *출시 직전 / 출시 시점 / 출시 직후* 의 공격자 시점 병렬 모의 침투 시험 + ≥3 iteration loop + clean-signal gate 통과 후에만 release 허가하는 *pre-release security attestation* 체계예요. v0.2.x 는 **advisory mode** — 모든 출력은 report-only, publish 차단 없음 (blocking 전환은 v0.3+, Ultrasafe.md §19).

## What this v0.2.x ships

- **8 attacker skills** (`skills/ultrasafe-<role>/SKILL.md`) — `ai-llm-redteam` · `web-api-attacker` · `supply-chain-auditor` · `crypto-reviewer` · `social-engineer` · `methodology-compliance` · `threat-model-lifecycle` · `synthesizer` (fan-out sink). 각 attacker 의 input/output/tools/when-to-fire/severity rubric (Ultrasafe.md §15).
- **2 hooks** (`hooks/`) — PreToolUse `ultrasafe-trigger.cjs` (publish-equivalent command 15-패턴 매처 → advisory surface + `.ultrasafe/state.json` 기록 + `ULTRASAFE_RELEASE_GATE` outbox emit) + Stop `ultrasafe-clean-signal.cjs` (cycle-end 4-condition AND-gate self-contained 평가). 둘 다 항상 exit 0 (advisory invariant). 등록은 `hooks/hooks.json`.
- **MCP server** (`mcp/server.cjs`) — 5 tools over stdio JSON-RPC: `ultrasafe_run_fanout` / `ultrasafe_finding_aggregate` / `ultrasafe_clean_signal_check` / `ultrasafe_report_generate` / `ultrasafe_release_gate`. SDK-free 단일 파일 구현, npm dep 은 ajv 1개 (Ultrasafe.md §16).
- **Plugin manifest** (`.claude-plugin/plugin.json`) + 본 README.

**논리 역할 ↔ ship 표면** (Ultrasafe.md §14.1): orchestrator / aggregator / clean-signal-gate 는 *논리 역할* 이에요 — 별도 `runtime/*.cjs` 파일이 아니라, 메인 에이전트의 Workflow fan-out + synthesizer skill + MCP tools 가 수행해요. 운영 상태는 adopter repo 의 `.ultrasafe/` working dir 에 기록돼요.

## What's deferred to v0.3+

- **blocking mode** — clean-signal 미도달 시 publish gate (exit 2 + user gate). 전환 3-AND 조건은 Ultrasafe.md §19.
- **`runtime/` 분리 파일** — orchestrator / aggregator / clean-signal-gate 의 독립 cjs 화 (현재는 논리 역할).
- **`schemas/` JSON schema 파일** — finding / iteration-boundary / release-gate. 3 계약의 정본은 spec 본문 (§4 + §8.1); `mcp/server.cjs` 의 ajv validator 는 schema 파일 부재 시 graceful skip.
- **`mcp/tools/*.cjs` 분리** — 5 tool handler 의 파일 분할 리팩토.
- **17-axis full fan-out** — 현재 8-agent minimum 에서 확장.

## How to invoke (v0.2.x)

```bash
# 1) plugin install (hooks.json 이 PreToolUse + Stop 자동 등록):
/plugin install ultrasafe@estregenesis-plugins

# 2) MCP server 등록 (선택 — 5 tool 직접 호출용):
node plugins/ultrasafe/mcp/server.cjs   # stdio JSON-RPC

# 3) release 전 fan-out 은 메인 에이전트가 구동 (orchestrator 역할):
#    tier 분류 (§10.3) → axis-set (§10.4) → Workflow fan-out 으로 8 skill dispatch
```

publish-equivalent 명령 (`npm publish`, `git push --tags`, `gh release create` 등 15 패턴) 실행 시 PreToolUse hook 이 자동으로 advisory surface 를 emit 해요 — 차단은 하지 않아요.

## Risk acknowledgement (5)

1. **LLM finding 은 hallucination 가능** — 모든 finding 은 advisory, human review 전제.
2. **토큰 비용** — 매 release fan-out 8+ agent 병렬 호출 + ≥3 iteration.
3. **false positive 인지 부담** — v0.2.x 는 FP baseline 수집 단계.
4. **"clean" ≠ "secure"** — coverage 는 catalog cell 단위 명시 측정 (`passed coverage X% under catalog v_Y`), "secure" 단어 사용 금지 (§2.1.6).
5. **자동 차단 없음** — advisory mode 에서는 어떤 finding 도 publish 를 막지 않아요.

## Reference

- **Spec**: `Ultrasafe.md` (v0.2.x — §14-§19 runtime 명세)
- **Research backing**: `reports/2026-06-05-ultrasafe-research/` (17 axes × research + patterns + 3 synthesis files)
- **Related modules**: Constellation (A2A 5-intent 통합), Superscalar (fan-out host), Hyperbrief (escalation routing), Greatpractice (tree promotion)

## License

Apache-2.0

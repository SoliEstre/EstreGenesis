# Constellation Python Gateway Reference Summary

**Subject:** Python / asyncio reference-oriented adapter for Constellation live-board protocol v0.3  
**Target path:** `constellation/reference/gateway/hermes/`  
**Status:** rewritten from Gemini draft after SSoT review; must pass local gates before public promotion  
**EstreGenesis reference checked:** `SoliEstre/EstreGenesis@51a93826f8d3` (`main`, 2026-05-31T23:52:49Z; release message v2.4.14). Local saved `reference/estregenesis/Constellation.md` matches the raw GitHub file at that commit, sha256 `83799142cb5f2abcdcfd249f127c8f2bfcf668914d2173edba664a029726fefe`.

## What this package contains

- `ws_agent_client.py`: a compact Python adapter example for Constellation agent roles.
- `README.md`: role/auth/handshake/A2A reliability and QA notes.
- `constellation-hermes-gateway-ref.zip`: byte-identical bundle of the two files above.

## Corrected protocol stance

- Handshake is server-first `SERVER_HELLO`, then client `HELLO`, then top-level `CUSTOM/AgentHello`.
- Canonical roles are `main`, `local`, `upstream`, `collab`, `board`; there is no wire role named `worker`.
- `upstream` connects with `?upstreamKey=<uk-…>` and operates as a peer, not as a `Delegate`-waiting local worker.
- `OnboardAck` is role-conditional: local workers wait for `Delegate`; upstream/collab peers treat it as informational and continue their own track.
- Outbound event names use phase events: `STEP_STARTED/FINISHED`, `TEXT_MESSAGE_START/CONTENT/END`, `TOOL_CALL_START/ARGS/END/RESULT`.
- Delivery default is at-most-once. Reliability is layered through `msgId`, server `Ack{delivered}`, agent `AckProcessed`, `ReviewSLAAck`, and bounded probe/escalation behavior.
- The adapter does not fabricate agent-layer commitment signals. `AckProcessed`, `ReviewSLAAck`, and `Pong` belong to the active runtime turn.
- Generic redaction is required before public/board surfaces.

## Upstream-agent specific behavior

An upstream agent is a peer coordination participant. It should prioritize outbound A2A messages and their prerequisites, avoid fresh-context deferral, emit blocker/deadlock signals when waiting, and route structured human decisions through the board `decisions` panel.

Relevant wire names included for downstream implementers:

- `ReviewSLAAck`
- `DONE`
- `BLOCKED`
- `NEEDS_HUMAN`
- `BlockerManifest`
- `BlockerNudge`
- `DeadlockProbe`
- `PreemptRequest`
- `PreemptForce`
- `MediationProposal`
- `MediationAck`
- `EscalationRequest`

## Promotion checklist

1. Python compile/load passes.
2. `.eux` parse passes.
3. zip contents equal master copy hashes.
4. protocol forbidden grep returns no hits in release files.
5. required protocol terms are present.
6. redaction grep against private token list returns no hits.

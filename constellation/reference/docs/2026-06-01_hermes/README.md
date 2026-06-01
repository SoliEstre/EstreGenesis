# Hermes Dev Agent handoff bundle — 2026-06-01

Archive of the handoff bundle delivered by the Hermes Dev Agent on 2026-06-01 covering Constellation gateway-client distillation, Python reference adapter rewrite, and review/reflection/onboarding documents authored against the Constellation v2.3.7 / live-board protocol v0.3 SSoT.

The handoff was authored against EG commit `51a93826f8d3` (v2.4.14 release tag); EG has since progressed to v2.4.19 with §13.16.6/§13.16.8/§13.16.9/§13.16.10 additions and the A2A PR System RRP v0.3 ship. The handoff bundle is preserved here as a point-in-time technical input; per-document follow-up decisions (whether to promote any content into the canonical `constellation/` tree) are tracked separately.

## File index

- `GEMINI-OUTPUTS-REVIEW.md` (12,794 bytes) — Three-axis (PM/Spec · BE/Code · QA/Docs) review of an earlier Gemini-authored draft against the Constellation live-board protocol SSoT. Surfaces seven critical findings (C1-C7) and seven high findings (H1-H7) including `HELLO_ACK` non-existence, auth parameter confusion, default-role `worker` not-in-spec, AG-UI phase event mismatch, envelope field gaps, delivery semantics conflicts, and redaction-requirement misreading.
- `UPSTREAM-AGENT-REFLECTION.md` (5,231 bytes) — Distillation of ten upstream-peer invariants for Constellation v2.3.7: role-truth-is-server-side, peer-not-worker, `SERVER_HELLO`-based handshake, top-level envelope fields, outbound A2A priority, default at-most-once delivery, explicit-commitment-for-deferred-work, no idle heartbeat / no bridge auto-pong, watch-state / no-defer discipline, board-mediated human escalation.
- `AUTONOMOUS-AGENT-ONBOARDING-GUIDE.md` (5,497 bytes) — Onboarding guide for API-based agents, independent CLI/runtime agents, and upstream peers joining a Constellation live board. Covers role/access path, handshake, envelope/routing, outbound event vocabulary, A2A reliability, upstream peer operation directive, and redaction.
- `HANDOFF-MANIFEST.json` (~1,800 bytes) — Provenance manifest with sha256 of each handoff file. The `root` field was redacted to `<hermes-workspace>` placeholder per Constellation §13.14 reference-build redaction discipline; file-level sha256 values unchanged.

## Related files (placed outside this directory)

- `constellation/reference/gateway/hermes/_hermes-handoff-20260601/` — gateway-client distillation (`gateway-client.eux`), Python reference adapter (`ws_agent_client.py`), Hermes README (`README.md`), reference summary (`constellation-hermes-ref-summary.md`), and zip bundle (`constellation-hermes-gateway-ref.zip`). Preserved as a side-by-side handoff snapshot; the canonical `constellation/gateway-client.eux` and `constellation/reference/gateway/hermes/{README.md,ws_agent_client.py}` remain unchanged in this consolidation.
- `assets/handoffs/2026-06-01_hermes/extracted/reference/estregenesis/Constellation.md` (gitignored) — Hermes-side snapshot of the EG Constellation.md at v2.3.7 (170,957 bytes / 900 lines). EG-current Constellation.md (v2.3.10, 188,287 bytes / 981 lines) is authoritative; the snapshot is preserved review-only in the gitignored handoff archive.

## Consolidation outcome (v2.4.20)

| Source file | Disposition |
|---|---|
| `GEMINI-OUTPUTS-REVIEW.md` | Copied to this directory (1 redaction applied to a workspace-path token). |
| `UPSTREAM-AGENT-REFLECTION.md` | Copied to this directory. |
| `AUTONOMOUS-AGENT-ONBOARDING-GUIDE.md` | Copied to this directory. |
| `HANDOFF-MANIFEST.json` | Copied to this directory with `root` redacted to placeholder. |
| `gateway-client.eux` | Side-by-side at `constellation/reference/gateway/hermes/_hermes-handoff-20260601/gateway-client.eux`; canonical `constellation/gateway-client.eux` unchanged. |
| `reference/gateway/hermes/README.md` | Side-by-side at `constellation/reference/gateway/hermes/_hermes-handoff-20260601/README.md`; canonical `constellation/reference/gateway/hermes/README.md` unchanged. |
| `reference/gateway/hermes/ws_agent_client.py` | Side-by-side at `constellation/reference/gateway/hermes/_hermes-handoff-20260601/ws_agent_client.py`; canonical `constellation/reference/gateway/hermes/ws_agent_client.py` unchanged. |
| `reference/gateway/hermes/constellation-hermes-ref-summary.md` | New file at `constellation/reference/gateway/hermes/_hermes-handoff-20260601/constellation-hermes-ref-summary.md`. |
| `reference/gateway/hermes/constellation-hermes-gateway-ref.zip` | New file at `constellation/reference/gateway/hermes/_hermes-handoff-20260601/constellation-hermes-gateway-ref.zip`. |
| `reference/estregenesis/Constellation.md` | Deferred from direct integration. Kept review-only in the gitignored `assets/handoffs/` archive; EG-current Constellation.md authoritative. |

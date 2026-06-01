# Hermes 2nd handoff — consolidation archive (2026-06-01)

This subfolder archives the second Hermes Dev Agent handoff bundle, which arrived as A2A Reports + Attachments on the EG inbox between 11:09 KST and 11:11 KST (2026-06-01).

## Arrival summary

| inbox line | UTC time | name | substance |
|---|---|---|---|
| 22702 | 11:09:31.948Z | Report | Hermes Live Board/A2A Gemini 산출물 재검토 및 프로토콜 정정 |
| 22703-22704 | 11:09:31Z | Attachment ×2 | live-board-a2a-gemini-review-to-estregenesis-20260601-2005.md (9384B) + live-board-a2a-gemini-review-current-diff-20260601-2005.patch (1811B) — `path: /tmp/hermes/...` Hermes-local |
| 22705 | 11:10:00Z | Report | duplicate of 22702 (resend) |
| 22706-22707 | 11:10:00Z | Attachment ×2 | duplicate of 22703-22704 |
| 22708 | 11:11:39Z | Report | 추가 첨부: Gemini 재검토 산출물 전체 bundle |
| 22709 | 11:11:39Z | Attachment | live-board-a2a-gemini-review-artifacts-20260601-2005.tar.gz (262365B = ~256KB) — `path: /tmp/hermes/...` Hermes-local |

## Transport status

All three attachment files are present in the wire envelope only as **metadata** (`source: "local_path", status: "available", path: "/tmp/hermes/..."`) — the bytes are NOT transported across the A2A channel. The EG side has only the metadata + the Report's `bodyPreview` field (truncated at ~4.5KB; the full md is 9384B).

The §13.16.12 v2.5.5 attachment-chip pattern (Pattern 3 — graceful localPath display) is precisely the dashboard-render-tier discipline for handling this case. The bodyPreview-captured substance is preserved here as `inbox-line-22702-report-bodyPreview-truncated.md`; the remaining ~4.8KB of the md, the diff patch, and the artifacts tar.gz remain in the Hermes Agent's `/tmp/hermes/` local filesystem and were NOT received on the EG side.

## Substance captured in bodyPreview (§3.2 truncated mid-section)

Five protocol-tier corrections summarised in the bodyPreview's §1:

1. **`AgentHello` 자동 발신 기본 비활성화** — `HELLO` only by default; `AgentHello`는 `announce_agent_hello: true` opt-in일 때만 broadcast presence로 발신
2. **`main-agent` identity** — 별도 Hermes가 아니라 `hermes-dev-agent` alias로 취급
3. **self-loop wake 차단** — `source_agent_id`가 자기 자신/alias면 self-loop로 무시
4. **targeted A2A wake 제한** — `targetAgentId`가 Hermes identity set에 포함될 때만 gateway wake
5. **`AckProcessed` 자동 발신 금지** — server `Ack(kind=delivered)`와 agent-layer processed evidence 분리; gateway/adapter는 `AckProcessed`를 자동 발신하면 안 됨

## Convergent evolution with v2.5.2 §13.x

The five corrections above are already absorbed into the EG-side Constellation.md v2.3.12 (v2.5.2 ship 2026-06-01) without explicit coordination — convergent evolution from independent dogfood/review pressure:

| Hermes 2nd handoff correction | EG-side absorption |
|---|---|
| (1) AgentHello 자동 발신 금지 | §13.16.9 v2.5.2 — AgentHello moves from A2A-intent meaningful filter to **handshake group** (bridge auto-OnboardAck handles, agent does NOT wake per peer connect) |
| (2) main-agent = hermes-dev-agent alias | §13.16.9 4-group classification — handshake group naming + agent identity hint vs server-classified truth (`role_truth: "server-classified AgentList; AgentHello.value.role is a hint"` per the canonical `gateway-client.eux` v2.5.3 promotion) |
| (3) self-loop wake 차단 | §13.11.3 rule 2 (A2A-intent detection) — `targetAgentId !== self` is the canonical guard against self-loop wake |
| (4) targeted A2A wake 제한 | §13.16.9 v2.5.2 meaningful filter — A2A-intent group ONLY; the other 4 groups (transport + liveness + handshake + notice + board-directed UX residual) are all noise from the watcher's perspective |
| (5) AckProcessed 자동 발신 금지 | §13.13 v2.5.2 3-tier ack mapping — `Ack` is transport (server-emitted, wire delivery); `AckProcessed` is commitment (agent-layer assertion that the message has been surfaced); the two MUST be separated, the bridge MUST NOT fabricate `AckProcessed` |

## Outstanding transport gap

The full md (~4.8KB additional content past §3.2), the diff patch (1811B), and the artifacts tar.gz (262KB) require transport-mode re-emit (`dataUrl` or `url` field) OR manual operator copy from `/tmp/hermes/` to the EG-side `assets/handoffs/2026-06-01_hermes/2nd-handoff/`. Until that transport happens, the full corrections cannot be byte-verified against the bodyPreview summary.

The EG-side §13.16.12 Pattern 3 (graceful localPath display) is the dashboard-render discipline for this case — chip displays the localPath as informational metadata with a "local file, not transported" indicator, NOT an error or broken-link icon. The EG-side consolidation here follows the same discipline at the consolidation-tier: archive the bodyPreview substance + flag the transport gap, do not block on the missing bytes.

## Consolidation outcome

- **bodyPreview substance**: archived as `inbox-line-22702-report-bodyPreview-truncated.md` (4536B of the original 9384B md).
- **Attachment metadata**: archived as `inbox-line-22702-attachments-metadata.json` (md + patch metadata, both Hermes-local-path).
- **Bundle metadata**: archived as `inbox-line-22708-bundle-attachment-metadata.json` (artifacts tar.gz metadata, Hermes-local-path).
- **Protocol substance**: already absorbed into Constellation.md v2.5.2 §13.13 + §13.16.9 + the v2.5.3 canonical gateway-client.eux promotion (12 dimensions SSoT-compliant including the role_truth + ack-layer + telemetry-exclusion the 2nd handoff's bodyPreview describes).
- **Outstanding transport**: 3 files in Hermes-local `/tmp/hermes/` not received on EG side; surface to user + Hermes via A2A for transport-mode re-emit or manual copy.

## Provenance

- Hermes outbound time: 2026-06-01 20:05 KST (= 11:05 UTC)
- EG inbox arrival: 2026-06-01 11:09-11:11 UTC (lines 22702-22709)
- EG-side awareness: 2026-06-01 22:xx KST (operator surfaced — "Hermes는 이미 응답한 것 같은데?")
- EG-side consolidation (this README): 2026-06-01 ~14:00 UTC
- Inbox arrival gap (awareness delay): ~10 hours from arrival to consolidation start — caused by EG watcher's armed-time-anchored base-cursor missing the 22702-22709 range that arrived before the next watcher armed cycle. The gap is a §13.16.10 v2.5.2 cycle-end probe failure mode — the cycle-end probe should catch this, but the probe was running on a stale `.last-surfaced-cursor` file at the time.

## Next steps

1. Surface the Hermes 2nd handoff arrival to the user + main with an apology for the awareness delay (already incorporated into the next outbox push).
2. Request Hermes transport-mode re-emit (dataUrl or url field) OR operator manual copy from `/tmp/hermes/` to `assets/handoffs/2026-06-01_hermes/2nd-handoff/`.
3. If/when full bytes arrive, byte-verify the bodyPreview summary against the full md + diff patch + artifacts tar.gz.
4. Codify the awareness-delay incident as a memory feedback augmentation to `feedback_pre_send_inbound_check.md` — the cycle-end probe MUST advance the cursor BEFORE the next emit, not after, so that arrived-while-armed messages are not missed by the next probe.

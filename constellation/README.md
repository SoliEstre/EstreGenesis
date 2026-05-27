# constellation/ — rough-tier live-board component specs

Rough-tier (`@intent` + core `@state`/`@ports` gist) `.eux` distillations of the Constellation live-board UI components. **Flexible starting points**, not pinned implementations — the target project's stack is unknown, so these stay rough. Brew or re-distill them per your stack.

**The only invariant is the A2A bridge interface** (see [Constellation.md §2](../Constellation.md)). As long as roles, handshake, and message vocabulary match, the rest (DOM, styling, framework) is the adopter's choice.

| component | role | host contract gist |
|---|---|---|
| `ws-channel-input.eux` | per-channel prompt input (tabbed, auto-grow, persisted) | `cmd setActive/setChannels` · `out onSend(targetAgentId, text, atts)` |
| `ws-tabs.eux` | channel tab bar, 4 fixed groups (upstream/main/local/collab) | `cmd setData(snap)` · `out onSelect(key)`/`onClose(id)` |
| `ws-tool-card.eux` | tool-call aggregate card (running→done/error) | `cmd feed(evt)` — reducer (`@machine`) |
| `ws-conn-bar.eux` | connection status bar | `cmd setStatus(...)` |
| `ws-fab-badge.eux` | floating button + unseen-count badge | `cmd setUnseen/setOpen` · `out onToggle()` |
| `ws-collab-invite.eux` | collab key issue + join-URL onboarding | `cmd setIssued` · `out onRegister(label)` · `deps clipboard` |

**Invariant adapter (detail tier — kept precise because the A2A bridge contract must not flex):**

| component | role | host contract gist |
|---|---|---|
| `gateway-client.eux` | autonomous-runtime WS adapter (HELLO handshake + turn-held A2A drain) | `in wsUrl/agentId` · `cmd connect()/feedInbound(evt)` · `out onReady()/onBatch(msgs)/emit(agUiEvt)` · `deps ws_send/key/storage` · `@machine` 2-axis (connection + turn-held drain) |

The six UI components are **rough** (flexible per project); `gateway-client.eux` is **detail** because it *is* the A2A bridge interface — the one part that must stay identical across adopters. (Re-distilled by the EstreUF live-board main from Hermes's concept model into verified EstreUX `.eux`; brew PASS.)

To brew: `node spike/expand.mjs constellation/<comp>.eux` (provider `agent`), then fill the `@agent-brew` stub keeping the provenance header; `drift-check` to verify. See [Constellation.md §6](../Constellation.md) and EstreUX `BREW.md`. The deps-0 reference vanilla implementation is EstreUX `examples/ws-agent-client.cjs`.

Detail-tier source specs (full `@behavior`/`@render`/`@styles`/`@machine`) for the UI components live in the upstream live board; these rough versions are the EstreGenesis-side distribution.

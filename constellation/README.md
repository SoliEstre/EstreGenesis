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

The six UI components are **rough** (flexible per project); `gateway-client.eux` is **detail** because it *is* the A2A bridge interface — the one part that must stay identical across adopters. (Re-distilled from a concept model into verified EstreUX `.eux`; brew PASS.)

**To brew** — the runtime is [EstreUX](https://github.com/SoliEstre/EstreUX) (clone & run, Apache-2.0; not an npm package): `node bin/estreux.mjs brew constellation/<comp>.eux` (provider `agent` — the requesting agent brews it directly, no API key), fill the `@agent-brew` stub keeping the provenance header, then `node bin/estreux.mjs drift constellation/<comp>.eux` to verify the roundtrip. See [Constellation.md §6](../Constellation.md), EstreUX `BREW.md`, and the format SSoT `docs/eux-format-v0.md`. The public deps-0 reference client is `gateway-client.eux` (+ `local-bridge.eux`) in this folder — not a private file.

Detail-tier source specs (full `@behavior`/`@render`/`@styles`/`@machine`) for the UI components live in the upstream live board; these rough versions are the EstreGenesis-side distribution.

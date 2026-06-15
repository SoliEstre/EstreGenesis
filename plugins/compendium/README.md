# compendium

Reference plugin for the **Compendium** module — EstreGenesis's 6th module, a concept-anchored dual-register vocabulary substrate. Full spec: [`Compendium.md`](../../Compendium.md).

**v0.2.0 — runtime foundation.** This plugin ships the manifest, the spec's MCP tool signatures (`Compendium.md` §10), and `lint.cjs` — the v0.2 runtime implementation of the §9.1 gardening lints + the §9.2 pointer-resolution check (`node lint.cjs --reindex`), operating on the `compendium/` content store (7 seed entries — 5 glossary + 2 concept, `owner_spec` slugs resolved against the real spec headings). The MCP server, dashboard board surfaces, and click-to-define component remain deferred v0.2.x prunable units (`Compendium.md` §13). Adopt the spec directly; the harness adapter lands across v0.2.x.

License: Apache-2.0.

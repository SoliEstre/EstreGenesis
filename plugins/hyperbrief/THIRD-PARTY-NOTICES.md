# Third-party notices — hyperbrief

This plugin ships the dependency tree below **inside the repository**, at `node_modules/`.

Plugins are distributed as a code copy with no `npm install` step, so a declared dependency is
absent in the only configuration adopters run. Where the platform provides an equivalent, the
platform part is used instead (the WebSocket client: Node >= 22 provides a global `WebSocket`, so
no copy of `ws` is carried). Where it does not, the part is carried here rather than asked of the
adopter.

The tree is generated — do not hand-edit it, and do not run `npm install` in place:

```
node scripts/sync-vendored-deps.mjs --write
```

Source of truth for its contents: `vendor.manifest.json`.

| Package | Version | License | Notice file |
|---|---|---|---|
| `ajv` | 8.20.0 | MIT | `node_modules/ajv/LICENSE` |
| `fast-deep-equal` | 3.1.3 | MIT | `node_modules/fast-deep-equal/LICENSE` |
| `fast-uri` | 3.1.4 | BSD-3-Clause | `node_modules/fast-uri/LICENSE` |
| `json-schema-traverse` | 1.0.0 | MIT | `node_modules/json-schema-traverse/LICENSE` |
| `require-from-string` | 2.0.2 | MIT | `node_modules/require-from-string/license` |

Each package retains its own license file at the path above, as those licenses require.
Files a runtime cannot load (type declarations, source maps, tests, benchmarks, CI config) are
removed; every `.js` / `.json` / license file is kept, including code paths this repository never
exercises — a tree pruned to the measured require-closure would break the first adopter who takes
an untested path.

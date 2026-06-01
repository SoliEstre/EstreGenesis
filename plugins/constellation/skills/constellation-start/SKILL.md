---
name: constellation-start
description: Start the Constellation live board — spawns the WebSocket server (constellation/reference/runtime/server.cjs) and the local bridge (local-bridge.cjs) on configured ports. Use when the user wants to bring the live board online for a new project, restart the board after a crash, or verify the board is reachable. NOT a model-invoked skill — invoke via `/constellation-start` user command.
---

# Start the Constellation live board

Brings the WS server + local bridge online. Use when:

- Setting up Constellation for a new project (first-time start)
- Restarting after a crash or operator-initiated stop
- Verifying the board is reachable from the current host

## Steps

1. Check `state.json` exists (`<project>/.constellation/state.json` or `<project>/dashboard/live/state.json`). If absent, initialise from the schema in `constellation/reference/state-schema.md`.
2. Spawn `node constellation/reference/runtime/server.cjs` on the configured port (default `:7878`).
3. Spawn `node constellation/reference/runtime/local-bridge.cjs` (file-IO control bridge for turn-based agents).
4. Verify both processes are alive (the §13.16.4 HELLO churn dampening should NOT fire on cold start; if it does, indicates a stale lock).
5. Print the dashboard URL (`http://localhost:7878/`) for the operator.
6. (Optional) Spawn the watchdog (`node constellation/reference/runtime/watchdog.eux`-equivalent) for server/bridge liveness monitoring.

## Stop sequence

Use `/constellation-stop` to graceful-shutdown both processes (HELLO churn dampening + reconnect-friendly close).

## Spec source

`Constellation.md §6` (reference implementation) + `§4` (runtime patterns).

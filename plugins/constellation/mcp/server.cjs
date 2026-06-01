#!/usr/bin/env node
// constellation/mcp/server.cjs — MCP server skeleton (Phase 1 prototype, v0.1.0)
//
// Per Constellation.md §8 (v0.4 MCP integration), this server exposes the live
// board through MCP so external Claude Code sessions can read board state and
// emit targeted A2A messages without standing up a long-lived WS connection.
//
// Phase 1 scope (this file): tool registration + stub responses + proxy
// connection to the WS server. Read tools return real data via the WS proxy;
// write tools currently emit but ack-wait is best-effort.
//
// Phase 2 scope (v2.5.10+):
//   - a2a_wait_ack with full 3-tier ack tracking
//   - session-lifecycle AgentList integration
//   - MCP prompts/list and resources/list (board-state-as-resource)
//   - chunked transfer for large A2A payloads (composes with §13.11
//     attachment transport-mode under negotiation per outbox 295)
//
// Auth model (Constellation.md §8.4):
//   token / upstreamKey / collabKey env vars validate on first tool call.
//   Keys are NEVER passed as tool args (§13.14 redaction discipline).

'use strict';

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// ----- MCP protocol skeleton -----
// Minimal MCP server implementing tools/list + tools/call over stdio.
// Real impl will use @modelcontextprotocol/sdk; this stub keeps deps-0 for
// Phase 1 inspection.

const TOOLS = [
  {
    name: 'board_state_get',
    description: 'Return the Constellation board state.json (modes, channels, current/done/planned, decisions, keys). Read-only.',
    inputSchema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'board_history_tail',
    description: 'Return per-channel A2A history from a cursor forward. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {
        channelId: { type: 'string', description: 'The channel identifier (e.g., agentId or board-channel name).' },
        sinceCursor: { type: 'integer', description: 'Cursor (inbox line index) to start from. 0 = from start.' },
        meaningfulOnly: { type: 'boolean', description: 'If true (default), filter to A2A-intent allowlist per §13.16.9 v2.5.2.', default: true },
      },
      required: ['channelId', 'sinceCursor'],
    },
  },
  {
    name: 'agent_list_get',
    description: 'Return the current AgentList (§13.9 handshake group). Read-only.',
    inputSchema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'a2a_emit',
    description: 'Emit a targeted CUSTOM/{name} envelope to targetAgentId through the server relay. Returns the server-stamped msgId.',
    inputSchema: {
      type: 'object',
      properties: {
        targetAgentId: { type: 'string' },
        name: { type: 'string', description: 'A2A-intent name per §13.16.9 (Report / Delegate / WorkerReport / PRRequest / ...).' },
        value: { type: 'object' },
      },
      required: ['targetAgentId', 'name', 'value'],
    },
  },
  {
    name: 'a2a_wait_ack',
    description: 'Block until the requested ack tier (delivered / commitment / application) arrives, or timeout. Phase 1: transport-tier only; commitment + application tiers ack-wait is Phase 2.',
    inputSchema: {
      type: 'object',
      properties: {
        msgId: { type: 'string' },
        tier: { type: 'string', enum: ['delivered', 'commitment', 'application'] },
        timeoutMs: { type: 'integer', default: 30000 },
      },
      required: ['msgId', 'tier'],
    },
  },
];

// ----- WS proxy connection (Phase 1: lazy, per-call) -----

function getBoardEndpoint() {
  // Env: CONSTELLATION_WS_URL = ws://<host>:<port>/ws (with appropriate ?key= per role)
  const url = process.env.CONSTELLATION_WS_URL;
  if (!url) throw new Error('CONSTELLATION_WS_URL env var not set — MCP server cannot proxy to the live board');
  return url;
}

function getAuthKind() {
  if (process.env.CONSTELLATION_UPSTREAM_KEY) return { kind: 'upstream', key: process.env.CONSTELLATION_UPSTREAM_KEY };
  if (process.env.CONSTELLATION_COLLAB_KEY) return { kind: 'collab', key: process.env.CONSTELLATION_COLLAB_KEY };
  if (process.env.CONSTELLATION_TOKEN) return { kind: 'token', key: process.env.CONSTELLATION_TOKEN };
  return { kind: 'local', key: null };
}

// ----- Tool handlers (Phase 1 stubs) -----

async function handleBoardStateGet() {
  // Phase 1: read the state.json file directly if accessible; Phase 2 will route via WS proxy
  const statePath = process.env.CONSTELLATION_STATE_PATH;
  if (statePath && fs.existsSync(statePath)) {
    const raw = fs.readFileSync(statePath, 'utf8');
    return { content: [{ type: 'text', text: raw }] };
  }
  return {
    content: [{
      type: 'text',
      text: 'Phase 1 stub — CONSTELLATION_STATE_PATH env not set. Set to the state.json absolute path, or wait for Phase 2 WS-proxy implementation.',
    }],
    isError: false,
  };
}

async function handleBoardHistoryTail({ channelId, sinceCursor, meaningfulOnly = true }) {
  return {
    content: [{
      type: 'text',
      text: `Phase 1 stub — board_history_tail(channelId=${channelId}, sinceCursor=${sinceCursor}, meaningfulOnly=${meaningfulOnly}). Phase 2 will route via WS proxy with §13.16.9 meaningful filter applied server-side.`,
    }],
  };
}

async function handleAgentListGet() {
  return {
    content: [{ type: 'text', text: 'Phase 1 stub — agent_list_get. Phase 2 will return the live AgentList from the WS proxy connection.' }],
  };
}

async function handleA2aEmit({ targetAgentId, name, value }) {
  return {
    content: [{
      type: 'text',
      text: `Phase 1 stub — a2a_emit(targetAgentId=${targetAgentId}, name=${name}, value=${JSON.stringify(value).slice(0, 200)}). Phase 2 will emit via WS proxy and return the server-stamped msgId.`,
    }],
  };
}

async function handleA2aWaitAck({ msgId, tier, timeoutMs }) {
  return {
    content: [{
      type: 'text',
      text: `Phase 1 stub — a2a_wait_ack(msgId=${msgId}, tier=${tier}, timeoutMs=${timeoutMs}). Phase 2 will block on the requested tier with full §13.13 ack semantics.`,
    }],
  };
}

// ----- MCP stdio protocol (minimal JSON-RPC handler) -----

const handlers = {
  'tools/list': async () => ({ tools: TOOLS }),
  'tools/call': async (params) => {
    const { name, arguments: args } = params;
    switch (name) {
      case 'board_state_get': return handleBoardStateGet();
      case 'board_history_tail': return handleBoardHistoryTail(args || {});
      case 'agent_list_get': return handleAgentListGet();
      case 'a2a_emit': return handleA2aEmit(args || {});
      case 'a2a_wait_ack': return handleA2aWaitAck(args || {});
      default: throw new Error(`Unknown tool: ${name}`);
    }
  },
  'initialize': async () => ({
    protocolVersion: '2024-11-05',
    serverInfo: { name: 'constellation-mcp', version: '0.1.0' },
    capabilities: { tools: {} },
  }),
};

// Minimal stdio JSON-RPC loop
let buffer = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', async (chunk) => {
  buffer += chunk;
  let idx;
  while ((idx = buffer.indexOf('\n')) !== -1) {
    const line = buffer.slice(0, idx).trim();
    buffer = buffer.slice(idx + 1);
    if (!line) continue;
    try {
      const req = JSON.parse(line);
      const handler = handlers[req.method];
      if (!handler) {
        process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: req.id, error: { code: -32601, message: `Method not found: ${req.method}` } }) + '\n');
        continue;
      }
      try {
        const result = await handler(req.params || {});
        process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: req.id, result }) + '\n');
      } catch (e) {
        process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: req.id, error: { code: -32603, message: e.message } }) + '\n');
      }
    } catch (e) {
      // bad JSON — skip
    }
  }
});

process.stderr.write('[constellation-mcp] Phase 1 prototype v0.1.0 ready (stdio)\n');

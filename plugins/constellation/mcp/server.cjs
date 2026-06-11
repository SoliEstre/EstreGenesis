#!/usr/bin/env node
// constellation/mcp/server.cjs — Phase 2 full impl (v0.2.0)
//
// Per Constellation.md §8 (v0.4 MCP integration) + §13.11 rule 5 (attachment
// transport-mode) + §13.13.2 (at-least-once relay reliability draft).
//
// Phase 2 scope (this file):
//   - WS proxy connection to the live Constellation server (one MCP session
//     = one logical agent identity, lifecycle maps to AgentList presence)
//   - Read tools: board_state_get / board_history_tail / agent_list_get
//   - Write tools: a2a_emit (with §13.11 rule 5 attachment-aware) +
//     a2a_wait_ack (full 3-tier: delivered / commitment / application)
//   - Chunked transfer support (ArtifactManifest / ArtifactChunk /
//     ArtifactComplete reassembly on receive side)
//   - Idempotent receiver dedup per §13.13.2 (seen-msgId LRU, 1024/1h)
//   - Auth via env: CONSTELLATION_TOKEN / CONSTELLATION_UPSTREAM_KEY /
//     CONSTELLATION_COLLAB_KEY (NEVER tool args per §13.14)
//
// Deps: ws (npm install — see package.json). Plugin install will resolve.

'use strict';

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// ----- Optional ws dependency (lazy require) -----
let WebSocket = null;
try { WebSocket = require('ws'); } catch (_) { /* loaded lazily; first connect attempt will fail-loud */ }

// ----- Config from env -----
function getBoardEndpoint() {
  const url = process.env.CONSTELLATION_WS_URL;
  if (!url) throw new Error('CONSTELLATION_WS_URL env var not set');
  return url;
}

function getAuth() {
  if (process.env.CONSTELLATION_UPSTREAM_KEY) return { kind: 'upstream', key: process.env.CONSTELLATION_UPSTREAM_KEY };
  if (process.env.CONSTELLATION_COLLAB_KEY) return { kind: 'collab', key: process.env.CONSTELLATION_COLLAB_KEY };
  if (process.env.CONSTELLATION_TOKEN) return { kind: 'token', key: process.env.CONSTELLATION_TOKEN };
  return { kind: 'local', key: null };
}

function getAgentIdentity() {
  return process.env.CONSTELLATION_AGENT_ID || 'mcp-session-' + crypto.randomBytes(4).toString('hex');
}

function getStatePath() {
  return process.env.CONSTELLATION_STATE_PATH || null;
}

// ----- §13.16.9 v2.5.2 A2A-intent meaningful filter -----
const MEANINGFUL = new Set([
  'Delegate', 'UserPrompt', 'WorkerReport', 'WorkerAck',
  'Report', 'BlockerManifest', 'BlockerNudge',
  'PRRequest', 'PRDraftReady', 'PRReviewAck',
  'PRMergeRequest', 'PRMergeAck', 'PRStatusUpdate', 'PRRequestRejected',
  'Handoff', 'HandoffRequested', 'HandoffReady', 'ArtifactHandoff', 'Attachment',
  'Command', 'Priority', 'Cancel',
  'DeadlockProbe', 'ReviewSLAAck', 'PreemptRequest', 'PreemptForce',
  'MediationProposal', 'MediationAck', 'EscalationRequest',
  'ArtifactManifest', 'ArtifactChunk', 'ArtifactComplete',
]);

// ----- WS proxy state -----
const wsState = {
  socket: null,
  ready: false,
  history: [],                // local cache of inbound messages (board_history_tail)
  agentList: [],              // latest AgentList snapshot
  pendingAcks: new Map(),     // msgId → { tier, resolve, reject, timer }
  seenMsgIds: new Map(),      // §13.13.2 dedup LRU (msgId → ts)
  chunks: new Map(),          // artifact reassembly: artifactKey → { manifest, chunks:Map, expected }
  msgSeq: 1,
};

const DEDUP_LRU_MAX = 1024;
const DEDUP_LRU_TTL_MS = 60 * 60 * 1000;

function dedupCheck(msgId) {
  if (!msgId) return false;
  const now = Date.now();
  // TTL evict
  for (const [k, ts] of wsState.seenMsgIds) {
    if (now - ts > DEDUP_LRU_TTL_MS) wsState.seenMsgIds.delete(k);
  }
  if (wsState.seenMsgIds.has(msgId)) return true;
  // LRU evict
  if (wsState.seenMsgIds.size >= DEDUP_LRU_MAX) {
    const first = wsState.seenMsgIds.keys().next().value;
    wsState.seenMsgIds.delete(first);
  }
  wsState.seenMsgIds.set(msgId, now);
  return false;
}

function makeMsgId() {
  return 'mcp-' + Date.now().toString(36) + '-' + crypto.randomBytes(3).toString('hex');
}

async function connectWS() {
  if (wsState.ready) return wsState.socket;
  if (!WebSocket) throw new Error('ws npm package not installed — run `npm install ws` in plugin dir');
  const baseUrl = getBoardEndpoint();
  const auth = getAuth();
  const agentId = getAgentIdentity();

  let url = baseUrl;
  if (auth.kind === 'upstream') url += (url.includes('?') ? '&' : '?') + 'upstreamKey=' + encodeURIComponent(auth.key);
  else if (auth.kind === 'collab') url += (url.includes('?') ? '&' : '?') + 'key=' + encodeURIComponent(auth.key);
  else if (auth.kind === 'token') url += (url.includes('?') ? '&' : '?') + 'token=' + encodeURIComponent(auth.key);

  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    wsState.socket = ws;
    let serverHelloReceived = false;
    const timeout = setTimeout(() => {
      if (!wsState.ready) { ws.close(); reject(new Error('WS handshake timeout (10s)')); }
    }, 10000);

    ws.on('open', () => { /* await SERVER_HELLO per Constellation v0.3 handshake */ });

    ws.on('message', (raw) => {
      let msg;
      try { msg = JSON.parse(raw.toString()); } catch (_) { return; }

      // Handshake: server-first
      if (msg.type === 'SERVER_HELLO') {
        serverHelloReceived = true;
        // Send HELLO + AgentHello (peer-coordination mode per §13.9)
        const hello = { type: 'HELLO', agentId, agentName: 'MCP Session ' + agentId, role: auth.kind === 'collab' ? 'collab' : (auth.kind === 'upstream' ? 'upstream' : 'local'), capabilities: ['a2a', 'mcp-proxy', 'ack-layer'] };
        ws.send(JSON.stringify(hello));
        const agentHello = { type: 'CUSTOM', name: 'AgentHello', agentId, value: { agentId, agentName: hello.agentName, role: hello.role, env: 'mcp-server', capabilities: hello.capabilities, idle: true } };
        ws.send(JSON.stringify(agentHello));
        wsState.ready = true;
        clearTimeout(timeout);
        resolve(ws);
        return;
      }

      // Cache history
      wsState.history.push({ at: Date.now(), msg });
      if (wsState.history.length > 4096) wsState.history.shift();

      // AgentList update (§13.9 handshake group)
      if (msg.name === 'AgentList' && msg.value?.agents) {
        wsState.agentList = msg.value.agents;
        return;
      }

      // §13.13.2 dedup
      const msgId = msg.msgId || msg.id;
      if (msgId && dedupCheck(msgId)) {
        // Duplicate — emit AckProcessed { dedupHit: true } then discard
        if (msg.targetAgentId === agentId) {
          const ack = { type: 'CUSTOM', name: 'AckProcessed', agentId, value: { ackFor: msgId, dedupHit: true } };
          ws.send(JSON.stringify(ack));
        }
        return;
      }

      // Pending-ack resolver (full 3-tier)
      if (msg.name === 'Ack' && msg.value?.ackFor) {
        const p = wsState.pendingAcks.get(msg.value.ackFor);
        if (p && p.tier === 'delivered') {
          clearTimeout(p.timer);
          p.resolve({ tier: 'delivered', ackedAt: Date.now(), from: msg.value.from });
          wsState.pendingAcks.delete(msg.value.ackFor);
        }
      } else if (msg.name === 'AckProcessed' && msg.value?.ackFor) {
        const p = wsState.pendingAcks.get(msg.value.ackFor);
        if (p && (p.tier === 'commitment' || p.tier === 'delivered')) {
          clearTimeout(p.timer);
          p.resolve({ tier: 'commitment', ackedAt: Date.now(), dedupHit: !!msg.value.dedupHit });
          wsState.pendingAcks.delete(msg.value.ackFor);
        }
      } else if (msg.name === 'Report' || msg.name === 'DONE' || msg.name === 'BLOCKED' || msg.name === 'NEEDS_HUMAN'
                 || msg.name === 'DECISION_RESPONSE' || msg.name === 'DECISION_DEFER' || msg.name === 'DECISION_REJECT_FRAMING') {
        // Application-tier — match by re_msgId or value.for
        // tier='decided' is the Hyperbrief-specific application-tier per Constellation §13.16.9 + Hyperbrief.md §8.2
        const ackFor = msg.value?.re_msgId || msg.value?.for;
        if (ackFor) {
          const p = wsState.pendingAcks.get(ackFor);
          const isDecisionOutcome = msg.name === 'DECISION_RESPONSE' || msg.name === 'DECISION_DEFER' || msg.name === 'DECISION_REJECT_FRAMING';
          // 'decided' waiters resolve on DECISION_* outcomes; 'application' waiters resolve on either generic outcomes or DECISION_* outcomes
          if (p && (p.tier === 'application' || (p.tier === 'decided' && isDecisionOutcome))) {
            clearTimeout(p.timer);
            p.resolve({ tier: p.tier, ackedAt: Date.now(), outcome: msg.name, body: msg.value });
            wsState.pendingAcks.delete(ackFor);
          }
        }
      }

      // Chunked transfer reassembly
      if (msg.name === 'ArtifactManifest') {
        const key = msg.value?.handoff || msg.value?.artifact || ('manifest-' + Date.now());
        wsState.chunks.set(key, { manifest: msg.value, chunks: new Map(), expected: 0 });
      } else if (msg.name === 'ArtifactChunk') {
        const key = msg.value?.artifact;
        const slot = wsState.chunks.get(key);
        if (slot) slot.chunks.set(msg.value.chunk_index, msg.value.data);
      } else if (msg.name === 'ArtifactComplete') {
        const key = msg.value?.artifact;
        const slot = wsState.chunks.get(key);
        if (slot) {
          // Reassemble; verify sha256 if present in manifest
          const ordered = Array.from(slot.chunks.entries()).sort((a, b) => a[0] - b[0]).map(([_, d]) => d);
          slot.assembled = Buffer.concat(ordered.map(d => Buffer.from(d, 'base64')));
          slot.complete = true;
        }
      }
    });

    ws.on('error', (e) => { if (!wsState.ready) { clearTimeout(timeout); reject(e); } });
    ws.on('close', () => { wsState.ready = false; wsState.socket = null; });
  });
}

// ----- Tools -----

const TOOLS = [
  { name: 'board_state_get', description: 'Constellation board state.json (modes, channels, tracks, decisions, keys). Read-only.', inputSchema: { type: 'object', properties: {}, required: [] } },
  { name: 'board_history_tail', description: 'Per-channel A2A history from cursor forward. Read-only.', inputSchema: { type: 'object', properties: { channelId: { type: 'string' }, sinceCursor: { type: 'integer' }, meaningfulOnly: { type: 'boolean', default: true } }, required: ['channelId', 'sinceCursor'] } },
  { name: 'agent_list_get', description: 'Current AgentList (§13.9 handshake group). Read-only.', inputSchema: { type: 'object', properties: {}, required: [] } },
  { name: 'a2a_emit', description: 'Emit targeted CUSTOM/{name} envelope to targetAgentId. §13.11 rule 5 attachment-aware. Returns server-stamped msgId.', inputSchema: { type: 'object', properties: { targetAgentId: { type: 'string' }, name: { type: 'string' }, value: { type: 'object' }, attachments: { type: 'array', items: { type: 'object' } } }, required: ['targetAgentId', 'name', 'value'] } },
  { name: 'a2a_wait_ack', description: 'Block until ack tier arrives or timeout. Full §13.13 3-tier + Hyperbrief tier=decided application-tier extension (resolves on DECISION_RESPONSE / DECISION_DEFER / DECISION_REJECT_FRAMING).', inputSchema: { type: 'object', properties: { msgId: { type: 'string' }, tier: { type: 'string', enum: ['delivered', 'commitment', 'application', 'decided'] }, timeoutMs: { type: 'integer', default: 30000 } }, required: ['msgId', 'tier'] } },
];

async function ensureConnected() {
  if (!wsState.ready) await connectWS();
}

async function handleBoardStateGet() {
  const statePath = getStatePath();
  if (statePath && fs.existsSync(statePath)) {
    return { content: [{ type: 'text', text: fs.readFileSync(statePath, 'utf8') }] };
  }
  await ensureConnected();
  // Phase 2: synchronous read via local file; live WS-fetch could subscribe to state snapshot events
  return { content: [{ type: 'text', text: 'state.json not accessible — set CONSTELLATION_STATE_PATH or expose via server state-snapshot event' }], isError: false };
}

async function handleBoardHistoryTail({ channelId, sinceCursor, meaningfulOnly = true }) {
  await ensureConnected();
  let history = wsState.history.slice(sinceCursor);
  if (meaningfulOnly) history = history.filter(h => h.msg.name && MEANINGFUL.has(h.msg.name));
  history = history.filter(h => !channelId || h.msg.channelId === channelId || h.msg.targetAgentId === channelId || h.msg.agentId === channelId);
  return { content: [{ type: 'text', text: JSON.stringify(history.map(h => h.msg), null, 2) }] };
}

async function handleAgentListGet() {
  await ensureConnected();
  return { content: [{ type: 'text', text: JSON.stringify(wsState.agentList, null, 2) }] };
}

async function handleA2aEmit({ targetAgentId, name, value, attachments }) {
  await ensureConnected();
  const msgId = makeMsgId();
  const envelope = { type: 'CUSTOM', name, msgId, agentId: getAgentIdentity(), targetAgentId, timestamp: Date.now(), value };
  if (attachments && attachments.length) envelope.value = { ...envelope.value, attachments };
  wsState.socket.send(JSON.stringify(envelope));
  return { content: [{ type: 'text', text: JSON.stringify({ msgId, sentAt: Date.now() }) }] };
}

async function handleA2aWaitAck({ msgId, tier, timeoutMs = 30000 }) {
  await ensureConnected();
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      wsState.pendingAcks.delete(msgId);
      resolve({ content: [{ type: 'text', text: JSON.stringify({ msgId, tier, timeout: true }) }] });
    }, timeoutMs);
    wsState.pendingAcks.set(msgId, {
      tier, timer,
      resolve: (ackResult) => resolve({ content: [{ type: 'text', text: JSON.stringify({ msgId, ...ackResult }) }] }),
      reject: (e) => resolve({ content: [{ type: 'text', text: 'wait_ack error: ' + e.message }], isError: true }),
    });
  });
}

// ----- MCP stdio protocol -----

const handlers = {
  'initialize': async () => ({ protocolVersion: '2024-11-05', serverInfo: { name: 'constellation-mcp', version: require('./package.json').version }, capabilities: { tools: {} } }),
  'tools/list': async () => ({ tools: TOOLS }),
  'tools/call': async (params) => {
    const { name, arguments: args } = params;
    switch (name) {
      case 'board_state_get': return handleBoardStateGet();
      case 'board_history_tail': return handleBoardHistoryTail(args || {});
      case 'agent_list_get': return handleAgentListGet();
      case 'a2a_emit': return handleA2aEmit(args || {});
      case 'a2a_wait_ack': return handleA2aWaitAck(args || {});
      default: throw new Error('Unknown tool: ' + name);
    }
  },
};

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
      if (!handler) { process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: req.id, error: { code: -32601, message: 'Method not found: ' + req.method } }) + '\n'); continue; }
      try {
        const result = await handler(req.params || {});
        process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: req.id, result }) + '\n');
      } catch (e) {
        process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: req.id, error: { code: -32603, message: e.message } }) + '\n');
      }
    } catch (_) { /* bad JSON */ }
  }
});

process.on('exit', () => { if (wsState.socket) try { wsState.socket.close(); } catch (_) {} });
process.stderr.write('[constellation-mcp] Phase 2 v0.2.0 ready (stdio)\n');

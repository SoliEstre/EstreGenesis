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
//   - Auth via env: CONSTELLATION_TOKEN / CONSTELLATION_PEER_KEY /
//     CONSTELLATION_UPSTREAM_KEY / CONSTELLATION_COLLAB_KEY (NEVER tool args per §13.14)
//
// Deps: ws (npm install — see package.json). Plugin install will resolve.

'use strict';

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// ----- Optional ws dependency (re-required on demand — see loadWs) -----
// v0.3.32 (adopter-reported C8): a single module-load require whose failure is swallowed made a
// missing-at-boot `ws` permanently missing for the whole session — measured: `npm install ws`
// completed 41s BEFORE the session spawned and the process still reported it absent until /mcp
// re-spawn. The old comment claimed lazy loading that the code never did. Retry at each use.
let WebSocket = null;
function loadWs() {
  if (!WebSocket) { try { WebSocket = require('ws'); } catch (_) { /* still absent — caller reports */ } }
  return WebSocket;
}
loadWs();

// ----- Config from env -----
function getBoardEndpoint() {
  const url = process.env.CONSTELLATION_WS_URL;
  if (!url) throw new Error('CONSTELLATION_WS_URL env var not set');
  return url;
}

function getAuth() {
  if (process.env.CONSTELLATION_PEER_KEY) return { kind: 'peer', key: process.env.CONSTELLATION_PEER_KEY };   // v0.3.31 — §13.16.11: peer key 는 전용 파라미터로 (upstreamKey 편승 금지, adopter 리포트)
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
// v0.3.32 (adopter-reported C11): a peer-main is BY DEFINITION attached to someone else's board, which
// is normally on another host — so a local-file-only state read was permanently unusable in the very
// configuration the peer path exists for. The board already serves the same document over HTTP at
// /api/state on the same origin, so derive it from the WS endpoint instead of demanding a mount.
function getStateHttpUrl() {
  let base;
  try { base = getBoardEndpoint(); } catch (_) { return null; }
  const m = String(base).match(/^(wss?):\/\/([^/?#]+)/i);
  if (!m) return null;
  return (m[1].toLowerCase() === 'wss' ? 'https' : 'http') + '://' + m[2] + '/api/state';
}
function fetchStateOverHttp(url, timeoutMs) {
  return new Promise((resolve, reject) => {
    let mod;
    try { mod = require(url.startsWith('https:') ? 'https' : 'http'); } catch (e) { return reject(e); }
    const req = mod.get(url, (res) => {
      if (res.statusCode !== 200) { res.resume(); return reject(new Error('HTTP ' + res.statusCode)); }
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (d) => { body += d; });
      res.on('end', () => {
        try { JSON.parse(body); } catch (e) { return reject(new Error('non-JSON body: ' + e.message)); }
        resolve(body);
      });
    });
    req.on('error', reject);
    req.setTimeout(timeoutMs || 5000, () => { req.destroy(new Error('timeout after ' + (timeoutMs || 5000) + 'ms')); });
  });
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
  'AgentText',   // §13.13.3 (v2.4.97) — bridge-coalesced utterance; the raw TEXT_MESSAGE_* frames carry no name, so a name-gated filter drops an utterance silently
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
  if (!loadWs()) throw new Error('ws npm package not installed — run `npm install ws` in plugin dir');
  const baseUrl = getBoardEndpoint();
  const auth = getAuth();
  const agentId = getAgentIdentity();

  let url = baseUrl;
  if (auth.kind === 'peer') url += (url.includes('?') ? '&' : '?') + 'peerKey=' + encodeURIComponent(auth.key);
  else if (auth.kind === 'upstream') url += (url.includes('?') ? '&' : '?') + 'upstreamKey=' + encodeURIComponent(auth.key);
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
        const hello = { type: 'HELLO', agentId, agentName: 'MCP Session ' + agentId, role: auth.kind === 'collab' ? 'collab' : (auth.kind === 'upstream' ? 'upstream' : (auth.kind === 'peer' ? 'peer' : 'local')), capabilities: ['a2a', 'mcp-proxy', 'ack-layer'] };
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
  { name: 'board_state_get', description: 'Constellation board state (modes, projects, current/done/planned tracks, decisions). Read-only. Resolves in order: CONSTELLATION_STATE_PATH if set and present → HTTP GET /api/state on the origin derived from CONSTELLATION_WS_URL (works for remote boards, e.g. a peer-main attachment) → isError. A failed read is returned as isError, never as prose in a success body.', inputSchema: { type: 'object', properties: {}, required: [] } },
  { name: 'board_history_tail', description: 'Per-channel A2A history from cursor forward. Read-only.', inputSchema: { type: 'object', properties: { channelId: { type: 'string' }, sinceCursor: { type: 'integer' }, meaningfulOnly: { type: 'boolean', default: true } }, required: ['channelId', 'sinceCursor'] } },
  { name: 'agent_list_get', description: 'Current AgentList (§13.9 handshake group). Read-only.', inputSchema: { type: 'object', properties: {}, required: [] } },
  { name: 'a2a_emit', description: 'Emit targeted CUSTOM/{name} envelope to targetAgentId. §13.11 rule 5 attachment-aware. Returns server-stamped msgId.', inputSchema: { type: 'object', properties: { targetAgentId: { type: 'string' }, name: { type: 'string' }, value: { type: 'object' }, attachments: { type: 'array', items: { type: 'object' } } }, required: ['targetAgentId', 'name', 'value'] } },
  { name: 'a2a_wait_ack', description: 'Block until ack tier arrives or timeout. Full §13.13 3-tier + Hyperbrief tier=decided application-tier extension (resolves on DECISION_RESPONSE / DECISION_DEFER / DECISION_REJECT_FRAMING).', inputSchema: { type: 'object', properties: { msgId: { type: 'string' }, tier: { type: 'string', enum: ['delivered', 'commitment', 'application', 'decided'] }, timeoutMs: { type: 'integer', default: 30000 } }, required: ['msgId', 'tier'] } },
];

async function ensureConnected() {
  if (!wsState.ready) await connectWS();
}

async function handleBoardStateGet() {
  // Resolution order: explicit local path → HTTP /api/state on the board's own origin → error.
  const statePath = getStatePath();
  if (statePath && fs.existsSync(statePath)) {
    return { content: [{ type: 'text', text: fs.readFileSync(statePath, 'utf8') }] };
  }
  const httpUrl = getStateHttpUrl();
  if (httpUrl) {
    try {
      const body = await fetchStateOverHttp(httpUrl, 5000);
      return { content: [{ type: 'text', text: body }] };
    } catch (e) {
      // isError:true is load-bearing: the previous isError:false made a failed read look like a
      // successful read whose CONTENT was an apology — a silent-failure class that is worst inside
      // an autonomous loop, where nothing downstream can tell the two apart.
      return { content: [{ type: 'text', text: `board state unavailable — local path unset/missing and GET ${httpUrl} failed: ${e.message}. If the board's HTTP surface is IP-allowlisted (Constellation §13.25), add this host or set CONSTELLATION_STATE_PATH.` }], isError: true };
    }
  }
  return { content: [{ type: 'text', text: 'board state unavailable — set CONSTELLATION_STATE_PATH, or set CONSTELLATION_WS_URL so the HTTP /api/state origin can be derived from it' }], isError: true };
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

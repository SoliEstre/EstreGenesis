'use strict';

const PROTOCOL_VERSIONS = Object.freeze(['2026-07-28', '2024-11-05']);
const LATEST = PROTOCOL_VERSIONS[0];
const LEGACY = PROTOCOL_VERSIONS[1];

const META_KEYS = Object.freeze({
  protocolVersion: 'io.modelcontextprotocol/protocolVersion',
  clientInfo: 'io.modelcontextprotocol/clientInfo',
  clientCapabilities: 'io.modelcontextprotocol/clientCapabilities',
  serverInfo: 'io.modelcontextprotocol/serverInfo',
});

const UNSUPPORTED_PROTOCOL_VERSION = -32022;

function requestedVersion(params) {
  const meta = params && typeof params === 'object' ? params._meta : null;
  if (!meta || typeof meta !== 'object') return null;
  return Object.prototype.hasOwnProperty.call(meta, META_KEYS.protocolVersion)
    ? meta[META_KEYS.protocolVersion]
    : null;
}

function versionError(requested) {
  return {
    code: UNSUPPORTED_PROTOCOL_VERSION,
    message: 'Unsupported protocol version: ' + requested,
    data: {
      supported: [...PROTOCOL_VERSIONS],
      requested,
    },
  };
}

function complete(result, serverInfo) {
  const source = result && typeof result === 'object' ? result : {};
  const out = { ...source };
  if (!Object.prototype.hasOwnProperty.call(out, 'resultType')) out.resultType = 'complete';
  out._meta = {
    [META_KEYS.serverInfo]: serverInfo,
    ...(source._meta && typeof source._meta === 'object' ? source._meta : {}),
  };
  return out;
}

function discoverResult(serverInfo, capabilities) {
  return complete({
    protocolVersions: [...PROTOCOL_VERSIONS],
    capabilities,
    serverInfo,
  }, serverInfo);
}

function cacheable(result, { ttlMs = 60000, cacheScope = 'public' } = {}) {
  const source = result && typeof result === 'object' ? result : {};
  return { ttlMs, cacheScope, ...source };
}

module.exports = {
  PROTOCOL_VERSIONS,
  LATEST,
  LEGACY,
  META_KEYS,
  UNSUPPORTED_PROTOCOL_VERSION,
  requestedVersion,
  versionError,
  discoverResult,
  complete,
  cacheable,
};

/**
 * ws-core.cjs — deps 0 raw WebSocket (RFC 6455) 코어.
 *
 * 라이브 보드 WS 실시간 채널의 저수준 transport. server.cjs 가 이 위에서
 * HELLO/relay/broadcast 등 고수준 정책을 구현한다. (WS-PROTOCOL.md v0.1)
 *
 * 책임: HTTP upgrade · 핸드셰이크(SHA-1+GUID) · frame parse/write · masking 해제
 *       · heartbeat ping/pong · token validation · WSConn 객체.
 * v0.1 제한: fragmented frame(연속 0x0 across frames) 미지원 — 단일 프레임 메시지 가정.
 *            큰 메시지는 TCP chunk 누적은 처리하나, opcode 0x0 분할 프레임은 미지원.
 */
const crypto = require('crypto');
const GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

function acceptKey(key) {
  return crypto.createHash('sha1').update(key + GUID).digest('base64');
}

// token: env LIVE_BOARD_WS_TOKEN (alias WS_TOKEN). 미설정 = dev no-auth.
function getToken() {
  return process.env.LIVE_BOARD_WS_TOKEN || process.env.WS_TOKEN || '';
}
function validateAuth(req, url) {
  const expected = getToken();
  if (!expected) return { ok: true, dev: true };               // dev 모드 무인증
  const q = url.searchParams.get('token') || '';
  const auth = req.headers['authorization'] || '';
  const bearer = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  return { ok: (q || bearer) === expected, dev: false };
}

// ---- frame codec (RFC 6455 §5) ----
function decodeFrame(buf) {
  if (buf.length < 2) return null;
  const fin = (buf[0] & 0x80) !== 0;                            // FIN 비트 — fragmented(continuation) 판정용
  const opcode = buf[0] & 0x0f;
  const masked = (buf[1] & 0x80) !== 0;
  let len = buf[1] & 0x7f, off = 2;
  if (len === 126) { if (buf.length < 4) return null; len = buf.readUInt16BE(2); off = 4; }
  else if (len === 127) { if (buf.length < 10) return null; len = Number(buf.readBigUInt64BE(2)); off = 10; }
  const maskOff = off;
  if (masked) { if (buf.length < off + 4) return null; off += 4; }
  if (buf.length < off + len) return null;                      // payload 미완 → 더 기다림
  let payload = buf.slice(off, off + len);
  if (masked) {
    const m = buf.slice(maskOff, maskOff + 4);
    const out = Buffer.allocUnsafe(len);
    for (let i = 0; i < len; i++) out[i] = payload[i] ^ m[i & 3];
    payload = out;
  }
  return { fin, opcode, payload, totalLen: off + len };
}
function encodeFrame(payload, opcode) {                          // 서버 송신 = unmasked
  const len = payload.length;
  let header;
  if (len < 126) header = Buffer.from([0x80 | opcode, len]);
  else if (len < 65536) { header = Buffer.alloc(4); header[0] = 0x80 | opcode; header[1] = 126; header.writeUInt16BE(len, 2); }
  else { header = Buffer.alloc(10); header[0] = 0x80 | opcode; header[1] = 127; header.writeBigUInt64BE(BigInt(len), 2); }
  return Buffer.concat([header, payload]);
}

// ---- 연결 객체 ----
class WSConn {
  constructor(socket) {
    this.socket = socket;
    this.buf = Buffer.alloc(0);
    this.alive = true;
    this.id = crypto.randomBytes(6).toString('hex');
    this.meta = {};                                             // server 가 HELLO 후 채움 (agentId 등)
    this.onmessage = null;                                      // (msgObj) => void
    this._frag = null;                                          // fragmented frame chunk 누적 { chunks: [] }
    this.onclose = null;
    socket.on('data', (d) => this._recv(d));
    socket.on('close', () => this._dead());
    socket.on('error', () => this._dead());
    this._hb = setInterval(() => this._frame(Buffer.alloc(0), 0x9), 20000);  // ping
  }
  _dead() { if (!this.alive) return; this.alive = false; clearInterval(this._hb); if (this.onclose) this.onclose(); }
  _recv(chunk) {
    this.buf = Buffer.concat([this.buf, chunk]);
    let f;
    while ((f = decodeFrame(this.buf))) {
      this.buf = this.buf.slice(f.totalLen);
      if (f.opcode === 0x8) { this.close(); return; }           // close
      if (f.opcode === 0x9) { this._frame(f.payload, 0xA); continue; }  // ping → pong
      if (f.opcode === 0xA) continue;                           // pong
      if (f.opcode === 0x1 || f.opcode === 0x2) {               // text/binary 시작 프레임
        if (f.fin) this._deliver(f.payload);                    // 단일 프레임
        else this._frag = { chunks: [f.payload] };              // fragmented 시작(FIN=0) — 큰 첨부 등
      } else if (f.opcode === 0x0 && this._frag) {              // continuation 프레임
        this._frag.chunks.push(f.payload);
        if (f.fin) { const full = Buffer.concat(this._frag.chunks); this._frag = null; this._deliver(full); }  // 마지막 → 조립
      }
    }
  }
  _deliver(payload) {                                           // 단일/조립 완료 payload → JSON 파싱 → onmessage (파싱 실패는 silent — 단일 bad 메시지가 연결 안 죽임)
    let msg; try { msg = JSON.parse(payload.toString('utf8')); } catch { return; }
    if (this.onmessage) this.onmessage(msg);
  }
  send(obj) {                                                   // JSON object/string → text frame
    const s = typeof obj === 'string' ? obj : JSON.stringify(obj);
    return this._frame(Buffer.from(s, 'utf8'), 0x1);
  }
  _frame(payload, opcode) {
    if (!this.alive) return false;
    try { this.socket.write(encodeFrame(payload, opcode)); return true; } catch { return false; }
  }
  close() {
    if (!this.alive) return;
    try { this.socket.write(encodeFrame(Buffer.alloc(0), 0x8)); this.socket.end(); } catch {}
    this._dead();
  }
}

// HTTP upgrade 처리 → 성공 시 WSConn, 실패 시 null
function handleUpgrade(req, socket) {
  if ((req.headers['upgrade'] || '').toLowerCase() !== 'websocket') { socket.destroy(); return null; }
  const key = req.headers['sec-websocket-key'];
  if (!key) { socket.destroy(); return null; }
  const url = new URL(req.url, 'http://localhost');
  const auth = validateAuth(req, url);
  if (!auth.ok) { socket.write('HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n'); socket.destroy(); return null; }
  socket.write(
    'HTTP/1.1 101 Switching Protocols\r\n' +
    'Upgrade: websocket\r\nConnection: Upgrade\r\n' +
    'Sec-WebSocket-Accept: ' + acceptKey(key) + '\r\n\r\n'
  );
  const conn = new WSConn(socket);
  conn.devAuth = auth.dev;
  conn.remoteAddr = String(socket.remoteAddress || '').replace(/^::ffff:/, '');   // 접속자 IP(IPv4-mapped 정리) — 익명 출처 식별용
  conn.ua = req.headers['user-agent'] || '';                                       // 브라우저 UA(non-browser WS 클라는 빈 문자열)
  return conn;
}

// outbound 이벤트 공통 필드 헬퍼 (WS-PROTOCOL §3)
let _seq = 0;
function event(type, fields) {
  return Object.assign(
    { type, id: 'evt_' + crypto.randomBytes(5).toString('hex'), seq: ++_seq, timestamp: Date.now(), source: 'server' },
    fields || {}
  );
}

module.exports = { handleUpgrade, WSConn, event, getToken, acceptKey, encodeFrame, decodeFrame };

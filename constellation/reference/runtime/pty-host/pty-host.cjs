'use strict';
// pty-host.cjs — Pantty §9 터미널 중계 PTY 호스트.
//
// 무엇인가: 운영자가 좌석 세션의 «셸/CLI» 에 들어가 타이핑하고 스트림을 볼 수 있게, 의사터미널
//   (pseudo-terminal)을 띄우고 그 바이트를 보드로 중계해요. 이건 §9 의 **세 번째 문** 이에요 —
//   board 데이터도 board 명령도 아니고, 소비자가 좌석의 «모델» 이 아니라 이 프로세스예요.
//   **relay 프레임은 절대 모델로 라우팅되지 않아요.**
//
// 왜 별도 부품인가 (§9 · §7): PTY 중계는 순수 런타임 코드라 제공업체 native 터미널이 가장 먼저
//   대체할 후보예요. 그래서 오래 남을 건 xterm 이 아니라 §9 계약이고, 구현은 이 폴더에 격리해
//   런타임 코어의 deps-0 를 지켜요 — node-pty 는 오직 여기에만 있어요. 보드 연결은 Node 내장
//   WebSocket(Node ≥22)이라 클라이언트에도 dep 이 안 붙어요.
//
// 생사: 보통 에이전트로 HELLO(agentId='pty-host') 해서 AgentList 로 읽혀요 — 브릿지와 같은 신호라
//   watchdog 이 §6 대로 등재하면 무인 복구가 공짜예요.
//
// 프레임 계약 (§9):
//   운영자→호스트:  PtyOpen{sessionId,cols,rows,shell?,cwd?} · PtyData{sessionId,data}
//                    PtyResize{sessionId,cols,rows} · PtyClose{sessionId}
//   호스트→운영자:  TerminalData{sessionId,data} · TerminalExit{sessionId,code}
//   TerminalData/Exit 는 telemetry 태그 — 모델 wake·응답창 짝짓기에서 빠져요(이건 «답할 메시지» 가
//   아니라 화면에 흐르는 바이트라). 이력 저장 여부는 §9 대로 마스킹-게이트 결정(기본 미저장) —
//   그 서버측 제외 + 라우팅 스코프는 T1b.

const os = require('os');

function loadPty() {
  try { return require('node-pty'); }
  catch (e) { console.error('[pty-host] node-pty 미설치 — 이 폴더(pty-host/)에서 `npm install`'); return null; }
}

// 프레임 핸들링 + PTY 세션 관리. send 를 주입받아 테스트 가능(mock send 로 프레임 단정).
function createHost({ send, pty, id = 'pty-host', defaultShell } = {}) {
  const sessions = new Map();   // sessionId → pty proc
  const SHELL = defaultShell || process.env.PTY_SHELL
    || (process.platform === 'win32' ? 'cmd.exe' : (process.env.SHELL || 'bash'));

  function open(sid, v) {
    if (sessions.has(sid)) return;                       // 재개는 §9 T3 — 지금은 중복 open 무시
    const p = pty.spawn(v.shell || SHELL, [], {
      name: 'xterm-256color',
      cols: Number(v.cols) || 80, rows: Number(v.rows) || 24,
      cwd: v.cwd || os.homedir(), env: process.env,
    });
    sessions.set(sid, p);
    p.onData((d) => send({ type: 'CUSTOM', name: 'TerminalData', telemetry: true, agentId: id, value: { sessionId: sid, data: d } }));
    p.onExit((e) => {
      sessions.delete(sid);
      send({ type: 'CUSTOM', name: 'TerminalExit', telemetry: true, agentId: id, value: { sessionId: sid, code: (e && typeof e.exitCode === 'number') ? e.exitCode : 0 } });
    });
  }

  function handle(msg) {
    if (!msg || msg.type !== 'CUSTOM') return;
    const v = msg.value || {};
    const sid = v.sessionId;
    if (!sid) return;                                    // 세션 스코프 없는 relay 프레임은 버려요
    switch (msg.name) {
      case 'PtyOpen': open(sid, v); break;
      case 'PtyData': { const p = sessions.get(sid); if (p && v.data != null) p.write(String(v.data)); break; }
      case 'PtyResize': { const p = sessions.get(sid); if (p && v.cols && v.rows) { try { p.resize(Number(v.cols), Number(v.rows)); } catch (_) {} } break; }
      case 'PtyClose': { const p = sessions.get(sid); if (p) { try { p.kill(); } catch (_) {} } break; }
    }
  }

  function killAll() { for (const p of sessions.values()) { try { p.kill(); } catch (_) {} } sessions.clear(); }
  return { handle, sessions, killAll };
}

function connect() {
  const pty = loadPty(); if (!pty) process.exit(3);
  if (typeof WebSocket === 'undefined') { console.error('[pty-host] 내장 WebSocket 부재 — Node ≥22 필요'); process.exit(3); }
  const URL = process.env.BOARD_WS_URL || 'ws://127.0.0.1:27878/ws';
  const ID = process.env.PTY_HOST_ID || 'pty-host';
  const ws = new WebSocket(URL);
  const host = createHost({ send: (f) => { try { ws.send(JSON.stringify(f)); } catch (_) {} }, pty, id: ID });
  ws.addEventListener('open', () => {
    ws.send(JSON.stringify({ type: 'HELLO', agentId: ID, role: 'agent', name: 'pty-host', kind: 'local' }));
    console.error('[pty-host] connected ' + URL + ' as ' + ID);
  });
  ws.addEventListener('message', (e) => {
    let m; try { m = JSON.parse(typeof e.data === 'string' ? e.data : String(e.data)); } catch (_) { return; }
    host.handle(m);
  });
  ws.addEventListener('close', () => { host.killAll(); setTimeout(connect, 3000); });   // §6 재연결
  ws.addEventListener('error', () => { try { ws.close(); } catch (_) {} });
}

if (require.main === module) connect();
module.exports = { createHost };

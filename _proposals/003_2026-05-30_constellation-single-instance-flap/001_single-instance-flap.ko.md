# Constellation 단일-인스턴스 flap — 동일 agentId 브릿지 중복

- **컴포넌트**: `constellation/reference/runtime/local-bridge.cjs`(fix 적용), `server.cjs`(제안), 런처+복구문서(제안)
- **발견**: 외생 중단 2회를 겪은 장시간 라이브보드 세션 다운스트림 어댑터
- **Severity**: **high** — 메인 연결 사용 불가, 보드+inbox 폭주
- **A2A 브릿지 계약 영향**: 없음 — lockfile 가드는 프로세스-로컬, 서버 flap-댐핑은 `register(HELLO)`에 가산

---

## Incident

라이브보드(포트 27878)에서 장시간 멀티에이전트 A/B 실험 진행 중, 외생 중단 2회(리밋→사용자 계정 변경, 이어서 IDE 재시작)로 런타임 재기동이 강제됨. 이후 **메인(`main-agent`) 연결이 flap**: 브릿지 로그가 `connected → closed; reconnect 500ms` 무한 반복, 보드 실시간 채널(cap 200)+에이전트 inbox(≈2,580줄)가 `ServerNotice/Status "브릿지 온라인"` 노이즈로 폭주. 보드 사용 불가 — **브라우저 새로고침해도 노이즈 잔존**(채널별 히스토리에 기록돼서, 클라 캐시가 아님).

프로세스 감사 결과 **live `local-bridge.cjs` 12개** + `server.cjs` 다중 인스턴스 발견.

## 근본 원인

reference 런타임에 **단일-인스턴스 보호가 없음** + 3가지 사실이 복합:

1. **선행 인스턴스 교체 없이 재기동.** 중단마다 새 `local-bridge.cjs`(때로 `server.cjs`) launch. 선행 인스턴스를 죽이거나 거부하는 장치가 없음.
2. **IDE 재시작을 견디는 orphan.** 백그라운드 런타임 프로세스는 OS 레벨이라 **IDE 재시작을 생존**하지만 harness 가 task 추적을 잃음 → orphan 이 되어 일반 task API 로는 못 죽이고 OS 레벨 kill 만 가능.
3. **동일 agentId flap.** 동일 `agentId` 브릿지 2+ 이면, 서버 `register(HELLO)`(**새 HELLO마다 해당 agentId 의 선행 conn 종료**) + 각 브릿지 **auto-reconnect(backoff 500ms→8s)** 가 **무한 flap** 생성:

   ```
   브릿지 A HELLO → 서버가 B conn 종료 → B 재연결 → B HELLO → 서버가 A conn 종료 → A 재연결 → A HELLO → …
   ```

   매 사이클이 `ServerNotice{kind:online}`(+ 브릿지 기동 `Status`)를 발화 → 서버가 **채널별 기록**(ring cap 200) + **보드 broadcast**. 보드 실시간 패널 + inbox 폭주, 메인 연결 영구 불안정.

## 재현

```sh
# 서버가 :27878 에서 이미 실행 중
WS_AGENT_ID=main-agent node local-bridge.cjs &   # 브릿지 A
WS_AGENT_ID=main-agent node local-bridge.cjs &   # 브릿지 B (동일 agentId)
# → 양쪽 로그: "connected — HELLO as main-agent" 후 "closed; reconnect in 500 ms" 무한 반복.
# → 에이전트 inbox + 채널 히스토리에 ServerNotice 폭주.
```

---

## Fix 1 — `local-bridge.cjs` 단일-인스턴스 lockfile 가드  ✅ 적용(이번 커밋 흡수)

기동 시 `agentId` 별 PID lockfile 획득; 선행 **생존** 프로세스가 락을 쥐고 있으면 먼저 종료(자가복구) 후 락 획득; 종료 시 해제. stale 락(죽은 PID)은 `process.kill(pid, 0)` 이 존재하지 않는 프로세스에 throw 하므로 자가복구.

```js
// 모듈 const(DIR / AGENT_ID / fs / path) 정의 직후, `let ws = null` 앞에 삽입
const LOCK = path.join(DIR, '.' + String(AGENT_ID).replace(/[^\w.-]/g, '_') + '-bridge.lock');
(function singleInstanceGuard() {
  try {
    if (fs.existsSync(LOCK)) {
      const prev = parseInt(String(fs.readFileSync(LOCK, 'utf8')).trim(), 10);
      if (prev && prev !== process.pid) {
        let alive = false;
        try { process.kill(prev, 0); alive = true; } catch {}   // signal 0 = 존재 확인
        if (alive) {
          console.warn('[bridge][WARN] 동일 agentId(' + AGENT_ID + ') 선행 브릿지 PID ' + prev + ' 생존 — 중복 flap 방지 위해 종료.');
          try { process.kill(prev); } catch {}
        }
      }
    }
    fs.writeFileSync(LOCK, String(process.pid));
  } catch (e) { console.warn('[bridge][WARN] single-instance lock 실패(무시):', String((e && e.message) || e)); }
})();
function releaseLock() { try { if (parseInt(String(fs.readFileSync(LOCK, 'utf8')).trim(), 10) === process.pid) fs.unlinkSync(LOCK); } catch {} }
process.on('exit', releaseLock);
```

- **lockfile 은 반드시 gitignore** (`.\*-bridge.lock`).
- 옵션 정책: 선행 종료 대신 *기동 거부*(명확한 메시지)로 운영자 판단에 맡길 수도. 기본은 자가복구 종료(orphan 케이스 자동 처리).
- 동일 가드 패턴을 `server.cjs`(`PORT` 기준 락)·`watchdog.cjs`·self-wake watcher 에도 적용 권장.

삽입 후 `node --check` PASS.

## Fix 2 — 서버 `register(HELLO)` flap 댐핑  (제안)

현재 서버는 동일 agentId HELLO마다 선행 conn 을 조용히 종료 → flap 을 *부추김*. churn 감지 추가: agentId 별 최근 HELLO 타임스탬프 추적, M초 내 N회+(예: 10초에 5회) 이면 `flap` WARN + 짧은 cooldown / 신규를 `ServerNotice{kind:'flap-rejected'}` 로 거부(기존 incumbent 유지). 중복을 가시화하고, Fix 1 이 없어도 무한 루프 차단.

## Fix 3 — 런처 멱등성  (제안)

`launch-*.ps1` 이 기동 전 **동일 role 선행 인스턴스 교체**(lockfile 확인 / lock PID kill). 운영자가 런처 재실행해도 중복 누적 안 됨.

## Fix 4 — 복구 절차의 재시작-orphan 처리  (제안)

런타임 프로세스가 **IDE 재시작을 orphan 으로 생존**함을 문서화. `stop-all`/`status` 헬퍼 제공(lockfile+포트로 kill; 정밀 `Name=node.exe`+스크립트명 필터 — 광범위한 `*constellation*` 커맨드라인 매치는 셸 래퍼까지 잡아 위험). 복구 흐름은 **재기동 전 선행 인스턴스 종료** 필수.

## Fix 5 — 채널 히스토리 노이즈 정리  (note)

flap 은 채널별 히스토리(ring cap 200) + inbox 를 폭주시킴. 운영자가 오염 채널을 비울 수단 필요: 기존 `CloseChannel{value:{agentId}}`(보드→서버)가 채널 파일+메모리 삭제 + 보드 통지. incident 후 정리 단계로 문서화(어댑터가 오염된 `main-agent` 채널 정리에 사용).

---

## 범위 / 영향
재시작·재기동을 거치는 모든 라이브보드 어댑터는 결국 동일 agentId 브릿지를 중복 쌓아 flap 에 도달. Fix 1(ship)이 가장 흔한 계층에서 차단, Fix 2–4 는 defense-in-depth, Fix 5 는 정리 런북. lockfile 패턴을 `server.cjs`/`watchdog`/watcher 에도 반영하고, reference 런타임에 CI `node --check` 추가 권장.

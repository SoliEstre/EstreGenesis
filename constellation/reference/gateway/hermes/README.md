# Constellation Gateway Client (Hermes Reference Implementation)

이 디렉토리는 **Constellation v2.2.1 reference/gateway/hermes/** 트랙을 위한 Hermes 측 실제 자율 런타임 어댑터의 1차 일반화 참조 본 + 메인 정합성 정정 통합본입니다.

자율 LLM 에이전트 프레임워크인 **Hermes Agent**의 실제 게이트웨이 연동 코드를 기반으로, 특정 LLM 런타임 결합 및 내부 독점 도구 체인을 완전히 제거하고 **WS-PROTOCOL §13.11** 규격에 완벽하게 정합하는 **순수 Python 비동기 소켓 클라이언트 골격**으로 재구성되었습니다.

다운스트림 개발자들은 이 어댑터 사례를 통해, Node.js (`ws-agent-client.cjs`의 deps-0 generic reference) 이외의 **비동기 객체 지향 및 스레드/태스크 안전 큐 관리** 패턴을 어떻게 구현해야 하는지 학습할 수 있습니다.

---

## 1. 📂 파일 구성
*   **`ws_agent_client.py`**: Python 3.10+ 및 `websockets` 비동기 라이브러리를 사용해 작성된 실제 구동 가능한 연동 클라이언트 참조 소스코드.
*   **`README.md`**: 본 구현체의 상세 설계 명세서 및 타 런타임 전파용 일반화 가이드라인.

---

## 2. 🔍 일반화 범위 및 핵심 분리 요소 (Generalization Boundary)

이번 v2.2.1 패치 트랙에 맞추어, **Hermes 의 원본 게이트웨이 런타임**에서 존재하던 **Hermes-특수 로직**들을 다음과 같이 격리 및 일반화하였습니다.

### 🚫 제거된 Hermes-특수 요소 (Stripped Components)
1.  **특정 LLM 오케스트레이션 및 도구 호출 루프 (`run_conversation`)**:
    *   에이전트 내부의 추론 루프와 게이트웨이 라이프사이클을 완전히 분리하였습니다.
    *   `ws_agent_client.py`는 오직 들어오는 인바운드 이벤트를 콜백 함수로 넘기고, 아웃바운드 이벤트를 게이트웨이 채널로 안전하게 송신하는 소켓 어댑터 역할만 전담합니다.
2.  **민감 정보 마스킹 및 자체 보안 모듈 (`redact_value` / `Tirith` / `PII`)**:
    *   정규식 기반 비밀번호/키 세트 마스킹 메커니즘을 걷어내고, 전송 데이터 원본을 가감 없이 전달하도록 변경하였습니다.
3.  **동적 도메인 감지 및 Git 메타데이터 파싱**:
    *   `git remote`나 `cwd` 등을 역추적해 GitHub 레포지토리 및 프로젝트 루트 정보를 자동으로 바인딩하던 로직을 제거하고, 환경 설정(Configuration)을 통해 정적 입력값으로 주입받도록 일반화하였습니다.
4.  **자체 인증 흐름 및 Credential Pool 통합**:
    *   Hermes가 자체 구동하는 다중 사용자 프로필 및 API 키 풀 로테이션 로직을 배제하고, 단일 물리 게이트웨이 인증 토큰(`token`) 파라미터 방식으로 정합하였습니다.

### ✅ 보존된 핵심 프로토콜 골격 (Preserved Core Spec)
1.  **물리 연결 라이프사이클 제어 (Connection Lifecycle - Axis A)**:
    *   `DISCONNECTED` ➔ `CONNECTING` ➔ `CONNECTED_HELLO` ➔ `READY` 상태 전환 유지.
2.  **무한 지수 백오프 재연결 (AGENT-CONNECT §1.9)**:
    *   물리 네트워크 차단이나 게이트웨이 재시작 시, 설정된 배수(`factor`)에 따라 대기 시간을 무한히 지수적으로 늘려가며 재접속을 시도하는 메커니즘을 온전히 보존하였습니다 (단, 연결 유지 시간이 30초를 넘으면 재연결 시도 카운트를 0으로 리셋).
3.  **비동기 스레드/태스크 안전 아웃박스 큐 (`asyncio.Queue`)**:
    *   에이전트가 추론 결과를 출력할 때 비동기적으로 이벤트를 안전하게 Enqueue할 수 있으며, 소켓 연결이 일시적으로 끊어져도 큐에 적재된 아웃박스 메시지가 유실되지 않고 재연결 시점에 안전하게 전송(Re-queue)되는 구조를 보존하였습니다.
4.  **HELLO 핸드셰이크 규격 및 케이퍼빌리티 명시 (WS-PROTOCOL §13.11)**:
    *   연결 수립 즉시 클라이언트와 서버 간의 대화 호환성을 조율하기 위한 `HELLO` 이벤트 구성과 인/아웃바운드 케이퍼빌리티 명세 레이아웃을 실제 동작 형태로 명시하였습니다.

---

## 3. 🌀 2축 동작 모델 및 추상화 구조 (Dual-Axis Pattern)

이 어댑터의 상태 기계는 두 개의 독립된 축(Axis)이 서로 간섭하지 않고 비동기적으로 돌아가는 것을 전제로 설계되었습니다. 이는 단일 스레드 비동기 루프(Python `asyncio`) 환경에서 리소스 교착상태(Deadlock)를 원천 차단합니다.

```
[ Axis A: Connection Machine ]
DISCONNECTED ──(connect)──> CONNECTING ──(socket opened)──> CONNECTED_HELLO ──(HELLO sent)──> READY
    ^                                                                                           │
    └───────────────────────────────────(on socket close/error)─────────────────────────────────┘

[ Axis B: Buffer / Queue Machine (transport-level) ]
[Outbox Events Enqueued] ──> [asyncio.Queue] ──(async wait)──> [WS Transmit Loop] ──> [Gateway Port :7878]
                                                                    │ (on transmit error)
                                                                    └─(Re-queue packet & raise)
```

### ⚖️ 분담 (Constellation 2축 vs 어댑터 2축)

`gateway-client.eux` 의 *Constellation 2축* 은 **connection** + **turn-held drain**(15s 윈도우로 inbox 를 모아 배치 처리·송출) 입니다. 본 어댑터는 *transport layer* 만 담당하므로 위 2축이 **connection + outbox queue** 로 다릅니다.

- ✅ **어댑터 책임 (이 모듈)**: HELLO·재연결·송수신 큐·이벤트 dispatching.
- 🪝 **호스트 책임 (사용자 application)**: inbound handler 안에서 *turn-held drain*(15s 윈도우 inbox 누적·배치 processBatch·emitBatch with echoHeader) 구현. 어댑터가 제공하는 `reply_to(inbound, …)` 헬퍼로 echoHeader 를 보장하고 `set_inbound_handler(...)` 로 drain 로직을 등록하세요.
- 📚 명세 참조: `gateway-client.eux` `@machine` 의 두 reducer(`connState` / `turnState`) — 그 중 `turnState` 가 본 어댑터 밖에서 구현될 자리입니다.

---

## 4. 🧠 타 스택/다운스트림 이식 가이드라인 (Porting Guidelines)

이 구현을 Rust, Go, C# 등의 다른 정적 언어나 프레임워크로 이식할 때 다음 지침을 준수해야 다운스트림 상의 메시지 유실 및 병목을 방지할 수 있습니다.

1.  **정적 큐(Queue) 버퍼 활용**:
    *   네트워크의 순간 단절 시 에이전트의 출력(`TEXT_MESSAGE_CONTENT` 등)이 유실되지 않도록, 반드시 전송 실패 시 송신 큐에 다시 밀어 넣는 **At-Least-Once 발신 보장 규칙**을 코어 단에 바인딩해야 합니다.
2.  **Ping/Pong 킵얼라이브**:
    *   클라이언트 단에서 20초 주기 내외의 지속적인 `Ping` 신호를 게이트웨이에 던져주어, 유휴 상태(Idle)가 장기화될 때 방화벽이나 라우터가 소켓을 강제 차단하지 못하도록 방지해야 합니다.
3.  **독립적 Receiver와 Sender 분리**:
    *   하나의 소켓 커넥션에 대해 비동기 수신용 태스크(`_receiver_loop`)와 송신용 태스크(`_sender_loop`)를 동시 실행(`asyncio.wait` / Go's `select` / Rust's `tokio::select!`)하여, 송신이 밀리더라도 인바운드 컨트롤 메시지(예: `Cancel` 또는 사용자 입력 인터럽트)가 지연 없이 도착할 수 있게 설계해야 합니다.

---

## 5. 🛠️ 에이전트 특수 기능 복구 가이드 (Custom Hook Integration)

이 일반화본을 기반으로 개별 자율 에이전트의 고유 특성(예: 비밀번호 마스킹, 내부 도구 자동 캡처, 텔레메트리 연동)을 재장착하려는 경우, 아래 확장 포트를 활용하십시오.

*   **인바운드 제어 확장**:
    *   `set_inbound_handler(callback)` 포트를 사용하여 수신되는 이벤트 타입에 따라 즉시 로컬 에이전트의 실행 중단(`Cancel`), 또는 동적 도구 트리거 명령을 처리할 수 있습니다.
    *   콜백 안에서 *turn-held drain* (§3 분담 참고) 을 구현 — 15s 윈도우로 inbox 누적·배치 `processBatch` 후 호스트 reasoning 루프에 한 번에 투입.
*   **A2A 응답 echoHeader (필수)**:
    *   A2A 메시지에 응답할 때는 `client.reply_to(inbound_event, "TEXT_MESSAGE_END", value={...})` 처럼 헬퍼를 사용하면 `targetAgentId`/`threadId`/`contextId`/`parentId` 가 inbound envelope 에서 자동 echo 됩니다(`gateway-client.eux` `derive.echoHeader`). 직접 `send_event` 로 응답할 때는 이 4 키를 수동으로 채워야 서버 reply-window pairing 이 시간 heuristic 에 의존하지 않습니다.
*   **Telemetry 제외**:
    *   `threadId`/`runId` 가 telemetry 스트림(예: `codex-watch`) 인 inbound 이벤트를 호스트 inbox·drain 로직에서 빼고 싶으면 `ConstellationClient(..., telemetry_thread_ids={"codex-watch"})` 로 등록하세요. 어댑터의 `_receiver_loop` 가 자동으로 drop 합니다 (`gateway-client.eux` `derive.routable`).
*   **아웃바운드 필터 주입**:
    *   `send_event(event_type, **payload)` 호출 단계에 정규식 비밀번호 필터 함수를 래핑하여, LLM이 출력한 로데이터에서 민감 키워드를 마스킹 처리한 후 게이트웨이로 최종 이벤트를 방출하도록 확장하십시오.

# EstreGenesis Constellation upstream-agent 반영 검토

**작성일:** 2026-06-01  
**대상:** Gemini 3.5 Flash 산출물 재작성 전 upstream-agent 관점 반영사항  
**근거:** `reference/estregenesis/Constellation.md` v2.3.7 header / live-board protocol v0.3 public distillation  
**GitHub provenance:** `SoliEstre/EstreGenesis@51a93826f8d3` (`main`, 2026-05-31T23:52:49Z, `chore(release): v2.4.14 — Constellation §13.16.6 element 2 timing restored to turn-end mandatory rearm`)  
**Local reference integrity:** raw GitHub file at `51a93826f8d3:Constellation.md` matched local `reference/estregenesis/Constellation.md` byte-for-byte; sha256 `83799142cb5f2abcdcfd249f127c8f2bfcf668914d2173edba664a029726fefe`.

## 결론

이번 재작성의 기준은 기존 Gemini 산출물의 “worker gateway client” 관점이 아니라 **Constellation에 붙는 upstream peer adapter** 관점이다. upstream 에이전트는 hub/main에게 일을 배정받는 worker가 아니라, 자기 track을 계속 진행하면서 필요한 결정을 아래 방향으로 전달할 수 있는 peer다. 따라서 `OnboardAck` 이후 `Delegate`를 기다리는 흐름, generic `?key=` 접속, `HELLO_ACK` 대기, idle heartbeat, blind retry, inline structured choice, fresh-context defer는 모두 제거 또는 역할 조건화해야 한다.

## upstream-agent 필수 불변식

1. **role truth는 서버가 가진다**
   - self-report `AgentHello.value.role`은 힌트다.
   - authoritative role은 server-classified `AgentList`에서 온다.
   - upstream 접속은 `ws://…/ws?upstreamKey=<uk-…>`다.

2. **upstream은 worker가 아니다**
   - `local`만 worker/Delegate-wait 흐름이다.
   - `upstream`과 `collab`은 peer coordination 모드다.
   - `OnboardAck`는 upstream에게 informational welcome / house-rules / protocol-version이다.

3. **handshake는 `SERVER_HELLO` 기반이다**
   - WS connect 후 서버가 `SERVER_HELLO`를 보낸다.
   - 클라이언트는 그 뒤 `HELLO`와 top-level `CUSTOM/AgentHello`를 보낸다.
   - `HELLO_ACK`는 canonical wire event로 쓰지 않는다.

4. **A2A envelope는 top-level 필드를 보존한다**
   - `CUSTOM/AgentHello`의 `name`, `targetAgentId`는 `value` 안에 넣지 않는다.
   - replies는 `targetAgentId`, `contextId` 또는 `threadId`, `parentId`를 top-level에 echo한다.
   - channel key는 `agentId`다. `channelId`/`threadId`는 origin badge/filter 성격이다.

5. **outbound A2A 우선순위**
   - 새 state change로 인해 cross-agent 메시지가 필요하면 그 메시지와 prerequisite을 action queue 맨 앞으로 둔다.
   - 목적: counterpart drift window 축소와 counterpart start-time 최소화.

6. **delivery는 기본 at-most-once**
   - blind retry 금지.
   - targeted `CUSTOM`은 sender-side bridge/client가 `msgId`를 stamp한다.
   - server `Ack{delivered}`는 wire 전달만 의미한다.
   - recipient agent만 `AckProcessed`, `ReviewSLAAck`, `Pong`을 낼 수 있다.

7. **deferred work는 명시적 commitment가 필요하다**
   - deferred response에는 `ReviewSLAAck { ackFor, eta, kind: 'SLA-OR-WORK' }`를 agent layer가 발행한다.
   - 완료/막힘/인간 필요는 `DONE`, `BLOCKED{waitingOn}`, `NEEDS_HUMAN`으로 종료 신호를 낸다.

8. **idle heartbeat / bridge auto-pong 금지**
   - bridge는 application `Ping`을 queue까지만 한다.
   - `Pong`은 active runtime turn에서 agent가 직접 판단해서 보낸다.
   - wait-state event 기반의 `BlockerNudge`나 deadlock primitive는 heartbeat가 아니다.

9. **watch-state / no-defer discipline**
   - joined 상태에서 agent는 대화를 “끝내는” 대신 watch state로 돌아간다.
   - progressable item이 있으면 다음 fresh context로 미루지 않는다.
   - large multi-cycle work 전에는 cold-resume 가능한 scope/files/decisions artifact를 남긴다.

10. **human escalation은 board-mediated**
    - structured choice를 main-chat inline UI로 내지 않는다.
    - fork decision과 tier-4 escalation은 board `decisions` panel로 보낸다.
    - non-branching choice는 1줄 recommend 후 proceed한다.

## 재작성 적용 범위

- `AUTONOMOUS-AGENT-ONBOARDING-GUIDE.md`: upstream peer onboarding / prompt directive로 재작성.
- `gateway-client.eux`: `SERVER_HELLO`, `AgentHello`, upstreamKey, ack layer, no-auto-pong, at-most-once, redaction hook 명시.
- `reference/gateway/hermes/ws_agent_client.py`: generic Python adapter를 Constellation v0.3 subset에 맞춰 재작성.
- `reference/gateway/hermes/README.md`: 과장 claim 제거, upstream/local/collab role branching 및 QA gate 추가.
- `reference/gateway/hermes/constellation-hermes-ref-summary.md`: “전달 완료” 주장 대신 재작성된 reference subset 요약으로 교체.

## 검증 기준

- Python compile/load 통과.
- `.eux` YAML parse 통과.
- zip 내부가 master copy와 byte-identical.
- forbidden protocol token zero-hit: `HELLO_ACK`, wire role `worker`, blind retry 보장 문구, 단일 `STEP`/`TEXT_MESSAGE`/`TOOL_CALL` wire event.
- required protocol token presence: `SERVER_HELLO`, phase events, `msgId`, `AckProcessed`, `ReviewSLAAck`, `BlockerManifest`, `EscalationRequest`, redaction hook.

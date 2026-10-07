'use strict';
// exec.cjs — 명령 실행 레인: 롱폴로 받은 «사람 기기가 서명한 명령» 을 검증하고, 통과한 것만 «고정된 실행기» 로 보드에 넣어요.
//
//   createExecutor({cfg, dir, keys, store, getState, syncItems?, selections, inject, notice?, now, audit, log}) → {handle(c) → {status, reason, receipt}, spendRecords() → 서명된 TOTP 사용 기록[], close()}
//
// **신뢰 경계 — 이 파일이 믿는 것과 안 믿는 것.** 중계는 신뢰할 수 없는 운반자예요. 중계가 «준» 것 중 어떤 것도 판정 재료로 안 써요: 자격증명·TOTP 비밀은 «이 보드 로컬»
//   uplink-keys.json 에 사람이 등록한 것만, rpId·origin 은 로컬 uplink.json 만, audience(boardId)·보드 키 지문은 로컬 값만이에요. 중계가 «이런 키가 있다» 며 내미는 자격증명은
//   등록부에 없으니 credential-not-enrolled 로 끝나요(등록은 사람이 보드에서 하는 행위예요).
//
// **파이프라인(번호는 opcmd/webauthn-verify/totp 머리말의 단계 번호와 같아요).**
//   0 멱등성 — 이 cmdHash 의 영수증이 이미 있으면 «그것을 그대로» 다시 내보내고 끝(응답이 사라진 재전달이 «실행됐는데 거절됐다» 로 보이지 않게). 형식을 못 읽으면 bad-format(저장 없음).
//   1~3 형식 · audience(+보드 키 지문) · 시간 — opcmd 의 단계 함수를 그대로 이어요.
//   5  verb 정책(코드 안의 고정 표 — 설정으로 «넓힐» 수 없어요) · 인자 모양(밖의 칸은 bad-args) · 증명 종류별 허용(TOTP 는 낮은 위험의 선택만) · 등록 여부 · 항목 매핑(가명 → 진짜 id) ·
//      맥락 묶음(사람이 본 판 = 지금 판 — 아래 «맥락 묶음»).
//   6~10 증명 — WebAuthn(챌린지 = cmdHash) 또는 TOTP(장부). 읽기 전용 단계예요(TOTP 만 단계를 소비).
//   11 낡은 항목 — 참조한 항목이 «지금» 아직 열려 있는가 · 열려 있으면 맥락 묶음을 «지금» 상태로 한 번 더.
//   (영수증 · 사용 기록 형식은 그대로예요 — cmdHash 가 명령 글자 전체(args 의 rev · contextHash 포함)의 해시라서 «어느 판에 답한 명령인가» 가 이미 영수증의 cmdHash 에 묶여요.)
//   12 커밋 + 실행 — nonce 소비 → signCount 비교-후-교체(둘 다 디스크에 확정) → «그 다음에» 고정 실행기 호출 → 영수증 영속 → 감사 → 결과 회신(전송층).
//
// **nonce 는 «실행 전에» 소비돼요 — 크래시 창이 «이중 실행» 이 아니라 «실행 안 됨» 쪽으로 열려요.** 실행 후에 소비하면 실행기가 던지거나 프로세스가 죽는 순간 «실행됐는데 nonce 가 살아 있는» 창이 생겨서
//   같은 봉투가 재전달되면 한 번 더 실행돼요(사람이 «한 번 눌렀는데 두 번 적용»). 반대 방향의 대가(소비 후 실행 전에 죽으면 명령이 안 일어남 — at-most-once)는 사람이 새 명령을 내면 풀려요.
//
// **TOTP 와 nonce 의 정확한 순서 — ledger.has(검사만) → TOTP 검증(단계 소비) → … → consumeNonce.** TotpStore.verify 는 성공하면 그 시간 단계를 «소비» 해요. 이미 소비된 nonce 의 봉투가
//   TOTP 검증을 먼저 통과해 버리면(재전달·중계의 재주입) «새 코드의 단계» 가 아무 일도 안 한 명령에 타 버려요 — 그래서 검증 «전에» 원장을 읽기만 하는 has() 로 걸러요(상태 변화 없음).
//   consume 은 증명 «뒤에» 해요(거절된 명령이 nonce 를 태우면 공격자가 정당한 명령의 nonce 를 미리 소모시켜요 — opcmd 머리말). TOTP 가 ok 를 낸 뒤 consume 이 일시 장애로 실패하면 그 단계는 탄 채예요
//   (TotpStore 의 계약 — «다음 코드를 쓰세요»).
//
// **TOTP 는 명령에 묶이지 않아요 — 그래서 «바꿔치기된 명령이 할 수 있는 일» 로 verb 를 제한하고, 일어났으면 알아채요.** 중계가 운영자의 «새» 코드를 보고 같은 코드를 «자기가 고른 명령»(다른 선택 · 새 nonce)에 붙여
//   보드에 먼저 내밀면 보드는 그걸 받아요. 한 번 쓰는 코드(totp.cjs 의 단조 규칙)도 이걸 못 막아요 — 공격자도 코드를 «한 번» 쓰고, 막히는 건 그 뒤에 도착한 «운영자의 진짜 명령» 이에요(totp-replayed). 막을 수 없으니 «피해 반경을 좁히고 + 알아채요».
//   verb 별로, 코드를 가로챈 쪽이 바꿔치기한 명령으로 할 수 있는 일:
//     decision.answer    보기 중 «아무거나» 를 운영자 도장으로 고를 수 있어요(자유 서술은 TOTP 로 못 열고 보기 밖은 bad-args 라 «보기 안» 으로 한정). 그 선택이 되돌릴 수 없는 일을 부르면 피해가 커요 →
//                        결정이 **reversibility === 'two_way' 를 스스로 선언한 경우에만** TOTP 로 열어요(선언이 없거나 어휘 밖이면 one_way — 안전하게 틀려요). 선언은 결정을 쓰는 쪽(메인)이 해요: 그 선택이 되돌려지는지는
//                        그쪽이 알아요. 판정은 증명 «전» 의 현재 상태로 하고(비최종 거절 — TOTP 단계를 안 태워서 같은 명령을 passkey 로 다시 낼 수 있어요), 커밋 직전에 상태를 «다시 읽어» 한 번 더 봐요(그 사이 메인이 값을 바꿨을 수 있어요).
//     decision.defer     «보류» 는 그 자체로 되돌릴 수 있어요(결정은 열린 채 남아요). 얻는 건 지연뿐이라 TOTP 유지.
//     selection.answer   보기는 «프롬프트가 낸 것» 이라 보기 밖은 못 골라요(보기 없는 프롬프트는 거절). 선택지 프롬프트 자체가 «질문하는 쪽이 감수한 선택지» 라 TOTP 유지.
//     hyperbrief.respond 서술이 없는 defer 만 TOTP — 위와 같은 이유로 보류뿐이에요.
//   **탐지 (서버 쪽) — «고치지 않고 전달된» 경우만 덮어요.** TOTP 단계가 이미 소비돼서 거절되는데(totp-replayed) 장부가 «그 단계는 다른 cmdHash 가 썼다» 고 하면, 사유를 totp-step-used-by-other-command 로 바꿔 거절하고
//   (최종 아님 — 새 코드나 passkey 로는 같은 명령이 통과할 수 있고, retryableUntil 로 폰이 재시도를 권해요) 감사 줄(kind totp-substitution-suspected · 두 cmdHash 앞 8자 · 횟수 · 인자 본문 없음)과 서버 알림 한 장을 내요.
//   증명 단계에 «닿기 전에» 정책으로 거절되는 명령(결정이 사라짐 · 알 수 없는 항목 · 값이 나쁜 인자 · 선언이 없는 결정)도 거절 직전에 같은 장부를 «읽기만» 해서(TotpStore.spentBy — 아무것도 소비하지도 세지도 않아요) 같은 경보를 내요
//   (사유는 그대로 — 폰엔 정책 거절로 보이고 경보는 따로 가요). 알림은 «운영자 목소리가 아니에요»: 서버 이름의 notice 프레임이고 via/operator 도장이 없어요 — 운영자 실행기(INJECTORS)와 «별개» 의 얼린 객체(NOTICERS)로만 나가요.
//   같은 cmdHash 가 같은 단계를 또 내민 진짜 재전달이면 알리지 않아요(기존 totp-replayed 그대로). 알림은 «코드를 먼저 쓴 명령 하나당 한 장» 이고(그 명령이 «무엇에 · 어떤 결과로» 썼는지를 기억에서 가져와 말해요 — 먼저 쓴 쪽이 실행되지
//   않았으면 그 결과(stale-item 등)를 그대로 말하고 «실행됐다» 고 하지 않아요), 감사의 경보 줄은 같은 대치당 자릿수마다(1 · 10 · 100 번째 거절) 한 줄이에요(일반 거절 줄은 건마다 그대로). 중계가 «같은 코드 + 새 nonce» 를 쏟아내도
//   서버 알림은 한 장이고 감사 표는 경보로 채워지지 않아요. 항목 id 는 식별자 글자 집합(ID_RE)을 통과한 것만 실려요 — 선택지 프롬프트 id 는 에이전트가 고른 자유 서술이라 그대로 실으면 서버 권위 경보에 에이전트의 문장이 들어가요.
//   **보드는 «어느 쪽이 운영자의 명령인지» 를 몰라요** — 먼저 쓴 쪽과 나중에 온 쪽을 나란히 말하고 판정하지 않아요(운영자 자신의 정당한 명령 뒤에 중계가 같은 코드로 쓰레기 명령을 붙여도 같은 모양이라, 알림은 «의심» 이고
//   중계가 정당한 사용 뒤에도 거짓 경보를 만들 수는 있어요 — 거짓 경보는 싸고 놓친 대치는 비싸서 이쪽으로 틀려요). 막는 길은 여전히 passkey(명령 해시에 묶임)예요.
//   **정직한 한계 — 서버 쪽 탐지는 중계가 «운영자의 진짜 명령을 고치지 않고 그대로» 전달할 때만 불려요.** 중계가 운영자의 명령을 코드 한 자리만 고쳐서(totp-invalid) 전달하거나, 증명을 떼어서(bad-proof) 전달하거나, 아예 전달하지 않으면
//   보드는 대치를 «볼 일» 이 없고 경보도 안 나요(폰엔 그럴듯한 «틀린 코드» 거절이거나 아무 응답이 없어요). 그래서 «경보가 안 왔다» 는 «안전하다» 가 아니에요.
//   **폰이 확인하는 길 — 서명된 TOTP 사용 기록(spendRecords).** 보드는 «코드의 단계를 처음 쓴 명령» 마다 {boardId, kind:'totp-spend', step, cmdHash(전체), verb, itemId(가명), outcome, codeTag, at, ver} 를 보드 키로 서명해서 `/v1/uplink/results` 회신에
//   `spends`(최근 8건)로 «모든» 회신에 실어요(그리고 전송층이 결과가 없는 때에도 `spends` 배치 항목으로 실어요 — uplink.cjs «사용 기록 전달»). codeTag = sha256('eg-totp-spend/v1\n' + boardId + '\n' + step + '\n' + code) 앞 16자라서, 코드의 비밀(시드)을 모르는 폰도 «내가 방금 친 코드 + 시계 ±1 단계» 로 자기 기록을 찾아요.
//   폰의 규칙: 코드를 쳐서 낸 뒤 ① 자기 영수증이 «수락» 이면 끝 ② 아니면(totp-invalid · 거절 · 응답 없음) 자기 코드의 codeTag 를 가진 기록을 찾아 cmdHash 가 «내 명령의 해시» 와 다르면 대치가 «증명된 것» 이에요(보드 서명이라 중계가
//   만들 수 없어요) ③ 기록이 없으면 «확인 안 됨» — 중계가 기록을 «빼는» 것은 막을 수 없지만 «고치는» 것은 못 하고, 방금 친 코드 뒤의 틀린 코드·무응답은 의심으로 다뤄야 해요. 기록은 이 프로세스의 기억이라 재시작하면 비어요(그때는 ③).
//   **ver — 기록마다 단조 «판» 번호 (v2.4.178).** 같은 (step, cmdHash) 기록은 «결과(outcome)» 가 바뀌면 보드가 다시 서명해요(no-receipt → 최종 결과 — 예: 비최종으로 거절됐던 TOTP 명령이 같은 봉투의 passkey 재시도로 수락됨).
//   서명된 옛 기록(ver 1, 'no-receipt')을 중계가 나중에 «다시 내밀면» 서명이 멀쩡해서 현재 기록과 구분이 안 됐어요 — 그래서 ver(1 부터, 다시 서명할 때마다 +1)가 «서명 바이트 안» 에 들어가요. 받는 쪽은 같은 (보드, step, cmdHash) 에서
//   «더 큰 ver» 만 받아들여요(같은 ver 인데 내용이 다르면 변조). (step, cmdHash) 는 재시작을 건너서도 겹치지 않아요 — 쓴 단계는 TOTP 장부(디스크)에 남아 같은 명령이 같은 단계를 다시 «처음으로» 쓸 수 없으니, 재시작 뒤 ver 가 1 로
//   돌아가도 옛 프로세스의 같은 (step, cmdHash) 기록과 충돌하지 않아요. **결과는 한 방향이에요: no-receipt → 최종(수락 · 거절 사유)** — 영수증 장부가 상한을 넘어 정리돼 최종 결과를 서명한 기록의 영수증이 사라져도
//   «다시 no-receipt 로, 더 큰 ver» 를 서명하지 않아요(받는 쪽의 «가장 큰 ver» 규칙이 최종 결과를 되돌리게 되니까요). 한 번 최종이 된 결과는 이 프로세스가 사는 동안 그 값 그대로 고정이에요.
//   **itemId — 항목 스냅샷(items.cjs)의 itemId 와 «같은 낱말» (v2.4.178).** 결정류 동사(decision.answer · decision.defer · hyperbrief.respond)의 기록은 명령이 어느 접두(sd: · h:)로 지목했든 언제나 'sd:<tag>' —
//   스냅샷의 itemId 이고, 하이퍼브리프의 결정 요청 프레임이 싣는 'h:<tag>' 와 «같은 결정» 의 같은 tag 라서 가능해요(tag = 결정 id 의 키 있는 HMAC). 선택지 답(selection.answer)의 기록은 'h:<tag>'(스냅샷에 없는 항목 — 선택지 프롬프트 프레임의
//   meta.promptId 와 같은 낱말이라 중계가 봉투 스트림으로 이어요). 항목이 없는 동사(prompt.send)는 ''.
//   **짝짓기 규칙 (한 이름 공간 주의).** 'h:<tag>' 는 «하나의 이름 공간» 이에요 — 선택지 프롬프트 id(promptId) · 하이퍼브리프 decision_id · 메시지 id 가 같은 글자면 같은 tag 가 나와요(tagOf 의 도메인이 하나). 그래서 받는 쪽은
//   **사용 기록의 'h:' itemId 를 «verb 가 selection.answer 일 때만», 그리고 SelectionPrompt/SelectionResolved 의 meta.promptId 에만 짝지어요.** 결정류 기록(decision.answer · decision.defer · hyperbrief.respond)은 «언제나 sd:» 라서
//   'h:' 가 결정 요청 프레임(DECISION_REQUEST)에 짝지어질 일이 없어요(적대적 에이전트가 결정 id 와 같은 글자의 promptId 를 내도 코드 사용 기록이 그 결정에 붙지 않아요). 이름 공간을 갈라 가명을 바꾸는 길은 상관관계를 깨뜨려서(호환 깨짐) 안 했어요.

// **낡은 항목 판정의 자리 — 증명 «뒤», 커밋 «안»(소비하고 거절).** 참조 항목이 이미 닫혔으면 실행하지 않되 nonce 와 signCount 는 «소비해요»: 해소된 결정은 닫힌 채 남지만 같은 id 가 «다시 열리면»
//   (같은 가명 itemId) 아직 시간 창 안의 옛 서명이 새 질문에 적용될 수 있고, 소비하지 않으면 재전달이 그때마다 같은 판정을 반복하며 창이 열려 있어요. 소비하면 영수증(stale-item)이 남아 재전달도
//   같은 답을 해요. 증명 «전» 에는 하지 않아요 — 증명 없는 입력(중계)이 nonce 를 태우지 못하게요. 항목이 «아예 흔적 없음» 인 unknown-item 은 증명 전에 거절해요(상태 변화가 없고 영영 못 하는 명령이 TOTP 단계를 태우지 않게).
//
// **맥락 묶음 (v2.4.179) — 답이 «사람이 본 판» 을 말하고, 보드는 그 판이 «지금 판» 일 때만 받아요.** 항목 기록 서명(items.cjs, v2.4.178)으로 기기는 «진짜 판» 을 알아볼 수 있게 됐지만,
//   새 판을 «못 본» 기기는 옛 판(서명이 멀쩡해요)과 지금 판을 가를 수 없고 중계는 옛 판을 다시 내밀 수 있었어요. 답 명령도 {itemId, choice|text|accept} 뿐이라 보드는 사람이 «어느 판의 맥락» 에 답했는지 몰랐어요.
//   그래서 맥락에 기대는 동사는 인자에 판을 실어요(서명된 명령 안 — cmdHash 가 덮어요):
//     rev          필수 · 음이 아닌 안전 정수 = 사람이 본 «서명된 항목 기록» 의 rev(스냅샷 칸의 rev — 서명 대상이라 중계가 못 고쳐요).
//     contextHash  64자 소문자 hex = 기기가 연 봉투의 seal.contextHash(sig 포함 봉투 전체의 정준 바이트 SHA-256). **그 판에 보드가 봉인한 맥락이 있을 때(visibility=sealed)만 필수, 그 밖엔 금지** —
//                  envelope 모드(맥락이 아예 안 나가요)나 봉인을 못 한 판에 해시가 실려 오면 «없는 것에 묶인» 명령이라 bad-args 예요. 모양이 틀린 값은 스키마 bad-args(최종),
//                  있어야 하는데 없음/없어야 하는데 있음은 «그 판의 상태가 정하는» bad-args(비최종 — 항목 값의 bad-args 와 같은 부류)예요.
//   보드의 비교 대상 = 이 보드가 내보낸 항목 기록(store.state.items — rev · 봉투째 상태 파일에 영속, 재시작을 건너요). 판이 다르거나(옛 판 · 미래 판) 해시가 다르거나(옛 봉투 · 지어낸 봉투 · 수신자를 뺀 봉투)
//   열린 결정인데 기록이 없으면 **stale-context** — 최종이 아니에요: 사람은 새 판을 읽고 «새 명령» 으로 다시 답하면 돼요. 닫혔거나 흔적이 없는 항목은 기존 사유(stale-item · unknown-item) 그대로예요.
//   판정 텍스트와 판의 어긋남 — 상태 파일 감시(폴링)가 돌기 전엔 «판정에 쓰는 상태 텍스트» 가 «항목 기록» 보다 앞서 있을 수 있어서, 상태를 읽을 때마다 syncItems(텍스트)로 항목 기록을 같은 텍스트에 맞춘 뒤 비교해요.
//   **TOTP 단계와의 순서.** 묶음 검사는 «증명 전»(5단계 — TOTP 검증이 단계를 소비하기 전)에 해요: 도착할 때 이미 낡은 명령은 단계도 nonce 도 안 태우고 거절돼서, 같은 코드를 새 판의 명령에 그대로 쓸 수 있어요.
//   그리고 커밋 직전(11단계)에 «지금» 상태로 한 번 더 봐요 — TOTP 는 검증(fsync)을 낀 사이 상태를 진짜로 다시 읽고, 그 읽기가 항목을 다시 봉인했으면(새 판) 여기서 거절돼요.
//   이 두 번째 거절은 단계가 «이미 탄» 뒤예요(되돌릴 수 없는 소비가 검증 안에 있어서 피할 자리가 없어요 — two_way 재확인과 같은 대가) · nonce 는 안 태워요 · 비최종.
//   되돌림 선언(reversibility)도 판의 일부라(items.cjs 의 내용 해시) 동기가 붙은 배선에선 검증 사이의 two_way → one_way 변경이 «새 판» 이 되어 이 재확인이 stale-context 로 먼저 거절해요 —
//   two_way 재확인(proof-too-weak)은 그 뒤의 두 번째 층으로 남아요(동기가 없거나 늦은 배선에서 그 자리를 지켜요). 둘 다 비최종이고 nonce 를 안 태워요.
//   판의 근거는 «디스크에 있는» 항목 기록뿐이에요 — 기록 저장이 실패한 동기는 기록을 되돌리고 던져서(items.cjs) syncItems 가 실패하고, 그동안 명령은 state-unavailable(일시 장애 · 비최종)이에요.
//   **동사별 판정.**
//     decision.answer    묶어요 — 고른 보기·추천 수락의 «뜻» 이 판의 맥락(질문 · 보기 · 추천)에 달려 있어요.
//     hyperbrief.respond 묶어요 — 가지(accept · reject_framing · request_investigation)가 브리프 맥락에 답하는 것이고, defer 가지도 «한 동사 한 모양» 을 지키려고 같은 칸을 요구해요(가지마다 칸 집합이 달라지면 클라이언트가 추측해요).
//     decision.defer     안 묶어요 — 보류는 맥락과 무관하게 «아직 안 정함» 이고 결정은 열린 채 남아요(얻는 건 지연뿐 — 위 «바꿔치기» 표와 같은 이유).
//     selection.answer   안 묶어요(남은 한계) — 'h:' id 는 프롬프트의 «신원» 만 묶고 내용(질문 글 · 보기)은 안 묶어요. 선택지 프롬프트는 서명된 항목 기록이 없는 «봉투 스트림» 항목이라(스냅샷 밖)
//                        기기가 얻을 «서명된 판» 이 없어요. 보기 밖 라벨은 «지금» 프롬프트의 보기로 거절되고(bad-args) 다른 발급자의 덮어쓰기는 issuer-conflict 지만, 같은 발급자가 같은 id 로 같은 라벨을 다른 질문에 다시 내면 구분이 안 돼요.
//                        묶으려면 보드가 선택지 프롬프트 기록에도 서명해야 해요(이 판에서는 안 했어요).
//
// **영수증은 «소비된 명령» 의 결과만 저장해요(exec-state.cjs).** 소비 전 거절(일시 장애 포함)은 저장하지 않고 같은 봉투의 재시도를 열어 둬요. 서명은 모든 거절에도 붙어서 폰이 «보드가 거절했다: <사유>» 를 보여줄 수 있어요.
//   **서명된 거절은 «최종인지» 를 스스로 말해요 — `final`(서명 대상 칸).** 소비 전 거절은 중계가 «고친 증명으로 같은 명령을 다시 내밀 수» 있어서(틀린 서명 → 올바른 서명) 서명된 «거절» 과 서명된 «수락» 이 같은 cmdHash 로 공존할 수 있어요.
//   폰이 서명된 거절을 «끝난 일» 로 믿으면 중계는 «거절됐다» 를 보여 주고 나중에 실행할 수 있고(exp+60초까지), 사람이 다시 내리면 이중 실행이에요. 그래서:
//     final:true  = 이 cmdHash 는 «영원히» 이 결과예요(수락 · 소비된 뒤의 거절 · 명령 «글자만으로» 정해지는 거절 — 증명을 바꿔도 못 뒤집어요). retryableUntil:null.
//     final:false = 아직 실행될 수 있어요. retryableUntil(초, = exp+60 — 시간 검사가 받아들이는 마지막 초)까지는 같은 명령이 수락될 수 있고, 그 뒤엔 어떤 증명으로도 못 해요. 폰은 «아직 실행 안 됨 — <시각>까지 실행될 수도 있음» 으로 보여야 해요.
//   최종인 사유(FINAL_REASONS): aud-mismatch · board-key-mismatch · ttl-too-long · expired · verb-not-allowed · 스키마 bad-args · bad-acct + 소비 뒤 결과(accepted · stale-item · execution-failed · commit-failed · counter-regression).
//   최종이 «아닌» 사유: 증명이 정하는 것(bad-signature · totp-invalid · proof-too-weak · credential-not-enrolled · bad-proof …) · 시각이 정하는 것(not-yet-valid) · 상태가 정하는 것(unknown-item · 항목 값의 bad-args · issuer-conflict · stale-context · 판이 정하는 contextHash 유무의 bad-args) · 일시 장애(*-unavailable) · nonce-replayed.
//   nonce-replayed 가 «최종이 아닌» 이유: 그 nonce 를 «이 명령 자신» 이 이미 소비했을 수도 있어요(영수증 장부 쓰기가 실패했거나 장부를 잃은 뒤의 재전달) — 그때 최종 거절을 서명하면 같은 cmdHash 에 수락 영수증과 final:true 거절이 공존해요.
//   소비 전의 «글자만으로 정해지는» 최종 거절도 장부엔 저장하지 않아요(선택): 저장하면 중계가 «글자만 다른 명령» 을 쏟아내 디스크 쓰기(fsync)를 건당 일으켜요. 대신 같은 봉투를 다시 받으면 «같은 사유의 새 서명(시각만 다름)» 이 나가고 final:true 라 폰에겐 같은 결론이에요.
//
// **실행기는 «고정» 이에요.** inject 는 verb 마다 하나씩, 열쇠 집합이 정확히 INJECTORS 와 같아야만 받아요 — 프레임 하나를 통째로 받는 범용 hook 은 없어요(있으면 이 레인이 «아무 프레임이나 운영자 이름으로 내는» 통로가 돼요).
//   각 실행기는 «검증된 칸만» 받아요(이 파일이 칸별로 새 객체를 지어 넘겨요). 서버 쪽 구현도 칸별로 프레임을 지어요.
//   알림 함수(notice)는 운영자 실행기가 «아니에요» — 별도의 얼린 객체(열쇠 집합이 정확히 NOTICERS)이고, 운영자 도장을 달 수 없는 서버 이름의 프레임만 지어요. 그래서 위 «정확히 5개» 는 그대로예요. notice 를 «주었는데» 규격이 아니면 같은 이유로 전부 거절해요.
//
// 이 파일의 파이프라인은 6단계부터 커밋까지 «동기» 예요(await 없음) — 같은 프로세스 안에서 두 명령이 끼어들 수 없어서 그 구간이 그대로 임계구역이에요. 프로세스 사이는 파일 잠금이 지켜요(nonce 원장 · TOTP 상태 · uplink-exec.lock).

const path = require('path');
const crypto = require('crypto');
const OP = require('./opcmd.cjs');
const WA = require('./webauthn-verify.cjs');
const TOTP = require('./totp.cjs');
const SEAL = require('./seal.cjs');
const { tagOf, reversibilityOf } = require('./project.cjs');
const { ExecState } = require('./exec-state.cjs');
const KS = require('./keyset.cjs');

const MAX_CMD_TEXT = 20000;
const SKEW = OP.SKEW_SEC;
// 계정 표기 — 영수증·감사·운영자 도장에 들어가는 «사람이 읽는 이름» 이라 글자 집합을 좁게 못 박아요(줄바꿈·공백이 든 문장을 «운영자» 칸에 실을 수 없게).
const ACCT_RE = /^[A-Za-z0-9._@:-]{1,128}$/;
// 최종인 «소비 전» 거절 사유(머리말) — 스키마 bad-args 는 호출 자리에서 따로 final 로 불러요(항목 값의 bad-args 는 상태에 달려서 최종이 아니에요).
const FINAL_REASONS = new Set(['aud-mismatch', 'board-key-mismatch', 'ttl-too-long', 'expired', 'verb-not-allowed', 'bad-acct']);
const MAX_TEXT = 8000;
const MAX_NOTE = 4000;
const MAX_LABEL = 500;
const MAX_SELECTED = 32;
const TAG_RE = /^[0-9a-f]{24}$/;
const HEX64_RE = /^[0-9a-f]{64}$/;
const ID_RE = /^[A-Za-z0-9._:@-]{1,64}$/;
const BRANCHES = Object.freeze(['accept', 'defer', 'reject_framing', 'request_investigation']);
// 실행기 열쇠 집합 — 서버가 넘기는 inject 의 열쇠는 «정확히» 이거여야 해요(모자라도 남아도 거절).
const INJECTORS = Object.freeze(['decisionDefer', 'hyperbriefRespond', 'operatorDecision', 'selectionAnswer', 'userPrompt']);
// 알림 함수 열쇠 집합 — 운영자 실행기와 «별개» 예요(머리말). 주어졌다면 정확히 이것이어야 받아요.
const NOTICERS = Object.freeze(['totpSubstitutionSuspected']);
const MAX_NOTICED = 64;            // 알림을 낸 «대치된 명령» 기억 상한 — 오래된 것부터 잊어요
const MAX_SPENDS = 32;             // TOTP 단계 사용 기록(누가 · 무엇에 썼나) 기억 상한 — 코드 창이 30초라 이만큼이면 한참 지난 것까지 덮어요
const MAX_SPEND_REPORT = 8;        // 결과 회신에 실어 폰이 확인하게 하는 서명된 사용 기록의 최대 개수(가장 최근 것부터)

const hasOwn = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
const isPlain = (v) => v !== null && typeof v === 'object' && !Array.isArray(v) && (Object.getPrototypeOf(v) === Object.prototype || Object.getPrototypeOf(v) === null);

class Reject extends Error {
  constructor(code) { super(code); this.code = code; }
}
const no = (code) => new Reject(code);

// ── 인자 모양 ─────────────────────────────────────────────────────────────────────────────────────────────
// 칸 집합이 «정확히» 맞아야 해요(밖의 칸은 bad-args) — 읽지 않는 칸이 통과한다는 건 «서명된 칸 중 일부만 실행에 쓰인다» 는 뜻이라서요.
function shape(args, req, opt) {
  if (!isPlain(args)) throw no('bad-args');
  for (const k of Object.keys(args)) if (!req.includes(k) && !opt.includes(k)) throw no('bad-args');
  for (const k of req) if (!hasOwn(args, k)) throw no('bad-args');
}
const strIn = (v, min, max) => typeof v === 'string' && v.length >= min && v.length <= max;

// 각 스키마는 «새 객체» 와 weak(자유 서술을 담았나 — TOTP 로는 못 하는 것)를 돌려줘요.
// 맥락 묶음 칸(v2.4.179 — 머리말 «맥락 묶음») — rev 는 필수, contextHash 는 «글자 모양» 만 여기서 봐요(있어야 하는지 · 없어야 하는지는 그 판의 상태가 정해요 — _checkContext).
function bindingOf(a) {
  if (!Number.isSafeInteger(a.rev) || a.rev < 0) throw no('bad-args');
  if (hasOwn(a, 'contextHash') && (typeof a.contextHash !== 'string' || !HEX64_RE.test(a.contextHash))) throw no('bad-args');
  return { rev: a.rev, contextHash: hasOwn(a, 'contextHash') ? a.contextHash : null };
}
function schemaDecisionAnswer(a) {
  shape(a, ['itemId', 'rev'], ['choice', 'text', 'accept', 'contextHash']);
  if (typeof a.itemId !== 'string' || !/^sd:[0-9a-f]{24}$/.test(a.itemId)) throw no('bad-args');
  const bind = bindingOf(a);
  if (hasOwn(a, 'choice') && !strIn(a.choice, 1, MAX_LABEL)) throw no('bad-args');
  if (hasOwn(a, 'text') && !strIn(a.text, 0, MAX_TEXT)) throw no('bad-args');
  // accept 의 값 도메인은 문자열 'recommended' «하나» 예요(대시보드의 결정 답과 같은 값) — true 같은 불리언은 bad-args. 클라이언트는 추측하지 말고 이 값을 보내야 해요.
  if (hasOwn(a, 'accept') && a.accept !== 'recommended') throw no('bad-args');
  const text = hasOwn(a, 'text') ? a.text : '';
  const choice = hasOwn(a, 'choice') ? a.choice : null;
  const accept = hasOwn(a, 'accept') ? 'recommended' : null;
  if (choice === null && text === '' && accept === null) throw no('bad-args');     // 빈 답은 답이 아니에요
  return { args: { itemId: a.itemId, choice, text, accept, rev: bind.rev, contextHash: bind.contextHash }, weak: text !== '' };
}
function schemaDecisionDefer(a) {
  shape(a, ['itemId'], []);
  if (typeof a.itemId !== 'string' || !/^sd:[0-9a-f]{24}$/.test(a.itemId)) throw no('bad-args');
  return { args: { itemId: a.itemId }, weak: false };
}
function schemaHyperbrief(a) {
  shape(a, ['decisionId', 'branch', 'rev'], ['note', 'contextHash']);
  if (typeof a.decisionId !== 'string' || !/^(sd|h):[0-9a-f]{24}$/.test(a.decisionId)) throw no('bad-args');
  if (typeof a.branch !== 'string' || !BRANCHES.includes(a.branch)) throw no('bad-args');
  if (hasOwn(a, 'note') && !strIn(a.note, 0, MAX_NOTE)) throw no('bad-args');
  const bind = bindingOf(a);
  const note = hasOwn(a, 'note') ? a.note : '';
  return { args: { decisionId: a.decisionId, branch: a.branch, note, rev: bind.rev, contextHash: bind.contextHash }, weak: a.branch !== 'defer' || note !== '' };
}
function schemaSelection(a) {
  shape(a, ['promptId', 'selected'], []);
  if (typeof a.promptId !== 'string' || !/^h:[0-9a-f]{24}$/.test(a.promptId)) throw no('bad-args');
  if (!Array.isArray(a.selected) || a.selected.length < 1 || a.selected.length > MAX_SELECTED) throw no('bad-args');
  const seen = new Set();
  for (const s of a.selected) {
    if (!strIn(s, 1, MAX_LABEL) || seen.has(s)) throw no('bad-args');
    seen.add(s);
  }
  return { args: { promptId: a.promptId, selected: a.selected.slice() }, weak: false };
}
function schemaPrompt(a) {
  shape(a, ['text'], ['target']);
  if (!strIn(a.text, 1, MAX_TEXT)) throw no('bad-args');
  if (hasOwn(a, 'target') && (typeof a.target !== 'string' || !ID_RE.test(a.target))) throw no('bad-args');
  return { args: { target: hasOwn(a, 'target') ? a.target : null, text: a.text }, weak: false };   // TOTP 로 못 여는 건 «표의 totp:false» 하나가 막아요(자유 서술이라는 이유와 겹치지 않게 — 두 가드가 서로를 가리지 않아야 각각 시험돼요)
}

// ── 서명된 «등록» 동사 3종 — 보드 로컬 키 등록부(uplink-keys.json)를 고치는 동사예요. **passkey 전용**이에요(표의 totp:false 가 막아요).
//   이유: TOTP 는 «명령에 묶이지 않는 증명» 이라(totp.cjs 머리말) 중계가 새 코드를 다른 명령에 붙일 수 있어요. 등록 동사에 그게 통하면 비밀 6자리 하나로 «내 키를 등록부에 넣기» 가 되고,
//   그 순간 중계가 만든 키가 이후 모든 passkey 동사를 서명해요. 그래서 이 동사들은 «이미 등록된 passkey» 가 명령 해시(챌린지)에 서명한 경우에만 열려요.
//   **그래도 서명은 «등록» 이 아니라 «후보 올리기» 예요.** passkey 는 명령 해시에 서명할 뿐 «사람이 무엇을 읽고 눌렀는지» 는 보여 주지 않아요(해시로 바꿔 주는 화면은 중계가 서빙해요) — 서명만으로 키가 영구 등록되면
//   중계가 «결정 승인» 으로 보이는 탭 한 번에 자기 키를 영구 서명자로 만들 수 있어요. 그래서 enroll 동사는 대기열(uplink-pending.json)에 올리기만 하고, 보드 터미널 앞의 사람이 지문을 보고 y 를 친 뒤(cli.cjs enroll)에야
//   등록부에 들어가요. 수락(accepted)의 뜻은 «대기열에 올렸다» 예요. 폐기(credential.revoke)는 접근을 좁히기만 해서 서명만으로 바로 적용돼요.
//   주입기(inject)가 아니에요 — 메인으로 가는 프레임이 없고 서버 실행기 열쇠 집합(정확히 5개)은 그대로예요. 보드 «로컬» 파일만 바꿔요(keyset.cjs — CLI 와 같은 함수).
//   인자는 «글자만으로» 검증해요(키 모양·알고리즘 규칙은 검증 쪽 checkEnrollKey 와 같은 함수) — 틀린 키가 서명된 명령으로 와도 등록부에 앉지 못해요.
function schemaCredentialEnroll(a) {
  shape(a, ['credentialId', 'alg', 'publicKeySpki'], ['name']);
  const c = KS.normalizeCredential({ credentialId: a.credentialId, alg: a.alg, publicKeySpki: a.publicKeySpki, name: hasOwn(a, 'name') ? a.name : undefined });
  if (!c.ok) throw no('bad-args');
  return { args: { credentialId: c.credentialId, alg: c.alg, spki: c.spki, name: c.name }, weak: false };
}
function schemaDeviceEnroll(a) {
  shape(a, ['deviceId', 'sealPublicJwk'], ['name']);
  const d = KS.normalizeDevice({ deviceId: a.deviceId, sealPublicJwk: a.sealPublicJwk, name: hasOwn(a, 'name') ? a.name : undefined });
  if (!d.ok) throw no('bad-args');
  return { args: { deviceId: d.deviceId, jwk: d.jwk, kid: d.kid, name: d.name }, weak: false };
}
function schemaCredentialRevoke(a) {
  shape(a, ['credentialId'], []);
  if (typeof a.credentialId !== 'string' || !KS.CRED_ID_RE.test(a.credentialId) || Buffer.from(a.credentialId, 'base64url').toString('base64url') !== a.credentialId) throw no('bad-args');
  return { args: { credentialId: a.credentialId }, weak: false };
}
// 서명된 등록 동사가 «소비 뒤에» 낼 수 있는 도메인 거절 — 그 밖의 실패(잠금 · 파일 읽기/쓰기)는 execution-failed 예요.
const ENROLL_REFUSALS = new Set(['credential-already-enrolled', 'device-already-enrolled', 'credential-already-pending', 'device-already-pending', 'pending-full', 'credential-not-found', 'last-credential', 'keys-full']);

// ── verb 정책 표 — **고정**이에요. 설정(uplink.json totp.verbs)은 «좁히기만» 해요(교집합) — 이 표에 없는 verb 를 TOTP 로 열 수 없어요.
//   passkey(WebAuthn)는 표에 있는 모든 verb 를 해요. TOTP 는 «명령에 묶이지 않는 증명» 이라(totp.cjs 머리말 — 중계가 새 코드를 다른 명령에 붙일 수 있어요) 자유 서술이 없는 선택·보류에만 허용해요.
//   totpTwoWay — 그 안에서도 «선택(decision.answer)» 은 결정이 reversibility:'two_way' 를 선언했을 때만 TOTP 로 열려요(머리말 «바꿔치기된 명령이 할 수 있는 일»). 보류·선택지 답은 해당 없음.
//   ctx — 사람이 «본 판» 에 묶이는 동사(머리말 «맥락 묶음», v2.4.179): 인자에 rev(+ 봉인된 판이면 contextHash)가 있어야 하고 보드의 현재 판과 같아야 해요.
const VERBS = Object.freeze({
  'decision.answer': Object.freeze({ totp: true, totpTwoWay: true, ctx: true, item: 'decision', injector: 'operatorDecision', schema: schemaDecisionAnswer }),
  'decision.defer': Object.freeze({ totp: true, item: 'decision', injector: 'decisionDefer', schema: schemaDecisionDefer }),
  'hyperbrief.respond': Object.freeze({ totp: true, ctx: true, item: 'decision', injector: 'hyperbriefRespond', schema: schemaHyperbrief }),
  'selection.answer': Object.freeze({ totp: true, item: 'selection', injector: 'selectionAnswer', schema: schemaSelection }),
  'prompt.send': Object.freeze({ totp: false, item: null, injector: 'userPrompt', schema: schemaPrompt }),
  // 등록 동사(위 머리말) — passkey 전용 · 주입기 없음(local = 보드 로컬 등록부 변경)
  'credential.enroll': Object.freeze({ totp: false, item: null, injector: null, local: 'credential.enroll', schema: schemaCredentialEnroll }),
  'device.enroll': Object.freeze({ totp: false, item: null, injector: null, local: 'device.enroll', schema: schemaDeviceEnroll }),
  'credential.revoke': Object.freeze({ totp: false, item: null, injector: null, local: 'credential.revoke', schema: schemaCredentialRevoke }),
});

// ── 선택지 추적 — 서버가 «열린 선택지» 의 보기를 따로 안 쥐고 있어서(타임아웃을 선언한 것만 pending 추적) 보드로 가는 프레임에서 직접 봐요.
//   답을 낸 뒤·만료된 뒤엔 닫아요. 한계(문서화): 다른 보드(대시보드)가 낸 답은 이 탭에 안 보여서, 서버가 추적하는(타임아웃 선언) 프롬프트는 serverState 가 «done» 으로 알려 주고 나머지는 열린 채로 보여요.
class SelectionTracker {
  constructor(o) {
    this.secret = o.secret;
    this.serverState = o.serverState || null;        // (promptId) => 'done' | 'pending' | null
    this.serverIssuer = o.serverIssuer || null;      // (promptId) => 서버가 «라우팅에 쓸» 발급자 agentId | null — 이 탭이 검증한 보기의 주인과 같아야 해요
    this.max = 256;
    this.m = new Map();                              // tag → {promptId, labels|null, multi, issuer, open}
  }

  note(msg) {
    if (!isPlain(msg) || msg.type !== 'CUSTOM' || typeof msg.name !== 'string' || !isPlain(msg.value)) return;
    const v = msg.value;
    if (typeof v.promptId !== 'string' || v.promptId.length < 1 || v.promptId.length > 200) return;
    if (msg.name === 'SelectionPrompt') {
      let labels = null;
      if (Array.isArray(v.options)) {
        labels = v.options.map((o) => (typeof o === 'string' ? o : (isPlain(o) ? o.label : undefined))).filter((s) => typeof s === 'string' && s.length > 0 && s.length <= MAX_LABEL).slice(0, 64);
        if (labels.length === 0) labels = null;
      }
      const tag = tagOf(this.secret, v.promptId);
      const issuer = typeof msg.agentId === 'string' && ID_RE.test(msg.agentId) ? msg.agentId : null;
      // **보기는 «처음 낸 발급자» 의 것이에요.** 열려 있는 프롬프트와 같은 promptId 를 «다른 에이전트» 가 다시 내면 보기(라벨)를 덮어써서, 메인이 낸 질문에 «메인이 내지 않은 보기» 로 검증된 답이
      //   운영자 도장을 달고 메인에게 가요. 덮어쓰지 않고 «충돌» 로 표시해서 그 프롬프트는 닫힌 채 막아요(누가 진짜 발급자인지 이 탭이 판정할 수 없어요). 같은 발급자의 재발급은 그대로 갱신해요.
      const prev = this.m.get(tag);
      if (prev && prev.open && (prev.conflict || prev.issuer !== issuer)) { prev.conflict = true; return; }
      this.m.delete(tag);
      this.m.set(tag, { promptId: v.promptId, labels, multi: v.multiSelect === true, issuer, open: true, conflict: false });
      while (this.m.size > this.max) this.m.delete(this.m.keys().next().value);
    } else if (msg.name === 'SelectionResolved' || msg.name === 'SelectionExpired' || msg.name === 'SelectionAnswer' || msg.name === 'SelectionCancel') {
      this.close(v.promptId);
    }
  }

  close(promptId) { const e = this.m.get(tagOf(this.secret, promptId)); if (e) e.open = false; }

  find(tag) {
    const e = this.m.get(tag);
    if (!e) return null;
    let open = e.open;
    if (open && this.serverState) { try { if (this.serverState(e.promptId) === 'done') open = false; } catch (_) { /* 서버 조회 실패는 «모름» — 열린 채로 둬요 */ } }
    let conflict = e.conflict === true;
    // 서버가 라우팅에 쓸 발급자(pending · tombstone)를 알고, 그게 이 탭이 보기를 검증한 발급자와 다르면 — 검증한 보기와 답이 가는 곳이 어긋나요.
    if (!conflict && open && this.serverIssuer) { try { const si = this.serverIssuer(e.promptId); if (si && si !== e.issuer) conflict = true; } catch (_) { /* 조회 실패는 «모름» */ } }
    return { promptId: e.promptId, labels: e.labels, multi: e.multi, issuer: e.issuer, open, conflict };
  }
}

const kindOfProof = (p) => (isPlain(p) && (p.kind === 'webauthn' || p.kind === 'totp') ? p.kind : (isPlain(p) && typeof p.kind === 'string' ? 'other' : null));

class Executor {
  constructor(o) {
    this.cfg = o.cfg;
    this.dir = o.dir;
    this.keys = o.keys;
    this.store = o.store;
    this.getState = o.getState;
    this.selections = o.selections;
    this.now = o.now || (() => Date.now());
    this.auditFn = o.audit || (() => {});
    this.log = o.log || (() => {});
    this._warned = new Set();
    this._totp = null;
    this.injectError = null;
    this.inject = null;
    this.notice = null;                              // 서버 알림 함수(없으면 대치 의심은 감사 줄만 남겨요)
    this._noticed = new Map();                       // 대치된 명령(= 코드를 먼저 쓴 쪽) cmdHash8 → {n: 거절 횟수, sent: 알림을 냈나} (머리말: 대치된 명령 하나당 알림 한 장 · 감사 알림 줄도 자릿수마다 한 줄)
    this._spends = new Map();                        // TOTP 단계 → {step, cmdHash, verb, itemId, id, codeTag, at, ver, signed} — 이 프로세스가 «처음으로» 그 단계를 쓴 명령(재시작하면 비어요 — 머리말)
    this._idx = null;                                // {text, map} — 결정 가명 색인 캐시(아래 _decisionIndex)
    this._snap = null;                               // 한 번의 명령 처리 안에서 «상태를 한 번만» 읽기 위한 스냅샷(handle 이 비움)
    this.syncItems = typeof o.syncItems === 'function' ? o.syncItems : null;     // (상태 텍스트) => void — 항목 기록(rev · 봉투)을 «판정에 쓰는 바로 그 텍스트» 로 맞춰요(머리말 «맥락 묶음»)
    this._ctxHash = new WeakMap();                   // 봉투 객체 → contextHash(hex) — 같은 판의 해시를 명령마다 다시 계산하지 않게
    if (!o.inject || typeof o.inject !== 'object') this.injectError = 'no-injectors';
    else {
      const ks = Object.keys(o.inject).sort();
      if (ks.length !== INJECTORS.length || ks.some((k, i) => k !== INJECTORS[i]) || INJECTORS.some((k) => typeof o.inject[k] !== 'function')) this.injectError = 'bad-injector-set';
      else this.inject = o.inject;
    }
    if (o.notice !== undefined) {
      // 얼린 객체 + 열쇠 집합이 «정확히» NOTICERS — 운영자 실행기 검사와 같은 엄격함(여분의 함수 하나가 «아무 프레임이나 내는 통로» 가 되지 않게). 주었는데 틀리면 안전하게 전부 거절해요.
      const nk = isPlain(o.notice) ? Object.keys(o.notice).sort() : null;
      if (!nk || !Object.isFrozen(o.notice) || nk.length !== NOTICERS.length || nk.some((k, i) => k !== NOTICERS[i]) || NOTICERS.some((k) => typeof o.notice[k] !== 'function')) { if (!this.injectError) this.injectError = 'bad-notice-set'; }
      else this.notice = o.notice;
    }
    if (this.injectError) this._once('inject', '[uplink] 명령 실행기가 규격이 아니에요(' + this.injectError + ') — 받은 명령은 전부 거절해요');
    this.state = new ExecState(this.dir, this.log, o.stateOpts);
    this.state.open();
    try {
      this.ledger = new OP.NonceLedger(path.join(this.dir, 'uplink-nonces.jsonl'), { now: Math.floor(this.now() / 1000) });
    } catch (e) { this.state.close(); throw e; }
  }

  _once(k, msg) { if (this._warned.has(k)) return; this._warned.add(k); this.log(msg); }

  close() {
    try { this.ledger.close(); } catch (_) { /* noop */ }
    try { this.state.close(); } catch (_) { /* noop */ }
    if (this._totp) { try { this._totp.close(); } catch (_) { /* noop */ } this._totp = null; }
  }

  // ── 진입점 ──
  handle(c) {
    const meta = { cmdId: c.cmdId, verb: null, cmdHash8: 'unparsed', proof: kindOfProof(c.proof), acct: null };
    let out;
    this._snap = null;
    try { out = this._decide(c, meta); } catch (e) {
      this._once('internal', '[uplink] 명령 처리 중 내부 오류: ' + String((e && e.message) || e).slice(0, 120));
      out = { status: 'rejected', reason: 'internal-error', receipt: null };
    }
    this._snap = null;
    try {
      this.auditFn({ at: new Date(this.now()).toISOString(), cmdId: meta.cmdId, verb: meta.verb, cmdHash8: meta.cmdHash8, proof: meta.proof, acct: meta.acct, status: out.status, reason: out.reason });
    } catch (e) { this._once('audit', '[uplink] 감사 로그를 쓰지 못했어요 (' + (e && e.code ? e.code : e && e.message) + ')'); }
    return out;
  }

  // 서명된 영수증 한 장. 키가 없으면 영수증 없이 사유만(폰은 «보드가 거절했다» 를 서명 없이 못 믿으니 영수증 칸이 비어요).
  //   final · retryableUntil 은 «서명 대상» 이에요(머리말) — 폰이 한 칸만 바꿔도 서명이 깨져서 «최종» 표시를 중계가 못 고쳐요. 최종이면 retryableUntil 은 null.
  _receipt(c, hashHex, status, reason, key, fin, until) {
    if (!key || !key.ok || !hashHex) return null;
    const isFinal = fin !== false || !Number.isSafeInteger(until);        // 실행될 수 있는 «기한» 을 모르면 «아직 가능» 이라고 주장할 수 없어요 — 최종으로 둬요(명령이 읽히지 않는 경우뿐)
    const fields = { boardId: this.cfg.boardId, cmdId: c.cmdId, cmdHash: hashHex, status, reason, executedAt: this.now(), final: isFinal, retryableUntil: isFinal ? null : until };
    const sig = crypto.sign('sha256', Buffer.from(OP.canonicalize(fields), 'utf8'), { key: key.boardPriv, dsaEncoding: 'ieee-p1363' }).toString('base64url');
    return Object.assign({}, fields, { sig });
  }

  // 소비 «전» 의 거절 — 저장하지 않아요(같은 봉투 재시도가 열려 있어요).
  //   fin 을 안 주면 사유 표(FINAL_REASONS)로 정해요. until = exp + SKEW — 시간 검사가 받아들이는 마지막 초.
  _pre(c, hashHex, key, reason, fin, until) {
    const f = fin === undefined ? FINAL_REASONS.has(reason) : fin;
    return { status: 'rejected', reason, receipt: this._receipt(c, hashHex, 'rejected', reason, key, f, until) };
  }

  // 소비 «후» 의 결과 — 영속해요(저장 못 해도 응답은 나가요; 재전달 멱등성만 약해져요).
  _spent(c, hashHex, key, status, reason) {
    const receipt = this._receipt(c, hashHex, status, reason, key, true, null);      // 소비된 명령의 결과는 언제나 최종
    if (receipt) {
      try { this.state.putReceipt(hashHex, receipt, this.now()); } catch (e) { this._once('rcpt', '[uplink] 영수증을 디스크에 쓰지 못했어요 (' + (e && e.code ? e.code : e && e.message) + ') — 재전달 멱등성이 약해져요'); }
    }
    return { status, reason, receipt };
  }

  _decide(c, meta) {
    const nowMs = this.now();
    const sec = Math.floor(nowMs / 1000);
    // 0. 형식을 못 읽으면 영수증 장부를 만지지 않고 거절 — 읽히는 것만 해시가 «명령의 신원» 이에요.
    if (typeof c.cmd !== 'string' || c.cmd.length > MAX_CMD_TEXT) return { status: 'rejected', reason: 'bad-format', receipt: null };
    const hashBuf = OP.cmdHash(c.cmd);
    const hashHex = hashBuf.toString('hex');
    let parsedCmd;
    try { parsedCmd = OP.parseCanonical(c.cmd); } catch (_) {
      // 글자가 읽히지 않는 명령은 증명을 바꿔도 영원히 읽히지 않아요 — 최종
      return { status: 'rejected', reason: 'bad-format', receipt: this._receipt(c, hashHex, 'rejected', 'bad-format', this.keys.read(), true, null) };
    }
    meta.cmdHash8 = hashHex.slice(0, 8);
    let until = null;       // 이 명령이 «아직 실행될 수 있는» 마지막 초(exp + SKEW) — 소비 전 거절 영수증의 retryableUntil
    if (isPlain(parsedCmd)) {
      if (typeof parsedCmd.verb === 'string') meta.verb = parsedCmd.verb.slice(0, 64);
      if (typeof parsedCmd.acct === 'string' && ACCT_RE.test(parsedCmd.acct)) meta.acct = parsedCmd.acct;       // 감사에는 «규격 안의 이름» 만 — 중계가 정한 문장이 감사 줄에 실리지 않게
      if (Number.isSafeInteger(parsedCmd.exp)) until = parsedCmd.exp + SKEW;
    }
    // 멱등성 — 소비된 명령의 영수증이 있으면 그대로(재서명하지 않아요: 같은 바이트여야 «같은 영수증»).
    const cached = this.state.getReceipt(hashHex);
    if (cached) return { status: cached.status, reason: cached.reason, receipt: cached, replayed: true };

    const key = this.keys.read();
    if (!key || !key.ok) return { status: 'rejected', reason: 'board-key-unavailable', receipt: null };
    const rej = (reason, fin) => this._pre(c, hashHex, key, reason, fin, until);

    if (this.injectError) return rej('exec-unavailable');
    if (!isPlain(c.proof)) return rej('bad-proof');
    let envText;
    try { envText = OP.canonicalize({ v: 1, cmd: c.cmd, proof: c.proof }); } catch (_) { return rej('bad-format'); }

    // 1~3. 형식 · audience · 시간
    const f = OP.checkFormat(envText);
    if (!f.ok) return rej(f.code);
    const cmd = f.cmd;
    meta.verb = cmd.verb;
    meta.acct = ACCT_RE.test(cmd.acct) ? cmd.acct : null;
    const au = OP.checkAudience(cmd, { boardId: this.cfg.boardId, boardKeyFp: key.boardFp });
    if (!au.ok) return rej(au.code);
    const tm = OP.checkTime(cmd, { now: sec });
    if (!tm.ok) return rej(tm.code);
    if (!ACCT_RE.test(cmd.acct)) return rej('bad-acct', true);

    // 5. verb 정책 · 인자 · 증명 종류 · 등록 · 항목
    //   rejP — 증명 «전» 에 정책으로 거절하는 자리의 거절 함수예요. TOTP 명령이면 거절 «직전에» 읽기 전용으로 «이 코드가 이미 다른 명령에 쓰였나» 를 엿봐요(머리말 «탐지»):
    //   증명 단계에 못 닿고 끝나는 거절(결정이 사라짐 · 알 수 없는 항목 · 값이 나쁜 인자 · 선언이 없는 결정)이 대치의 흔적을 «덮어» 버리지 않게요. 사유는 그대로이고 경보만 따로 나가요.
    let norm = null;
    let ref = null;
    const rejP = (reason, fin) => { if (isPlain(f.proof) && f.proof.kind === 'totp') this._peekSubstitution(c, meta, norm, ref, key, f.proof, hashHex, nowMs); return rej(reason, fin); };
    if (!hasOwn(VERBS, cmd.verb)) return rejP('verb-not-allowed');
    const policy = VERBS[cmd.verb];
    try { norm = policy.schema(cmd.args); } catch (e) { if (e instanceof Reject) return rejP(e.code, true); throw e; }       // 스키마는 «글자만» 으로 정해져요 — 최종
    const kind = f.proof.kind;
    if (kind !== 'webauthn' && kind !== 'totp') return rej('bad-proof');
    if (kind === 'totp' && (!this._totpAllowed(cmd.verb) || norm.weak)) return rejP('proof-too-weak');
    let secret = null;
    if (kind === 'webauthn') {
      if (!this.cfg.rp || !key.credentials || key.credentials.length === 0) return rej('proof-not-enrolled');
      if (this.state.counterError) return rej(this.state.counterError);
    } else {
      // TOTP 는 명령에 묶이지 않아서 cmd.acct 는 «중계가 고른 글자» 예요 — 운영자 도장의 이름은 «로컬 등록값» 이어야 해요. 그래서 등록에 acct 가 없는 TOTP 는 받지 않아요.
      if (!key.totp || key.totp.acct === null || !ACCT_RE.test(key.totp.acct)) return rej('proof-not-enrolled');
      try { secret = TOTP.base32Decode(key.totp.secretB32); } catch (_) { return rej('proof-not-enrolled'); }
    }
    // 맥락 묶음(머리말) — 열린 항목만: «사람이 본 판» 이 지금 판인가를 «증명 전» 에 봐요(낡은 판의 명령이 TOTP 단계를 태우지 않게). 닫혔거나 흔적이 없는 항목은 기존 사유 그대로예요.
    try { ref = this._lookup(policy, norm.args); if (!ref.found) throw no('unknown-item'); if (ref.open) { this._checkContext(policy, norm.args); this._checkAgainstItem(cmd.verb, norm.args, ref); } } catch (e) { if (e instanceof Reject) return rejP(e.code); throw e; }
    // TOTP 로 «선택» 을 하려면 그 결정이 되돌릴 수 있다고 선언돼 있어야 해요(머리말). 증명 «전» 이라 TOTP 단계를 안 태우고 비최종이에요 — 같은 명령이 passkey 증명으로 오면 통과해요.
    if (kind === 'totp' && policy.totpTwoWay && !this._twoWay(ref.d)) return rejP('proof-too-weak');
    // 소비 «전» 에 읽기만 하는 nonce 확인 — TOTP 단계가 이미 쓰인 명령에 타지 않게(머리말).
    if (this.ledger.has(cmd.nonce)) return rejP('nonce-replayed');

    // 6~10. 증명
    let wa = null;
    if (kind === 'webauthn') {
      const p = WA.parseProof(f.proof);
      if (!p.ok) return rej(p.code);
      const credMap = new Map();
      let enrolledRec = null;
      for (const cr of key.credentials) {
        const stored = this.state.storedCount(cr.credentialId, cr.signCount);
        credMap.set(cr.credentialId, { alg: cr.alg, signCount: stored, publicKey: cr.publicKey });
        if (cr.credentialId === p.credentialId) enrolledRec = { enrolled: cr.signCount, stored, acct: cr.acct };
      }
      if (enrolledRec && enrolledRec.acct !== null && enrolledRec.acct !== cmd.acct) return rej('acct-mismatch');
      const v = WA.verifyAssertion(f.proof, { rpId: this.cfg.rp.id, origins: this.cfg.rp.origins, credentials: credMap, expectedChallenge: hashBuf });
      if (!v.ok) return rej(v.code);
      wa = { credentialId: v.credentialId, enrolled: enrolledRec.enrolled, stored: enrolledRec.stored, next: v.newSignCount, acct: enrolledRec.acct };
    } else {
      if (key.totp.acct !== cmd.acct) return rejP('acct-mismatch');
      let store;
      try { store = this._totpStore(sec); } catch (e) { return rej(e && e.code ? e.code : 'state-unavailable'); }
      const r = store.verifyProof(f.proof, hashBuf, { now: sec, secret });
      if (!r.ok) {
        // 단계가 이미 소비됐는데 «다른 명령» 이 쓴 것이면 바꿔치기 의심(머리말 «탐지») — 같은 명령의 진짜 재전달(usedBy 가 내 cmdHash)이면 그냥 totp-replayed 예요.
        if (r.code === 'totp-replayed' && typeof r.usedBy === 'string' && r.usedBy !== hashHex) {
          this._substitutionSuspected(c, meta, norm, ref, r.step, r.usedBy, hashHex, nowMs);
          return rej('totp-step-used-by-other-command');
        }
        return rej(r.code);
      }
      // 이 명령이 코드의 단계를 «처음으로» 썼어요 — 누가 · 무엇에 썼는지를 기억해요(대치 알림이 «실제로 코드가 쓰인 항목» 을 말하고, 폰이 확인할 서명된 사용 기록의 재료예요).
      this._noteSpend(r.step, hashHex, cmd.verb, norm, ref, f.proof.code, nowMs);
    }

    // 11. 낡은 항목 — «지금» 의 상태로 다시 봐요(위의 조회는 증명 전의 것). 닫혔어도 아래 커밋은 해요(머리말).
    //   TOTP 는 스냅샷을 버리고 «진짜로 다시 읽어요» — 코드 검증은 디스크 쓰기(fsync)를 낀 단계라 그 사이 메인이 결정의 reversibility 를 바꿨을 수 있고, 위 증명 전 판정은 «옛» 값으로 한 거예요(낡은 항목 판정과 같은 모양의 재확인).
    //   이 읽기는 TOTP 단계가 «소비된» 명령에만 붙어서(30초 창에 몇 건 못 넘어요) 중계가 명령을 쏟아내도 늘지 않아요 — 증명 전 구간의 «한 번만 읽기»(F5)는 그대로예요.
    if (kind === 'totp') this._snap = null;
    let cur;
    try { cur = this._lookup(policy, norm.args); } catch (e) { if (e instanceof Reject) return rej(e.code); throw e; }
    // 맥락 묶음의 커밋 안 재확인 — TOTP 는 위에서 상태를 «진짜로 다시» 읽었고 그 읽기가 항목 기록을 같은 텍스트로 맞춰요(syncItems). 증명 사이에 다시 봉인됐으면(새 판) 여기서 거절해요:
    //   nonce 는 안 태우고(비최종 — 사람은 새 판을 읽고 «새 명령» 으로 다시 답해요) TOTP 단계는 이미 탔어요(two_way 재확인과 같은 자리 · 같은 대가).
    //   되돌림 선언의 변경도 새 판이라 동기가 붙은 배선에선 여기서 stale-context 로 먼저 걸려요 — 아래 two_way 재확인은 두 번째 층이에요(머리말 «맥락 묶음»).
    if (cur.found && cur.open) { try { this._checkContext(policy, norm.args); } catch (e) { if (e instanceof Reject) return rej(e.code); throw e; } }
    if (kind === 'totp' && policy.totpTwoWay && !this._twoWay(cur.d)) return rej('proof-too-weak');      // 커밋 안의 재확인 — 단계는 탔어도 nonce 는 안 태워요(같은 명령을 passkey 로 다시 낼 수 있어요)
    const stale = !cur.found || !cur.open;

    // 12. 커밋 — nonce 소비 → signCount CAS. 둘 다 디스크에 확정된 «뒤에만» 실행해요.
    const cn = OP.consumeNonce(cmd, { ledger: this.ledger, now: sec });
    if (!cn.ok) return rej(cn.code);                       // 못 쓴 nonce 는 소비된 게 아니에요 — 저장 없이 거절(재시도 열림)
    if (wa) {
      let swapped = false;
      try { swapped = this.state.commitCount(wa.credentialId, wa.enrolled, wa.stored, wa.next); } catch (_) { return this._spent(c, hashHex, key, 'rejected', 'commit-failed'); }
      if (!swapped) return this._spent(c, hashHex, key, 'rejected', 'counter-regression');
    }
    if (stale) return this._spent(c, hashHex, key, 'rejected', 'stale-item');
    // 운영자 이름: TOTP 는 «로컬 등록값», passkey 는 등록된 자격증명의 acct(없으면 사람이 서명한 cmd.acct) — 둘 다 ACCT_RE 를 통과한 글자예요.
    const opAcct = kind === 'totp' ? key.totp.acct : (wa && wa.acct !== null ? wa.acct : cmd.acct);
    const prov = { via: 'uplink', cmdHash: hashHex, proof: kind, operator: 'acct:' + opAcct };
    try { this._execute(cmd.verb, policy, norm.args, cur, prov, nowMs); } catch (e) {
      if (e instanceof KS.KeysetRefusal && ENROLL_REFUSALS.has(e.code)) return this._spent(c, hashHex, key, 'rejected', e.code);      // 소비된 뒤의 도메인 거절 — 최종
      this._once('exec:' + cmd.verb, '[uplink] 명령 실행기가 실패했어요 (' + cmd.verb + '): ' + String((e && e.message) || e).slice(0, 120));
      return this._spent(c, hashHex, key, 'rejected', 'execution-failed');
    }
    return this._spent(c, hashHex, key, 'accepted', null);
  }

  // TOTP 로 열 수 있는 verb — 고정 표 ∩ 설정(좁히기만). 설정이 없으면 표 그대로예요.
  _totpAllowed(verb) {
    const p = hasOwn(VERBS, verb) ? VERBS[verb] : null;
    if (!p || !p.totp) return false;
    const t = this.cfg.totp;
    return t ? t.verbs.includes(verb) : true;
  }

  // 결정이 되돌릴 수 있다고 «선언» 했나 — 선언이 없거나 어휘 밖이거나 항목이 상태에 없으면(d 없음) 아니에요(안전하게 틀려요).
  _twoWay(d) { return isPlain(d) && reversibilityOf(d) === 'two_way'; }

  // ── TOTP 바꿔치기 의심 ─────────────────────────────────────────────────────────────────────────────────────
  //   항목 id 에 실리는 «진짜 id» 는 ID_RE 를 통과한 글자만이에요 — 선택지 프롬프트의 id 는 «에이전트가 고른 자유 서술» 이라(최대 200자) 그대로 실으면 서버 권위 경보 안에 에이전트의 문장이 들어가요.
  //   통과 못 하면 빈 문자열이고, 가명(itemId)은 언제나 실려요.
  _idOut(x) { return typeof x === 'string' && ID_RE.test(x) ? x : ''; }
  _pseudoOf(norm) {
    if (!norm || !norm.args) return '';
    const a = norm.args;
    // 결정류는 «스냅샷과 같은 낱말»(sd:) — hyperbrief.respond 의 decisionId 는 sd: 로도 h: 로도 올 수 있어서 tag 만 떼어 다시 붙여요(머리말 «itemId»). 선택지 프롬프트는 스냅샷 밖이라 h:<tag> 그대로.
    if (hasOwn(a, 'itemId')) return typeof a.itemId === 'string' ? a.itemId.slice(0, 40) : '';
    if (hasOwn(a, 'decisionId')) return typeof a.decisionId === 'string' && TAG_RE.test(a.decisionId.slice(-24)) ? 'sd:' + a.decisionId.slice(-24) : '';
    if (hasOwn(a, 'promptId')) return typeof a.promptId === 'string' ? a.promptId.slice(0, 40) : '';
    return '';
  }
  _realOf(ref) { return ref && ref.d && typeof ref.d.id === 'string' ? this._idOut(ref.d.id) : (ref && ref.sel && typeof ref.sel.promptId === 'string' ? this._idOut(ref.sel.promptId) : ''); }

  // 이 명령이 TOTP 단계를 «처음으로» 썼어요 — 기억해 둬요. 코드 값은 «단계 + 보드 id 와 함께 해시한 꼬리표» 로만 남겨요(폰이 «내가 친 코드» 가 이 기록의 코드인지 비밀 없이 맞춰 보려는 용도).
  _noteSpend(step, hashHex, verb, norm, ref, code, nowMs) {
    if (!Number.isSafeInteger(step)) return;
    const codeTag = crypto.createHash('sha256').update('eg-totp-spend/v1\n' + this.cfg.boardId + '\n' + step + '\n' + String(code)).digest('hex').slice(0, 16);
    this._spends.delete(step);
    this._spends.set(step, { step, cmdHash: hashHex, verb: typeof verb === 'string' ? verb.slice(0, 64) : null, itemId: this._pseudoOf(norm), id: this._realOf(ref), codeTag, at: nowMs, ver: 0, signed: null });
    while (this._spends.size > MAX_SPENDS) this._spends.delete(this._spends.keys().next().value);
  }

  // 그 명령의 «결과» — 영수증 장부에서 읽어요(소비된 명령의 결과만 거기 있어요). 없으면 'no-receipt'(실행 안 됨이거나 영수증을 못 남김).
  _outcomeOf(hashHex) {
    let r = null;
    try { r = this.state.getReceipt(hashHex); } catch (_) { r = null; }
    return r && typeof r === 'object' ? (r.status === 'accepted' ? 'accepted' : (typeof r.reason === 'string' ? r.reason.slice(0, 40) : 'rejected')) : 'no-receipt';
  }

  // 폰이 «내 코드를 누가 썼나» 를 확인할 수 있는 서명된 사용 기록 — 최근 것부터 MAX_SPEND_REPORT 개. 전송층이 결과 회신에 실어요(중계는 운반자라 빼도 되지만 «고칠» 수는 없어요: 보드 키로 서명).
  //   서명 대상 칸: boardId · kind · step · cmdHash(전체) · verb · itemId(스냅샷과 같은 낱말) · outcome · codeTag · at · ver. outcome 은 «지금» 값이라 바뀌면 ver 를 올려 다시 서명해요(캐시 — 같은 outcome 이면 «같은 바이트»).
  spendRecords() {
    const key = this.keys.read();
    if (!key || !key.ok) return [];
    const list = [...this._spends.values()].sort((x, y) => y.step - x.step).slice(0, MAX_SPEND_REPORT);
    const out = [];
    for (const s of list) {
      let outcome = this._outcomeOf(s.cmdHash);
      // 결과는 «no-receipt → 최종» 한 방향으로만 가요. 영수증 장부가 상한을 넘어 정리되면(_prune) 이미 최종 결과를 서명한 기록의 영수증이 사라질 수 있는데, 그때 다시 'no-receipt' 로 «더 큰 ver» 를
      //   서명하면 받는 쪽의 «가장 큰 ver 가 이긴다» 에 최종 결과가 «되돌려져요»(수락된 명령이 영수증 없음으로 보임). 한 번 최종이 된 결과는 그대로 고정해요.
      if (outcome === 'no-receipt' && s.signed && s.signed.outcome !== 'no-receipt') outcome = s.signed.outcome;
      if (!s.signed || s.signed.outcome !== outcome) {
        s.ver += 1;                                  // 첫 서명이 1 — 다시 서명할 때마다 +1 (서명 바이트 안: 머리말 «ver»)
        const fields = { boardId: this.cfg.boardId, kind: 'totp-spend', step: s.step, cmdHash: s.cmdHash, verb: s.verb, itemId: s.itemId, outcome, codeTag: s.codeTag, at: s.at, ver: s.ver };
        const sig = crypto.sign('sha256', Buffer.from(OP.canonicalize(fields), 'utf8'), { key: key.boardPriv, dsaEncoding: 'ieee-p1363' }).toString('base64url');
        s.signed = { outcome, rec: Object.assign({}, fields, { sig }) };
      }
      out.push(s.signed.rec);
    }
    return out;
  }

  // 증명 «전» 에 거절되는 TOTP 명령 — 이 코드가 «이미 다른 명령에 쓰인 단계» 에 맞으면 같은 경보를 내요(사유는 안 바꿔요).
  _peekSubstitution(c, meta, norm, ref, key, proof, hashHex, nowMs) {
    try {
      if (!key || !key.totp || typeof key.totp.secretB32 !== 'string' || !isPlain(proof) || typeof proof.code !== 'string') return;
      const sec = Math.floor(nowMs / 1000);
      const secret = TOTP.base32Decode(key.totp.secretB32);
      const hit = this._totpStore(sec).spentBy(proof.code, { now: sec, secret });
      if (hit && hit.usedBy !== hashHex) this._substitutionSuspected(c, meta, norm, ref, hit.step, hit.usedBy, hashHex, nowMs);
    } catch (_) { /* 엿보기 실패는 «경보를 못 낸 것» 일 뿐 거절 사유를 못 바꿔요 */ }
  }

  // 감사 줄(대치된 명령당 자릿수마다 — 1 · 10 · 100 … 번째 거절) + 서버 알림(대치된 명령 하나당 한 장). 던지지 않아요(경보가 거절 사유를 못 바꾸게).
  //   «대치된 명령» = 코드의 단계를 «먼저 쓴» 명령(usedByHex). 보드는 먼저 쓴 쪽과 나중에 온 쪽 중 «어느 것이 운영자의 명령인지» 를 알 수 없어요 — 그래서 알림은 «먼저 쓰인 명령 · 그 항목 · 그 결과» 와
  //   «나중에 같은 코드를 낸 명령» 을 나란히 말하고 누가 옳은지는 말하지 않아요. 먼저 쓰인 항목은 기억(_spends)에서 가져와요(재시작으로 잃었으면 항목 칸이 비어요).
  //   감사 줄이 거절마다 나가면 중계가 «같은 코드 + 새 nonce» 를 쏟아내 감사 표를 경보로 채울 수 있어서(실제 거절 줄은 그대로 남아요) 경보 줄은 횟수(count)와 함께 자릿수마다만 써요.
  _substitutionSuspected(c, meta, norm, ref, step, usedByHex, hashHex, nowMs) {
    const spent8 = usedByHex.slice(0, 8);
    const later8 = hashHex.slice(0, 8);
    const at = new Date(nowMs).toISOString();
    let rec = this._noticed.get(spent8);
    if (!rec) { rec = { n: 0, sent: false }; this._noticed.set(spent8, rec); while (this._noticed.size > MAX_NOTICED) this._noticed.delete(this._noticed.keys().next().value); }
    rec.n++;
    if (rec.n === 1 || /^10+$/.test(String(rec.n))) {
      try {
        this.auditFn({ at, cmdId: c.cmdId, verb: meta.verb, cmdHash8: later8, proof: 'totp', acct: meta.acct, status: 'alert', reason: 'totp-substitution-suspected', kind: 'totp-substitution-suspected', spentCmdHash8: spent8, laterCmdHash8: later8, count: rec.n });
      } catch (e) { this._once('audit', '[uplink] 감사 로그를 쓰지 못했어요 (' + (e && e.code ? e.code : e && e.message) + ')'); }
    }
    if (rec.sent) return;
    if (!this.notice) { this._once('nonotice', '[uplink] TOTP 바꿔치기가 의심되지만 서버 알림 함수가 없어요 — 감사 줄만 남겨요'); return; }
    const sp = this._spends.get(step);
    const known = sp && sp.cmdHash === usedByHex ? sp : null;
    try {
      this.notice.totpSubstitutionSuspected({
        itemId: known ? known.itemId : '', id: known ? known.id : '', verb: known && known.verb ? known.verb : '', outcome: this._outcomeOf(usedByHex),
        spentCmdHash8: spent8, laterItemId: this._pseudoOf(norm), laterId: this._realOf(ref), laterVerb: typeof meta.verb === 'string' ? meta.verb.slice(0, 64) : '', laterCmdHash8: later8, at,
      });
      rec.sent = true;
    } catch (e) { this._once('notice', '[uplink] 서버 알림을 내지 못했어요: ' + String((e && e.message) || e).slice(0, 120)); }
  }

  _totpStore(sec) {
    if (!this._totp) this._totp = new TOTP.TotpStore(path.join(this.dir, 'uplink-totp.json'), { now: sec });
    return this._totp;
  }

  // ── 항목 매핑: 가명 → 진짜 항목 ──
  // 결정: state.json 의 decisions[] 에서 «가명이 같은» 항목을 찾아요(HMAC 이라 되돌릴 수는 없고 모든 항목의 가명을 계산해 대조해요). 읽을 수 없으면 일시 장애(state-unavailable).
  // 선택지: 보드로 간 SelectionPrompt 프레임을 본 추적기.
  _lookup(policy, args) {
    if (policy.item === 'decision') {
      const pseudo = hasOwn(args, 'itemId') ? args.itemId : args.decisionId;
      const tag = pseudo.slice(-24);
      if (!TAG_RE.test(tag)) throw no('bad-args');
      const d = this._decisionIndex().get(tag);
      if (d) return { found: true, open: d.status === 'open', d };
      const rec = this.store.state.items['sd:' + tag];
      return rec ? { found: true, open: false, d: null } : { found: false, open: false, d: null };
    }
    if (policy.item === 'selection') {
      const e = this.selections ? this.selections.find(args.promptId.slice(-24)) : null;
      return e ? { found: true, open: e.open, sel: e } : { found: false, open: false, sel: null };
    }
    return { found: true, open: true };      // 항목이 없는 verb(prompt.send)
  }

  // 결정 가명 색인 — 상태 텍스트가 «같으면» 해석(파싱 + 결정마다 HMAC)을 재사용하고, 한 번의 명령 처리 안에서는 «한 번만» 읽어요(증명 전 조회와 11단계의 «지금» 조회가 같은 스냅샷 —
  //   그 사이는 동기라 끼어드는 쓰기가 없어요). 중계가 존재하지 않는 항목을 쏟아낼 때 명령 하나가 «상태 전체 파싱 + HMAC 전수 + (조회 두 번)» 이던 것을 «문자열 비교 + Map 조회» 로 줄여요
  //   (실측: 결정 2000개 · 중계가 존재하지 않는 항목 명령을 50개씩 쏟아내는 동안 GET /api/state p50 468ms → 5ms — 전송층의 배치 시간 예산과 함께). 읽을 수 없으면 state-unavailable(일시 장애 — 캐시 안 해요).
  _decisionIndex() {
    if (this._snap) return this._snap.map;
    let text;
    try { text = this.getState(); } catch (_) { throw no('state-unavailable'); }
    if (typeof text !== 'string') throw no('state-unavailable');
    if (!this._idx || this._idx.text !== text) {
      let st;
      try { st = JSON.parse(text); } catch (_) { throw no('state-unavailable'); }
      if (!isPlain(st) || st.error !== undefined) throw no('state-unavailable');
      const map = new Map();
      for (const d of (Array.isArray(st.decisions) ? st.decisions : [])) {
        if (!isPlain(d) || typeof d.id !== 'string') continue;
        const tag = tagOf(this.store.secret, d.id);
        if (!map.has(tag)) map.set(tag, d);          // 같은 가명이 둘이면 앞의 것(원래 순회와 같은 규칙)
      }
      this._idx = { text, map };
    }
    // 항목 기록을 «판정에 쓰는 이 텍스트» 로 맞춰요(머리말 «맥락 묶음») — 상태 파일 감시가 아직 안 돈 틈(폴링 간격)에 판정은 새 내용으로, 판 비교는 옛 rev 로 하면
    //   «옛 맥락에 서명된 답» 이 «새 맥락» 에 적용돼요. 같은 텍스트면 동기 쪽이 문자열 비교로 끝내요(명령 폭주가 동기 폭주가 되지 않게). 맞추지 못하면 일시 장애예요.
    if (this.syncItems) { try { this.syncItems(text); } catch (_) { throw no('state-unavailable'); } }
    this._snap = this._idx;
    return this._snap.map;
  }

  // ── 맥락 묶음 (v2.4.179 — 머리말) ──
  //   열린 결정 항목의 «지금 판» = 보드가 내보낸 항목 기록(store.state.items['sd:<tag>'])의 rev, 그리고 그 판에 봉인해 둔 봉투가 있으면 그 봉투의 contextHash.
  //   순서: 기록 없음/열린 기록 아님 → stale-context(보드가 «지금 판» 을 내보낸 적이 없어서 사람이 본 판일 수 없어요) · rev 다름 → stale-context ·
  //   봉인된 판인데 contextHash 없음 / 봉인 안 된 판(envelope 모드 · 봉인 실패)인데 contextHash 있음 → bad-args(상태가 정하는 값 — 비최종) · 해시 다름 → stale-context.
  //   rev 를 먼저 봐요 — 판이 바뀌었으면 «봉인 여부» 도 그 판의 것이 아니라서, 낡은 명령이 «칸이 틀렸다» 가 아니라 «낡았다» 로 거절돼요.
  _checkContext(policy, args) {
    if (!policy.ctx) return;
    const pseudo = hasOwn(args, 'itemId') ? args.itemId : args.decisionId;
    const tag = pseudo.slice(-24);
    const items = this.store && this.store.state ? this.store.state.items : null;
    const rec = isPlain(items) && hasOwn(items, 'sd:' + tag) ? items['sd:' + tag] : null;
    if (!isPlain(rec) || rec.status !== 'open' || !Number.isSafeInteger(rec.rev)) throw no('stale-context');
    if (args.rev !== rec.rev) throw no('stale-context');
    const want = this._contextHashOf(rec);
    if (want === null) {
      if (args.contextHash !== null) throw no('bad-args');        // 봉인된 맥락이 없는 판 — 해시를 실은 명령은 «없는 것에 묶인» 명령이에요
      return;
    }
    if (args.contextHash === null) throw no('bad-args');
    if (args.contextHash !== want) throw no('stale-context');
  }

  // 그 판에 봉인해 둔 봉투의 contextHash(seal.cjs — sig 포함 봉투 전체의 정준 바이트 SHA-256 hex) · 봉투가 없으면 null. 해시를 못 내는 봉투(손상)는 «지금 판» 을 보증할 수 없어서 stale-context 예요
  //   (상태 파일 읽기가 이런 기록을 걸러내요 — store.cjs).
  _contextHashOf(rec) {
    if (rec.sealed === undefined || rec.sealed === null) return null;
    if (!isPlain(rec.sealed)) throw no('stale-context');
    let h = this._ctxHash.get(rec.sealed);
    if (h === undefined) {
      try { h = SEAL.contextHash(rec.sealed); } catch (_) { throw no('stale-context'); }
      this._ctxHash.set(rec.sealed, h);
    }
    return h;
  }

  // 열린 항목에 대해서만 — 인자가 «그 항목이 허용하는 값» 인가(증명 전에 거절해야 값이 나쁜 명령이 TOTP 단계를 안 태워요).
  _checkAgainstItem(verb, args, ref) {
    if (verb === 'decision.answer') {
      const opts = Array.isArray(ref.d.options) ? ref.d.options.filter((x) => typeof x === 'string') : [];
      if (args.choice !== null && !opts.includes(args.choice)) throw no('bad-args');
      if (args.choice === null && args.accept === 'recommended' && !(typeof ref.d.recommendChoice === 'string' && ref.d.recommendChoice)) throw no('bad-args');
    } else if (verb === 'selection.answer') {
      const s = ref.sel;
      if (s.conflict) throw no('issuer-conflict');
      // 보기가 «없는» 프롬프트(자유 입력 · options 생략)는 labels 가 null 이에요 — null 을 «검사 생략» 으로 읽으면 어떤 글이든 «보기에서 고른 것» 으로 통과해서(TOTP 포함) 운영자 도장을 단 자유 서술이 되어요.
      //   그래서 null 은 «빈 집합» 이에요: 보기 없는 프롬프트에 uplink 로는 답할 수 없어요(자유 서술 답이 필요하면 passkey 전용 별도 칸으로 — 지금은 없음).
      const labels = s.labels || [];
      if (!args.selected.every((x) => labels.includes(x))) throw no('bad-args');
      if (!s.multi && args.selected.length > 1) throw no('bad-args');
    }
  }

  // 실행 — 각 실행기에 «칸별로 새로 지은» 객체를 넘겨요(요청 객체를 통째로 넘기지 않아요).
  // 보드 로컬 등록 동사 — 프레임을 만들지 않고 «보드 로컬 파일» 만 고쳐요(잠금 안의 읽고-고치고-쓰기 · 원자 교체는 keyset.cjs). enroll 동사는 키 등록부가 아니라 «대기열» 에 올려요(위 머리말) —
  //   출처 표기 via = 'signed:<cmdHash 앞 8자>' 가 대기열 항목에 붙고, 사람이 확인하면 그대로 등록부의 enrolledVia 가 돼요(파일만 보고도 명령(감사 줄의 cmdHash8)까지 거슬러 올라가게요).
  //   새 자격증명의 acct 는 «서명한 운영자 계정» 이에요(같은 계정 아래에서만 넓어져요).
  //   마지막 자격증명의 폐기는 거절(last-credential) — 서명 경로가 스스로를 잠그는 길을 닫아요. 이 검사는 «잠금 안» 에서 해서 두 폐기 명령이 동시에 와도 한쪽만 통과해요.
  _local(verb, args, prov, nowMs) {
    const via = 'signed:' + prov.cmdHash.slice(0, 8);
    const acct = prov.operator.slice('acct:'.length);
    const file = this.cfg.keysFile;
    if (typeof file !== 'string' || !file) throw new Error('keysFile 이 없어요');
    switch (verb) {
      case 'credential.enroll':
        KS.queueCredential(file, { credentialId: args.credentialId, alg: args.alg, spki: args.spki, name: args.name }, acct, via, nowMs);
        return;
      case 'device.enroll':
        KS.queueDevice(file, { deviceId: args.deviceId, jwk: args.jwk, kid: args.kid, name: args.name }, via, nowMs);
        return;
      case 'credential.revoke':
        KS.updateKeys(file, (raw) => KS.removeCredential(raw, args.credentialId, false));
        return;
      default:
        throw new Error('no local executor for verb');
    }
  }

  _execute(verb, policy, args, cur, prov, nowMs) {
    if (policy.local) return this._local(verb, args, prov, nowMs);
    const at = new Date(nowMs).toISOString();
    const inj = this.inject[policy.injector];
    const p = { via: prov.via, cmdHash: prov.cmdHash, proof: prov.proof, operator: prov.operator };
    switch (verb) {
      case 'decision.answer': {
        const d = cur.d;
        const choice = args.choice !== null ? args.choice : (args.accept === 'recommended' ? d.recommendChoice : null);
        inj({ id: d.id, question: typeof d.question === 'string' ? d.question : '', choice, text: args.text, accept: args.accept, at }, p);
        return;
      }
      case 'decision.defer':
        inj({ id: cur.d.id, question: typeof cur.d.question === 'string' ? cur.d.question : '', at }, p);
        return;
      case 'hyperbrief.respond':
        inj({ decisionId: cur.d.id, branch: args.branch, note: args.note, at }, p);
        return;
      case 'selection.answer':
        inj({ promptId: cur.sel.promptId, selectedLabels: args.selected.slice(), issuer: cur.sel.issuer, at }, p);
        if (this.selections) this.selections.close(cur.sel.promptId);
        return;
      case 'prompt.send':
        inj({ target: args.target, text: args.text, at }, p);
        return;
      default:
        throw new Error('no executor for verb');
    }
  }
}

// 업링크가 «실행기를 못 세웠을» 때 — 받은 명령을 «전부 거절 + 감사» 해요(안전하게 틀려요).
function unavailableExecutor(auditFn, now, reason) {
  return {
    handle(c) {
      const out = { status: 'rejected', reason: reason || 'exec-unavailable', receipt: null };
      try { auditFn({ at: new Date(now()).toISOString(), cmdId: c.cmdId, verb: null, cmdHash8: 'unparsed', proof: kindOfProof(c.proof), acct: null, status: out.status, reason: out.reason }); } catch (_) { /* noop */ }
      return out;
    },
    close() {},
  };
}

// 던지지 않아요 — 못 세우면 한 줄 말하고 «전부 거절» 실행기를 돌려줘요.
function createExecutor(o) {
  try { return new Executor(o); } catch (e) {
    try { (o.log || (() => {}))('[uplink] 명령 실행 레인을 켜지 못했어요 — 받은 명령은 전부 거절해요: ' + String((e && e.message) || e).slice(0, 140)); } catch (_) { /* noop */ }
    return unavailableExecutor(o.audit || (() => {}), o.now || (() => Date.now()), 'exec-unavailable');
  }
}

module.exports = { createExecutor, Executor, SelectionTracker, VERBS, INJECTORS, NOTICERS, BRANCHES, ACCT_RE };

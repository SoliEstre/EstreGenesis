'use strict';
// state-root.cjs — `.ultrasafe/` 상태 저장소의 위치를 **한 곳에서** 정합니다.
//
// 왜 모듈인가 (2026-07-28 실측):
//   이 결정은 세 곳에 복제돼 있었어요 — MCP 서버 · PreToolUse 트리거 · Stop 훅. MCP 서버의
//   주석은 「앵커 규칙은 Stop 훅과 **글자 그대로 같아야** 해요. 다르면 한쪽이 쓰고 다른 쪽이
//   못 읽는 상태로 되돌아가요」라고 스스로 경고까지 했어요. 그런데 갈라진 건 그 주석이 이름
//   대지 않은 부분이었어요: **디렉터리를 걷는 함수는 셋 다 동일**했고, 그 **주변 우선순위
//   사슬**만 달랐어요. 훅 둘은 `CLAUDE_PROJECT_DIR` 을 먼저 봤고 MCP 서버는 안 봤어요.
//   `CLAUDE_PROJECT_DIR` 은 프로젝트 루트로 고정이라, 훅은 늘 바깥 저장소에 쓰고 MCP 는
//   호출 시점 cwd 를 따라갔어요. 두 저장소가 겹쳐 있으면(양쪽 다 `.git` 과 `.ultrasafe` 를
//   가지면) 그 차이가 곧 **분할된 원장**이에요 — 실측: 이벤트 28건이 한쪽에만 있었고 회차
//   기록은 다른 쪽에만 있었어요.
//
//   「같아야 한다」는 주석은 규율이지 기제가 아니에요. 규율은 그걸 강제하는 것이 없으면
//   사라져요. 그래서 사본을 지우고 이 모듈 하나로 만들었어요.
//
// 우선순위 (이 순서가 계약입니다):
//   1. ULTRASAFE_STATE_DIR — 저장소 디렉터리를 통째로 지정 (최종 결정권)
//   2. CLAUDE_PROJECT_DIR  — 하네스가 알려주는 프로젝트 루트. 호출 cwd 보다 안정적이에요
//   3. ULTRASAFE_REPO_ROOT — 명시 override
//   4. walkUp(cwd)         — `.ultrasafe/` 또는 `.git` 이 있는 가장 가까운 상위
//
// 겹친 저장소 주의: 4번은 **가장 가까운** 것을 고르므로, 저장소 안에 저장소가 있는 배치에서는
// 호출 위치가 목적지를 바꿔요. 그런 배치에서는 1번이나 2번으로 못박으세요. `findSplitStores()`
// 가 그 상황을 탐지해요 — 조용히 갈라지는 대신 이름을 대고 알리라고 있는 함수예요.

const fs = require('fs');
const path = require('path');

const MAX_DEPTH = 16;

/** `.ultrasafe/` 또는 `.git` 을 가진 가장 가까운 상위 디렉터리. 셋이 공유하던 원래 함수 그대로. */
function walkUp(startDir) {
  let dir = startDir || process.cwd();
  for (let i = 0; i < MAX_DEPTH; i++) {
    if (fs.existsSync(path.join(dir, '.git')) || fs.existsSync(path.join(dir, '.ultrasafe'))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return startDir || process.cwd();
}

/** 저장소 루트. 위 우선순위 2~4. */
function repoRoot(startDir) {
  return process.env.CLAUDE_PROJECT_DIR
    || process.env.ULTRASAFE_REPO_ROOT
    || walkUp(startDir || process.cwd());
}

/** `.ultrasafe/` 디렉터리. 우선순위 1이 여기서 이겨요. */
function stateDir(startDir) {
  return process.env.ULTRASAFE_STATE_DIR || path.join(repoRoot(startDir), '.ultrasafe');
}

/** `.ultrasafe/state.json` 전체 경로. */
function statePath(startDir) {
  return path.join(stateDir(startDir), 'state.json');
}

/** 어떤 규칙이 이겼는지 — 진단·검사용. 조용한 해소는 이 부류 사고의 출발점이에요. */
function resolution(startDir) {
  const source = process.env.ULTRASAFE_STATE_DIR ? 'ULTRASAFE_STATE_DIR'
    : process.env.CLAUDE_PROJECT_DIR ? 'CLAUDE_PROJECT_DIR'
      : process.env.ULTRASAFE_REPO_ROOT ? 'ULTRASAFE_REPO_ROOT'
        : 'walkUp(cwd)';
  return { source, repoRoot: repoRoot(startDir), stateDir: stateDir(startDir), statePath: statePath(startDir) };
}

/**
 * 해소된 저장소 **말고** 다른 `.ultrasafe/state.json` 이 근처에 있나.
 * 겹친 저장소 배치에서 원장이 갈리는 상황을 이름 대어 알리기 위한 탐지기예요.
 * 반환: 해소된 것을 제외한 경로 배열 (없으면 빈 배열).
 */
function findSplitStores(startDir) {
  const resolved = path.resolve(statePath(startDir));
  const found = [];
  const seen = new Set();
  // 해소 루트에서 아래로 한 겹(중첩 저장소)과 위로 몇 겹을 봐요 — 전 디스크 스캔은 안 해요.
  const roots = [repoRoot(startDir)];
  let up = repoRoot(startDir);
  for (let i = 0; i < 3; i++) { const p = path.dirname(up); if (p === up) break; up = p; roots.push(up); }
  for (const r of roots) {
    let entries = [];
    try { entries = fs.readdirSync(r, { withFileTypes: true }); } catch { continue; }
    const candidates = [path.join(r, '.ultrasafe', 'state.json')];
    for (const e of entries) {
      if (!e.isDirectory() || e.name === 'node_modules' || e.name === '.git') continue;
      candidates.push(path.join(r, e.name, '.ultrasafe', 'state.json'));
    }
    for (const c of candidates) {
      const abs = path.resolve(c);
      if (abs === resolved || seen.has(abs)) continue;
      seen.add(abs);
      if (fs.existsSync(abs)) found.push(abs);
    }
  }
  return found;
}

module.exports = { walkUp, repoRoot, stateDir, statePath, resolution, findSplitStores, MAX_DEPTH };

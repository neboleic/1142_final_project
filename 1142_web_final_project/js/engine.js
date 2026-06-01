// ══════════════════════════════════════════════════════
//  對話引擎
// ══════════════════════════════════════════════════════

const State = {
  index: 0,       // 當前對話索引
  affection: 0,   // 曖昧值：0 = 一般，1 = 曖昧
  gameResults: {}, // { 1: 'success'|'fail', 2: ..., ... }
  muted: false,
};

// DOM 元素
const sceneBg       = document.getElementById('scene-bg');
const charSprite    = document.getElementById('character-sprite');
const speakerBar    = document.getElementById('speaker-bar');
const speakerName   = document.getElementById('speaker-name');
const narrationBox  = document.getElementById('narration-box');
const narrationText = document.getElementById('narration-text');
const dialogText    = document.getElementById('dialog-text');
const choicesEl     = document.getElementById('choices');
const nextHint      = document.getElementById('next-hint');
const bgmEl         = document.getElementById('bgm');
const sfxEl         = document.getElementById('sfx');

// #region agent log
function _dbgLog(location, message, data, hypothesisId) {
  fetch('http://127.0.0.1:7727/ingest/997f5bb6-8c4b-4454-97a5-28e6ff80fd27', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '7dcc2f' },
    body: JSON.stringify({
      sessionId: '7dcc2f', runId: 'pre-fix', hypothesisId,
      location, message, data, timestamp: Date.now(),
    }),
  }).catch(() => {});
}
function _probeImage(src, label, hypothesisId) {
  const img = new Image();
  img.onload = () => _dbgLog('engine.js:probe', 'image load ok', {
    label, src, naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight,
  }, hypothesisId);
  img.onerror = () => _dbgLog('engine.js:probe', 'image load FAIL', { label, src }, hypothesisId);
  img.src = src;
}
// #endregion

// ── 初始化 ──────────────────────────────────────────
function init() {
  State.affection    = parseInt(localStorage.getItem('affection') || '0');
  State.index        = parseInt(localStorage.getItem('saveScene') || '0');
  State.gameResults  = JSON.parse(localStorage.getItem('gameResults') || '{}');

  // 接收遊戲結果
  const pendingGame  = localStorage.getItem('pendingGame');
  const pendingResult = localStorage.getItem('pendingResult');
  if (pendingGame && pendingResult) {
    State.gameResults[pendingGame] = pendingResult;
    localStorage.setItem('gameResults', JSON.stringify(State.gameResults));

    // 遊戲失敗直接壞結局（遊戲1、3）
    if (pendingResult === 'fail' && ['1','3'].includes(pendingGame)) {
      localStorage.removeItem('pendingGame');
      localStorage.removeItem('pendingResult');
      goEnding('bad');
      return;
    }
    localStorage.removeItem('pendingGame');
    localStorage.removeItem('pendingResult');
  }

  document.addEventListener('click', advance);
  document.addEventListener('keydown', e => {
    if (e.code === 'Space' || e.code === 'Enter') advance();
  });

  // #region agent log
  const rotateEl = document.getElementById('rotate-prompt');
  const dialogBg = document.getElementById('dialog-bg');
  const sceneStyles = sceneBg ? getComputedStyle(sceneBg) : null;
  _dbgLog('engine.js:init', 'viewport and layout', {
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    orientation: screen.orientation?.type || (window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'),
    rotatePromptDisplay: rotateEl ? getComputedStyle(rotateEl).display : null,
    dialogBgSrc: dialogBg?.src || null,
    sceneBgSize: sceneStyles?.backgroundSize,
    sceneBgImage: sceneStyles?.backgroundImage,
    href: location.href,
  }, 'A');
  _probeImage('public/dialog.png', 'scene-asset-dialog', 'B');
  _probeImage(dialogBg?.getAttribute('src') || 'public/menu.png', 'dialog-card-bg', 'C');
  _probeImage('public/kitchen.png', 'scene-asset-kitchen', 'D');
  // #endregion

  advance();
}

// ── 推進對話 ────────────────────────────────────────
function advance() {
  if (choicesEl.style.display !== 'none') return; // 等待選項
  showLine(State.index);
}

function showLine(idx) {
  if (idx >= DIALOGUE.length) return;

  const line = DIALOGUE[idx];

  // condition 檢查（只有曖昧值滿足才顯示）
  if (line.condition === 'affection' && State.affection < 1) {
    State.index++;
    showLine(State.index);
    return;
  }

  switch (line.type) {

    case 'scene':
      if (line.bg) {
        sceneBg.style.backgroundImage = `url('${line.bg}')`;
        // #region agent log
        requestAnimationFrame(() => {
          const cs = getComputedStyle(sceneBg);
          _dbgLog('engine.js:showLine:scene', 'scene bg applied', {
            bg: line.bg,
            backgroundSize: cs.backgroundSize,
            backgroundPosition: cs.backgroundPosition,
            sceneBgRect: sceneBg.getBoundingClientRect(),
          }, 'B');
        });
        _probeImage(line.bg, 'scene-bg-' + line.bg, 'D');
        // #endregion
      }
      if (line.character) {
        charSprite.src = line.character;
        charSprite.style.display = 'block';
      } else {
        charSprite.style.display = 'none';
      }
      if (line.bgm !== undefined) playBgm(line.bgm);
      State.index++;
      showLine(State.index);
      break;

    case 'sfx':
      if (line.src) playSfx(line.src);
      State.index++;
      showLine(State.index);
      break;

    case 'bgm':
      playBgm(line.src);
      State.index++;
      showLine(State.index);
      break;

    case 'narration':
      setNarration(line.text);
      State.index++;
      break;

    case 'thought':
      setDialogue('', `（${line.text}）`, true);
      State.index++;
      break;

    case 'dialogue':
      setDialogue(line.speaker, line.text, false);
      State.index++;
      break;

    case 'choice':
      showChoices(line.choices);
      break;

    case 'game':
      triggerGame(line.gameId, line.src);
      break;

    case 'ending':
      resolveEnding();
      break;
  }
}

// ── 畫面顯示輔助 ────────────────────────────────────
function setNarration(text) {
  narrationBox.style.display  = 'flex';
  speakerBar.style.display    = 'none';
  narrationText.textContent   = text;
  dialogText.textContent      = '';
  choicesEl.style.display     = 'none';
  nextHint.style.display      = 'block';
}

function setDialogue(speaker, text, isThought) {
  narrationBox.style.display = 'none';
  choicesEl.style.display    = 'none';
  nextHint.style.display     = 'block';

  if (speaker) {
    speakerBar.style.display = 'flex';
    speakerName.textContent  = speaker;
  } else {
    speakerBar.style.display = 'none';
  }

  dialogText.style.fontStyle = isThought ? 'italic' : 'normal';
  dialogText.textContent     = text;
}

function showChoices(choices) {
  narrationBox.style.display = 'none';
  speakerBar.style.display   = 'none';
  nextHint.style.display     = 'none';
  choicesEl.style.display    = 'flex';
  choicesEl.innerHTML        = '';

  choices.forEach(choice => {
    const btn = document.createElement('button');
    btn.className     = 'choice-btn';
    btn.textContent   = choice.text;
    btn.onclick = () => {
      if (choice.affection) State.affection += choice.affection;
      localStorage.setItem('affection', String(State.affection));
      choicesEl.style.display = 'none';
      nextHint.style.display  = 'block';
      State.index++;
      showLine(State.index);
    };
    choicesEl.appendChild(btn);
  });
}

// ── 小遊戲跳轉 ──────────────────────────────────────
function triggerGame(gameId, src) {
  document.removeEventListener('click', advance);
  localStorage.setItem('saveScene', String(State.index + 1));
  localStorage.setItem('pendingGame', String(gameId));
  localStorage.setItem('gameResults', JSON.stringify(State.gameResults));
  localStorage.setItem('affection', String(State.affection));
  window.location.href = src;
}

// ── 結局判斷 ────────────────────────────────────────
function resolveEnding() {
  const game5 = State.gameResults['5'];
  if (game5 === 'fail') {
    goEnding('bad');
  } else if (State.affection >= 1) {
    goEnding('love');
  } else {
    goEnding('good');
  }
}

function goEnding(type) {
  const map = { good: 'ending-good.html', bad: 'ending-bad.html', love: 'ending-love.html' };
  window.location.href = map[type];
}

// ── 音效 ────────────────────────────────────────────
function playBgm(src) {
  if (!src) { bgmEl.pause(); return; }
  bgmEl.src = src;
  bgmEl.play().catch(() => {});
}

function playSfx(src) {
  if (!src || State.muted) return;
  sfxEl.src = src;
  sfxEl.play().catch(() => {});
}

// ── HUD 功能 ────────────────────────────────────────
function toggleVolume() {
  State.muted = !State.muted;
  bgmEl.muted = State.muted;
  document.getElementById('hud-volume-icon').src = State.muted
    ? 'public/volume_button_close.png'
    : 'public/volume_button_open.png';
}

function toggleMenu() {
  const overlay = document.getElementById('menu-overlay');
  const isHidden = overlay.style.display === 'none';
  overlay.style.display = isHidden ? 'flex' : 'none';
  if (isHidden) {
    document.removeEventListener('click', advance);
  } else {
    document.addEventListener('click', advance);
  }
}

function saveGame() {
  localStorage.setItem('saveScene', String(State.index));
  localStorage.setItem('affection', String(State.affection));
  localStorage.setItem('gameResults', JSON.stringify(State.gameResults));
  alert('存檔成功！');
}

function backToTitle() {
  window.location.href = 'index.html';
}

// 啟動
init();

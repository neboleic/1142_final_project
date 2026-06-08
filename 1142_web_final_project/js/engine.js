// ══════════════════════════════════════════════════════
//  對話引擎
// ══════════════════════════════════════════════════════

const State = {
  index: 0,       // 當前對話索引
  affection: 0,   // 曖昧值：0 = 一般，1 = 曖昧
  gameResults: {}, // { 1: 'success'|'fail', 2: ..., ... }
  muted: false,
};

// ── 說話者 → 立繪對照表 ─────────────────────────────
const SPEAKER_SPRITE = {
  '許以安':    'public/figure_yian.png',
  '咖啡店老闆': 'public/figure_boss.png',
  '店長':      'public/figure_boss.png',
  '顧北辰':    'public/figure_man.png',
  '店員':      'public/figure_waitress.png',
};

function updateCharacterSprite(speaker) {
  const src = SPEAKER_SPRITE[speaker];
  if (src) {
    charSprite.src = src;
    charSprite.style.display = 'block';
  } else {
    charSprite.style.display = 'none';
  }
}

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

// ── 初始化 ──────────────────────────────────────────
function init() {
  State.affection    = parseInt(localStorage.getItem('affection') || '0');
  State.index        = parseInt(localStorage.getItem('saveScene') || '0');
  State.gameResults  = JSON.parse(localStorage.getItem('gameResults') || '{}');

  // 從小遊戲返回後還原 BGM（新頁面載入後 bgmEl 是空的）
  const savedBgm = localStorage.getItem('bgmSrc');
  if (savedBgm) {
    bgmEl.src = savedBgm;
    bgmEl.play().catch(() => {
      // autoplay 被擋：等使用者首次互動再播
      document.addEventListener('click', () => bgmEl.play().catch(() => {}), { once: true });
    });
  }

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

  // 所有按鈕點擊音效（capture 優先於 onclick，也涵蓋動態產生的選項按鈕）
  document.addEventListener('click', e => {
    if (e.target.closest('button')) playSfx('public/button_sound.mp3');
  }, true);

  _initVolumeSlider();
  syncCharacterToDialog();
  window.addEventListener('resize', syncCharacterToDialog);
  advance();
}

// ── 角色立繪定位：以對話框實際高度為錨點 ────────────────
function syncCharacterToDialog() {
  const dialogCard = document.getElementById('dialog-card');
  const charWrap   = document.getElementById('character-wrap');
  if (!dialogCard || !charWrap) return;
  const dialogH = dialogCard.getBoundingClientRect().height;
  // 讓人物底部稍微沉入對話框頂端（視覺上腳踩在框邊），可調整 overlap px
  const overlap = Math.round(dialogH * 0.08);
  charWrap.style.bottom = (dialogH - overlap) + 'px';
}

// ── 推進對話 ────────────────────────────────────────
function advance() {
  // 點擊時先關閉音量面板，不繼續推進
  const volPanel = document.getElementById('volume-panel');
  if (volPanel && volPanel.style.display !== 'none') {
    volPanel.style.display = 'none';
    return;
  }
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
        sceneBg.style.backgroundSize = 'cover';
        sceneBg.style.backgroundPosition = 'center';
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
      updateCharacterSprite('');   // 旁白無立繪
      setNarration(line.text);
      State.index++;
      break;

    case 'thought':
      updateCharacterSprite(line.speaker);  // 思考者立繪
      setDialogue('', `（${line.text}）`, true);
      State.index++;
      break;

    case 'dialogue':
      updateCharacterSprite(line.speaker);  // 說話者立繪
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
  narrationBox.style.display = 'none';
  speakerBar.style.display   = 'none';
  document.getElementById('dialog-content')?.classList.remove('has-speaker');
  dialogText.style.fontStyle = 'italic';
  dialogText.textContent     = text;
  choicesEl.style.display    = 'none';
  nextHint.style.display     = 'block';
}

function setDialogue(speaker, text, isThought) {
  narrationBox.style.display = 'none';
  choicesEl.style.display    = 'none';
  nextHint.style.display     = 'block';

  const dialogContent = document.getElementById('dialog-content');
  if (speaker) {
    speakerBar.style.display = 'flex';
    speakerName.textContent  = speaker;
    dialogContent?.classList.add('has-speaker');
  } else {
    speakerBar.style.display = 'none';
    dialogContent?.classList.remove('has-speaker');
  }

  dialogText.style.fontStyle = isThought ? 'italic' : 'normal';
  dialogText.textContent     = text;
}

function showChoices(choices) {
  narrationBox.style.display = 'none';
  speakerBar.style.display   = 'none';
  document.getElementById('dialog-content')?.classList.remove('has-speaker');
  nextHint.style.display     = 'none';
  choicesEl.style.display    = 'flex';
  choicesEl.innerHTML        = '';
  dialogText.textContent     = '';

  choices.forEach(choice => {
    const btn = document.createElement('button');
    btn.className     = 'choice-btn';
    btn.textContent   = choice.text;
    btn.onclick = (e) => {
      e.stopPropagation(); // 阻止點擊事件冒泡到 document 的 advance 監聽器
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
  // 劇本裡已有位置但遊戲尚未放入專案時，保留順序並自動通關。
  if (!src) {
    State.gameResults[String(gameId)] = 'success';
    State.index++;
    showLine(State.index);
    return;
  }
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
  const map = {
    good: 'js/ending/ending-good.html',
    bad: 'js/ending/ending-bad.html',
    love: 'js/ending/ending-love.html'
  };
  window.location.href = map[type];
}

// ── 音效 ────────────────────────────────────────────
function playBgm(src) {
  if (!src) {
    bgmEl.pause();
    localStorage.removeItem('bgmSrc');
    return;
  }
  localStorage.setItem('bgmSrc', new URL(src, window.location.href).href);  // 儲存供小遊戲返回後還原
  bgmEl.src = src;
  bgmEl.play().catch(() => {
    // autoplay 被擋：等使用者首次互動再播
    document.addEventListener('click', () => bgmEl.play().catch(() => {}), { once: true });
  });
}

function playSfx(src) {
  if (!src || State.muted) return;
  sfxEl.currentTime = 0;
  sfxEl.src = src;
  sfxEl.play().catch(() => {});
}

// ── HUD 功能 ────────────────────────────────────────
function toggleVolume() {
  const panel = document.getElementById('volume-panel');
  const isOpen = panel.style.display !== 'none';
  panel.style.display = isOpen ? 'none' : 'flex';
}

function _initVolumeSlider() {
  const slider = document.getElementById('volume-slider');
  const pctLabel = document.getElementById('vol-pct');
  if (!slider) return;

  slider.addEventListener('input', () => {
    const vol = slider.value / 100;
    bgmEl.volume = vol;
    sfxEl.volume = vol;
    State.muted = vol === 0;
    bgmEl.muted = State.muted;
    sfxEl.muted = State.muted;
    if (pctLabel) pctLabel.textContent = slider.value + '%';
    const icon = document.getElementById('hud-volume-icon');
    if (icon) icon.style.opacity = State.muted ? '0.35' : '1';
  });
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

function showToast(msg) {
  let toast = document.getElementById('game-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'game-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 2000);
}

function saveGame() {
  localStorage.setItem('saveScene', String(State.index));
  localStorage.setItem('affection', String(State.affection));
  localStorage.setItem('gameResults', JSON.stringify(State.gameResults));
  showToast('存 檔 成 功');
}

function backToTitle() {
  window.location.href = 'index.html';
}

// 啟動
init();

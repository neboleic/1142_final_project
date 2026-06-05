(function(){
"use strict";

const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');
const flash  = document.getElementById('flash-overlay');
const drawer = document.getElementById('drawer-anim');
const winScr = document.getElementById('win-screen');

// ── ⑤ BGM：從主線 localStorage 繼續播放 ─────────────────────────
(function initBgm() {
  const src = localStorage.getItem('bgmSrc');
  if (!src) return;
  const bgm = document.getElementById('game-bgm');
  bgm.src = src;
  bgm.volume = 0.8;
  bgm.play().catch(() => {
    document.addEventListener('click', () => bgm.play().catch(() => {}), { once: true });
  });
})();

// ── ① 開始引導覆蓋層 ─────────────────────────────────────────────
const startOverlay = document.getElementById('start-overlay');
function dismissStartOverlay() {
  if (!startOverlay) return;
  startOverlay.style.opacity = '0';
  startOverlay.style.transition = 'opacity 0.4s';
  setTimeout(() => { startOverlay.style.display = 'none'; }, 400);
}
startOverlay.addEventListener('click', dismissStartOverlay);
startOverlay.addEventListener('touchstart', dismissStartOverlay, { once: true });

// ── ④ 自製確認 Dialog ─────────────────────────────────────────────
const confirmOverlay = document.getElementById('confirm-overlay');
function showConfirm(onYes) {
  confirmOverlay.classList.add('show');
  document.getElementById('btn-confirm-yes').onclick = () => {
    confirmOverlay.classList.remove('show');
    onYes();
  };
  document.getElementById('btn-confirm-no').onclick = () => {
    confirmOverlay.classList.remove('show');
  };
}

// ── ② 失敗計數 DOM ────────────────────────────────────────────────
const failCountEl = document.getElementById('fail-count');
function updateFailDisplay(n) {
  if (!failCountEl) return;
  failCountEl.textContent = n;
  failCountEl.classList.remove('bump');
  void failCountEl.offsetWidth; // reflow to restart animation
  failCountEl.classList.add('bump');
  setTimeout(() => failCountEl.classList.remove('bump'), 300);
}

// ── Logical canvas size ───────────────────────────────────────────
const LW = 620, LH = 440;
let scale = 1;

function resize() {
  const mw = Math.min(window.innerWidth  - 16, 700);
  const mh = Math.min(window.innerHeight - 20, 520);
  scale = Math.min(mw / LW, mh / LH);
  canvas.width  = LW;
  canvas.height = LH;
  canvas.style.width  = (LW * scale) + 'px';
  canvas.style.height = (LH * scale) + 'px';
}
resize();
window.addEventListener('resize', resize);

const CORRIDOR = 32;   // passage width
const HITBOX_R = 4;
const TOUCH_OFFSET = 55;

// ── Track path points ─────────────────────────────────────────────
// All coordinates in logical 620×440 space.
const rawPts = [
  // ── Entry ──
  [  8, 220],   // START (left edge, mid-height)
  [ 60, 220],

  // ── Section A: left vertical snake (3 columns, 70 px apart) ──
  [ 60, 380],
  [ 95, 400],
  [130, 380],
  [130,  60],
  [165,  40],
  [200,  60],
  [200, 380],
  [235, 400],
  [270, 380],
  [270, 220],

  // ── Section B: diagonal zigzag ──
  [310, 380],
  [350,  60],
  [390, 380],

  // ── Section C: horizontal boustrophedon (42 px row spacing, no crossings) ──
  // Row spacing 42 px > CORRIDOR 32 px → tracks never overlap
  [608, 380],   // row 1 →
  [608, 338],
  [430, 338],   // row 2 ←
  [430, 296],
  [608, 296],   // row 3 →
  [608, 254],
  [430, 254],   // row 4 ←
  [430, 212],
  [608, 212],   // row 5 →
  [608, 170],
  [430, 170],   // row 6 ←
  [430, 128],
  [608, 128],   // row 7 →
  [608,  86],
  [430,  86],   // row 8 ←
  [430,  44],
  [608,  44],   // row 9 →

  // ── END ──
  [620,  44],   // END (right edge, top-right)
];

// Deduplicate consecutive identical points
const trackPts = [];
for (let i = 0; i < rawPts.length; i++) {
  const p = rawPts[i];
  if (i === 0 || p[0] !== rawPts[i-1][0] || p[1] !== rawPts[i-1][1]) {
    trackPts.push({x: p[0], y: p[1]});
  }
}

const START = trackPts[0];
const END   = trackPts[trackPts.length - 1];

function makePath(pts) {
  const p = new Path2D();
  p.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i].x + pts[i+1].x) / 2;
    const my = (pts[i].y + pts[i+1].y) / 2;
    p.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
  }
  p.lineTo(pts[pts.length-1].x, pts[pts.length-1].y);
  return p;
}
const trackPath = makePath(trackPts);

// ── Collision map ─────────────────────────────────────────────────
let colData;
function buildCollision() {
  const oc = document.createElement('canvas');
  oc.width = LW; oc.height = LH;
  const ox = oc.getContext('2d');
  ox.fillStyle = '#000';
  ox.fillRect(0, 0, LW, LH);
  ox.strokeStyle = '#fff';
  ox.lineWidth  = CORRIDOR;
  ox.lineCap    = 'round';
  ox.lineJoin   = 'round';
  ox.stroke(trackPath);
  colData = ox.getImageData(0, 0, LW, LH).data;
}
buildCollision();

function isWall(x, y) {
  const xi = Math.round(x), yi = Math.round(y);
  if (xi < 0 || xi >= LW || yi < 0 || yi >= LH) return true;
  return colData[(yi * LW + xi) * 4] < 128;
}
function hitTest(x, y) {
  if (isWall(x, y)) return true;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    if (isWall(x + Math.cos(a) * HITBOX_R, y + Math.sin(a) * HITBOX_R)) return true;
  }
  return false;
}

// ── Game state ────────────────────────────────────────────────────
let fails  = 0;
let active = false;
let dead   = false;
let won    = false;

let wx = START.x, wy = START.y;
let rx = START.x, ry = START.y;

let shimT = 0;

function dist(ax, ay, bx, by) { return Math.hypot(ax - bx, ay - by); }

function doFail() {
  if (dead) return;
  fails++;
  active = false;
  wx = START.x; wy = START.y;
  rx = START.x; ry = START.y;
  updateFailDisplay(fails);
  // 紅色閃爍提示（不使用 alert 阻塞）
  flash.style.background = 'rgba(255,0,0,0.35)';
  setTimeout(() => { flash.style.background = 'rgba(255,0,0,0)'; }, 220);
}

function doWin() {
  won = true; active = false; dead = true;
  setTimeout(() => {
    drawer.style.height = '55%';
    setTimeout(() => winScr.classList.add('show'), 900);
  }, 350);
}

// ── Input ─────────────────────────────────────────────────────────
function toLogical(cx, cy) {
  const r = canvas.getBoundingClientRect();
  return { x: (cx - r.left) / scale, y: (cy - r.top) / scale };
}

const GRAB_R = 18;

canvas.addEventListener('mousemove', e => {
  if (won) return;
  const {x, y} = toLogical(e.clientX, e.clientY);
  rx = x; ry = y;
  if (!active && dist(x, y, wx, wy) < GRAB_R) active = true;
});

canvas.addEventListener('mouseleave', () => {
  if (active) { active = false; wx = START.x; wy = START.y; rx = START.x; ry = START.y; }
});

function onTouchMove(e) {
  e.preventDefault();
  if (won) return;
  const t = e.touches[0];
  const {x, y} = toLogical(t.clientX, t.clientY);
  rx = x; ry = y - TOUCH_OFFSET;
  if (!active && dist(rx, ry, wx, wy) < GRAB_R + 10) active = true;
}
function onTouchEnd(e) {
  e.preventDefault();
  if (active) { active = false; wx = START.x; wy = START.y; rx = START.x; ry = START.y; }
}
canvas.addEventListener('touchstart',  onTouchMove, {passive: false});
canvas.addEventListener('touchmove',   onTouchMove, {passive: false});
canvas.addEventListener('touchend',    onTouchEnd,  {passive: false});
canvas.addEventListener('touchcancel', onTouchEnd,  {passive: false});

document.getElementById('key-container').addEventListener('click', () => {
  const main = document.getElementById('win-main');
  if (!main.classList.contains('reveal')) {
    main.classList.add('reveal');
    // 動畫播完後跳回主線
    setTimeout(() => {
      localStorage.setItem('pendingResult', 'success');
      window.location.href = '/scene';
    }, 900);
  }
});

document.getElementById('btn-giveup').addEventListener('click', () => {
  showConfirm(() => {
    localStorage.setItem('pendingResult', 'fail');
    window.location.href = '/scene';
  });
});

// ── Noise texture ─────────────────────────────────────────────────
const noiseC = document.createElement('canvas');
noiseC.width = noiseC.height = 128;
(function(){
  const nx = noiseC.getContext('2d');
  const id = nx.createImageData(128,128);
  for (let i = 0; i < id.data.length; i += 4) {
    const v = Math.random() * 40 | 0;
    id.data[i] = id.data[i+1] = id.data[i+2] = v;
    id.data[i+3] = 28;
  }
  nx.putImageData(id, 0, 0);
})();

// ── Draw ──────────────────────────────────────────────────────────
function drawBg() {
  // ── Floor: light honey oak ────────────────────────────────────────
  const bg = ctx.createLinearGradient(0, 0, LW * 0.6, LH);
  bg.addColorStop(0,    '#e4c06a');
  bg.addColorStop(0.4,  '#d0a040');
  bg.addColorStop(0.75, '#c49030');
  bg.addColorStop(1,    '#b07818');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, LW, LH);

  // Vertical plank grooves
  ctx.save();
  for (let x = 28; x < LW; x += 28) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, LH);
    ctx.strokeStyle = 'rgba(80,42,4,0.20)';
    ctx.lineWidth = 2; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + 2, 0); ctx.lineTo(x + 2, LH);
    ctx.strokeStyle = 'rgba(255,218,100,0.09)';
    ctx.lineWidth = 1; ctx.stroke();
  }
  // Horizontal wood grain lines
  for (let i = 0; i < 38; i++) {
    const y0 = 8 + i * 12;
    ctx.beginPath();
    ctx.moveTo(0, y0);
    ctx.bezierCurveTo(LW * .28, y0 + Math.sin(i * 2.1) * 2.5,
                      LW * .72, y0 - Math.sin(i * 1.7) * 2.0,
                      LW, y0 + Math.sin(i * 1.3) * 1.5);
    ctx.strokeStyle = `rgba(80,45,5,${0.038 + (i % 4 === 0 ? 0.02 : 0)})`;
    ctx.lineWidth = 0.65; ctx.stroke();
  }
  ctx.restore();

  // Noise
  ctx.save();
  ctx.fillStyle = ctx.createPattern(noiseC, 'repeat');
  ctx.globalAlpha = 0.14;
  ctx.fillRect(0, 0, LW, LH);
  ctx.globalAlpha = 1;
  ctx.restore();

  // Interior light & corner shadow
  const ilight = ctx.createRadialGradient(LW * .5, -30, 50, LW * .5, LH * .5, LH * .85);
  ilight.addColorStop(0,   'rgba(255,220,80,0.06)');
  ilight.addColorStop(0.4, 'rgba(0,0,0,0)');
  ilight.addColorStop(1,   'rgba(20,8,0,0.25)');
  ctx.fillStyle = ilight; ctx.fillRect(0, 0, LW, LH);

  // ── HUD bar ──────────────────────────────────────────────────────
  ctx.save();
  const hudG = ctx.createLinearGradient(0, 0, 0, 28);
  hudG.addColorStop(0, 'rgba(60,30,5,0.82)');
  hudG.addColorStop(1, 'rgba(45,20,3,0.68)');
  ctx.fillStyle = hudG;
  ctx.fillRect(0, 0, LW, 28);
  ctx.strokeStyle = 'rgba(170,120,30,0.28)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, 28); ctx.lineTo(LW, 28); ctx.stroke();

  ctx.font = 'italic 11px Georgia';
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillText('— 神 秘 木 盒 —', 13, 19);
  ctx.fillStyle = '#f0d070';           ctx.fillText('— 神 秘 木 盒 —', 12, 18);
  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(0,0,0,0.42)'; ctx.fillText('失敗：' + fails, LW - 11, 19);
  ctx.fillStyle = '#e0b050';           ctx.fillText('失敗：' + fails, LW - 12, 18);
  ctx.textAlign = 'center';
  ctx.font = '10px Georgia';
  const msg = active ? '小心前進…' : (won ? '通關！' : '將滑鼠/手指移到電棒上啟動');
  ctx.fillStyle = 'rgba(0,0,0,0.38)'; ctx.fillText(msg, LW / 2 + 1, 19);
  ctx.fillStyle = '#c09838';           ctx.fillText(msg, LW / 2, 18);
  ctx.restore();

  // ── Carved wooden rim ─────────────────────────────────────────────
  ctx.save();
  const R = 18;

  // Top rim
  const tRim = ctx.createLinearGradient(0, 0, 0, R * 2);
  tRim.addColorStop(0, '#4a2206'); tRim.addColorStop(0.45, '#8a5820');
  tRim.addColorStop(0.8, '#7a4812'); tRim.addColorStop(1, '#5a3008');
  ctx.fillStyle = tRim; ctx.fillRect(0, 0, LW, R * 2);

  // Bottom rim
  const bRim = ctx.createLinearGradient(0, LH - R * 2, 0, LH);
  bRim.addColorStop(0, '#5a3208'); bRim.addColorStop(0.5, '#7a4c14');
  bRim.addColorStop(1, '#2e1604');
  ctx.fillStyle = bRim; ctx.fillRect(0, LH - R * 2, LW, R * 2);

  // Left rim
  const lRim = ctx.createLinearGradient(0, 0, R * 2, 0);
  lRim.addColorStop(0, '#2e1604'); lRim.addColorStop(0.5, '#6a4010');
  lRim.addColorStop(1, '#4a2a08');
  ctx.fillStyle = lRim; ctx.fillRect(0, R * 2, R * 2, LH - R * 4);

  // Right rim
  const rRim = ctx.createLinearGradient(LW - R * 2, 0, LW, 0);
  rRim.addColorStop(0, '#6a4010'); rRim.addColorStop(0.5, '#7a5018');
  rRim.addColorStop(1, '#2e1604');
  ctx.fillStyle = rRim; ctx.fillRect(LW - R * 2, R * 2, R * 2, LH - R * 4);

  // Corner bracket decorations
  const nc = R * 2;
  [[0, 0], [LW - nc, 0], [0, LH - nc], [LW - nc, LH - nc]].forEach(([cx, cy]) => {
    const cg = ctx.createRadialGradient(cx + nc * .5, cy + nc * .5, 1,
                                        cx + nc * .5, cy + nc * .5, nc * .85);
    cg.addColorStop(0,   '#c08838');
    cg.addColorStop(0.5, '#8a5820');
    cg.addColorStop(1,   '#3a1e06');
    ctx.fillStyle = cg; ctx.fillRect(cx, cy, nc, nc);
    ctx.strokeStyle = 'rgba(200,150,50,0.38)';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(cx + 2, cy + 2, nc - 4, nc - 4);
    ctx.beginPath(); ctx.arc(cx + nc * .5, cy + nc * .5, 3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(50,20,3,0.45)'; ctx.fill();
  });

  // Carved diamond marks in rim
  ctx.strokeStyle = 'rgba(35,15,2,0.28)'; ctx.lineWidth = 1;
  for (let x = nc + 8; x < LW - nc - 4; x += 10) {
    ctx.beginPath();
    ctx.moveTo(x, 4); ctx.lineTo(x + 3, R); ctx.lineTo(x, R * 2 - 4); ctx.lineTo(x - 3, R);
    ctx.closePath(); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, LH - 4); ctx.lineTo(x + 3, LH - R); ctx.lineTo(x, LH - R * 2 + 4); ctx.lineTo(x - 3, LH - R);
    ctx.closePath(); ctx.stroke();
  }
  for (let y = nc + 8; y < LH - nc - 4; y += 10) {
    ctx.beginPath();
    ctx.moveTo(5, y); ctx.lineTo(R, y + 3); ctx.lineTo(R * 2 - 5, y); ctx.lineTo(R, y - 3);
    ctx.closePath(); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(LW - 5, y); ctx.lineTo(LW - R, y + 3); ctx.lineTo(LW - R * 2 + 5, y); ctx.lineTo(LW - R, y - 3);
    ctx.closePath(); ctx.stroke();
  }

  // Inner rim bevel
  ctx.strokeStyle = 'rgba(210,160,55,0.38)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(R * 2, R * 2, LW - R * 4, LH - R * 4);
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 2;
  ctx.strokeRect(R * 2 + 2, R * 2 + 2, LW - R * 4 - 4, LH - R * 4 - 4);

  // Outer edge shadow
  ctx.strokeStyle = 'rgba(0,0,0,0.85)';
  ctx.lineWidth = 5;
  ctx.strokeRect(0.5, 0.5, LW - 1, LH - 1);

  ctx.restore();
}

function drawTrack() {
  ctx.save();
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';

  ctx.strokeStyle = 'rgba(0,0,0,0.7)';
  ctx.lineWidth = CORRIDOR + 12; ctx.stroke(trackPath);

  ctx.strokeStyle = '#1a0e04';
  ctx.lineWidth = CORRIDOR + 2; ctx.stroke(trackPath);

  ctx.strokeStyle = '#251508';
  ctx.lineWidth = CORRIDOR; ctx.stroke(trackPath);

  ctx.strokeStyle = 'rgba(80,48,12,0.28)';
  ctx.lineWidth = CORRIDOR - 12; ctx.stroke(trackPath);

  ctx.strokeStyle = '#5a3a10'; ctx.lineWidth = CORRIDOR + 4;
  ctx.globalAlpha = 0.35; ctx.stroke(trackPath); ctx.globalAlpha = 1;

  ctx.strokeStyle = '#5a3008'; ctx.lineWidth = 5; ctx.stroke(trackPath);

  const wg = ctx.createLinearGradient(0, 0, LW, LH);
  wg.addColorStop(0,   '#b87030');
  wg.addColorStop(0.3, '#d09040');
  wg.addColorStop(0.6, '#b06020');
  wg.addColorStop(1,   '#986018');
  ctx.strokeStyle = wg; ctx.lineWidth = 3; ctx.stroke(trackPath);

  ctx.strokeStyle = 'rgba(255,200,100,0.15)'; ctx.lineWidth = 1.5; ctx.stroke(trackPath);

  ctx.restore();
}

function drawShimmer() {
  const sp = (Math.sin(shimT) * .5 + .5);
  const sg = ctx.createLinearGradient(0, 0, LW, LH);
  sg.addColorStop(Math.max(0,  sp - .12), 'rgba(255,210,80,0)');
  sg.addColorStop(sp,                     'rgba(255,210,80,0.26)');
  sg.addColorStop(Math.min(1,  sp + .12), 'rgba(255,210,80,0)');
  ctx.save();
  ctx.strokeStyle = sg; ctx.lineWidth = 4;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.stroke(trackPath);
  ctx.restore();
}

function drawStartEnd() {
  ctx.save();
  ctx.font = '14px serif';
  ctx.textAlign = 'center';
  ctx.shadowColor = '#c8a030'; ctx.shadowBlur = 8;
  ctx.fillText('🗝', START.x + 18, START.y - 20);
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#50d860';
  ctx.font = 'bold 9px monospace';
  ctx.shadowColor = '#50d860'; ctx.shadowBlur = 5;
  ctx.fillText('START', START.x + 14, START.y + 30);

  const eg = ctx.createRadialGradient(END.x, END.y, 2, END.x, END.y, 22);
  eg.addColorStop(0, 'rgba(220,160,0,0.7)');
  eg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = eg;
  ctx.beginPath(); ctx.arc(END.x, END.y, 22, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = '#e8c040';
  ctx.font = 'bold 9px monospace';
  ctx.shadowColor = '#e8c040'; ctx.shadowBlur = 6;
  ctx.fillText('END', END.x - 16, END.y - 10);
  ctx.restore();
}

function drawWand(x, y, lit) {
  ctx.save();

  if (lit) {
    const g1 = ctx.createRadialGradient(x, y, 0, x, y, 24);
    g1.addColorStop(0,   'rgba(140,210,255,0.65)');
    g1.addColorStop(0.5, 'rgba(60,150,255,0.35)');
    g1.addColorStop(1,   'rgba(0,60,200,0)');
    ctx.fillStyle = g1;
    ctx.beginPath(); ctx.arc(x, y, 24, 0, Math.PI * 2); ctx.fill();

    ctx.beginPath(); ctx.arc(x, y, 10, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(160,220,255,0.9)';
    ctx.lineWidth = 2; ctx.shadowColor = '#80c8ff'; ctx.shadowBlur = 10; ctx.stroke();
  } else {
    ctx.beginPath(); ctx.arc(x, y, 10, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(120,160,180,0.4)';
    ctx.lineWidth = 1.5; ctx.setLineDash([3,3]); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(140,180,200,0.5)';
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('hover', x, y + 22);
  }

  const g2 = ctx.createRadialGradient(x - 2, y - 2, 0.5, x, y, 7);
  if (lit) {
    g2.addColorStop(0,   '#ffffff');
    g2.addColorStop(0.4, '#a0d8ff');
    g2.addColorStop(1,   '#1850cc');
    ctx.shadowColor = '#4488ff'; ctx.shadowBlur = 14;
  } else {
    g2.addColorStop(0,   '#8899aa');
    g2.addColorStop(0.5, '#445566');
    g2.addColorStop(1,   '#223344');
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
  }
  ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2);
  ctx.fillStyle = g2; ctx.fill();

  ctx.restore();
}

// ── Main loop ─────────────────────────────────────────────────────
function loop() {
  shimT += 0.033;

  if (active && !dead) {
    wx = rx; wy = ry;
    if (hitTest(wx, wy)) doFail();
    else if (dist(wx, wy, END.x, END.y) < 22) doWin();
  }

  drawBg();
  drawTrack();
  drawShimmer();
  drawStartEnd();
  if (!won) drawWand(wx, wy, active);

  requestAnimationFrame(loop);
}

loop();

})();

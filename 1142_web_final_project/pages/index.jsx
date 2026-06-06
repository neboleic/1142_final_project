import Head from 'next/head';
import Script from 'next/script';

export default function TitleScreen() {
  return (
    <div id="page-root" className="title-screen">
      <Head>
        <title>逃婚門</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
      </Head>

      <div id="title-panel">
        <div id="title-wrap">
          <img id="title-logo" src="/title.png" alt="遊戲標題" />
          <div id="title-buttons">
            <button className="menu-btn" id="btn-start" onClick={() => { playBtnSound(); startGame(); }}>
              <img src="/button1.png" alt="" />
              <span>開始遊戲</span>
            </button>
            <button className="menu-btn" id="btn-continue" onClick={() => { playBtnSound(); continueGame(); }}>
              <img src="/button1.png" alt="" />
              <span>繼續遊戲</span>
            </button>
          </div>
        </div>
      </div>

      <button id="volume-btn" onClick={(e) => { toggleVolumePanel(); e.stopPropagation(); }}>
        <img id="volume-icon" src="/volume_button.png" alt="音效" />
      </button>

      <div id="volume-panel" style={{ display: 'none' }}>
        <span className="vol-label">音量</span>
        <input type="range" id="volume-slider" min="0" max="100" step="1" defaultValue="100"
               onClick={(e) => e.stopPropagation()} />
        <span className="vol-label" id="vol-pct">100%</span>
      </div>

      <audio id="bgm" src="/backing_sound.mp3" loop />
      <audio id="btn-sfx" src="/button_sound.mp3" />

      <Script id="title-script" strategy="afterInteractive">{`
        const bgm    = document.getElementById('bgm');
        const slider = document.getElementById('volume-slider');
        const pctEl  = document.getElementById('vol-pct');
        const icon   = document.getElementById('volume-icon');
        const panel  = document.getElementById('volume-panel');

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

        function playBtnSound() {
          const s = document.getElementById('btn-sfx');
          s.currentTime = 0;
          s.play().catch(() => {});
        }

        function toggleVolumePanel() {
          panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
        }

        document.addEventListener('click', () => {
          if (panel.style.display !== 'none') panel.style.display = 'none';
        });

        slider.addEventListener('input', () => {
          const vol = slider.value / 100;
          bgm.volume = vol;
          bgm.muted  = vol === 0;
          pctEl.textContent = slider.value + '%';
          icon.style.opacity = vol === 0 ? '0.35' : '1';
        });

        function startGame() {
          localStorage.clear();
          localStorage.setItem('affection', '0');
          window.location.href = '/scene';
        }

        function continueGame() {
          const saved = localStorage.getItem('saveScene');
          if (saved) {
            window.location.href = '/scene';
          } else {
            showToast('沒 有 存 檔 紀 錄');
          }
        }

        document.addEventListener('click', () => {
          if (bgm.paused) bgm.play().catch(() => {});
        }, { once: true });
      `}</Script>
    </div>
  );
}

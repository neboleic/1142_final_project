import Head from 'next/head';
import Script from 'next/script';

export default function ScenePage() {
  return (
    <div id="page-root" className="game-screen">
      <Head>
        <title>逃婚門</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
      </Head>

      <div id="scene-bg"></div>

      <div id="character-wrap">
        <img id="character-sprite" src="" alt="" style={{ display: 'none' }} />
      </div>

      <div id="dialog-card">
        <div id="dialog-content" className="has-speaker">
          <div id="speaker-bar" style={{ display: 'flex' }}>
            <span id="speaker-name">店員</span>
          </div>
          <div id="narration-box" style={{ display: 'none' }}>
            <p id="narration-text"></p>
          </div>
          <p id="dialog-text">對話對話</p>
          <div id="choices" style={{ display: 'none' }}></div>
          <div id="next-hint" className="blink">▼</div>
        </div>
      </div>

      <div id="hud">
        <button id="hud-menu" onClick={() => toggleMenu()}>
          <img src="/menu_button.png" alt="選單" />
        </button>
        <button id="hud-volume" onClick={(e) => { toggleVolume(); e.stopPropagation(); }}>
          <img id="hud-volume-icon" src="/volume_button.png" alt="音效" />
        </button>
      </div>

      <div id="volume-panel" style={{ display: 'none' }}>
        <span className="vol-label">音量</span>
        <input type="range" id="volume-slider" min="0" max="100" step="1" defaultValue="100"
               onClick={(e) => e.stopPropagation()} />
        <span className="vol-label" id="vol-pct">100%</span>
      </div>

      <div id="menu-overlay" style={{ display: 'none' }}>
        <div id="menu-panel">
          <img src="/menu.png" alt="" />
          <div id="menu-items">
            <button className="menu-btn" onClick={() => toggleMenu()}>
              <img src="/menu_selec.png" alt="" /><span>繼續</span>
            </button>
            <button className="menu-btn" onClick={() => saveGame()}>
              <img src="/menu_selec.png" alt="" /><span>存檔</span>
            </button>
            <button className="menu-btn" onClick={() => backToTitle()}>
              <img src="/menu_selec.png" alt="" /><span>回標題</span>
            </button>
          </div>
        </div>
      </div>

      <audio id="bgm" loop />
      <audio id="sfx" />

      <Script
        src="/js/dialogueData.js"
        strategy="afterInteractive"
        onLoad={() => {
          const s = document.createElement('script');
          s.src = '/js/engine.js';
          document.body.appendChild(s);
        }}
      />
    </div>
  );
}

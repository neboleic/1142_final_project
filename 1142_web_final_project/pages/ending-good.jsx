import Head from 'next/head';
import Script from 'next/script';

export default function EndingGood() {
  return (
    <div id="page-root" className="ending-page ending-good">
      <Head>
        <title>好結局｜逃婚門</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
      </Head>
      <div className="ending-scrim" aria-hidden="true"></div>
      <div className="ending-content">
        <img className="ending-img" src="/ending_good.png" alt="好結局" />
        <div className="ending-desc-box">
          <div className="ending-title">✦ 好結局 ✦</div>
          <p className="ending-desc">
            許以安成功拿到大門鑰匙，<br />
            騎著偉士牌機車逃出生天，重獲自由！
          </p>
        </div>
        <button
          className="menu-btn ending-btn"
          onClick={() => { playBtnSound(); window.location.href = '/'; }}
        >
          <img src="/button1.png" alt="" />
          <span>回到標題</span>
        </button>
      </div>
      <audio id="btn-sfx" src="/button_sound.mp3" />
      <Script id="ending-good-script" strategy="afterInteractive">{`
        function playBtnSound() {
          const s = document.getElementById('btn-sfx');
          s.currentTime = 0;
          s.play().catch(() => {});
        }
      `}</Script>
    </div>
  );
}

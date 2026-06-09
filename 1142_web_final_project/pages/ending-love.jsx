import Head from 'next/head';
import Script from 'next/script';

export default function EndingLove() {
  return (
    <div id="page-root" className="ending-page ending-love">
      <Head>
        <title>真愛結局｜逃婚門</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
      </Head>
      <div className="ending-scrim" aria-hidden="true"></div>
      <div className="ending-content">
        <img className="ending-img" src="/ending_love.png" alt="真愛結局" />
        <div className="ending-desc-box">
          <div className="ending-title">✦ 真愛結局 ✦</div>
          <p className="ending-desc">
            店員揭曉身分——五年前的高中同學。<br />
            你帶著項鍊，與她一起消失在夜色中。
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
      <Script id="ending-love-script" strategy="afterInteractive">{`
        function playBtnSound() {
          const s = document.getElementById('btn-sfx');
          s.currentTime = 0;
          s.play().catch(() => {});
        }
      `}</Script>
    </div>
  );
}

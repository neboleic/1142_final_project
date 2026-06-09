import Head from 'next/head';
import Script from 'next/script';

export default function EndingBad() {
  return (
    <div id="page-root" className="ending-page ending-bad">
      <Head>
        <title>壞結局｜逃婚門</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
      </Head>
      <div className="ending-scrim" aria-hidden="true"></div>
      <div className="ending-content">
        <img className="ending-img" src="/ending_bad.png" alt="壞結局" />
        <div className="ending-desc-box">
          <div className="ending-title">✦ 壞結局 ✦</div>
          <p className="ending-desc">
            被顧北辰發現。<br />
            你被迫抓回去聽他講了整整三個小時的霸總語錄，<br />
            精神崩潰。
          </p>
        </div>
        <button
          className="menu-btn ending-btn"
          onClick={() => { playBtnSound(); window.location.href = '/'; }}
        >
          <img src="/button1.png" alt="" />
          <span>再試一次</span>
        </button>
      </div>
      <audio id="btn-sfx" src="/button_sound.mp3" />
      <Script id="ending-bad-script" strategy="afterInteractive">{`
        function playBtnSound() {
          const s = document.getElementById('btn-sfx');
          s.currentTime = 0;
          s.play().catch(() => {});
        }
      `}</Script>
    </div>
  );
}

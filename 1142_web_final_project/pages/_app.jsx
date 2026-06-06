import '../styles/globals.css';

export default function App({ Component, pageProps }) {
  return (
    <>
      <div id="rotate-prompt">
        <p>請將手機橫置以獲得最佳體驗</p>
        <div className="rotate-icon">⟳</div>
      </div>
      <Component {...pageProps} />
    </>
  );
}

export default function Installation() {
  return (
    <div className="page prose">
      <h1>Installation</h1>
      <p>
        WOW-Toon-Data is a Progressive Web App (PWA), so you can install it to your device and
        launch it like a native app — no app store required. (Installability ships in a later
        milestone; the steps below are how it will work.)
      </p>

      <h2>Desktop — Chrome / Edge</h2>
      <ol>
        <li>Open the app in your browser.</li>
        <li>
          Click the <strong>install icon</strong> in the address bar (a monitor with a down arrow),
          or open the browser menu and choose <strong>Install WOW-Toon-Data</strong>.
        </li>
        <li>Confirm. The app opens in its own window and is added to your applications.</li>
      </ol>

      <h2>iPhone / iPad — Safari</h2>
      <ol>
        <li>Open the app in Safari.</li>
        <li>
          Tap the <strong>Share</strong> button, then <strong>Add to Home Screen</strong>.
        </li>
        <li>Tap <strong>Add</strong>. The icon appears on your home screen.</li>
      </ol>

      <h2>Android — Chrome</h2>
      <ol>
        <li>Open the app in Chrome.</li>
        <li>
          Tap the menu (⋮), then <strong>Add to Home screen</strong> or <strong>Install app</strong>.
        </li>
        <li>Confirm to add it to your home screen.</li>
      </ol>

      <p className="muted">
        Once installed, the app works from your home screen or app launcher and keeps you logged in.
      </p>
    </div>
  );
}

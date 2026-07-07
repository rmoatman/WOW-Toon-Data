import { useEffect, useState } from 'react';

/**
 * One-click PWA install button. Captures the browser's `beforeinstallprompt`
 * event and fires it on click. The event only fires when the app meets install
 * criteria (manifest + service worker over HTTPS) and isn't already installed,
 * so until the PWA milestone lands the button stays disabled with a hint to use
 * the manual steps. iOS Safari never fires it — the Safari steps cover that.
 */
export default function InstallButton() {
  const [promptEvent, setPromptEvent] = useState(null);
  const [installed, setInstalled] = useState(
    typeof window !== 'undefined' &&
      window.matchMedia?.('(display-mode: standalone)').matches
  );

  useEffect(() => {
    const onPrompt = (e) => {
      e.preventDefault(); // stash it so we can trigger the prompt on demand
      setPromptEvent(e);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const install = async () => {
    if (!promptEvent) return;
    promptEvent.prompt();
    await promptEvent.userChoice;
    setPromptEvent(null); // a prompt can only be used once
  };

  if (installed) {
    return <p className="install-status muted">✓ This app is already installed on this device.</p>;
  }

  return (
    <div className="install-cta">
      <button type="button" className="btn-primary" onClick={install} disabled={!promptEvent}>
        Install app
      </button>
      {!promptEvent && (
        <p className="muted install-hint">
          If this button is inactive, your browser doesn't offer one-click install here (or the app
          is already installed) — follow the steps below for your platform.
        </p>
      )}
    </div>
  );
}

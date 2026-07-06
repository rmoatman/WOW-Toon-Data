import { useEffect, useState } from 'react';
import { getHealth } from './api.js';

export default function App() {
  const [health, setHealth] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getHealth()
      .then(setHealth)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>WOW-Toon-Data</h1>
        <p className="tagline">
          Achievements &amp; quests across all your World of Warcraft characters.
        </p>
      </header>

      <main className="app-main">
        <section className="card">
          <h2>Milestone 1 — Scaffold</h2>
          <p>The monorepo is up: React + Vite client talking to the Express API.</p>

          <div className="status">
            <span className="status-label">API status:</span>
            {error && <span className="status-bad">unreachable ({error})</span>}
            {!error && !health && <span className="status-muted">checking…</span>}
            {health && (
              <span className="status-good">
                {health.status} · db: {health.db} · up {health.uptime}s
              </span>
            )}
          </div>
        </section>
      </main>

      <footer className="app-footer">
        <span>Powered by the Blizzard API — unofficial portfolio project.</span>
      </footer>
    </div>
  );
}

import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getHealth } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Home() {
  const { user } = useAuth();
  const [health, setHealth] = useState(null);

  useEffect(() => {
    getHealth().then(setHealth).catch(() => setHealth({ status: 'unreachable' }));
  }, []);

  return (
    <div className="page home">
      <section className="hero">
        <h1>
          Track every achievement and quest,<br />across every character.
        </h1>
        <p className="muted">
          WOW-Toon-Data pulls your World of Warcraft roster from the Blizzard API and lets you
          search and sort your combined accomplishments in one place.
        </p>
        <div className="hero-cta">
          {user ? (
            <Link to="/dashboard" className="btn-primary">
              Go to your characters
            </Link>
          ) : (
            <>
              <Link to="/register" className="btn-primary">
                Get started
              </Link>
              <Link to="/login" className="btn-secondary">
                Log in
              </Link>
            </>
          )}
        </div>
      </section>

      <section className="feature-grid">
        <div className="feature">
          <h3>Character detail</h3>
          <p>Image, stats, achievements, and completed quests for each toon.</p>
        </div>
        <div className="feature">
          <h3>Combined achievements</h3>
          <p>Sort and search across all characters; see who's earned what.</p>
        </div>
        <div className="feature">
          <h3>Combined quests</h3>
          <p>Find any quest and the characters who've completed it.</p>
        </div>
      </section>

      {health && (
        <p className="api-badge">
          API: <span className={health.status === 'ok' ? 'status-good' : 'status-bad'}>{health.status}</span>
          {health.db ? ` · db: ${health.db}` : ''}
        </p>
      )}
    </div>
  );
}

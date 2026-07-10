import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getHealth } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { SITE } from '../config.js';

// Feature cards link to their section. Collections tabs (mounts/pets/toys) all
// live on /collections.
const FEATURES = [
  { title: 'Character detail', blurb: 'Image, stats, achievements, and completed quests for each toon.', to: '/dashboard' },
  { title: 'Combined achievements', blurb: "Sort and search across all characters; see who's earned what.", to: '/achievements' },
  { title: 'Combined quests', blurb: "Find any quest and the characters who've completed it.", to: '/quests' },
  { title: 'Mounts', blurb: "Browse your whole account's mount collection with hover-to-zoom art.", to: '/collections' },
  { title: 'Pets', blurb: "Every battle pet you've collected — level, quality, and nickname.", to: '/collections' },
  { title: 'Toys', blurb: 'Your full toy box, names and icons pulled straight from the API.', to: '/collections' },
];

export default function Home() {
  const { user, demoLogin } = useAuth();
  const navigate = useNavigate();
  const [health, setHealth] = useState(null);
  const [demoBusy, setDemoBusy] = useState(false);

  useEffect(() => {
    getHealth().then(setHealth).catch(() => setHealth({ status: 'unreachable' }));
  }, []);

  const tryDemo = async () => {
    setDemoBusy(true);
    try {
      await demoLogin();
      navigate('/dashboard');
    } catch {
      setDemoBusy(false);
    }
  };

  return (
    <div className="page home">
      <section className="hero">
        <h1>
          Every achievement, quest, and collection,<br />across every character.
        </h1>
        <p className="muted">
          {SITE.name} pulls your World of Warcraft roster from the Blizzard API and brings your
          accomplishments — plus your account-wide mounts, pets, and toys — together in one place
          you can search and sort.
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
              <button type="button" className="btn-secondary" onClick={tryDemo} disabled={demoBusy}>
                {demoBusy ? 'Loading…' : 'Explore the demo'}
              </button>
              <Link to="/login" className="btn-secondary">
                Log in
              </Link>
            </>
          )}
        </div>
      </section>

      <section className="feature-grid">
        {FEATURES.map((f) => (
          <Link key={f.title} to={f.to} className="feature">
            <h3>{f.title}</h3>
            <p>{f.blurb}</p>
          </Link>
        ))}
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

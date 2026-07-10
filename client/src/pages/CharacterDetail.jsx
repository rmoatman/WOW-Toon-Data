import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { charactersApi } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import DataTable from '../components/DataTable.jsx';
import { formatDate } from '../util/format.js';

const ACH_COLUMNS = [
  { key: 'name', label: 'Achievement', sortable: true },
  {
    key: 'completedAt',
    label: 'Completed',
    sortable: true,
    className: 'col-center',
    render: (v) => formatDate(v),
  },
];

const QUEST_COLUMNS = [{ key: 'name', label: 'Quest', sortable: true }];

export default function CharacterDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [character, setCharacter] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [quests, setQuests] = useState([]);
  const [tab, setTab] = useState('achievements');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [syncing, setSyncing] = useState(false);

  const loadAll = useCallback(async () => {
    const [c, a, q] = await Promise.all([
      charactersApi.get(id),
      charactersApi.achievements(id),
      charactersApi.quests(id),
    ]);
    setCharacter(c.character);
    setAchievements(a.achievements || []);
    setQuests(q.quests || []);
  }, [id]);

  useEffect(() => {
    setLoading(true);
    loadAll()
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [loadAll]);

  const sync = async () => {
    setSyncing(true);
    setError(null);
    try {
      await charactersApi.syncOne(id);
      await loadAll();
    } catch (err) {
      setError(err.message);
    } finally {
      setSyncing(false);
    }
  };

  if (loading) return <div className="page-loading">Loading…</div>;
  if (error && !character) {
    return (
      <div className="page">
        <p className="form-error">{error}</p>
        <Link to="/dashboard" className="btn-secondary">
          Back to characters
        </Link>
      </div>
    );
  }
  if (!character) return null;

  const c = character;
  // main-raw is high-res (1600x1200); in a portrait box it shows the full
  // character height crisply. Fall back to the framed inset, then the avatar.
  const image = c.mainImageUrl || c.insetImageUrl || c.renderImageUrl;

  return (
    <div className="page">
      <Link to="/dashboard" className="back-link">
        ← Characters
      </Link>

      <div className="detail-top">
        <div className="hero-portrait">
          {image ? <img src={image} alt={c.name} /> : <span className="avatar-fallback">{c.name.charAt(0)}</span>}
        </div>

        <section className={`character-hero card ${c.faction?.toLowerCase() === 'horde' ? 'faction-horde' : c.faction?.toLowerCase() === 'alliance' ? 'faction-alliance' : ''}`}>
        <div className="hero-info">
          <h1>{c.name}</h1>
          {c.titleName && <p className="hero-title muted">{c.titleName}</p>}
          <p className="hero-line">
            Level {c.level} {c.raceName} {c.className}
          </p>
          <p className="hero-line muted">
            {c.realmName || c.realmSlug}
            {c.faction ? ` · ${c.faction}` : ''}
            {c.guildName ? ` · <${c.guildName}>` : ''}
          </p>

          {c.profileAvailable === false ? (
            <p className="character-note">
              Blizzard has no profile data for this character yet — log in on it in-game, then Sync.
            </p>
          ) : (
            <div className="hero-stats">
              {c.itemLevel ? (
                <div className="stat">
                  <span className="stat-value">{c.itemLevel}</span>
                  <span className="stat-label">Item level</span>
                </div>
              ) : null}
              <div className="stat">
                <span className="stat-value">{c.achievementPoints ?? '—'}</span>
                <span className="stat-label">Ach. points</span>
              </div>
              <div className="stat">
                <span className="stat-value">{c.achievementCount.toLocaleString()}</span>
                <span className="stat-label">Achievements</span>
              </div>
              <div className="stat">
                <span className="stat-value">{c.questCount.toLocaleString()}</span>
                <span className="stat-label">Quests</span>
              </div>
            </div>
          )}
        </div>
        <div className="hero-actions">
          {!user?.isDemo && (
            <button type="button" className="btn-secondary" onClick={sync} disabled={syncing}>
              {syncing ? 'Syncing…' : 'Sync'}
            </button>
          )}
          {c.lastDeepSyncedAt && (
            <span className="muted last-sync">Synced {formatDate(c.lastDeepSyncedAt)}</span>
          )}
        </div>
        </section>
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="tabs">
        <button
          type="button"
          className={tab === 'achievements' ? 'tab active' : 'tab'}
          onClick={() => setTab('achievements')}
        >
          Achievements ({c.achievementCount.toLocaleString()})
        </button>
        <button
          type="button"
          className={tab === 'quests' ? 'tab active' : 'tab'}
          onClick={() => setTab('quests')}
        >
          Quests ({c.questCount.toLocaleString()})
        </button>
      </div>

      {tab === 'achievements' ? (
        <DataTable
          items={achievements}
          columns={ACH_COLUMNS}
          searchKeys={['name']}
          searchPlaceholder="Search this character's achievements…"
          initialSort={{ key: 'completedAt', dir: 'desc' }}
          emptyText="No achievements synced for this character."
        />
      ) : (
        <DataTable
          items={quests}
          columns={QUEST_COLUMNS}
          searchKeys={['name']}
          searchPlaceholder="Search this character's quests…"
          initialSort={{ key: 'name', dir: 'asc' }}
          emptyText="No completed quests synced for this character."
        />
      )}
    </div>
  );
}

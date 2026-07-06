import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { blizzardApi, charactersApi, syncApi } from '../api.js';
import CharacterCard from '../components/CharacterCard.jsx';

const LINK_ERRORS = {
  state_mismatch: 'Security check failed. Please try connecting again.',
  bad_state: 'The link request expired. Please try again.',
  sync_failed: 'Connected, but importing your roster failed. Try Sync now.',
  missing_code: 'Battle.net did not return an authorization code.',
  access_denied: 'You declined the Battle.net authorization.',
};

export default function Dashboard() {
  const { setUser } = useAuth();
  const [params, setParams] = useSearchParams();

  const [status, setStatus] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState(null);
  const [busy, setBusy] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const autoSyncedRef = useRef(false);

  const loadCharacters = useCallback(async () => {
    const chars = await charactersApi.list();
    setCharacters(chars.characters || []);
    return chars.characters || [];
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [st] = await Promise.all([blizzardApi.status(), loadCharacters()]);
      setStatus(st);
    } catch (err) {
      setBanner({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  }, [loadCharacters]);

  useEffect(() => {
    load();
  }, [load]);

  // Auto-sync stale characters once per visit (update-on-access), then refresh.
  useEffect(() => {
    if (loading || autoSyncedRef.current) return;
    if (!status?.linked) return;
    autoSyncedRef.current = true;
    (async () => {
      setSyncing(true);
      try {
        const res = await syncApi.all(false);
        if (res.synced > 0) await loadCharacters();
      } catch {
        /* non-fatal; manual Sync now is available */
      } finally {
        setSyncing(false);
      }
    })();
  }, [loading, status, loadCharacters]);

  // Banner from the OAuth callback redirect.
  useEffect(() => {
    const linked = params.get('linked');
    if (!linked) return;
    if (linked === 'success') {
      const n = params.get('imported');
      setBanner({ type: 'success', text: `Battle.net connected — imported ${n || 0} characters.` });
      setUser((u) => (u ? { ...u, battlenetLinked: true } : u));
    } else if (linked === 'error') {
      setBanner({ type: 'error', text: LINK_ERRORS[params.get('reason')] || 'Could not connect Battle.net.' });
    }
    params.delete('linked');
    params.delete('imported');
    params.delete('reason');
    setParams(params, { replace: true });
  }, [params, setParams, setUser]);

  const connect = async () => {
    setBusy(true);
    try {
      const { url } = await blizzardApi.authorize();
      window.location.href = url;
    } catch (err) {
      setBanner({ type: 'error', text: err.message });
      setBusy(false);
    }
  };

  // Full refresh: pull any new characters (roster) then deep-sync everything.
  const syncNow = async () => {
    setBusy(true);
    setSyncing(true);
    setBanner(null);
    try {
      await blizzardApi.resync().catch(() => null); // roster; ok if token expired
      const res = await syncApi.all(true);
      await load();
      setBanner({ type: 'success', text: `Synced ${res.synced} characters.` });
    } catch (err) {
      setBanner({ type: 'error', text: err.message });
    } finally {
      setBusy(false);
      setSyncing(false);
    }
  };

  const unlink = async () => {
    setBusy(true);
    try {
      await blizzardApi.unlink();
      setUser((u) => (u ? { ...u, battlenetLinked: false, battletag: null } : u));
      await load();
      setBanner({ type: 'success', text: 'Battle.net disconnected.' });
    } catch (err) {
      setBanner({ type: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  };

  const linked = status?.linked;

  return (
    <div className="page">
      <div className="page-head">
        <h1>Your characters</h1>
        {syncing && <span className="sync-pill">Syncing…</span>}
      </div>

      {banner && <p className={banner.type === 'success' ? 'form-success' : 'form-error'}>{banner.text}</p>}

      {loading ? (
        <p className="muted">Loading…</p>
      ) : (
        <>
          <section className="card connect-card">
            {!status?.configured && (
              <p className="muted">
                The server isn't configured with Blizzard API credentials yet, so linking is
                unavailable.
              </p>
            )}

            {status?.configured && !linked && (
              <>
                <h2>Connect Battle.net</h2>
                <p className="muted">
                  Authorize with your Battle.net account (US region) to import your character
                  roster. We never see your Blizzard password.
                </p>
                <button type="button" className="btn-primary" onClick={connect} disabled={busy}>
                  {busy ? 'Redirecting…' : 'Connect Battle.net'}
                </button>
              </>
            )}

            {status?.configured && linked && (
              <div className="linked-row">
                <div>
                  <span className="muted">Connected as</span>{' '}
                  <strong>{status.battletag || 'Battle.net'}</strong>
                </div>
                <div className="linked-actions">
                  <button type="button" className="btn-secondary" onClick={syncNow} disabled={busy}>
                    {busy ? 'Working…' : 'Sync now'}
                  </button>
                  <button type="button" className="btn-danger" onClick={unlink} disabled={busy}>
                    Disconnect
                  </button>
                </div>
              </div>
            )}
          </section>

          {characters.length > 0 ? (
            <section className="roster-grid">
              {characters.map((c) => (
                <CharacterCard key={c.id} character={c} />
              ))}
            </section>
          ) : (
            linked && <p className="muted">No characters found on this account yet.</p>
          )}
        </>
      )}
    </div>
  );
}

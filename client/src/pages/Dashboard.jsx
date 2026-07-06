import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { blizzardApi, charactersApi } from '../api.js';
import CharacterCard from '../components/CharacterCard.jsx';

const LINK_ERRORS = {
  state_mismatch: 'Security check failed. Please try connecting again.',
  bad_state: 'The link request expired. Please try again.',
  sync_failed: 'Connected, but importing your roster failed. Try Re-sync.',
  missing_code: 'Battle.net did not return an authorization code.',
  access_denied: 'You declined the Battle.net authorization.',
};

export default function Dashboard() {
  const { user, setUser } = useAuth();
  const [params, setParams] = useSearchParams();

  const [status, setStatus] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [st, chars] = await Promise.all([blizzardApi.status(), charactersApi.list()]);
      setStatus(st);
      setCharacters(chars.characters || []);
    } catch (err) {
      setBanner({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Show a banner based on the ?linked=... redirect from the OAuth callback.
  useEffect(() => {
    const linked = params.get('linked');
    if (!linked) return;
    if (linked === 'success') {
      const n = params.get('imported');
      setBanner({ type: 'success', text: `Battle.net connected — imported ${n || 0} characters.` });
      setUser((u) => (u ? { ...u, battlenetLinked: true } : u));
    } else if (linked === 'error') {
      const reason = params.get('reason');
      setBanner({ type: 'error', text: LINK_ERRORS[reason] || 'Could not connect Battle.net.' });
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
      window.location.href = url; // hand off to Battle.net
    } catch (err) {
      setBanner({ type: 'error', text: err.message });
      setBusy(false);
    }
  };

  const resync = async () => {
    setBusy(true);
    setBanner(null);
    try {
      const res = await blizzardApi.resync();
      await load();
      setBanner({ type: 'success', text: `Re-synced — ${res.imported} characters.` });
    } catch (err) {
      setBanner({ type: 'error', text: err.message });
    } finally {
      setBusy(false);
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
      <h1>Your characters</h1>

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
                  <button type="button" className="btn-secondary" onClick={resync} disabled={busy}>
                    {busy ? 'Working…' : 'Re-sync'}
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

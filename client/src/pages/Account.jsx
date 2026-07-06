import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Account() {
  const { user, deleteAccount } = useAuth();
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const onDelete = async () => {
    setError(null);
    setBusy(true);
    try {
      await deleteAccount();
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="page">
      <h1>Account</h1>

      <section className="card">
        <dl className="account-details">
          <dt>Email</dt>
          <dd>{user.email}</dd>
          <dt>Display name</dt>
          <dd>{user.displayName || <span className="muted">—</span>}</dd>
          <dt>Battle.net</dt>
          <dd>{user.battlenetLinked ? user.battletag || 'Linked' : <span className="muted">Not linked</span>}</dd>
        </dl>
      </section>

      <section className="card danger-zone">
        <h2>Delete account</h2>
        <p className="muted">
          Permanently deletes your account and all imported character data. This cannot be undone.
        </p>
        {error && <p className="form-error">{error}</p>}
        {user.isDemo ? (
          <p className="muted">The demo account cannot be deleted.</p>
        ) : !confirming ? (
          <button type="button" className="btn-danger" onClick={() => setConfirming(true)}>
            Delete my account
          </button>
        ) : (
          <div className="confirm-row">
            <span>Are you sure?</span>
            <button type="button" className="btn-danger" onClick={onDelete} disabled={busy}>
              {busy ? 'Deleting…' : 'Yes, delete'}
            </button>
            <button type="button" className="btn-secondary" onClick={() => setConfirming(false)} disabled={busy}>
              Cancel
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

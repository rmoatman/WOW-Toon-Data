import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { authApi } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      const res = await authApi.resetPassword(token, password);
      setUser(res.user); // reset logs you in
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (!token) {
    return (
      <div className="auth-card">
        <h1>Reset password</h1>
        <p className="form-error">This reset link is missing its token.</p>
        <div className="auth-links">
          <Link to="/forgot-password">Request a new link</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-card">
      <h1>Choose a new password</h1>
      {error && <p className="form-error">{error}</p>}
      <form onSubmit={onSubmit} className="form">
        <label>
          New password <span className="hint">(8+ chars, a letter and a number)</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
        </label>
        <label>
          Confirm password
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            required
          />
        </label>
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? 'Saving…' : 'Reset password'}
        </button>
      </form>
    </div>
  );
}

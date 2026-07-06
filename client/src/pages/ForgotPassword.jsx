import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../api.js';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setBusy(true);
    try {
      const res = await authApi.forgotPassword(email);
      setMessage(res.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-card">
      <h1>Forgot password</h1>
      <p className="muted">
        Enter your email and we'll send a link to reset your password.
      </p>
      {message && <p className="form-success">{message}</p>}
      {error && <p className="form-error">{error}</p>}
      <form onSubmit={onSubmit} className="form">
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </label>
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? 'Sending…' : 'Send reset link'}
        </button>
      </form>
      <div className="auth-links">
        <Link to="/login">Back to log in</Link>
      </div>
    </div>
  );
}

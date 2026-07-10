import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login, demoLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const tryDemo = async () => {
    setError(null);
    setBusy(true);
    try {
      await demoLogin();
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="auth-card">
      <h1>Log in</h1>
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
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? 'Logging in…' : 'Log in'}
        </button>
      </form>

      <div className="auth-divider"><span>or</span></div>
      <button type="button" className="btn-secondary auth-demo-btn" onClick={tryDemo} disabled={busy}>
        Explore the demo — no account needed
      </button>

      <div className="auth-links">
        <Link to="/forgot-password">Forgot password?</Link>
        <span>
          No account? <Link to="/register">Sign up</Link>
        </span>
      </div>
    </div>
  );
}

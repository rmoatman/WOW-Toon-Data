import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ displayName: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (form.password !== form.confirm) {
      setError('Passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      await register({
        displayName: form.displayName,
        email: form.email,
        password: form.password,
      });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-card">
      <h1>Create your account</h1>
      {error && <p className="form-error">{error}</p>}
      <form onSubmit={onSubmit} className="form">
        <label>
          Display name <span className="optional">(optional)</span>
          <input type="text" value={form.displayName} onChange={update('displayName')} />
        </label>
        <label>
          Email
          <input type="email" value={form.email} onChange={update('email')} autoComplete="email" required />
        </label>
        <label>
          Password <span className="hint">(8+ chars, a letter and a number)</span>
          <input
            type="password"
            value={form.password}
            onChange={update('password')}
            autoComplete="new-password"
            required
          />
        </label>
        <label>
          Confirm password
          <input
            type="password"
            value={form.confirm}
            onChange={update('confirm')}
            autoComplete="new-password"
            required
          />
        </label>
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? 'Creating…' : 'Sign up'}
        </button>
      </form>
      <div className="auth-links">
        <span>
          Already have an account? <Link to="/login">Log in</Link>
        </span>
      </div>
    </div>
  );
}

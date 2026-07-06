import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Footer from './Footer.jsx';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="app-shell">
      <header className="site-header">
        <Link to="/" className="brand">
          WOW-<span>Toon</span>-Data
        </Link>
        <nav className="site-nav" aria-label="Primary">
          {user ? (
            <>
              <NavLink to="/dashboard">Characters</NavLink>
              <NavLink to="/account">Account</NavLink>
              <button type="button" className="link-btn" onClick={handleLogout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login">Log in</NavLink>
              <NavLink to="/register" className="nav-cta">
                Sign up
              </NavLink>
            </>
          )}
        </nav>
      </header>

      <main className="site-main">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}

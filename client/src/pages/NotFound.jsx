import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="page prose" style={{ textAlign: 'center' }}>
      <h1>404</h1>
      <p className="muted">That page wandered off into the Barrens.</p>
      <Link to="/" className="btn-primary">
        Back home
      </Link>
    </div>
  );
}

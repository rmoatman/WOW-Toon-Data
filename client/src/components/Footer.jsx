import { Link } from 'react-router-dom';
import { SITE } from '../config.js';

export default function Footer() {
  return (
    <footer className="site-footer">
      <nav className="footer-links" aria-label="Footer">
        <Link to="/about">About</Link>
        <Link to="/privacy">Privacy &amp; Security</Link>
        <Link to="/install">Installation</Link>
        <a href={`mailto:${SITE.contactEmail}`}>Email</a>
        <a href={SITE.githubProfile} target="_blank" rel="noreferrer">
          GitHub
        </a>
      </nav>
      <p className="footer-legal">
        Powered by the Blizzard API. An unofficial, non-commercial portfolio project — not
        affiliated with or endorsed by Blizzard Entertainment. Background art generated with
        ChatGPT.
      </p>
    </footer>
  );
}

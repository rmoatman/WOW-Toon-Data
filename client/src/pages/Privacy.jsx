import { SITE } from '../config.js';

export default function Privacy() {
  return (
    <div className="page prose">
      <h1>Privacy &amp; Security</h1>

      <h2>What we store</h2>
      <ul>
        <li>Your email address and display name.</li>
        <li>A securely hashed version of your password (never the password itself).</li>
        <li>
          Your public World of Warcraft character data (names, achievements, completed quests)
          imported from the Blizzard API.
        </li>
      </ul>

      <h2>How your data is protected</h2>
      <ul>
        <li>Passwords are hashed with bcrypt; we can never see or recover your plaintext password.</li>
        <li>Sessions use signed, HTTP-only cookies that aren't accessible to JavaScript.</li>
        <li>
          If you link Battle.net, we store only an encrypted access token — we never see your
          Blizzard password, and you can revoke access at any time from your Battle.net account.
        </li>
        <li>All traffic is served over HTTPS in production.</li>
      </ul>

      <h2>Your control</h2>
      <ul>
        <li>You can reset your password by email at any time.</li>
        <li>
          You can delete your account from the <strong>Account</strong> page. Deletion permanently
          removes your account and all imported character data.
        </li>
      </ul>

      <h2>Third parties</h2>
      <p>
        Character data comes from the official <strong>Blizzard Battle.net API</strong> and is
        subject to Blizzard's terms. We don't sell your data or share it with advertisers.
      </p>

      <p className="muted">
        Questions about your data? Email{' '}
        <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>.
      </p>
    </div>
  );
}

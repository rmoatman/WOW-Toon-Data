import { useAuth } from '../context/AuthContext.jsx';

// Placeholder for the character roster (built in M5). For now it confirms the
// authenticated area works and previews what's coming.
export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="page">
      <h1>Your characters</h1>
      <p className="muted">
        Welcome{user.displayName ? `, ${user.displayName}` : ''}. This is where your World of
        Warcraft roster will appear.
      </p>

      <section className="card">
        <h2>Coming next</h2>
        <ul className="roadmap-list">
          <li>Connect your Battle.net account to import your characters (US region).</li>
          <li>Browse each character's image, stats, achievements, and completed quests.</li>
          <li>Search and sort combined achievements and quests across every toon.</li>
        </ul>
        {!user.battlenetLinked && (
          <p className="muted">Battle.net linking arrives in the next milestone.</p>
        )}
      </section>
    </div>
  );
}

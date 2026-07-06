import { Link } from 'react-router-dom';
import { formatDate } from '../util/format.js';

// The list of characters shown in the reverse-lookup modal (who has this
// achievement / who completed this quest).
export default function CharacterHitList({ characters, showDate = false }) {
  if (!characters.length) return <p className="muted">No characters.</p>;

  return (
    <ul className="hit-list">
      {characters.map((c) => {
        const dot =
          c.faction?.toLowerCase() === 'horde'
            ? 'dot-horde'
            : c.faction?.toLowerCase() === 'alliance'
              ? 'dot-alliance'
              : '';
        return (
          <li key={c.id} className="hit-item">
            <span className={`faction-dot ${dot}`} aria-hidden="true" />
            <Link to={`/characters/${c.id}`} className="hit-name">
              {c.name}
            </Link>
            <span className="muted hit-meta">
              {c.level ? `Lvl ${c.level} ` : ''}
              {c.className}
              {c.realmName ? ` · ${c.realmName}` : ''}
            </span>
            {showDate && <span className="muted hit-date">{formatDate(c.completedAt)}</span>}
          </li>
        );
      })}
    </ul>
  );
}

import { Link } from 'react-router-dom';

// A single character tile in the roster grid, showing the summary data from
// the deep sync (image, item level, achievement/quest counts).
export default function CharacterCard({ character }) {
  const factionClass =
    character.faction?.toLowerCase() === 'horde'
      ? 'faction-horde'
      : character.faction?.toLowerCase() === 'alliance'
        ? 'faction-alliance'
        : '';

  const unavailable = character.profileAvailable === false;

  return (
    <Link to={`/characters/${character.id}`} className={`character-card ${factionClass}`}>
      <div className="character-avatar" aria-hidden="true">
        {character.renderImageUrl ? (
          <img src={character.renderImageUrl} alt="" loading="lazy" />
        ) : (
          <span className="avatar-fallback">{character.name.charAt(0)}</span>
        )}
      </div>
      <div className="character-body">
        <h3 className="character-name">{character.name}</h3>
        <p className="character-meta">
          {character.level ? `Level ${character.level} ` : ''}
          {character.raceName} {character.className}
        </p>
        <p className="character-sub muted">
          {character.realmName || character.realmSlug}
          {character.faction ? ` · ${character.faction}` : ''}
        </p>

        {unavailable ? (
          <p className="character-note">Log in on this character in-game to sync its data.</p>
        ) : (
          <div className="character-stats">
            {character.itemLevel ? <span title="Item level">iLvl {character.itemLevel}</span> : null}
            <span title="Achievements completed">🏆 {character.achievementCount}</span>
            <span title="Quests completed">📜 {character.questCount}</span>
          </div>
        )}
      </div>
    </Link>
  );
}

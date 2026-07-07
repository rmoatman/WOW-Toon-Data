import { Link } from 'react-router-dom';

// Monochrome eye / eye-off icons (inherit color via currentColor, so they can
// be styled white — unlike emoji).
const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const EyeOffIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

// A single character tile in the roster grid, showing the summary data from
// the deep sync (image, item level, achievement/quest counts).
export default function CharacterCard({ character, onToggleHide }) {
  const factionClass =
    character.faction?.toLowerCase() === 'horde'
      ? 'faction-horde'
      : character.faction?.toLowerCase() === 'alliance'
        ? 'faction-alliance'
        : '';

  const unavailable = character.profileAvailable === false;

  return (
    <Link
      to={`/characters/${character.id}`}
      className={`character-card ${factionClass} ${character.hidden ? 'character-card--hidden' : ''}`}
    >
      {onToggleHide && (
        <button
          type="button"
          className="character-hide-btn"
          title={character.hidden ? 'Show on dashboard' : 'Hide from dashboard'}
          aria-label={character.hidden ? 'Show character' : 'Hide character'}
          onClick={(e) => {
            // The card is a link; don't navigate when toggling visibility.
            e.preventDefault();
            e.stopPropagation();
            onToggleHide(character);
          }}
        >
          {character.hidden ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      )}
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

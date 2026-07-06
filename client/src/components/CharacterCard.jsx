// A single character tile in the roster grid. The detail page (M5) will link
// from here; for now it shows the summary data from the roster import.
export default function CharacterCard({ character }) {
  const factionClass =
    character.faction?.toLowerCase() === 'horde'
      ? 'faction-horde'
      : character.faction?.toLowerCase() === 'alliance'
        ? 'faction-alliance'
        : '';

  return (
    <article className={`character-card ${factionClass}`}>
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
      </div>
    </article>
  );
}

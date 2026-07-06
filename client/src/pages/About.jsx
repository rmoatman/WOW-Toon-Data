import { SITE } from '../config.js';

export default function About() {
  return (
    <div className="page prose">
      <h1>About</h1>
      <p>
        <strong>{SITE.name}</strong> is a portfolio web app for World of Warcraft players who keep
        multiple characters. It connects to Blizzard's official Battle.net API to import your
        roster, then gathers each character's achievements and completed quests so you can browse,
        search, and sort them all in one place.
      </p>
      <p>
        The goal is to answer questions that are tedious to check in-game: <em>which of my
        characters has this achievement?</em> or <em>have I finished this quest on my alt?</em>
      </p>
      <h2>How it works</h2>
      <ul>
        <li>Create an account and link your Battle.net login (US region).</li>
        <li>Your characters and their accomplishments are synced from the Blizzard API.</li>
        <li>Data refreshes on login and on demand, so it stays current without slowing you down.</li>
      </ul>
      <h2>Contact</h2>
      <p>
        Questions or feedback? Email <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>{' '}
        or view the source on{' '}
        <a href={SITE.githubUrl} target="_blank" rel="noreferrer">
          GitHub
        </a>
        .
      </p>
      <p className="muted">
        World of Warcraft is a trademark of Blizzard Entertainment, Inc. This project is unofficial
        and not affiliated with or endorsed by Blizzard.
      </p>
    </div>
  );
}

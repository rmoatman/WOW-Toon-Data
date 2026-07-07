import { useState } from 'react';

const PREVIEW_SIZE = 232; // box incl. padding/border; used for edge clamping

/**
 * A collectible thumbnail that shows an enlarged preview on hover. The thumbnail
 * itself zoom-crops the render (via CSS) so mounts/pets whose art has lots of
 * transparent padding still fill the tile. The hover preview shows the full,
 * uncropped render. Preview is position: fixed so it escapes the table's
 * overflow clipping and follows the cursor. Renders nothing if the image fails.
 */
export default function CollectibleThumb({ src }) {
  const [pos, setPos] = useState(null);
  const [broken, setBroken] = useState(false);

  if (!src || broken) return null;

  const track = (e) => setPos({ x: e.clientX, y: e.clientY });

  const left = pos ? Math.min(pos.x + 16, window.innerWidth - PREVIEW_SIZE - 8) : 0;
  const top = pos ? Math.min(pos.y + 16, window.innerHeight - PREVIEW_SIZE - 8) : 0;

  return (
    <>
      <span
        className="collectible-thumb"
        onMouseEnter={track}
        onMouseMove={track}
        onMouseLeave={() => setPos(null)}
      >
        <img src={src} loading="lazy" alt="" onError={() => setBroken(true)} />
      </span>
      {pos && (
        <span className="collectible-preview" style={{ left, top }} aria-hidden="true">
          <img src={src} alt="" />
        </span>
      )}
    </>
  );
}

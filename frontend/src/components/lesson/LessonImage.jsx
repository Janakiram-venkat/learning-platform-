import { useState } from 'react';
import { Camera } from 'lucide-react';

/**
 * A real photograph in a lesson — or, until the file exists, a placeholder that
 * says exactly which photograph belongs there and where to save it.
 *
 * The course JSON always names the *final* path, so dropping a file at that
 * path is the only step needed to turn a placeholder into the real thing: no
 * code change, no JSON edit.
 *
 * The placeholder is what renders by default, and the photo replaces it only
 * once it has actually loaded — deliberately that way round rather than showing
 * the image and falling back on error, because a slot is then never empty and
 * never a broken-image icon: it is either the photograph or an honest
 * description of the photograph that belongs there.
 *
 * Not lazy-loaded, and that is not an oversight. The lesson body is a nested
 * `overflow-y-auto` panel, and inside one Chrome never gets round to fetching a
 * `loading="lazy"` image at all — verified in the running app, where every photo
 * stayed at naturalWidth 0 and only appeared once the attribute came off. A
 * handful of images per lesson is not worth a load that might never happen.
 *
 * One block, two shapes:
 *   { "type": "image", "src": "...", "alt": "...", "caption": "...", "want": "..." }
 *   { "type": "image", "columns": 4, "items": [ {...}, {...} ] }
 *
 * `want` is the brief — what the photo needs to show. It is what the
 * placeholder displays, and it is also the alt-text fallback, so an image added
 * without alt text is still described to a screen reader.
 */

function Shot({ shot, ratio }) {
  const [loaded, setLoaded] = useState(false);
  const label = shot.alt || shot.want || 'Lesson photograph';

  return (
    <figure className="m-0">
      <div
        className={`relative overflow-hidden rounded-xl border-2 ${
          loaded ? 'border-ink bg-[#0B180F]' : 'border-dashed border-ink/30 bg-paper/50'
        }`}
        style={{ aspectRatio: shot.ratio || ratio || '16 / 9' }}
      >
        {shot.src && (
          <img
            src={shot.src}
            alt={label}
            decoding="async"
            onLoad={() => setLoaded(true)}
            onError={() => setLoaded(false)}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
              loaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )}

        {!loaded && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center"
            title={shot.want || undefined}
          >
            <Camera className="h-6 w-6 shrink-0 text-ink/30" aria-hidden="true" />
            {/* Clamped so a long brief can't overflow a square frame; the title
                above keeps the rest reachable, and docs/robotics-images.md has
                the full list. */}
            <p className="line-clamp-5 text-sm font-bold leading-snug text-ink/60">
              {shot.want || 'Photograph to be added'}
            </p>
          </div>
        )}
      </div>

      {/* The path sits outside the frame: inside it, a long one gets clipped by
          the reserved aspect ratio. It disappears once the photo is in place. */}
      {!loaded && shot.src && (
        <p className="mt-1.5 break-all font-mono-lab text-[10px] leading-snug text-ink/40">
          {shot.src}
        </p>
      )}

      {(shot.caption || shot.credit) && (
        <figcaption className="mt-2 text-sm text-ink/60">
          {shot.caption}
          {shot.credit && (
            <span className="ml-1 text-ink/40">
              {shot.caption ? '· ' : ''}
              {shot.credit}
            </span>
          )}
        </figcaption>
      )}
    </figure>
  );
}

export default function LessonImage({ block }) {
  if (!block) return null;

  // A row of related photos — the eight robot families, the parts on the bench.
  if (Array.isArray(block.items) && block.items.length > 0) {
    // Container queries, not viewport ones: an image block spans the whole
    // lesson sheet, and how wide that sheet is depends on whether the lesson
    // also carries a side panel.
    const cols = block.columns === 4
      ? 'sm:grid-cols-2 @min-[68rem]:grid-cols-4'
      : block.columns === 3
        ? 'sm:grid-cols-2 @min-[68rem]:grid-cols-3'
        : 'sm:grid-cols-2';
    return (
      <div>
        {block.value && (
          <p className="mb-3 font-lab text-sm font-bold uppercase tracking-wide text-pcb">
            {block.value}
          </p>
        )}
        <div className={`grid grid-cols-1 gap-4 ${cols}`}>
          {block.items.map((shot, i) => (
            <Shot key={shot.src || i} shot={shot} ratio={block.ratio} />
          ))}
        </div>
      </div>
    );
  }

  // A lone photo does not want the whole breakout width — at 84rem a 16:9 shot
  // would be taller than the window. Capped a little wider than the prose it
  // interrupts, so it still reads as a feature rather than an inline figure.
  return (
    <div className="mx-auto max-w-4xl">
      <Shot shot={block} ratio={block.ratio} />
    </div>
  );
}

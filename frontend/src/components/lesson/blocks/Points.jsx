import RichText from '../RichText';

/**
 * Slide-style key points: the "presentation" voice of a lesson.
 *
 *   { "type": "points", "title": "Key ideas",
 *     "items": [ "plain bullet", { "icon": "📦", "text": "bold lead", "sub": "detail" } ] }
 *
 * Deliberately quiet: a plain list, no boxes, no entrance animation. Points are
 * reading material, so they should look like a well-set slide rather than a
 * row of cards competing with the diagrams and widgets around them. Items with
 * an icon lead with it; items without get a small numbered marker. With four
 * or more icon items and room to spare, they flow into two columns.
 */
export default function Points({ block }) {
  const items = (block.items || []).map((it) => (typeof it === 'string' ? { text: it } : it));
  const iconList = items.length > 0 && items.every((it) => it.icon);
  const twoCol = iconList && items.length >= 4;

  return (
    <section>
      {block.title && (
        <h3 className="font-lab mb-3 text-lg font-extrabold text-ink">{block.title}</h3>
      )}
      <ul className={`grid grid-cols-1 gap-x-8 gap-y-3 ${twoCol ? '@min-[40rem]:grid-cols-2' : ''}`}>
        {items.map((it, i) => (
          <li key={i} className="flex items-start gap-3">
            {it.icon ? (
              <span className="mt-0.5 w-7 shrink-0 text-center text-xl leading-7" aria-hidden>{it.icon}</span>
            ) : (
              <span className="font-mono-lab mt-1.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-pcb/12 text-[11px] font-bold text-pcb">
                {i + 1}
              </span>
            )}
            <span className="min-w-0 text-lg leading-relaxed text-ink/80">
              {iconList
                ? <span className="font-bold text-ink"><RichText value={it.text} /></span>
                : <RichText value={it.text} />}
              {it.sub && <span className="block text-base text-ink/60"><RichText value={it.sub} /></span>}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

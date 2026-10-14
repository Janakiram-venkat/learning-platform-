import { useState } from 'react';
import { ArrowRight, ArrowDown, CheckCircle2, XCircle } from 'lucide-react';
import RichText from '../RichText';
import { highlight } from './highlight';

/**
 * Pictures drawn from JSON, so a lesson can explain with a diagram instead of
 * a paragraph. One block, several kinds:
 *
 *   anatomy: a line of code split into labelled parts. Tap a part for detail.
 *     { "type": "diagram", "kind": "anatomy",
 *       "parts": [ { "code": "print", "label": "the command", "note": "..." },
 *                  { "code": "(\"Hi\")", "label": "what to show" } ] }
 *
 *   boxes: variables drawn as labelled boxes holding values.
 *     { "kind": "boxes", "items": [ { "name": "score", "value": "100", "type": "int" } ] }
 *
 *   flow: steps joined by arrows (a row when there is room, a column when not).
 *     { "kind": "flow", "steps": [ { "icon": "⌨️", "label": "You type", "detail": "..." } ] }
 *
 *   compare: side-by-side columns, typically "works" vs "breaks".
 *     { "kind": "compare", "items": [ { "title": "Works", "tone": "good", "code": "...", "text": "..." } ] }
 *
 * Every kind takes an optional `title` and `caption`.
 */
export default function Diagram({ block, language }) {
  const Body = KINDS[block.kind];
  if (!Body) return null;

  return (
    <figure className="rounded-2xl border border-ink/15 bg-white p-5 sm:p-6">
      {block.title && <p className="ref-tag mb-4 text-ink/55">{block.title}</p>}
      <Body block={block} language={language} />
      {block.caption && (
        <figcaption className="mt-4 text-center text-sm leading-relaxed text-ink/60">
          <RichText value={block.caption} />
        </figcaption>
      )}
    </figure>
  );
}

// Static class strings: a template like `bg-${c}` never reaches Tailwind.
const PART_COLORS = [
  { label: 'text-[#C9A2FF]', ring: 'border-[#C9A2FF]', text: 'text-pcb' },
  { label: 'text-signal', ring: 'border-signal', text: 'text-signal-deep' },
  { label: 'text-[#6CC4FF]', ring: 'border-[#6CC4FF]', text: 'text-led-deep' },
  { label: 'text-wire-bright', ring: 'border-wire-bright', text: 'text-wire' },
  { label: 'text-mint', ring: 'border-mint', text: 'text-mint-deep' },
  { label: 'text-[#FF8BE8]', ring: 'border-[#FF8BE8]', text: 'text-magenta' },
];

function Anatomy({ block }) {
  const parts = block.parts || [];
  // Only labelled parts take a colour; plain glue (spaces, commas) stays grey.
  let colorIdx = -1;
  const shaped = parts.map((p) => ({ ...p, color: p.label ? PART_COLORS[++colorIdx % PART_COLORS.length] : null }));
  const firstLabelled = shaped.findIndex((p) => p.label);
  const [active, setActive] = useState(firstLabelled);
  const current = shaped[active];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-center gap-x-1 gap-y-4 rounded-xl bg-well px-4 py-6">
        {shaped.map((p, i) => (p.label ? (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`group flex flex-col items-center gap-2 rounded-lg px-1 pb-1 transition-opacity ${active === i ? '' : 'opacity-75 hover:opacity-100'}`}
          >
            <span className={`font-mono-lab whitespace-pre rounded-md border-b-2 px-1.5 py-1 text-xl font-bold text-white sm:text-2xl ${p.color.ring} ${active === i ? 'bg-white/10' : ''}`}>
              {p.code}
            </span>
            <span className={`text-[11px] font-bold uppercase tracking-wide ${p.color.label}`}>
              {p.label}
            </span>
          </button>
        ) : (
          <span key={i} className="font-mono-lab whitespace-pre pb-7 text-xl font-bold text-white/60 sm:text-2xl">{p.code}</span>
        )))}
      </div>

      {current?.note && (
        <div key={active} className={`rounded-lg border-l-4 bg-paper px-4 py-3 ${current.color.ring}`}>
          <p className="text-base leading-relaxed text-ink">
            <span className={`font-mono-lab mr-2 font-extrabold ${current.color.text}`}>{current.code.trim()}</span>
            <RichText value={current.note} />
          </p>
        </div>
      )}
      {shaped.some((p) => p.note) && (
        <p className="text-center text-xs font-semibold text-ink/45">Tap each coloured part to learn what it does.</p>
      )}
    </div>
  );
}

const TYPE_TINT = {
  int: 'bg-pcb/10 border-pcb text-pcb',
  float: 'bg-led/10 border-led text-led-deep',
  str: 'bg-mint/15 border-mint-deep text-mint-deep',
  bool: 'bg-wire/10 border-wire text-wire',
  list: 'bg-signal/20 border-signal-deep text-signal-deep',
};

function Boxes({ block }) {
  return (
    <div className="flex flex-wrap items-end justify-center gap-6">
      {(block.items || []).map((it, i) => {
        const tint = TYPE_TINT[it.type] || 'bg-paper border-ink text-ink';
        return (
          <div key={i} className="flex flex-col items-center">
            <span className="font-mono-lab mb-[-2px] rounded-t-lg border-2 border-b-0 border-ink bg-signal px-3 py-1 text-sm font-extrabold text-ink">
              {it.name}
            </span>
            <span className={`font-mono-lab flex min-h-16 min-w-24 items-center justify-center rounded-xl border-2 px-4 py-3 text-xl font-extrabold ${tint}`}>
              {it.value}
            </span>
            {it.type && <span className="ref-tag mt-2 text-ink/50">{it.type}</span>}
          </div>
        );
      })}
    </div>
  );
}

function Flow({ block }) {
  const steps = block.steps || [];
  return (
    <ol className="flex flex-col items-stretch gap-2 @min-[40rem]:flex-row @min-[40rem]:items-stretch">
      {steps.map((s, i) => (
        <li key={i} className="contents">
          <div
            className="flex flex-1 flex-col items-center gap-1.5 rounded-xl bg-paper px-3 py-4 text-center"
          >
            {s.icon && <span className="text-3xl leading-none" aria-hidden>{s.icon}</span>}
            <span className="font-lab font-extrabold text-ink"><RichText value={s.label} /></span>
            {s.detail && <span className="text-sm leading-relaxed text-ink/65"><RichText value={s.detail} /></span>}
          </div>
          {i < steps.length - 1 && (
            <span className="flex items-center justify-center text-ink/30" aria-hidden>
              <ArrowDown className="h-6 w-6 @min-[40rem]:hidden" />
              <ArrowRight className="hidden h-6 w-6 @min-[40rem]:block" />
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}

const TONES = {
  good: { head: 'bg-mint/15 text-mint-deep', Icon: CheckCircle2 },
  bad: { head: 'bg-wire/10 text-wire', Icon: XCircle },
  neutral: { head: 'bg-paper text-ink', Icon: null },
};

function Compare({ block, language }) {
  return (
    <div className="grid grid-cols-1 gap-4 @min-[34rem]:grid-cols-2">
      {(block.items || []).map((it, i) => {
        const tone = TONES[it.tone] || TONES.neutral;
        const Icon = tone.Icon;
        return (
          <div key={i} className="flex flex-col overflow-hidden rounded-xl border border-ink/15">
            <div className={`font-lab flex items-center gap-2 px-4 py-2 text-sm font-extrabold ${tone.head}`}>
              {Icon && <Icon className="h-5 w-5" />}
              {it.title}
            </div>
            <div className="flex flex-1 flex-col gap-3 bg-white p-4">
              {it.code && (
                <pre className="font-mono-lab overflow-x-auto rounded-lg bg-well px-3 py-2.5 text-sm leading-relaxed text-white/90">
                  {highlight(it.code, language)}
                </pre>
              )}
              {it.text && <p className="text-sm leading-relaxed text-ink/75"><RichText value={it.text} /></p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const KINDS = { anatomy: Anatomy, boxes: Boxes, flow: Flow, compare: Compare };

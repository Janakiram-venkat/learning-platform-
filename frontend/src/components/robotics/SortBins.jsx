import { useState } from 'react';
import { CheckCircle2, XCircle, RotateCcw, Lightbulb } from 'lucide-react';
import { awardXPOnce } from '../../lib/progress';
import WidgetShell from './shared/WidgetShell';

/**
 * Sort every card into one of two bins, then check the lot at once.
 *
 * Deliberately not graded per card as you go: the student has to commit to a
 * whole set of judgements before finding out, which is what makes the hard
 * cards (a thermostat, a sensorless factory arm) worth arguing about. Getting
 * one wrong costs nothing but a retry.
 */
export default function SortBins({ block }) {
  const { columns = [], cards = [], pass = 1, note, prompt, xp = 20, xpKey } = block || {};
  const [placements, setPlacements] = useState({});
  const [picked, setPicked] = useState(null);
  const [dragId, setDragId] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);
  const [checked, setChecked] = useState(false);
  const [earned, setEarned] = useState(0);

  if (!columns.length || !cards.length) return null;

  const unplaced = cards.filter((c) => !placements[c.id]);
  const correctCount = cards.filter((c) => placements[c.id] === c.column).length;
  const passed = correctCount / cards.length >= pass;

  const place = (columnId, cardId = picked) => {
    if (!cardId || checked) return;
    setPlacements((p) => ({ ...p, [cardId]: columnId }));
    setPicked(null);
  };
  const unplace = (cardId) => {
    if (checked) return;
    setPlacements((p) => { const n = { ...p }; delete n[cardId]; return n; });
  };

  const onDragStart = (cardId) => (e) => {
    if (checked) return;
    setDragId(cardId);
    setPicked(null);
    e.dataTransfer.effectAllowed = 'move';
    try { e.dataTransfer.setData('text/plain', cardId); } catch { /* Safari */ }
  };
  const onDragEnd = () => { setDragId(null); setDragOverCol(null); };

  const check = () => {
    setChecked(true);
    const got = cards.filter((c) => placements[c.id] === c.column).length;
    if (got / cards.length >= pass && xpKey) setEarned(awardXPOnce(xpKey, xp));
  };

  return (
    <WidgetShell
      title="🗂️ Robot or Not?"
      hint={prompt}
      footer={
        checked && (
          <div className="mb-2">
            {passed ? (
              <p className="flex items-start gap-2 text-sm font-bold text-pcb">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                {correctCount}/{cards.length} right{earned ? ` · +${earned} XP` : ''}
              </p>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <p className="flex-1 text-sm font-bold text-ink">
                  {correctCount}/{cards.length}. Fix the red ones and try again 💪
                </p>
                <button
                  onClick={() => setChecked(false)}
                  className="inline-flex items-center gap-1.5 rounded-lg border-2 border-ink bg-wire px-4 py-1.5 text-sm font-bold text-white"
                >
                  <RotateCcw className="h-4 w-4" /> Try again
                </button>
              </div>
            )}
          </div>
        )
      }
    >
      <div className="p-4">
        {/* Tray */}
        <div className="mb-4 min-h-[60px] rounded-2xl border-2 border-dashed border-ink/15 bg-paper/70 p-3">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-ink/40">
            Drag a card into a bin, or tap a card and then tap a bin
          </p>
          <div className="flex flex-wrap gap-2">
            {unplaced.length === 0 && <span className="text-sm font-semibold text-ink/40">All cards placed!</span>}
            {unplaced.map((c) => (
              <button
                key={c.id}
                draggable={!checked}
                onDragStart={onDragStart(c.id)}
                onDragEnd={onDragEnd}
                onClick={() => setPicked(picked === c.id ? null : c.id)}
                className={`flex cursor-grab items-center gap-2 rounded-xl border-2 px-3 py-2 text-sm font-bold transition-all active:scale-95 active:cursor-grabbing ${
                  dragId === c.id ? 'opacity-40' : ''
                } ${
                  picked === c.id
                    ? 'border-pcb bg-pcb/15 text-pcb ring-2 ring-pcb/30'
                    : 'border-ink/15 bg-white text-ink/75 hover:border-pcb/40'
                }`}
              >
                <span className="text-lg">{c.emoji}</span> {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bins. Two up on a phone; on a wide pane, as many across as fit —
            driven by the data rather than a hard column count, since the number
            of bins comes from the lesson JSON. */}
        <div className="grid grid-cols-2 gap-3 @min-[68rem]:grid-cols-[repeat(auto-fit,minmax(16rem,1fr))]">
          {columns.map((col) => {
            const armed = (picked || dragId) && !checked;
            const highlight = dragOverCol === col.id && !checked;
            return (
              <button
                key={col.id}
                onClick={() => place(col.id)}
                onDragOver={(e) => { if (dragId && !checked) { e.preventDefault(); setDragOverCol(col.id); } }}
                onDragLeave={() => setDragOverCol((c) => (c === col.id ? null : c))}
                onDrop={(e) => {
                  e.preventDefault();
                  place(col.id, dragId || e.dataTransfer.getData('text/plain'));
                  onDragEnd();
                }}
                disabled={checked || (!picked && !dragId)}
                className={`flex min-h-[150px] flex-col rounded-2xl border-2 p-3 text-left transition-colors ${
                  highlight ? 'border-pcb bg-pcb/15 ring-2 ring-pcb/30'
                    : armed ? 'border-pcb bg-pcb/8' : 'border-ink/15 bg-white'
                }`}
              >
                <span className="mb-2 flex items-center gap-1.5 font-lab font-extrabold text-ink">
                  <span className="text-xl">{col.emoji}</span> {col.label}
                </span>
                <div className="flex flex-1 flex-col gap-1.5">
                  {cards.filter((c) => placements[c.id] === col.id).map((c) => {
                    const right = c.column === col.id;
                    let cls = 'border-ink/15 bg-paper text-ink/75';
                    if (checked) cls = right ? 'border-pcb/40 bg-pcb/10 text-pcb' : 'border-wire/50 bg-wire/8 text-wire';
                    return (
                      <span
                        key={c.id}
                        draggable={!checked}
                        onDragStart={(e) => { e.stopPropagation(); onDragStart(c.id)(e); }}
                        onDragEnd={onDragEnd}
                        onClick={(e) => { e.stopPropagation(); unplace(c.id); }}
                        className={`flex cursor-grab items-center justify-between gap-1 rounded-lg border px-2 py-1.5 text-xs font-bold active:cursor-grabbing ${
                          dragId === c.id ? 'opacity-40' : ''
                        } ${cls}`}
                      >
                        <span>{c.emoji} {c.label}</span>
                        {checked && (right
                          ? <CheckCircle2 className="h-4 w-4 shrink-0 text-pcb" />
                          : <XCircle className="h-4 w-4 shrink-0 text-wire" />)}
                      </span>
                    );
                  })}
                </div>
              </button>
            );
          })}
        </div>

        {note && checked && passed && (
          <p className="mt-4 flex animate-slide-up items-start gap-2 rounded-xl bg-pcb/8 p-3 text-sm font-medium text-ink ring-1 ring-pcb/20">
            <Lightbulb className="mt-0.5 h-5 w-5 shrink-0" /> {note}
          </p>
        )}

        {!checked && (
          <button
            onClick={check}
            disabled={unplaced.length > 0}
            className="lab-btn mt-4 w-full rounded-xl border-2 border-ink bg-signal px-6 py-3 font-extrabold text-ink disabled:cursor-not-allowed disabled:border-ink/20 disabled:bg-ink/10 disabled:text-ink/40"
          >
            {unplaced.length > 0 ? `Place all cards (${unplaced.length} left)` : 'Check my sorting'}
          </button>
        )}
      </div>
    </WidgetShell>
  );
}

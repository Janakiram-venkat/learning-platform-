import { useState } from 'react';
import { CheckCircle2, XCircle, RotateCcw, Lightbulb } from 'lucide-react';
import ContinueBar from '../shared/ContinueBar';

// Sort: drop each card into the right bucket (drag, or tap card then bucket).
export default function SortStage({ stage, onComplete }) {
  const [placements, setPlacements] = useState({}); // cardId -> columnId
  const [picked, setPicked] = useState(null);       // cardId currently selected (tap flow)
  const [dragId, setDragId] = useState(null);       // cardId currently being dragged
  const [dragOverCol, setDragOverCol] = useState(null); // column highlighted during drag
  const [dragOverTray, setDragOverTray] = useState(false);
  const [checked, setChecked] = useState(false);

  const unplaced = stage.cards.filter((c) => !placements[c.id]);

  const place = (columnId, cardId = picked) => {
    if (!cardId || checked) return;
    setPlacements((p) => ({ ...p, [cardId]: columnId }));
    setPicked(null);
  };
  const unplace = (cardId) => {
    if (checked) return;
    setPlacements((p) => { const n = { ...p }; delete n[cardId]; return n; });
  };

  // Drag handlers (native HTML5 DnD). Tap-to-place still works alongside.
  const onDragStart = (cardId) => (e) => {
    if (checked) return;
    setDragId(cardId);
    setPicked(null);
    e.dataTransfer.effectAllowed = 'move';
    try { e.dataTransfer.setData('text/plain', cardId); } catch { /* Safari */ }
  };
  const onDragEnd = () => { setDragId(null); setDragOverCol(null); setDragOverTray(false); };
  const dropOnColumn = (columnId) => (e) => {
    e.preventDefault();
    const id = dragId || e.dataTransfer.getData('text/plain');
    place(columnId, id);
    onDragEnd();
  };
  const dropOnTray = (e) => {
    e.preventDefault();
    const id = dragId || e.dataTransfer.getData('text/plain');
    if (id) unplace(id);
    onDragEnd();
  };

  const correctCount = stage.cards.filter((c) => placements[c.id] === c.column).length;
  const accuracy = correctCount / stage.cards.length;
  const passed = accuracy >= (stage.pass ?? 1);

  return (
    <div>
      {/* Card tray */}
      <div
        onDragOver={(e) => { if (dragId) { e.preventDefault(); setDragOverTray(true); } }}
        onDragLeave={() => setDragOverTray(false)}
        onDrop={dropOnTray}
        className={`mb-4 min-h-[64px] rounded-2xl border-2 border-dashed p-3 transition-colors ${
          dragOverTray ? 'border-pcb bg-pcb/8' : 'border-ink/15 bg-paper'
        }`}
      >
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink/40">Drag a card into a bucket — or tap a card, then tap a bucket</p>
        <div className="flex flex-wrap gap-2">
          {unplaced.length === 0 && <span className="text-sm text-ink/40">All cards placed!</span>}
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
                picked === c.id ? 'border-pcb bg-pcb/15 text-pcb ring-2 ring-pcb/30' : 'border-ink/15 bg-white text-ink/75 hover:border-pcb/40'
              }`}
            >
              <span className="text-lg">{c.emoji}</span> {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Buckets */}
      <div className="grid grid-cols-2 gap-3">
        {stage.columns.map((col) => {
          const active = (picked || dragId) && !checked;
          const highlight = dragOverCol === col.id && !checked;
          return (
            <button
              key={col.id}
              onClick={() => place(col.id)}
              onDragOver={(e) => { if (dragId && !checked) { e.preventDefault(); setDragOverCol(col.id); } }}
              onDragLeave={() => setDragOverCol((c) => (c === col.id ? null : c))}
              onDrop={dropOnColumn(col.id)}
              disabled={checked || (!picked && !dragId)}
              className={`flex min-h-[140px] flex-col rounded-2xl border-2 p-3 text-left transition-colors ${
                highlight ? 'border-pcb bg-pcb/15 ring-2 ring-pcb/30'
                : active ? 'border-pcb bg-pcb/8' : 'border-ink/15 bg-white'
              }`}
            >
              <span className="mb-2 flex items-center gap-1.5 font-extrabold text-ink">
                <span className="text-xl">{col.emoji}</span> {col.label}
              </span>
              <div className="flex flex-1 flex-col gap-1.5">
                {stage.cards.filter((c) => placements[c.id] === col.id).map((c) => {
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
                      className={`flex cursor-grab items-center justify-between gap-1 rounded-lg border px-2 py-1.5 text-xs font-bold active:cursor-grabbing ${dragId === c.id ? 'opacity-40' : ''} ${cls}`}
                    >
                      <span>{c.emoji} {c.label}</span>
                      {checked && (right ? <CheckCircle2 className="h-4 w-4 shrink-0 text-pcb" /> : <XCircle className="h-4 w-4 shrink-0 text-wire" />)}
                    </span>
                  );
                })}
              </div>
            </button>
          );
        })}
      </div>

      {stage.note && checked && passed && (
        <p className="mt-4 flex items-start gap-2 rounded-xl bg-pcb/8 p-3 text-sm font-medium text-ink ring-1 ring-pcb/20 animate-slide-up">
          <Lightbulb className="mt-0.5 h-5 w-5 shrink-0" /> {stage.note}
        </p>
      )}

      {!checked ? (
        <button
          onClick={() => setChecked(true)}
          disabled={unplaced.length > 0}
          className="mt-6 w-full rounded-2xl bg-ink px-6 py-3.5 font-extrabold text-white shadow-md transition-transform enabled:hover:bg-pcb active:scale-95 disabled:opacity-40"
        >
          {unplaced.length > 0 ? `Place all cards (${unplaced.length} left)` : 'Check My Sorting'}
        </button>
      ) : passed ? (
        <ContinueBar xp={stage.xp} onClick={() => onComplete(true)} />
      ) : (
        <div className="mt-6 animate-slide-up">
          <p className="mb-3 rounded-xl bg-signal/15 p-3 text-sm font-bold text-ink ring-1 ring-ink/15">
            You got {correctCount}/{stage.cards.length}. Fix the red ones and try again! 💪
          </p>
          <button
            onClick={() => setChecked(false)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-ink bg-wire px-6 py-3 font-bold text-white transition-colors hover:bg-wire/85"
          >
            <RotateCcw className="h-5 w-5" /> Try Again
          </button>
        </div>
      )}
    </div>
  );
}

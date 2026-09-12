import { useCallback, useEffect, useState } from 'react';
import { Play, Square, Save, Loader2, ChevronLeft, ChevronRight, Lock, PencilLine } from 'lucide-react';
import CodeEditor from '../editor/CodeEditor';
import GameCanvas from '../game/GameCanvas';
import { useGameRunner } from '../../hooks/useGameRunner';
import { adminContestService } from '../../services/api';
import { fmtDateTime } from '../../lib/contestTime';

// Play one entry and score it. The student's code runs in the same sandboxed
// Pyodide worker students use — it can't reach this page's session token.
export default function EntryJudge({ contestId, entries, entryId, onSelect, onScored }) {
  const [entry, setEntry] = useState(null);
  const [score, setScore] = useState('');
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const runner = useGameRunner();
  const { stop } = runner;

  const index = entries.findIndex((e) => e.id === entryId);
  const prev = entries[index - 1];
  const next = entries[index + 1];

  useEffect(() => {
    let alive = true;
    stop();
    adminContestService.entry(contestId, entryId)
      .then(({ data }) => {
        if (!alive) return;
        setEntry(data);
        setScore(data.score ?? '');
        setComment(data.judge_comment ?? '');
        setError('');
      })
      .catch((err) => { if (alive) setError(err?.response?.data?.detail || 'Could not load this entry.'); });
    return () => { alive = false; };
  }, [contestId, entryId, stop]);

  const play = useCallback(() => { if (entry) runner.run(entry.code); }, [runner, entry]);

  const save = async (goNext) => {
    const value = score === '' ? null : Number(score);
    if (value !== null && (!Number.isInteger(value) || value < 0 || value > 100)) {
      setError('Score must be a whole number from 0 to 100.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const { data } = await adminContestService.score(contestId, entryId, { score: value, judge_comment: comment });
      onScored(data);
      if (goNext && next) onSelect(next.id);
    } catch (err) {
      setError(err?.response?.data?.detail || 'Could not save the score.');
    } finally {
      setSaving(false);
    }
  };

  const current = entry?.id === entryId ? entry : null;

  return (
    <section className="lab-panel overflow-hidden">
      <header className="flex flex-wrap items-center gap-3 border-b-2 border-ink/10 bg-paper p-3">
        <button onClick={() => prev && onSelect(prev.id)} disabled={!prev} className="rounded-lg p-2 text-ink/60 hover:bg-ink/5 disabled:opacity-30" aria-label="Previous entry">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="mr-auto min-w-0">
          <p className="truncate font-lab text-lg font-extrabold text-ink">{current?.name || '…'}</p>
          {current && (
            <p className="flex flex-wrap items-center gap-2 text-xs font-semibold text-ink/55">
              {current.email} ·
              {current.submitted_at
                ? <span className="flex items-center gap-1 text-pcb"><Lock className="h-3 w-3" /> Submitted {fmtDateTime(current.submitted_at)}</span>
                : <span className="flex items-center gap-1"><PencilLine className="h-3 w-3" /> Not submitted, last saved {fmtDateTime(current.updated_at)}</span>}
            </p>
          )}
        </div>
        <span className="ref-tag text-ink/45">{index + 1} / {entries.length}</span>
        <button onClick={() => next && onSelect(next.id)} disabled={!next} className="rounded-lg p-2 text-ink/60 hover:bg-ink/5 disabled:opacity-30" aria-label="Next entry">
          <ChevronRight className="h-5 w-5" />
        </button>
      </header>

      <div className="flex flex-col lg:flex-row">
        <div className="h-[60vh] min-w-0 flex-1 bg-gray-50 p-3">
          <CodeEditor code={current?.code ?? ''} onChange={() => {}} onRun={play} filename="game.py" readOnly />
        </div>

        <div className="flex w-full flex-col gap-3 border-t-2 border-ink/10 p-3 lg:w-[500px] lg:border-l-2 lg:border-t-0">
          <GameCanvas width={runner.stageSize?.width || 480} height={runner.stageSize?.height || 360} />
          <div className="flex gap-2">
            {runner.running ? (
              <button onClick={runner.stop} className="lab-btn flex items-center rounded-lg border-2 border-ink bg-white px-4 py-2 font-extrabold text-ink">
                <Square className="mr-2 h-4 w-4" /> Stop
              </button>
            ) : (
              <button onClick={play} disabled={!current || runner.booting} className="lab-btn flex items-center rounded-lg border-2 border-ink bg-signal px-4 py-2 font-extrabold text-ink disabled:opacity-60">
                <Play className="mr-2 h-4 w-4" /> Play game
              </button>
            )}
            {runner.booting && <span className="self-center text-xs font-semibold text-ink/50">Booting Python…</span>}
          </div>
          {runner.error && (
            <pre className="max-h-32 overflow-auto whitespace-pre-wrap rounded-xl border-2 border-wire/40 bg-wire/5 p-3 font-mono text-xs text-wire">{runner.error}</pre>
          )}

          <div className="space-y-3 rounded-xl border-2 border-ink/10 bg-white p-3">
            <label className="flex items-center gap-3">
              <span className="ref-tag text-ink/60">Score</span>
              <input
                type="number"
                min={0}
                max={100}
                value={score}
                onChange={(e) => setScore(e.target.value)}
                className="w-24 rounded-lg border-2 border-ink/20 px-3 py-2 font-lab text-lg font-extrabold text-ink outline-none focus:border-pcb"
                placeholder="—"
              />
              <span className="font-bold text-ink/45">/ 100</span>
            </label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Comment for the student (shown when results are published)"
              className="w-full rounded-lg border-2 border-ink/20 px-3 py-2 font-semibold text-ink outline-none focus:border-pcb"
            />
            {error && <p className="text-sm font-bold text-wire">{error}</p>}
            <div className="flex flex-wrap justify-end gap-2">
              <button onClick={() => save(false)} disabled={saving || !current} className="lab-btn flex items-center gap-2 rounded-lg border-2 border-ink bg-white px-3 py-2 font-extrabold text-ink disabled:opacity-60">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
              </button>
              {next && (
                <button onClick={() => save(true)} disabled={saving || !current} className="lab-btn flex items-center gap-2 rounded-lg border-2 border-ink bg-signal px-3 py-2 font-extrabold text-ink disabled:opacity-60">
                  Save &amp; next <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

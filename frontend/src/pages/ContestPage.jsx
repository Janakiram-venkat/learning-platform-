import { useCallback, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft, Play, Square, Send, Lock, Cloud, CloudOff, Loader2, CheckCircle2, Hourglass,
} from 'lucide-react';
import CodeEditor from '../components/editor/CodeEditor';
import GameCanvas from '../components/game/GameCanvas';
import Countdown from '../components/contest/Countdown';
import BriefPanel from '../components/contest/BriefPanel';
import { useGameRunner } from '../hooks/useGameRunner';
import { useContestEntry } from '../hooks/useContestEntry';
import { useAuth } from '../context/AuthContext';
import { fmtDateTime } from '../lib/contestTime';

const SAVE_LABEL = {
  idle: { icon: Cloud, text: 'Not saved yet', cls: 'text-ink/45' },
  unsaved: { icon: Cloud, text: 'Unsaved changes', cls: 'text-ink/55' },
  saving: { icon: Loader2, text: 'Saving…', cls: 'text-ink/55', spin: true },
  saved: { icon: CheckCircle2, text: 'All changes saved', cls: 'text-pcb' },
  error: { icon: CloudOff, text: 'Not saved', cls: 'text-wire' },
};

function SaveStatus({ state, error }) {
  const s = SAVE_LABEL[state] || SAVE_LABEL.idle;
  const Icon = s.icon;
  return (
    <span className={`flex items-center gap-1.5 text-sm font-bold ${s.cls}`} title={error || undefined}>
      <Icon className={`h-4 w-4 ${s.spin ? 'animate-spin' : ''}`} />
      <span className="hidden sm:inline">{s.text}</span>
    </span>
  );
}

// "Are you sure?" for Submit. An in-page dialog rather than window.confirm, so
// it can say plainly that submitting is final.
function SubmitDialog({ open, submitting, onCancel, onConfirm }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/50 p-4" role="dialog" aria-modal="true">
      <div className="lab-panel w-full max-w-md bg-white p-6">
        <h2 className="flex items-center gap-2 font-lab text-xl font-extrabold text-ink">
          <Send className="h-5 w-5" /> Submit your game?
        </h2>
        <p className="mt-3 text-ink/75">
          This locks in exactly what's in your editor right now. You <strong>won't be able to change it</strong> afterwards.
        </p>
        <p className="mt-2 text-sm font-semibold text-ink/55">
          Not ready? You don't have to submit early — whatever is saved when the time runs out still counts.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onCancel} disabled={submitting} className="lab-btn rounded-xl border-2 border-ink bg-white px-4 py-2.5 font-extrabold text-ink">
            Keep working
          </button>
          <button
            onClick={onConfirm}
            disabled={submitting}
            className="lab-btn flex items-center gap-2 rounded-xl border-2 border-ink bg-signal px-4 py-2.5 font-extrabold text-ink disabled:opacity-60"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Submit for good
          </button>
        </div>
      </div>
    </div>
  );
}

// Shown until the start time. The brief is sealed server-side, so there is
// nothing to leak here — just the wait.
function WaitingRoom({ contest, phase, now }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 bg-paper px-6 py-24 text-center">
      <Hourglass className="h-14 w-14 text-pcb" />
      <div>
        <p className="ref-tag text-pcb">Game dev contest</p>
        <h1 className="font-lab text-3xl font-extrabold text-ink">{contest.title}</h1>
      </div>
      <Countdown contest={contest} phase={phase} now={now} />
      <p className="max-w-md font-semibold text-ink/60">
        Starts {fmtDateTime(contest.start_at)}. The theme is revealed the moment it begins — this page opens by itself, no need to refresh.
      </p>
      <Link to="/contests" className="text-sm font-bold text-ink/50 hover:text-pcb">← All contests</Link>
    </div>
  );
}

export default function ContestPage() {
  const { contestId } = useParams();
  const { user } = useAuth();
  const entry = useContestEntry(contestId, user?.id);
  const runner = useGameRunner();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { contest, phase, locked, code } = entry;
  const handleRun = useCallback(() => { runner.run(code); }, [runner, code]);

  const handleSubmit = async () => {
    const ok = await entry.submit();
    if (ok) setConfirmOpen(false);
  };

  if (entry.loadError && !contest) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24 text-center">
        <span className="text-5xl">🏁</span>
        <p className="font-lab text-lg font-semibold text-ink/65">{entry.loadError}</p>
        <Link to="/contests" className="lab-btn rounded-xl border-2 border-ink bg-signal px-5 py-2.5 font-extrabold text-ink">
          All contests
        </Link>
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="flex flex-1 items-center justify-center py-24 font-lab font-bold text-ink/60">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading contest…
      </div>
    );
  }

  if (phase === 'upcoming') return <WaitingRoom contest={contest} phase={phase} now={entry.now} />;

  return (
    <div className="flex w-full flex-col lg:h-[calc(100vh-64px)] lg:overflow-hidden">
      <SubmitDialog
        open={confirmOpen}
        submitting={entry.submitting}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleSubmit}
      />

      {/* Top bar: what, how long, saved?, and the two big actions */}
      <header className="flex shrink-0 flex-wrap items-center gap-3 border-b-2 border-ink bg-white px-4 py-3">
        <Link to="/contests" className="flex items-center text-ink/50 hover:text-pcb" aria-label="All contests">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="mr-auto min-w-0">
          <p className="ref-tag text-pcb">Game dev contest</p>
          <h1 className="truncate font-lab text-lg font-extrabold text-ink sm:text-xl">{contest.title}</h1>
        </div>
        <Countdown contest={contest} phase={phase} now={entry.now} />
        {!locked && <SaveStatus state={entry.saveState} error={entry.saveError} />}
        {runner.running ? (
          <button onClick={runner.stop} className="lab-btn flex items-center rounded-lg border-2 border-ink bg-white px-4 py-2 font-extrabold text-ink">
            <Square className="mr-2 h-4 w-4" /> Stop
          </button>
        ) : (
          <button
            onClick={handleRun}
            disabled={!entry.entryLoaded}
            title="Run (Ctrl/Cmd + Enter)"
            className="lab-btn flex items-center rounded-lg border-2 border-ink bg-white px-4 py-2 font-extrabold text-ink disabled:opacity-60"
          >
            <Play className="mr-2 h-4 w-4" /> Play
          </button>
        )}
        {entry.submittedAt ? (
          <span className="flex items-center gap-1.5 rounded-lg border-2 border-pcb bg-pcb/10 px-3 py-2 text-sm font-extrabold text-pcb">
            <Lock className="h-4 w-4" /> Submitted
          </span>
        ) : phase === 'live' && (
          <button
            onClick={() => setConfirmOpen(true)}
            disabled={!entry.entryLoaded}
            className="lab-btn flex items-center rounded-lg border-2 border-ink bg-signal px-4 py-2 font-extrabold text-ink disabled:opacity-60"
          >
            <Send className="mr-2 h-4 w-4" /> Submit
          </button>
        )}
      </header>

      {/* Why the editor is read-only, when it is */}
      {(entry.submittedAt || phase === 'ended' || (entry.saveState === 'error' && entry.saveError)) && (
        <div className={`shrink-0 border-b-2 px-4 py-2 text-sm font-bold ${
          entry.saveState === 'error' && !locked ? 'border-wire/30 bg-wire/10 text-wire' : 'border-ink/10 bg-paper text-ink/65'
        }`}>
          {entry.submittedAt
            ? `Submitted ${fmtDateTime(entry.submittedAt)} — your entry is locked in. You can still play it.`
            : phase === 'ended'
              ? "Time's up! Your last saved version is your entry. You can still play it."
              : entry.saveError}
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Code */}
        {/* An explicit height when stacked: the editor fills its parent with
            h-full, which resolves to 0 against a min-height alone. flex-1 is
            desktop-only because its 0 basis would override that height. */}
        <section className="flex h-[70vh] min-w-0 flex-col bg-gray-50 p-3 lg:h-auto lg:min-h-0 lg:flex-1">
          <CodeEditor
            code={code}
            onChange={entry.setCode}
            onRun={handleRun}
            starterCode={locked ? undefined : contest.starter_code || ''}
            filename="game.py"
            readOnly={locked}
          />
        </section>

        {/* Screen + brief */}
        <aside className="flex w-full flex-col gap-3 overflow-y-auto border-t-2 border-ink bg-paper p-3 lg:w-[540px] lg:border-l-2 lg:border-t-0">
          <div className="shrink-0">
            <GameCanvas width={runner.stageSize?.width || 480} height={runner.stageSize?.height || 360} />
            {runner.booting && (
              <p className="mt-2 text-center text-xs font-semibold text-ink/50">Booting the Python runtime (one-time download)…</p>
            )}
            {runner.error && (
              <pre className="mt-3 max-h-40 overflow-auto whitespace-pre-wrap rounded-xl border-2 border-wire/40 bg-wire/5 p-3 font-mono text-xs text-wire">
                {runner.error}
              </pre>
            )}
            {runner.output && !runner.error && (
              <pre className="mt-3 max-h-24 overflow-auto whitespace-pre-wrap rounded-xl border-2 border-ink/10 bg-white p-2 font-mono text-xs text-ink/70">
                {runner.output}
              </pre>
            )}
          </div>
          <BriefPanel contest={contest} result={entry.result} />
        </aside>
      </div>
    </div>
  );
}

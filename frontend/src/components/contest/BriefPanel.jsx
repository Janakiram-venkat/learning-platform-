import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ScrollText, ListChecks, Trophy, ExternalLink } from 'lucide-react';
import PicturePack from '../game/PicturePack';
import { contestService } from '../../services/api';

// Everything a student reads during a contest, tabbed under the game screen so
// the code and the stage keep most of the room.
export default function BriefPanel({ contest, result }) {
  const published = contest?.results_published;
  const [tab, setTab] = useState(published ? 'results' : 'brief');

  const tabs = [
    { key: 'brief', label: 'Brief', icon: ScrollText },
    contest?.rules ? { key: 'rules', label: 'Rules', icon: ListChecks } : null,
    published ? { key: 'results', label: 'Results', icon: Trophy } : null,
  ].filter(Boolean);

  return (
    <div className="lab-panel overflow-hidden">
      <div className="flex flex-wrap items-center gap-1 border-b-2 border-ink/10 bg-paper p-2">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-extrabold transition-colors ${
              tab === key ? 'bg-ink text-white' : 'text-ink/60 hover:bg-pcb/10 hover:text-ink'
            }`}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
        <Link
          to="/manual"
          target="_blank"
          rel="noreferrer"
          className="ml-auto flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-bold text-ink/55 hover:text-pcb"
          title="Opens in a new tab so your work stays put"
        >
          <BookOpen className="h-4 w-4" /> Game manual <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      <div className="p-4">
        {tab === 'brief' && (
          <div className="space-y-4">
            <p className="whitespace-pre-wrap leading-relaxed text-ink/80">
              {contest?.brief || 'No brief for this one: build whatever you like!'}
            </p>
            <PicturePack />
          </div>
        )}
        {tab === 'rules' && (
          <p className="whitespace-pre-wrap leading-relaxed text-ink/80">{contest.rules}</p>
        )}
        {tab === 'results' && <Results contestId={contest.id} result={result} />}
      </div>
    </div>
  );
}

function Results({ contestId, result }) {
  const [board, setBoard] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    contestService.leaderboard(contestId)
      .then(({ data }) => { if (alive) setBoard(data); })
      .catch((err) => { if (alive) setError(err?.response?.data?.detail || 'Could not load the results.'); });
    return () => { alive = false; };
  }, [contestId]);

  return (
    <div className="space-y-4">
      {result && (
        <div className="rounded-xl border-2 border-ink bg-signal/30 p-4">
          <p className="ref-tag text-ink/60">Your score</p>
          <p className="font-lab text-3xl font-extrabold text-ink">{result.score}<span className="text-lg text-ink/45"> / 100</span></p>
          {result.judge_comment && <p className="mt-2 whitespace-pre-wrap text-ink/80">“{result.judge_comment}”</p>}
        </div>
      )}
      {error && <p className="font-bold text-wire">{error}</p>}
      {board && board.length === 0 && <p className="font-semibold text-ink/50">No scores yet.</p>}
      {board && board.length > 0 && (
        <ol className="space-y-1.5">
          {board.map((row, i) => (
            <li
              key={i}
              className={`flex items-center gap-3 rounded-lg border-2 px-3 py-2 ${
                row.is_me ? 'border-ink bg-signal/40' : 'border-ink/10 bg-white'
              }`}
            >
              <span className="w-8 font-lab font-extrabold text-ink/60">
                {row.rank <= 3 ? ['🥇', '🥈', '🥉'][row.rank - 1] : `#${row.rank}`}
              </span>
              <span className="flex-1 truncate font-bold text-ink">{row.name}{row.is_me && ' (you)'}</span>
              <span className="font-lab font-extrabold text-ink">{row.score}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronDown, BookOpen, Code2, Copy, Check, Gamepad2 } from 'lucide-react';
import STAGE_SOURCE from '../game/stage.py?raw';
import { API_GROUPS as GROUPS } from '../game/stageApi';

// The in-course reference for the `stage` library.
//
// Everything a student can call, in one place, with the background logic behind
// the design, plus the library's actual source: "you are allowed to read the
// thing you are standing on" is the whole point of teaching with a small
// library instead of a black box.
//
// The item list itself lives in ../game/stageApi so this page and the public
// manual (/manual) can never drift apart. The manual is the superset: same
// functions, plus recipes, whole games and the contest guide.

function Item({ sig, what, example, note }) {
  const [open, setOpen] = useState(false);
  return (
    <li className="rounded-xl border-2 border-ink/15 bg-white p-3">
      <code className="block overflow-x-auto whitespace-pre rounded-lg bg-ink px-3 py-2 font-mono text-xs leading-relaxed text-signal">
        {sig}
      </code>
      <p className="mt-2 text-ink/80">{what}</p>
      {example && (
        <pre className="mt-2 overflow-x-auto rounded-lg border-2 border-ink/10 bg-paper px-3 py-2 font-mono text-xs leading-relaxed text-ink/75">
          {example}
        </pre>
      )}
      {note && (
        <>
          <button
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="mt-2 inline-flex items-center gap-1 text-xs font-extrabold uppercase tracking-wide text-pcb"
          >
            Why it works like that
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
          {open && <p className="mt-2 leading-relaxed text-ink/70">{note}</p>}
        </>
      )}
    </li>
  );
}

export default function GameReference() {
  const { courseId } = useParams();
  const [showSource, setShowSource] = useState(false);
  const [copied, setCopied] = useState(false);

  const copySource = async () => {
    try {
      await navigator.clipboard.writeText(STAGE_SOURCE);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch { /* clipboard blocked */ }
  };

  return (
    <div className="bench-grid flex-1 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <Link
          to={`/course/${courseId}/games`}
          className="mb-3 inline-flex items-center gap-1.5 text-sm font-bold text-ink/50 hover:text-pcb"
        >
          <ArrowLeft className="h-4 w-4" /> All games
        </Link>

        <div className="mb-6">
          <p className="ref-tag text-pcb">Reference</p>
          <h1 className="font-lab text-3xl font-extrabold text-ink">The stage library</h1>
          <p className="mt-2 text-lg text-ink/65">
            Every tool your games are built from. This page is always here: you are not expected to
            remember any of it.
          </p>
        </div>

        <div className="lab-panel mb-5 p-5">
          <h2 className="mb-1 flex items-center gap-2 font-lab font-bold text-ink">
            <BookOpen className="h-5 w-5 text-pcb" /> Where these come from
          </h2>
          <p className="text-ink/75">
            Python starts out knowing almost nothing about graphics, so every game begins by asking for
            the tools it needs by name. That is what the first line of your program does:
          </p>
          <pre className="mt-3 overflow-x-auto rounded-lg bg-ink px-3 py-2 font-mono text-xs text-signal">
            from stage import Game, Sprite, Box, Text, Ball, random_number
          </pre>
          <p className="mt-3 text-ink/75">
            <strong>stage</strong> is the small library written for this course: the one whose whole
            source you can read at the bottom of this page. Ask for a tool you did not import and Python
            says <code className="rounded bg-ink/8 px-1 font-mono">NameError</code>: it has genuinely
            never heard of it.
          </p>
          <Link
            to="/manual"
            className="mt-4 inline-flex items-center gap-2 rounded-xl border-2 border-ink bg-paper px-3 py-2 text-sm font-extrabold text-ink hover:bg-signal/30"
          >
            <Gamepad2 className="h-4 w-4 text-pcb" /> Want recipes and whole games too? Read the full manual
          </Link>
        </div>

        <div className="space-y-5">
          {GROUPS.map((g) => (
            <section key={g.id} className="lab-panel p-5">
              <h2 className="font-lab text-xl font-extrabold text-ink">{g.title}</h2>
              {g.blurb && <p className="mb-4 mt-1 text-sm text-ink/55">{g.blurb}</p>}
              <ul className="space-y-2.5">
                {g.items.map((it) => <Item key={it.sig} {...it} />)}
              </ul>
            </section>
          ))}
        </div>

        {/* The library itself — no black boxes */}
        <section className="lab-panel mt-5 p-5">
          <h2 className="flex items-center gap-2 font-lab text-xl font-extrabold text-ink">
            <Code2 className="h-5 w-5 text-pcb" /> The library's own code
          </h2>
          <p className="mt-1 text-ink/75">
            Everything above is written in ordinary Python: the same Python you have been writing. It is
            about 500 lines, and there is nothing magic in any of them. Reading the tools you use is one
            of the best habits a programmer can pick up.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => setShowSource((s) => !s)}
              className="lab-btn flex items-center gap-2 rounded-xl border-2 border-ink bg-signal px-4 py-2.5 font-extrabold text-ink"
            >
              <Code2 className="h-4 w-4" /> {showSource ? 'Hide stage.py' : 'Read stage.py'}
            </button>
            {showSource && (
              <button
                onClick={copySource}
                className="lab-btn flex items-center gap-2 rounded-xl border-2 border-ink bg-white px-4 py-2.5 font-extrabold text-ink"
              >
                {copied ? <Check className="h-4 w-4 text-pcb" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied' : 'Copy it all'}
              </button>
            )}
          </div>
          {showSource && (
            <pre className="mt-3 max-h-[32rem] overflow-auto rounded-xl border-2 border-ink bg-ink p-4 font-mono text-[11px] leading-relaxed text-white/85">
              {STAGE_SOURCE}
            </pre>
          )}
        </section>
      </div>
    </div>
  );
}

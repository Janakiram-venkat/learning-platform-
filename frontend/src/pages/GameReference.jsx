import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronDown, BookOpen, Code2, Copy, Check } from 'lucide-react';
import STAGE_SOURCE from '../game/stage.py?raw';

// The manual for the `stage` library.
//
// Everything a student can call, in one place, with the background logic behind
// the design — plus the library's actual source, because "you are allowed to
// read the thing you are standing on" is the whole point of teaching with a
// small library instead of a black box.

const GROUPS = [
  {
    id: 'setup',
    title: 'Starting a game',
    blurb: 'Every game begins and ends with these. The stage has to exist before anything can stand on it.',
    items: [
      {
        sig: 'Game(width=480, height=360, background="#0B1020")',
        what: 'Builds the stage — the screen everything is drawn on. Make this first, before any sprites.',
        example: 'game = Game(width=480, height=360, background="#0B1020")',
        note: 'Every thing you create afterwards quietly attaches itself to the stage that already exists. That is why a sprite never needs telling which screen it belongs to — and why making one BEFORE the Game gives you nothing on screen.',
      },
      {
        sig: 'game.start()',
        what: 'Hands your finished game over to the screen. Always the last line.',
        example: 'game.start()',
        note: 'Surprisingly, this does not loop. It only marks the game as ready and hands control back, so your program runs start-to-finish like any other script. The frame loop lives outside Python and calls back in once per frame — which is why a mistake in your code can never freeze the page.',
      },
      {
        sig: '@game.every_frame',
        what: 'Marks the function below it as the one to run once per frame, about 60 times a second.',
        example: '@game.every_frame\ndef update():\n    ball.x = ball.x + 3',
        note: 'A line beginning with @ is a decorator: it hands the function underneath to whatever follows the @. The game keeps it in its pocket and calls it every frame. This is why your game needs no while True: loop of its own.',
      },
      {
        sig: 'game.stop()',
        what: 'Ends the game. Your every_frame function stops being called.',
        example: 'if lives == 0:\n    game.stop()',
      },
    ],
  },
  {
    id: 'things',
    title: 'Things you can put on the stage',
    blurb: 'Four kinds of thing. Sprites and Balls are measured from their middle; Boxes and Text from their top-left corner.',
    items: [
      {
        sig: 'Sprite(look, x=0, y=0, size=40, name=None, color="#FFFFFF")',
        what: 'A character drawn from a picture. `look` is a picture name ("cat"), a constant (CAT), or an emoji.',
        example: 'cat = Sprite("cat", x=240, y=180, size=60)\nhero = Sprite("rocket", x=100, y=100, size=48)',
        note: 'Measured from its MIDDLE, so a size=60 sprite at y=180 reaches from 150 to 210. `color` only matters when the look is ordinary text — Sprite("1UP") draws the letters, and emoji bring their own colours.',
      },
      {
        sig: 'Box(x=0, y=0, width=60, height=40, color="#3FBF7F", name=None)',
        what: 'A plain coloured rectangle. Your ground, walls and platforms.',
        example: 'ground = Box(x=0, y=300, width=480, height=60, color="#1F7A5C")',
        note: 'Measured from its TOP-LEFT corner, not its middle — that is how nearly every graphics system stores a rectangle, because a corner plus a size is the cheapest thing to both draw and test for overlaps.',
      },
      {
        sig: 'Ball(x=0, y=0, radius=20, color="#E8503A", name=None)',
        what: 'A circle. Measured from its middle, like a sprite.',
        example: 'ball = Ball(x=60, y=180, radius=22, color="#E8503A")',
        note: 'Its `size` is worked out for you as radius × 2, so the collision code can treat it like anything else on the stage.',
      },
      {
        sig: 'Text(words, x=10, y=24, size=20, color="#FFFFFF", name=None)',
        what: 'Words on the stage. Scores, titles, GAME OVER.',
        example: 'label = Text("Score: 0", x=16, y=16, size=22, color="#FFC93C")\nlabel.words = "Score: 7"',
        note: 'The stage re-reads .words on every repaint, so changing it updates the screen within a sixtieth of a second. Measured from its top-left corner.',
      },
    ],
  },
  {
    id: 'moving',
    title: 'Moving and hiding things',
    blurb: 'Every thing on the stage — sprite, box, ball or text — understands all of these.',
    items: [
      { sig: 'thing.x   thing.y', what: 'Where it is. Change them to move it.', example: 'cat.x = cat.x + 3\ncat.y = cat.y - 1' },
      { sig: 'thing.move(dx, dy)', what: 'Shift by dx across and dy down — the same as adding to x and y yourself.', example: 'cat.move(3, 0)' },
      { sig: 'thing.go_to(x, y)', what: 'Jump straight to an exact spot.', example: 'apple.go_to(240, 0)' },
      { sig: 'thing.hide()   thing.show()', what: 'Make it invisible, or bring it back. It stays on the stage either way.', example: 'ghost.hide()' },
      {
        sig: 'thing.remove()',
        what: 'Take it off the stage for good.',
        example: 'coin.remove()',
        note: 'Removed things are swept up at the end of the frame, not mid-way through it, so a list you are looping over cannot change underneath you.',
      },
    ],
  },
  {
    id: 'asking',
    title: 'Asking the game questions',
    blurb: 'These give you True or False, which is exactly what an if wants.',
    items: [
      {
        sig: 'thing.touching(other)',
        what: 'True when two things overlap.',
        example: 'if basket.touching(apple):\n    game.score = game.score + 1',
        note: 'Every thing has an invisible rectangle around it called a hitbox. This asks whether the two rectangles overlap across AND down — both have to be true. It is why you sometimes die to a spike you would swear you missed: you touched its box, not its point.',
      },
      {
        sig: 'game.key_down(key)',
        what: 'True while a key is held. Use "left", "right", "up", "down", "space", or any letter.',
        example: 'if game.key_down("left"):\n    basket.x = basket.x - 6',
        note: 'It never waits — it answers instantly with what is true right now, and you ask again next frame. That is called polling, and it is why holding a key gives smooth movement rather than one nudge.',
      },
      {
        sig: 'game.clamp_inside(thing)',
        what: 'Keeps a thing from wandering off the edges of the stage.',
        example: 'game.clamp_inside(basket)',
        note: 'Works from the thing\'s real edges rather than a number you guessed, so it stays correct even after you change its size. Call it AFTER you move — move first, then correct.',
      },
      {
        sig: 'game.on_screen(thing, margin=0)',
        what: 'True while any part of the thing is still visible.',
        example: 'if not game.on_screen(bullet):\n    bullet.remove()',
      },
      { sig: 'game.frame', what: 'How many frames have run so far. Handy for timing things.', example: 'if game.frame % 60 == 0:\n    spawn_enemy()' },
    ],
  },
  {
    id: 'extras',
    title: 'Odds and ends',
    blurb: '',
    items: [
      {
        sig: 'random_number(low, high)',
        what: 'A whole number between low and high, both included.',
        example: 'apple.x = random_number(30, 450)',
        note: 'Computers cannot truly be random; they run a formula tangled enough that the answer is unpredictable to us. Good enough for a falling apple — and the same idea shuffles every online deck of cards.',
      },
      {
        sig: 'PICTURES   /   CAT, DOG, ROCKET …',
        what: 'The picture pack. Every picture has a typable name, and a SHOUTY constant you can import.',
        example: 'from stage import Game, Sprite, DOG\n\npup = Sprite(DOG, x=100, y=100)\nsame = Sprite("dog", x=200, y=100)',
      },
      {
        sig: 'thing.name',
        what: 'An optional name tag inside the thing, which the step checker can follow.',
        example: 'apple = Sprite("apple", x=240, y=0, name="apple")',
        note: 'Different from the Python label on the left of the = sign. That one is for you; this one is for the game.',
      },
    ],
  },
];

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
            Every tool your games are built from. This page is always here — you are not expected to
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
            <strong>stage</strong> is the small library written for this course — the one whose whole
            source you can read at the bottom of this page. Ask for a tool you did not import and Python
            says <code className="rounded bg-ink/8 px-1 font-mono">NameError</code>: it has genuinely
            never heard of it.
          </p>
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
            Everything above is written in ordinary Python — the same Python you have been writing. It is
            about 250 lines, and there is nothing magic in any of them. Reading the tools you use is one
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

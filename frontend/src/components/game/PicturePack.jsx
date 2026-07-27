import { useState } from 'react';
import { Palette, ChevronDown, Check } from 'lucide-react';

// The picture pack, spelled out for the student.
//
// There is no key on a laptop that types an emoji, so every picture in the
// `stage` library answers to a plain typeable name. This panel is how a learner
// finds out that's true — without it they'd hit the wall of "I want a dog and I
// can't type 🐶". Names mirror stage.py's PICTURES table.
const GROUPS = [
  { label: 'Animals', items: [
    ['cat', '🐱'], ['dog', '🐶'], ['rabbit', '🐰'], ['frog', '🐸'], ['monkey', '🐵'],
    ['panda', '🐼'], ['fox', '🦊'], ['bee', '🐝'], ['ladybug', '🐞'], ['butterfly', '🦋'],
    ['turtle', '🐢'], ['fish', '🐟'], ['octopus', '🐙'], ['crab', '🦀'], ['chick', '🐔'],
    ['unicorn', '🦄'],
  ] },
  { label: 'Food', items: [
    ['apple', '🍎'], ['banana', '🍌'], ['grapes', '🍇'], ['strawberry', '🍓'],
    ['cherry', '🍒'], ['pizza', '🍕'], ['burger', '🍔'], ['donut', '🍩'],
    ['cookie', '🍪'], ['cake', '🎂'], ['carrot', '🥕'],
  ] },
  { label: 'Sky & weather', items: [
    ['star', '⭐'], ['sparkle', '✨'], ['moon', '🌙'], ['sun', '☀️'], ['cloud', '☁️'],
    ['lightning', '⚡'], ['fire', '🔥'], ['drop', '💧'], ['rainbow', '🌈'],
  ] },
  { label: 'Plants', items: [
    ['tree', '🌳'], ['cactus', '🌵'], ['flower', '🌻'], ['mushroom', '🍄'],
  ] },
  { label: 'Balls & sport', items: [
    ['ball', '🏀'], ['football', '⚽'], ['tennis', '🎾'], ['eight_ball', '🎱'],
  ] },
  { label: 'Vehicles', items: [
    ['rocket', '🚀'], ['car', '🚗'], ['bus', '🚌'], ['plane', '✈️'],
    ['helicopter', '🚁'], ['boat', '⛵'],
  ] },
  { label: 'Things', items: [
    ['basket', '🧺'], ['castle', '🏰'], ['gift', '🎁'], ['gem', '💎'], ['key', '🔑'],
    ['bomb', '💣'], ['balloon', '🎈'], ['bell', '🔔'], ['ice', '🧊'], ['rock', '🪨'],
  ] },
  { label: 'Characters', items: [
    ['alien', '👾'], ['ghost', '👻'], ['skull', '💀'], ['robot', '🤖'], ['pumpkin', '🎃'],
  ] },
  { label: 'Symbols', items: [
    ['heart', '❤️'], ['trophy', '🏆'], ['target', '🎯'], ['medal', '🥇'],
    ['tick', '✅'], ['cross', '❌'],
  ] },
];

export default function PicturePack() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState('');

  const copy = async (name) => {
    try {
      await navigator.clipboard.writeText(`"${name}"`);
      setCopied(name);
      setTimeout(() => setCopied(''), 1200);
    } catch { /* clipboard blocked */ }
  };

  return (
    <div className="lab-panel p-4 sm:p-5">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 text-left"
      >
        <Palette className="h-5 w-5 shrink-0 text-pcb" />
        <span className="flex-1 font-lab font-bold text-ink">Pictures you can use</span>
        <ChevronDown className={`h-5 w-5 shrink-0 text-ink/35 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <p className="mt-1 text-sm text-ink/55">
        Your keyboard can't type an emoji — so every picture has a name you <em>can</em> type.
        Write <code className="rounded bg-ink/8 px-1 font-mono">Sprite("dog", x=100, y=100)</code> and
        you get a 🐶.
      </p>

      {open && (
        <>
          <div className="mt-4 space-y-4">
            {GROUPS.map((g) => (
              <div key={g.label}>
                <p className="ref-tag mb-2 text-ink/45">{g.label}</p>
                <div className="flex flex-wrap gap-1.5">
                  {g.items.map(([name, char]) => (
                    <button
                      key={name}
                      onClick={() => copy(name)}
                      title={`Copy "${name}"`}
                      className="flex items-center gap-1.5 rounded-lg border-2 border-ink/15 bg-white px-2 py-1 transition-colors hover:border-ink hover:bg-paper"
                    >
                      <span className="text-base leading-none">{char}</span>
                      <span className="font-mono text-xs font-bold text-ink/70">
                        {copied === name ? 'copied!' : name}
                      </span>
                      {copied === name && <Check className="h-3 w-3 text-pcb" />}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 rounded-xl bg-paper p-3 text-sm text-ink/70">
            Click any picture to copy its name. The code you were given already has the emoji typed in
            for you — both styles work, so you can mix them freely.
          </p>
        </>
      )}
    </div>
  );
}

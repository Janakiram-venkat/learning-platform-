import { useState } from 'react';

/**
 * Inheritance Tree: call a method on a child object and watch where Python
 * goes looking for it.
 *
 * Inheritance is usually taught as "the child gets the parent's methods", which
 * does not explain what happens when both classes define the same one. Here the
 * lookup is drawn as two steps, child first then parent, and an override toggle
 * adds `speak` to the child so the student can watch the answer change.
 */
const CALLS = [
  { call: 'eat()', own: false, says: (n) => `${n} is eating!` },
  { call: 'sleep()', own: false, says: (n) => `${n} is asleep.` },
  { call: 'fetch()', own: true, says: (n) => `${n} brings the ball back!` },
  { call: 'speak()', own: 'override', says: () => null },
];

export default function InheritanceTree() {
  const [override, setOverride] = useState(false);
  const [picked, setPicked] = useState(0);
  const name = 'Buddy';
  const c = CALLS[picked];

  // Where the lookup lands. `speak` is the interesting one: it exists on the
  // parent always, and on the child only while the override is switched on.
  const foundInChild = c.own === true || (c.own === 'override' && override);
  const speakLine = override ? `${name} says Woof!` : `${name} makes a sound.`;
  const output = c.own === 'override' ? speakLine : c.says(name);

  return (
    <div className="my-8 overflow-hidden rounded-2xl border-2 border-ink bg-white shadow-[4px_4px_0_rgba(27,27,27,0.9)] [container-type:inline-size]">
      <div className="border-b-2 border-ink bg-pcb px-4 py-3">
        <span className="font-lab text-sm font-bold text-white">Inheritance Tree</span>
      </div>

      <div className="p-5">
        <pre className="mb-5 overflow-x-auto rounded-xl border-2 border-ink bg-well px-4 py-4 font-mono-lab text-sm leading-relaxed text-white/90">
{`class Animal:
    def __init__(self, name):
        self.name = name

    def eat(self):
        print(self.name + " is eating!")

    def sleep(self):
        print(self.name + " is asleep.")

    def speak(self):
        print(self.name + " makes a sound.")


class Dog(Animal):
    def fetch(self):
        print(self.name + " brings the ball back!")
${override ? '\n    def speak(self):\n        print(self.name + " says Woof!")\n' : ''}
buddy = Dog("${name}")`}
        </pre>

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border-2 border-ink bg-paper px-4 py-3">
          <p className="text-sm font-medium text-ink/75">Give Dog its own speak() method</p>
          <button
            onClick={() => setOverride(!override)}
            aria-pressed={override}
            className={`h-10 rounded-xl border-2 border-ink px-4 font-mono-lab text-xs font-extrabold transition-colors ${
              override ? 'bg-ink text-white' : 'bg-white text-ink hover:bg-signal/30'
            }`}
          >
            {override ? 'on' : 'off'}
          </button>
        </div>

        <p className="ref-tag mb-2 text-ink/55">call a method on buddy</p>
        <div className="mb-5 grid grid-cols-2 gap-2 @min-[32rem]:grid-cols-4">
          {CALLS.map((m, i) => {
            const active = i === picked;
            return (
              <button
                key={m.call}
                onClick={() => setPicked(i)}
                aria-pressed={active}
                className={`flex h-11 items-center justify-center rounded-xl border-2 px-2 transition-colors ${
                  active
                    ? 'border-ink bg-ink text-white'
                    : 'border-ink/25 bg-white text-ink hover:border-ink hover:bg-paper'
                }`}
              >
                <span className="truncate font-mono-lab text-xs font-extrabold leading-none">
                  buddy.{m.call}
                </span>
              </button>
            );
          })}
        </div>

        {/* Child above parent, in the order Python searches them. Both boxes
            always render so the arrow between them never moves. */}
        <div className="mb-5 space-y-2">
          <ClassBox
            title="class Dog(Animal)"
            methods={override ? ['fetch', 'speak'] : ['fetch']}
            looking={c.call.replace('()', '')}
            hit={foundInChild}
            note={foundInChild ? 'Found it here, so Python stops looking.' : 'Not here. Python checks the parent next.'}
          />
          <div className="flex items-center gap-2 pl-4">
            <span className="font-mono-lab text-lg leading-none text-ink/40">↓</span>
            <span className="ref-tag text-ink/45">
              {foundInChild ? 'never needed' : 'inherits from'}
            </span>
          </div>
          <ClassBox
            title="class Animal"
            methods={['__init__', 'eat', 'sleep', 'speak']}
            looking={c.call.replace('()', '')}
            hit={!foundInChild}
            note={foundInChild ? 'Skipped. The child had its own version.' : 'Found it here, and it works on buddy all the same.'}
            dim={foundInChild}
          />
        </div>

        <p className="ref-tag mb-1 text-ink/55">output</p>
        <pre className="overflow-x-auto rounded-xl border-2 border-ink bg-well px-4 py-3 font-mono-lab text-sm font-extrabold text-signal">
{output}
        </pre>

        <p className="mt-4 text-sm font-medium leading-relaxed text-ink/70">
          Python always checks the child class first and only then the parent. That
          one rule covers both halves of inheritance: a method the child does not
          have is borrowed from the parent, and a method it does have wins.
        </p>
      </div>
    </div>
  );
}

function ClassBox({ title, methods, looking, hit, note, dim }) {
  return (
    <div
      className={`rounded-xl border-2 px-4 py-3 ${
        hit ? 'border-ink bg-mint/15' : dim ? 'border-ink/20 bg-ink/[0.04]' : 'border-ink bg-paper'
      }`}
    >
      <code className={`font-mono-lab text-sm font-extrabold ${dim ? 'text-ink/40' : 'text-ink'}`}>{title}</code>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {methods.map((m) => {
          const match = m === looking;
          return (
            <span
              key={m}
              className={`rounded-md border-2 px-2 py-0.5 font-mono-lab text-xs font-extrabold ${
                match && hit
                  ? 'border-ink bg-signal text-ink'
                  : dim
                    ? 'border-ink/15 bg-white/50 text-ink/35'
                    : 'border-ink/20 bg-white text-ink/60'
              }`}
            >
              {m}()
            </span>
          );
        })}
      </div>
      <p className={`mt-2 text-sm font-medium leading-relaxed ${dim ? 'text-ink/40' : 'text-ink/70'}`}>{note}</p>
    </div>
  );
}

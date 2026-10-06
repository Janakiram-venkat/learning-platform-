import { useState } from 'react';

/**
 * Object Builder: one class, two objects made from it, each holding its own
 * values.
 *
 * `self` is the thing that does not survive being explained in prose. Here the
 * same method is called on two objects and produces two different lines, with
 * the card that produced it highlighted, so `self` reads as "whichever object
 * you called it on" rather than as a magic word.
 */
const START = [
  { var: 'dog1', name: 'Buddy', breed: 'Golden Retriever' },
  { var: 'dog2', name: 'Max', breed: 'Pug' },
];

export default function ObjectBuilder() {
  const [dogs, setDogs] = useState(START);
  const [log, setLog] = useState([]);

  const edit = (i, field, value) =>
    setDogs(dogs.map((d, n) => (n === i ? { ...d, [field]: value } : d)));

  const bark = (d) =>
    setLog([...log, { from: d.var, text: `${d.name} says Woof!` }].slice(-5));

  const describe = (d) =>
    setLog([...log, { from: d.var, text: `${d.name} is a ${d.breed}` }].slice(-5));

  return (
    <div className="my-8 overflow-hidden rounded-2xl border-2 border-ink bg-white shadow-[4px_4px_0_rgba(27,27,27,0.9)] [container-type:inline-size]">
      <div className="border-b-2 border-ink bg-pcb px-4 py-3">
        <span className="font-lab text-sm font-bold text-white">Object Builder</span>
      </div>

      <div className="p-5">
        <p className="ref-tag mb-2 text-ink/55">the blueprint, written once</p>
        <pre className="mb-5 overflow-x-auto rounded-xl border-2 border-ink bg-well px-4 py-4 font-mono-lab text-sm leading-relaxed text-white/90">
{`class Dog:
    def __init__(self, name, breed):
        self.name = name
        self.breed = breed

    def bark(self):
        print(self.name + " says Woof!")

    def describe(self):
        print(self.name + " is a " + self.breed)`}
        </pre>

        {/* Two cards, same shape, different values: the visual argument that a
            class is a stamp and each object is its own stamped copy. */}
        <p className="ref-tag mb-2 text-ink/55">two objects stamped out of it</p>
        <div className="mb-5 grid grid-cols-1 gap-4 @min-[34rem]:grid-cols-2">
          {dogs.map((d, i) => (
            <div key={d.var} className="rounded-xl border-2 border-ink bg-paper p-4">
              <code className="font-mono-lab text-sm font-extrabold text-pcb">{d.var}</code>
              <div className="mt-3 space-y-2">
                <Field label="self.name" value={d.name} onChange={(v) => edit(i, 'name', v)} />
                <Field label="self.breed" value={d.breed} onChange={(v) => edit(i, 'breed', v)} />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  onClick={() => bark(d)}
                  className="h-11 rounded-xl border-2 border-ink bg-white px-2 font-mono-lab text-xs font-extrabold text-ink transition-colors hover:bg-pcb hover:text-white"
                >
                  {d.var}.bark()
                </button>
                <button
                  onClick={() => describe(d)}
                  className="h-11 rounded-xl border-2 border-ink bg-white px-2 font-mono-lab text-xs font-extrabold text-ink transition-colors hover:bg-pcb hover:text-white"
                >
                  {d.var}.describe()
                </button>
              </div>
            </div>
          ))}
        </div>

        <p className="ref-tag mb-1 text-ink/55">output</p>
        <div className="min-h-28 rounded-xl border-2 border-ink bg-well px-4 py-3">
          {log.length === 0 ? (
            <p className="font-mono-lab text-sm text-white/40">
              Press a button above. Both objects share the same method.
            </p>
          ) : (
            log.map((line, i) => (
              <div key={i} className="flex flex-wrap items-baseline gap-2">
                <span className="ref-tag shrink-0 text-white/35">{line.from}</span>
                <code className="font-mono-lab text-sm font-extrabold text-signal">{line.text}</code>
              </div>
            ))
          )}
        </div>

        <p className="mt-4 text-sm font-medium leading-relaxed text-ink/70">
          The <code className="font-mono-lab font-extrabold text-ink">bark</code> method
          is written once and never mentions Buddy or Max. It says{' '}
          <code className="font-mono-lab font-extrabold text-ink">self.name</code>, and
          self means whichever object you called it on. Change a name above and that
          object's line changes with it, while the other is untouched.
        </p>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <code className="w-24 shrink-0 font-mono-lab text-xs font-extrabold text-ink/55">{label}</code>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className="h-10 min-w-0 flex-1 rounded-lg border-2 border-ink bg-white px-2 font-mono-lab text-sm font-extrabold text-ink outline-none focus:bg-signal/20"
      />
    </div>
  );
}

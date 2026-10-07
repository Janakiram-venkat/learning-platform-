import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Hourglass, ListTree, AlertTriangle, CheckCircle2 } from 'lucide-react';
import LessonWidget from '../components/lesson/LessonWidget';
import { getExperiment } from '../data/chemistry';

/* ---------------------------------------------------------------------------
   One chemistry lesson: the lab widget plus the teaching around it.

   Same layout as PhysicsExperimentPage: a sticky nav bar with breadcrumb and
   prev/next, a full-width widget, then prose in a two-column grid with a
   contents rail.

   Differences from physics:
   - The worked-example table is left out. Its columns (Force / Area /
     Pressure) are physics-specific. Chemistry lessons use `sections`, the
     `formula` slot (for word equations such as
     "iron + copper sulphate → iron sulphate + copper"), `misconception`
     and `recap`.

   Public, like the course hub: no account, no backend.
--------------------------------------------------------------------------- */

const CHEM_LED = '#00B3A4';

/* One side of the prev/next pair. An unbuilt neighbour still renders — as a
   dead signpost rather than a link — so the syllabus reads as continuous
   instead of dead-ending at the last finished lesson. */
function NavArrow({ lesson, dir }) {
  if (!lesson) return <span className="min-w-0 flex-1" />;
  const back = dir === 'prev';
  const align = back ? 'justify-start text-left' : 'justify-end text-right';

  const inner = (
    <>
      {back && <ArrowLeft className="h-4 w-4 shrink-0" />}
      <span className="min-w-0">
        <span className="ref-tag block text-ink/45">{back ? 'Previous' : 'Next'}</span>
        <span className="block truncate font-bold">{lesson.title}</span>
      </span>
      {!back && <ArrowRight className="h-4 w-4 shrink-0" />}
    </>
  );

  if (!lesson.ready) {
    return (
      <span
        title="This experiment is still being built"
        className={`flex min-w-0 flex-1 cursor-not-allowed items-center gap-2 text-ink/35 ${align}`}
      >
        {inner}
      </span>
    );
  }

  return (
    <Link
      to={`/course/chemistry/${lesson.id}`}
      className={`flex min-w-0 flex-1 items-center gap-2 text-ink/70 transition-colors hover:text-pcb ${align}`}
    >
      {inner}
    </Link>
  );
}

/* Prose section: a heading, paragraphs, and an optional pulled-out formula
   (used for word equations in chemistry). */
function Section({ section }) {
  return (
    <section className="mb-10 last:mb-0">
      <h2 className="font-lab mb-3 text-2xl font-extrabold text-ink">{section.heading}</h2>
      {section.body?.map((p, i) => (
        <p key={i} className="mb-3 text-lg leading-relaxed text-ink/75">{p}</p>
      ))}

      {section.formula && (
        <div className="my-5 rounded-2xl border-2 border-ink bg-well px-6 py-5 text-center shadow-[4px_4px_0_rgba(27,27,27,0.9)]">
          <p className="font-mono-lab text-xl font-bold tracking-wide text-signal sm:text-2xl">
            {section.formula}
          </p>
          {section.formulaNote && (
            <p className="mt-3 font-mono-lab text-xs leading-relaxed text-white/60">{section.formulaNote}</p>
          )}
        </div>
      )}

      {section.after?.map((p, i) => (
        <p key={i} className="mb-3 text-lg leading-relaxed text-ink/75">{p}</p>
      ))}
    </section>
  );
}

export default function ChemistryExperimentPage() {
  const { experimentId } = useParams();
  const exp = getExperiment(experimentId);

  if (!exp) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-4 px-6 py-24 text-center">
        <span className="text-5xl" aria-hidden>🧪</span>
        <p className="font-lab text-lg font-semibold text-ink/65">That experiment does not exist.</p>
        <Link to="/course/chemistry" className="rounded-xl border-2 border-ink bg-signal px-5 py-2.5 font-extrabold text-ink">
          Back to Chemistry
        </Link>
      </div>
    );
  }

  const { block, content } = exp;

  // An unbuilt lesson still gets a real page: the syllabus context and the
  // way onward, rather than a dead end that loses the student's place.
  if (!block) {
    return (
      <div className="mx-auto w-full max-w-3xl px-6 py-16">
        <Link to="/course/chemistry" className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-ink/60 transition-colors hover:text-pcb">
          <ArrowLeft className="h-4 w-4" /> Chemistry
        </Link>
        <p className="ref-tag text-ink/55">
          Module {exp.module.id} · {exp.module.title} · Lesson {exp.number}
        </p>
        <h1 className="font-lab mt-1 text-3xl font-extrabold text-ink sm:text-4xl">{exp.title}</h1>
        <div className="mt-8 flex items-start gap-3 rounded-2xl border-2 border-dashed border-ink/30 bg-white p-6">
          <Hourglass className="mt-0.5 h-5 w-5 shrink-0 text-ink/45" />
          <div>
            <p className="font-lab text-lg font-extrabold text-ink">Still on the bench</p>
            <p className="mt-1 font-semibold text-ink/65">
              This experiment is written into the syllabus but not built yet. It
              lands here as soon as it is wired up.
            </p>
          </div>
        </div>
        <div className="mt-8 flex items-center justify-between gap-6 border-t-2 border-ink/10 pt-6">
          <NavArrow lesson={exp.prev} dir="prev" />
          <NavArrow lesson={exp.next} dir="next" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col bg-paper text-ink">
      {/* ============ Sticky nav bar ============ */}
      <div className="sticky top-0 z-30 w-full border-b-2 border-ink/10 bg-paper/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-6 py-3">
          <Link
            to="/course/chemistry"
            className="inline-flex shrink-0 items-center gap-1.5 font-bold text-ink/70 transition-colors hover:text-pcb"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Chemistry</span>
          </Link>
          <span className="ref-tag hidden min-w-0 flex-1 truncate text-ink/45 md:block">
            {exp.module.emoji} {exp.module.title} · Lesson {exp.number}
          </span>
          <span className="ref-tag ml-auto shrink-0 text-ink/45 md:ml-0">
            {exp.position.index} / {exp.position.total}
          </span>
          <div className="flex shrink-0 items-center gap-1">
            {exp.prev?.ready ? (
              <Link
                to={`/course/chemistry/${exp.prev.id}`}
                title={exp.prev.title}
                aria-label={`Previous: ${exp.prev.title}`}
                className="rounded-lg border-2 border-ink bg-white p-2 text-ink transition-colors hover:bg-pcb hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
            ) : (
              <span className="rounded-lg border-2 border-ink/20 p-2 text-ink/25" aria-hidden><ArrowLeft className="h-4 w-4" /></span>
            )}
            {exp.next?.ready ? (
              <Link
                to={`/course/chemistry/${exp.next.id}`}
                title={exp.next.title}
                aria-label={`Next: ${exp.next.title}`}
                className="rounded-lg border-2 border-ink bg-white p-2 text-ink transition-colors hover:bg-pcb hover:text-white"
              >
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <span className="rounded-lg border-2 border-ink/20 p-2 text-ink/25" aria-hidden><ArrowRight className="h-4 w-4" /></span>
            )}
          </div>
        </div>
      </div>

      {/* ============ Title + the lab widget ============ */}
      <section className="bench-grid w-full border-b-2 border-ink/10 py-8 sm:py-10">
        <div className="mx-auto max-w-7xl px-6">
          <p className="ref-tag text-pcb">
            Class 8 · Module {exp.module.id} · {exp.module.title}
          </p>
          <h1 className="font-lab mt-1 text-3xl font-extrabold text-ink sm:text-4xl">
            <span aria-hidden>{exp.module.emoji}</span> {exp.title}
          </h1>
          {block.hook && (
            <p className="mt-3 max-w-3xl text-xl font-semibold text-ink/70">{block.hook}</p>
          )}
          {content?.summary && (
            <p className="mt-3 max-w-3xl text-lg leading-relaxed text-ink/65">{content.summary}</p>
          )}

          {/* The widget declares its own container query for the internal
              scene/readout split, so it gets the full sheet width here. */}
          <div className="@container">
            <LessonWidget block={block} />
          </div>
        </div>
      </section>

      {/* ============ Teaching content + contents rail ============ */}
      <section className="w-full bg-paper py-10 sm:py-14">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-14">
            {/* --- Prose column --- */}
            <div className="min-w-0">
              {content ? (
                <>
                  {content.sections?.map((s) => <Section key={s.heading} section={s} />)}

                  {content.misconception && (
                    <div className="mb-10 flex items-start gap-4 rounded-2xl border-2 border-ink bg-wire/10 p-5 shadow-[4px_4px_0_rgba(27,27,27,0.9)]">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-2 border-ink bg-wire text-white">
                        <AlertTriangle className="h-5 w-5" />
                      </span>
                      <div>
                        <h3 className="font-lab text-lg font-extrabold text-ink">{content.misconception.heading}</h3>
                        <p className="mt-1 text-lg leading-relaxed text-ink/75">{content.misconception.body}</p>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                block.takeaway && (
                  <div className="rounded-2xl border-2 border-ink bg-white p-5 shadow-[4px_4px_0_rgba(27,27,27,0.9)]">
                    <p className="ref-tag text-ink/50">Takeaway</p>
                    <p className="mt-1 font-lab text-lg font-extrabold text-ink">{block.takeaway}</p>
                  </div>
                )
              )}

              {/* Footer nav, for a reader who got here by scrolling. */}
              <div className="mt-4 flex items-center justify-between gap-6 border-t-2 border-ink/10 pt-6">
                <NavArrow lesson={exp.prev} dir="prev" />
                <NavArrow lesson={exp.next} dir="next" />
              </div>
            </div>

            {/* --- Sticky rail: recap + where you are in the module --- */}
            <aside className="min-w-0 lg:sticky lg:top-20 lg:self-start">
              {content?.recap && (
                <div className="mb-6 rounded-2xl border-2 border-ink bg-white p-5 shadow-[4px_4px_0_rgba(27,27,27,0.9)]">
                  <p className="ref-tag mb-3 text-ink/50">Remember this</p>
                  <ul className="space-y-2.5">
                    {content.recap.map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-sm font-semibold leading-relaxed text-ink/75">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-pcb" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="rounded-2xl border-2 border-ink bg-white p-5 shadow-[4px_4px_0_rgba(27,27,27,0.9)]">
                <p className="ref-tag mb-3 flex items-center gap-1.5 text-ink/50">
                  <ListTree className="h-3.5 w-3.5" /> Module {exp.module.id} · {exp.module.title}
                </p>
                <ol className="space-y-1">
                  {exp.moduleLessons.map((l) => {
                    const num = String(l.number).padStart(2, '0');
                    if (l.current) {
                      return (
                        <li
                          key={l.id}
                          aria-current="page"
                          className="relative flex items-center gap-2.5 overflow-hidden rounded-lg border-2 border-ink bg-paper px-3 py-2"
                        >
                          <span aria-hidden className="absolute inset-y-0 left-0 w-1" style={{ background: CHEM_LED }} />
                          <span className="ml-1 font-mono-lab text-xs text-ink/50">{num}</span>
                          <span className="flex-1 font-lab text-sm font-extrabold text-ink">{l.title}</span>
                        </li>
                      );
                    }
                    if (!l.ready) {
                      return (
                        <li key={l.id} className="flex items-center gap-2.5 px-3 py-2 opacity-60">
                          <span className="font-mono-lab text-xs text-ink/35">{num}</span>
                          <span className="flex-1 text-sm font-semibold text-ink/50">{l.title}</span>
                          <Hourglass className="h-3.5 w-3.5 shrink-0 text-ink/35" />
                        </li>
                      );
                    }
                    return (
                      <li key={l.id}>
                        <Link
                          to={`/course/chemistry/${l.id}`}
                          className="flex items-center gap-2.5 rounded-lg px-3 py-2 transition-colors hover:bg-pcb/10"
                        >
                          <span className="font-mono-lab text-xs text-ink/50">{num}</span>
                          <span className="flex-1 text-sm font-bold text-ink/80">{l.title}</span>
                          <ArrowRight className="h-3.5 w-3.5 shrink-0 text-ink/40" />
                        </Link>
                      </li>
                    );
                  })}
                </ol>
                <Link
                  to="/course/chemistry"
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-ink bg-white px-4 py-2 text-sm font-extrabold text-ink transition-colors hover:bg-pcb hover:text-white"
                >
                  All modules <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}

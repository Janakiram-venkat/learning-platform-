# Class 8 Science: Shared Blueprint

**Courses:** `physics` · `chemistry` · `biology` (three separate courses)
**Audience:** Class 8 (age 12 to 14), NCERT-aligned, no prior lab access assumed
**Status:** design only, nothing built yet
**Written:** 2026-09-17 · **Owner:** Janakiram

This folder holds the blueprints for the three science courses. Read this file first: it
defines what all three share (the teaching loop, the widget engines, the lesson shape, the
motion and style rules). Each subject file then specifies its own modules, lessons and
visualizations in detail.

| File | Contents |
|---|---|
| `README.md` | This file. Shared pedagogy, engines, lesson template, rules. |
| `physics-blueprint.md` | 6 modules: Force & Pressure → Stars & the Solar System |
| `chemistry-blueprint.md` | 5 modules: Metals & Non-Metals → Chemical Effects of Current |
| `biology-blueprint.md` | 6 modules: Cell → Reaching the Age of Adolescence |

---

## 0. The one idea

**Every concept is something you watch happen, then something you make happen.**

A textbook describes pressure. This course lets the student press a brick into sand, flip it
on its side, and watch the dent change depth. Then it names what they saw. Prose is the
caption, not the lesson.

Three rules fall out of that:

1. **Show, then name.** The animation plays before the term appears.
2. **Predict, then watch.** Most animations open with a one-tap prediction ("Which hole
   squirts furthest?"). The student commits, then sees the answer. A wrong prediction is
   the most memorable moment in the lesson, so it gets the best feedback copy.
3. **Invisible things get drawn.** Air particles, sound compressions, charges, microbes,
   polymer chains, ions. Class 8 science is mostly about things too small, too fast, too
   slow or too far to see. The course's job is to make them visible.

---

## 1. The lesson loop

Every lesson follows the same five beats. Beats are content blocks in the lesson JSON, so
the renderer needs no new page type.

```
+-- HOOK ---------------------------------------------+
|  A real, familiar scene. One question.              |
|  "Why does a knife cut but a spoon doesn't?"        |
+-- PREDICT ------------------------------------------+
|  One tap. 2 to 3 options. Locks in before the demo. |
+-- WATCH --------------------------------------------+
|  The signature animation. Plays, pauses, replays.   |
|  Reveals the answer to PREDICT.                     |
+-- PLAY ---------------------------------------------+
|  The same animation, now with the student's hands   |
|  on the controls (sliders, drag, toggles).          |
+-- NAME & CHECK -------------------------------------+
|  The term, the one-line rule, a real-world example, |
|  then a 3-question quiz with explanations.          |
+-----------------------------------------------------+
```

Hard limits (from the robotics course, where they worked):

- **Interaction within 30 seconds** of the lesson opening.
- **No paragraph over 3 lines.** If it needs more, it needs an animation.
- **One idea per lesson.** Two ideas means two lessons.
- **Every lesson ends with a quiz** (3 questions, each with `explain`).

---

## 2. Platform fit

Built exactly like `backend/courses/robotics/`. No backend changes are needed:
`course_service.py` loads any course by filename convention.

```
backend/courses/physics/
  course.json                 hasEditor: false, hasLab: false
  module1.json ... module6.json
  lessons/phy-<slug>.json     one file per lesson, content blocks + quiz[]
  assignments/module<N>.json  arcade rounds (concept / match), one per module
  projects/module<N>.json     optional, see each subject file
```

Same for `chemistry/` (lesson ids `chem-…`) and `biology/` (`bio-…`).

- **Lesson ids are global localStorage keys**, so the subject prefix is mandatory.
- **Every module needs `assignments/module<N>.json`** or the sidebar's Module Challenge
  link 404s.
- Visualizations are `{ "type": "widget", "kind": "...", ...config }` blocks, registered
  with one `lazy()` line each in `frontend/src/components/lesson/LessonWidget.jsx`.
  Components live in `frontend/src/components/science/`.
- Photos use the existing `{ "type": "image" }` block with placeholders; a checklist like
  `docs/robotics-images.md` gets generated per subject.
- No em dashes in any student-facing JSON string.

---

## 3. The shared engines

The three courses need around 90 visualizations. Building 90 bespoke components is not
realistic. Building **ten engines**, each configured by lesson JSON, is. Every subject file
maps its lessons onto these kinds.

| # | Engine (`kind`) | Tech | What it does | Used by |
|---|---|---|---|---|
| E1 | `particle-box` | Canvas 2D | N particles in a container. Config: particle types, temperature, walls that move, gravity, charge, stickiness. Shows pressure, sound waves, diffusion, gas collisions, ions drifting, microbes multiplying. | Physics, Chemistry, Biology |
| E2 | `force-arena` | SVG + fixed-step integrator | A block/object on a surface with live force arrows (applied, friction, gravity, normal). Surfaces, wheels, lubricant, mass sliders. | Physics |
| E3 | `ray-bench` | SVG | 2D ray optics. Drag a torch and mirrors, rays trace with real angle maths, protractor overlay, image positions. | Physics |
| E4 | `wave-scope` | Canvas 2D + Web Audio | A vibrating source, the wave it makes, and an oscilloscope trace. Frequency and amplitude sliders. Real audible tone on tap. | Physics |
| E5 | `orrery` | three.js (reuses `Stage3D`) | Sun, Earth, Moon, planets, satellites, star field. Camera presets, time scrub. | Physics |
| E6 | `lab-bench` | SVG + DOM | A virtual chemistry bench: test tubes, burners, litmus, reagents. Drag reagent into tube, reaction plays from a rule table (colour change, bubbles, flame, precipitate, gas test). | Chemistry, Biology |
| E7 | `zoom-lens` | SVG layers + CSS transforms | Continuous zoom across scales, e.g. leaf → cell → chloroplast, or rope → fibre → polymer chain. Each layer is a labelled drawing; scroll or pinch to descend. | Chemistry, Biology |
| E8 | `process-timeline` | SVG + scrubber | A staged process with a draggable time handle, e.g. forest → coal over 300 million years, seed → harvest, egg → frog. Generalises robotics `robot-timeline` + `pipeline-stages`. | All three |
| E9 | `cycle-wheel` | SVG | A closed loop of stages with animated tokens travelling between them (nitrogen atoms, carbon, water). Tap a stage to open it. | Chemistry, Biology |
| E10 | `explorer-diagram` | SVG | A labelled diagram with hotspots: tap a part to highlight it, see its card, optionally hide labels for a self-test mode. Ear, eye, flame, cell, crop field, fractionating column. | All three |

Plus **reused as-is** from existing courses: `classify`, `sort-bins` (sorting activities),
`circuit-sandbox` (conductivity tester in chemistry), `waveform-sim` (ideas, not code),
arcade `concept` and `match` rounds.

### Engine rules

- **Config-driven.** A new lesson on an existing engine is a JSON edit, never a new
  component. If a lesson needs a special case, add a config option, not a fork.
- **The numbers are real where the concept is quantitative.** Pressure really is F/A in
  `force-arena`. Reflection angles are really computed in `ray-bench`. Calorific values in
  chemistry are NCERT's table. Where a process is stylised (microbe growth rates,
  geological time), the widget says so in a small "not to scale" tag.
- **Pause off-screen.** Mount animation loops only while in view (`useInView`, as
  `Stage3D` already does). A lesson has several widgets; only visible ones run.
- **Performance budget: low-end Android.** Canvas engines cap at 300 particles and 30 fps
  on devices reporting `hardwareConcurrency <= 4`. Test at 4x CPU throttle.
- **No CDN assets.** Textures, sounds, star catalogues are bundled or generated at runtime
  (school firewalls). Same rule as `labTextures.js`.
- **Verify behaviour headlessly.** Update rules (`F/A`, reflection, particle collisions,
  reaction rule tables) are plain ES modules with no JSX, so Node can import and assert on
  them. A backgrounded tab throttles `requestAnimationFrame`, so screenshots lie about
  motion.
- **React Compiler lint:** one `useRef` per animated value for the rAF loop, compute
  synchronously, then `setState(plainValue)`. Never side effects inside a functional
  updater.

---

## 4. Visual language (all three courses)

A shared set of symbols so a student who learns "red arrow = force" in physics never has to
relearn it.

| Thing | Drawn as |
|---|---|
| Force | Solid arrow, length ∝ magnitude, warm red |
| Motion / velocity | Dashed arrow, blue |
| Friction | Solid arrow, orange, always opposing motion |
| Energy / heat | Wavy orange lines rising |
| Light ray | Thin yellow line with a travelling arrowhead |
| Sound wave | Compression bands (dense dots) and rarefactions (sparse dots) |
| Electric current | Travelling dashes along the wire (conventional direction) |
| Electrons / charge | Small `−` and `+` discs |
| Particles / molecules | Filled circles, colour by substance, legend always visible |
| Microorganism | Rounded blob with a subject icon (rod bacterium, budding yeast, amoeba) |
| Time passing fast | A clock/calendar chip in the corner with the current scaled time |
| "Not to scale" | A small grey tag, top-right of the widget |

Subject accent colours for chrome only (never for the teaching symbols above):
physics indigo, chemistry teal, biology green.

### Motion rules

- Teaching animations run at a pace a student can narrate aloud. Default duration for a
  single event (a ray bouncing, a drop falling into a tube) is 800 to 1200 ms.
- **Every animation has Play/Pause, Replay and a 0.25x slow-motion toggle.** Slow motion is
  a teaching tool, not an accessibility afterthought: it is how the student sees the sound
  compression travel or the flame zones form.
- Loops (particles, orbits, flows) run at low contrast so labels stay readable.
- `prefers-reduced-motion`: continuous loops become a static frame with direction arrows;
  step animations still play but as crossfades.
- Celebrations are small: a tick and a colour pulse. No confetti on every quiz.

---

## 5. Assessment

- **Lesson quiz** (3 questions): at least one is "look at this frame, what happens next?"
  using a still from the lesson's own widget.
- **Module challenge** (arcade, 5 to 6 rounds): `concept` MCQs + one `match` round
  (term ↔ picture, or cause ↔ effect).
- **Misconception-targeted distractors.** Each subject file lists the known misconceptions
  per module. Every quiz draws at least one distractor from that list, and its `explain`
  names the misconception directly ("Many people think heavier objects always have more
  friction. Here is what actually changes.").
- **Explain-your-prediction** (optional, later): after a wrong PREDICT, a short tap-choice
  "why did you think that?" logged anonymously. That data tells us which animations are
  not landing.

---

## 6. Sensitive topics

Biology Modules 5 and 6 (Reproduction in Animals, Reaching the Age of Adolescence) follow
NCERT content and nothing beyond it. Specific rules are in `biology-blueprint.md` §Sensitive
content. Summary: schematic line diagrams only (never realistic renders or photos of
people), clinical and respectful language, no quizzes that single anyone out, and a short
note for parents and teachers at the top of each module.

Safety content (lightning, fire, electricity, chemicals) always ends with a clear "what to
do" card. Virtual experiments that would be dangerous at home (sodium in water, burning
magnesium, electrolysis) carry a small "watch here, don't try at home" tag.

---

## 7. Build order across the three courses

Engines first, because they unlock many lessons at once.

| Phase | Build | Unlocks |
|---|---|---|
| 1 | `explorer-diagram`, `process-timeline`, `particle-box` | ~40% of all lessons across the three courses |
| 2 | `force-arena`, `lab-bench`, `zoom-lens` | Physics M1–M2, Chemistry M1 & M5, Biology M1 |
| 3 | `ray-bench`, `wave-scope`, `cycle-wheel` | Physics M3–M4, Biology M2 nitrogen cycle |
| 4 | `orrery` (three.js) | Physics M6 |
| 5 | Content pass: all lesson JSON, quizzes, arcades, image checklists | Everything |

Suggested first vertical slice (proves the whole loop end to end): **Physics M1 lesson
"Pressure"** (`force-arena`) + **Chemistry M3 lesson "Zones of a flame"**
(`explorer-diagram`) + **Biology M1 lesson "Plant vs animal cell"** (`zoom-lens`).

---

## 8. Open questions for Janakiram

1. **Three courses or one?** This blueprint assumes three separate courses (`physics`,
   `chemistry`, `biology`) so each gets its own progress bar and card. The alternative is
   one `science` course with 17 modules grouped by subject.
2. **Module order.** Chemistry and Biology files propose reordering the chapter list so
   prerequisites come first (marked **[DEVIATION]**). Keep NCERT order instead?
3. **Projects.** Each subject proposes one small project per module. Keep them, or ship
   lessons + arcade only (like robotics) first?
4. **Language.** English only for now, or plan for Hindi labels in the widgets from day
   one (all widget text is already in JSON, so this is cheap if decided early)?
5. **Biology M5–M6 visibility.** Visible by default, or behind a teacher/parent toggle?

# Robotics Course — Production Blueprint

**Course ID:** `robotics` · **Format:** `lab3d` · **Status:** design only, nothing built yet
**Audience:** Grade 6+, absolute beginners, zero electronics knowledge
**Written:** 2026-07-27 · **Owner:** Janakiram

This is the reference document for building the fourth course on Pocket Lab, alongside
`python`, `ai` and `gamedev`. It is written so a developer can open it and start
implementing without asking design questions. Where a decision was made against the
original brief, it is marked **[DEVIATION]** with the reason.

---

## 0. Executive summary

The whole course hangs on one idea: **the robot is the teacher.**

A student lands in a 3D lab. A finished robot is standing on the bench. They can spin it,
pull it apart, click any part, and every part they click opens a lesson about itself.
There is no chapter list to read through — the curriculum *is* the robot's parts list, and
the robot gets more capable as the student progresses.

Three learning surfaces, reused everywhere:

| Surface | What it is | Component |
|---|---|---|
| **The Bench** | The 3D robot viewer. Orbit, explode, x-ray, click a part. | `RobotBench` |
| **The Card** | A component lesson: how it works, animated, with a simulator. | `ComponentLesson` |
| **The Sim** | A 2D top-down world where the student's robot logic actually drives. | `RobotSim` |

Everything else (quizzes, projects, XP) reuses the existing platform machinery.

---

## 1. Full curriculum

12 modules, ~45 lessons, ~40 hours. Each module ends with a **Build Step** — the student
physically adds something to their robot in the 3D bench, and the robot on the Home
dashboard visibly upgrades.

| # | Module | Robot state after this module | Hours |
|---|---|---|---|
| 1 | What Is a Robot? | Bare bench, gallery of 8 robots | 2 |
| 2 | Meet Your Robot | Full robot revealed, explorable | 2 |
| 3 | Electricity, Gently | Chassis + battery + switch — it has power | 3 |
| 4 | The Brain | ESP32 mounted, onboard LED blinks | 3 |
| 5 | Making Things Move | Motor driver + 2 DC motors + wheels — it drives | 4 |
| 6 | Precise Movement | Servo head + stepper arm joint | 3 |
| 7 | Giving It Senses | Ultrasonic + IR line sensors mounted | 4 |
| 8 | Advanced Senses | Camera + LiDAR + mic + speaker | 4 |
| 9 | Thinking in Blocks | (no hardware) block programming | 3 |
| 10 | Real Code | (no hardware) Python → MicroPython | 4 |
| 11 | Robots That Think (AI) | Vision + voice module, robot is autonomous | 4 |
| 12 | Build & Compete | Student's own robot, full simulator arena | 4 |

**Prerequisite:** Python Modules 1–4 (variables, if/else, loops, functions), enforced the
same way `gamedev/course.json` declares `prerequisite`. Modules 1–8 need *no* programming
at all, so a student can start on day one and hit the gate at Module 9.

---

## 2. Module hierarchy

Node types, in order of how they nest:

```
Course (robotics)
└── Module            "Making Things Move"
    ├── Lesson        narrative + animation + quiz          → /course/robotics/lesson/:id
    ├── Component     a clickable part, opens ComponentLesson → /course/robotics/part/:partId
    ├── Sim           an interactive simulator screen        → embedded in lesson or standalone
    ├── Build Step    assemble something on the 3D robot     → /course/robotics/build/:moduleId
    └── Project       a full mini-build, graded              → /course/robotics/module/:id/project
```

A Component belongs to exactly one module (its "home" module — where it is first taught),
but is reachable forever from the Bench once unlocked. This is the key navigation idea:
**linear when you want it, free-roam when you're curious.**

---

## 3. Modules in detail

### Module 1 — What Is a Robot?

> *"A washing machine follows the same steps every time. A robot looks around first."*

**Objectives** — By the end the student can (1) state the sense→think→act loop, (2) decide
whether a given machine is a robot and defend the answer, (3) name six robot families and
one job each.

**Lessons**
1. `intro` — Sense, Think, Act. The three-box animation that the whole course returns to.
2. `machine-vs-robot` — Toaster, washing machine, Roomba, self-driving car. Sorting game.
3. `history` — Interactive timeline, 1495 (da Vinci's knight) → 2026.
4. `robot-zoo` — Eight robot families in a 3D gallery.

**Activities**
- **Robot or Not?** — 12 cards, swipe/drag into two bins. Immediate verdict + one-line
  reason. Cards deliberately include hard ones: a vending machine (no), a thermostat
  (borderline — celebrate the argument), a factory arm (yes), a puppet (no).
- **Robot Zoo** — a low-poly robot on a turntable per family: industrial arm, surgical
  robot, humanoid, Mars rover, bomb-disposal, vacuum, delivery bot, quadcopter. Click →
  it plays its 3-second signature animation (arm welds, rover wheel-rocker articulates,
  drone lifts off) and a card slides in: *what it does / where it works / why a human
  doesn't*.
- **Timeline scrubber** — drag a slider along a horizontal rail; each decade snaps in a
  milestone with a silhouette illustration. Scrubbing is the interaction; there's no
  "next" button.

**Quiz** — 6 questions, all scenario-based, no definitions. *"A drone flies a route you
typed in and never changes it. Robot?"*

**Mini project** — **Design a robot for your school.** Pick a chore, choose sense/think/act
for it from three dropdowns, name it. Output is a shareable card. Not auto-graded; graded
on completion. This is the emotional hook — they own a robot idea before learning any
electronics.

---

### Module 2 — Meet Your Robot

The centrepiece. The student walks into the lab and **ARIA** (our teaching robot) is
standing there.

**Objectives** — Navigate the 3D bench confidently; name the six body systems; locate any
named part on the robot within 10 seconds.

**Lessons**
1. `the-lab` — Onboarding. A guided 60-second camera tour, then controls unlock one at a
   time with a coach-mark: *drag to rotate → scroll to zoom → tap a part.*
2. `body-systems` — Six systems colour-coded: **power** (yellow), **brain** (green),
   **movement** (red), **senses** (cyan), **communication** (violet), **structure**
   (grey). Toggle a system → everything else desaturates to 15% opacity.
3. `exploded-view` — A single slider drives the explosion. At 0% assembled, at 100% every
   part floats in its own labelled slot.
4. `part-hunt` — Assessment as a game (below).

**3D capabilities in this module** (all live in `RobotBench`)
- Orbit / zoom / pan, with a damped return-to-home button
- **Exploded view** — one float slider, every part lerps along a precomputed offset vector
- **X-ray** — chassis shells go 20% opacity + fresnel rim, guts fully visible
- **Wireframe** — for the "what is a 3D model anyway" aside
- **Hover** — 1.03× scale, emissive lift, name tag follows cursor
- **Select** — outline pass glow + camera eases to that part's framing
- **Isolate** — double-click a part, everything else fades out

**Activity — Part Hunt.** Timed. *"Find the ultrasonic sensor."* Student rotates and clicks.
Correct → confetti + the part's name latches on permanently. Wrong → the clicked part
shakes and says its own name (a wrong answer still teaches). Three difficulty tiers; tier 3
turns off all labels.

**Quiz** — Six "click the part" questions rendered inside the 3D view, not as text MCQs.

---

### Module 3 — Electricity, Gently

**[DEVIATION]** The brief said no equations. Holding to that through Module 3 entirely —
Ohm's law appears in Module 5 only, and even then as a slider you feel, with the formula
shown afterwards as *"the pattern you just found."*

**Objectives** — Explain voltage/current/resistance with the water analogy; trace a circuit
and say whether it is complete; wire series vs parallel and predict brightness; state the
three battery safety rules.

**Lessons**
1. `what-is-electricity` — The water analogy, animated: a tank (battery), pipe width
   (resistance), flow rate (current), tank height (voltage). Split-screen — water on the
   left, the identical circuit on the right, both animate together.
2. `the-loop` — A circuit must be a complete loop. Cut the wire → animation stops mid-flow
   and electrons pile up at the break.
3. `battery` — Component lesson. Chemical → electrical. Cutaway of an 18650 cell.
4. `switch` — Component lesson. Just a controlled gap in the loop.
5. `series-parallel` — Two LEDs, four wirings, predict-then-check.
6. `ground` — Why everything shares a floor. The "sea level" analogy.

**Interactive simulator — Circuit Sandbox (2D SVG, not 3D).** Drag battery / wire / LED /
resistor / switch onto a grid. Snap to nodes. When the loop closes, current animates as
travelling dashes and the LED lights **instantly** — no run button, no compile. Brightness
is genuinely computed (I = V/R) so a bigger resistor visibly dims it.
Failure states are lessons: short circuit → wire glows red, smoke puff, *"you gave the
current a shortcut — it skipped your LED"*; reversed LED → nothing happens + a hint about
the flat edge.

**Build Step 1** — Drag chassis, battery holder and power switch onto the bench. Flip the
switch. **The status LED lights for the first time.** Big moment — hold the camera on it,
play a power-up sound.

**Quiz** — 8 questions, three of them "will this LED light?" circuit diagrams.

---

### Module 4 — The Brain

**Objectives** — Explain what a microcontroller is (a computer with no screen that talks to
wires); identify GPIO pins; explain digital HIGH/LOW; read a pinout; explain why the ESP32
has Wi-Fi and what that unlocks.

**Lessons**
1. `microcontroller` — "A computer so small it forgot it needed a screen."
2. `esp32` — Component lesson, the hero chip.
3. `arduino` — Component lesson, and honestly: *why two boards exist, and when to pick which.*
4. `gpio` — Interactive pinout. Hover a pin → it highlights on the 3D board too.
5. `digital-signals` — HIGH/LOW as a light switch; an oscilloscope-style trace scrolls by.
6. `pwm` — Fake in-between values by blinking very fast. Duty-cycle slider drives an LED
   whose brightness tracks it, with the square wave drawn underneath. Slow the animation to
   1 Hz and the "brightness" resolves into visible blinking — the aha.

**Build Step 2** — Mount the ESP32 on the chassis, run the power rails. Wires animate
themselves into place. Onboard LED starts blinking.

**Project** — **Traffic Light.** Wire three LEDs, sequence them in the block editor. Graded
on: correct pins, correct order, correct dwell times.

---

### Module 5 — Making Things Move

**Objectives** — Explain why a controller can't power a motor directly; explain an H-bridge
as four switches; predict wheel direction from two pin states; relate PWM duty to speed;
compute robot turning from differential drive.

**Lessons**
1. `motors-intro` — Electricity + magnets = spin.
2. `dc-motor` — Component lesson.
3. `motor-driver` — Component lesson (L298N / DRV8833). The H-bridge as four switches on a
   diamond; tap switches to close them and watch the motor spin, stop, or **short** (two on
   the same side → red X, *"you just made a shortcut again"* — callback to Module 3).
4. `why-not-direct` — The controller can source 40 mA; the motor wants 800 mA. Animated
   with a garden hose vs a fire hose.
5. `wheels-chassis` — Component lessons. Wheel diameter → distance per turn.
6. `differential-drive` — Two wheels, four combinations: forward, back, spin, arc.

**Simulators**
- **DC Motor Bench** — voltage slider (0–12 V), direction toggle, load dial. The 3D motor's
  rotor spins at the real computed RPM, current draw shown on a gauge. Crank the load with
  low voltage → it stalls, current spikes red, *"this is how motors burn out."*
- **Drive Trainer** — two sliders, one per wheel, and a top-down robot that moves for real.
  Challenge: *"make it turn left without stopping"*, *"make it spin on the spot."* Trace
  line drawn behind it.

**Build Step 3** — Motor driver, two DC motors, two wheels, a caster. **The robot drives.**
Free-drive mode unlocks with on-screen arrow buttons.

**Project** — **Square Dance.** Program the robot to drive a perfect square and return to
its start. Graded on final position within tolerance + four detected 90° turns.

---

### Module 6 — Precise Movement

**Objectives** — Choose the right motor for a job; explain closed-loop feedback in a servo;
explain stepper coil sequencing; compute steps needed for a given angle.

**Lessons**
1. `servo` — Component lesson. **Cutaway is essential**: motor → gear train → potentiometer
   → control board. Show the feedback loop as a literal loop arrow: *commanded angle vs
   measured angle → error → drive until zero.* Push the horn away with the mouse and watch
   it fight back to position.
2. `servo-signal` — The 1–2 ms pulse. Pulse-width slider ↔ angle, both directions.
3. `stepper` — Component lesson. Step through coil energising one click at a time; magnetic
   field lines animate; rotor snaps 1.8° per step. Then speed it up to continuous.
4. `gears` — Gear ratio: trade speed for strength. Two meshing gears you can resize.
5. `choosing` — Decision-tree activity: continuous rotation? exact angle? high torque?
   → recommends DC / servo / stepper.

**Simulators**
- **Servo Dial** — drag an angle dial or hit preset buttons (0/45/90/180). Physical 3D horn
  follows with realistic slew rate and a tiny overshoot.
- **Stepper Stepper** — a big "STEP" button. Each press: one coil pattern change, one 1.8°
  rotation, counter increments. Hold to go continuous. Microstepping toggle.

**Build Step 4** — Servo-mounted sensor head + a stepper arm joint. The head can now sweep.

---

### Module 7 — Giving It Senses

**Objectives** — Explain the sense→think→act loop with real hardware; explain time-of-flight
distance measurement; read an IR sensor's digital output; write the two behaviours that
define a beginner robot (obstacle avoidance, line following).

**Lessons**
1. `senses-intro` — Callback to Module 1's three boxes; now box one has hardware.
2. `ultrasonic` — Component lesson. **The signature animation of the course**: an expanding
   arc of sound leaves the emitter, travels, hits a wall, returns; a stopwatch runs the
   whole time; distance = speed × time ÷ 2 is *derived on screen* from the animation, not
   stated first. Drag the wall → everything recomputes live. Angle the wall past ~45° → the
   echo bounces away and the sensor reads garbage. That failure is the lesson.
3. `ir-sensor` — Component lesson. Emitter + detector. Slide a black/white surface under it
   → the output pin flips HIGH/LOW with a satisfying click.
4. `line-following` — Two IR sensors, four states, four responses. Truth table built by the
   student, then the robot drives with their table.
5. `temperature` — Component lesson. Brief; used as the "sensors aren't only for distance"
   example.
6. `buttons` — Component lesson. Debouncing as a visible bouncing-signal trace.

**Simulators**
- **Sonar Field** — top-down; robot at centre, servo head sweeping; each ping draws a ray
  and drops a dot at the hit distance. Sweep builds a fan-shaped map. Drag obstacles around
  and watch the map update.
- **Line Lab** — draw a track with the mouse, place the robot, tune the two sensors'
  spacing, and watch it follow. Bad spacing → it oscillates or falls off. Tunable, so it's
  a real engineering exercise.

**Build Step 5** — Ultrasonic on the servo head, two IR sensors underneath.

**Project** — **Obstacle Avoider.** In the simulator, the robot must cross a room with six
obstacles without touching anything. Blocks or Python.

---

### Module 8 — Advanced Senses

**Objectives** — Explain how a camera turns light into numbers; explain a pixel grid and
resolution trade-offs; explain LiDAR vs ultrasonic; explain why a sound wave becomes a
waveform.

**Lessons**
1. `camera` — Component lesson. Light → lens → sensor grid → numbers. Zoom into an image
   until individual pixels are visible with their RGB values. Then the pipeline: capture →
   resize → grayscale → detect → decide, as five animated stages with the image visibly
   transforming at each one.
2. `lidar` — Component lesson. A spinning laser. **The point-cloud reveal**: watch 360 dots
   accumulate over one rotation until the room's shape appears out of nothing.
3. `lidar-vs-ultrasonic` — Side-by-side same room. Cost, accuracy, resolution, failure
   modes (glass beats LiDAR; soft fabric beats ultrasonic).
4. `microphone` — Component lesson. Sound → membrane → waveform. Live mic input if the
   browser grants it; canned waveform otherwise.
5. `speaker` — Component lesson. The reverse. Frequency slider you can actually hear.
6. `display` + `rgb-led` — Component lessons. Output isn't only movement.

**Build Step 6** — Camera, LiDAR turret, mic and speaker. ARIA is now fully sensed.

---

### Module 9 — Thinking in Blocks

No hardware. Pure logic. **[DEVIATION]** The brief listed flowcharts and blocks as separate
items; merging them — the block stack *renders* as a flowchart on the right, live, so the
student learns both notations for free.

**Objectives** — Read and write sequences, conditionals and loops as blocks; trace an
algorithm by hand before running it; convert a behaviour description into blocks.

**Lessons**
1. `algorithms` — "Instructions so exact a robot can't misread them." The
   peanut-butter-sandwich bit, but with the robot deliberately misinterpreting.
2. `sequence` — Blocks in order.
3. `decisions` — `if distance < 20`. The diamond shape.
4. `loops` — `repeat forever` / `repeat 4 times`.
5. `putting-together` — Build obstacle avoidance from scratch in blocks.

**Block palette** (deliberately tiny — 14 blocks total):
`move forward` · `move backward` · `turn left` · `turn right` · `stop` · `wait n seconds` ·
`set speed` · `read distance` · `read line sensor` · `if / else` · `repeat forever` ·
`repeat n times` · `set LED colour` · `say`

Every block runs the *same* robot in the *same* simulator used in Modules 10–12. The
student never re-learns the world when they switch to Python.

**Project** — **Maze Runner (blocks).** A fixed maze; solve it with blocks. Star rating on
block count — 3 stars for the elegant loop-based solution, 1 star for a hardcoded sequence.

---

### Module 10 — Real Code

**Objectives** — Read the Python equivalent of a block program; write robot Python using
variables, `if`, `while` and functions; explain what MicroPython is and how it differs.

**Lessons**
1. `blocks-to-code` — **The bridge lesson.** Split screen: their Module 9 maze solution in
   blocks on the left, generated Python on the right. Drag a block → the corresponding line
   highlights. Then the blocks fade out and only code remains.
2. `robot-python` — The `robot` API (below).
3. `variables-and-sensors` — `d = robot.distance()`.
4. `control-flow` — `while True:` as the robot's heartbeat.
5. `functions` — `def avoid_obstacle():` — package a behaviour.
6. `micropython` — What actually runs on the ESP32. Same language, smaller. Show real
   `machine.Pin` code and map it to the simulator API line by line.
7. `real-hardware` — The honest bridge: flashing, USB, Thonny, what changes and what
   doesn't. Bill of materials for a real build (~₹3,500).

**The `robot` API** — deliberately small, mirrors the blocks exactly:

```python
robot.forward(speed=50)      # -100..100
robot.backward(speed=50)
robot.left(degrees=90)
robot.right(degrees=90)
robot.stop()
robot.wait(seconds)
robot.distance()             # cm, from the ultrasonic
robot.line()                 # (left, right) booleans
robot.see()                  # list of detected objects (Module 11+)
robot.heard()                # last voice command (Module 11+)
robot.led(r, g, b)
robot.say("text")
```

**Implementation note:** this runs on the existing Pyodide worker. Like `stage.py` in the
gamedev course, `robot.py` is written into the Pyodide FS and the **JS side drives the
loop** — Python's `while True:` is the one exception and needs handling; see §14.

---

### Module 11 — Robots That Think (AI)

**Objectives** — Explain the difference between programmed rules and learned behaviour;
explain training data; describe object detection, face detection, gesture and voice
recognition at a conceptual level; explain why an autonomous robot needs all of it.

**Lessons**
1. `rules-vs-learning` — Side-by-side: a rule-based line follower (breaks on a dashed line)
   vs a learned one (copes). Same robot, same track.
2. `training-data` — **Teach the robot.** The student labels 20 images as cat/dog by hand,
   then watches an accuracy bar climb as they label more. Then they feed it a blurry
   picture and it gets it wrong — the point being that data quality is the whole game.
3. `object-detection` — Bounding boxes appearing on a live scene, confidence scores ticking.
4. `face-detection` — Landmarks, and a short honest note on privacy and consent.
5. `gesture` — Hand pose → command mapping.
6. `voice` — Sound wave → text → intent → action, as four animated stages.
7. `autonomous-nav` — All of it together: map, localise, plan, drive, replan when the world
   changes. A path is drawn, an obstacle appears, the path re-draws.

**[DEVIATION]** Nothing here runs a real neural net in the browser. Detections are scripted
against known scene contents with plausible confidence jitter. This is honest teaching for
Grade 6 and it keeps the bundle small. If real inference is wanted later, TensorFlow.js +
COCO-SSD drops into `object-detection` alone — see §16.

**Build Step 7** — The AI module. ARIA can now be told to *"find the red ball"* and does it.

**Project** — **Sorting Robot.** Coloured blocks scattered; sort them into matching bins
using `robot.see()`.

---

### Module 12 — Build & Compete

**Objectives** — Assemble a working robot from parts unaided; diagnose a non-working robot;
plan and complete an open-ended build.

1. `full-assembly` — **The final exam, and it's a game.** Empty bench, a parts crate, a
   spec sheet. Build it. No hints unless requested (hint costs XP). Wrong placement →
   the part refuses to snap and the slot pulses red; ask for a hint and get an escalating
   nudge, never the answer.
2. `debug-lab` — Four broken robots. Symptoms only: *"drives in circles"*, *"LED on but
   nothing moves"*, *"distance always reads 0"*, *"resets when the motors start"*. Find and
   fix. This is the most valuable screen in the course.
3. `arena` — Three challenge tracks in the simulator: Maze Sprint, Line Race, Warehouse.
   Leaderboard on time + code elegance.
4. `capstone` — Design and build your own robot for your own problem. Free-form. Submitted
   as a shareable card + the code. Certificate on completion.

---

## 4. Component lesson template

Every one of the 22 components uses this exact shape, so the JSON is uniform and one
component renders them all.

```
┌─ HERO ────────────────────────────────────────────┐
│  3D part on a turntable · name · one-line "what   │
│  it is" · [Back to robot]                         │
├─ WHY IT EXISTS ───────────────────────────────────┤
│  The problem it solves, in one analogy            │
├─ HOW IT WORKS ────────────────────────────────────┤
│  The signature animation. The heart of the page.  │
├─ INSIDE ──────────────────────────────────────────┤
│  Cutaway / exploded internals, labelled           │
├─ TRY IT ──────────────────────────────────────────┤
│  Interactive simulator                            │
├─ IN THE REAL WORLD ───────────────────────────────┤
│  3 photos/scenes where this part is used          │
├─ TYPES ───────────────────────────────────────────┤
│  Variants side-by-side, with pick-one guidance    │
├─ SPECS ───────────────────────────────────────────┤
│  Voltage, current, size, price. A real table.     │
├─ GOOD / BAD ──────────────────────────────────────┤
│  Two columns. Honest.                             │
├─ WATCH OUT ───────────────────────────────────────┤
│  Safety + the 3 mistakes everyone makes           │
├─ CHECK YOURSELF ──────────────────────────────────┤
│  3-question quiz                                  │
└─ CHALLENGE ───────────────────────────────────────┘
   One small task using the simulator. XP.
```

Sections are optional per component (a wire doesn't need a cutaway) — the renderer skips
absent keys. **Every section must be scannable in under 20 seconds.** Hard rule: no
paragraph over 3 lines, ever. If it needs more, it needs an animation instead.

### The 22 components and their home modules

| Component | Module | Signature animation | Simulator |
|---|---|---|---|
| Battery | 3 | Chemical → electrons flowing out | Voltage/capacity, drain over time |
| Wires | 3 | Electrons in a conductor vs insulator | — |
| Switch | 3 | Gap closing, loop completing | Toggle |
| Breadboard | 3 | X-ray showing the hidden metal strips | Drag components, see connections |
| Buttons | 4 | Contact bounce trace | Debounce slider |
| ESP32 | 4 | Signals radiating from pins + Wi-Fi | Pin toggler |
| Arduino | 4 | Same, simpler | Pin toggler |
| RGB LED | 4 | Three dies mixing to one colour | R/G/B sliders |
| Display | 8 | Pixel grid filling row by row | Type text, see it render |
| Motor Driver | 5 | H-bridge switches flipping | Tap switches |
| DC Motor | 5 | Cutaway: commutator + brushes + field | Voltage/load/direction |
| Wheel | 5 | One rotation = one circumference | Diameter → distance |
| Chassis | 5 | Load paths, centre of mass | Move weight, see tipping |
| Servo Motor | 6 | Feedback loop correcting error | Angle dial |
| Stepper Motor | 6 | Coils energising in sequence | Step button |
| Ultrasonic | 7 | **Sound wave out, echo back, stopwatch** | Drag the wall |
| IR Sensor | 7 | IR beam reflecting off white, absorbed by black | Slide a surface |
| Temperature | 7 | Resistance changing with heat | Heat/cool slider |
| Camera | 8 | Light → grid → numbers | Resolution slider |
| LiDAR | 8 | **Spinning laser building a point cloud** | Drag walls, watch map |
| Microphone | 8 | Membrane vibrating → waveform | Live/canned input |
| Speaker | 8 | Waveform → membrane → air | Frequency slider |

---

## 5. UI design

**[DEVIATION — important]** The brief asks for a blue-and-white Apple aesthetic. The
platform already has a committed identity: the **Workbench** electronics-kit system
(paper `#EDF3EE`, ink `#16241D`, pcb green `#1F7A5C`, signal yellow `#FFC93C`, wire red
`#E8503A`, LED cyan `#23B5D3`; Bricolage Grotesque display, Nunito body, Space Mono for
readouts). Every other page in the app was migrated to it.

Introducing a second visual language for one course would fracture the product. So:
**keep Apple's structural principles — generous whitespace, one primary action per screen,
depth through layering, motion that explains rather than decorates — and express them in
Workbench tokens.** A robotics course is the *most* on-theme thing Pocket Lab could ship;
the electronics-kit look is an asset here, not a compromise.

If a distinct look is still wanted, the cheapest honest version is a **course accent
override**: the robotics course sets `--course-accent: var(--color-led)` (cyan) and the
3D viewport uses a deep slate-blue environment. Same system, different temperature.

### Screen layouts

**The Bench** (Module 2 onward, also the course home)
```
┌────────────────────────────────────────────────────────┐
│  ← Robotics          Module 5 of 12  ▓▓▓▓▓░░░  Lv 7  ⚡ │
├──────────────┬─────────────────────────────────────────┤
│              │                                         │
│  SYSTEMS     │                                         │
│  ⚡ Power  ●  │            [ 3D ROBOT ]                 │
│  🧠 Brain  ●  │                                         │
│  ⚙ Movement  │        (fills the space — the           │
│  👁 Senses ●  │         robot is the interface)         │
│  📡 Comms  ○  │                                         │
│  🔩 Frame  ●  │                                         │
│              │                                         │
│  VIEW        │   ┌──────────────────────────────┐      │
│  [Solid]     │   │ Ultrasonic Sensor            │      │
│  [X-ray]     │   │ Measures distance with sound │      │
│  [Wire]      │   │ ✓ Learned · 3 min            │      │
│  [Explode ▬▬]│   │        [Open lesson →]       │      │
│              │   └──────────────────────────────┘      │
├──────────────┴─────────────────────────────────────────┤
│  ▶ Continue: Module 5, Lesson 3 — Motor Driver         │
└────────────────────────────────────────────────────────┘
```
Mobile: 3D fills the screen, systems collapse to a bottom sheet, the part card slides up
from the bottom. Explode becomes a two-finger pinch-out gesture.

**Component lesson** — single scrolling column, max-width 720 px for text, full-bleed for
animations and simulators. Sticky mini-header with the part name and a progress hairline.

**Simulator screens** — canvas dominant, controls in a single `lab-panel` strip below on
mobile / right on desktop. Never more than 5 controls visible at once.

### Motion rules
- Camera moves ease with `cubic-bezier(.22,.61,.36,1)`, 600–900 ms. Never instant cuts.
- A part that becomes selected scales 1.03× over 180 ms. That's it.
- Electricity/data flows loop continuously but at **low contrast** so they don't fight the
  content. They brighten on hover.
- Respect `prefers-reduced-motion`: flows become static dashed lines with a direction
  arrow; camera transitions become cuts.

### Dark mode
The bench is dark-first (a dark viewport makes glow effects work). Page chrome follows the
app's existing light default with a dark override. Ship `[data-theme]` on `:root` from day
one — retrofitting is painful.

---

## 6. 3D interaction catalogue

| Interaction | How | Difficulty |
|---|---|---|
| Orbit / zoom / pan | drei `OrbitControls`, damped, polar-clamped | trivial |
| Hover highlight | raycast → emissive + scale on the hovered mesh | easy |
| Select glow | postprocessing `OutlinePass` on selected meshes | easy |
| Interactive label | drei `<Html>` billboard anchored to a part's `Object3D` | easy |
| Exploded view | per-part `explodeOffset` vec3 authored in Blender as custom props; lerp by slider | easy |
| Transparent / x-ray | swap shell materials to `transparent opacity .2` + fresnel shader | medium |
| Wireframe | `material.wireframe = true` across the tree | trivial |
| Isolate | fade all non-target parts to opacity 0 with a shared uniform | easy |
| Cutaway | a clipping plane driven by a slider (`renderer.localClippingEnabled`) | medium |
| Cross-section | clipping plane + a stencil-buffer cap so the cut looks solid | hard |
| Drag & snap assembly | pointer drag on a ground plane, snap when within radius of a slot, spring-settle | medium |
| Take apart | reverse of the above; parts fly to the crate | easy |
| Rotating motor | animate `rotation.z` at the simulated RPM | trivial |
| Moving gears | two meshes, `rotation` inversely proportional to tooth count | trivial |
| Battery compartment | authored open/close animation clip, scrubbed by a toggle | easy |
| Wire highlighting | wires are `TubeGeometry` on a `CatmullRomCurve3`; highlight = emissive | easy |
| **Electricity flow** | scrolling UV dash shader along the wire tube; speed ∝ current, colour ∝ voltage | medium |
| Data flow | same shader, different colour (cyan) and dash pattern | medium |
| Signal flow | same shader, violet, pulsed rather than continuous | medium |
| Sensor rays | `Line` + additive glow, animated length | easy |
| LiDAR point cloud | `Points` with a growing draw range, one point per degree | easy |
| PCB inspection | camera preset + a high-res texture that swaps in at close range | easy |
| Particles | drei `Sparkles` for celebration; custom `Points` for smoke on a short circuit | easy |

**One shader does most of the work.** A single `FlowMaterial` (scrolling dashes along a
tube's UV) powers electricity, data and signal flow. Write it once with `color`, `speed`,
`density` and `intensity` uniforms; everything else is configuration.

---

## 7. Animation catalogue

Ranked by teaching value. If time is short, build the top five and the course still works.

1. **Ultrasonic echo** (M7) — expanding arc, wall bounce, return, stopwatch, formula
   assembling itself from the measured values.
2. **Electricity flowing** (M3 + everywhere) — battery → switch → controller → driver →
   motors, visibly sequenced so students see the *order*.
3. **Servo feedback loop** (M6) — commanded vs actual angle, error shrinking to zero.
4. **H-bridge switching** (M5) — four switches, current path re-routing, direction flipping.
5. **LiDAR point cloud forming** (M8) — the room materialising from nothing.
6. Water-analogy circuit (M3) — split-screen water/electricity.
7. Stepper coil sequence (M6) — field lines rotating, rotor snapping.
8. PWM duty cycle (M4) — square wave + LED brightness, slowed until the illusion breaks.
9. Camera pipeline (M8) — five stages, image transforming at each.
10. Exploded assembly (M2) — the robot blooming apart and back together.
11. Sense→Think→Act (M1, recurring) — the three boxes, reused as a visual motif all course.
12. Robot signature moves (M1) — eight short clips in the zoo.
13. Voice pipeline (M11) — waveform → text → intent → action.
14. Object detection (M11) — boxes fading in with confidence bars.
15. Short-circuit smoke (M3/M5) — the failure animation. Students *will* seek it out; make
    it fun and make it teach.

---

## 8. Simulator specification

Two engines, both needed, both reusable.

### A. Circuit Sandbox (2D, SVG + a tiny solver)
- Grid canvas, drag parts from a tray, snap to nodes, wires drawn as orthogonal paths.
- Solver: build a node graph, run a nodal analysis (a 30-line DC solver is plenty — we only
  ever have resistive loads and one source).
- Live results: current animates, LEDs light with real brightness, a multimeter probe you
  can drop on any node.
- Failure detection: short circuit, open circuit, reversed polarity, over-voltage.
- Used in: M3, M4, M5, and the Module 12 debug lab.

### B. Robot Sim (2D top-down, canvas)
- **[DEVIATION]** Top-down 2D, not 3D. The pedagogy needs the *sensor picture* — cones,
  rays, line tracks, path traces — and 2D shows all of it far more legibly than 3D. A 3D
  chase-cam view can be a later toggle over the same simulation state (§16).
- World: walls, obstacles, a drawn line track, coloured objects, a goal.
- Robot: differential drive with real kinematics (`v = (vL+vR)/2`, `ω = (vR-vL)/L`), a
  little wheel slip, collision response.
- Sensors, all simulated honestly: ultrasonic (ray cast within a 15° cone, returns the
  nearest hit, fails on angled surfaces), IR line (samples the track texture under each
  sensor), camera (returns objects in the field of view with distance and colour), LiDAR
  (360 rays).
- Drive it from **either** the block editor or Python. Same world state, one API.
- Overlays: sensor cones, path trace, collision flashes, a live sensor readout panel.

**Grading is behavioural, exactly like the gamedev course.** Never match source text. Run
the student's program headless for N ticks across several scenarios and grade declarative
rules against the recorded trace:

```json
"check": {
  "scenarios": [
    { "world": "room-6-obstacles", "start": [10, 50], "ticks": 900 },
    { "world": "room-6-obstacles-mirrored", "start": [10, 50], "ticks": 900 }
  ],
  "rules": [
    { "type": "reaches", "target": "goal" },
    { "type": "never", "event": "collision" },
    { "type": "moves", "minDistance": 200 },
    { "type": "differs", "between": [0, 1], "field": "path" }
  ]
}
```

Rule vocabulary: `reaches`, `never`, `always`, `moves`, `still`, `within`, `follows_line`,
`detects`, `stops_before`, `turns`, `visits_all`, `time_under`, `differs`.

`differs` across mirrored worlds is what proves the robot is *reacting* rather than
replaying a memorised path — the single most important check in the course.

**Test both directions for every step**: the reference solution must pass, and the
untouched starter code must fail. Automate this; it caught real bugs in the gamedev course.

---

## 9. Quiz design

Rules, applied everywhere:
- **No definition recall.** Never *"what is a servo?"* Always *"your robot arm must hold a
  cup at exactly 30°. Which motor?"*
- Every option has an `explain` string — wrong answers explain the misconception, not just
  "incorrect".
- Mix formats: MCQ, click-the-part-in-3D, order-the-steps, predict-the-output,
  wire-it-correctly, true/false with justification.
- 4–8 questions per lesson quiz, 10–12 per module checkpoint.
- Failing is cheap: retry immediately, no penalty, but a retry earns half XP.

Question banks per module hold ~2× the questions shown, sampled randomly, so a retry isn't
a memory test.

**Special formats to build:**
- `part-click` — question text over the 3D bench; answer by clicking a mesh.
- `wire-it` — mini circuit canvas; answer by completing a connection.
- `predict-sim` — show a setup, ask what happens, then *run it* and compare.
- `order` — reuse the existing arcade `order` round type verbatim.

---

## 10. Projects

| # | Project | Module | Grading |
|---|---|---|---|
| 1 | Design a robot for your school | 1 | completion |
| 2 | LED Blink | 4 | circuit correct + sequence correct |
| 3 | Traffic Light | 4 | 3 LEDs, correct order and timing |
| 4 | Square Dance | 5 | returns within tolerance, 4 turns detected |
| 5 | Robot Arm Poses | 6 | hits 4 target angles within ±3° |
| 6 | Obstacle Avoider | 7 | crosses room, zero collisions, in 2 worlds |
| 7 | Line Follower | 7 | completes lap, stays on line >95% of ticks |
| 8 | Bluetooth Robot | 9 | responds correctly to 6 remote commands |
| 9 | Gesture Robot | 11 | 4 gestures → 4 correct behaviours |
| 10 | Voice Robot | 11 | 5 spoken commands executed |
| 11 | Sorting Robot | 11 | all blocks in matching bins |
| 12 | Warehouse Robot | 12 | fetch and deliver 5 items, time-scored |
| 13 | Delivery Robot | 12 | navigate a street map with dynamic obstacles |
| 14 | Fully Autonomous | 12 | unknown maze, must map and solve |
| 15 | Capstone | 12 | student-defined, completion + certificate |

Each follows the existing project JSON shape (`problem`, `steps`, `starterCode`, `hints`,
`successMessage`) plus a `check` block in the §8 format. **Hints escalate and never contain
the answer** — the established house rule.

---

## 11. Folder structure

```
backend/courses/robotics/
├── course.json                  # modules, prerequisite, format: "lab3d"
├── module1.json … module12.json # lesson lists, hasProject, build steps
├── lessons/
│   ├── intro.json
│   ├── machine-vs-robot.json
│   └── …                        # ~45 files
├── components/                  # the 22 component lessons
│   ├── esp32.json
│   ├── ultrasonic.json
│   └── …
├── projects/
│   └── module1.json … module12.json
├── quizzes/
│   └── module1.json … module12.json    # question banks
├── worlds/                      # simulator world definitions
│   ├── room-6-obstacles.json
│   ├── line-track-basic.json
│   ├── maze-1.json
│   └── warehouse.json
└── robot-spec.json              # part list, slots, systems, explode offsets, unlock order

frontend/src/
├── pages/
│   ├── RoboticsCoursePage.jsx        # the Bench — course home
│   ├── RoboticsLessonPage.jsx        # narrative lessons
│   ├── ComponentLessonPage.jsx       # the §4 template renderer
│   ├── BuildStepPage.jsx             # drag-and-snap assembly
│   └── RoboticsSimPage.jsx           # standalone simulator/challenge
├── components/robotics/
│   ├── bench/
│   │   ├── RobotBench.jsx            # <Canvas> + scene + controls
│   │   ├── RobotModel.jsx            # GLTF loader, part registry, materials
│   │   ├── PartHighlight.jsx
│   │   ├── ExplodeSlider.jsx
│   │   ├── ViewModeBar.jsx           # solid / x-ray / wireframe / cutaway
│   │   ├── SystemFilter.jsx
│   │   ├── PartLabel.jsx             # drei Html billboard
│   │   └── PartCard.jsx
│   ├── flow/
│   │   ├── FlowMaterial.js           # THE shader — electricity/data/signal
│   │   ├── WirePath.jsx              # TubeGeometry along a curve
│   │   └── FlowController.jsx        # which wires are live, at what current
│   ├── circuit/
│   │   ├── CircuitSandbox.jsx
│   │   ├── solver.js                 # nodal analysis
│   │   ├── parts/                    # SVG symbols
│   │   └── Multimeter.jsx
│   ├── sim/
│   │   ├── RobotSim.jsx              # canvas + overlays
│   │   ├── world.js                  # world loading, collision geometry
│   │   ├── kinematics.js             # differential drive
│   │   ├── sensors.js                # ultrasonic / IR / camera / LiDAR models
│   │   └── SimControls.jsx
│   ├── blocks/
│   │   ├── BlockEditor.jsx           # drag-drop stack
│   │   ├── blockDefs.js              # the 14 blocks
│   │   ├── toPython.js               # blocks → Python (the M10 bridge)
│   │   └── FlowchartView.jsx         # same stack, rendered as a flowchart
│   ├── sims/                         # per-component simulators
│   │   ├── DCMotorSim.jsx
│   │   ├── ServoSim.jsx
│   │   ├── StepperSim.jsx
│   │   ├── UltrasonicSim.jsx
│   │   ├── IRSim.jsx
│   │   ├── LidarSim.jsx
│   │   ├── PWMSim.jsx
│   │   └── CameraSim.jsx
│   ├── lesson/
│   │   ├── ComponentSection.jsx      # renders one §4 section by type
│   │   ├── SpecTable.jsx
│   │   ├── ProsCons.jsx
│   │   └── SafetyCallout.jsx
│   └── quiz/
│       ├── PartClickQuestion.jsx
│       ├── WireItQuestion.jsx
│       └── PredictSimQuestion.jsx
├── robotics/
│   ├── robot.py                      # the student-facing Python API (Pyodide FS)
│   ├── partRegistry.js               # partId → mesh name, system, module, lesson
│   └── buildOrder.js                 # which parts exist at which progress point
├── services/
│   ├── robotRuntime.js               # headless run + trace + rule grading
│   └── simEngine.js                  # the tick loop, shared by blocks and Python
├── hooks/
│   ├── useRobotProgress.js
│   ├── useSimRunner.js
│   └── usePartSelection.js
└── workers/
    └── robot.worker.js               # Pyodide + robot.py + tick bridge

frontend/public/models/robotics/
├── aria.glb                          # the main robot, all parts named
├── zoo/                              # 8 robots for Module 1
│   ├── industrial-arm.glb … quadcopter.glb
└── parts/                            # standalone part models w/ cutaways
    ├── dc-motor-cutaway.glb
    ├── servo-cutaway.glb
    └── …
```

**Routes to add in `AppRoutes.jsx`:**
```jsx
<Route path="/course/robotics"                          element={<RoboticsCoursePage />} />
<Route path="/course/robotics/lesson/:lessonId"         element={<RoboticsLessonPage />} />
<Route path="/course/robotics/part/:partId"             element={<ComponentLessonPage />} />
<Route path="/course/robotics/build/:moduleId"          element={<BuildStepPage />} />
<Route path="/course/robotics/sim/:worldId"             element={<RoboticsSimPage />} />
```

**Backend:** `course_service.py` already loads any directory under `courses/` that has a
`course.json`, so the course appears with zero backend changes. Two small additions needed:
`GET /courses/{id}/components/{partId}` and `GET /courses/{id}/worlds/{worldId}`, both
copies of the existing `get_module` file-read pattern in `app/api/courses.py`.

---

## 12. Asset requirements

**3D models** — see §13.

**Textures**
- PCB texture for the ESP32 (2K, with a normal map for the solder mask and silkscreen)
- Brushed aluminium, matte plastic, rubber tyre, copper — one 1K PBR set each
- An HDRI for lighting: a neutral studio HDRI, 2K, `.hdr` (≈4 MB)

**Icons** — `lucide-react` is already a dependency; supplement with ~20 custom SVG glyphs
for components (resistor, LED, motor, sensor) drawn in the Workbench line style.

**Audio** (short, `.ogg`, <30 KB each)
- power-on chime, relay click, servo whine, DC motor hum, ultrasonic ping, error buzz,
  success chime, LiDAR sweep whir

**Images**
- 3 real-world photos per component (66 total). Source from Unsplash/Wikimedia with
  compatible licences; keep a `CREDITS.md` in the images folder.
- 8 robot family hero shots for Module 1.

**Budget** — the whole 3D payload must stay under **8 MB** with Draco compression. The main
robot alone should be ≤2.5 MB. Zoo robots load lazily, one at a time, and are ≤300 KB each.

---

## 13. Blender models required

**Modelling rules, non-negotiable:**
- Every part is a separate named object; the name **is** its `partId` (`part_esp32`,
  `part_motor_left`). The code looks parts up by name.
- Custom properties per object: `system` (power/brain/movement/senses/comms/structure),
  `explodeOffset` (a vec3), `module` (which module teaches it).
- Origin at the mounting point, not the centre — makes snapping and rotation sane.
- Real-world scale, metres. Robot ≈ 0.2 m long.
- Triangle budget: whole robot ≤60 k, no single part over 8 k.
- Bake AO into a single atlas per material group.
- Export glTF 2.0 (`.glb`), +Y up, Draco compression on, animations included.

**Model list**

*Main robot — ARIA (one file, `aria.glb`)*
1. Chassis plate (with mounting holes, and a variant with an openable battery compartment)
2. Battery holder + 18650 cell (cell removable, with a cutaway variant)
3. Power switch (with an animated toggle clip)
4. Breadboard (with hidden internal strips as a separate x-ray-only mesh)
5. ESP32 dev board (PCB detail, header pins, USB port, antenna trace)
6. Motor driver board (L298N, heatsink)
7. DC motor ×2 (external + a cutaway variant showing rotor, commutator, brushes, magnets)
8. Wheel ×2 (rubber tread, hub)
9. Caster ball
10. Servo motor (external + cutaway: motor, 3-stage gear train, potentiometer, board)
11. Stepper motor (external + cutaway: 4 coils, toothed rotor)
12. Ultrasonic sensor HC-SR04 (the two "eyes")
13. IR sensor module ×2
14. Camera module (lens, ribbon cable)
15. LiDAR turret (spinning top half as a separate object for animation)
16. Temperature sensor
17. RGB LED (with a translucent lens material)
18. Speaker
19. Microphone
20. OLED display
21. Push button ×2
22. Wire set (as `CatmullRomCurve3` control points exported as empties — **do not model
    wires as geometry**; generate the tubes procedurally so they can animate and reroute)

*Module 1 zoo (8 separate files, low-poly, ≤5 k tris each, one animation clip each)*
industrial arm · surgical robot · humanoid · Mars rover · bomb-disposal · vacuum ·
delivery bot · quadcopter

*Environment*
- Lab bench (a simple plane with a grid texture is enough — don't over-build the room)
- Parts crate for the Module 12 assembly exam

**Animation clips to author in Blender** (everything else is done in code):
`battery_compartment_open`, `lidar_spin`, `servo_sweep`, `zoo_*_signature` ×8.

**If no Blender artist is available:** phase 1 can ship with primitive-built parts
(boxes, cylinders, a bit of bevel) assembled in R3F code. It genuinely works for teaching
— clarity beats realism — and it de-risks the whole schedule. Swap in real models later
behind the same `partRegistry`; nothing else changes.

---

## 14. Three.js implementation notes

**Stack is already installed:** `three@0.184`, `@react-three/fiber@9`, `@react-three/drei@10`.
Only additions needed are `@react-three/postprocessing` (outline glow, bloom) and
`three-stdlib` if the drei re-exports fall short.

**Scene setup**
```jsx
<Canvas
  shadows
  dpr={[1, 2]}                          // cap at 2 — phones die at 3
  gl={{ antialias: true, localClippingEnabled: true }}
  camera={{ position: [0.35, 0.25, 0.35], fov: 45, near: 0.01, far: 100 }}
>
  <Environment files="/hdri/studio-2k.hdr" />
  <directionalLight castShadow position={[3, 5, 2]} intensity={1.2}
                    shadow-mapSize={[1024, 1024]} />
  <Suspense fallback={<BenchSkeleton />}>
    <RobotModel />
  </Suspense>
  <ContactShadows opacity={0.4} blur={2} far={0.5} />
  <OrbitControls makeDefault enableDamping minPolarAngle={0.2} maxPolarAngle={1.5}
                 minDistance={0.15} maxDistance={1.2} />
</Canvas>
```

**Part registry over scene traversal.** On model load, walk the scene graph once, build
`Map<partId, {mesh, system, module, homeMatrix, explodeOffset}>`, and never traverse again.
Every interaction is a map lookup.

**Selection** — one `useState` for `selectedPartId` in a context, not per-mesh state.
Materials are shared and mutated via `useFrame`, not recreated. Recreating materials on
hover is the #1 cause of jank here.

**Exploded view** — drive from a single `explodeAmount` float:
```js
useFrame(() => {
  parts.forEach(p => p.mesh.position.lerpVectors(p.homePos, p.explodedPos, explode.current))
})
```
Keep `explode` in a ref, not state — a slider bound to React state re-renders 40 meshes per
frame. This is the second-most common perf mistake.

**Wires** — generate `TubeGeometry` from `CatmullRomCurve3` control points loaded from the
GLB's empties. Apply `FlowMaterial`:
```glsl
// fragment, abridged
float d = fract(vUv.x * uDensity - uTime * uSpeed);
float dash = smoothstep(0.5, 0.45, abs(d - 0.5));
gl_FragColor = vec4(uColor * (0.25 + dash * uIntensity), 1.0);
```
`uSpeed` ∝ current, `uColor` per flow type, `uIntensity` up on hover. One material,
three configurations, all of §6's flow effects.

**Cutaway** — `renderer.localClippingEnabled = true`, then per-material
`clippingPlanes: [plane]` where the plane's constant is slider-driven. A capped
cross-section needs a stencil pass; defer it to phase 3 unless it proves essential.

**Performance targets** — 60 fps on a 2021 mid-range laptop, ≥30 fps on a 3-year-old
Android phone. Enforce with: `dpr` cap, frustum culling on, `frameloop="demand"` on static
screens (component-lesson turntables render on demand, not continuously), instanced meshes
for the LiDAR point cloud, and a **hard rule that only one `<Canvas>` is mounted at a time**.

**Mobile fallback** — detect low-end devices (`navigator.hardwareConcurrency <= 4` or a
failed WebGL2 context) and serve a pre-rendered turntable image sequence with the same
hotspot overlay. Every lesson must be completable without WebGL. This is a real
requirement, not a nicety — a chunk of the Grade 6 audience is on shared low-end Android.

**Pyodide loop problem.** In gamedev, Python never runs the loop — JS does. Robotics needs
the same trick, but students *will* write `while True:`. Solution: `robot.py` methods are
generators under the hood; `robot.forward()` yields control back to the worker, which
advances the simulation one tick and resumes. To the student it reads as ordinary blocking
Python. Implement with a Python-side scheduler that raises a sentinel the worker catches,
or — simpler and recommended — run the student's `loop()` function once per tick from JS
and forbid `while True:` in the lesson text, with a friendly linter message if they write
it anyway.

---

## 15. Recommended libraries

**Add**
| Library | Why | Size |
|---|---|---|
| `@react-three/postprocessing` | outline glow on selection, subtle bloom | ~40 KB |
| `maath` | easing/damping helpers for camera moves | ~8 KB |
| `zustand` | 3D state shared across Canvas/DOM without prop-drilling or re-render storms | ~3 KB |

**Already have and should reuse:** `three`, `@react-three/fiber`, `@react-three/drei`
(`OrbitControls`, `Environment`, `Html`, `ContactShadows`, `Sparkles`, `useGLTF`, `Bounds`),
`@monaco-editor/react`, Pyodide, `tailwindcss@4`, `lucide-react`, `react-router-dom@7`.

**Deliberately NOT adding**
- A physics engine (Rapier/Cannon) — the 2D sim's kinematics are 40 lines and exact.
  Physics would add 500 KB and non-determinism, which breaks reproducible grading.
- Blockly — its look fights the Workbench system and it's 900 KB. A 14-block custom editor
  is ~300 lines and will feel better.
- TensorFlow.js — see the Module 11 deviation. Revisit in phase 4 only.
- Any animation library — CSS + `useFrame` covers everything here. (`animejs` is available
  as a skill if a complex DOM timeline appears, but don't reach for it by default.)

**Tooling**
- `gltf-transform` CLI for Draco compression and model inspection in the build pipeline.
- `gltfjsx` to scaffold the initial `RobotModel.jsx` from the GLB.

---

## 16. Roadmap

**Phase 1 — Foundation (weeks 1–3)**
`course.json` + Modules 1–3. `RobotBench` with orbit/hover/select/explode using
**primitive-built geometry**, no Blender dependency. Circuit Sandbox. Build Step 1.
*Milestone: a student can explore a robot and light an LED.*

**Phase 2 — The robot moves (weeks 4–7)**
Modules 4–5. `FlowMaterial` and electricity visualisation. Motor sims. Robot Sim engine +
`robotRuntime.js` grading. Build Steps 2–3.
*Milestone: a student can make the robot drive a square.*

**Phase 3 — Senses (weeks 8–11)**
Modules 6–8. Servo/stepper/ultrasonic/IR/LiDAR sims. All 22 component lessons.
Real Blender models swapped in behind `partRegistry`. Cutaway views.
*Milestone: obstacle avoidance and line following both work.*

**Phase 4 — Programming & AI (weeks 12–15)**
Modules 9–11. Block editor + `toPython` bridge. `robot.py` on Pyodide. AI lessons.
*Milestone: a student writes Python that drives the robot autonomously.*

**Phase 5 — Mastery (weeks 16–18)**
Module 12. Assembly exam, debug lab, arena with leaderboard, certificate.
*Milestone: course complete end to end.*

**Future expansion (post-launch, roughly in priority order)**
1. **Real hardware bridge** — Web Serial API to flash MicroPython to a physically connected
   ESP32. The single biggest possible upgrade: the simulator becomes a real robot.
2. **3D chase-cam** for the sim — a toggle over the same simulation state.
3. **Robot customiser** — colours, decals, chassis shapes. Unlockable with XP. Drives
   retention hard at this age.
4. **Multiplayer arena** — two students' robots in one world, races and sumo.
5. **Real AI inference** — TensorFlow.js + COCO-SSD in the camera lessons, using the
   device webcam.
6. **Drone module** — 3D flight, four rotors, PID hovering.
7. **Robot arm module** — inverse kinematics, pick and place.
8. **Teacher dashboard** — class progress, assignable projects.
9. **Printable worksheets** — for schools without enough devices.
10. **Regional languages** — content JSON is already separable from code; only the strings
    move.

---

## 17. Gamification hooks

Reuses `utils/progress.js` unchanged (`addXP`, `awardXPOnce`, `getLevelInfo`, badges,
100 XP per level).

**XP** — lesson 20 · component lesson 30 · quiz pass 25 (12 on retry) · build step 60 ·
project 100 · module complete 150 · debug-lab fix 80 · capstone 500.

**Badges** — `first-light` (first LED lit) · `spark` (finish M3) · `brain-surgeon` (M4) ·
`motorhead` (M5) · `sixth-sense` (M7) · `all-seeing` (M8) · `block-master` (M9) ·
`pythonista` (M10) · `mind-of-its-own` (M11) · `master-builder` (assembly exam, no hints) ·
`detective` (all four debug fixes) · `certified-roboticist` (capstone).

**Unlockable robots** — the zoo robots from Module 1 become skins for the student's own
robot, unlocked per module. Cheap to build (a material swap), disproportionately motivating.

**Streaks** — reuse the platform's existing streak logic; no course-specific work.

**Certificate** — generated on capstone completion, name + date + capstone title, shareable.

---

## 18. Content style rules

Non-negotiable, applies to every string written into the JSON:

1. **No paragraph over 3 lines.** If it needs more, it needs an animation.
2. **Analogy before mechanism.** Water before voltage. A switch before a transistor.
3. **Show, then name.** The student sees the echo return and *then* learns the word
   "ultrasonic" — never the reverse.
4. **Second person, present tense.** "You press the button. The LED lights."
5. **No jargon without an inline definition** on first use, styled as a dotted-underline
   tooltip.
6. **Every mistake is a lesson.** Wrong answers, short circuits and crashed robots get an
   explanation and a route forward, never a scold.
7. **Numbers are real.** A real ESP32 costs ₹450 and sources 40 mA. Don't round to
   fictional tidiness; students who go on to build for real must not be surprised.
8. **One idea per screen.** If a lesson has two ideas, it's two lessons.
9. **Interaction within 30 seconds** of any screen opening. No screen is read-only.

---

## Open questions for Janakiram

1. **Visual identity** — go Workbench (recommended, §5) or build the separate blue/white
   Apple system the brief asks for?
2. **Blender** — is there an artist, or does phase 1 build with primitives? (Recommend
   primitives regardless — it de-risks 3 weeks.)
3. **Prerequisite** — gate Modules 9+ behind Python M1–4, or let students through with a
   warning?
4. **Real hardware** — is the Web Serial bridge a "someday" or a "this year"? It changes
   how honest Module 10's framing should be.

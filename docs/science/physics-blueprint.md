# Physics (Class 8): Production Blueprint

**Course ID:** `physics` · **Lesson prefix:** `phy-` · **Accent:** indigo
**Audience:** Class 8, NCERT-aligned · **Status:** design only
**Written:** 2026-09-17 · **Owner:** Janakiram
**Read first:** `docs/science/README.md` (lesson loop, engines E1 to E10, visual language)

---

## 0. Executive summary

Physics at this level is about **invisible causes with visible effects**: a push you can't
see bending a spring, air you can't see crushing a can, vibrations too fast to see making a
sound. The course draws the cause on top of the effect, every time.

Four engines do almost all the work:

| Engine | Carries |
|---|---|
| `force-arena` (E2) | Force, pressure, friction (Modules 1, 2) |
| `particle-box` (E1) | Pressure in fluids, atmosphere, sound in a medium (Modules 1, 3) |
| `wave-scope` (E4) | Vibration, pitch, loudness, noise (Module 3) |
| `ray-bench` (E3) | Reflection, mirrors, the eye (Module 4) |
| `orrery` (E5) | Moon, planets, stars, satellites (Module 6) |

| # | Module | Lessons | Signature visualization | Hours |
|---|---|---|---|---|
| 1 | Force and Pressure | 6 | Brick on sand: same force, different dent | 3 |
| 2 | Friction | 5 | Zoomed surfaces interlocking under a sliding block | 2.5 |
| 3 | Sound | 6 | Air particles bunching into compressions | 3 |
| 4 | Light | 6 | Draggable torch and mirror, angles live | 3 |
| 5 | Some Natural Phenomena | 5 | Charges building in a cloud until the spark jumps | 2.5 |
| 6 | Stars and the Solar System | 6 | Moon phases from space and from Earth, side by side | 3 |

~34 lessons, ~17 hours.

---

## Module 1: Force and Pressure

**Objectives:** Describe a force as a push or pull that acts between two objects; list the
effects of a force (start, stop, speed up, change direction, change shape); tell contact
from non-contact forces; calculate pressure as force ÷ area; explain why pressure in a
liquid grows with depth; explain atmospheric pressure.

**Misconceptions to target**
- "A moving object needs a force to keep moving." (Friction is the hidden force that stops it.)
- "Force is something an object has." (Force is an interaction, it needs two objects.)
- "Bigger force always means bigger pressure." (Area matters just as much.)
- "Liquids only push down." (They push in every direction, including sideways and up.)
- "Air has no weight / we would feel air pressure." (It is balanced from inside.)

### Lessons

**1. `phy-force-push-pull`: What is a force?** · `force-arena`
- Hook: A tug of war, frozen mid-pull.
- Predict: Two teams pull with 300 N and 300 N. Which way does the rope move?
- Watch: Arrows on each team, length ∝ force. Equal arrows: rope stays. Add a player: one
  arrow grows, the net-force arrow appears in the middle and the rope slides.
- Play: Drag each team's force slider. A "net force" arrow updates live. Same-direction mode
  shows two people pushing a cart together (forces add).
- Takeaway: Force has size and direction. Forces in the same direction add; opposite
  directions subtract.

**2. `phy-force-effects`: What a force can do** · `force-arena` (mode `effects`)
- Watch: Five mini-scenes in a carousel, each with the force arrow drawn at the moment of
  contact: kick a still football (starts moving), catch a ball (stops), hit a moving ball
  with a bat (changes direction), push a moving cart (speeds up), squeeze a clay ball
  (changes shape).
- Play: Tap-to-apply a force to a ball at any moment; the path trace shows what changed.
- Takeaway: A force can change speed, direction, or shape.

**3. `phy-force-types`: Contact and non-contact forces** · `classify` + `force-arena`
- Watch: Magnet slowly slides toward an iron pin with no touching; a force arrow appears
  across the gap. A comb rubbed in hair lifts paper bits. A ball dropped falls.
- Play: `classify` 10 scene cards into Contact (muscular, friction) and Non-contact
  (magnetic, electrostatic, gravitational).
- Takeaway: Some forces need touching, some act across a gap.

**4. `phy-pressure`: Pressure = force ÷ area** · `force-arena` (mode `pressure`)
- Hook: Why does a sharp knife cut better than a blunt one?
- Predict: A brick is placed on sand flat, then on its end. Which dent is deeper?
- Watch: Same brick (same weight arrow), three orientations. The sand surface deforms by a
  depth proportional to F/A. The contact area is shaded and its value shown.
- Play: Sliders for force (N) and contact area (cm²). A live readout computes pressure and
  the dent depth follows. Presets: knife edge, school bag strap (wide vs thin), camel foot,
  drawing pin tip vs head.
- Takeaway: Pressure = Force ÷ Area. Unit: pascal (Pa) = N/m².

**5. `phy-pressure-fluids`: Pressure in liquids and gases** · `particle-box` + `explorer-diagram`
- Predict: A bottle has three holes at different heights. Which jet reaches furthest?
- Watch: Water jets from the holes, the lowest travelling furthest. Toggle "show particles":
  the water becomes dots; deeper dots are squeezed by more dots above them. Second scene: a
  balloon full of gas particles, each hitting the wall and leaving a tiny outward arrow.
- Play: Drag the hole height and the water level. Dam cross-section: toggle a thin wall
  (bulges at the base) vs the real tapered wall.
- Takeaway: Liquid pressure increases with depth and acts in all directions. Gas particles
  hitting the walls cause gas pressure.

**6. `phy-atmospheric-pressure`: The weight of air above you** · `particle-box`
- Hook: A rubber sucker sticks to glass. What holds it?
- Watch: A column of air particles stretching above a person's head, getting sparser with
  height. Then a sucker: press it (particles squeezed out from under it), release (outside
  particles hammer the cup, inside there are few). A tin can with air pumped out crumples.
- Play: Altitude slider from sea level to Everest; particle density and a pressure gauge
  change together. "Pull the sucker" button shows how hard the pull needs to be.
- Takeaway: Air pressure at sea level is about 1 lakh Pa. On a 15 cm × 15 cm area that is
  the weight of about 225 kg. We aren't crushed because the pressure inside our bodies
  balances it.

**Module project:** *Design a better school bag.* A `force-arena` config with strap width,
load and padding; the student must keep shoulder pressure under a target. Graded by the
widget's computed pressure.

**Arcade:** 4 `concept` + 1 `match` (scene ↔ force type) + 1 "which dent is deepest?" picture round.

---

## Module 2: Friction

**Objectives:** Explain friction as the force from interlocking surface irregularities;
compare static, sliding and rolling friction; list advantages and disadvantages; describe
ways to increase and reduce friction; explain fluid friction (drag).

**Misconceptions to target**
- "Smooth surfaces have no friction." (Even polished surfaces have microscopic bumps.)
- "Friction always slows things down." (It is also what lets you walk and a car accelerate.)
- "Friction depends on how big the contact area is." (For Class 8, it depends on the
  surfaces and how hard they are pressed together.)
- "Heavier objects are harder to move only because they are heavier." (They press the
  surfaces together harder, so friction is larger.)

### Lessons

**1. `phy-friction-cause`: Why surfaces grip** · `zoom-lens` + `force-arena`
- Predict: A book slides across a table and stops. What stopped it?
- Watch: The sliding book, then a zoom through the contact layer at 1x, 100x and 1000x.
  At 1000x both surfaces are jagged ranges of bumps catching on each other.
- Play: Surface picker (glass, wood, carpet, sand paper). The zoomed view changes roughness,
  and the book's slide distance changes with it.
- Takeaway: Friction comes from irregularities on both surfaces locking together.

**2. `phy-friction-types`: Static, sliding, rolling** · `force-arena` (mode `friction-types`)
- Predict: Which needs the least force to keep moving: a box pushed, the same box on
  rollers, or the box just starting to move?
- Watch: A spring balance pulls a box. The reading climbs, peaks right before it moves
  (static), drops slightly once sliding (sliding), and drops a lot when rollers are added
  (rolling). A live graph plots pull force against time.
- Play: Pull the spring balance yourself (drag). Toggle rollers, ball bearings.
- Takeaway: Static > sliding > rolling. That is why wheels and ball bearings exist.

**3. `phy-friction-good-bad`: Friend and foe** · `sort-bins`
- Watch: "Turn friction off" switch on a street scene: a person's feet slip, a car's wheels
  spin in place, a nail falls out of a wall, a pencil can't write. Switch back on.
  Second scene: friction wearing down shoe soles and tyre tread over a scrubbed "year".
- Play: Sort 12 cards into Advantage and Disadvantage.
- Takeaway: Friction lets us walk, hold, write and brake, but wears things out and wastes
  energy as heat.

**4. `phy-friction-control`: Increasing and reducing friction** · `force-arena`
- Watch: A shoe sole zoom (treads grip), tyre treads in rain, a gymnast chalking hands,
  kabaddi players on mud. Then oil between two surfaces: in the zoom view, a liquid layer
  fills the gaps and lifts the bumps apart.
- Play: Apply grease, powder, treads, ball bearings to a sliding block and watch the
  required pull force change.
- Takeaway: Increase with treads, rough surfaces, grip. Reduce with lubricants, polishing,
  wheels, ball bearings.

**5. `phy-fluid-friction`: Drag in air and water** · `particle-box` (mode `flow`)
- Predict: Which shape moves through water most easily: a flat plate, a cube, or a fish shape?
- Watch: Particles of a fluid stream past each shape. Behind the plate they swirl and pile
  up; around the fish shape they flow smoothly. A drag force arrow sized to the result.
- Play: Draw your own shape (5 draggable control points), test its drag score.
- Takeaway: Fluids exert friction called drag. Streamlined shapes (birds, fish, planes,
  boats) reduce it.

**Module project:** *Slide-off challenge.* Choose surfaces and add-ons to make a crate stop
within a marked zone on a ramp.

**Arcade:** 4 `concept` + 1 `match` (situation ↔ increase/reduce friction method).

---

## Module 3: Sound

**Objectives:** Explain that sound is produced by vibration; describe how sound needs a
medium and travels as compressions and rarefactions; relate amplitude to loudness and
frequency to pitch; describe the human voice box and ear; explain noise pollution and how
to reduce it.

**Misconceptions to target**
- "Air particles travel from the speaker to your ear." (They vibrate back and forth in place;
  the pattern travels.)
- "Sound travels in space." (No medium, no sound.)
- "Loud sounds are high-pitched." (Loudness is amplitude, pitch is frequency. Separate knobs.)
- "Sound is fastest in air." (It is faster in liquids and fastest in solids.)

### Lessons

**1. `phy-sound-vibration`: Every sound is a vibration** · `wave-scope` (mode `source`)
- Hook: Put your hand on your throat and hum.
- Watch: A plucked ruler on a table edge, a tabla membrane, a guitar string, a tuning fork.
  Each vibration shown at 0.02x slow motion, with a sand/water splash effect for the fork.
- Play: Pluck the ruler. Change its overhang length: longer overhang, slower vibration,
  lower sound (real audible tone via Web Audio).
- Takeaway: Sound is produced by vibrating objects.

**2. `phy-sound-medium`: Sound needs something to travel through** · `particle-box` (mode `longitudinal`)
- Predict: A ringing bell is inside a jar. You pump the air out. What do you hear?
- Watch: The bell jar with particles visible. As particles are removed, the sound meter
  drops and the ring fades to silence while the bell still visibly vibrates.
- Watch 2: A speaker cone pushes air. Particles bunch (compression) and spread
  (rarefaction). One particle is highlighted red: it only wobbles back and forth. The
  bands travel; the red particle does not.
- Play: Toggle medium (air, water, steel). Particle spacing changes and a stopwatch race
  shows speed: air ~343 m/s, water ~1480 m/s, steel ~5960 m/s.
- Takeaway: Sound travels as compressions and rarefactions through a medium. It can't
  travel through a vacuum.

**3. `phy-sound-properties`: Amplitude, frequency, loudness, pitch** · `wave-scope`
- Predict: Two sliders are hidden labels. One changes loudness, one changes pitch. Guess
  which is which by listening.
- Watch: The wave trace. Amplitude slider stretches it vertically; frequency slider packs
  more cycles into the window. A counter shows vibrations per second (Hz) and time period.
- Play: Both sliders live, with sound. Presets: mosquito (high pitch, soft), lion roar (low
  pitch, loud), whistle, drum. "Human hearing" band shades 20 Hz to 20 000 Hz; a dog icon
  and a bat icon show their wider ranges.
- Takeaway: Loudness depends on amplitude (measured in decibels). Pitch depends on
  frequency (hertz). Humans hear 20 Hz to 20 kHz.

**4. `phy-human-voice`: The voice box** · `explorer-diagram` + `wave-scope`
- Watch: Schematic of the larynx with two vocal cords. Air from the lungs passes the gap,
  the cords vibrate (slow motion). Tighten the cords: higher frequency. Longer cords (adult
  male voice box) vs shorter: lower vs higher pitch.
- Play: A "stretched rubber band" twin: stretch it tighter, hear the pitch rise.
- Takeaway: Voice is produced by vibrating vocal cords in the larynx.

**5. `phy-human-ear`: How you hear** · `explorer-diagram` (animated path)
- Watch: A compression wave enters the ear canal, hits the eardrum (it pulses), the three
  tiny bones pass the vibration inward, the inner ear turns it into signals, a pulse runs
  along a nerve to the brain. Each stage lights in sequence.
- Play: Tap any part for its card. Self-test mode hides labels.
- Takeaway: The eardrum vibrates, the vibrations pass inward, the brain interprets them.
  Never put sharp objects in your ear.

**6. `phy-noise-pollution`: Noise and how to cut it** · `wave-scope` + `classify`
- Watch: Musical sound (regular, repeating trace) vs noise (jagged, irregular trace). A city
  street map with a dB meter on each source: whisper ~30 dB, conversation ~60 dB, heavy
  traffic ~80 dB, loudspeaker/firecrackers well above.
- Play: "Quiet the street" planner: add trees along the road, silencers, move the school
  away from the highway, ban horns near hospitals. The dB readout at a house drops.
- Takeaway: Unwanted, unpleasant sound is noise. Above about 80 dB it becomes painful and can
  harm hearing. Trees, silencers and planning reduce it.

**Module project:** *Build a jal tarang.* Eight glasses; the student sets water levels to
match a target scale. Graded by computed frequency tolerance, played through Web Audio.

**Arcade:** 3 `concept` + 1 "which trace is louder / higher?" picture round + 1 `match`
(animal ↔ hearing range).

---

## Module 4: Light

**Objectives:** State the laws of reflection; draw incident ray, normal and reflected ray;
distinguish regular and diffused reflection; explain multiple reflections (periscope,
kaleidoscope); describe the parts of the eye and how to care for it; recognise that white
light is made of colours.

**Misconceptions to target**
- "We see because light comes out of our eyes." (Light enters the eye from objects.)
- "Rough surfaces don't obey the laws of reflection." (Every tiny patch obeys them; the
  normals just point in different directions.)
- "A mirror image is on the mirror surface." (It appears as far behind as the object is in front.)
- "Angles are measured from the mirror." (They are measured from the normal.)

### Lessons

**1. `phy-light-reflection`: Light bounces** · `ray-bench`
- Hook: Why can you see this page? It makes no light of its own.
- Watch: A torch beam hits a mirror and bounces. Then a book: light from a bulb hits the
  book, scatters, some reaches an eye. Rays animate with travelling arrowheads.
- Takeaway: We see objects when light from them enters our eyes.

**2. `phy-reflection-laws`: The laws of reflection** · `ray-bench` (mode `protractor`)
- Predict: The torch hits the mirror at 30° to the normal. Where does the ray go?
  (Student drags a guess line before release.)
- Watch: The real ray, the normal drawn as a dashed line, both angles labelled; their
  guess shown faintly for comparison.
- Play: Drag the torch around the protractor. ∠i and ∠r update together. Hit a target star
  by aiming off one mirror, then two.
- Takeaway: Angle of incidence = angle of reflection. Incident ray, normal and reflected ray
  lie in the same plane.

**3. `phy-regular-diffused`: Regular vs diffused reflection** · `ray-bench` (mode `surface`)
- Watch: Parallel rays hit a smooth mirror (stay parallel) and a rough surface (scatter).
  Zoom into the rough surface: each tiny facet has its own normal, and each ray obeys the
  law at its facet.
- Play: A roughness slider morphs the surface from mirror to paper. The reflected image of a
  candle fades as roughness rises.
- Takeaway: Both follow the laws. Diffused reflection is why we can see objects from any angle.

**4. `phy-multiple-reflections`: Mirrors facing mirrors** · `ray-bench` (mode `two-mirrors`)
- Predict: Two mirrors at 90°. How many images of a coin?
- Watch: Images appear one by one with ghost rays showing where each comes from.
- Play: Angle slider between two mirrors (120°, 90°, 60°, 45°, 30°), image count updates
  (360°/angle − 1 when that is a whole even number). Then build a periscope: drag two mirrors
  into a tube to see over a wall. Then a kaleidoscope view, rotating bangles pieces.
- Takeaway: Light can reflect many times. Periscopes and kaleidoscopes use this.

**5. `phy-dispersion`: White light is many colours** · `ray-bench` (mode `prism`)
- Watch: A white beam through a prism fans into a spectrum. Reverse: spectrum through a
  second prism recombines. A rainbow scene with raindrops as tiny prisms.
- Play: Rotate the prism; the spectrum spreads and moves. Spin a Newton's disc on screen:
  colours blur toward white.
- Takeaway: White light splits into seven colours. This splitting is dispersion.

**6. `phy-human-eye`: The eye and how to care for it** · `explorer-diagram` + `ray-bench` (mode `eye`)
- Watch: Rays from a tree enter the cornea, pass the pupil, the lens focuses them onto the
  retina (image upside down), the optic nerve carries it to the brain (shown upright).
  Bright light: iris shrinks the pupil. Dim light: pupil widens.
- Play: Brightness slider controls pupil size. Find your blind spot (on-screen cross and dot
  test). Persistence of vision: a spinning card with a bird on one side and a cage on the
  other; speed it up until the bird appears caged.
- Care card: read at about 25 cm, light from behind or beside, no rubbing, vitamin A foods
  (carrots, spinach, milk, eggs), never look at the Sun directly. Braille intro card for
  visually impaired readers.
- Takeaway: The lens focuses light on the retina; rods sense dim light, cones sense colour.

**Module project:** *Laser maze.* Place 3 mirrors on a grid to guide a beam around walls to
a target. Graded by `ray-bench`'s traced hit.

**Arcade:** 3 `concept` + 1 "draw-the-ray" MCQ with 4 ray pictures + 1 `match` (eye part ↔ job).

---

## Module 5: Some Natural Phenomena

**Objectives:** Explain charging by rubbing; state that like charges repel and unlike
charges attract; describe the electroscope and earthing; explain lightning as a discharge
between charged clouds and the ground; list lightning safety steps; describe the cause of
earthquakes, how they are measured, and how to protect yourself.

**Misconceptions to target**
- "Rubbing creates charge." (It transfers charge from one object to the other.)
- "Lightning never strikes the same place twice." (Tall points get struck repeatedly.)
- "Hiding under a tall tree is safe in a storm." (It is one of the worst places.)
- "Earthquakes can be predicted." (Not yet. We can map zones and prepare.)

### Lessons

**1. `phy-charges-rubbing`: Charging by rubbing** · `particle-box` (mode `charge`)
- Watch: A plastic refill and a piece of polythene, both covered in balanced `+`/`−`
  pairs. Rub: some `−` charges transfer from one to the other. Now one has extra `−`, the
  other extra `+`.
- Play: Rub a balloon on hair (swipe back and forth; charge count rises with swipes), then
  bring it near paper bits, which jump up.
- Takeaway: Rubbing transfers charge. Objects become charged.

**2. `phy-like-unlike`: Repel and attract** · `force-arena` (mode `charges`)
- Predict: Two balloons both rubbed with wool. Hung side by side, do they touch or push apart?
- Watch: Force arrows between them, pointing apart. Then one balloon and the wool itself:
  arrows pointing together.
- Play: Drag charged objects around; hanging threads tilt with the real direction of force.
- Takeaway: Like charges repel. Unlike charges attract.

**3. `phy-electroscope-earthing`: Detecting and draining charge** · `explorer-diagram` (animated)
- Watch: A jar electroscope. Touch with a charged refill: charges flow down the paper clip,
  both foil strips get the same charge and spread apart. Touch the clip with a hand: charges
  drain through the body to the Earth, strips fall. A building's earthing wire doing the
  same thing on a larger scale.
- Takeaway: An electroscope detects charge. Earthing sends extra charge safely into the ground.

**4. `phy-lightning`: Lightning and staying safe** · `particle-box` (mode `storm`) + `classify`
- Predict: Where do the charges in a thundercloud collect?
- Watch: Air currents and water droplets swirl in a cloud. `−` charges gather at the bottom,
  `+` at the top. The ground below builds up `+` charge. The charge meter climbs, then a
  jagged discharge jumps: flash first, thunder later (a sound wave travelling slower; the
  "count the seconds" timer ties back to Module 3).
- Play: A lightning conductor toggle on a building: with it, the strike takes the metal path
  to the ground. `classify`: 10 places during a storm into Safe or Unsafe (open field,
  under a tree, inside a car with windows closed, in a house, holding an umbrella outdoors,
  in water, crouching low on the ground away from trees...).
- Safety card: go indoors or into a closed car/bus; if caught outside, crouch low with hands
  on knees and head down, away from trees and poles; avoid water, corded phones and open
  taps during a storm.
- Takeaway: Lightning is a huge electric discharge. Tall points attract it.

**5. `phy-earthquakes`: When the ground shakes** · `process-timeline` + `explorer-diagram`
- Watch: A cutaway of the Earth: crust broken into plates. Two plates grind, stress builds
  (a strain meter fills), then they slip: waves ripple outward from the focus. A seismograph
  pen draws the trace. Map of India's high-risk seismic zones highlighted (Kashmir, the
  Himalayan belt, the North-East, Rann of Kutch).
- Play: A Richter-scale slider shows the seismograph amplitude and a building's shaking.
  Each step up is 10x the ground motion. Build-safe toggles: flexible frame, wide base,
  light roof.
- Safety card: Drop, Cover, Hold On indoors; away from windows and tall furniture; outdoors,
  move to open ground away from buildings, trees and wires.
- Takeaway: Earthquakes come from movement of Earth's plates. We can't predict them, but we
  can build and act safely.

**Module project:** *Safety poster sprint.* Build a lightning + earthquake safety card set
using the existing `design-card` widget, checked against a rubric of required points.

**Arcade:** 4 `concept` + 1 `match` (situation ↔ safe action).

---

## Module 6: Stars and the Solar System

**Objectives:** Explain the phases of the Moon and why we always see the same face; describe
stars, the light year and constellations (Ursa Major, Orion, Cassiopeia); find the Pole
Star; name the planets in order and describe their key features; tell natural from
artificial satellites and name uses of Indian satellites.

**Misconceptions to target**
- "Moon phases are caused by Earth's shadow." (They come from how much of the Moon's lit half
  we can see. Earth's shadow causes eclipses, not phases.)
- "Stars move across the sky." (Earth rotates; stars appear to move.)
- "Constellations are stars close together." (They only look close from Earth.)
- "The Moon makes its own light." (It reflects sunlight.)

**Engine note:** `orrery` is the only three.js engine in the science courses. It reuses
`Stage3D` (in-view mounting, WebGL-absent fallback). Distances and sizes are **never** to
scale together; the widget has a "true scale" toggle that shows why.

### Lessons

**1. `phy-moon-phases`: Why the Moon changes shape** · `orrery` (mode `moon-phases`)
- Predict: At full moon, where is the Moon relative to the Sun and Earth?
- Watch: Split view. Left: top-down space view, Sun far to one side, the Moon's sunlit half
  always facing the Sun as it orbits Earth. Right: what someone on Earth sees that night.
  A day counter runs 0 to ~29.5 days: new moon, crescent, first quarter, gibbous, full, and
  back.
- Play: Drag the Moon around its orbit; the right view updates. Label each phase quiz-style.
- Watch 2: Same face always visible: a flag on the Moon keeps pointing at Earth as it
  orbits, because it rotates once per orbit.
- Takeaway: Phases are the part of the Moon's lit half we can see from Earth.

**2. `phy-moon-surface`: The Moon up close** · `orrery` (mode `moon-surface`)
- Watch: Fly down to the Moon: craters, dust, no air, no water. Footprint stays forever
  (no wind). Chandrayaan landing site marker.
- Takeaway: The Moon has no atmosphere, so no weather, no sound, and huge temperature swings.

**3. `phy-stars`: Stars and the light year** · `orrery` (mode `stars`)
- Watch: The Sun is a star. Zoom out: it shrinks to a dot among thousands. A light beam races
  from the Sun to Earth (~8 minutes 20 seconds, shown sped up), then from the next nearest
  star (~4.2 years).
- Play: Earth rotation time-lapse over a night: stars sweep across the sky around one fixed
  point, the Pole Star.
- Takeaway: Stars are very far away. We measure their distance in light years.

**4. `phy-constellations`: Patterns in the sky** · `orrery` (mode `sky`)
- Watch: A night sky over India. Tap Ursa Major (Saptarishi): lines connect the stars.
  Follow the two pointer stars to Polaris. Orion and Cassiopeia likewise. Then "side view":
  the same constellation's stars pull apart in depth, showing they're at very different
  distances.
- Play: Find-the-constellation challenge, then trace it by tapping stars in order.
- Takeaway: Constellations are star patterns as seen from Earth.

**5. `phy-solar-system`: The Sun's family** · `orrery` (mode `solar-system`)
- Watch: All eight planets orbiting, inner ones faster. Tap a planet: card with size vs
  Earth, day length, year length, moons, and one surprising fact (Venus spins backwards and
  is hottest; Jupiter could hold ~1300 Earths; Saturn would float in a big enough bathtub;
  Uranus rolls on its side). Asteroid belt between Mars and Jupiter; a comet with its tail
  always pointing away from the Sun; meteors burning up in the atmosphere.
- Play: "True scale" toggle: sizes to scale make the orbits vanish off screen; distances to
  scale make the planets invisible dots. Order-the-planets drag game.
- Takeaway: Eight planets orbit the Sun in fixed paths. Inner four are rocky, outer four are
  giants.

**6. `phy-satellites`: Natural and artificial satellites** · `orrery` (mode `satellites`)
- Watch: The Moon as Earth's natural satellite. Then artificial ones launched from
  Sriharikota: a remote-sensing satellite scanning strips of India, a communication
  satellite sitting over one spot (geostationary), a weather satellite watching a cyclone
  form over the Bay of Bengal. Aryabhata (1975) timeline card.
- Play: Assign 5 jobs to 3 satellite types.
- Takeaway: Artificial satellites are used for weather, communication, TV, mapping and
  navigation.

**Module project:** *Night sky journal.* A week of simulated sky views; the student logs
the Moon's phase each night and predicts the next. Graded on predictions.

**Arcade:** 3 `concept` + 1 "which phase is this?" picture round + 1 `match` (planet ↔ fact).

---

## Animation catalogue (ranked by teaching value)

If time is short, build the top six first; the course still works.

1. **Sound compressions with one red particle** (M3) — kills the "air travels" misconception on sight.
2. **Brick on sand, three faces** (M1) — pressure understood in five seconds.
3. **Moon phases split view** (M6) — space view + Earth view in sync.
4. **Torch, mirror, live angles** (M4) — the laws of reflection become something you feel.
5. **Zoom into sliding surfaces** (M2) — friction's cause made literal.
6. **Cloud charging to a lightning strike** (M5) — with the flash-then-thunder delay.
7. Bell jar with air pumped out (M3).
8. Spring balance peak: static → sliding → rolling (M2).
9. Bottle jets at three depths (M1).
10. Ear signal path, stage by stage (M3).
11. Persistence of vision bird-in-cage (M4).
12. Plates slipping with seismograph trace (M5).
13. Pole Star time-lapse (M6).
14. Two-mirror image count (M4).
15. Constellation depth pull-apart (M6).

---

## Widget config sketch

Example lesson block for `phy-pressure`, to fix the JSON shape early:

```json
{
  "type": "widget",
  "kind": "force-arena",
  "mode": "pressure",
  "title": "Same brick, different dent",
  "object": { "name": "Brick", "weightN": 30 },
  "faces": [
    { "label": "Flat", "areaCm2": 300 },
    { "label": "Side", "areaCm2": 150 },
    { "label": "End",  "areaCm2": 75 }
  ],
  "surface": "sand",
  "predict": {
    "question": "Which way makes the deepest dent?",
    "options": ["Flat", "Side", "End"],
    "answer": 2,
    "explain": "The weight is the same every time. Standing on its end, that weight is spread over the smallest area, so the pressure is highest."
  },
  "sliders": ["forceN", "areaCm2"],
  "presets": ["knife", "bag-strap", "camel-foot", "drawing-pin"]
}
```

`predict` is a shared optional key on every engine: the widget renders the prediction
step first and holds the animation until the student commits.

---

## Open questions (physics-specific)

1. **Audio.** `wave-scope` plays real tones. OK to require a tap to enable sound (autoplay
   policy), with captions describing the sound for students without audio?
2. **Orrery budget.** three.js already ships in its own chunk for robotics. Reuse that chunk
   (recommended) or build Module 6 in 2D SVG to keep physics lightweight?
3. **Formulas.** NCERT introduces Pressure = F/A and frequency in Hz. Show these formulas
   (recommended, after the animation) or keep Module 1 formula-free?

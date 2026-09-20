# Chemistry (Class 8): Production Blueprint

**Course ID:** `chemistry` · **Lesson prefix:** `chem-` · **Accent:** teal
**Audience:** Class 8, NCERT-aligned · **Status:** design only
**Written:** 2026-09-17 · **Owner:** Janakiram
**Read first:** `docs/science/README.md` (lesson loop, engines E1 to E10, visual language)

---

## 0. Executive summary

Most Class 8 students have never held a test tube. This course gives every one of them a
**virtual lab bench** and a **zoom lens down to the particles**. Every reaction is shown
twice: what you would see in the tube (bubbles, colour, flame) and what the particles are
doing underneath.

The two views are the whole design:

```
+-------- WHAT YOU SEE --------+-------- WHAT'S HAPPENING --------+
|  Magnesium ribbon burns with |  Mg atoms and O2 molecules meet,  |
|  a dazzling white flame and  |  pair up into MgO units, the     |
|  leaves white powder.        |  lattice of white powder builds. |
|        (lab-bench)           |        (particle-box)            |
+------------------------------+----------------------------------+
```

A "split view" toggle is available on every `lab-bench` reaction. Particle views are
simplified pictures (a circle per atom, bonds as sticks); a small "simplified model" tag
says so. Class 8 does not teach chemical equations formally, so word equations appear
under the animation, never symbol equations as a requirement.

| Engine | Carries |
|---|---|
| `lab-bench` (E6) | Metals & non-metals reactions, conductivity of liquids, electroplating |
| `particle-box` (E1) | Combustion, oxides, ions moving in solution |
| `zoom-lens` (E7) | Polymers inside fibres and plastics, metal structure |
| `process-timeline` (E8) | Fossil fuel formation, refining |
| `explorer-diagram` (E10) | Flame zones, fractionating column, electroplating cell |
| `circuit-sandbox` (existing) | Conductivity tester |

### Module order **[DEVIATION]**

NCERT lists Coal & Petroleum first. This course teaches **Metals and Non-Metals first**,
because it introduces oxides, acids/bases with litmus and "conductors", which Combustion
(acidic gases, acid rain) and Chemical Effects of Current (conductors) both lean on. Synthetic
Fibres & Plastics follows Coal & Petroleum since plastics are made from petroleum.

| # | Module | Lessons | Signature visualization | Hours |
|---|---|---|---|---|
| 1 | Materials: Metals and Non-Metals | 6 | Iron nail in blue copper sulphate turning green | 3 |
| 2 | Coal and Petroleum | 5 | 300 million years of forest crushed into coal, scrubbed | 2.5 |
| 3 | Combustion and Flame | 6 | Candle flame dissected into three zones | 3 |
| 4 | Synthetic Fibres and Plastics | 5 | Zoom from a nylon rope down to its repeating chain | 2.5 |
| 5 | Chemical Effects of Electric Current | 5 | Copper atoms leaving one plate and coating a key | 2.5 |

~27 lessons, ~14 hours.

---

## The `lab-bench` engine in detail

Chemistry lives or dies on this engine, so it gets its own spec.

**Layout:** a bench strip with a rack of up to 4 test tubes/beakers, a reagent shelf
(bottles with labels), tools (burner, litmus papers red/blue, dropper, tongs, matchstick,
battery + tester), and a notebook panel that fills in observations.

**Interaction:** drag a reagent onto a tube (pours with a short liquid animation), drag a
solid in with tongs, drag the burner under a tube, dip litmus. Tap-to-select alternative
for accessibility (select item, then select target).

**Reactions come from a rule table in JSON, not code.** Each rule matches the tube's contents
+ conditions and names the visual effects to play:

```json
{
  "id": "iron-copper-sulphate",
  "when": { "contains": ["iron-nail", "copper-sulphate-soln"] },
  "over": "20s-scaled",
  "effects": [
    { "fx": "solution-colour", "from": "#2f7fd8", "to": "#8fbf6a" },
    { "fx": "coat-solid", "target": "iron-nail", "colour": "#a0522d" }
  ],
  "observation": "The blue solution turns green. A brown coating forms on the nail.",
  "wordEquation": "iron + copper sulphate → iron sulphate + copper",
  "particleView": "displacement-fe-cu"
}
```

**Effect vocabulary** (the engine implements each once): `solution-colour`, `bubbles`
(rate, size), `flame` (colour, height), `glow`, `smoke`, `precipitate`, `coat-solid`,
`dissolve-solid`, `litmus` (to red / to blue / no change), `gas-test` (pop, relights splint,
turns lime water milky), `heat-shimmer`, `no-change` (explicit, with a message: nothing
happening *is* a result).

**Unmatched combinations** play `no-change` with a friendly note, so free exploration never
breaks. **Dangerous-in-real-life** rules (sodium + water, burning magnesium) carry
`"safety": "watch-only"`, which shows the "watch here, don't try at home" tag.

The rule table is plain JSON evaluated by a pure `matchRule(contents, conditions)` function,
so every reaction in the course can be asserted headlessly in Node.

---

## Module 1: Materials: Metals and Non-Metals

**Objectives:** Compare metals and non-metals by lustre, hardness, malleability, ductility,
sonority and conductivity; describe reactions with oxygen (basic vs acidic oxides), water,
acids and bases; explain displacement reactions; list uses of metals and non-metals.

**Misconceptions to target**
- "All metals are hard and solid." (Sodium cuts with a knife; mercury is liquid.)
- "Non-metals never conduct." (Graphite, a form of carbon, conducts.)
- "Rusting is just dirt." (It is a new substance formed by reaction with oxygen and water.)
- "Any metal can push out any other metal." (Only a more reactive metal displaces a less
  reactive one.)

### Lessons

**1. `chem-metal-properties`: How metals behave** · `lab-bench` (mode `property-tests`) + `zoom-lens`
- Hook: Why are cooking pots metal but their handles plastic?
- Predict: You hit a coal lump and an iron nail with a hammer. What happens to each?
- Watch: Five test stations, each played for a metal and a non-metal: hammer (iron flattens
  into a sheet, coal crumbles), pull into wire, drop on floor (ringing vs dull thud, real
  sound), shine (polish), conductivity tester bulb.
- Zoom: inside a metal, atoms sit in layers that can slide past each other without breaking
  apart, which is why metals bend instead of shatter.
- Play: Test 8 samples yourself; notebook fills a property table.
- Takeaway: Metals are lustrous, malleable, ductile, sonorous, and good conductors.

**2. `chem-exceptions`: The rule-breakers** · `classify`
- Watch: Sodium sliced with a knife, mercury rolling as a liquid in a dish, graphite pencil
  lead lighting the tester bulb, iodine crystals shining.
- Play: `classify` 12 elements into Metal/Non-metal using the property cards, including the
  exceptions.
- Takeaway: The rules are mostly right. Know the exceptions.

**3. `chem-oxygen-reactions`: Burning metals and non-metals** · `lab-bench` + `particle-box` (split view)
- Predict: Magnesium ash is dissolved in water and tested with litmus. Red or blue?
- Watch (watch-only): Magnesium ribbon burns bright white, white ash forms. Dissolved in
  water, red litmus turns blue: a **basic** oxide. Then sulphur burned in a gas jar, the gas
  dissolved in water turns blue litmus red: an **acidic** oxide. Particle view shows Mg
  atoms + O₂ → MgO units, and S + O₂ → SO₂ molecules.
- Watch 2: Rusting over a scrubbed "2 weeks": an iron nail in dry air (no rust), in boiled
  water with oil on top (no rust), in water + air (rust). Tells the student both oxygen and
  water are needed.
- Play: Litmus-test the oxide solutions yourself.
- Takeaway: Metal oxides are basic. Non-metal oxides are acidic.

**4. `chem-water-acid-reactions`: Metals in water and acids** · `lab-bench`
- Predict: Which is stored under kerosene, and why: sodium or copper?
- Watch (watch-only): Sodium skating and fizzing on water, catching fire. Why sodium is kept
  in kerosene and phosphorus under water (phosphorus catches fire in air).
- Watch 2: Zinc/magnesium/iron in dilute hydrochloric acid: bubbles; hold a burning
  matchstick at the mouth: the **pop test** (hydrogen). Copper in dilute acid: nothing.
  Non-metals (sulphur, carbon) in acid: nothing. Zinc in sodium hydroxide solution: bubbles
  and pop.
- Play: Run all combinations; the notebook fills a reaction grid (✓ gas / ✗ no reaction).
- Takeaway: Many metals react with acids to give hydrogen. Non-metals generally don't.

**5. `chem-displacement`: The reactivity contest** · `lab-bench` + `particle-box` (split view)
- Predict: An iron nail in blue copper sulphate solution. Anything happen?
- Watch: Over a scaled 20 minutes, the blue fades to green and a brown copper layer grows on
  the nail. Particle view: iron atoms leave the nail into the solution while copper particles
  leave the solution and settle on the nail.
- Play: A 3x3 grid: zinc, iron, copper each put into zinc sulphate, iron sulphate, copper
  sulphate solutions. Student predicts each cell first, then runs them. A reactivity ladder
  (zinc > iron > copper) builds itself from the results.
- Takeaway: A more reactive metal displaces a less reactive metal from its solution.

**6. `chem-uses`: What we use them for** · `sort-bins`
- Watch: A house cross-section with items tagged: copper wiring, aluminium foil, iron
  railings, gold jewellery, oxygen cylinder at a hospital, chlorine in water purification,
  nitrogen/phosphorus fertilisers, iodine tincture, carbon in pencils.
- Play: Match each use to the property that makes it work (wire → ductile + conductor).
- Takeaway: Every use follows from a property.

**Module project:** *Mystery metal.* Four unlabelled samples; the student chooses tests on
the `lab-bench` to identify each (sodium, copper, zinc, sulphur). Graded on correct IDs with
at most 8 tests.

**Arcade:** 3 `concept` + 1 displacement "will it react?" round + 1 `match` (use ↔ property).

---

## Module 2: Coal and Petroleum

**Objectives:** Tell inexhaustible from exhaustible resources; describe how coal and
petroleum formed; name the products of coal (coke, coal tar, coal gas) and petroleum
refining; describe natural gas and CNG; explain why fossil fuels must be conserved and list
practical ways to save them.

**Misconceptions to target**
- "Coal and oil come from dinosaurs." (Coal is mainly from ancient plants; petroleum from
  tiny sea organisms.)
- "New fossil fuels are forming, so we won't run out." (They take millions of years.)
- "Petrol is pumped out of the ground ready to use." (Crude oil must be refined.)

### Lessons

**1. `chem-resources`: Resources that run out** · `sort-bins` + `process-timeline`
- Watch: Two meters side by side. Sunlight and air refill instantly as they are used; a coal
  heap shrinks and never refills.
- Play: Sort 10 resources into Inexhaustible and Exhaustible.
- Takeaway: Coal, petroleum and natural gas are exhaustible.

**2. `chem-coal-formation`: 300 million years in one slider** · `process-timeline`
- Predict: What was coal before it was coal?
- Watch: Scrub the time handle. Dense swamp forests → trees fall into water → buried under
  mud and soil → layers pile up, pressure and temperature rise (a gauge on screen) → slow
  change into peat → coal seam. A "time chip" shows millions of years.
- Play: Scrub freely; at each stage a card explains. Final step: a coal mine cross-section.
- Takeaway: Coal formed from buried plants under heat and pressure over millions of years.
  This process is carbonisation.

**3. `chem-coal-products`: What we get from coal** · `explorer-diagram` (animated)
- Watch: Coal heated in a closed retort, three outputs flow to three containers: coke
  (almost pure carbon, used for steel), coal tar (black thick liquid → dyes, paints,
  naphthalene balls, roads), coal gas (piped to light streets in the past).
- Play: Tap each product for its uses; drag products to where they are used in a city scene.
- Takeaway: Coke, coal tar and coal gas all come from processing coal.

**4. `chem-petroleum`: From sea creatures to petrol** · `process-timeline` + `explorer-diagram`
- Watch: Tiny sea organisms die and settle on the seabed → buried under sand and clay →
  heat and pressure → oil and gas trapped under rock. A drill reaches it. India map: Digboi
  in Assam (India's first oil well, 1867), Mumbai High, Gujarat, the Krishna-Godavari basin.
- Watch 2: **Fractionating column.** Crude oil vapour rises up a tall tower; the column
  gets cooler toward the top. Each fraction condenses at its own height and pours out of a
  side pipe: petroleum gas (top), petrol, kerosene, diesel, lubricating oil, paraffin wax,
  bitumen (bottom).
- Play: A temperature slider on the column shows which fractions are still vapour. Tap each
  outlet for its uses.
- Takeaway: Petroleum is refined into many useful products. That's why it's called "black gold".

**5. `chem-natural-gas-conservation`: Natural gas and saving fuel** · `process-timeline` + `classify`
- Watch: Natural gas stored under pressure as CNG, piped to homes and buses. A bus exhaust
  comparison: petrol/diesel vs CNG (less smoke).
- Watch 2: A reserves bar draining over "years of use" at today's rate.
- Play: Fuel-saving choices for a family (turn engine off at red light, correct tyre
  pressure, regular servicing, drive at steady moderate speed, carpool, walk short trips).
  A monthly fuel meter responds.
- Takeaway: Natural gas is a cleaner fuel. Every fossil fuel is limited, so save it.

**Module project:** *Refinery operator.* Given a demand list (e.g. more diesel, some wax),
set column outlet valves to fill orders. Graded by matching fractions to outlets.

**Arcade:** 3 `concept` + 1 "order the fractions top to bottom" `concept` + 1 `match` (product ↔ use).

---

## Module 3: Combustion and Flame

**Objectives:** Define combustion; name the three things needed (fuel, oxygen, heat to
ignition temperature); describe rapid, spontaneous and explosive combustion; explain ignition
temperature; describe the zones of a candle flame; define a good fuel and calorific value;
explain the environmental effects of burning fuels; explain how to put out fires.

**Misconceptions to target**
- "Fire is a substance." (It is a reaction releasing heat and light.)
- "Water puts out every fire." (Not oil or electrical fires.)
- "The yellow part of a flame is the hottest." (The outer, blue-ish zone is hottest.)
- "Burning makes things disappear." (Products go into the air as gases and soot.)

### Lessons

**1. `chem-combustion`: What burning needs** · `lab-bench` + `explorer-diagram` (mode `fire-triangle`)
- Predict: Three candles. One open, one under a jar with gaps at the bottom, one under a
  sealed jar. Which goes out first?
- Watch: The sealed candle dims and dies first, particle view shows oxygen particles in the
  jar running out. Then the fire triangle: fuel, oxygen, heat. Remove any side and the
  flame goes out.
- Play: Toggle each side of the triangle on a burning log.
- Takeaway: Combustion needs fuel, air (oxygen) and heat. It gives out heat and light.

**2. `chem-ignition-temperature`: Hot enough to catch** · `lab-bench` + thermometer overlay
- Predict: A paper cup full of water held over a candle. Does the paper burn?
- Watch: The cup heats, but the water absorbs the heat; a thermometer overlay on the paper
  stays well below its ignition temperature. The empty paper cup catches fire quickly.
  Matchstick: friction on the side of the box heats red phosphorus enough to start the head
  burning.
- Play: Heat slider for four materials (paper, wood, kerosene, petrol). Each ignites when
  its bar crosses its line, petrol and kerosene very early (why they are called
  inflammable).
- Takeaway: A substance won't burn until it reaches its ignition temperature.

**3. `chem-combustion-types`: Rapid, spontaneous, explosive** · `particle-box` (mode `reaction-rate`)
- Watch: Three scenes. Gas stove lit (rapid). White phosphorus in air bursting into flame on
  its own at about room temperature (spontaneous, watch-only). A firecracker's sudden
  release of gas, heat, light and sound (explosion). The particle view shows how fast the
  reacting particles combine in each.
- Play: `classify` 8 events (forest fire from hot sun, LPG burning, coal-mine dust fire,
  cracker bursting...).
- Takeaway: Combustion can be rapid, spontaneous or explosive.

**4. `chem-flame-zones`: Inside a candle flame** · `explorer-diagram` (mode `flame`) + `lab-bench`
- Predict: You hold a glass plate in the yellow zone. What collects on it?
- Watch: A candle flame opens up into three coloured zones with animated particles:
  innermost dark zone (unburnt wax vapour, least hot), middle luminous yellow zone (partial
  combustion, glowing carbon particles), outer non-luminous zone (complete combustion,
  hottest). Glass plate in the middle zone collects black soot. A goldsmith's blowpipe
  aims the outer zone at gold.
- Play: Drag a thermometer, a glass plate and a glass tube into each zone; the notebook
  records each result. Self-test mode hides the zone labels.
- Takeaway: The outer zone of a flame is the hottest. The yellow zone has unburnt carbon.

**5. `chem-fuels`: What makes a good fuel?** · `lab-bench` + a simple `bar-chart` widget (new, small)
- Watch: Each fuel heats the same pot of water; a boiling-time race. Bar chart of calorific
  values (kJ/kg): cow dung cake 6 000–8 000, wood 17 000–22 000, coal 25 000–33 000, biogas
  35 000–40 000, petrol / kerosene / diesel ~45 000, methane / CNG ~50 000, LPG ~55 000,
  hydrogen ~150 000.
- Play: Rate each fuel on a card: cheap, easy to store and transport, burns at a moderate
  rate, high calorific value, little pollution. Hydrogen has the highest value but is hard
  to store safely: the student discovers the trade-off.
- Takeaway: Calorific value is heat per kilogram. A good fuel balances several qualities.

**6. `chem-burning-effects`: The cost of burning** · `particle-box` (mode `atmosphere`) + `classify`
- Watch: A city skyline. Vehicles and chimneys release particles: soot, carbon monoxide
  (a warning card: why you never burn coal in a closed room), sulphur dioxide and nitrogen
  oxides. Those gases dissolve in rain drops, which are shown turning acidic (litmus from
  Module 1) and etching a marble monument. More carbon dioxide traps heat: a temperature
  line rises, a glacier shrinks.
- Watch 2: Fire safety: firefighters use water to cool below ignition temperature and cover
  the fuel. Oil or electrical fire: sand or carbon dioxide foam, not water.
- Play: A "switch the city" slider moves buses from diesel to CNG; the smog and acid rain
  meters drop.
- Takeaway: Burning fuels causes air pollution, acid rain and global warming.

**Module project:** *Fire station dispatcher.* Five fire scenarios (kitchen oil, dustbin
paper, electrical short, petrol pump, forest). Choose the right extinguishing method.

**Arcade:** 3 `concept` + 1 "label the flame" picture round + 1 `match` (fire ↔ how to put it out).

---

## Module 4: Synthetic Fibres and Plastics

**Objectives:** Explain what a polymer is; describe rayon, nylon, polyester and acrylic and
their uses; compare synthetic and natural fibres; tell thermoplastics from thermosetting
plastics; explain why plastics are useful and the environmental problems they cause; apply
the 4 Rs.

**Misconceptions to target**
- "Synthetic means fake and useless." (Nylon is stronger than steel wire of the same
  thickness and used in parachutes and ropes.)
- "Rayon is fully synthetic." (It is made from natural wood pulp, so it is called
  artificial silk.)
- "All plastics melt when heated." (Thermosetting plastics don't soften.)
- "Plastic breaks down in a few years." (Most take hundreds of years.)

### Lessons

**1. `chem-polymers`: Chains of small units** · `zoom-lens`
- Hook: A paper clip chain in your hand.
- Watch: Zoom from a cotton T-shirt → thread → fibre → a long chain of repeating glucose
  units (cellulose, a natural polymer). Then the same zoom on a nylon rope, ending in its own
  repeating unit. Units snap together one by one to build the chain.
- Play: Build a chain by dragging identical units; the length meter grows.
- Takeaway: A polymer is a long chain of many small repeating units.

**2. `chem-synthetic-fibres`: Rayon, nylon, polyester, acrylic** · `zoom-lens` + `force-arena` (mode `strength-test`)
- Watch: Four fibre cards, each with origin animation: wood pulp processed into rayon; coal,
  water and air into nylon (1931); polyester (Terylene, PET bottles and wrinkle-free
  clothes); acrylic (warm, wool-like sweaters).
- Play: Strength test: hang weights from threads of cotton, wool, silk and nylon of the same
  length and thickness until they snap. The load bar shows nylon lasting longest.
- Takeaway: Synthetic fibres are made by people from chemicals, mostly from petroleum.

**3. `chem-fibre-properties`: Choosing the right fabric** · `lab-bench` + `classify`
- Watch: Drop water on cotton (soaks in) vs polyester (beads up and dries fast). Hold a
  flame near both (watch-only): the synthetic melts and sticks, which is why you never wear
  it in the kitchen or near fire.
- Play: Pick fabrics for 6 jobs (raincoat, kitchen apron, sweater, fishing net, summer shirt,
  parachute).
- Takeaway: Synthetic fibres dry fast, are strong and cheap, but melt when heated.

**4. `chem-plastics`: Thermoplastics and thermosetting plastics** · `zoom-lens` + `lab-bench`
- Predict: You heat a PVC pipe and a pan handle. Which one bends?
- Watch: Zoom view. Thermoplastic: separate chains that slide apart when heated, so it
  softens and can be reshaped. Thermosetting: chains cross-linked into a net that holds
  together when heated. Bakelite switch, melamine plate, fire-resistant uniforms.
- Play: Heat and bend six items; `sort-bins` into the two types.
- Takeaway: Thermoplastics soften on heating. Thermosetting plastics don't.

**5. `chem-plastics-environment`: Plastics and the planet** · `process-timeline` + `sort-bins`
- Predict: Which disappears first in soil: a banana peel, a cotton cloth, a plastic bag?
- Watch: Buried in soil with a scrubbable timeline. Peel gone in weeks, cotton in months,
  plastic bag unchanged after "hundreds of years". A cow eating plastic; a drain choked by
  bags during rain; burning plastic releasing toxic fumes.
- Play: Sort household waste into biodegradable and non-biodegradable, then the 4 Rs:
  Reduce, Reuse, Recycle, Recover.
- Takeaway: Plastics are non-biodegradable. Use less, reuse, and recycle.

**Module project:** *Kit designer.* Pick fibres and plastics for a school trip kit (bag,
raincoat, water bottle, lunch box, first-aid box), justifying each with a property. Graded
against a property rubric; penalty for single-use plastic.

**Arcade:** 3 `concept` + 1 "thermo or thermosetting?" round + 1 `match` (fibre ↔ use).

---

## Module 5: Chemical Effects of Electric Current

**Objectives:** Test which liquids conduct electricity; explain that pure (distilled) water
is a poor conductor while salt water conducts well; observe chemical effects of current
(bubbles, colour change, deposits); describe electroplating and its uses.

**Misconceptions to target**
- "All water conducts." (Distilled water barely does; dissolved salts make it conduct.)
- "If the bulb doesn't glow, no current flows." (A tiny current may flow; an LED or a
  compass needle detects it.)
- "Electroplating just paints metal on." (Metal particles travel through the solution and
  deposit.)

### Lessons

**1. `chem-tester`: Build a conductivity tester** · `circuit-sandbox` (existing, mode `tester`)
- Watch: Battery, bulb and two free wire ends. Touch the ends together: bulb glows. Touch a
  key, an eraser, a coin, a pencil lead.
- Play: Build the tester in the sandbox; swap the bulb for an LED, then for a compass with a
  wire wrapped around it (the needle deflects even when the current is too weak to light a
  bulb).
- Takeaway: A tester shows whether current flows through a material.

**2. `chem-liquid-conductors`: Which liquids conduct?** · `lab-bench` (mode `conductivity`)
- Predict: Distilled water, tap water, salt water. Rank them by glow.
- Watch: Tester dipped into each beaker. Distilled: LED barely on. Tap water: dim. Salt
  water: bright. Particle view: salt breaks into charged particles (ions) that carry
  current between the electrodes; distilled water has almost none.
- Play: Test lemon juice, vinegar, sugar solution, vegetable oil, milk. Add salt a pinch at a
  time: brightness climbs.
- Safety card: this is why you never touch switches with wet hands.
- Takeaway: Most liquids that conduct are solutions of acids, bases or salts.

**3. `chem-chemical-effects`: Current can cause chemical change** · `lab-bench` + `particle-box`
- Watch: Carbon electrodes (pencil leads) in salty water: bubbles at both electrodes.
  Particle view: gas molecules forming at each. A cut potato with two wires: after a while, a
  greenish-blue spot appears near the wire connected to the positive terminal, a
  "potato polarity tester".
- Play: Swap the battery around, watch which side the spot forms.
- Takeaway: Passing current through a conducting solution can cause bubbles, deposits or
  colour changes. These are chemical effects of current.

**4. `chem-electroplating`: Coating one metal with another** · `explorer-diagram` + `particle-box` (split view)
- Predict: A copper plate and an iron key in copper sulphate solution, connected to a
  battery. Which one gains copper?
- Watch: The key is attached to the negative terminal, the copper plate to the positive.
  Particle view: copper particles leave the plate, travel through the blue solution and
  settle on the key. Scrub time: the key turns copper-coloured; the plate gets thinner.
- Play: Swap terminals and watch the coating go the wrong way (plate gains, key loses).
  Current slider: more current, faster coating.
- Takeaway: Electroplating deposits a layer of one metal on another using electricity. The
  object to be coated goes on the negative terminal.

**5. `chem-electroplating-uses`: Where plating is used** · `classify` + image block
- Watch: Chromium-plated bicycle handlebars and bathroom taps (shiny, scratch-resistant),
  tin-coated cans (tin is less reactive, keeps food safe), gold/silver plated jewellery,
  zinc coating on iron to prevent rust (galvanising; note in `explain` that industry often
  galvanises by dipping in molten zinc, and electroplating is one method).
- Watch 2: Waste solution from a plating factory: why it must be disposed of safely.
- Play: Match 8 objects to the metal coating and the reason.
- Takeaway: Plating protects, beautifies, and saves costly metal.

**Module project:** *Plating workshop.* Plate a spoon with the right setup (terminal,
solution, electrode) in the fewest attempts. Graded by the `lab-bench` rule match.

**Arcade:** 3 `concept` + 1 "which beaker lights brightest?" picture round + 1 `match`
(plated object ↔ metal).

---

## Animation catalogue (ranked by teaching value)

1. **Iron nail in copper sulphate, split view** (M1) — displacement seen and explained.
2. **Candle flame zones** (M3) — the most-examined diagram in the chapter, made explorable.
3. **Electroplating particle flow** (M5) — plate thins, key coats, terminal swap reverses it.
4. **Fractionating column** (M2) — fractions condensing at their heights.
5. **Coal formation timeline** (M2) — 300 million years in one slider.
6. **Polymer zoom, rope to repeating unit** (M4).
7. **Sealed jar candle dying** (M3) — oxygen particles running out.
8. **Rusting three-tube experiment** (M1).
9. **Salt water ions carrying current** (M5).
10. **Thermoplastic chains sliding vs thermoset net holding** (M4).
11. **Acid rain etching marble** (M3).
12. **Pop test for hydrogen** (M1).
13. **Paper cup of water over a flame** (M3).
14. **Biodegradation race** (M4).
15. **Sodium on water** (M1) — watch-only; students will replay it, so the explanation card
    must be good.

---

## Open questions (chemistry-specific)

1. **Chemical formulas.** Show formulas (MgO, SO₂, CuSO₄) in small print under word
   equations as a preview for Class 9, or word equations only?
2. **Watch-only reactions.** Keep sodium/water and magnesium burning as spectacular
   animations (engaging, recommended) or tone them down?
3. **Real lab video.** Should any lesson embed short real experiment clips alongside the
   animation, or keep the course 100% animated (offline-friendly, recommended)?

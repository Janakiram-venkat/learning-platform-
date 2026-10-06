# Biology (Class 8): Production Blueprint

**Course ID:** `biology` · **Lesson prefix:** `bio-` · **Accent:** green
**Audience:** Class 8, NCERT-aligned · **Status:** design only
**Written:** 2026-09-17 · **Owner:** Janakiram
**Read first:** `docs/science/README.md` (lesson loop, engines E1 to E10, visual language)

---

## 0. Executive summary

Biology at this level asks students to hold two scales in their head at once: the
**microscopic** (cells, microbes, a zygote dividing) and the **very slow** (a crop season, a
forest disappearing, a frog growing from an egg). The course solves both with two moves:

- **Zoom** (`zoom-lens`): a continuous dive from something visible down to the thing that
  explains it. Onion peel → cell → nucleus. Curd → Lactobacillus. Root nodule → Rhizobium.
- **Scrub** (`process-timeline`): a time handle the student drags through a slow process.
  Sowing → harvest. Egg → tadpole → frog. Forest → wasteland.

A third move, **cycles** (`cycle-wheel`), handles loops where nothing is lost: the nitrogen
cycle.

| Engine | Carries |
|---|---|
| `zoom-lens` (E7) | Cells, microorganisms, root nodules |
| `process-timeline` (E8) | Crop cycle, embryo development, metamorphosis, deforestation |
| `cycle-wheel` (E9) | Nitrogen cycle |
| `explorer-diagram` (E10) | Cell organelles, farm tools, reproductive systems (schematic), endocrine glands, biosphere reserve zones |
| `particle-box` (E1) | Microbe growth, fermentation bubbles, food spoilage |
| `lab-bench` (E6) | Yeast + sugar, curd setting, preservation experiments |

### Module order **[DEVIATION]**

NCERT order starts with Crop Production. This course teaches **Cell first**, because every
later chapter needs it: microorganisms are single cells, reproduction starts from a single
fused cell (zygote), and Rhizobium in crop rotation is a microbe. Conservation follows crops
(both are about land use). Reproduction and Adolescence come last, together, when the
student already has the cell and hormone vocabulary.

| # | Module | Lessons | Signature visualization | Hours |
|---|---|---|---|---|
| 1 | Cell: Structure and Functions | 6 | Zoom from an onion into its cells, then into one nucleus | 3 |
| 2 | Microorganisms: Friend and Foe | 7 | A drop of pond water teeming, then milk turning to curd | 3.5 |
| 3 | Crop Production and Management | 6 | One field through a full season, kharif to rabi | 3 |
| 4 | Conservation of Plants and Animals | 6 | A forest scrubbed into a desert, then restored | 3 |
| 5 | Reproduction in Animals | 5 | Frog egg to frog, and a single cell dividing into an embryo | 2.5 |
| 6 | Reaching the Age of Adolescence | 5 | Glands signalling with hormones through the bloodstream | 2.5 |

~35 lessons, ~17.5 hours.

---

## Sensitive content (Modules 5 and 6)

These two modules follow NCERT Class 8 content and nothing beyond it. Rules for every
string, diagram and quiz in them:

1. **Schematic diagrams only.** Flat, labelled line drawings in the same style as the
   textbook. Never realistic renders, 3D bodies, or photographs of people.
2. **Biology, not bodies.** Animals used as the main examples wherever NCERT does (frog,
   hen, Hydra, Amoeba, silkworm). Human systems shown as simple labelled organ diagrams.
3. **Clinical, respectful language.** Correct terms, defined once, no jokes, no slang.
4. **Nothing personal.** No quiz or activity asks about the student's own body, feelings or
   experiences. Quizzes test facts and diagrams only.
5. **Myths handled directly.** NCERT's myths-and-facts section becomes a tap-to-reveal
   card set, each fact stated plainly.
6. **A note for parents and teachers** sits at the top of each module's overview page:
   what's covered, that it follows NCERT, and where to find the matching textbook chapter.
7. **Visibility** (open question): default-on vs a teacher/parent toggle. The JSON gets a
   `"sensitive": true` flag on both modules either way, so the frontend can gate later
   without a content change.
8. **Help card** at the end of Module 6: talk to a parent, teacher, school counsellor or
   doctor, and a reminder that everyone's timeline is different.

---

## Module 1: Cell: Structure and Functions

**Objectives:** Explain that all living things are made of cells; describe the discovery of
the cell; compare the size, shape and number of cells; describe cell membrane, cytoplasm and
nucleus; compare plant and animal cells; name key organelles and their jobs; explain that
cells divide to help organisms grow and repair.

**Misconceptions to target**
- "Bigger animals have bigger cells." (They have more cells. An elephant's cells are about
  the same size as a mouse's.)
- "Cells are flat like diagrams." (They are 3D.)
- "Only animals have cells" / "plants are alive but not made of cells".
- "A cell is empty inside except for the nucleus." (The cytoplasm is packed and busy.)

### Lessons

**1. `bio-what-is-cell`: The building blocks of life** · `zoom-lens`
- Hook: A brick wall and a building. What is a brick for a living thing?
- Watch: Robert Hooke in 1665 looking at a thin slice of cork; the view through his
  microscope shows little boxes he called "cells". Then zoom: a leaf → leaf surface → rows
  of cells; your skin → skin cells; a drop of blood → round red blood cells.
- Play: Pinch-zoom three samples; each has a scale bar that updates (mm → μm).
- Takeaway: The cell is the basic structural and functional unit of life.

**2. `bio-cell-size-shape`: Shapes that fit their jobs** · `explorer-diagram` + `classify`
- Predict: Which cell is longest in your body?
- Watch: Lined up on one scale bar: a bacterium (tiny), red blood cell (disc, squeezes
  through thin tubes), muscle cell (spindle, contracts), nerve cell (long branches, carries
  messages; can be very long), a hen's egg (a single cell), and an ostrich egg, the largest
  single cell. Then Amoeba changing shape with its pseudopodia.
- Play: Match shape to job for 5 cell types. Unicellular vs multicellular `classify`
  (Amoeba, Paramecium, bacteria vs mango tree, human, fish).
- Takeaway: Cells come in many sizes and shapes; shape suits function.

**3. `bio-cell-parts`: Membrane, cytoplasm, nucleus** · `explorer-diagram` (mode `cell`)
- Watch: An animal cell built layer by layer: the cell membrane draws its border (small
  dots pass in and out through it), cytoplasm fills in (particles drift), the nucleus
  appears with its own membrane, nucleolus, and thread-like chromosomes that carry genes.
- Play: Tap each part for its job card; self-test mode hides labels.
- Takeaway: Every cell has a membrane, cytoplasm and a nucleus (or nuclear material).

**4. `bio-plant-animal-cell`: Plant vs animal cell** · `zoom-lens` (mode `compare`)
- Predict: Onion peel and cheek cells under a microscope. Which has a thick outer wall?
- Watch: Split screen. Onion peel with iodine stain zooming into boxy cells with a cell wall,
  a big central vacuole and a nucleus to one side. Cheek cells with methylene blue zooming
  into rounded cells, no wall, small vacuoles. A leaf cell adds green chloroplasts.
- Play: Drag 6 features into a Venn diagram (plant only / both / animal only).
- Takeaway: Plant cells have a cell wall, chloroplasts and a large vacuole. Animal cells don't.

**5. `bio-organelles`: Tiny organs inside a cell** · `explorer-diagram` (mode `cell-city`)
- Hook: A cell as a city.
- Watch: Toggle between "diagram" and "city" skins of the same layout: nucleus = control
  office, mitochondria = power plants, ribosomes = factories building proteins, cell
  membrane = border gate, cell wall = city wall (plants), chloroplasts = solar panels
  (plants), vacuole = storage tank. Energy sparks leave the mitochondria and travel.
- Play: A "switch it off" tool: disable an organelle, the city shows what fails. Then name the
  organelles in diagram skin only.
- Takeaway: Organelles are specialised parts that do the cell's jobs. (Intro level only;
  details come in Class 9.)

**6. `bio-cell-division`: One cell becomes two** · `process-timeline`
- Watch: A single cell grows, its nucleus copies its chromosomes, the nucleus splits, the cell
  pinches into two identical daughter cells. Then 1 → 2 → 4 → 8 → 16, zooming out to a
  cluster. A cut on skin: new cells fill the gap over scrubbed days.
- Play: Scrub the division stages; a counter doubles each round.
- Takeaway: Cells divide to help living things grow and repair themselves. (Simplified; no
  mitosis stage names at this level.)

**Module project:** *Build a cell.* Drag organelles into a blank plant or animal cell outline
(randomly assigned). Graded: all required parts present, no plant-only parts in an animal
cell, labels correct.

**Arcade:** 3 `concept` + 1 "plant or animal cell?" picture round + 1 `match` (organelle ↔ job).

---

## Module 2: Microorganisms: Friend and Foe

**Objectives:** Name the major groups of microorganisms (bacteria, fungi, protozoa, algae,
viruses); explain where they live; describe useful microorganisms (food, medicine,
agriculture, environment); describe harmful ones (diseases in humans, animals and plants,
food poisoning); explain food preservation methods; describe nitrogen fixation and the
nitrogen cycle; explain communicable diseases and their prevention.

**Misconceptions to target**
- "All microorganisms are germs." (Most are harmless or useful.)
- "Antibiotics cure viral infections like a cold." (Antibiotics don't work on viruses.)
- "Refrigeration kills microbes." (Cold slows them; it doesn't kill them.)
- "Viruses are living cells." (They can reproduce only inside a host cell.)

### Lessons

**1. `bio-microbe-types`: Meet the microbes** · `zoom-lens` + `classify`
- Hook: A drop of pond water. Looks empty.
- Watch: Zoom into the drop: Paramecium gliding with cilia, Amoeba oozing, green algae
  (Chlamydomonas, Spirogyra), then rod-shaped and spiral bacteria, then bread mould fungus
  threads on stale bread. Viruses appear last, far smaller, only shown attached to a host
  cell.
- Play: `classify` 10 microbes into bacteria, fungi, protozoa, algae, virus. A "size ladder"
  lines them up.
- Takeaway: Microorganisms are too small to see without a microscope. There are five main
  groups.

**2. `bio-useful-microbes-food`: Microbes in the kitchen** · `lab-bench` + `particle-box`
- Predict: Warm milk + a spoon of curd, left overnight. What makes it thick?
- Watch: Split view. Milk sets into curd over a scrubbed 8 hours; zoom shows Lactobacillus
  multiplying. Then dough with yeast: yeast cells respire, CO₂ bubbles form and the dough
  rises. Then sugar solution with yeast in a flask: bubbles and a smell (fermentation;
  Louis Pasteur, 1857).
- Play: Temperature slider on the dough: cold → slow rise, warm → fast rise, very hot →
  yeast dies, no rise.
- Takeaway: Bacteria make curd; yeast makes bread rise and ferments sugar.

**3. `bio-useful-microbes-health-soil`: Medicines, vaccines and fertile soil** · `process-timeline` + `zoom-lens`
- Watch: Alexander Fleming's plate (1929): a mould spot and a clear ring around it where
  bacteria couldn't grow: the first antibiotic, penicillin. Then how a vaccine works:
  harmless, weakened microbes enter; the body makes antibodies (drawn as Y-shaped
  markers); later the real microbe arrives and is caught fast. Edward Jenner and smallpox
  (1796); pulse polio. Then decomposers turning a fallen leaf into soil nutrients.
- Play: A "body defence" mini-scene: vaccinated vs not, the same microbe arrives, compare.
- Takeaway: Microbes give us antibiotics and vaccines and clean up dead matter.

**4. `bio-harmful-microbes`: Diseases and food poisoning** · `classify` + `particle-box` (mode `spread`)
- Watch: A classroom map. One person sneezes; droplet particles spread; a second person
  catches it (air). A housefly lands on garbage, then on uncovered food (carrier). A female
  Anopheles mosquito carrying malaria; Aedes carrying dengue; stagnant water where they
  breed.
- Play: `particle-box` spread sim with toggles: cover mouth when sneezing, cover food, remove
  stagnant water, vaccinate. Infected count on a live counter responds.
- Table card (NCERT): tuberculosis (bacteria, air), measles (virus, air), chickenpox (virus,
  air/contact), polio (virus, air/water), cholera (bacteria, water/food), typhoid (bacteria,
  water), hepatitis B (virus, water), malaria (protozoa, mosquito). Animals: anthrax
  (bacteria), foot-and-mouth disease (virus). Plants: citrus canker (bacteria), rust of wheat
  (fungi), yellow vein mosaic of bhindi (virus).
- Takeaway: Some microbes cause communicable diseases that spread through air, water, food,
  contact or carriers.

**5. `bio-food-preservation`: Keeping food safe** · `lab-bench` (mode `spoilage`) + `particle-box`
- Predict: Five slices of mango: plain, salted, in sugar syrup, in oil and vinegar, in the
  fridge. Which spoils first?
- Watch: Scrub 7 days: plain slice grows mould; others hold. Zoom per jar: salt and sugar
  pull water out of microbes; vinegar makes it too acidic; cold slows their multiplication
  (they don't die). Pasteurised milk: heated to about 70 °C for 15 to 30 seconds, then chilled.
- Play: Choose a method for 6 foods (pickle, jam, milk, fish, packed chips with nitrogen
  gas, meat).
- Takeaway: Salt, sugar, oil and vinegar, heating and cooling, and airtight packing stop
  microbes spoiling food.

**6. `bio-nitrogen-fixation`: Bacteria that feed plants** · `zoom-lens`
- Watch: A pea plant's roots → a nodule → inside, Rhizobium bacteria converting nitrogen
  from the air in the soil into a form the plant can use. Blue-green algae in a rice field
  doing the same. Lightning also fixes a little nitrogen.
- Takeaway: Air is 78% nitrogen, but plants can't use it directly. Certain bacteria and
  blue-green algae fix it for them.

**7. `bio-nitrogen-cycle`: Nitrogen's round trip** · `cycle-wheel`
- Watch: Nitrogen tokens travel the loop: air → fixed by bacteria and lightning → soil
  compounds → absorbed by plants → eaten by animals → dead matter and waste → decomposers
  return compounds to soil → some bacteria release nitrogen gas back to air.
- Play: Follow one token (highlighted) all the way round. Break-the-cycle test: remove
  decomposers and watch soil nitrogen run out.
- Takeaway: Nitrogen cycles between the air, soil and living things, and its percentage in
  the air stays roughly constant.

**Module project:** *Outbreak response.* A village map with a cholera-like water-borne
outbreak. Choose 4 actions from 10 within a budget; the spread sim runs and the student
must bring cases below a target.

**Arcade:** 3 `concept` + 1 `match` (disease ↔ microbe type) + 1 "friend or foe?" round.

---

## Module 3: Crop Production and Management

**Objectives:** Tell kharif from rabi crops; describe each agricultural practice in order
(soil preparation, sowing, manure and fertilisers, irrigation, weeding, harvesting,
storage); compare manure with fertilisers; compare traditional and modern irrigation;
describe crop protection and storage; explain animal husbandry.

**Misconceptions to target**
- "Fertilisers are always better than manure." (Overuse harms soil and water; manure
  improves soil texture.)
- "More water always means a better crop." (Over-watering damages roots and wastes water.)
- "Weeds are harmless extra plants." (They compete for water, nutrients, space and light.)

### Lessons

**1. `bio-kharif-rabi`: Two crop seasons** · `process-timeline` (mode `calendar`)
- Watch: A year-wheel over one field. June: monsoon clouds, paddy, maize, soybean, groundnut
  and cotton planted (kharif, harvested around September/October). October: cooler, wheat,
  gram, pea and mustard sown (rabi, harvested around March/April).
- Play: `sort-bins` 10 crops into Kharif and Rabi.
- Takeaway: Kharif crops grow in the rainy season, rabi crops in winter.

**2. `bio-soil-sowing`: Preparing soil and sowing** · `explorer-diagram` + `process-timeline`
- Predict: Why do farmers loosen soil before sowing?
- Watch: Cross-section of soil. Hard, packed soil: roots struggle, earthworms and air
  can't get in. Ploughing (plough, hoe, cultivator) turns and loosens it; air pockets and
  earthworms appear; roots grow deep. Levelling stops water running off. Then seed
  selection: seeds dropped in water, damaged ones float. Seed drill sowing at even depth
  and spacing vs broadcasting by hand (clumped, eaten by birds).
- Play: Adjust spacing on a sowing grid: too close → plants compete (small, yellow); well
  spaced → healthy.
- Takeaway: Ploughing, levelling and correct sowing give every seed a good start.

**3. `bio-manure-fertilisers`: Feeding the soil** · `process-timeline` + `classify`
- Watch: Two plots side by side for 4 seasons. Plot A: chemical fertiliser (NPK) only: big
  yields at first, soil gets hard and less fertile; runoff into a pond turns it green.
  Plot B: manure + crop rotation with a legume (Rhizobium callback to Module 2): steady
  yields, dark crumbly soil. Fallow field option.
- Play: Choose inputs per season; soil health and yield bars respond.
- Takeaway: Manure improves soil texture and is organic. Fertilisers are fast but can harm
  soil and water if overused.

**4. `bio-irrigation`: Getting water to crops** · `explorer-diagram` (animated)
- Watch: Traditional methods operating: moat (pulley system), chain pump, dhekli, rahat
  (lever system) with animals. Then modern: sprinkler (rotating nozzles over uneven land)
  and drip (drops at the roots, almost no waste). A water-use counter per method.
- Play: Pick a method for 4 farms (sandy uneven land, fruit orchard in a dry area, flat
  paddy field, vegetable garden). Water saved meter.
- Takeaway: Drip and sprinkler systems save water.

**5. `bio-crop-protection`: Weeds, pests and harvest** · `process-timeline` + `particle-box`
- Watch: Weeds spreading between crop rows and stealing water/light; removal by hand, by
  tilling before sowing, and weedicides (sprayed with a mask and covered skin). Then
  harvesting with a sickle vs a combine; threshing separates grain from chaff; winnowing
  lets wind blow chaff away while heavier grain falls (particle view).
- Play: Winnowing: set wind speed and drop height to separate grain from chaff.
- Takeaway: Protect crops from weeds and pests; harvest, thresh and winnow the grain.

**6. `bio-storage-husbandry`: Storage and animal husbandry** · `particle-box` + `explorer-diagram`
- Watch: Damp grain in a sack: moisture meter high, fungi and insects multiply. Dried grain
  in a metal bin with dried neem leaves: stays clean. Silos and granaries (FCI). Then animal
  husbandry: a dairy farm with shelter, clean water, balanced feed and care; fish farming.
- Play: Storage checklist game: dry, clean, pest-free, protected from rats.
- Takeaway: Dry, clean, protected storage keeps grain safe. Animal husbandry is raising
  animals with food, shelter and care.

**Module project:** *Run a farm for a year.* One field, two seasons. Choose crops, soil prep,
fertiliser/manure, irrigation, weeding and storage. The `process-timeline` sim plays the
year; graded on yield, soil health and water used, all three above thresholds.

**Arcade:** 3 `concept` + 1 "order the steps" `concept` + 1 `match` (tool ↔ practice).

---

## Module 4: Conservation of Plants and Animals

**Objectives:** Explain causes and consequences of deforestation; define biodiversity,
flora, fauna and endemic species; tell wildlife sanctuaries, national parks and biosphere
reserves apart; explain endangered and extinct species and the Red Data Book; describe
migration; explain reforestation and how recycling paper saves trees.

**Misconceptions to target**
- "Deforestation only affects the animals that live there." (It changes rainfall, soil and
  temperature for everyone.)
- "National parks and sanctuaries are the same." (Rules on human activity differ.)
- "Extinction only happened to dinosaurs." (Species are going extinct now.)
- "Planting a tree fixes cutting one." (A new sapling takes decades to replace a mature tree.)

### Lessons

**1. `bio-deforestation-causes`: Why forests disappear** · `process-timeline` (mode `landscape`)
- Watch: A forest over a scrubbed 50 years: land cleared for farms, houses and factories,
  wood cut for fuel and furniture; natural causes too (forest fire, severe drought).
- Play: A choices panel where each decision (new road, farm expansion, firewood) removes a
  patch of trees on the map.
- Takeaway: Forests are cleared for land and wood, and are lost to fires and droughts.

**2. `bio-deforestation-effects`: What happens next** · `process-timeline` + `cycle-wheel`
- Predict: The forest is gone. What happens to the rain?
- Watch: Same landscape continues. Fewer trees → less water released into the air → less
  rain; bare soil washed away by rain (erosion), topsoil meters draining; land drying toward
  desert; more floods as water runs off; more carbon dioxide in the air and higher
  temperatures. Then reverse: reforestation scrubbed forward, soil and rain recovering
  slowly.
- Play: Toggle "tree cover" and watch rainfall, soil and temperature gauges.
- Takeaway: Deforestation causes soil erosion, desertification, less rain, more floods and
  rising temperatures.

**3. `bio-protected-areas`: Sanctuaries, parks and biosphere reserves** · `explorer-diagram` (mode `reserve-map`)
- Watch: Pachmarhi Biosphere Reserve map. Nested zones light up: Satpura National Park,
  Bori and Pachmarhi Wildlife Sanctuaries inside the reserve; local tribal communities live
  in the outer parts. Cards: wildlife sanctuary (animals protected; some activities like
  grazing may be allowed), national park (larger, whole ecosystem protected, stricter),
  biosphere reserve (large area conserving biodiversity and culture together).
- Play: A map of India with tappable pins (Jim Corbett, Kaziranga, Sundarbans, Gir, Satpura,
  Nilgiri Biosphere Reserve...). `classify` rules into the three area types.
- Takeaway: Protected areas conserve wildlife and habitats at different levels of protection.

**4. `bio-flora-fauna-endemic`: Who lives where** · `explorer-diagram` + `classify`
- Watch: A Pachmarhi forest scene with flora (sal, teak, wild mango, jamun, silver ferns)
  and fauna (bison, leopard, barking deer, Indian giant squirrel). Endemic species glow:
  found only in this area.
- Play: Sort 10 species into flora and fauna, then spot the endemic ones.
- Takeaway: Flora are plants, fauna are animals. Endemic species are found only in one area.

**5. `bio-endangered-red-data`: Endangered species and the Red Data Book** · `process-timeline` + `sort-bins`
- Watch: A population graph for a species as its habitat shrinks: common → vulnerable →
  endangered → extinct (the line hits zero and the icon greys out). Project Tiger (1973):
  the tiger line recovering after protection. The Red Data Book as a record of endangered
  species, maintained internationally.
- Play: A food-chain web: remove one species and watch the web wobble (why every species
  matters).
- Takeaway: Endangered species could become extinct. The Red Data Book tracks them.

**6. `bio-migration-recycling`: Migration, recycling and reforestation** · `process-timeline` (mode `map-paths`, 2D)
- Watch: Migratory birds' flight paths animated onto a globe-like map, arriving in Indian
  wetlands for winter and leaving in spring; why they travel (climate, food, breeding).
  Then: 1 tonne of new paper needs about 17 full-grown trees. A recycling loop turns old
  newspapers back into paper and saves trees. Reforestation card.
- Play: A "school paper drive" calculator: kg collected → trees saved.
- Takeaway: Migratory species travel long distances each year. Recycling paper and planting
  trees help conserve forests.

**Module project:** *Plan a reserve.* On a region map with a village, a river, a forest,
farmland and an endemic species' habitat, draw zones (core / buffer / community use).
Graded on habitat protected, village needs met, corridor for animal movement.

**Arcade:** 3 `concept` + 1 `match` (protected area ↔ state) + 1 "cause or consequence?" round.

---

## Module 5: Reproduction in Animals

`"sensitive": true` · see **Sensitive content** above.

**Objectives:** Explain why reproduction is essential; describe sexual and asexual
reproduction; name the main parts of the male and female reproductive systems (schematic);
explain fertilisation, internal and external; describe development of the embryo and foetus;
tell viviparous from oviparous animals; describe metamorphosis; describe asexual reproduction
by budding and binary fission.

**Misconceptions to target**
- "All animals give birth to live young." (Many lay eggs.)
- "A tadpole is a separate animal from a frog." (It is a stage in the frog's life.)
- "Asexual reproduction needs two parents." (One parent, identical offspring.)
- "Test-tube babies grow in a test tube." (Only fertilisation happens outside the body.)

### Lessons

**1. `bio-reproduction-modes`: Why and how animals reproduce** · `classify` + `process-timeline`
- Watch: A population graph with and without reproduction over generations: without it the
  species vanishes. Two routes shown as simple icons: two parents (sexual), one parent
  (asexual).
- Takeaway: Reproduction keeps a species going. It can be sexual or asexual.

**2. `bio-fertilisation`: Two cells become one** · `zoom-lens` + `explorer-diagram` (schematic)
- Watch: Schematic labelled diagrams (textbook style) of the male reproductive organs (a
  pair of testes, sperm ducts) and female reproductive organs (a pair of ovaries,
  oviducts, uterus), shown separately, then zoom to cell scale. Sperm and egg are drawn as
  cells: each has a nucleus. Fertilisation is shown only at cell scale: the two nuclei fuse
  into one, forming the zygote.
- Watch 2: Internal vs external fertilisation. Frogs in water in the rainy season: eggs laid
  in water in a jelly layer, fertilised outside the body; why so many eggs are laid.
  Humans, hens, cows: inside the body. IVF card: fertilisation outside the body, embryo then
  placed in the uterus.
- Play: `classify` animals into internal and external fertilisation.
- Takeaway: Fertilisation is the fusion of an egg and a sperm, forming a zygote.

**3. `bio-embryo-development`: From zygote to young one** · `process-timeline`
- Watch: The zygote divides again and again (callback to Module 1's cell division) into a
  ball of cells, cells begin to specialise, an embryo forms and becomes embedded in the
  uterus wall, grows into a foetus with recognisable body parts. Schematic, cell and
  outline scale only. Then a hen's egg: the hard shell forms around the developing embryo;
  21 days of warmth; chick hatches.
- Play: Scrub both timelines side by side. `sort-bins` animals into viviparous (give birth
  to young: humans, cows, dogs) and oviparous (lay eggs: hens, frogs, lizards, butterflies).
- Takeaway: The zygote develops into an embryo, then a foetus. Animals are viviparous or
  oviparous.

**4. `bio-metamorphosis`: Big changes in young animals** · `process-timeline`
- Predict: Put these in order: tadpole, egg, frog, froglet (tadpole with legs).
- Watch: Frog: egg → tadpole (tail, gills) → back legs appear → front legs → tail shrinks →
  adult frog. Silkworm: egg → larva (caterpillar) → pupa (cocoon) → adult moth.
- Play: Scrub, then drag stages into order for both life cycles.
- Takeaway: Metamorphosis is a big change in body form from larva to adult.

**5. `bio-asexual-reproduction`: One parent** · `zoom-lens` + `process-timeline`
- Watch: Hydra: a small bulge (bud) grows on the body, develops tentacles, detaches and
  lives on its own. Amoeba: nucleus divides, body pinches into two (binary fission). Cloning
  card: Dolly the sheep (1996), an exact copy from one parent's cell.
- Play: Binary fission counter: start with 1 Amoeba, divide 5 times, count.
- Takeaway: In asexual reproduction a single parent produces offspring, by budding or
  binary fission.

**Module project:** *Life cycle cards.* Build ordered life-cycle cards for a frog, a hen and
a silkworm, labelling fertilisation type and oviparous/viviparous. Graded on order and labels.

**Arcade:** 3 `concept` + 1 "order the stages" `concept` + 1 `match` (animal ↔ reproduction method).

---

## Module 6: Reaching the Age of Adolescence

`"sensitive": true` · see **Sensitive content** above.

**Objectives:** Define adolescence and puberty; describe the changes at puberty (height,
body shape, voice, glands and skin, reproductive maturity, emotional and intellectual
growth); explain the role of hormones and the endocrine glands (pituitary, thyroid,
adrenal, pancreas, testes, ovaries); explain sex determination by chromosomes; describe
reproductive health: nutrition, personal hygiene, physical exercise, and avoiding drugs.

**Misconceptions to target**
- "The mother decides whether the baby is a boy or a girl." (The father's chromosome decides.)
- "Everyone changes at the same age and speed." (Timing varies widely and that's normal.)
- NCERT myths list (tap-to-reveal): e.g. "girls shouldn't exercise during menstruation"
  (false), "physical appearance is determined only by what you eat" (false).

### Lessons

**1. `bio-adolescence-puberty`: A time of change** · `process-timeline` (mode `growth-chart`)
- Watch: An abstract growth chart from age 8 to 20 (no body images): a height line rising
  steeply during 11 to 19 years, with a shaded band showing the wide range of normal.
  Change cards appear as the handle moves: increase in height, change in body shape, voice
  change (larynx grows; boys' voice box becomes visible as the Adam's apple; a
  `wave-scope`-style trace shows the pitch dropping), sweat and oil glands become more
  active (acne card: keep skin clean), emotional and intellectual changes.
- Play: NCERT's height calculator: percentage of full height reached at a given age gives an
  estimate of full adult height (uses the textbook's own table).
- Takeaway: Adolescence is roughly 11 to 19 years. Puberty is when the body becomes capable
  of reproduction.

**2. `bio-hormones-glands`: Chemical messengers** · `explorer-diagram` (mode `endocrine`)
- Hook: Your body has a messaging system without wires.
- Watch: An outline body with glands marked as nodes (pituitary, thyroid, adrenals,
  pancreas, testes/ovaries). A gland releases hormone tokens that travel through the
  bloodstream (animated flow) to a target organ, which lights up and responds. The pituitary
  sends signals to other glands ("master gland").
- Watch 2: Thyroxine and iodine: iodine shortage → goitre; iodised salt card. Insulin from
  the pancreas and diabetes. Adrenaline in a scary moment: heart rate line jumps.
  Metamorphosis link: thyroxine controls tadpole → frog (callback to Module 5).
- Play: Tap a gland: its hormone, its target, what happens if there's too little.
- Takeaway: Endocrine glands release hormones directly into the blood. Testosterone and
  oestrogen bring about the changes at puberty.

**3. `bio-reproductive-maturity`: Reproductive maturity** · `explorer-diagram` + `cycle-wheel`
- Watch: Schematic only. Testes begin to produce sperm; ovaries begin to release an egg
  about once every 28 to 30 days. A `cycle-wheel` shows the menstrual cycle as a calendar
  loop: egg released, uterus lining thickens, if not fertilised the lining breaks down
  (menstruation). Menarche (first) and menopause (stops, around 45 to 50) as timeline
  points. Language strictly as NCERT.
- Takeaway: At puberty, the reproductive organs mature. Menstruation is a normal part of
  the female reproductive cycle.

**4. `bio-sex-determination`: XX and XY** · `explorer-diagram` (mode `punnett-lite`)
- Predict: Who determines whether a baby is a boy or a girl?
- Watch: Chromosome cards. Mother's egg always carries an X. Father's sperm carries either
  X or Y. X + X → girl, X + Y → boy. A simple two-by-two grid fills in, showing 50/50 odds.
- Play: Run 100 random pairings; a tally bar settles near 50/50.
- Takeaway: Sex is determined by the chromosome in the father's sperm.

**5. `bio-reproductive-health`: Staying healthy** · `classify` + tap-to-reveal cards
- Watch: A balanced plate builder (proteins, carbohydrates, fats, vitamins; iron-rich
  foods like leafy vegetables, jaggery, dates; milk for calcium). Hygiene checklist.
  Exercise and sleep bars. A clear "say no to drugs" card: drugs harm the body and mind;
  no one should pressure you.
- Play: Build a day's balanced meals from a thali of Indian foods; nutrition meters fill.
  Myths vs facts cards (tap to reveal the fact).
- Help card (see Sensitive content, rule 8).
- Takeaway: Balanced food, hygiene, exercise and avoiding drugs keep adolescents healthy.

**Module project:** none. Replaced by the **arcade only**, to keep the module fact-based and
avoid any activity that invites personal reflection.

**Arcade:** 4 `concept` + 1 `match` (gland ↔ hormone).

---

## Animation catalogue (ranked by teaching value)

1. **Onion peel zoom into a cell** (M1) — scale made intuitive in one gesture.
2. **Nitrogen cycle with one tracked token** (M2) — the cycle stops being a diagram to memorise.
3. **Milk to curd, split view** (M2) — microbes as friends, visible.
4. **Forest to desert and back** (M4) — cause and consequence on one scrubber.
5. **Frog metamorphosis** (M5) — ordering stages becomes watching them.
6. **Disease spread sim with prevention toggles** (M2) — hygiene rules justified by numbers.
7. **Hormone tokens through the bloodstream** (M6).
8. **Farm year, kharif to rabi** (M3).
9. **Plant vs animal cell split view** (M1).
10. **Fleming's clear ring** (M2).
11. **Winnowing by wind** (M3).
12. **Food preservation jars over 7 days** (M2).
13. **Drip vs flood irrigation water counter** (M3).
14. **Species population decline and Project Tiger recovery** (M4).
15. **Hydra budding** (M5).

---

## Open questions (biology-specific)

1. **Modules 5 and 6 visibility:** default-on (NCERT curriculum) or behind a teacher/parent
   toggle? The `"sensitive": true` flag supports either.
2. **Cell organelles depth:** NCERT Class 8 mentions few organelles. Keep the intro-level
   organelle lesson (listed in your topics) or trim to membrane/cytoplasm/nucleus/plastids/vacuole?
3. **Photos:** real microscope images (onion peel, Paramecium) are a big authenticity win.
   Source licensed images for the image checklist, or keep everything illustrated?
4. **Regional examples:** the Pachmarhi, Kaziranga and crop examples are India-wide. Add a
   state picker so crops and reserves match the student's region later?

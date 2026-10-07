// Class 8 chemistry syllabus for the Chemistry course.
// The lesson list is generated from docs/science/chemistry-blueprint.md.
//
// To make a lesson playable: add its widget block to WIDGET_BLOCKS below
// (key = lesson id). Lessons without a block show as "Soon" on the hub.
//
// Module order deliberately differs from NCERT (see the blueprint's
// [DEVIATION] note): Metals and Non-Metals comes first because oxides,
// litmus and conductors are reused by Combustion and Electric Current.
export const CHEMISTRY_8 = {
  "subject": "chemistry",
  "classLevel": 8,
  "title": "Chemistry",
  "modules": [
    {
      "id": 1,
      "title": "Materials: Metals and Non-Metals",
      "emoji": "🪙",
      "lessons": [
        {
          "id": "chem-metal-properties",
          "title": "How metals behave",
          "engine": "lab-bench"
        },
        {
          "id": "chem-exceptions",
          "title": "The rule-breakers",
          "engine": "classify"
        },
        {
          "id": "chem-oxygen-reactions",
          "title": "Burning metals and non-metals",
          "engine": "lab-bench"
        },
        {
          "id": "chem-water-acid-reactions",
          "title": "Metals in water and acids",
          "engine": "lab-bench"
        },
        {
          "id": "chem-displacement",
          "title": "The reactivity contest",
          "engine": "lab-bench"
        },
        {
          "id": "chem-uses",
          "title": "What we use them for",
          "engine": "sort-bins"
        }
      ]
    },
    {
      "id": 2,
      "title": "Coal and Petroleum",
      "emoji": "🛢️",
      "lessons": [
        {
          "id": "chem-resources",
          "title": "Resources that run out",
          "engine": "sort-bins"
        },
        {
          "id": "chem-coal-formation",
          "title": "300 million years in one slider",
          "engine": "process-timeline"
        },
        {
          "id": "chem-coal-products",
          "title": "What we get from coal",
          "engine": "explorer-diagram"
        },
        {
          "id": "chem-petroleum",
          "title": "From sea creatures to petrol",
          "engine": "process-timeline"
        },
        {
          "id": "chem-natural-gas-conservation",
          "title": "Natural gas and saving fuel",
          "engine": "process-timeline"
        }
      ]
    },
    {
      "id": 3,
      "title": "Combustion and Flame",
      "emoji": "🔥",
      "lessons": [
        {
          "id": "chem-combustion",
          "title": "What burning needs",
          "engine": "lab-bench"
        },
        {
          "id": "chem-ignition-temperature",
          "title": "Hot enough to catch",
          "engine": "lab-bench"
        },
        {
          "id": "chem-combustion-types",
          "title": "Rapid, spontaneous, explosive",
          "engine": "particle-box"
        },
        {
          "id": "chem-flame-zones",
          "title": "Inside a candle flame",
          "engine": "explorer-diagram"
        },
        {
          "id": "chem-fuels",
          "title": "What makes a good fuel?",
          "engine": "lab-bench"
        },
        {
          "id": "chem-burning-effects",
          "title": "The cost of burning",
          "engine": "particle-box"
        }
      ]
    },
    {
      "id": 4,
      "title": "Synthetic Fibres and Plastics",
      "emoji": "🧵",
      "lessons": [
        {
          "id": "chem-polymers",
          "title": "Chains of small units",
          "engine": "zoom-lens"
        },
        {
          "id": "chem-synthetic-fibres",
          "title": "Rayon, nylon, polyester, acrylic",
          "engine": "zoom-lens"
        },
        {
          "id": "chem-fibre-properties",
          "title": "Choosing the right fabric",
          "engine": "lab-bench"
        },
        {
          "id": "chem-plastics",
          "title": "Thermoplastics and thermosetting plastics",
          "engine": "zoom-lens"
        },
        {
          "id": "chem-plastics-environment",
          "title": "Plastics and the planet",
          "engine": "process-timeline"
        }
      ]
    },
    {
      "id": 5,
      "title": "Chemical Effects of Electric Current",
      "emoji": "🔋",
      "lessons": [
        {
          "id": "chem-tester",
          "title": "Build a conductivity tester",
          "engine": "circuit-sandbox"
        },
        {
          "id": "chem-liquid-conductors",
          "title": "Which liquids conduct?",
          "engine": "lab-bench"
        },
        {
          "id": "chem-chemical-effects",
          "title": "Current can cause chemical change",
          "engine": "lab-bench"
        },
        {
          "id": "chem-electroplating",
          "title": "Coating one metal with another",
          "engine": "explorer-diagram"
        },
        {
          "id": "chem-electroplating-uses",
          "title": "Where plating is used",
          "engine": "classify"
        }
      ]
    }
  ]
};

/**
 * Widget configs, keyed by lesson id.
 *
 * A block here marks the lesson "ready", so only add one when the engine named
 * by `kind` is registered in components/lesson/LessonWidget.jsx. Right now that
 * means the existing robotics engines (`classify`, `sort-bins`,
 * `circuit-sandbox`). `lab-bench`, `zoom-lens` and the rest are not built, so
 * their lessons stay "Soon".
 *
 * `classify` config: { kind, title, prompt, options[{id,label,emoji}],
 * tasks[{id,emoji,label,answer,explain}] }. Note ClassifyParts ignores
 * `predict` (only force-arena wraps itself in PredictGate), so `hook` on the
 * page header does that job instead.
 *
 * `xp` / `xpKey` are left out on purpose: physics does not award XP, and the
 * xpKey naming convention lives in lib/progress. Add them if you want XP.
 */
export const WIDGET_BLOCKS = {
  'chem-exceptions': {
    kind: 'classify',
    title: 'Metal or non-metal?',
    hook: 'Metals are shiny, hard and conduct electricity. So why can sodium be cut with a knife?',
    prompt:
      'Judge each element by what it actually does, not by what you expect. Some of these break the rules.',
    options: [
      { id: 'metal', label: 'Metal', emoji: '🔩' },
      { id: 'nonmetal', label: 'Non-metal', emoji: '💨' },
    ],
    tasks: [
      {
        id: 'sodium', emoji: '🔪', label: 'Sodium: soft enough to cut with a knife',
        answer: 'metal',
        explain:
          'Sodium is a metal even though it is soft. It is lustrous when freshly cut and it conducts electricity. Sodium and potassium are the soft ones.',
      },
      {
        id: 'sulphur', emoji: '🟡', label: 'Sulphur: yellow, dull and brittle',
        answer: 'nonmetal',
        explain:
          'Sulphur crumbles when hit, has no lustre and does not conduct. A textbook non-metal.',
      },
      {
        id: 'iron', emoji: '🔩', label: 'Iron: hard, shiny, rings when struck',
        answer: 'metal',
        explain:
          'Iron is lustrous, hard, sonorous and conducts. It matches every metal property.',
      },
      {
        id: 'graphite', emoji: '✏️', label: 'Graphite (carbon): pencil lead that lights a tester bulb',
        answer: 'nonmetal',
        explain:
          'Graphite is a form of carbon, a non-metal, yet it conducts electricity. It is one of the few non-metals that does.',
      },
      {
        id: 'mercury', emoji: '🌡️', label: 'Mercury: a shiny liquid at room temperature',
        answer: 'metal',
        explain:
          'Mercury is a metal, and the only common one that is liquid at room temperature. It is also a good conductor.',
      },
      {
        id: 'oxygen', emoji: '💨', label: 'Oxygen: a colourless gas',
        answer: 'nonmetal',
        explain:
          'Most non-metals are gases or brittle solids. Oxygen is a gas and does not conduct.',
      },
      {
        id: 'copper', emoji: '🪙', label: 'Copper: reddish, drawn into wires',
        answer: 'metal',
        explain:
          'Copper is ductile and an excellent conductor, which is why it is used for electrical wiring.',
      },
      {
        id: 'iodine', emoji: '🟣', label: 'Iodine: shiny grey-purple crystals that crumble',
        answer: 'nonmetal',
        explain:
          'Iodine is lustrous, which is unusual for a non-metal, but it is brittle and does not conduct.',
      },
      {
        id: 'aluminium', emoji: '🥫', label: 'Aluminium: beaten into thin foil',
        answer: 'metal',
        explain:
          'Aluminium is very malleable, so it can be beaten into foil. It conducts heat and electricity too.',
      },
      {
        id: 'diamond', emoji: '💎', label: 'Diamond (carbon): the hardest natural substance',
        answer: 'nonmetal',
        explain:
          'Diamond is hard, but hardness is not what makes a metal. It does not conduct, and it is another form of carbon.',
      },
      {
        id: 'zinc', emoji: '🪣', label: 'Zinc: coating on galvanised buckets',
        answer: 'metal',
        explain:
          'Zinc is a metal. It is a good conductor and is used to coat iron to protect it from rusting.',
      },
      {
        id: 'phosphorus', emoji: '⚪', label: 'Phosphorus: waxy solid that catches fire in air',
        answer: 'nonmetal',
        explain:
          'Phosphorus is a soft, waxy non-metal. White phosphorus is stored under water because it catches fire in air.',
      },
    ],
    takeaway:
      'The rules for metals are mostly right. Learn the exceptions: sodium is soft, mercury is liquid, graphite conducts, and iodine is shiny.',
  },
  'chem-tester': {
    kind: 'circuit-sandbox',
    mode: 'tester',
    title: 'Conductivity tester',
    hook: 'A battery, a bulb and two loose wire ends. What can you find out with just that?',
    hint:
      'Put each material between the two probe ends. Try all three indicators: they do not notice the same currents.',
    // Currents are illustrative teaching numbers (mA), not measurements.
    materials: [
      { id: 'touch', label: 'Touch the ends', emoji: '🤝', ma: 220 },
      { id: 'key', label: 'Key', emoji: '🔑', ma: 200 },
      { id: 'coin', label: 'Coin', emoji: '🪙', ma: 200 },
      { id: 'lead', label: 'Pencil lead', emoji: '✏️', ma: 45 },
      { id: 'eraser', label: 'Eraser', emoji: '🧽', ma: 0 },
      { id: 'ruler', label: 'Wooden ruler', emoji: '📏', ma: 0 },
      { id: 'tap', label: 'Tap water', emoji: '🚰', ma: 2 },
    ],
    takeaway:
      'A tester shows whether current flows through a material. Metals and graphite let it through; most other solids do not.',
  },
  'chem-uses': {
    kind: 'sort-bins',
    title: 'Which property does the job?',
    hook: 'Why is a wire made of copper but a railing made of iron? The job decides the material.',
    prompt:
      'Drop each use into the bin for the property that makes it work. The last bin is for non-metals doing a chemical job.',
    columns: [
      { id: 'conductor', label: 'Conducts electricity', emoji: '⚡' },
      { id: 'malleable', label: 'Malleable or ductile', emoji: '🔨' },
      { id: 'strong', label: 'Hard and strong', emoji: '💪' },
      { id: 'nonmetal', label: 'Non-metal chemical job', emoji: '🧪' },
    ],
    cards: [
      { id: 'copper-wire', emoji: '🔌', label: 'Copper wire carrying current round a house', column: 'conductor' },
      { id: 'plug-pin', emoji: '🔋', label: 'Metal pins of a plug', column: 'conductor' },
      { id: 'foil', emoji: '🥫', label: 'Aluminium foil wrapped round food', column: 'malleable' },
      { id: 'gold-leaf', emoji: '✨', label: 'Gold beaten into a thin leaf', column: 'malleable' },
      { id: 'roof', emoji: '🏠', label: 'Iron sheets rolled flat for a roof', column: 'malleable' },
      { id: 'railing', emoji: '🚧', label: 'Iron railings along a road', column: 'strong' },
      { id: 'girder', emoji: '🌉', label: 'Steel girders holding up a bridge', column: 'strong' },
      { id: 'crowbar', emoji: '🪛', label: 'A steel crowbar for lifting stones', column: 'strong' },
      { id: 'oxygen', emoji: '🏥', label: 'Oxygen cylinder in a hospital', column: 'nonmetal' },
      { id: 'chlorine', emoji: '🚰', label: 'Chlorine used to purify drinking water', column: 'nonmetal' },
      { id: 'iodine', emoji: '🩹', label: 'Iodine tincture on a cut', column: 'nonmetal' },
      { id: 'fertiliser', emoji: '🌾', label: 'Nitrogen and phosphorus fertilisers for crops', column: 'nonmetal' },
    ],
    note:
      'Every use follows from a property. Wire needs a conductor that can be drawn out, foil needs a malleable metal, railings need strength, and non-metals do their work by reacting.',
    takeaway: 'Every use of a metal or non-metal follows from one of its properties.',
  },
  'chem-resources': {
    kind: 'sort-bins',
    title: 'Will it run out?',
    hook: 'Sunlight arrives again tomorrow. A lump of coal never comes back. What is the difference?',
    prompt:
      'Sort each resource: does it refill as fast as we use it, or can we use it up?',
    columns: [
      { id: 'inexhaustible', label: 'Inexhaustible', emoji: '♾️' },
      { id: 'exhaustible', label: 'Exhaustible', emoji: '⛽' },
    ],
    cards: [
      { id: 'sunlight', emoji: '☀️', label: 'Sunlight', column: 'inexhaustible' },
      { id: 'air', emoji: '🌬️', label: 'Air', column: 'inexhaustible' },
      { id: 'wind', emoji: '🌀', label: 'Wind', column: 'inexhaustible' },
      { id: 'waves', emoji: '🌊', label: 'Ocean waves', column: 'inexhaustible' },
      { id: 'coal', emoji: '⚫', label: 'Coal', column: 'exhaustible' },
      { id: 'petroleum', emoji: '🛢️', label: 'Petroleum', column: 'exhaustible' },
      { id: 'gas', emoji: '🔥', label: 'Natural gas', column: 'exhaustible' },
      { id: 'diesel', emoji: '⛽', label: 'Diesel', column: 'exhaustible' },
      { id: 'ore', emoji: '🪨', label: 'Iron ore', column: 'exhaustible' },
      { id: 'lpg', emoji: '🍳', label: 'LPG cooking gas', column: 'exhaustible' },
    ],
    note:
      'Diesel and LPG are made from petroleum and natural gas, so they run out too. Coal, petroleum and natural gas took millions of years to form, far longer than we take to use them.',
    takeaway: 'Coal, petroleum and natural gas are exhaustible resources.',
  },
  'chem-electroplating-uses': {
    kind: 'classify',
    title: 'Which metal goes on?',
    hook: 'A bicycle handlebar looks like silver, but it is steel with a coating thinner than a hair.',
    prompt:
      'Each object is plated with a thin layer of another metal. Pick the coating metal that fits the reason.',
    options: [
      { id: 'chromium', label: 'Chromium', emoji: '🪞' },
      { id: 'tin', label: 'Tin', emoji: '🥫' },
      { id: 'zinc', label: 'Zinc', emoji: '🪣' },
      { id: 'precious', label: 'Gold or silver', emoji: '💍' },
    ],
    tasks: [
      {
        id: 'handlebar', emoji: '🚲', label: 'Bicycle handlebar: shiny and scratch-resistant',
        answer: 'chromium',
        explain: 'Chromium gives a hard, bright, scratch-resistant finish over steel.',
      },
      {
        id: 'tap', emoji: '🚿', label: 'Bathroom tap that stays shiny in damp air',
        answer: 'chromium',
        explain: 'A chromium layer keeps the tap bright and protects the metal under it.',
      },
      {
        id: 'bumper', emoji: '🚗', label: 'Steel bumper that must resist scratches',
        answer: 'chromium',
        explain: 'Chromium plating is hard wearing, which is why it was used for bumpers and trim.',
      },
      {
        id: 'food-can', emoji: '🥫', label: 'Steel food can that must not contaminate food',
        answer: 'tin',
        explain: 'Tin is less reactive than iron, so a tin coating keeps the food safe and the steel from rusting.',
      },
      {
        id: 'bucket', emoji: '🪣', label: 'Iron bucket kept outdoors, which must not rust',
        answer: 'zinc',
        explain: 'A zinc coating stops iron rusting. This is called galvanising. Industry often dips iron in molten zinc, and electroplating is another way to do it.',
      },
      {
        id: 'fence', emoji: '🚧', label: 'Iron fence wire left out in the rain',
        answer: 'zinc',
        explain: 'Zinc protects the iron underneath from air and water, so it lasts much longer.',
      },
      {
        id: 'necklace', emoji: '📿', label: 'Necklace that looks like gold without the cost',
        answer: 'precious',
        explain: 'A very thin layer of gold over a cheaper metal gives the look for a fraction of the price. Plating saves costly metal.',
      },
      {
        id: 'spoon', emoji: '🥄', label: 'Cutlery given a silver finish',
        answer: 'precious',
        explain: 'A thin layer of silver beautifies cheaper metal. Plating protects, beautifies and saves costly metal.',
      },
    ],
    takeaway:
      'Plating protects metal, makes it look better and saves costly metal. The object to be coated goes on the negative terminal.',
  },
  'chem-displacement': {
    kind: 'lab-bench',
    mode: 'displacement',
    title: 'The reactivity contest',
    hook: 'An iron nail goes into blue copper sulphate solution. Does anything happen?',
    hint:
      'Pour a solution, drop in a metal and watch. Try all nine combinations and the results table fills in.',
    predict: {
      question: 'An iron nail is dropped into blue copper sulphate solution. What happens?',
      options: ['Nothing at all', 'The solution changes colour and the nail gets a coating', 'The nail dissolves completely'],
      answer: 1,
      explain:
        'Iron is more reactive than copper, so it takes copper\'s place in the solution. The blue fades and a brown layer of copper builds up on the nail.',
    },
    // Item ids must match the ones used in data/chemistryRules.js.
    items: [
      { id: 'copper-sulphate-soln', label: 'Copper sulphate', emoji: '🟦', kind: 'liquid', colour: '#2f7fd8' },
      { id: 'iron-sulphate-soln', label: 'Iron sulphate', emoji: '🟩', kind: 'liquid', colour: '#b8d8a0' },
      { id: 'zinc-sulphate-soln', label: 'Zinc sulphate', emoji: '⬜', kind: 'liquid', colour: '#e6edf0' },
      { id: 'zinc-strip', label: 'Zinc', emoji: '🔘', kind: 'solid', colour: '#b8bcc2' },
      { id: 'iron-nail', label: 'Iron nail', emoji: '🔩', kind: 'solid', colour: '#6b6e73' },
      { id: 'copper-strip', label: 'Copper', emoji: '🟠', kind: 'solid', colour: '#b87333' },
    ],
    grid: {
      rows: ['zinc-strip', 'iron-nail', 'copper-strip'],
      cols: ['zinc-sulphate-soln', 'iron-sulphate-soln', 'copper-sulphate-soln'],
    },
    takeaway: 'A more reactive metal displaces a less reactive metal from its solution.',
  },
  'chem-water-acid-reactions': {
    kind: 'lab-bench',
    mode: 'metal-reactions',
    title: 'Metals in water and acid',
    hook: 'Sodium is kept under kerosene. Copper is not. What does sodium do that copper never would?',
    hint:
      'Pour a liquid, add a solid, and watch the bubbles. Hold a burning matchstick at the mouth to test the gas.',
    predict: {
      question: 'Which metal is stored under kerosene to keep it safe: sodium or copper?',
      options: ['Copper, because it is soft', 'Sodium, because it reacts with air and water', 'Both, they are stored the same way'],
      answer: 1,
      explain:
        'Sodium reacts fiercely with water and moisture in the air, so it is kept under kerosene. Copper is calm enough to leave out.',
    },
    // Item ids must match the ones used in data/chemistryRules.js.
    items: [
      { id: 'dilute-hcl', label: 'Dilute acid', emoji: '🧪', kind: 'liquid', colour: '#eaf3f7' },
      { id: 'sodium-hydroxide-soln', label: 'Sodium hydroxide', emoji: '🧴', kind: 'liquid', colour: '#eef0e6' },
      { id: 'water', label: 'Water', emoji: '💧', kind: 'liquid', colour: '#cfe6f2' },
      { id: 'magnesium-ribbon', label: 'Magnesium', emoji: '〰️', kind: 'solid', colour: '#c9ccd1' },
      { id: 'zinc-strip', label: 'Zinc', emoji: '🔘', kind: 'solid', colour: '#b8bcc2' },
      { id: 'iron-nail', label: 'Iron nail', emoji: '🔩', kind: 'solid', colour: '#6b6e73' },
      { id: 'copper-strip', label: 'Copper', emoji: '🟠', kind: 'solid', colour: '#b87333' },
      { id: 'sulphur', label: 'Sulphur', emoji: '🟡', kind: 'solid', colour: '#e6d23a' },
      { id: 'sodium', label: 'Sodium', emoji: '⚪', kind: 'solid', colour: '#d9dde2', float: true },
      { id: 'burning-matchstick', label: 'Burning matchstick', emoji: '🔥', kind: 'tool' },
    ],
    grid: {
      rows: ['magnesium-ribbon', 'zinc-strip', 'iron-nail', 'copper-strip', 'sulphur', 'sodium'],
      cols: ['dilute-hcl', 'sodium-hydroxide-soln', 'water'],
    },
    takeaway:
      'Many metals react with dilute acid to give hydrogen. Non-metals generally do not.',
  },
  'chem-oxygen-reactions': {
    kind: 'lab-bench',
    mode: 'oxides',
    title: 'Burning metals and non-metals',
    hook: 'Magnesium and sulphur both burn with a bright flame. What is left behind turns out to be opposites.',
    hint:
      'Light the burner under magnesium or sulphur. Then dip litmus paper into the oxide solutions and see which way each one turns.',
    predict: {
      question: 'The white ash from burning magnesium is dissolved in water. What does red litmus paper do in it?',
      options: ['It turns blue', 'It stays red', 'It turns white'],
      answer: 0,
      explain:
        'Magnesium oxide dissolves to make a basic solution, and bases turn red litmus blue. Metal oxides are basic.',
    },
    // Item ids must match the ones used in data/chemistryRules.js.
    items: [
      { id: 'magnesium-oxide-soln', label: 'Magnesium oxide in water', emoji: '🥛', kind: 'liquid', colour: '#eceff1' },
      { id: 'sulphur-dioxide-soln', label: 'Sulphur dioxide in water', emoji: '🫗', kind: 'liquid', colour: '#f1f0df' },
      { id: 'water', label: 'Water', emoji: '💧', kind: 'liquid', colour: '#cfe6f2' },
      { id: 'magnesium-ribbon', label: 'Magnesium ribbon', emoji: '〰️', kind: 'solid', colour: '#c9ccd1' },
      { id: 'sulphur', label: 'Sulphur', emoji: '🟡', kind: 'solid', colour: '#e6d23a' },
      { id: 'red-litmus', label: 'Red litmus', emoji: '🟥', kind: 'solid', colour: '#d9503f', paper: true },
      { id: 'blue-litmus', label: 'Blue litmus', emoji: '🟦', kind: 'solid', colour: '#3f6fd9', paper: true },
      { id: 'burner', label: 'Burner', emoji: '🔥', kind: 'tool', condition: 'heated' },
    ],
    grid: {
      rows: ['red-litmus', 'blue-litmus'],
      cols: ['magnesium-oxide-soln', 'sulphur-dioxide-soln', 'water'],
    },
    takeaway: 'Metal oxides are basic. Non-metal oxides are acidic.',
  },
  'chem-coal-formation': {
    kind: 'process-timeline',
    title: '300 million years in one slider',
    hook: 'Coal is not dug up ready-made. It was once a living forest. Drag the handle and watch it happen.',
    hint:
      'Drag the time handle, or press Play. Watch the layers pile up and the pressure and heat climb.',
    predict: {
      question: 'What was coal before it was coal?',
      options: ['Dinosaurs', 'Plants from swampy forests', 'Ordinary rock'],
      answer: 1,
      explain:
        'Coal is mainly made from ancient plants. Dinosaurs lived in the same era, but coal is dead forest, not dinosaur.',
    },
    gauges: [
      { id: 'pressure', label: 'Pressure', low: 'light', high: 'crushing' },
      { id: 'heat', label: 'Heat', low: 'cool', high: 'hot' },
    ],
    stages: [
      {
        id: 'swamp',
        title: 'A swamp forest',
        time: '≈ 300 million years ago',
        body: 'Much of the land was covered in warm, wet swamp forests, full of tall ferns and trees.',
        sky: '#bfe3d0',
        layers: [
          { key: 'rock', colour: '#8a8a8a', h: 40 },
          { key: 'organic', colour: '#5b8a3a', h: 12 },
          { key: 'water', colour: '#4f93b8', h: 22 },
        ],
        gauges: { pressure: 0.05, heat: 0.1 },
        items: [
          { id: 'tree1', emoji: '🌳', x: 110, y: 200, size: 46, rot: 0 },
          { id: 'tree2', emoji: '🌴', x: 235, y: 200, size: 46, rot: 0 },
          { id: 'tree3', emoji: '🌳', x: 355, y: 200, size: 46, rot: 0 },
          { id: 'fern', emoji: '🌿', x: 425, y: 200, size: 30, rot: 0 },
        ],
      },
      {
        id: 'fall',
        title: 'Trees fall into the water',
        time: 'A few years later',
        body: 'Trees and plants died and fell into the swampy water, where they rotted only slowly.',
        sky: '#bfe3d0',
        layers: [
          { key: 'rock', colour: '#8a8a8a', h: 40 },
          { key: 'organic', colour: '#5f7f35', h: 18 },
          { key: 'water', colour: '#4f93b8', h: 24 },
        ],
        gauges: { pressure: 0.05, heat: 0.1 },
        items: [
          { id: 'tree1', emoji: '🌳', x: 130, y: 205, size: 46, rot: 80 },
          { id: 'tree2', emoji: '🌴', x: 235, y: 205, size: 46, rot: -80 },
          { id: 'tree3', emoji: '🌳', x: 345, y: 205, size: 46, rot: 85 },
          { id: 'fern', emoji: '🌿', x: 425, y: 205, size: 30, rot: 70 },
        ],
      },
      {
        id: 'buried',
        title: 'Buried under mud and soil',
        time: 'Thousands of years later',
        body: 'Floods and shifting land buried the dead plants under layers of mud and soil.',
        sky: '#cfe0e6',
        layers: [
          { key: 'rock', colour: '#8a8a8a', h: 40 },
          { key: 'organic', colour: '#6b5a2e', h: 18 },
          { key: 'water', colour: '#4f93b8', h: 8 },
          { key: 'mud', colour: '#a07c52', h: 40 },
        ],
        gauges: { pressure: 0.2, heat: 0.2 },
        items: [],
      },
      {
        id: 'pressure',
        title: 'Layers pile up, pressure builds',
        time: 'Millions of years later',
        body: 'More and more layers piled on top. Their weight pressed down, and deeper down the temperature rose.',
        sky: '#d8e4ea',
        layers: [
          { key: 'rock', colour: '#8a8a8a', h: 40 },
          { key: 'organic', colour: '#5a4527', h: 14 },
          { key: 'mud', colour: '#9a7650', h: 50 },
          { key: 'soil', colour: '#7a5a38', h: 40 },
        ],
        gauges: { pressure: 0.55, heat: 0.5 },
        items: [],
      },
      {
        id: 'peat',
        title: 'The plants turn to peat',
        time: 'Tens of millions of years later',
        body: 'Squeezed and heated for millions of years, the dead plants slowly changed into peat, a soft brown material.',
        sky: '#d8e4ea',
        layers: [
          { key: 'rock', colour: '#8a8a8a', h: 40 },
          { key: 'organic', colour: '#3d2d1a', h: 10 },
          { key: 'mud', colour: '#8f6c48', h: 52 },
          { key: 'soil', colour: '#6e5033', h: 48 },
        ],
        gauges: { pressure: 0.8, heat: 0.75 },
        items: [],
      },
      {
        id: 'coal',
        title: 'A coal seam',
        time: 'Today',
        body: 'With still more pressure and heat, the peat changed into hard black coal. This very slow change is called carbonisation.',
        sky: '#d8e4ea',
        layers: [
          { key: 'rock', colour: '#8a8a8a', h: 40 },
          { key: 'organic', colour: '#161616', h: 6 },
          { key: 'mud', colour: '#7d6a58', h: 54 },
          { key: 'soil', colour: '#625041', h: 52 },
        ],
        gauges: { pressure: 0.95, heat: 0.9 },
        items: [],
      },
      {
        id: 'mine',
        title: 'Mining the coal',
        time: 'Today',
        body: 'People dig down to the coal seam to mine it. A seam that took millions of years to form can be used up far faster than that.',
        sky: '#d8e4ea',
        layers: [
          { key: 'rock', colour: '#8a8a8a', h: 40 },
          { key: 'organic', colour: '#161616', h: 6 },
          { key: 'mud', colour: '#7d6a58', h: 54 },
          { key: 'soil', colour: '#625041', h: 52 },
        ],
        gauges: { pressure: 0.95, heat: 0.9 },
        items: [
          { id: 'ladder', emoji: '🪜', x: 240, y: 205, size: 70, rot: 0, front: true },
          { id: 'pick', emoji: '⛏️', x: 285, y: 238, size: 30, rot: 0, front: true },
        ],
      },
    ],
    takeaway:
      'Coal formed from buried plants under heat and pressure over millions of years. This process is carbonisation.',
  },
};

/**
 * Teaching content, keyed by lesson id.
 *
 * Kept separate from WIDGET_BLOCKS because the two are read by different
 * things: the widget config is handed to the engine component, while this is
 * page prose. A lesson can have either, both, or neither.
 *
 * Same shape as physics: `summary`, `sections` (heading, body[], optional
 * formula / formulaNote / after[]), `examples`, `misconception`, `recap`.
 * Chemistry uses word equations in `formula` (never symbol equations as a
 * requirement), e.g. 'iron + copper sulphate → iron sulphate + copper'.
 */
export const LESSON_CONTENT = {
  'chem-exceptions': {
    summary:
      'Metals are usually hard, shiny and good conductors, and non-metals usually are not. Usually. A handful of elements break the rules, and they are the ones worth remembering.',
    sections: [
      {
        heading: 'The rules, and why they are only mostly right',
        body: [
          'In the last lesson you tested metals for lustre, hardness, malleability, ductility, sonority and conductivity. Most metals pass all six. Most non-metals fail most of them.',
          'But "most" is not "all". When two groups are sorted by properties, a few members always sit awkwardly on the line, and exam questions love them.',
        ],
      },
      {
        heading: 'Metals that break the rules',
        body: [
          'Sodium and potassium are soft enough to slice with a knife, yet they are metals: freshly cut, they shine, and they conduct electricity.',
          'Mercury is the only common metal that is a liquid at room temperature. It is shiny and conducts well, which is why it was used in old thermometers.',
        ],
      },
      {
        heading: 'Non-metals that break the rules',
        body: [
          'Graphite, the pencil lead, is a form of carbon. Carbon is a non-metal, yet graphite conducts electricity. Diamond is another form of carbon, and it does not conduct at all.',
          'Iodine forms shiny, grey-purple crystals. Lustre usually points to a metal, but iodine is brittle and a poor conductor, so it is a non-metal.',
        ],
      },
      {
        heading: 'How to decide when the rules disagree',
        body: [
          'Do not judge by a single property. Hardness alone does not make a metal (diamond is hard, sodium is soft), and neither does shine (iodine is shiny).',
          'Look at several properties together: lustre, malleability, ductility and conductivity. Metals are the elements that pass most of these tests.',
        ],
      },
    ],
    misconception: {
      heading: 'The trap',
      body: 'Not all metals are hard solids, and not every non-metal is a poor conductor. One property never settles it. Check several before you decide.',
    },
    recap: [
      'Metals are usually lustrous, malleable, ductile, sonorous and good conductors.',
      'Sodium and potassium are metals that are soft enough to cut with a knife.',
      'Mercury is the common metal that is a liquid at room temperature.',
      'Graphite is a non-metal that conducts electricity.',
      'Iodine is a shiny non-metal. Judge by several properties, never one.',
    ],
  },
  'chem-tester': {
    summary:
      'Before you can ask which liquids conduct, you need a tool that tells you whether current flows at all. A battery, a bulb and two bare wire ends are enough.',
    sections: [
      {
        heading: 'How the tester works',
        body: [
          'A battery, a bulb and two wires make a circuit with a gap in it. While the gap is open, no current can flow and the bulb stays dark.',
          'Touch the two wire ends together and the gap is closed: current flows round the loop and the bulb glows. The tester is now ready to ask a question.',
        ],
      },
      {
        heading: 'Testing a material',
        body: [
          'Put a material across the gap, so the current has to pass through it to complete the loop. If the bulb glows, the material lets current through: it is a conductor. If it stays dark, the material is an insulator.',
          'A key and a coin light the bulb. An eraser and a wooden ruler do not. Pencil lead, which is graphite, also conducts, though less strongly, so the bulb is dim.',
        ],
      },
      {
        heading: 'A dark bulb does not always mean zero current',
        body: [
          'A bulb needs a fairly strong current before the filament glows. A weak current can flow and leave it dark.',
          'An LED glows with a much smaller current, and a compass needle deflects with a smaller current still, because any current makes a magnetic field around the wire. Switch indicators and test tap water to see all three disagree.',
        ],
      },
    ],
    misconception: {
      heading: 'The trap',
      body: 'If the bulb does not glow, that does not prove no current flows. It may just be too weak for a bulb to show. A more sensitive indicator can still detect it.',
    },
    recap: [
      'A tester is a battery, a bulb and two bare wire ends with a gap between them.',
      'Touching the ends together closes the circuit and the bulb glows.',
      'A material that lights the bulb is a conductor. One that does not is an insulator.',
      'A bulb needs a strong current. An LED or a compass can show a weaker one.',
    ],
  },
  'chem-uses': {
    summary:
      'Nobody picks a material at random. Copper carries your electricity, aluminium wraps your lunch and iron holds up a bridge, each because of one property it happens to have.',
    sections: [
      {
        heading: 'Start from the job, not the material',
        body: [
          'Ask what the job needs. A wire has to carry current and be drawn out thin, so it needs a ductile conductor. Foil has to be beaten flat without cracking, so it needs a malleable metal.',
          'Once you know the property the job needs, the material almost chooses itself.',
        ],
      },
      {
        heading: 'Metals at work',
        body: [
          'Copper is a good conductor and ductile, so it makes household wiring. Aluminium is malleable and light, so it is rolled into foil. Iron and steel are hard and strong, so they become railings, girders and tools. Gold is lustrous and malleable, so it is used in jewellery.',
        ],
      },
      {
        heading: 'Non-metals at work',
        body: [
          'Most non-metals are chosen for what they do chemically, not for how they look. Oxygen supports breathing, so hospitals keep it in cylinders. Chlorine kills germs in drinking water. Iodine dissolved in alcohol is an antiseptic for cuts. Nitrogen and phosphorus are nutrients that plants need, so they go into fertilisers.',
        ],
      },
    ],
    misconception: {
      heading: 'The trap',
      body: 'Strength is not the only reason to choose a metal. Check which property the job really needs: conducting for wire, malleability for foil, strength for railings.',
    },
    recap: [
      'Every use of a material follows from one of its properties.',
      'Copper wire needs a conductor that is ductile.',
      'Foil needs a malleable metal. Railings need a hard, strong one.',
      'Non-metals such as oxygen, chlorine and iodine are used for their chemical behaviour.',
    ],
  },
  'chem-resources': {
    summary:
      'Some resources refill as fast as we use them. Others took millions of years to form and will not come back in our lifetime. Telling them apart is the first step to using fuel wisely.',
    sections: [
      {
        heading: 'Resources that refill',
        body: [
          'Sunlight and air are inexhaustible: using them does not reduce what is left. Wind and ocean waves are similar. They keep arriving whatever we do.',
        ],
      },
      {
        heading: 'Resources that run out',
        body: [
          'Coal, petroleum and natural gas are exhaustible. Each stock was built up over millions of years, and we burn it far faster than it forms. Once a heap is gone, it is gone for any human timescale.',
          'Fuels made from them, such as diesel and LPG, run out with them. Minerals such as iron ore are dug up and cannot be replaced either.',
        ],
      },
      {
        heading: 'Why this matters',
        body: [
          'If a resource can run out, using less of it makes it last longer. That is why the later lessons look at how coal and petroleum form, how they are processed, and how to save them.',
        ],
      },
    ],
    misconception: {
      heading: 'The trap',
      body: 'New coal and oil are indeed forming, but over millions of years. For us they are used up, not renewed, so we cannot rely on them lasting.',
    },
    recap: [
      'Inexhaustible resources, such as sunlight and air, are not used up by our use.',
      'Exhaustible resources, such as coal, petroleum and natural gas, can run out.',
      'Fossil fuels take millions of years to form.',
      'Fuels made from petroleum, such as diesel and LPG, are exhaustible too.',
    ],
  },
  'chem-electroplating-uses': {
    summary:
      'A layer of one metal, thinner than a hair, can stop a gate rusting, make a tap shine or make cheap jewellery look expensive. Electroplating puts it there.',
    sections: [
      {
        heading: 'What plating is for',
        body: [
          'Electroplating deposits a thin layer of one metal on another using electric current. The layer does one of three jobs: it protects the metal underneath, it makes the object look better, or it saves a costly metal by using only a thin coating of it.',
        ],
      },
      {
        heading: 'Protecting and beautifying',
        body: [
          'Chromium is hard and bright, so taps, handlebars and trim are chromium plated. Tin is less reactive than iron, so tin-coated cans keep food safe. Zinc coats iron to stop it rusting, which is called galvanising.',
          'Gold and silver plating gives cheaper metal the look of the real thing, at a fraction of the cost.',
        ],
      },
      {
        heading: 'A note on waste',
        body: [
          'The solution left over in a plating factory contains dissolved metal salts that can poison water and soil. It must be treated and disposed of safely, never poured down a drain.',
        ],
      },
    ],
    misconception: {
      heading: 'The trap',
      body: 'Electroplating is not painting. Metal particles travel through the solution and settle on the object, so the coating is metal all the way through.',
    },
    recap: [
      'Electroplating coats one metal with a thin layer of another using electricity.',
      'Chromium gives a hard, shiny finish. Tin keeps food cans safe. Zinc stops iron rusting.',
      'Gold and silver plating saves costly metal.',
      'Waste plating solution must be disposed of safely.',
    ],
  },
  'chem-displacement': {
    summary:
      'Put a metal into the solution of another metal and one of two things happens: it pushes the other metal out, or nothing at all. Which one depends on which metal is more reactive.',
    sections: [
      {
        heading: 'A metal can push another metal out',
        body: [
          'When an iron nail goes into blue copper sulphate solution, the blue slowly fades and the nail gains a brown coating. The coating is copper. Iron has taken copper\'s place in the solution, and the copper has been pushed out onto the nail.',
          'This is called a displacement reaction. The more reactive metal displaces the less reactive one.',
        ],
        formula: 'iron + copper sulphate → iron sulphate + copper',
        formulaNote: 'A word equation: what goes in on the left, what comes out on the right.',
      },
      {
        heading: 'It only works one way round',
        body: [
          'Put a copper strip into iron sulphate solution and nothing happens. Copper is less reactive than iron, so it cannot push iron out.',
          'Reactivity is a ranking, and displacement always goes down it: a metal can only displace metals below it.',
        ],
      },
      {
        heading: 'Building the ladder',
        body: [
          'Try all nine combinations of zinc, iron and copper with their three sulphate solutions. Zinc displaces both iron and copper, iron displaces only copper, and copper displaces neither.',
          'That gives the reactivity ladder: zinc is above iron, and iron is above copper.',
        ],
        formula: 'zinc  >  iron  >  copper',
        formulaNote: 'Most reactive on the left, least reactive on the right.',
      },
    ],
    misconception: {
      heading: 'The trap',
      body: 'Any metal cannot push out any other metal. Only a more reactive metal displaces a less reactive one, so always check which is higher on the ladder first.',
    },
    recap: [
      'A more reactive metal displaces a less reactive metal from its solution.',
      'Iron in copper sulphate: the blue fades and copper coats the nail.',
      'A less reactive metal cannot displace a more reactive one, so nothing happens.',
      'The nine results rank the metals: zinc, then iron, then copper.',
    ],
  },
  'chem-water-acid-reactions': {
    summary:
      'Some metals fizz in acid, one catches fire on water, and some do nothing at all. How fast the bubbles come tells you how reactive a metal is.',
    sections: [
      {
        heading: 'A metal that reacts with water',
        body: [
          'Sodium skates across the surface of water, fizzing, and can catch fire. It reacts so fiercely that it is stored under kerosene, away from air and moisture. This is a watch-only experiment: never try it yourself.',
          'Phosphorus is a non-metal that catches fire on its own in air, so it is stored under water instead.',
        ],
      },
      {
        heading: 'Metals and dilute acid',
        body: [
          'Magnesium, zinc and iron all bubble in dilute hydrochloric acid. The bubbles are hydrogen gas. Magnesium fizzes fastest, zinc steadily and iron slowly, which matches their order on the reactivity ladder.',
          'Copper does nothing in dilute acid, because it is less reactive than all three.',
        ],
        formula: 'metal + dilute acid → salt + hydrogen',
        formulaNote: 'For zinc and hydrochloric acid the salt is zinc chloride.',
      },
      {
        heading: 'The pop test for hydrogen',
        body: [
          'Hold a burning matchstick at the mouth of the tube where the metal is bubbling. Hydrogen burns with a squeaky pop. That sound is how you know the gas is hydrogen.',
          'Try the same test with copper in acid. There is no gas, so there is no pop.',
        ],
      },
      {
        heading: 'Non-metals, and a surprise from zinc',
        body: [
          'Non-metals such as sulphur and carbon generally do not react with dilute acid.',
          'Zinc is unusual: it also gives off hydrogen in sodium hydroxide solution, which is a base, not an acid.',
        ],
      },
    ],
    misconception: {
      heading: 'The trap',
      body: 'Not every metal reacts with acid, and no bubbles is a real result, not a failed experiment. Copper does nothing in dilute acid, and that tells you where it sits on the ladder.',
    },
    recap: [
      'Sodium reacts fiercely with water, so it is stored under kerosene.',
      'Magnesium, zinc and iron react with dilute acid to give hydrogen. Copper does not.',
      'Hydrogen burns with a squeaky pop. That is the test for it.',
      'Non-metals generally do not react with dilute acid.',
    ],
  },
  'chem-oxygen-reactions': {
    summary:
      'Burn a metal and a non-metal in air and each makes an oxide. Dissolve the two oxides in water and they behave as opposites, which litmus paper makes easy to see.',
    sections: [
      {
        heading: 'Burning a metal',
        body: [
          'Magnesium ribbon burns with a dazzling white flame and leaves a white ash. The ash is magnesium oxide, made when magnesium combines with oxygen from the air. This is a watch-only experiment, and burning magnesium is so bright that you should never look straight at it.',
        ],
        formula: 'magnesium + oxygen → magnesium oxide',
        formulaNote: 'A metal burning in oxygen gives a metal oxide.',
      },
      {
        heading: 'Burning a non-metal',
        body: [
          'Sulphur burns with a pale blue flame and gives off a sharp, choking gas called sulphur dioxide. It is another oxide, this time of a non-metal, and it is another watch-only experiment.',
        ],
        formula: 'sulphur + oxygen → sulphur dioxide',
        formulaNote: 'A non-metal burning in oxygen gives a non-metal oxide.',
      },
      {
        heading: 'Litmus tells them apart',
        body: [
          'Litmus paper comes in two colours. Acids turn blue litmus red, and bases turn red litmus blue. A neutral liquid such as water changes neither.',
          'Dissolve magnesium oxide in water and red litmus turns blue: it is basic. Dissolve sulphur dioxide in water and blue litmus turns red: it is acidic.',
        ],
      },
      {
        heading: 'The pattern',
        body: [
          'Metal oxides are basic. Non-metal oxides are acidic. Now you can predict the result for other elements before you test them.',
        ],
      },
    ],
    misconception: {
      heading: 'The trap',
      body: 'Both burn with a bright flame and both make an oxide, but the oxides are opposites once dissolved in water. A bright flame tells you nothing about which kind you have. The litmus test does.',
    },
    recap: [
      'Metals burn in oxygen to make metal oxides. Non-metals make non-metal oxides.',
      'Magnesium burns with a dazzling white flame. Sulphur burns with a pale blue one.',
      'Acids turn blue litmus red. Bases turn red litmus blue. Water changes neither.',
      'Metal oxides are basic. Non-metal oxides are acidic.',
    ],
  },
  'chem-coal-formation': {
    summary:
      'Coal is a forest that was buried and slowly changed. It took millions of years, which is why it cannot be replaced once it is used.',
    sections: [
      {
        heading: 'It starts as a living forest',
        body: [
          'About 300 million years ago, large parts of the land were swamp forests. Trees, ferns and other plants grew thickly, died, and fell into the wet ground.',
          'In swampy water there is little air, so the dead plants rotted away only slowly instead of vanishing.',
        ],
      },
      {
        heading: 'Buried, squeezed and heated',
        body: [
          'Floods and shifting land covered the dead plants with mud and soil. Over time, layer after layer piled on top.',
          'The deeper the plants were buried, the greater the pressure and the temperature around them. Both kept rising for millions of years.',
        ],
      },
      {
        heading: 'From plants to peat to coal',
        body: [
          'First the buried plants changed into peat, a soft brown material. With more pressure and heat, peat slowly changed into hard, black coal.',
          'This very slow change of dead plants into coal is called carbonisation.',
        ],
        formula: 'dead plants → peat → coal',
        formulaNote: 'Each step takes millions of years, under rising pressure and heat.',
      },
      {
        heading: 'Why it matters',
        body: [
          'We dig coal up in a few decades from a seam that took millions of years to form. New coal is forming, but far too slowly to replace what we use.',
        ],
      },
    ],
    misconception: {
      heading: 'The trap',
      body: 'Coal does not come from dinosaurs. It is made mainly from ancient plants. Dinosaurs lived in the same long span of time, but coal is a buried forest.',
    },
    recap: [
      'Coal formed from dead plants in swamp forests, about 300 million years ago.',
      'Layers of mud and soil buried them, and pressure and heat kept rising.',
      'Dead plants changed into peat, and peat changed into coal.',
      'This slow process is called carbonisation. It takes millions of years.',
    ],
  },
};

export const isReady = (id) => Boolean(WIDGET_BLOCKS[id]);

/** Every lesson in syllabus order, each tagged with its module and position. */
function flatLessons() {
  return CHEMISTRY_8.modules.flatMap((mod) =>
    mod.lessons.map((lesson, i) => ({
      ...lesson,
      number: i + 1,
      ready: isReady(lesson.id),
      module: { id: mod.id, title: mod.title, emoji: mod.emoji },
    }))
  );
}

/**
 * Everything the experiment page needs for one lesson id, or null.
 *
 * `prev`/`next` step through *every* lesson rather than only the playable
 * ones; each neighbour carries a `ready` flag so the page can render the
 * unbuilt ones as disabled signposts.
 */
export function getExperiment(id) {
  const all = flatLessons();
  const at = all.findIndex((l) => l.id === id);
  if (at === -1) return null;

  const me = all[at];
  const mod = CHEMISTRY_8.modules.find((m) => m.id === me.module.id);

  return {
    ...me,
    block: WIDGET_BLOCKS[id] || null,
    content: LESSON_CONTENT[id] || null,
    // Sibling lessons in this module, for the in-page contents rail.
    moduleLessons: mod.lessons.map((l, i) => ({
      ...l,
      number: i + 1,
      ready: isReady(l.id),
      current: l.id === id,
    })),
    position: { index: at + 1, total: all.length },
    prev: at > 0 ? all[at - 1] : null,
    next: at < all.length - 1 ? all[at + 1] : null,
  };
}

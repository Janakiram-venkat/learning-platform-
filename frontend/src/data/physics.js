// Class 8 physics syllabus for the Physics course.
// The lesson list is generated from docs/science/physics-blueprint.md.
//
// To make a lesson playable: add its widget block to WIDGET_BLOCKS below
// (key = lesson id). Lessons without a block show as "Soon" on the hub.
export const PHYSICS_8 = {
  "subject": "physics",
  "classLevel": 8,
  "title": "Physics",
  "modules": [
    {
      "id": 1,
      "title": "Force and Pressure",
      "emoji": "💪",
      "lessons": [
        {
          "id": "phy-force-push-pull",
          "title": "What is a force?",
          "engine": "force-arena"
        },
        {
          "id": "phy-force-effects",
          "title": "What a force can do",
          "engine": "force-arena"
        },
        {
          "id": "phy-force-types",
          "title": "Contact and non-contact forces",
          "engine": "classify"
        },
        {
          "id": "phy-pressure",
          "title": "Pressure = force ÷ area",
          "engine": "force-arena"
        },
        {
          "id": "phy-pressure-fluids",
          "title": "Pressure in liquids and gases",
          "engine": "particle-box"
        },
        {
          "id": "phy-atmospheric-pressure",
          "title": "The weight of air above you",
          "engine": "particle-box"
        }
      ]
    },
    {
      "id": 2,
      "title": "Friction",
      "emoji": "🧱",
      "lessons": [
        {
          "id": "phy-friction-cause",
          "title": "Why surfaces grip",
          "engine": "zoom-lens"
        },
        {
          "id": "phy-friction-types",
          "title": "Static, sliding, rolling",
          "engine": "force-arena"
        },
        {
          "id": "phy-friction-good-bad",
          "title": "Friend and foe",
          "engine": "sort-bins"
        },
        {
          "id": "phy-friction-control",
          "title": "Increasing and reducing friction",
          "engine": "force-arena"
        },
        {
          "id": "phy-fluid-friction",
          "title": "Drag in air and water",
          "engine": "particle-box"
        }
      ]
    },
    {
      "id": 3,
      "title": "Sound",
      "emoji": "🔊",
      "lessons": [
        {
          "id": "phy-sound-vibration",
          "title": "Every sound is a vibration",
          "engine": "wave-scope"
        },
        {
          "id": "phy-sound-medium",
          "title": "Sound needs something to travel through",
          "engine": "particle-box"
        },
        {
          "id": "phy-sound-properties",
          "title": "Amplitude, frequency, loudness, pitch",
          "engine": "wave-scope"
        },
        {
          "id": "phy-human-voice",
          "title": "The voice box",
          "engine": "explorer-diagram"
        },
        {
          "id": "phy-human-ear",
          "title": "How you hear",
          "engine": "explorer-diagram"
        },
        {
          "id": "phy-noise-pollution",
          "title": "Noise and how to cut it",
          "engine": "wave-scope"
        }
      ]
    },
    {
      "id": 4,
      "title": "Light",
      "emoji": "🔦",
      "lessons": [
        {
          "id": "phy-light-reflection",
          "title": "Light bounces",
          "engine": "ray-bench"
        },
        {
          "id": "phy-reflection-laws",
          "title": "The laws of reflection",
          "engine": "ray-bench"
        },
        {
          "id": "phy-regular-diffused",
          "title": "Regular vs diffused reflection",
          "engine": "ray-bench"
        },
        {
          "id": "phy-multiple-reflections",
          "title": "Mirrors facing mirrors",
          "engine": "ray-bench"
        },
        {
          "id": "phy-dispersion",
          "title": "White light is many colours",
          "engine": "ray-bench"
        },
        {
          "id": "phy-human-eye",
          "title": "The eye and how to care for it",
          "engine": "explorer-diagram"
        }
      ]
    },
    {
      "id": 5,
      "title": "Some Natural Phenomena",
      "emoji": "⚡",
      "lessons": [
        {
          "id": "phy-charges-rubbing",
          "title": "Charging by rubbing",
          "engine": "particle-box"
        },
        {
          "id": "phy-like-unlike",
          "title": "Repel and attract",
          "engine": "force-arena"
        },
        {
          "id": "phy-electroscope-earthing",
          "title": "Detecting and draining charge",
          "engine": "explorer-diagram"
        },
        {
          "id": "phy-lightning",
          "title": "Lightning and staying safe",
          "engine": "particle-box"
        },
        {
          "id": "phy-earthquakes",
          "title": "When the ground shakes",
          "engine": "process-timeline"
        }
      ]
    },
    {
      "id": 6,
      "title": "Stars and the Solar System",
      "emoji": "🌙",
      "lessons": [
        {
          "id": "phy-moon-phases",
          "title": "Why the Moon changes shape",
          "engine": "orrery"
        },
        {
          "id": "phy-moon-surface",
          "title": "The Moon up close",
          "engine": "orrery"
        },
        {
          "id": "phy-stars",
          "title": "Stars and the light year",
          "engine": "orrery"
        },
        {
          "id": "phy-constellations",
          "title": "Patterns in the sky",
          "engine": "orrery"
        },
        {
          "id": "phy-solar-system",
          "title": "The Sun's family",
          "engine": "orrery"
        },
        {
          "id": "phy-satellites",
          "title": "Natural and artificial satellites",
          "engine": "orrery"
        }
      ]
    }
  ]
};

export const WIDGET_BLOCKS = {
  'phy-pressure': {
    kind: 'force-arena',
    mode: 'pressure',
    title: 'Same brick, different dent',
    hook: 'Why does a sharp knife cut better than a blunt one?',
    hint: 'Pick a face or drag the sliders. The dent follows the pressure, not the force.',
    object: { name: 'Brick', weightN: 30 },
    faces: [
      { label: 'Flat', areaCm2: 300 },
      { label: 'Side', areaCm2: 150 },
      { label: 'End', areaCm2: 75 },
    ],
    surface: 'sand',
    predict: {
      question: 'A brick is placed on sand flat, then on its side, then on its end. Which way makes the deepest dent?',
      options: ['Flat', 'Side', 'End'],
      answer: 2,
      explain:
        'The weight is the same every time. Standing on its end, that weight is spread over the smallest area, so the pressure is highest.',
    },
    presets: [
      { id: 'knife', label: 'Knife edge', forceN: 20, areaCm2: 0.2 },
      { id: 'strap-thin', label: 'Thin strap', forceN: 60, areaCm2: 6 },
      { id: 'strap-wide', label: 'Wide strap', forceN: 60, areaCm2: 60 },
      { id: 'pin-tip', label: 'Pin tip', forceN: 10, areaCm2: 0.01 },
      { id: 'pin-head', label: 'Pin head', forceN: 10, areaCm2: 1 },
    ],
    // Landmarks for the widget's pressure scale. Without these the readout is
    // a number with no meaning; with them a student can see that a stiletto
    // heel really does out-press an elephant.
    scale: [
      { label: 'Snowshoe', pa: 2e3 },
      { label: 'You standing', pa: 1.5e4 },
      { label: 'Elephant foot', pa: 1.25e5 },
      { label: 'Car tyre', pa: 2.2e5 },
      { label: 'Stiletto heel', pa: 4e6 },
      { label: 'Drawing pin', pa: 1e8 },
    ],
    takeaway: 'Pressure = Force ÷ Area. Its unit is the pascal (Pa), which is N/m². The same force on a smaller area means more pressure.',
  },
};

/**
 * Teaching content, keyed by lesson id.
 *
 * Kept separate from WIDGET_BLOCKS because the two are read by different
 * things: the widget config is handed to the engine component, while this is
 * page prose. A lesson can have either, both, or neither.
 *
 * `sections` render in order as headed prose. `examples` become a worked
 * comparison table, `misconception` a flagged warning card, and `recap` the
 * closing checklist.
 */
export const LESSON_CONTENT = {
  'phy-pressure': {
    summary:
      'A force spread over a wide area barely leaves a mark. The very same force squeezed onto a tiny area can slice, pierce or sink. That difference has a name: pressure.',
    sections: [
      {
        heading: 'Force alone does not tell you what happens',
        body: [
          'Press your thumb into your palm as hard as you can. It hurts a little, and nothing breaks. Now imagine pressing a drawing pin into your palm with exactly the same push. You would not do it twice.',
          'The force is identical in both cases. What changed is how much skin that force had to share itself across. Your thumb spreads it over a couple of square centimetres. The pin concentrates all of it onto a speck.',
          'So "how hard did you push?" is only half the question. The other half is "how big was the contact patch?"',
        ],
      },
      {
        heading: 'Pressure = force ÷ area',
        body: [
          'Pressure is the amount of force acting on each unit of area. Divide the force by the area it is pressing on and you get it:',
        ],
        formula: 'P  =  F  ÷  A',
        formulaNote: 'P is pressure, F is the force in newtons (N), A is the contact area in square metres (m²).',
        after: [
          'The unit of pressure is the pascal, written Pa. One pascal is one newton spread over one square metre, so 1 Pa = 1 N/m². A pascal is tiny: a sheet of paper resting on a table presses with roughly 1 Pa. Real answers usually come out in kilopascals (kPa, thousands) or megapascals (MPa, millions).',
        ],
      },
      {
        heading: 'Watch the units, this is where marks get lost',
        body: [
          'Areas in everyday life get measured in square centimetres, but the pascal is defined using square metres. Mixing them up is the single most common mistake in this topic.',
          'A square metre is 100 cm by 100 cm, so it holds 100 × 100 = 10,000 square centimetres.',
        ],
        formula: '1 m²  =  10,000 cm²',
        formulaNote: 'To go from cm² to m², divide by 10,000. So 300 cm² = 0.03 m².',
        after: [
          'If your answer comes out ten thousand times too small, you almost certainly forgot this step.',
        ],
      },
      {
        heading: 'Making pressure bigger on purpose',
        body: [
          'Sometimes you want a huge pressure from a modest force, so you shrink the area until the force has nowhere to spread.',
          'A knife is sharpened to an edge only a few atoms thick. A drawing pin ends in a point. A nail, an ice skate, a syringe needle and a bird\'s beak all do the same trick: keep the force, shrink the area, and the pressure climbs until something gives way.',
        ],
      },
      {
        heading: 'Making pressure smaller on purpose',
        body: [
          'Just as often you want the opposite. The weight is fixed and you need it to stop sinking, digging in or hurting.',
          'Snowshoes spread a walker over enough snow that they stay on the surface. A camel\'s wide foot does the same across sand. Tractors run fat tyres so they do not sink into a field, and a heavy rucksack uses broad padded straps rather than thin cords so your shoulders survive the walk.',
          'None of these reduce the weight by even a gram. They only give it more room.',
        ],
      },
    ],
    examples: {
      heading: 'Worked example: who presses harder?',
      intro:
        'A 40 kg student weighs about 400 N. An adult elephant weighs about 50,000 N. Surely the elephant wins? Work out the pressure and see.',
      rows: [
        {
          label: 'Student, both feet flat',
          force: '400 N',
          area: '300 cm² = 0.03 m²',
          working: '400 ÷ 0.03',
          result: '≈ 13 kPa',
        },
        {
          label: 'Elephant, all four feet',
          force: '50,000 N',
          area: '4,000 cm² = 0.4 m²',
          working: '50,000 ÷ 0.4',
          result: '≈ 125 kPa',
        },
        {
          label: 'Student, one stiletto heel',
          force: '400 N',
          area: '1 cm² = 0.0001 m²',
          working: '400 ÷ 0.0001',
          result: '≈ 4,000 kPa',
          highlight: true,
        },
      ],
      outro:
        'The student on one narrow heel presses about thirty times harder than the elephant does. That is why stilettos dent wooden floors and elephants do not.',
    },
    misconception: {
      heading: 'The trap',
      body: 'Heavier does not automatically mean more pressure. If the area grows faster than the weight does, the pressure actually falls. Always divide before you decide.',
    },
    recap: [
      'Pressure is force divided by the area it acts on.',
      'Its unit is the pascal: 1 Pa = 1 N/m².',
      'Convert cm² to m² by dividing by 10,000.',
      'Same force + smaller area = more pressure. That is how blades and pins work.',
      'Same force + bigger area = less pressure. That is how snowshoes and wide straps work.',
    ],
  },
};

export const isReady = (id) => Boolean(WIDGET_BLOCKS[id]);

/** Every lesson in syllabus order, each tagged with its module and position. */
function flatLessons() {
  return PHYSICS_8.modules.flatMap((mod) =>
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
 * ones. Walking just the built lessons used to leave the single finished
 * experiment with no neighbours at all, so the page offered no way onward;
 * each neighbour carries a `ready` flag instead and the page renders the
 * unbuilt ones as disabled signposts.
 */
export function getExperiment(id) {
  const all = flatLessons();
  const at = all.findIndex((l) => l.id === id);
  if (at === -1) return null;

  const me = all[at];
  const mod = PHYSICS_8.modules.find((m) => m.id === me.module.id);

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

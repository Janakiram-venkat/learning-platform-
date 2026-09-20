// Class 8 physics syllabus for the Virtual Lab.
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
    hint: 'Pick a face or drag the sliders. The dent follows the pressure.',
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
    takeaway: 'Pressure = Force ÷ Area. Its unit is the pascal (Pa), which is N/m². The same force on a smaller area means more pressure.',
  },
};

export const isReady = (id) => Boolean(WIDGET_BLOCKS[id]);

/** Everything the experiment page needs for one lesson id, or null. */
export function getExperiment(id) {
  for (const mod of PHYSICS_8.modules) {
    const index = mod.lessons.findIndex((l) => l.id === id);
    if (index === -1) continue;
    const ready = mod.lessons.filter((l) => isReady(l.id));
    const at = ready.findIndex((l) => l.id === id);
    return {
      ...mod.lessons[index],
      number: index + 1,
      module: { id: mod.id, title: mod.title, emoji: mod.emoji },
      block: WIDGET_BLOCKS[id] || null,
      prev: at > 0 ? ready[at - 1] : null,
      next: at !== -1 && at < ready.length - 1 ? ready[at + 1] : null,
    };
  }
  return null;
}

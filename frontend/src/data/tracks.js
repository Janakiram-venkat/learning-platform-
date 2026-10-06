/* ---------------------------------------------------------------------------
   Pocket Lab — the track catalogue.
   One list, shared by the Courses page cards and the bench finder quiz, so a
   new subject only ever has to be described once.

   `led` is the accent that runs a card's hairline and icon well; `tagline` is
   the short violet caption above the prose; `soon` marks a track whose content
   isn't built yet (dead panel, and the finder never recommends it); `courseId`
   is set only on gated tracks, which read their lock state from the API.

   `traits` is what the finder scores against. Keys are the answer tags used by
   the questions in components/course/BenchFinder.jsx, values are how strongly
   this track matches that tag (1 = a little, 3 = this is the one). A track with
   no traits simply never wins, which is the right default for a new stub.
--------------------------------------------------------------------------- */

export const TRACKS = [
  {
    ref: 'TRK-PY', title: 'Python', tagline: 'Where every maker starts',
    line: 'Beginner friendly',
    desc: 'Master the language behind games, AI, and the web, one puzzle at a time.',
    status: 'READY', led: '#FFB40A', to: '/course/python/lesson/intro',
    traits: { code: 3, puzzles: 3, brandNew: 3, foundation: 3, ai: 1, games: 1 },
  },
  {
    ref: 'TRK-JAVA', title: 'Java', tagline: 'Strict, and worth it',
    line: 'Beginner friendly',
    desc: 'The language behind Android, Minecraft and half the world’s servers. Compile it, run it, build real programs with it.',
    status: 'NEW', led: '#E76F00', to: '/course/java/lesson/java_intro',
    traits: { code: 3, foundation: 2, puzzles: 2, games: 1, machines: 1 },
  },
  {
    ref: 'TRK-AI', title: 'AI & Machine Learning', tagline: 'Teach a machine to see',
    line: 'Explorer',
    desc: 'Train smart models, show them examples, then ask them to guess. AI you can actually poke at.',
    status: 'READY', led: '#0097F8', to: '/course/ai/lesson/intro',
    traits: { ai: 3, data: 3, puzzles: 2, someCode: 2, science: 1 },
  },
  {
    ref: 'TRK-WEB', title: 'Web Development', tagline: 'Pages that talk back',
    line: 'Beginner friendly',
    desc: 'Build real webpages with HTML, CSS and JavaScript. Every change refreshes live in the preview.',
    status: 'NEW', led: '#BD16BB', to: '/course/webdev/lesson/wd1-intro',
    traits: { web: 3, design: 3, share: 3, brandNew: 2, code: 1 },
  },
  {
    ref: 'TRK-GAME', title: 'Game Development', tagline: 'Make it move, then win',
    line: 'After Python 1–5',
    desc: 'Falling fruit, dodging balls, and a score to beat. Real physics, real loops, real games.',
    status: 'READY', led: '#E63C22', to: '/course/gamedev/games',
    // Gated: the card and the finder read its lock state from gamedev/course.json.
    courseId: 'gamedev',
    traits: { games: 3, motion: 2, design: 1, someCode: 2, code: 1 },
  },
  {
    ref: 'TRK-BOT', title: 'Robotics', tagline: 'Sense, think, act',
    line: 'No electronics needed',
    desc: 'Meet the machines that see the world and move through it. Build your own from parts, on screen.',
    status: 'READY', led: '#00C48C', to: '/course/robotics/lesson/robot-intro',
    traits: { robots: 3, motion: 3, machines: 3, science: 1, someCode: 1 },
  },
  {
    ref: 'TRK-PHY', title: 'Physics', tagline: 'Poke it and find out',
    line: 'Class 8 · no code needed',
    desc: 'Push, pull, bounce and shake. Drag the sliders, run the experiment, and watch the rule fall out of it.',
    status: 'NEW', led: '#0097F8', to: '/course/physics',
    traits: { science: 3, noCode: 3, motion: 2, machines: 1 },
  },
  {
    ref: 'TRK-CHEM', title: 'Chemistry', tagline: 'On the workbench',
    line: 'Wiring soon',
    desc: 'Mix virtual reagents, watch reactions run, and build molecules atom by atom.',
    soon: true,
  },
  {
    ref: 'TRK-BIO', title: 'Biology', tagline: 'On the workbench',
    line: 'Wiring soon',
    desc: 'Zoom into a cell, trace what keeps a body running, and see the small machines up close.',
    soon: true,
  },
];

/** The tracks the finder is allowed to recommend: built, and actually scored. */
export const FINDER_TRACKS = TRACKS.filter((t) => !t.soon && t.traits);

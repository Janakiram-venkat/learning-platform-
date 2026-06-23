// Topics a student can pick during sign-up. `key` is what we persist to the
// backend; `emoji` + `gradient` drive the playful card UI. Keep keys stable —
// they're stored on the user record and used to personalise their path.
export const INTERESTS = [
  { key: 'programming', label: 'Programming',   emoji: '💻', gradient: 'from-purple-500 to-violet-600' },
  { key: 'game-dev',    label: 'Game Dev',      emoji: '🎮', gradient: 'from-fuchsia-500 to-pink-600' },
  { key: 'ai',          label: 'Artificial Intelligence', emoji: '🤖', gradient: 'from-teal-400 to-cyan-600' },
  { key: 'robotics',    label: 'Robotics',      emoji: '🦾', gradient: 'from-orange-400 to-pink-500' },
  { key: 'web',         label: 'Web & Apps',    emoji: '🌐', gradient: 'from-sky-400 to-indigo-500' },
  { key: 'math',        label: 'Mathematics',   emoji: '🔢', gradient: 'from-indigo-500 to-blue-600' },
  { key: 'science',     label: 'Science',       emoji: '🔬', gradient: 'from-emerald-400 to-teal-600' },
  { key: 'physics',     label: 'Physics',       emoji: '⚛️', gradient: 'from-blue-500 to-violet-600' },
  { key: 'chemistry',   label: 'Chemistry',     emoji: '🧪', gradient: 'from-lime-400 to-emerald-600' },
  { key: 'biology',     label: 'Biology',       emoji: '🧬', gradient: 'from-green-400 to-teal-500' },
  { key: 'space',       label: 'Space & Astronomy', emoji: '🚀', gradient: 'from-indigo-500 to-purple-700' },
  { key: 'art',         label: 'Art & Design',  emoji: '🎨', gradient: 'from-pink-400 to-rose-500' },
  { key: 'music',       label: 'Music & Sound', emoji: '🎵', gradient: 'from-amber-400 to-orange-500' },
];

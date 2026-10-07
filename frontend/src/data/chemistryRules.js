// Reaction rule table for the `lab-bench` engine (Chemistry, Class 8).
//
// Plain data, no code. Each rule says: "when the tube holds these items (and
// these conditions are true), play these effects". `matchRule` picks the
// winning rule; the lab-bench UI only draws what the rule says.
//
// Rule shape:
//   id           unique, kebab-case
//   when.contains    item ids that must ALL be in the tube
//   when.conditions  optional, e.g. { heated: true }; every key must match
//   over         how long the effect plays ("20s-scaled" = sped-up clock)
//   effects      list of { fx, ... }; `fx` must be in EFFECT_VOCABULARY
//   observation  what a student would SEE (shown in the notebook)
//   wordEquation optional word equation (Class 8 uses words, not symbols)
//   particleView optional key of the particle animation to play
//   residue      optional colour of the ash left when a solid burns away
//   safety       optional "watch-only": shows "watch here, don't try at home"
//
// When two rules both match, the one asking for more (more items plus
// conditions) wins. That is how "zinc + acid" bubbles, and "zinc + acid +
// burning matchstick" also pops.
//
// Item ids used so far
//   solids:     zinc-strip, iron-nail, copper-strip, magnesium-ribbon, sodium, sulphur,
//               red-litmus, blue-litmus (paper strips: dipped like a solid)
//   solutions:  zinc-sulphate-soln, iron-sulphate-soln, copper-sulphate-soln,
//               dilute-hcl, sodium-hydroxide-soln, water,
//               magnesium-oxide-soln, sulphur-dioxide-soln
//   tools:      burning-matchstick. The burner is not an item: it sets the
//               condition { heated: true }

const BLUE = '#2f7fd8';
const PALE = '#e8eef0';

export const RULES = [
  /* ---------- Displacement: the reactivity contest ---------- */
  {
    id: 'iron-copper-sulphate',
    when: { contains: ['iron-nail', 'copper-sulphate-soln'] },
    over: '20s-scaled',
    effects: [
      { fx: 'solution-colour', from: BLUE, to: '#8fbf6a' },
      { fx: 'coat-solid', target: 'iron-nail', colour: '#a0522d' },
    ],
    observation: 'The blue solution turns green. A brown coating forms on the nail.',
    wordEquation: 'iron + copper sulphate → iron sulphate + copper',
    particleView: 'displacement-fe-cu',
  },
  {
    id: 'zinc-copper-sulphate',
    when: { contains: ['zinc-strip', 'copper-sulphate-soln'] },
    over: '20s-scaled',
    effects: [
      { fx: 'solution-colour', from: BLUE, to: PALE },
      { fx: 'coat-solid', target: 'zinc-strip', colour: '#a0522d' },
    ],
    observation: 'The blue solution fades almost to colourless. A reddish-brown coating forms on the zinc.',
    wordEquation: 'zinc + copper sulphate → zinc sulphate + copper',
    particleView: 'displacement-zn-cu',
  },
  {
    id: 'zinc-iron-sulphate',
    when: { contains: ['zinc-strip', 'iron-sulphate-soln'] },
    over: '20s-scaled',
    effects: [
      { fx: 'solution-colour', from: '#b8d8a0', to: PALE },
      { fx: 'coat-solid', target: 'zinc-strip', colour: '#555555' },
    ],
    observation: 'The pale green solution fades. A dark grey coating of iron forms on the zinc.',
    wordEquation: 'zinc + iron sulphate → zinc sulphate + iron',
    particleView: 'displacement-zn-fe',
  },
  {
    id: 'copper-zinc-sulphate',
    when: { contains: ['copper-strip', 'zinc-sulphate-soln'] },
    effects: [{ fx: 'no-change', message: 'Copper is less reactive than zinc, so it cannot push zinc out of the solution.' }],
    observation: 'Nothing happens. Copper is less reactive than zinc.',
  },
  {
    id: 'copper-iron-sulphate',
    when: { contains: ['copper-strip', 'iron-sulphate-soln'] },
    effects: [{ fx: 'no-change', message: 'Copper is less reactive than iron, so it cannot push iron out of the solution.' }],
    observation: 'Nothing happens. Copper is less reactive than iron.',
  },
  {
    id: 'iron-zinc-sulphate',
    when: { contains: ['iron-nail', 'zinc-sulphate-soln'] },
    effects: [{ fx: 'no-change', message: 'Iron is less reactive than zinc, so it cannot push zinc out of the solution.' }],
    observation: 'Nothing happens. Iron is less reactive than zinc.',
  },

  /* ---------- Metals and non-metals with acids and water ---------- */
  {
    id: 'zinc-dilute-hcl',
    when: { contains: ['zinc-strip', 'dilute-hcl'] },
    effects: [{ fx: 'bubbles', rate: 'steady', size: 'small' }],
    observation: 'Bubbles of gas rise from the zinc.',
    wordEquation: 'zinc + hydrochloric acid → zinc chloride + hydrogen',
  },
  {
    id: 'zinc-dilute-hcl-pop',
    when: { contains: ['zinc-strip', 'dilute-hcl', 'burning-matchstick'] },
    effects: [
      { fx: 'bubbles', rate: 'steady', size: 'small' },
      { fx: 'gas-test', test: 'pop' },
    ],
    observation: 'The gas burns with a squeaky pop near the flame. That is the test for hydrogen.',
    wordEquation: 'zinc + hydrochloric acid → zinc chloride + hydrogen',
  },
  {
    id: 'magnesium-dilute-hcl',
    when: { contains: ['magnesium-ribbon', 'dilute-hcl'] },
    effects: [{ fx: 'bubbles', rate: 'fast', size: 'medium' }, { fx: 'heat-shimmer' }],
    observation: 'Magnesium fizzes quickly and the tube warms up.',
    wordEquation: 'magnesium + hydrochloric acid → magnesium chloride + hydrogen',
  },
  {
    id: 'iron-dilute-hcl',
    when: { contains: ['iron-nail', 'dilute-hcl'] },
    effects: [{ fx: 'bubbles', rate: 'slow', size: 'small' }],
    observation: 'A few bubbles form slowly on the nail.',
    wordEquation: 'iron + hydrochloric acid → iron chloride + hydrogen',
  },
  {
    id: 'copper-dilute-hcl',
    when: { contains: ['copper-strip', 'dilute-hcl'] },
    effects: [{ fx: 'no-change', message: 'Copper does not react with dilute acid.' }],
    observation: 'Nothing happens. Copper does not react with dilute acid.',
  },
  {
    id: 'sulphur-dilute-hcl',
    when: { contains: ['sulphur', 'dilute-hcl'] },
    effects: [{ fx: 'no-change', message: 'Non-metals generally do not react with dilute acid.' }],
    observation: 'Nothing happens. Non-metals generally do not react with dilute acid.',
  },
  {
    id: 'zinc-sodium-hydroxide',
    when: { contains: ['zinc-strip', 'sodium-hydroxide-soln'] },
    effects: [{ fx: 'bubbles', rate: 'slow', size: 'small' }],
    observation: 'Bubbles of hydrogen form on the zinc.',
    wordEquation: 'zinc + sodium hydroxide → sodium zincate + hydrogen',
  },
  {
    id: 'sodium-water',
    when: { contains: ['sodium', 'water'] },
    effects: [
      { fx: 'bubbles', rate: 'fast', size: 'large' },
      { fx: 'flame', colour: '#ffb400', height: 'low' },
    ],
    observation: 'Sodium skates on the water, fizzes and may catch fire. That is why it is stored under kerosene.',
    wordEquation: 'sodium + water → sodium hydroxide + hydrogen',
    safety: 'watch-only',
  },
  {
    id: 'sodium-dilute-hcl',
    when: { contains: ['sodium', 'dilute-hcl'] },
    effects: [
      { fx: 'bubbles', rate: 'fast', size: 'large' },
      { fx: 'flame', colour: '#ffb400', height: 'tall' },
    ],
    observation: 'Sodium reacts even more violently with acid than with water. Far too dangerous to try.',
    wordEquation: 'sodium + hydrochloric acid → sodium chloride + hydrogen',
    safety: 'watch-only',
  },
  {
    id: 'sodium-sodium-hydroxide',
    when: { contains: ['sodium', 'sodium-hydroxide-soln'] },
    effects: [
      { fx: 'bubbles', rate: 'fast', size: 'large' },
      { fx: 'flame', colour: '#ffb400', height: 'low' },
    ],
    observation: 'Sodium still reacts with the water in the solution, fizzing and catching fire.',
    wordEquation: 'sodium + water → sodium hydroxide + hydrogen',
    safety: 'watch-only',
  },

  /* ---------- Burning and oxides ---------- */
  {
    id: 'magnesium-burning',
    when: { contains: ['magnesium-ribbon'], conditions: { heated: true } },
    effects: [
      { fx: 'flame', colour: '#ffffff', height: 'tall' },
      { fx: 'glow', colour: '#ffffff' },
      { fx: 'smoke', colour: '#f5f5f5' },
    ],
    observation: 'Magnesium burns with a dazzling white flame and leaves a white ash.',
    wordEquation: 'magnesium + oxygen → magnesium oxide',
    particleView: 'combustion-mg',
    residue: '#f1f1f1',
    safety: 'watch-only',
  },
  {
    id: 'sulphur-burning',
    when: { contains: ['sulphur'], conditions: { heated: true } },
    effects: [
      { fx: 'flame', colour: '#5b7cfa', height: 'low' },
      { fx: 'smoke', colour: '#e8e8e8' },
    ],
    observation: 'Sulphur burns with a pale blue flame and gives off a sharp, choking gas: sulphur dioxide.',
    wordEquation: 'sulphur + oxygen → sulphur dioxide',
    particleView: 'combustion-s',
    safety: 'watch-only',
  },
  {
    id: 'magnesium-oxide-red-litmus',
    when: { contains: ['magnesium-oxide-soln', 'red-litmus'] },
    effects: [{ fx: 'litmus', result: 'to-blue' }],
    observation: 'Red litmus turns blue. Magnesium oxide solution is basic.',
  },
  {
    id: 'magnesium-oxide-blue-litmus',
    when: { contains: ['magnesium-oxide-soln', 'blue-litmus'] },
    effects: [{ fx: 'litmus', result: 'no-change' }],
    observation: 'Blue litmus stays blue. A basic solution has no effect on it.',
  },
  {
    id: 'red-litmus-water',
    when: { contains: ['water', 'red-litmus'] },
    effects: [{ fx: 'litmus', result: 'no-change' }],
    observation: 'Red litmus stays red. Water is neutral, so it changes neither colour.',
  },
  {
    id: 'blue-litmus-water',
    when: { contains: ['water', 'blue-litmus'] },
    effects: [{ fx: 'litmus', result: 'no-change' }],
    observation: 'Blue litmus stays blue. Water is neutral, so it changes neither colour.',
  },
  {
    id: 'sulphur-dioxide-blue-litmus',
    when: { contains: ['sulphur-dioxide-soln', 'blue-litmus'] },
    effects: [{ fx: 'litmus', result: 'to-red' }],
    observation: 'Blue litmus turns red. The solution of sulphur dioxide is acidic.',
  },
  {
    id: 'sulphur-dioxide-red-litmus',
    when: { contains: ['sulphur-dioxide-soln', 'red-litmus'] },
    effects: [{ fx: 'litmus', result: 'no-change' }],
    observation: 'Red litmus stays red. An acidic solution has no effect on it.',
  },
];

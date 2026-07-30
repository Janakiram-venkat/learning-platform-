/**
 * ARIA's parts list — the single source of truth for the 3D bench.
 *
 * The whole of Module 2 is driven from this array: what gets drawn, what a
 * hover highlights, which system a part belongs to, where it flies to when the
 * robot explodes, and what the card says when you click it. Nothing traverses
 * the scene graph looking for things; every interaction is a lookup by id.
 *
 * Shapes are primitives on purpose (see the course blueprint): clarity beats
 * realism at this age, and it keeps the course free of an asset pipeline. A
 * real GLB can drop in later behind these same ids.
 *
 * Axes: +X is the front of the robot, +Y up, ±Z the two sides.
 */

export const SYSTEMS = {
  power: { label: 'Power', emoji: '⚡', color: '#FFC93C', blurb: 'Stores energy and sends it to everything else.' },
  brain: { label: 'Brain', emoji: '🧠', color: '#3FBF7F', blurb: 'Reads the sensors and decides what to do.' },
  movement: { label: 'Movement', emoji: '⚙️', color: '#E8503A', blurb: 'Turns decisions into actual motion.' },
  senses: { label: 'Senses', emoji: '👁️', color: '#23B5D3', blurb: 'Turns the world into numbers.' },
  comms: { label: 'Signals', emoji: '📡', color: '#A78BFA', blurb: 'How the robot tells you what it is doing.' },
  structure: { label: 'Frame', emoji: '🔩', color: '#8FA79A', blurb: 'Holds every other part in the right place.' },
};

export const SYSTEM_ORDER = ['power', 'brain', 'movement', 'senses', 'comms', 'structure'];

/**
 * One entry per clickable part.
 *
 * `pieces` lets a part be more than one primitive while still behaving as a
 * single clickable thing — the ultrasonic sensor is a body plus two eyes, but
 * a student clicks "the distance sensor", not "the left eye".
 * `explode` is the direction it flies when the exploded-view slider is pulled.
 */
export const ARIA_PARTS = [
  {
    id: 'chassis',
    label: 'Chassis',
    system: 'structure',
    blurb: 'The flat plate that every other part bolts onto.',
    detail: 'Every part has one job, and the chassis has the job of holding the others still. If the motors could wobble, the two wheels would fight each other instead of working together.',
    explode: [0, -0.55, 0],
    pieces: [{ shape: 'box', pos: [0, 0.19, 0], size: [0.62, 0.1, 0.46], color: '#1F7A5C' }],
  },
  {
    id: 'caster',
    label: 'Caster Ball',
    system: 'structure',
    blurb: 'A ball that rolls in any direction, so two driven wheels are enough.',
    detail: 'Your robot only drives two wheels, and two points cannot stand up on their own. The caster is the third leg of the stool. It holds the front up and rolls whichever way it is pushed.',
    explode: [0.7, -0.4, 0],
    pieces: [{ shape: 'sphere', pos: [0.24, 0.06, 0], size: [0.06], color: '#55655C', metal: 0.6, rough: 0.3 }],
  },
  {
    id: 'battery',
    label: 'Battery Pack',
    system: 'power',
    blurb: 'Holds the energy the whole robot runs on.',
    detail: 'Chemicals inside push electricity out of one end and pull it back in at the other. Every other part depends on this one.',
    explode: [-0.5, 0.8, 0],
    pieces: [
      { shape: 'box', pos: [-0.16, 0.28, 0], size: [0.24, 0.09, 0.3], color: '#16241D' },
      { shape: 'cylinder', pos: [-0.16, 0.28, 0.09], size: [0.035, 0.035, 0.22], rot: [0, 0, Math.PI / 2], color: '#4A5D3A' },
      { shape: 'cylinder', pos: [-0.16, 0.28, -0.09], size: [0.035, 0.035, 0.22], rot: [0, 0, Math.PI / 2], color: '#4A5D3A' },
    ],
  },
  {
    id: 'switch',
    label: 'Power Switch',
    system: 'power',
    blurb: 'A gap in the circuit that you can open and close whenever you want.',
    detail: 'A switch does not make electricity. It only decides whether the circuit is joined up. Flick it off and there is a gap in the loop, so nothing flows.',
    explode: [-0.9, 0.45, 0.5],
    pieces: [
      { shape: 'box', pos: [-0.3, 0.27, 0.16], size: [0.07, 0.06, 0.05], color: '#EDF3EE' },
      { shape: 'box', pos: [-0.3, 0.31, 0.17], size: [0.03, 0.04, 0.02], rot: [0.4, 0, 0], color: '#E8503A' },
    ],
  },
  {
    id: 'controller',
    label: 'Controller Board',
    system: 'brain',
    blurb: 'A tiny computer with no screen. It talks to the world through wires.',
    detail: 'This is where the THINK step lives. It reads numbers from the sensors, runs the rules you wrote, and switches its pins on and off to make things happen.',
    explode: [0.15, 1.0, 0.25],
    pieces: [
      { shape: 'box', pos: [0.07, 0.26, 0.09], size: [0.2, 0.03, 0.2], color: '#0F3D2E', metal: 0.3, rough: 0.4 },
      { shape: 'box', pos: [0.07, 0.29, 0.17], size: [0.18, 0.02, 0.02], color: '#8FA79A', metal: 0.8, rough: 0.3 },
      { shape: 'box', pos: [0.07, 0.29, 0.01], size: [0.18, 0.02, 0.02], color: '#8FA79A', metal: 0.8, rough: 0.3 },
      { shape: 'box', pos: [0.14, 0.29, 0.09], size: [0.05, 0.03, 0.06], color: '#C0CCC4', metal: 0.7, rough: 0.25 },
    ],
  },
  {
    id: 'driver',
    label: 'Motor Driver',
    system: 'movement',
    blurb: 'The muscle sitting between the brain and the motors.',
    detail: 'The controller can only supply a trickle of electricity, nowhere near enough to turn a wheel. So the driver listens to the controller\'s tiny signal and switches the battery\'s much bigger current instead.',
    explode: [0.15, 0.85, -0.5],
    pieces: [
      { shape: 'box', pos: [0.07, 0.26, -0.14], size: [0.16, 0.03, 0.13], color: '#1B3A6B', metal: 0.3, rough: 0.45 },
      { shape: 'box', pos: [0.07, 0.31, -0.14], size: [0.07, 0.07, 0.05], color: '#8FA79A', metal: 0.8, rough: 0.3 },
    ],
  },
  {
    id: 'motor-left',
    label: 'Left Motor',
    system: 'movement',
    blurb: 'Electricity goes in, spinning comes out.',
    detail: 'Magnets and coils inside push each other round and round. Send the electricity the other way and it spins backwards, which is how the robot turns.',
    explode: [0, -0.2, -1.0],
    pieces: [
      { shape: 'cylinder', pos: [-0.05, 0.13, -0.17], size: [0.055, 0.055, 0.14], rot: [Math.PI / 2, 0, 0], color: '#C0CCC4', metal: 0.7, rough: 0.35 },
      { shape: 'cylinder', pos: [-0.05, 0.13, -0.25], size: [0.02, 0.02, 0.05], rot: [Math.PI / 2, 0, 0], color: '#55655C', metal: 0.8, rough: 0.3 },
    ],
  },
  {
    id: 'motor-right',
    label: 'Right Motor',
    system: 'movement',
    blurb: 'The other half of the pair. Two motors and two wheels, with no steering needed.',
    detail: 'There is no steering wheel anywhere on this robot. Running the two motors at different speeds is what makes it turn, and you will build exactly that later.',
    explode: [0, -0.2, 1.0],
    pieces: [
      { shape: 'cylinder', pos: [-0.05, 0.13, 0.17], size: [0.055, 0.055, 0.14], rot: [Math.PI / 2, 0, 0], color: '#C0CCC4', metal: 0.7, rough: 0.35 },
      { shape: 'cylinder', pos: [-0.05, 0.13, 0.25], size: [0.02, 0.02, 0.05], rot: [Math.PI / 2, 0, 0], color: '#55655C', metal: 0.8, rough: 0.3 },
    ],
  },
  {
    id: 'wheel-left',
    label: 'Left Wheel',
    system: 'movement',
    blurb: 'One full turn of this wheel moves the robot forward by the distance around its rim.',
    detail: 'Wheel size decides how far one turn takes you. A bigger wheel covers more ground per turn, but it needs more push to get moving.',
    explode: [0, 0, -1.5],
    pieces: [{ shape: 'cylinder', pos: [-0.05, 0.13, -0.3], size: [0.13, 0.13, 0.06], rot: [Math.PI / 2, 0, 0], color: '#16241D', rough: 0.9 }],
  },
  {
    id: 'wheel-right',
    label: 'Right Wheel',
    system: 'movement',
    blurb: 'The matching wheel on the other side.',
    detail: 'Both wheels forward and the robot drives straight. One forward and one backward, and it spins on the spot.',
    explode: [0, 0, 1.5],
    pieces: [{ shape: 'cylinder', pos: [-0.05, 0.13, 0.3], size: [0.13, 0.13, 0.06], rot: [Math.PI / 2, 0, 0], color: '#16241D', rough: 0.9 }],
  },
  {
    id: 'ultrasonic',
    label: 'Distance Sensor',
    system: 'senses',
    blurb: 'It shouts, listens for the echo, and times how long the echo took.',
    detail: 'The two circles are a speaker and a microphone. It sends out a click too high for you to hear, waits for the click to bounce back, then turns that waiting time into centimetres.',
    explode: [1.3, 0.3, 0],
    pieces: [
      { shape: 'box', pos: [0.3, 0.26, 0], size: [0.06, 0.12, 0.26], color: '#16241D' },
      { shape: 'cylinder', pos: [0.335, 0.27, 0.07], size: [0.045, 0.045, 0.03], rot: [0, 0, Math.PI / 2], color: '#23B5D3', glow: 0.5 },
      { shape: 'cylinder', pos: [0.335, 0.27, -0.07], size: [0.045, 0.045, 0.03], rot: [0, 0, Math.PI / 2], color: '#23B5D3', glow: 0.5 },
    ],
  },
  {
    id: 'line-sensor',
    label: 'Line Sensors',
    system: 'senses',
    blurb: 'It looks down and asks one question: is the floor light or dark?',
    detail: 'There are two of them, both pointing at the ground. A white floor bounces their light straight back, while a black line absorbs it. That difference is all you need to follow a track.',
    explode: [0.9, -0.7, 0],
    pieces: [
      { shape: 'box', pos: [0.17, 0.12, 0], size: [0.09, 0.02, 0.18], color: '#0F3D2E' },
      { shape: 'cylinder', pos: [0.17, 0.1, 0.05], size: [0.016, 0.016, 0.02], color: '#E8503A', glow: 0.8 },
      { shape: 'cylinder', pos: [0.17, 0.1, -0.05], size: [0.016, 0.016, 0.02], color: '#E8503A', glow: 0.8 },
    ],
  },
  {
    id: 'status-led',
    label: 'Status LED',
    system: 'comms',
    blurb: 'The robot\'s way of saying "I am awake".',
    detail: 'One LED can say a surprising amount: on, off, slow blink, fast blink. It is the first thing to check when nothing seems to work.',
    explode: [0.4, 1.2, 0.7],
    pieces: [{ shape: 'sphere', pos: [0.2, 0.3, 0.19], size: [0.03], color: '#23B5D3', glow: 2.2 }],
  },
  {
    id: 'buzzer',
    label: 'Buzzer',
    system: 'comms',
    blurb: 'Makes a noise, so you notice without having to look.',
    detail: 'A small disc that vibrates when electricity runs through it. Cheap, loud, and the fastest way for a robot to tell you something is wrong.',
    explode: [0.4, 1.0, -0.7],
    pieces: [
      { shape: 'cylinder', pos: [0.2, 0.28, -0.17], size: [0.045, 0.045, 0.05], color: '#16241D' },
      { shape: 'cylinder', pos: [0.2, 0.305, -0.17], size: [0.012, 0.012, 0.005], color: '#8FA79A' },
    ],
  },
];

/** id -> part, so every interaction is a map lookup rather than a search. */
export const PART_BY_ID = Object.fromEntries(ARIA_PARTS.map((p) => [p.id, p]));

/** Parts belonging to one system, in bench order. */
export const partsInSystem = (system) => ARIA_PARTS.filter((p) => p.system === system);

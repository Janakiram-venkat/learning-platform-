/* ---------------------------------------------------------------------------
   Track icons — silkscreened SVGs in the workbench language.
   2px ink strokes on white, no fill color. Sized to sit in a 48–56px well.
   Each icon draws the track as a bench component, not as a topic metaphor,
   so they read as "printed on the side of a breadboard" rather than clip art.
--------------------------------------------------------------------------- */

const STROKE = 'currentColor';
const SW = 2;

// Shared props keep every icon rendering identically at any size.
const base = {
  viewBox: '0 0 48 48',
  fill: 'none',
  stroke: STROKE,
  strokeWidth: SW,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

// Python — a ribbon cable coiled like a serpent. Eight pin marks on the tail.
export function PythonIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M8 30c0-6 5-10 11-10s11 4 11 10-5 10-11 10c-4 0-7-2-9-5" />
      <path d="M40 18c0 6-5 10-11 10s-11-4-11-10 5-10 11-10c4 0 7 2 9 5" />
      <circle cx="33" cy="14" r="1.4" fill={STROKE} stroke="none" />
      <path d="M10 40l2-2M14 40l2-2M18 40l2-2M22 40l2-2" />
    </svg>
  );
}

// AI — op-amp triangle with a neural node feeding the inverting input.
export function AiIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M14 12v24l22-12z" />
      <path d="M6 18h8M6 30h8" />
      <path d="M36 24h6" />
      <circle cx="10" cy="18" r="2" />
      <circle cx="10" cy="30" r="2" />
      <path d="M17 20l6 3M17 28l6-3" />
    </svg>
  );
}

// Game — top-down D-pad with a signal LED at the corner.
export function GameIcon(props) {
  return (
    <svg {...base} {...props}>
      <rect x="8" y="14" width="32" height="20" rx="4" />
      <path d="M17 24h8M21 20v8" />
      <circle cx="33" cy="22" r="1.8" />
      <circle cx="33" cy="28" r="1.8" fill={STROKE} stroke="none" />
      <path d="M14 34l-2 4M34 34l2 4" />
    </svg>
  );
}

// Robotics — 3-joint kinematic arm, joints as pivots, gripper at the tip.
export function RoboticsIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M6 42h14" />
      <circle cx="13" cy="38" r="3" />
      <path d="M13 35l8-12" />
      <circle cx="21" cy="23" r="3" />
      <path d="M23 21l10-4" />
      <circle cx="33" cy="17" r="2.5" />
      <path d="M35 15l4-2M35 19l4 2" />
    </svg>
  );
}

// Web — wireframe globe, latitude + meridian, with two ports at the equator.
export function WebIcon(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="24" cy="24" r="14" />
      <path d="M10 24h28" />
      <path d="M24 10c5 4 5 24 0 28M24 10c-5 4-5 24 0 28" />
      <rect x="6" y="22" width="4" height="4" rx="1" fill="white" />
      <rect x="38" y="22" width="4" height="4" rx="1" fill="white" />
    </svg>
  );
}

// Physics — orbital diagram: nucleus + elliptical trace + one satellite.
export function PhysicsIcon(props) {
  return (
    <svg {...base} {...props}>
      <ellipse cx="24" cy="24" rx="18" ry="8" transform="rotate(-25 24 24)" />
      <ellipse cx="24" cy="24" rx="18" ry="8" transform="rotate(25 24 24)" />
      <circle cx="24" cy="24" r="3" fill={STROKE} stroke="none" />
      <circle cx="38" cy="16" r="2" fill="white" />
    </svg>
  );
}

// Chemistry — beaker with meniscus and three schematic bubbles rising.
export function ChemistryIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M17 8h14" />
      <path d="M19 8v10L10 38a3 3 0 0 0 3 4h22a3 3 0 0 0 3-4l-9-20V8" />
      <path d="M13 30c4-2 8 2 12 0s7 1 10 0" />
      <circle cx="22" cy="24" r="1.4" fill={STROKE} stroke="none" />
      <circle cx="27" cy="20" r="1" fill={STROKE} stroke="none" />
      <circle cx="30" cy="26" r="1.2" fill={STROKE} stroke="none" />
    </svg>
  );
}

// Biology — a cell under the lens: membrane, nucleus, and two organelles,
// drawn as a schematic rather than a soft blob so it sits with the others.
export function BiologyIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M24 8c9 0 16 7 16 16s-7 16-16 16S8 33 8 24 15 8 24 8z" />
      <circle cx="20" cy="21" r="4" />
      <circle cx="20" cy="21" r="1.2" fill={STROKE} stroke="none" />
      <path d="M28 27c3-1 5 1 6 3" />
      <path d="M26 15c2 1 4 0 5-2" />
      <circle cx="30" cy="20" r="1.6" fill={STROKE} stroke="none" />
    </svg>
  );
}

// Registry keyed by track ref so CoursesPage stays declarative.
export const TRACK_ICONS = {
  'TRK-PY':   PythonIcon,
  'TRK-AI':   AiIcon,
  'TRK-GAME': GameIcon,
  'TRK-BOT':  RoboticsIcon,
  'TRK-WEB':  WebIcon,
  'TRK-PHY':  PhysicsIcon,
  'TRK-CHEM': ChemistryIcon,
  'TRK-BIO':  BiologyIcon,
};

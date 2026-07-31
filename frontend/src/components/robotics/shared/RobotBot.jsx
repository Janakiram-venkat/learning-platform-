import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import { brushedAlu, circuitBoard, mouldedPlastic, paintedShell, rubberTread } from './labTextures';

/**
 * ARIA, the course robot — built from primitives rather than a GLB.
 *
 * Two driven wheels, a caster, an ultrasonic head and a status LED: the exact
 * parts the student assembles from Module 3 onward, so the shape they meet in
 * Module 1 is the shape they end up building. Primitives keep the whole course
 * free of an asset pipeline; a real model can drop in behind the same props.
 *
 * The realism comes from three places, none of which is polygon count: every
 * hard edge is bevelled (RoundedBox), because a perfectly sharp edge catches no
 * highlight and is the strongest tell that something is CG; every surface
 * carries a procedural normal and roughness map from labTextures, so light
 * breaks over the tread and the brushed brackets as the student orbits; and the
 * parts that are shiny in real life are shiny here, which only works because
 * Stage3D gives them an environment to reflect.
 *
 * Faces +X. `led` is the status colour (null turns the LED off).
 *
 * The wheels are not decoration: pass `speedRef` (scene units per second, along
 * the nose) and `turnRef` (radians per second about +Y) and they roll at exactly
 * v/r, counter-rotating when the chassis spins on the spot the way a real
 * differential drive has to. A robot that slides on frozen wheels is the first
 * thing a student notices, so the scene that drives the body owns those two
 * numbers and this component derives the wheels from them.
 */
const WHEEL_R = 0.13;    // matches the tyre geometry below
const HALF_TRACK = 0.26; // wheel centre to chassis centre line

// The chassis plate, and the deck surface everything else is stacked on.
// Anything that sits on the robot measures off DECK_TOP rather than carrying a
// hand-tuned absolute height — that is how the sensor head ended up sunk into
// the plate, and how the board ended up floating 5 mm above it.
const CHASSIS = { len: 0.62, thick: 0.1, width: 0.46, y: 0.19 };
const DECK_TOP = CHASSIS.y + CHASSIS.thick / 2;      // 0.24
const DECK_BOTTOM = CHASSIS.y - CHASSIS.thick / 2;   // 0.14

// The caster: a ball of this radius resting on the floor, so its centre is one
// radius up and its crown one radius above that. The socket reaches from just
// under the crown to the underside of the deck.
const CASTER_R = 0.06;
const CASTER_SOCKET_BOTTOM = CASTER_R * 2 - 0.015;   // 0.105, a little below the crown

const HEAD_H = 0.12;      // ultrasonic housing height
const HEAD_LIFT = 0.02;   // pedestal height between deck and housing

const BOARD_T = 0.03;     // controller board thickness
const STANDOFF = 0.006;   // nylon standoffs holding it off the deck
const BOARD_Y = DECK_TOP + STANDOFF + BOARD_T / 2;
const BOARD_TOP = BOARD_Y + BOARD_T / 2;

const BATTERY_H = 0.08;
const BATTERY_Y = DECK_TOP + BATTERY_H / 2;

// Six materials, one per box face. Only face 2 (+Y) gets the PCB artwork, so
// the edges stay bare fibreglass instead of being wrapped in copper.
const BOARD_FACES = [0, 1, 2, 3, 4, 5];

// Wheel section, all measured from the axle plane so the parts can't drift out
// of agreement. The tyre is TYRE_W wide and the rim stands RIM_PROUD past each
// tyre face, which is the only reason the rim is visible at all: it is narrower
// than the tyre in radius, so if it did not stick out axially the tyre would
// swallow it whole and the machining would be work nobody ever sees.
const TYRE_W = 0.058;
const TYRE_HALF = TYRE_W / 2;      // 0.029
const SHOULDER_R = 0.013;          // radius of the rounded sidewall bead
const RIM_R = 0.078;
const RIM_PROUD = 0.004;
const RIM_FACE = TYRE_HALF + RIM_PROUD;   // 0.033

/**
 * One wheel: tyre, rounded shoulders, machined rim and a centre nut.
 *
 * `out` is which way is *outboard* in this wheel's local frame, and it is the
 * whole reason this takes a prop rather than being symmetric. Laying the
 * cylinder down maps local +Y onto world +Z, so a fixed offset would put the
 * nut on the outside of the right wheel and on the inside of the left one,
 * where it would be hidden against the chassis. Everything that belongs on the
 * outer face is multiplied by `out`, so the pair mirrors properly.
 */
function Wheel({ innerRef, z }) {
  const tread = rubberTread(9, 1);   // nine tread blocks around the circumference
  const alu = brushedAlu(2, 1);
  const out = Math.sign(z) || 1;

  return (
    <group ref={innerRef} position={[-0.05, WHEEL_R, z]} rotation={[Math.PI / 2, 0, 0]}>
      {/* Tyre. The tread is in the normal map, not the mesh — see labTextures. */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[WHEEL_R, WHEEL_R, TYRE_W, 32]} />
        <meshStandardMaterial {...tread} roughness={0.95} metalness={0.02} />
      </mesh>

      {/*
        Rounded shoulders, so the tyre isn't a disc cut off with a knife. Both
        the ring radius and its offset are derived from the tyre, so the bead
        peaks exactly at the tread radius and its outer edge lands flush with
        the tyre face — set by hand, it bulged 12 mm proud on each side and
        pushed the wheel through the side of the chassis.
      */}
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[0, side * (TYRE_HALF - SHOULDER_R), 0]}
          rotation={[Math.PI / 2, 0, 0]}
          castShadow
        >
          <torusGeometry args={[WHEEL_R - SHOULDER_R, SHOULDER_R, 8, 28]} />
          <meshStandardMaterial color="#232624" roughness={0.9} metalness={0.02} />
        </mesh>
      ))}

      {/* Machined rim, standing a little proud of both tyre faces. */}
      <mesh castShadow>
        <cylinderGeometry args={[RIM_R, RIM_R, RIM_FACE * 2, 24]} />
        <meshStandardMaterial {...alu} metalness={0.92} roughness={0.34} envMapIntensity={1.2} />
      </mesh>

      {/* Lightening holes drilled through the outer rim face. */}
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * 0.048, out * (RIM_FACE - 0.002), Math.sin(a) * 0.048]}
          >
            <cylinderGeometry args={[0.015, 0.015, 0.006, 12]} />
            <meshStandardMaterial color="#0d1512" roughness={0.8} />
          </mesh>
        );
      })}

      {/* Centre nut on the motor shaft — outboard face only, like the real one. */}
      <mesh position={[0, out * (RIM_FACE + 0.006), 0]} castShadow>
        <cylinderGeometry args={[0.018, 0.018, 0.014, 6]} />
        <meshStandardMaterial color="#c8cfca" metalness={0.95} roughness={0.22} envMapIntensity={1.4} />
      </mesh>
    </group>
  );
}

/** One ultrasonic transducer: aluminium can, mesh face, centre pip. */
function Transducer({ z }) {
  return (
    <group position={[0.035, 0.01, z]} rotation={[0, 0, Math.PI / 2]}>
      {/* The can. Real ones are drawn aluminium and quite bright. */}
      <mesh castShadow>
        <cylinderGeometry args={[0.045, 0.045, 0.03, 24]} />
        <meshStandardMaterial color="#aab4ae" metalness={0.9} roughness={0.28} envMapIntensity={1.3} />
      </mesh>
      {/* Crimped rim around the face. */}
      <mesh position={[0, 0.014, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.042, 0.005, 8, 24]} />
        <meshStandardMaterial color="#8d9791" metalness={0.85} roughness={0.4} />
      </mesh>
      {/* The dark mesh face, recessed a hair below the rim. */}
      <mesh position={[0, 0.0155, 0]}>
        <cylinderGeometry args={[0.038, 0.038, 0.004, 24]} />
        <meshStandardMaterial color="#171d1a" roughness={0.85} metalness={0.1} />
      </mesh>
      <mesh position={[0, 0.019, 0]}>
        <cylinderGeometry args={[0.009, 0.009, 0.003, 12]} />
        <meshStandardMaterial color="#2b3531" roughness={0.6} metalness={0.3} />
      </mesh>
    </group>
  );
}

export default function RobotBot({ speedRef, turnRef, led = '#23B5D3', scale = 1 }) {
  const leftWheel = useRef();
  const rightWheel = useRef();
  const ledMat = useRef();

  const shell = paintedShell('#1F7A5C');
  const battery = mouldedPlastic('#16241D');
  const housing = mouldedPlastic('#1a2622');
  const board = circuitBoard();
  const alu = brushedAlu();

  useFrame((state, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);

    // The status LED breathes rather than sitting at a fixed brightness. Real
    // indicator LEDs on a running board almost never hold perfectly steady, and
    // that unsteadiness is what makes the robot read as powered-up rather than
    // as a model of a robot.
    if (ledMat.current && led) {
      const t = state.clock.elapsedTime;
      ledMat.current.emissiveIntensity = 2.0 + Math.sin(t * 2.4) * 0.5 + Math.sin(t * 7.1) * 0.12;
    }

    const v = speedRef?.current || 0;
    const w = turnRef?.current || 0;
    if (!v && !w) return;

    // A wheel offset z from the centre line travels at v + w·z, and rolling
    // without slipping turns it at that speed over the radius. The minus sign
    // is the handedness: the axle points along +Z once the cylinder is laid
    // down, and rolling toward +X is a negative rotation about it.
    const spin = (z) => -((v + w * z) / WHEEL_R) * delta;
    if (leftWheel.current) leftWheel.current.rotation.y += spin(-HALF_TRACK);
    if (rightWheel.current) rightWheel.current.rotation.y += spin(HALF_TRACK);
  });

  return (
    <group scale={scale}>
      {/*
        Chassis. Powder-coated aluminium plate: a clearcoat over a pigmented
        base, which is what a paint shop actually puts down, and what gives the
        sharp specular streak that sits on top of the softer body colour.
      */}
      <RoundedBox
        args={[CHASSIS.len, CHASSIS.thick, CHASSIS.width]}
        radius={0.022}
        smoothness={4}
        position={[0, CHASSIS.y, 0]}
        castShadow
        receiveShadow
      >
        <meshPhysicalMaterial
          {...shell}
          roughness={0.55}
          metalness={0.25}
          clearcoat={0.7}
          clearcoatRoughness={0.25}
          envMapIntensity={0.9}
        />
      </RoundedBox>

      {/* Deck screws: four M3 cap heads sitting proud of the plate. */}
      {[[-0.26, -0.18], [-0.26, 0.18], [0.26, -0.18], [0.26, 0.18]].map(([x, z]) => (
        <mesh key={`${x},${z}`} position={[x, DECK_TOP + 0.002, z]}>
          <cylinderGeometry args={[0.014, 0.016, 0.008, 12]} />
          <meshStandardMaterial color="#b9c2bd" metalness={0.95} roughness={0.25} envMapIntensity={1.4} />
        </mesh>
      ))}

      {/* Battery pack sitting on the deck, in a moulded ABS case. */}
      <RoundedBox
        args={[0.26, BATTERY_H, 0.3]}
        radius={0.012}
        smoothness={3}
        position={[-0.12, BATTERY_Y, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial {...battery} roughness={0.72} metalness={0.05} />
      </RoundedBox>

      {/* The strap holding it down: over the top and a little down both sides,
          which is why it is fractionally taller and deeper than the pack. */}
      <mesh position={[-0.12, BATTERY_Y + 0.002, 0]} castShadow>
        <boxGeometry args={[0.055, BATTERY_H + 0.008, 0.306]} />
        <meshStandardMaterial color="#0d1512" roughness={0.95} metalness={0} />
      </mesh>
      <mesh position={[-0.12, BATTERY_Y + BATTERY_H / 2 + 0.005, 0]}>
        <boxGeometry args={[0.032, 0.008, 0.03]} />
        <meshStandardMaterial color="#8d9791" metalness={0.9} roughness={0.35} />
      </mesh>

      {/*
        Controller board. The one part in the scene the student will later hold
        in their own hand, so it gets the full treatment: solder mask, routed
        copper, gold-plated pads, silkscreen.
      */}
      {/* Nylon standoffs: a board bolted flat to a metal plate would short
          against it, so it is always held off. Four of them, at the corners. */}
      {[[0.06, -0.1], [0.06, 0.1], [0.22, -0.1], [0.22, 0.1]].map(([x, z]) => (
        <mesh key={`${x},${z}`} position={[x, DECK_TOP + STANDOFF / 2, z]}>
          <cylinderGeometry args={[0.009, 0.009, STANDOFF, 10]} />
          <meshStandardMaterial color="#c9c4b4" roughness={0.6} metalness={0.05} />
        </mesh>
      ))}

      <mesh position={[0.14, BOARD_Y, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.2, BOARD_T, 0.24]} />
        {BOARD_FACES.map((face) =>
          face === 2 ? (
            <meshStandardMaterial
              key={face}
              attach={`material-${face}`}
              {...board}
              roughness={0.45}
              metalness={0.35}
              envMapIntensity={1.1}
            />
          ) : (
            <meshStandardMaterial
              key={face}
              attach={`material-${face}`}
              color="#0b3324"
              roughness={0.7}
              metalness={0.1}
            />
          ),
        )}
      </mesh>

      {/* Pin headers, sitting on the board's top face down both long edges. */}
      {[-0.1, 0.1].map((z) => (
        <mesh key={z} position={[0.14, BOARD_TOP + 0.006, z]} castShadow>
          <boxGeometry args={[0.17, 0.012, 0.014]} />
          <meshStandardMaterial color="#0d1512" roughness={0.55} metalness={0.15} />
        </mesh>
      ))}

      {/* Status LED: an emissive die, lit from inside, seated on the board. */}
      <mesh position={[0.14, BOARD_TOP + 0.014, 0.06]}>
        <sphereGeometry args={[0.016, 16, 16]} />
        <meshStandardMaterial
          ref={ledMat}
          color={led || '#16241D'}
          emissive={led || '#000000'}
          emissiveIntensity={led ? 2.2 : 0}
          toneMapped={false}
        />
      </mesh>
      {led && (
        <>
          {/* A soft halo, so it reads as emitting into the air rather than as a
              small ball painted a bright colour. */}
          <mesh position={[0.14, BOARD_TOP + 0.014, 0.06]}>
            <sphereGeometry args={[0.032, 12, 12]} />
            <meshBasicMaterial color={led} transparent opacity={0.16} depthWrite={false} toneMapped={false} />
          </mesh>
          {/* And it actually spills light onto the deck around it. */}
          <pointLight position={[0.14, BOARD_TOP + 0.03, 0.06]} color={led} intensity={0.12} distance={0.4} />
        </>
      )}

      {/*
        Ultrasonic head — the two "eyes", on a machined mount.

        The group's height is derived, not chosen: the housing is HEAD_H tall
        and centred on the group origin, so sitting it on the deck means the
        origin is half a housing above DECK_TOP. Picked by eye it was 4 cm too
        low, which buried the bottom third of the sensor inside the chassis and
        left the mounting bracket entirely inside the plate, invisible.
      */}
      <group position={[0.3, DECK_TOP + HEAD_H / 2 + HEAD_LIFT, 0]}>
        <RoundedBox args={[0.06, HEAD_H, 0.26]} radius={0.01} smoothness={3} castShadow receiveShadow>
          <meshStandardMaterial {...housing} roughness={0.62} metalness={0.12} />
        </RoundedBox>

        {/* The pedestal it stands on, bridging the gap down to the deck. */}
        <mesh position={[0, -(HEAD_H / 2 + HEAD_LIFT / 2), 0]} castShadow>
          <boxGeometry args={[0.045, HEAD_LIFT + 0.012, 0.18]} />
          <meshStandardMaterial {...alu} metalness={0.9} roughness={0.35} envMapIntensity={1.2} />
        </mesh>

        {/* Two bolts through the pedestal's feet into the deck, clear of the
            housing above so their heads are actually visible. */}
        {[-0.11, 0.11].map((bz) => (
          <mesh key={bz} position={[0, -(HEAD_H / 2 + HEAD_LIFT - 0.004), bz]}>
            <cylinderGeometry args={[0.011, 0.012, 0.008, 10]} />
            <meshStandardMaterial color="#b9c2bd" metalness={0.95} roughness={0.25} envMapIntensity={1.4} />
          </mesh>
        ))}

        {[-0.07, 0.07].map((z) => (
          <Transducer key={z} z={z} />
        ))}

        {/* The crystal can between the two transducers, as on a real HC-SR04. */}
        <mesh position={[0.032, -0.035, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.011, 0.011, 0.02, 12]} />
          <meshStandardMaterial color="#c0c8c3" metalness={0.9} roughness={0.3} />
        </mesh>
      </group>

      {/* Driven wheels */}
      <Wheel innerRef={leftWheel} z={-HALF_TRACK} />
      <Wheel innerRef={rightWheel} z={HALF_TRACK} />

      {/*
        Caster ball at the front, in its socket. The ball has radius 0.06 and
        sits on the floor, so its centre is at 0.06 and its crown at 0.12; the
        socket spans from just below that crown up to the underside of the
        chassis, which is what makes it read as a housing the ball turns inside
        rather than a collar floating around it.
      */}
      <mesh position={[0.24, (CASTER_SOCKET_BOTTOM + DECK_BOTTOM) / 2, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.055, DECK_BOTTOM - CASTER_SOCKET_BOTTOM, 16]} />
        <meshStandardMaterial {...alu} metalness={0.85} roughness={0.4} envMapIntensity={1.1} />
      </mesh>
      <mesh castShadow position={[0.24, CASTER_R, 0]}>
        <sphereGeometry args={[CASTER_R, 24, 24]} />
        {/* Polished steel: near-mirror, so it picks up the whole environment and
            gives the front of the robot a bright anchor point. */}
        <meshStandardMaterial color="#8e9994" roughness={0.12} metalness={0.98} envMapIntensity={1.6} />
      </mesh>
    </group>
  );
}

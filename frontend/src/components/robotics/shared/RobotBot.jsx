import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

/**
 * ARIA, the course robot — built from primitives rather than a GLB.
 *
 * Two driven wheels, a caster, an ultrasonic head and a status LED: the exact
 * parts the student assembles from Module 3 onward, so the shape they meet in
 * Module 1 is the shape they end up building. Primitives keep the whole course
 * free of an asset pipeline; a real model can drop in behind the same props.
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
const WHEEL_R = 0.13;    // matches the cylinderGeometry below
const HALF_TRACK = 0.26; // wheel centre to chassis centre line

export default function RobotBot({ speedRef, turnRef, led = '#23B5D3', scale = 1 }) {
  const leftWheel = useRef();
  const rightWheel = useRef();

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
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
      {/* Chassis */}
      <mesh castShadow position={[0, 0.19, 0]}>
        <boxGeometry args={[0.62, 0.1, 0.46]} />
        <meshStandardMaterial color="#1F7A5C" roughness={0.55} metalness={0.15} />
      </mesh>

      {/* Battery pack sitting on the deck */}
      <mesh castShadow position={[-0.12, 0.28, 0]}>
        <boxGeometry args={[0.26, 0.08, 0.3]} />
        <meshStandardMaterial color="#16241D" roughness={0.7} />
      </mesh>

      {/* Controller board */}
      <mesh castShadow position={[0.14, 0.26, 0]}>
        <boxGeometry args={[0.2, 0.03, 0.24]} />
        <meshStandardMaterial color="#0F3D2E" roughness={0.4} metalness={0.3} />
      </mesh>

      {/* Status LED */}
      <mesh position={[0.14, 0.3, 0.06]}>
        <sphereGeometry args={[0.028, 16, 16]} />
        <meshStandardMaterial
          color={led || '#16241D'}
          emissive={led || '#000000'}
          emissiveIntensity={led ? 2.2 : 0}
          toneMapped={false}
        />
      </mesh>

      {/* Ultrasonic head — the two "eyes" */}
      <group position={[0.3, 0.26, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.06, 0.12, 0.26]} />
          <meshStandardMaterial color="#16241D" roughness={0.6} />
        </mesh>
        {[-0.07, 0.07].map((z) => (
          <mesh key={z} position={[0.035, 0.01, z]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.045, 0.045, 0.03, 20]} />
            <meshStandardMaterial color="#23B5D3" emissive="#23B5D3" emissiveIntensity={0.5} />
          </mesh>
        ))}
      </group>

      {/* Driven wheels */}
      {[-0.26, 0.26].map((z, i) => (
        <mesh
          key={z}
          ref={i === 0 ? leftWheel : rightWheel}
          castShadow
          position={[-0.05, 0.13, z]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <cylinderGeometry args={[0.13, 0.13, 0.06, 24]} />
          <meshStandardMaterial color="#16241D" roughness={0.9} />
        </mesh>
      ))}

      {/* Caster ball at the front */}
      <mesh castShadow position={[0.24, 0.06, 0]}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial color="#55655C" roughness={0.3} metalness={0.6} />
      </mesh>
    </group>
  );
}

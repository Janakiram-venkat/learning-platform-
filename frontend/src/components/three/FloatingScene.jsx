import { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';

/*
 * A lightweight, playful Three.js background: a cluster of colorful low-poly
 * shapes gently bobbing and spinning. Designed to feel like a friendly game
 * world behind the hero. Renders as an absolutely-positioned background layer.
 */

function Shape({ children, position, color, speed = 1, rotationSpeed = 0.3 }) {
  const ref = useRef();
  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.x += delta * rotationSpeed;
      ref.current.rotation.y += delta * rotationSpeed * 0.7;
    }
  });
  return (
    <Float speed={speed} rotationIntensity={0.35} floatIntensity={0.8}>
      <group position={position}>
        <mesh ref={ref}>
          {children}
          <meshStandardMaterial
            color={color}
            roughness={0.3}
            metalness={0.15}
            emissive={color}
            emissiveIntensity={0.12}
          />
        </mesh>
      </group>
    </Float>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 5, 5]} intensity={1.4} color="#ffffff" />
      <pointLight position={[-6, -3, 2]} intensity={2.2} color="#F472B6" />
      <pointLight position={[6, 4, -2]} intensity={2} color="#2DD4BF" />

      <Shape position={[-3.2, 1.1, 0]} color="#7C3AED" speed={1.1}>
        <icosahedronGeometry args={[1, 0]} />
      </Shape>
      <Shape position={[3.4, 0.6, -1]} color="#FF8A3D" speed={0.9} rotationSpeed={0.5}>
        <torusGeometry args={[0.8, 0.32, 16, 40]} />
      </Shape>
      <Shape position={[-2.2, -1.6, -1]} color="#2DD4BF" speed={1.3}>
        <octahedronGeometry args={[0.95, 0]} />
      </Shape>
      <Shape position={[2.4, -1.4, 0.5]} color="#F472B6" speed={1} rotationSpeed={0.25}>
        <dodecahedronGeometry args={[0.85, 0]} />
      </Shape>
      <Shape position={[4.2, 2.2, -2.5]} color="#FBBF24" speed={1.2}>
        <sphereGeometry args={[0.7, 32, 32]} />
      </Shape>
      <Shape position={[-4.4, -2.2, -2.5]} color="#60A5FA" speed={0.8} rotationSpeed={0.4}>
        <icosahedronGeometry args={[0.6, 0]} />
      </Shape>
    </>
  );
}

export default function FloatingScene({ className = '' }) {
  return (
    <div className={`pointer-events-none absolute inset-0 ${className}`} aria-hidden="true">
      <Canvas camera={{ position: [0, 0, 7], fov: 50 }} dpr={[1, 2]}>
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  );
}

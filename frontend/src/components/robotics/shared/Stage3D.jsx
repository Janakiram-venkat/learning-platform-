import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { ContactShadows, Environment, Lightformer, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import useInView from './useInView';

// One WebGL support probe for the whole app. Creating a throwaway context is
// cheap, but doing it per widget is not, so the answer is cached.
let webglSupported = null;
function hasWebGL() {
  if (webglSupported !== null) return webglSupported;
  try {
    const canvas = document.createElement('canvas');
    webglSupported = !!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    webglSupported = false;
  }
  return webglSupported;
}

/**
 * The shared viewport for every robotics 3D scene.
 *
 * Handles the three things each scene would otherwise re-invent: consistent
 * workbench lighting, mounting the `<Canvas>` only while it's on screen (see
 * useInView), and a real fallback when the device has no WebGL — a chunk of
 * this course's audience is on shared low-end Android, and no lesson may
 * depend on a GPU to be completable.
 */
export default function Stage3D({
  children,
  camera = { position: [2.6, 1.9, 2.8], fov: 42 },
  // Grows with the sheet. `fov` is vertical, so a scene that gets wider without
  // getting taller just letterboxes — the robot ends up a small thing adrift in
  // a lot of floor. Keyed off the viewport *height* rather than a width
  // breakpoint, because a wide window is not necessarily a tall one and the
  // scene still has to leave room for the phase boxes underneath it.
  //
  // The last step is a container query on the lesson sheet: at that width the
  // readout has moved into WidgetShell's right rail, so the height it used to
  // occupy is free and the scene takes it.
  height = 'h-[300px] sm:h-[380px] lg:h-[min(52vh,520px)] @min-[68rem]:h-[min(64vh,680px)]',
  orbit = true,
  fallback,
  className = '',
}) {
  const [ref, inView] = useInView();
  const supported = hasWebGL();

  return (
    <div
      ref={ref}
      className={`relative ${height} w-full bg-[#0B180F] ${className}`}
    >
      {!supported ? (
        <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
          <span className="text-3xl">🤖</span>
          <p className="max-w-sm text-sm font-semibold text-white/70">
            {fallback || "This device cannot show 3D, so here is the short version. Everything below still works."}
          </p>
        </div>
      ) : inView ? (
        <Canvas
          dpr={[1, 2]}
          shadows="soft"
          camera={{ ...camera, near: 0.1, far: 60 }}
          gl={{ antialias: true, powerPreference: 'high-performance' }}
          // Filmic response instead of the default clamp. Without it the lit
          // side of every part washes out to a flat block of colour and the
          // shading that sells a curved surface is thrown away in the top stop.
          onCreated={({ gl }) => {
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.05;
          }}
        >
          <color attach="background" args={['#0B180F']} />

          {/*
            A studio built out of light panels, baked once into a cube map. It
            costs one render at mount and no network at all — drei's named
            presets fetch an HDR from a CDN, which this course cannot rely on.

            It is doing the heavy lifting for realism: metalness is meaningless
            without something to reflect, so before this the aluminium and the
            polished caster were just flat grey. The panels are placed where a
            photographer would put them — a big soft key above, a long strip
            each side for the edge highlights that describe an object's shape.
          */}
          <Environment resolution={128}>
            <Lightformer intensity={2.4} position={[0, 5, 1]} scale={[9, 5, 1]} rotation={[Math.PI / 2, 0, 0]} color="#f3fbf7" />
            <Lightformer intensity={1.1} position={[-5, 2, 1]} scale={[1, 7, 1]} rotation={[0, Math.PI / 2, 0]} color="#23B5D3" />
            <Lightformer intensity={0.9} position={[5, 2, -1]} scale={[1, 7, 1]} rotation={[0, -Math.PI / 2, 0]} color="#9fe8d0" />
            <Lightformer intensity={0.5} position={[0, -3, 0]} scale={[9, 9, 1]} rotation={[-Math.PI / 2, 0, 0]} color="#0B180F" />
          </Environment>

          <hemisphereLight args={['#cfe8dd', '#0B180F', 0.35]} />
          <directionalLight
            castShadow
            position={[4, 6, 3]}
            intensity={2.1}
            shadow-mapSize={[2048, 2048]}
            // Contact between a wheel and the floor is where a shadow either
            // convinces or doesn't. normalBias pulls the sample off curved
            // surfaces so they stop shadowing themselves into stripes.
            shadow-bias={-0.0006}
            shadow-normalBias={0.02}
            shadow-camera-near={1}
            shadow-camera-far={18}
            shadow-camera-left={-6}
            shadow-camera-right={6}
            shadow-camera-top={6}
            shadow-camera-bottom={-6}
          />
          {/* Rim light from behind: separates the robot from a dark floor. */}
          <directionalLight position={[-3, 2.5, -4]} intensity={0.9} color="#7fd8f0" />
          <pointLight position={[-4, 2, -3]} intensity={12} color="#23B5D3" distance={14} />
          <Suspense fallback={null}>{children}</Suspense>
          <ContactShadows position={[0, 0.001, 0]} opacity={0.62} blur={1.6} scale={12} far={2.5} resolution={512} />
          {orbit && (
            <OrbitControls
              makeDefault
              enablePan={false}
              enableDamping
              dampingFactor={0.08}
              minPolarAngle={0.25}
              maxPolarAngle={1.45}
              minDistance={2}
              maxDistance={9}
            />
          )}
        </Canvas>
      ) : null}

      {supported && (
        <span className="pointer-events-none absolute bottom-2 right-3 font-mono-lab text-[10px] uppercase tracking-wider text-white/35">
          drag to rotate · scroll to zoom
        </span>
      )}
    </div>
  );
}

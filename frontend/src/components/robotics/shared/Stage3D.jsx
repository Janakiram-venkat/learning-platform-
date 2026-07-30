import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { ContactShadows, OrbitControls } from '@react-three/drei';
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
          shadows
          camera={{ ...camera, near: 0.1, far: 60 }}
          gl={{ antialias: true }}
        >
          <color attach="background" args={['#0B180F']} />
          <hemisphereLight args={['#cfe8dd', '#0B180F', 0.75]} />
          <directionalLight
            castShadow
            position={[4, 6, 3]}
            intensity={1.5}
            shadow-mapSize={[1024, 1024]}
          />
          <pointLight position={[-4, 2, -3]} intensity={18} color="#23B5D3" distance={14} />
          <Suspense fallback={null}>{children}</Suspense>
          <ContactShadows position={[0, -0.001, 0]} opacity={0.5} blur={2.2} scale={12} far={4} />
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

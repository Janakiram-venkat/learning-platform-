import { Suspense, lazy } from 'react';

/**
 * Interactive lesson blocks, looked up by `kind`.
 *
 * A lesson's content array can hold `{ "type": "widget", "kind": "robot-zoo" }`
 * and the rest of the block is handed to the component as `block` — so the
 * copy inside a widget still lives in the course JSON, not in the bundle.
 *
 * Every entry is lazy: the robotics widgets pull in three.js, and a Python
 * lesson must never pay for that. Adding a widget is one line here.
 */
const WIDGETS = {
  'sense-think-act': lazy(() => import('../robotics/SenseThinkActLoop')),
  'robot-zoo': lazy(() => import('../robotics/RobotZoo')),
  'machine-vs-robot': lazy(() => import('../robotics/MachineVsRobot')),
  'robot-timeline': lazy(() => import('../robotics/RobotTimeline')),
  'robot-bench': lazy(() => import('../robotics/RobotBenchWidget')),
  'part-hunt': lazy(() => import('../robotics/PartHunt')),
  'sort-bins': lazy(() => import('../robotics/SortBins')),
  classify: lazy(() => import('../robotics/ClassifyParts')),
  'design-card': lazy(() => import('../robotics/DesignCard')),
  'water-circuit': lazy(() => import('../robotics/WaterCircuit')),
  'circuit-sandbox': lazy(() => import('../robotics/CircuitSandbox')),
  'gpio-pinout': lazy(() => import('../robotics/GpioPinout')),
  'digital-signal': lazy(() => import('../robotics/DigitalSignal')),
  'pwm-sim': lazy(() => import('../robotics/PwmSim')),
  'h-bridge': lazy(() => import('../robotics/HBridge')),
  'motor-bench': lazy(() => import('../robotics/MotorBench')),
  'drive-trainer': lazy(() => import('../robotics/DriveTrainer')),
  'servo-dial': lazy(() => import('../robotics/ServoDial')),
  'stepper-sim': lazy(() => import('../robotics/StepperSim')),
  'gear-ratio': lazy(() => import('../robotics/GearRatio')),
  'ultrasonic-sim': lazy(() => import('../robotics/UltrasonicSim')),
  'ir-sim': lazy(() => import('../robotics/IRSim')),
  'line-follow-table': lazy(() => import('../robotics/LineFollowTable')),
  'button-debounce': lazy(() => import('../robotics/ButtonDebounce')),
  'camera-pixels': lazy(() => import('../robotics/CameraPixels')),
  'lidar-sweep': lazy(() => import('../robotics/LidarSweep')),
  'waveform-sim': lazy(() => import('../robotics/WaveformSim')),
  'rgb-mix': lazy(() => import('../robotics/RgbMix')),
  'block-maze': lazy(() => import('../robotics/BlockMaze')),
  'robot-code': lazy(() => import('../robotics/RobotCode')),
  'rules-vs-learning': lazy(() => import('../robotics/RulesVsLearning')),
  'training-lab': lazy(() => import('../robotics/TrainingLab')),
  'detection-reveal': lazy(() => import('../robotics/DetectionReveal')),
  'pipeline-stages': lazy(() => import('../robotics/PipelineStages')),
};

function WidgetSkeleton() {
  return (
    <div className="my-8 flex h-[360px] items-center justify-center rounded-2xl border-2 border-ink bg-[#0B180F] shadow-[4px_4px_0_rgba(22,36,29,0.9)]">
      <p className="animate-pulse font-mono-lab text-sm text-white/50">warming up the bench…</p>
    </div>
  );
}

export default function LessonWidget({ block }) {
  const Widget = WIDGETS[block?.kind];
  // An unknown kind is a content bug, not a crash: skip it and keep reading.
  if (!Widget) return null;

  return (
    <Suspense fallback={<WidgetSkeleton />}>
      <Widget block={block} />
    </Suspense>
  );
}

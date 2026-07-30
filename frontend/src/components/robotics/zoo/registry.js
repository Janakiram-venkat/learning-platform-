import {
  IndustrialArm,
  SurgicalRobot,
  Humanoid,
  MarsRover,
  BombDisposal,
  VacuumRobot,
  DeliveryBot,
  Quadcopter,
} from './ZooModels';

/**
 * `id` in the lesson JSON -> the model that represents it, plus how to frame
 * it. Each family is a different size, and this keeps them all sitting the
 * same way on the turntable.
 */
export const ZOO = {
  'industrial-arm': { Model: IndustrialArm, scale: 1.15, y: -0.35 },
  surgical: { Model: SurgicalRobot, scale: 1.0, y: -0.5 },
  humanoid: { Model: Humanoid, scale: 1.3, y: -0.55 },
  rover: { Model: MarsRover, scale: 1.35, y: -0.3 },
  'bomb-disposal': { Model: BombDisposal, scale: 1.3, y: -0.3 },
  vacuum: { Model: VacuumRobot, scale: 1.5, y: -0.15 },
  delivery: { Model: DeliveryBot, scale: 1.25, y: -0.35 },
  quadcopter: { Model: Quadcopter, scale: 1.5, y: -0.2 },
};

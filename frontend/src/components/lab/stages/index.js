// The stage registry: a lab stage's `type` in JSON maps to the component that
// renders it. Adding a new stage type is a new file here plus one line in this
// map — the runner itself never changes.
//
// Every stage takes `{ stage, onComplete }`. RewardsStage is the exception: it
// closes the lab rather than completing a step, so it also needs the course
// context to work out where the student goes next.

import WelcomeStage from './WelcomeStage';
import PickStage from './PickStage';
import SortStage from './SortStage';
import ChooseStage from './ChooseStage';
import ExploreStage from './ExploreStage';
import TrainStage from './TrainStage';
import DataQualityStage from './DataQualityStage';
import DesignStage from './DesignStage';
import QuizStage from './QuizStage';
import RewardsStage from './RewardsStage';

export const STAGES = {
  welcome: WelcomeStage,
  pick: PickStage,
  sort: SortStage,
  choose: ChooseStage,
  explore: ExploreStage,
  train: TrainStage,
  dataquality: DataQualityStage,
  design: DesignStage,
  quiz: QuizStage,
  rewards: RewardsStage,
};

// The closing screen doesn't have a "complete" action and isn't skippable.
export const TERMINAL_STAGE = 'rewards';

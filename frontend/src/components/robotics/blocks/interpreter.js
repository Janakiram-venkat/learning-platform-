import { cellAhead, isOpen } from './mazes';

const ACTION_BUDGET = 300; // guards a mis-used "repeat forever"

function countBlocks(list) {
  return list.reduce((n, b) => {
    n += 1;
    if (b.children) n += countBlocks(b.children);
    if (b.elseChildren) n += countBlocks(b.elseChildren);
    return n;
  }, 0);
}

function usesControlFlow(list) {
  return list.some((b) => b.type === 'repeat' || b.type === 'if');
}

/**
 * Runs a block program against a maze grid. Primitive actions consume one
 * unit of a shared budget so a mis-used "repeat forever" can't hang the
 * interpreter — it just stops early, same "honest safety cap" idea used
 * throughout this course (the Module 10 robot.py tick budget is the same
 * concept, one level up).
 */
export function runProgram(blocks, maze) {
  const state = { row: maze.start.row, col: maze.start.col, facing: maze.facing };
  const trace = [{ ...state }];
  let budget = ACTION_BUDGET;
  let solved = false;
  let bumped = false;

  const atGoal = () => state.row === maze.goal.row && state.col === maze.goal.col;

  const forward = () => {
    const next = cellAhead(maze.grid, state.row, state.col, state.facing);
    if (isOpen(maze.grid, next.row, next.col)) {
      state.row = next.row;
      state.col = next.col;
    } else {
      bumped = true;
    }
    trace.push({ ...state });
  };
  const turn = (delta) => {
    state.facing = (state.facing + delta + 4) % 4;
    trace.push({ ...state });
  };
  const wallAhead = () => {
    const next = cellAhead(maze.grid, state.row, state.col, state.facing);
    return !isOpen(maze.grid, next.row, next.col);
  };

  function run(list) {
    for (const block of list) {
      if (budget <= 0 || atGoal()) return;
      switch (block.type) {
        case 'forward': budget -= 1; forward(); break;
        case 'left': budget -= 1; turn(-1); break;
        case 'right': budget -= 1; turn(1); break;
        case 'repeat': {
          const times = block.count === 'forever' ? Infinity : Math.max(0, Number(block.count) || 0);
          for (let i = 0; i < times; i++) {
            if (budget <= 0 || atGoal()) return;
            run(block.children || []);
          }
          break;
        }
        case 'if': {
          run(wallAhead() ? (block.children || []) : (block.elseChildren || []));
          break;
        }
        default: break;
      }
      if (atGoal()) { solved = true; return; }
    }
  }

  run(blocks);
  solved = solved || atGoal();

  return {
    trace,
    solved,
    bumped,
    budgetExceeded: budget <= 0 && !solved,
    blockCount: countBlocks(blocks),
    usesControlFlow: usesControlFlow(blocks),
  };
}

export function starsFor(result) {
  if (!result.solved) return 0;
  if (result.usesControlFlow) return 3;
  if (result.blockCount <= 8) return 2;
  return 1;
}

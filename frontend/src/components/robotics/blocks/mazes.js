// Grids: 0 = open, 1 = wall. Robot starts at `start` facing `facing` (0=N,1=E,2=S,3=W).
export const MAZES = {
  basic: {
    grid: [
      [0, 0, 0, 0, 0],
      [1, 1, 1, 1, 0],
      [0, 0, 0, 0, 0],
      [0, 1, 1, 1, 1],
      [0, 0, 0, 0, 0],
    ],
    start: { row: 0, col: 0 },
    facing: 1,
    goal: { row: 4, col: 4 },
  },
  staircase: {
    grid: [
      [0, 1, 1, 1, 1],
      [0, 0, 1, 1, 1],
      [1, 0, 0, 1, 1],
      [1, 1, 0, 0, 1],
      [1, 1, 1, 0, 0],
    ],
    start: { row: 0, col: 0 },
    facing: 2,
    goal: { row: 4, col: 4 },
  },
  avoider: {
    grid: [
      [0, 0, 0, 0, 0, 0],
      [0, 1, 1, 0, 1, 0],
      [0, 0, 1, 0, 1, 0],
      [0, 1, 1, 0, 1, 0],
      [0, 1, 0, 0, 1, 0],
      [0, 1, 0, 1, 1, 0],
    ],
    start: { row: 0, col: 0 },
    facing: 2,
    goal: { row: 5, col: 5 },
  },
};

const DELTAS = [[-1, 0], [0, 1], [1, 0], [0, -1]]; // N, E, S, W

export function inBounds(grid, row, col) {
  return row >= 0 && row < grid.length && col >= 0 && col < grid[0].length;
}

export function isOpen(grid, row, col) {
  return inBounds(grid, row, col) && grid[row][col] === 0;
}

export function cellAhead(grid, row, col, facing) {
  const [dr, dc] = DELTAS[facing];
  return { row: row + dr, col: col + dc };
}

// World specs for Module 10's real-Python robot sim. Plain data, embedded as
// JSON into the generated Python script (see buildScript.js) — no JS-side
// physics needed here, since Python owns the whole simulation.
export const WORLDS = {
  obstacleRoom: {
    width: 300,
    height: 200,
    start: { x: 20, y: 100, heading: 0 },
    obstacles: [
      { x: 110, y: 30, w: 18, h: 70 },
      { x: 110, y: 150, w: 18, h: 40 },
      { x: 190, y: 60, w: 18, h: 140 },
    ],
    goal: { x: 275, y: 100, r: 16 },
    line: null,
  },
  lineTrack: {
    width: 300,
    height: 160,
    start: { x: 15, y: 80, heading: 0 },
    obstacles: [],
    goal: { x: 285, y: 80, r: 16 },
    line: { amp: 35, freq: 65, baseY: 80 },
  },
  warehouse: {
    width: 340,
    height: 220,
    start: { x: 18, y: 20, heading: 1.5708 },
    obstacles: [
      { x: 60, y: 60, w: 60, h: 18 },
      { x: 180, y: 60, w: 60, h: 18 },
      { x: 60, y: 140, w: 60, h: 18 },
      { x: 180, y: 140, w: 60, h: 18 },
      { x: 150, y: 30, w: 18, h: 60 },
    ],
    goal: { x: 315, y: 200, r: 16 },
    line: null,
  },
};

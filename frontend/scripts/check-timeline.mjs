// Headless check of the process-timeline engine and the lessons that use it.
// Run from the frontend folder:  node scripts/check-timeline.mjs
import assert from 'node:assert/strict';
import { blendStages, mixColour, validateStages } from '../src/lib/timeline.js';
import { WIDGET_BLOCKS } from '../src/data/chemistry.js';

let passed = 0;
function check(name, fn) {
  try {
    fn();
    passed += 1;
    console.log(`  ok   ${name}`);
  } catch (err) {
    console.error(`  FAIL ${name}\n       ${err.message}`);
    process.exitCode = 1;
  }
}

console.log('Process timeline');

// Every timeline block in the course must be sound.
const timelines = Object.entries(WIDGET_BLOCKS).filter(([, b]) => b.kind === 'process-timeline');
check('there is at least one timeline lesson', () => assert.ok(timelines.length >= 1));
for (const [id, b] of timelines) {
  check(`${id}: stages and gauges have no authoring mistakes`, () => {
    assert.deepEqual(validateStages(b.stages, b.gauges), []);
  });
}

const coal = WIDGET_BLOCKS['chem-coal-formation'];
const at = (p) => blendStages(coal.stages, p);
const layer = (view, key) => view.layers.find((l) => l.key === key);

check('whole numbers land exactly on a stage', () => {
  for (let i = 0; i < coal.stages.length; i += 1) assert.equal(at(i).stage, i);
});

check('out-of-range and bad positions are clamped, never a crash', () => {
  assert.equal(at(-5).stage, 0);
  assert.equal(at(999).stage, coal.stages.length - 1);
  assert.equal(at(NaN).stage, 0);
  assert.equal(blendStages([], 0), null);
});

check('halfway between stages blends the layer heights', () => {
  const mid = layer(at(0.5), 'organic').h;
  assert.ok(mid > 12 && mid < 18, `organic layer should be between 12 and 18, got ${mid}`);
});

check('a layer that appears later grows in from nothing', () => {
  assert.equal(layer(at(0), 'mud'), undefined);
  assert.equal(layer(at(1), 'mud'), undefined);
  assert.equal(layer(at(2), 'mud').h, 40);
  const grow = layer(at(1.5), 'mud').h;
  assert.ok(grow > 0 && grow < 40, `mud should be part-grown, got ${grow}`);
});

check('the plant layer turns from green to coal-black as time passes', () => {
  assert.equal(layer(at(0), 'organic').colour, 'rgb(91, 138, 58)');
  assert.equal(layer(at(5), 'organic').colour, 'rgb(22, 22, 22)');
});

check('pressure and heat only ever go up through the coal stages', () => {
  let prevP = -1;
  let prevH = -1;
  for (let p = 0; p <= coal.stages.length - 1; p += 0.25) {
    const g = at(p).gauges;
    assert.ok(g.pressure >= prevP - 1e-9, `pressure fell at ${p}`);
    assert.ok(g.heat >= prevH - 1e-9, `heat fell at ${p}`);
    prevP = g.pressure;
    prevH = g.heat;
  }
  assert.ok(at(5).gauges.pressure > 0.9);
});

check('trees topple (they glide) and then fade away once buried', () => {
  assert.equal(at(0).items.find((i) => i.id === 'tree1').rot, 0);
  assert.equal(at(1).items.find((i) => i.id === 'tree1').rot, 80);
  const falling = at(0.5).items.find((i) => i.id === 'tree1');
  assert.ok(falling.rot > 0 && falling.rot < 80 && falling.opacity === 1);
  const burying = at(1.5).items.find((i) => i.id === 'tree1');
  assert.ok(burying.opacity > 0.4 && burying.opacity < 0.6, `half faded, got ${burying.opacity}`);
  assert.equal(at(2).items.length, 0);
});

check('the mine tools only appear in the last stage', () => {
  assert.equal(at(5).items.length, 0);
  const last = at(6).items;
  assert.deepEqual(last.map((i) => i.id).sort(), ['ladder', 'pick']);
  assert.ok(last.every((i) => i.front), 'mine tools are drawn in front of the ground');
});

check('the seam sits under the mud and soil, which stack on top of it', () => {
  const order = at(6).layers.map((l) => l.key);
  assert.deepEqual(order, ['rock', 'organic', 'mud', 'soil']);
});

check('mixColour end points are exact', () => {
  assert.equal(mixColour('#000000', '#ffffff', 0), 'rgb(0, 0, 0)');
  assert.equal(mixColour('#000000', '#ffffff', 1), 'rgb(255, 255, 255)');
  assert.equal(mixColour('#fff', '#000', 0.5), 'rgb(128, 128, 128)');
});

check('validateStages catches a bad timeline', () => {
  const bad = [
    { id: 'a', title: 't', time: 'x', body: 'b', layers: [{ key: 'k', colour: 'green', h: 5 }], gauges: { heat: 2 } },
    { id: 'a', title: 't', time: 'x', body: 'b', items: [{ id: 'i', x: 1, y: 2 }] },
  ];
  const problems = validateStages(bad, []).join(' | ');
  assert.ok(problems.includes('not a #hex colour'));
  assert.ok(problems.includes('not declared'));
  assert.ok(problems.includes('between 0 and 1'));
  assert.ok(problems.includes('duplicate id'));
  assert.ok(problems.includes('has no emoji'));
  assert.ok(validateStages([bad[0]]).join('').includes('at least two stages'));
});

console.log(`\n${passed} checks passed${process.exitCode ? ', some FAILED' : ''}`);

/**
 * Pure logic for the `process-timeline` engine: no DOM, no React.
 *
 * A timeline is a list of stages. The student scrubs a position `p` from 0 to
 * (stages - 1); `blendStages` works out what the scene looks like at that
 * point by blending the two stages either side of it. Everything that can
 * change smoothly does: the thickness and colour of each ground layer, the sky,
 * the gauges, and where each emoji item sits and how visible it is.
 *
 * Stage shape:
 *   id, title, time (the chip text), body (the card text)
 *   sky     optional #hex
 *   layers  [{ key, colour, h }]   h is height in scene pixels. Layers stack
 *           from the ground up; order is the order keys first appear across
 *           all the stages, so list the oldest layer first.
 *   gauges  { [gaugeId]: 0..1 }
 *   items   [{ id, emoji, x, y, size, rot, front }]  an item with the same id
 *           in neighbouring stages glides between them; otherwise it fades.
 *           Items sit BEHIND the ground layers unless `front: true`, so a
 *           log that gets covered by mud really does disappear under it.
 */

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const lerp = (a, b, f) => a + (b - a) * f;
const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

function toRgb(hex) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.replace(/./g, '$&$&') : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Blend two #hex colours; f = 0 gives `a`, f = 1 gives `b`. */
export function mixColour(a, b, f) {
  const [r1, g1, b1] = toRgb(a);
  const [r2, g2, b2] = toRgb(b);
  return `rgb(${Math.round(lerp(r1, r2, f))}, ${Math.round(lerp(g1, g2, f))}, ${Math.round(lerp(b1, b2, f))})`;
}

const DEFAULT_SKY = '#cfe9f2';

/** What the scene looks like at position `p`. Returns null for an empty list. */
export function blendStages(stages, p) {
  if (!Array.isArray(stages) || stages.length === 0) return null;

  const last = stages.length - 1;
  const pos = clamp(Number.isFinite(p) ? p : 0, 0, last);
  const i = Math.floor(pos);
  const j = Math.min(last, i + 1);
  const f = pos - i;
  const A = stages[i];
  const B = stages[j];

  // Layers, oldest first.
  const order = [];
  for (const s of stages) {
    for (const l of s.layers || []) if (!order.includes(l.key)) order.push(l.key);
  }
  const layers = order
    .map((key) => {
      const la = (A.layers || []).find((l) => l.key === key);
      const lb = (B.layers || []).find((l) => l.key === key);
      if (!la && !lb) return null;
      const h = lerp(la ? la.h : 0, lb ? lb.h : 0, f);
      const colour = la && lb ? mixColour(la.colour, lb.colour, f) : toCss((la || lb).colour);
      return { key, colour, h };
    })
    .filter((l) => l && l.h > 0.05);

  const gaugeIds = [...new Set(stages.flatMap((s) => Object.keys(s.gauges || {})))];
  const gauges = Object.fromEntries(
    gaugeIds.map((id) => [id, lerp(A.gauges?.[id] ?? 0, B.gauges?.[id] ?? 0, f)]),
  );

  const itemIds = [...new Set([...(A.items || []), ...(B.items || [])].map((it) => it.id))];
  const items = itemIds
    .map((id) => {
      const ia = (A.items || []).find((it) => it.id === id);
      const ib = (B.items || []).find((it) => it.id === id);
      const from = ia || ib;
      const to = ib || ia;
      return {
        id,
        emoji: from.emoji,
        front: Boolean(from.front),
        x: lerp(from.x, to.x, f),
        y: lerp(from.y, to.y, f),
        size: lerp(from.size ?? 32, to.size ?? 32, f),
        rot: lerp(from.rot ?? 0, to.rot ?? 0, f),
        opacity: lerp(ia ? 1 : 0, ib ? 1 : 0, f),
      };
    })
    .filter((it) => it.opacity > 0.02);

  return {
    pos,
    stage: Math.round(pos),
    sky: mixColour(A.sky || DEFAULT_SKY, B.sky || DEFAULT_SKY, f),
    layers,
    gauges,
    items,
  };
}

function toCss(hex) {
  const [r, g, b] = toRgb(hex);
  return `rgb(${r}, ${g}, ${b})`;
}

/** Catch authoring mistakes before a student does. Empty list = sound. */
export function validateStages(stages, gauges = []) {
  const problems = [];
  if (!Array.isArray(stages) || stages.length < 2) {
    return ['a timeline needs at least two stages'];
  }
  const gaugeIds = new Set(gauges.map((g) => g.id));
  const stageIds = new Set();

  stages.forEach((s, n) => {
    const name = s.id || `stage ${n + 1}`;
    if (!s.id) problems.push(`${name}: missing id`);
    else if (stageIds.has(s.id)) problems.push(`${name}: duplicate id`);
    stageIds.add(s.id);
    for (const field of ['title', 'time', 'body']) {
      if (!s[field]) problems.push(`${name}: missing ${field}`);
    }
    if (s.sky && !HEX.test(s.sky)) problems.push(`${name}: sky "${s.sky}" is not a #hex colour`);

    const keys = new Set();
    for (const l of s.layers || []) {
      if (!l.key) problems.push(`${name}: a layer has no key`);
      if (keys.has(l.key)) problems.push(`${name}: layer "${l.key}" listed twice`);
      keys.add(l.key);
      if (!HEX.test(l.colour || '')) problems.push(`${name}: layer "${l.key}" colour is not a #hex colour`);
      if (!(l.h >= 0)) problems.push(`${name}: layer "${l.key}" needs h of 0 or more`);
    }
    for (const [id, v] of Object.entries(s.gauges || {})) {
      if (!gaugeIds.has(id)) problems.push(`${name}: gauge "${id}" is not declared in the block's gauges`);
      if (!(v >= 0 && v <= 1)) problems.push(`${name}: gauge "${id}" must be between 0 and 1`);
    }
    const itemIds = new Set();
    for (const it of s.items || []) {
      if (!it.id) problems.push(`${name}: an item has no id`);
      if (itemIds.has(it.id)) problems.push(`${name}: item "${it.id}" listed twice`);
      itemIds.add(it.id);
      if (!it.emoji) problems.push(`${name}: item "${it.id}" has no emoji`);
      if (typeof it.x !== 'number' || typeof it.y !== 'number') problems.push(`${name}: item "${it.id}" needs numeric x and y`);
    }
  });
  return problems;
}

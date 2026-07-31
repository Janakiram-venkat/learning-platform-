import * as THREE from 'three';

/**
 * Procedurally generated surfaces for the robotics scenes.
 *
 * The course has no asset pipeline on purpose (see RobotBot), but untextured
 * `meshStandardMaterial` reads as moulded plastic no matter how good the
 * lighting is — real surfaces have grain, scratches and a roughness that varies
 * across the part. So the maps are drawn into a canvas at load time instead of
 * downloaded: a few milliseconds of maths buys brushed aluminium, rubber tread
 * and an actual PCB with copper on it, and the course still ships as one JS
 * bundle with no CDN to be blocked by a school firewall.
 *
 * Everything here is memoised at module scope and never disposed. That is
 * deliberate: the set is small and fixed (~8 canvases at 256², a couple of MB on
 * the GPU) and it is shared by every widget, so a lesson that unmounts its scene
 * must not pull the textures out from under the next one. Variants that differ
 * only in tiling are `.clone()`s, which in three share one `source` and
 * therefore one GPU upload.
 *
 * Generation runs on the main thread during the first render that needs it, so
 * the cost is a hard budget rather than a nice-to-have: the whole set has to
 * stay inside a frame or two on a cheap phone. Two things keep it there — an
 * integer hash instead of the usual `Math.sin` trick, and `field()` below, which
 * samples each noise pattern once into a Float32Array that the colour, height
 * and roughness maps then all read from instead of recomputing it three times.
 */

const SIZE = 256;
const cache = new Map();

function memo(key, make) {
  let hit = cache.get(key);
  if (!hit) {
    hit = make();
    cache.set(key, hit);
  }
  return hit;
}

function canvasOf(size = SIZE) {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  return c;
}

// --- noise ----------------------------------------------------------------

/**
 * Integer bit-mix hash → [0,1). Deterministic, so the bench looks the same on
 * every device and every reload rather than shimmering into a new pattern each
 * time a lesson is opened.
 */
function hash(x, y) {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** Value noise on a grid that wraps at (pu, pv), so the map tiles seamlessly. */
function noise2(u, v, pu, pv) {
  const xi = Math.floor(u);
  const yi = Math.floor(v);
  const xf = u - xi;
  const yf = v - yi;
  const s = xf * xf * (3 - 2 * xf);
  const t = yf * yf * (3 - 2 * yf);
  const x0 = ((xi % pu) + pu) % pu;
  const y0 = ((yi % pv) + pv) % pv;
  const x1 = (x0 + 1) % pu;
  const y1 = (y0 + 1) % pv;
  const a = hash(x0, y0);
  const b = hash(x1, y0);
  const c = hash(x0, y1);
  const d = hash(x1, y1);
  return (a * (1 - s) + b * s) * (1 - t) + (c * (1 - s) + d * s) * t;
}

/**
 * Fractal noise sampled across the whole tile, once, into a Float32Array.
 *
 * `sx`/`sy` are the feature size in pixels; passing them separately is what
 * stretches noise into the parallel streaks that make brushed metal look
 * brushed. Cached by shape, so two surfaces asking for the same grain share the
 * work.
 */
function field(sx, sy = sx, octaves = 4, size = SIZE) {
  return memo(`field:${size}:${sx}:${sy}:${octaves}`, () => {
    // Snap the period to whole cells, or the pattern does not line up with
    // itself at the tile edge and every repeat shows a seam.
    const pu0 = Math.max(1, Math.round(size / sx));
    const pv0 = Math.max(1, Math.round(size / sy));
    const out = new Float32Array(size * size);
    let amp = 0.5;
    let norm = 0;

    for (let o = 0; o < octaves; o += 1) {
      const pu = pu0 << o;
      const pv = pv0 << o;
      for (let y = 0; y < size; y += 1) {
        const v = (y * pv) / size;
        const row = y * size;
        for (let x = 0; x < size; x += 1) {
          out[row + x] += noise2((x * pu) / size, v, pu, pv) * amp;
        }
      }
      norm += amp;
      amp *= 0.5;
    }
    for (let i = 0; i < out.length; i += 1) out[i] /= norm;
    return out;
  });
}

/** Read a canvas's red channel into a Float32Array, for use as a mask. */
function maskOf(canvas) {
  const size = canvas.width;
  const src = canvas.getContext('2d').getImageData(0, 0, size, size).data;
  const out = new Float32Array(size * size);
  for (let i = 0; i < out.length; i += 1) out[i] = src[i << 2] / 255;
  return out;
}

/**
 * Sobel a height field into a tangent-space normal map.
 *
 * This is where most of the realism actually comes from. A colour map alone
 * still lights like a flat sheet; a normal map makes the light break over every
 * scratch and tread block as the student orbits, which is the cue the eye reads
 * as "this is a real object".
 */
function normalFromHeight(height, size, strength) {
  const out = canvasOf(size);
  const ctx = out.getContext('2d');
  const img = ctx.createImageData(size, size);
  // Wraps at the edges, so a tiled map has no seam running through it.
  const at = (x, y) => height[((y + size) % size) * size + ((x + size) % size)];

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const dx = (at(x - 1, y) - at(x + 1, y)) * strength;
      const dy = (at(x, y - 1) - at(x, y + 1)) * strength;
      const inv = 1 / Math.sqrt(dx * dx + dy * dy + 1);
      const i = (y * size + x) << 2;
      img.data[i] = (dx * inv * 0.5 + 0.5) * 255;
      img.data[i + 1] = (dy * inv * 0.5 + 0.5) * 255;
      img.data[i + 2] = (inv * 0.5 + 0.5) * 255;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return out;
}

/** Paint a per-pixel function into a canvas. `fn(i, data, p)` writes 0..255. */
function paint(size, fn) {
  const c = canvasOf(size);
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(size, size);
  // `fn` writes its three channels straight into the buffer rather than
  // returning them. Returning `[r,g,b]` would allocate a throwaway array per
  // pixel — 65k of them per map, which measured as a third of the cost of
  // generating one surface.
  for (let i = 0; i < size * size; i += 1) {
    const p = i << 2;
    fn(i, img.data, p);
    img.data[p + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

/** Grey canvas from a 0..1 function, for roughness maps. */
function paintGrey(size, fn) {
  return paint(size, (i, d, p) => {
    const v = fn(i) * 255;
    d[p] = v;       // Uint8ClampedArray clamps for us
    d[p + 1] = v;
    d[p + 2] = v;
  });
}

/** Float32Array from a 0..1 function, for height fields. */
function buildHeight(size, fn) {
  const out = new Float32Array(size * size);
  for (let i = 0; i < out.length; i += 1) out[i] = fn(i);
  return out;
}

// --- texture plumbing -----------------------------------------------------

function toTexture(canvas, srgb) {
  const t = new THREE.CanvasTexture(canvas);
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  // Colour maps carry sRGB values; normal and roughness maps are raw data and
  // must not be gamma-decoded or the lighting comes out wrong.
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  return t;
}

/**
 * Tiling variant of a cached map. Clones share `source`, so ten different
 * repeats of the same tread pattern are still one texture on the GPU.
 */
function tiled(tex, rx, ry, key) {
  if (rx === 1 && ry === 1) return tex;
  return memo(`${key}@${rx}x${ry}`, () => {
    const clone = tex.clone();
    clone.repeat.set(rx, ry);
    clone.needsUpdate = true;
    return clone;
  });
}

/**
 * Build a {map, normalMap, roughnessMap} set once, then tile it on request.
 *
 * The returned maps already carry the surface's colour, so a material using
 * them wants no `color` of its own — tinting on top would multiply the hue in
 * twice and darken the part.
 */
function surface(key, build) {
  const base = memo(`surface:${key}`, () => {
    const { color, height, rough, normalStrength = 2.0, size = SIZE } = build();
    return {
      map: toTexture(color, true),
      normalMap: toTexture(normalFromHeight(height, size, normalStrength), false),
      roughnessMap: rough ? toTexture(rough, false) : null,
    };
  });

  return (rx = 1, ry = rx) => ({
    map: tiled(base.map, rx, ry, `${key}:map`),
    normalMap: tiled(base.normalMap, rx, ry, `${key}:nrm`),
    roughnessMap: base.roughnessMap ? tiled(base.roughnessMap, rx, ry, `${key}:rgh`) : null,
  });
}

function rgb(hex) {
  const c = new THREE.Color(hex);
  return [c.r * 255, c.g * 255, c.b * 255];
}

// --- the surfaces ---------------------------------------------------------

/**
 * Powder-coated metal: an even matte coat over a slightly uneven substrate,
 * with a handful of scratches worn through to brighter metal. Used for the
 * chassis and anything a student would think of as "the painted bit".
 *
 * Tinted per part, so the cache key carries the colour.
 */
export function paintedShell(hex) {
  return surface(`paint:${hex}`, () => {
    const [br, bg, bb] = rgb(hex);
    const grain = field(14, 14, 4);

    // Where the coat has been rubbed through. Drawn as strokes rather than
    // noise so they read as directional wear, not as dirt.
    const scratch = canvasOf();
    const sctx = scratch.getContext('2d');
    sctx.fillStyle = '#000';
    sctx.fillRect(0, 0, SIZE, SIZE);
    sctx.lineCap = 'round';
    for (let i = 0; i < 26; i += 1) {
      const x = hash(i, 3) * SIZE;
      const y = hash(i, 7) * SIZE;
      const len = 6 + hash(i, 11) * 34;
      const ang = hash(i, 13) * Math.PI;
      sctx.strokeStyle = `rgba(255,255,255,${0.25 + hash(i, 17) * 0.5})`;
      sctx.lineWidth = 0.6 + hash(i, 19) * 1.1;
      sctx.beginPath();
      sctx.moveTo(x, y);
      sctx.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len);
      sctx.stroke();
    }
    const wear = maskOf(scratch);

    return {
      color: paint(SIZE, (i, d, p) => {
        const g = 0.86 + grain[i] * 0.24;   // orange-peel in the coat
        const w = wear[i];
        // A scratch shows the metal underneath: brighter and desaturated.
        d[p] = br * g * (1 - w) + 205 * w;
        d[p + 1] = bg * g * (1 - w) + 210 * w;
        d[p + 2] = bb * g * (1 - w) + 205 * w;
      }),
      height: buildHeight(SIZE, (i) => 0.5 + grain[i] * 0.35 - wear[i] * 0.45),
      // Bare metal in a scratch is shinier than the coat around it.
      rough: paintGrey(SIZE, (i) => 0.62 + grain[i] * 0.14 - wear[i] * 0.35),
      normalStrength: 1.4,
    };
  });
}

/**
 * Brushed aluminium: fine parallel grooves running one way. The anisotropy is
 * the whole point — it is what makes a machined bracket look machined when the
 * highlight slides along it during an orbit.
 */
export const brushedAlu = surface('alu', () => {
  // 1 px across the brush direction, 40 px along it: stretched noise.
  const fine = field(1.2, 40, 2);
  const coarse = field(9, 90, 3);
  const streak = (i) => fine[i] * 0.55 + coarse[i] * 0.45;
  return {
    color: paint(SIZE, (i, d, p) => {
      const v = 0.68 + streak(i) * 0.24;
      d[p] = 176 * v;
      d[p + 1] = 182 * v;
      d[p + 2] = 188 * v;
    }),
    height: buildHeight(SIZE, streak),
    rough: paintGrey(SIZE, (i) => 0.2 + streak(i) * 0.28),
    normalStrength: 1.1,
  };
});

/**
 * Tyre rubber with a block tread. The tread is relief in the normal map rather
 * than modelled lugs: a wheel is about 3 cm on screen and carving 24 blocks into
 * it, twice over, would cost far more than it shows.
 *
 * Meant to be tiled around the circumference — `rubberTread(9, 1)`.
 */
export const rubberTread = surface('tread', () => {
  const grain = field(5, 5, 3);
  // One tread block per tile, chamfered, with a sipe cut across it.
  const block = (i) => {
    const x = i % SIZE;
    const y = (i / SIZE) | 0;
    const u = x / SIZE;
    const v = y / SIZE;
    const edge = (t, w) => Math.min(1, Math.max(0, Math.min(t, 1 - t) / w));
    const lug = edge(u, 0.14) * edge(v, 0.1);
    const sipe = Math.abs(v - 0.5) < 0.045 ? 0.35 : 1;
    return lug * sipe * 0.8 + grain[i] * 0.2;
  };
  return {
    color: paint(SIZE, (i, d, p) => {
      const v = 0.5 + block(i) * 0.5;
      d[p] = 30 * v;
      d[p + 1] = 33 * v;
      d[p + 2] = 32 * v;
    }),
    height: buildHeight(SIZE, block),
    // Rubber is uniformly matte, and the grooves hold dust and are matter still.
    rough: paintGrey(SIZE, (i) => 0.88 + (1 - block(i)) * 0.1),
    normalStrength: 3.2,
  };
});

/**
 * A populated circuit board: solder mask, copper traces, gold pads and the
 * silkscreen outline. This is the part students recognise instantly — the one
 * surface in the scene they will later be holding in their hand.
 */
function pcbSurface(mask) {
  return surface(`pcb:${mask}`, () => {
    const c = canvasOf();
    const ctx = c.getContext('2d');
    ctx.fillStyle = mask;
    ctx.fillRect(0, 0, SIZE, SIZE);

    // Traces: copper under the same mask, so they read as a lighter shade of
    // whatever colour the board was made in rather than a fixed green.
    const trace = new THREE.Color(mask).lerp(new THREE.Color('#9fd8bd'), 0.35);
    ctx.strokeStyle = `#${trace.getHexString()}`;
    ctx.lineCap = 'square';
    for (let i = 0; i < 34; i += 1) {
      const x = Math.round((hash(i, 21) * SIZE) / 8) * 8;
      const y = Math.round((hash(i, 23) * SIZE) / 8) * 8;
      const run = 20 + hash(i, 29) * 90;
      ctx.lineWidth = hash(i, 37) > 0.75 ? 3 : 1.6;
      ctx.beginPath();
      ctx.moveTo(x, y);
      if (hash(i, 31) > 0.5) {
        ctx.lineTo(x + run, y);
        ctx.lineTo(x + run + 12, y + 12);
      } else {
        ctx.lineTo(x, y + run);
        ctx.lineTo(x + 12, y + run + 12);
      }
      ctx.stroke();
    }

    // Gold-plated through-hole pads down two edges: the pin headers.
    for (let i = 0; i < 16; i += 1) {
      for (const px of [18, SIZE - 18]) {
        const py = 16 + i * 15;
        ctx.fillStyle = '#c8a233';
        ctx.beginPath();
        ctx.arc(px, py, 4.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#071f16';
        ctx.beginPath();
        ctx.arc(px, py, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Silkscreen: the white outline and a few component footprints.
    ctx.strokeStyle = 'rgba(226,236,231,0.75)';
    ctx.lineWidth = 1.4;
    ctx.strokeRect(7, 7, SIZE - 14, SIZE - 14);
    for (let i = 0; i < 7; i += 1) {
      ctx.strokeRect(46 + hash(i, 41) * 140, 32 + hash(i, 43) * 180, 16 + hash(i, 47) * 26, 10 + hash(i, 53) * 14);
    }

    const src = ctx.getImageData(0, 0, SIZE, SIZE).data;
    return {
      color: c,
      // Copper and pads stand proud of the solder mask by enough that a raking
      // light catches them.
      height: buildHeight(SIZE, (i) => {
        const p = i << 2;
        return 0.35 + ((src[p] + src[p + 1] + src[p + 2]) / 765) * 0.65;
      }),
      // Solder mask is satin; copper and gold are near-mirror.
      rough: paintGrey(SIZE, (i) => {
        const p = i << 2;
        return src[p] > 150 && src[p + 2] < 120 ? 0.22 : 0.45;
      }),
      normalStrength: 1.6,
    };
  });
}

/**
 * Board props, ready to spread onto a material. The solder-mask colour is a
 * parameter because ARIA's controller is green and her motor driver is blue,
 * and a student who has both in front of them should see two different boards.
 */
export function circuitBoard(mask = '#0d3b2b', rx = 1, ry = rx) {
  return pcbSurface(mask)(rx, ry);
}

/**
 * The rubber workshop matting the robot drives on. Low contrast on purpose —
 * the floor has to read as a surface without competing with the robot for
 * attention, since the robot is the thing being taught.
 */
export const benchMat = surface('mat', () => {
  const fine = field(3, 3, 3);
  const blotch = field(30, 30, 3);
  const speck = (i) => fine[i] * 0.6 + blotch[i] * 0.4;
  return {
    color: paint(SIZE, (i, d, p) => {
      const v = 0.7 + speck(i) * 0.55;
      d[p] = 22 * v;
      d[p + 1] = 46 * v;
      d[p + 2] = 35 * v;
    }),
    height: buildHeight(SIZE, speck),
    rough: paintGrey(SIZE, (i) => 0.82 + speck(i) * 0.14),
    normalStrength: 1.5,
  };
});

/**
 * Painted breeze block, for the wall the robot measures. Rough enough to make
 * the ultrasonic ping believable — a sensor bouncing sound off a mirror-smooth
 * surface is the one thing that would give the simulation away.
 */
export function paintedBlock(hex) {
  return surface(`block:${hex}`, () => {
    const [br, bg, bb] = rgb(hex);
    const coarse = field(11, 11, 4);
    const holes = field(6, 6, 1);
    const pit = (i) => coarse[i] * 0.85 - Math.max(0, holes[i] - 0.62) * 2.2;
    return {
      color: paint(SIZE, (i, d, p) => {
        const v = 0.72 + pit(i) * 0.4;
        d[p] = br * v;
        d[p + 1] = bg * v;
        d[p + 2] = bb * v;
      }),
      height: buildHeight(SIZE, (i) => 0.5 + pit(i) * 0.5),
      rough: paintGrey(SIZE, (i) => 0.86 - pit(i) * 0.12),
      normalStrength: 2.6,
    };
  });
}

/**
 * Moulded matte plastic — battery shells, sensor housings, the parts that were
 * injection-moulded rather than machined. Almost no scratches, just the faint
 * pebble finish a mould tool leaves behind.
 */
export function mouldedPlastic(hex) {
  return surface(`abs:${hex}`, () => {
    const [br, bg, bb] = rgb(hex);
    const pebble = field(2.5, 2.5, 3);
    return {
      color: paint(SIZE, (i, d, p) => {
        const v = 0.84 + pebble[i] * 0.32;
        d[p] = br * v;
        d[p + 1] = bg * v;
        d[p + 2] = bb * v;
      }),
      height: buildHeight(SIZE, (i) => pebble[i]),
      rough: paintGrey(SIZE, (i) => 0.72 + pebble[i] * 0.16),
      normalStrength: 1.2,
    };
  });
}

/**
 * Sawn softwood, for the packing crate in the machine-vs-robot lesson.
 *
 * The grain is heavily stretched along one axis and the knots are dark whorls
 * dropped on top, which is the shortest description of wood that still reads as
 * wood. Orient the mesh so the grain runs along the plank, not across it.
 */
export function sawnTimber(hex) {
  return surface(`wood:${hex}`, () => {
    const [br, bg, bb] = rgb(hex);
    const grain = field(1.6, 60, 3);   // the fine fibres
    const rings = field(7, 120, 2);    // the wider growth bands
    const knots = field(26, 26, 2);    // where a branch used to be

    const wood = (i) => {
      const knot = Math.max(0, knots[i] - 0.66) * 3;
      return grain[i] * 0.35 + rings[i] * 0.65 - knot * 0.55;
    };

    return {
      color: paint(SIZE, (i, d, p) => {
        const v = 0.68 + wood(i) * 0.56;
        d[p] = br * v;
        d[p + 1] = bg * v;
        d[p + 2] = bb * v;
      }),
      // Sawn timber is fibrous, not smooth: the soft summer growth sits a little
      // below the hard bands, which is why light rakes across a plank in stripes.
      height: buildHeight(SIZE, (i) => 0.5 + wood(i) * 0.45),
      rough: paintGrey(SIZE, (i) => 0.9 - wood(i) * 0.12),
      normalStrength: 2.2,
    };
  });
}

/**
 * A photovoltaic panel: dark blue cells with the silver bus bars and finger
 * grid printed across them, and a white gap where the laminate shows through.
 *
 * The rover's deck is the one place in the zoo where a student can be told
 * "that is how it gets its power" and see the actual thing, so it is drawn
 * properly rather than being a flat blue slab. Tile it so one cell lands per
 * repeat: `solarCells(4, 2)` for a four-by-two deck.
 */
export const solarCells = surface('solar', () => {
  const c = canvasOf();
  const ctx = c.getContext('2d');

  // The laminate the cells are set into.
  ctx.fillStyle = '#e6ecef';
  ctx.fillRect(0, 0, SIZE, SIZE);

  // One cell, inset, with the corners cut off the way monocrystalline wafers
  // are — they start life as a round ingot.
  const m = 12;
  const chamfer = 26;
  ctx.fillStyle = '#101f4a';
  ctx.beginPath();
  ctx.moveTo(m + chamfer, m);
  ctx.lineTo(SIZE - m - chamfer, m);
  ctx.lineTo(SIZE - m, m + chamfer);
  ctx.lineTo(SIZE - m, SIZE - m - chamfer);
  ctx.lineTo(SIZE - m - chamfer, SIZE - m);
  ctx.lineTo(m + chamfer, SIZE - m);
  ctx.lineTo(m, SIZE - m - chamfer);
  ctx.lineTo(m, m + chamfer);
  ctx.closePath();
  ctx.fill();

  // Finger grid: the fine lines that collect the current.
  ctx.strokeStyle = 'rgba(190,205,220,0.55)';
  ctx.lineWidth = 1;
  for (let i = 1; i < 26; i += 1) {
    const y = m + (i * (SIZE - 2 * m)) / 26;
    ctx.beginPath();
    ctx.moveTo(m + 2, y);
    ctx.lineTo(SIZE - m - 2, y);
    ctx.stroke();
  }

  // Bus bars: the two thick ribbons the fingers feed into.
  ctx.fillStyle = '#c6d2dc';
  for (const x of [SIZE * 0.33, SIZE * 0.67]) {
    ctx.fillRect(x - 4, m + 2, 8, SIZE - 2 * m - 4);
  }

  const src = ctx.getImageData(0, 0, SIZE, SIZE).data;
  const lum = (i) => {
    const p = i << 2;
    return (src[p] + src[p + 1] + src[p + 2]) / 765;
  };

  return {
    color: c,
    // The metal sits on top of the silicon, so it catches light at a hair's
    // different angle — enough for the grid to be visible at a glancing view.
    height: buildHeight(SIZE, (i) => 0.4 + lum(i) * 0.6),
    // Cell silicon is glassy and near-mirror; the bus bars and laminate are not.
    rough: paintGrey(SIZE, (i) => (lum(i) < 0.35 ? 0.12 : 0.55)),
    normalStrength: 0.9,
  };
});

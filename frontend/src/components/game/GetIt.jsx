import { useCallback, useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, SkipForward } from 'lucide-react';

// The "Get it" beat: one concept, taught as something you can grab and move
// rather than read. Every widget here is plain React/SVG — no Python runtime,
// so they respond instantly and work before Pyodide has finished downloading.

const W = 320;
const H = 200;

function Stage({ children, className = '' }) {
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={`w-full rounded-xl border-2 border-ink bg-[#0B1020] ${className}`}
      style={{ aspectRatio: `${W} / ${H}`, touchAction: 'none' }}
    >
      {children}
    </svg>
  );
}

function Grid() {
  const lines = [];
  for (let x = 40; x < W; x += 40) lines.push(<line key={`v${x}`} x1={x} y1="0" x2={x} y2={H} stroke="#ffffff14" />);
  for (let y = 40; y < H; y += 40) lines.push(<line key={`h${y}`} x1="0" y1={y} x2={W} y2={y} stroke="#ffffff14" />);
  return <g>{lines}</g>;
}

function Readout({ items }) {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {items.map((it) => (
        <span key={it.label} className="rounded-lg border-2 border-ink bg-white px-3 py-1.5 font-mono text-sm font-bold text-ink">
          {it.label} = <span className="text-pcb">{it.value}</span>
        </span>
      ))}
    </div>
  );
}

// --- coordinates: drag the sprite, watch x and y ---------------------------

function Coordinates({ look = '🐱' }) {
  const [pos, setPos] = useState({ x: 160, y: 100 });
  const svgRef = useRef(null);
  const dragging = useRef(false);

  const toStage = (e) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const r = svg.getBoundingClientRect();
    const src = e.touches?.[0] || e;
    return {
      x: Math.round(Math.min(W, Math.max(0, ((src.clientX - r.left) / r.width) * W))),
      y: Math.round(Math.min(H, Math.max(0, ((src.clientY - r.top) / r.height) * H))),
    };
  };

  const move = (e) => { if (dragging.current) { const p = toStage(e); if (p) setPos(p); } };

  return (
    <div>
      <div
        ref={svgRef}
        onPointerDown={(e) => { dragging.current = true; const p = toStage(e); if (p) setPos(p); }}
        onPointerMove={move}
        onPointerUp={() => { dragging.current = false; }}
        onPointerLeave={() => { dragging.current = false; }}
        className="cursor-grab active:cursor-grabbing"
      >
        <Stage>
          <Grid />
          <line x1="0" y1={pos.y} x2={W} y2={pos.y} stroke="#FFC93C66" strokeDasharray="4 4" />
          <line x1={pos.x} y1="0" x2={pos.x} y2={H} stroke="#FFC93C66" strokeDasharray="4 4" />
          <text x={pos.x} y={pos.y} fontSize="30" textAnchor="middle" dominantBaseline="central">{look}</text>
          <text x="6" y="16" fill="#ffffff80" fontSize="11" fontFamily="monospace">0,0 is the top-left corner</text>
        </Stage>
      </div>
      <Readout items={[{ label: 'x', value: pos.x }, { label: 'y', value: pos.y }]} />
      <p className="mt-2 text-sm text-ink/60">
        Drag the sprite. Notice <strong>y gets bigger as you go DOWN</strong> — that surprises everyone at first.
      </p>
    </div>
  );
}

// --- velocity: two sliders, the sprite responds live -----------------------

function Velocity({ look = '🚀' }) {
  const [dx, setDx] = useState(2);
  const [dy, setDy] = useState(0);
  const spriteRef = useRef(null);
  const pos = useRef({ x: 60, y: 100 });

  // Position is written straight to the SVG node — a setState per frame here
  // re-renders the sliders 60 times a second for no reason.
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const p = pos.current;
      p.x += dx;
      p.y += dy;
      if (p.x > W) p.x = 0; if (p.x < 0) p.x = W;
      if (p.y > H) p.y = 0; if (p.y < 0) p.y = H;
      if (spriteRef.current) {
        spriteRef.current.setAttribute('x', p.x);
        spriteRef.current.setAttribute('y', p.y);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [dx, dy]);

  return (
    <div>
      <Stage>
        <Grid />
        <text ref={spriteRef} x="60" y="100" fontSize="28" textAnchor="middle" dominantBaseline="central">{look}</text>
      </Stage>
      <div className="mt-3 space-y-2">
        {[['dx (across)', dx, setDx], ['dy (down)', dy, setDy]].map(([label, val, set]) => (
          <label key={label} className="flex items-center gap-3 text-sm font-bold text-ink">
            <span className="w-28 shrink-0">{label}</span>
            <input
              type="range" min="-6" max="6" step="1" value={val}
              onChange={(e) => set(Number(e.target.value))}
              className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-ink/15 accent-pcb"
            />
            <span className="w-8 text-right font-mono text-pcb">{val}</span>
          </label>
        ))}
      </div>
      <p className="mt-2 text-sm text-ink/60">
        Every frame the sprite does <code className="rounded bg-ink/8 px-1">x = x + dx</code>. Slide both to 0 and it stops dead.
      </p>
    </div>
  );
}

// --- the frame stepper: freeze the game loop and walk it one frame at a time -

function FrameStepper({ start = 40, step = 8, lines }) {
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timer = useRef(0);

  const x = start + step * frame;
  const wrapped = x % W;
  const code = lines || ['@game.every_frame', 'def update():', '    ship.x = ship.x + ' + step];

  useEffect(() => {
    if (!playing) return undefined;
    timer.current = setInterval(() => setFrame((f) => f + 1), 500);
    return () => clearInterval(timer.current);
  }, [playing]);

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Stage>
          <Grid />
          <text x={wrapped} y={H / 2} fontSize="28" textAnchor="middle" dominantBaseline="central">🚀</text>
          <text x="6" y="16" fill="#ffffff80" fontSize="11" fontFamily="monospace">frame {frame}</text>
        </Stage>
        <div className="rounded-xl border-2 border-ink bg-ink p-3 font-mono text-xs leading-relaxed text-white/85">
          {code.map((l, i) => (
            <div key={i} className={i === code.length - 1 ? 'rounded bg-signal/25 px-1 text-signal' : 'px-1'}>
              {l}
            </div>
          ))}
          <div className="mt-3 border-t border-white/15 pt-2">
            <div>frame <span className="text-signal">{frame}</span></div>
            <div>ship.x <span className="text-signal">{x}</span></div>
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          onClick={() => setPlaying((p) => !p)}
          className="lab-btn flex items-center gap-2 rounded-lg border-2 border-ink bg-white px-3 py-2 text-sm font-extrabold text-ink"
        >
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {playing ? 'Pause' : 'Play'}
        </button>
        <button
          onClick={() => { setPlaying(false); setFrame((f) => f + 1); }}
          className="lab-btn flex items-center gap-2 rounded-lg border-2 border-ink bg-signal px-3 py-2 text-sm font-extrabold text-ink"
        >
          <SkipForward className="h-4 w-4" /> One frame
        </button>
        <button
          onClick={() => { setPlaying(false); setFrame(0); }}
          className="lab-btn flex items-center gap-2 rounded-lg border-2 border-ink bg-white px-3 py-2 text-sm font-extrabold text-ink"
        >
          <RotateCcw className="h-4 w-4" /> Reset
        </button>
      </div>
      <p className="mt-2 text-sm text-ink/60">
        A real game does this <strong>60 times every second</strong>. Press "One frame" a few times — that's all
        movement is: a small change, over and over, too fast to see.
      </p>
    </div>
  );
}

// --- collision: drag two boxes together and watch touching() flip ----------

function Collision() {
  const [pos, setPos] = useState({ x: 90, y: 100 });
  const svgRef = useRef(null);
  const dragging = useRef(false);
  const target = { x: 210, y: 100, r: 34 };
  const r = 28;

  const toStage = (e) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    const src = e.touches?.[0] || e;
    return {
      x: Math.round(((src.clientX - rect.left) / rect.width) * W),
      y: Math.round(((src.clientY - rect.top) / rect.height) * H),
    };
  };

  const dist = Math.hypot(pos.x - target.x, pos.y - target.y);
  const touching = dist < r + target.r;

  return (
    <div>
      <div
        ref={svgRef}
        onPointerDown={(e) => { dragging.current = true; const p = toStage(e); if (p) setPos(p); }}
        onPointerMove={(e) => { if (dragging.current) { const p = toStage(e); if (p) setPos(p); } }}
        onPointerUp={() => { dragging.current = false; }}
        onPointerLeave={() => { dragging.current = false; }}
        className="cursor-grab active:cursor-grabbing"
      >
        <Stage>
          <Grid />
          <circle cx={target.x} cy={target.y} r={target.r} fill="none" stroke={touching ? '#3FBF7F' : '#ffffff35'} strokeWidth="2" strokeDasharray="5 4" />
          <circle cx={pos.x} cy={pos.y} r={r} fill="none" stroke={touching ? '#3FBF7F' : '#ffffff35'} strokeWidth="2" strokeDasharray="5 4" />
          <text x={target.x} y={target.y} fontSize="30" textAnchor="middle" dominantBaseline="central">🍎</text>
          <text x={pos.x} y={pos.y} fontSize="30" textAnchor="middle" dominantBaseline="central">🧺</text>
        </Stage>
      </div>
      <div className="mt-3">
        <span className={`rounded-lg border-2 border-ink px-3 py-1.5 font-mono text-sm font-bold ${touching ? 'bg-pcb text-white' : 'bg-white text-ink'}`}>
          basket.touching(apple) → {touching ? 'True' : 'False'}
        </span>
      </div>
      <p className="mt-2 text-sm text-ink/60">
        Drag the basket. The dotted rings are the <strong>hitboxes</strong> — the invisible shapes the computer
        actually compares. It never sees the pictures, only the rings.
      </p>
    </div>
  );
}

// --- gravity: tune the feel, understand acceleration -----------------------

function Gravity() {
  const [g, setG] = useState(1);
  const [jump, setJump] = useState(12);
  const frogRef = useRef(null);
  const motion = useRef({ y: 150, vy: 0 });

  // Same as Velocity: mutate the node, don't re-render on every frame. The
  // frog's position lives in a ref, so moving a slider never resets it.
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const m = motion.current;
      m.vy += g;
      m.y += m.vy;
      if (m.y >= 150) { m.y = 150; m.vy = -jump; }   // auto-bounce so it always demos
      if (frogRef.current) frogRef.current.setAttribute('y', m.y);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [g, jump]);

  return (
    <div>
      <Stage>
        <rect x="0" y="168" width={W} height="32" fill="#1F7A5C" />
        <text ref={frogRef} x={W / 2} y="150" fontSize="28" textAnchor="middle" dominantBaseline="central">🐸</text>
      </Stage>
      <div className="mt-3 space-y-2">
        {[['gravity', g, setG, 0, 3, 0.25], ['jump power', jump, setJump, 4, 22, 1]].map(([label, val, set, min, max, stp]) => (
          <label key={label} className="flex items-center gap-3 text-sm font-bold text-ink">
            <span className="w-28 shrink-0">{label}</span>
            <input
              type="range" min={min} max={max} step={stp} value={val}
              onChange={(e) => set(Number(e.target.value))}
              className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-ink/15 accent-pcb"
            />
            <span className="w-10 text-right font-mono text-pcb">{val}</span>
          </label>
        ))}
      </div>
      <p className="mt-2 text-sm text-ink/60">
        Gravity doesn't change position — it changes <strong>speed</strong>, every frame. Low gravity feels like the
        moon; high gravity feels heavy and snappy. This one slider is most of what "game feel" means.
      </p>
    </div>
  );
}

const WIDGETS = {
  coordinates: Coordinates,
  velocity: Velocity,
  frames: FrameStepper,
  collision: Collision,
  gravity: Gravity,
};

export default function GetIt({ widget, title, beats, config }) {
  const Widget = WIDGETS[widget];
  const [seen, setSeen] = useState(false);
  const mark = useCallback(() => setSeen(true), []);

  return (
    <div className="lab-panel p-4 sm:p-5" onPointerDown={mark}>
      {title && <h3 className="mb-1 font-lab font-bold text-ink">{title}</h3>}
      {beats?.length > 0 && (
        <ul className="mb-4 space-y-1.5">
          {beats.map((b, i) => (
            <li key={i} className="flex items-start gap-2 text-ink/75">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-pcb" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      )}
      {Widget ? <Widget {...(config || {})} /> : null}
      {Widget && !seen && (
        <p className="mt-2 text-xs font-bold uppercase tracking-wide text-wire">↑ this one is yours to play with</p>
      )}
    </div>
  );
}

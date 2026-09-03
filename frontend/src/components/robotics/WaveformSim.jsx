import { useMemo, useState } from 'react';
import { Volume2 } from 'lucide-react';
import WidgetShell from './shared/WidgetShell';

const W = 150, H = 70;
// A deterministic "speech-like" envelope for mic mode — not live audio (no
// mic permission dance), but an honest stand-in: sound becoming a waveform
// is the concept, and a canned trace teaches it without a permission prompt
// that could fail silently on a school Chromebook.
const MIC_ENVELOPE = [0, 8, 22, 14, 30, 42, 25, 10, 18, 35, 44, 28, 12, 5, 20, 33, 15, 6, 0];

function sinePath(cycles) {
  const pts = [];
  const steps = 60;
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * W;
    const y = H / 2 + Math.sin((i / steps) * cycles * Math.PI * 2) * (H / 2 - 8);
    pts.push([x, y]);
  }
  return pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
}

function micPath() {
  const n = MIC_ENVELOPE.length - 1;
  const pts = MIC_ENVELOPE.map((amp, i) => {
    const x = (i / n) * W;
    const y = H / 2 + Math.sin(i * 1.7) * amp * 0.6;
    return [x, y];
  });
  return pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
}

export default function WaveformSim({ block }) {
  const { title = '🎙️ Sound → Waveform', hint } = block || {};
  const [mode, setMode] = useState('speaker');
  const [freq, setFreq] = useState(440);

  const cycles = 1 + freq / 300;
  const path = useMemo(() => (mode === 'speaker' ? sinePath(cycles) : micPath()), [mode, cycles]);
  const scrollDur = mode === 'speaker' ? Math.max(0.3, 1.4 - freq / 1200) : 1.6;

  const playTone = () => {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      const ctx = new Ctx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
      osc.onended = () => ctx.close();
    } catch {
      // Web Audio unavailable — the visual waveform still teaches the idea.
    }
  };

  return (
    <WidgetShell title={title} hint={hint}>
      <div className="p-4">
        <div className="mb-4 flex justify-center gap-2">
          <button onClick={() => setMode('speaker')}
            className={`rounded-xl border-2 border-ink px-4 py-2 text-sm font-bold ${mode === 'speaker' ? 'bg-signal text-ink' : 'bg-white text-ink/70'}`}>
            🔊 Speaker
          </button>
          <button onClick={() => setMode('mic')}
            className={`rounded-xl border-2 border-ink px-4 py-2 text-sm font-bold ${mode === 'mic' ? 'bg-signal text-ink' : 'bg-white text-ink/70'}`}>
            🎙️ Microphone
          </button>
        </div>

        <svg viewBox={`0 0 ${W} ${H}`} className="w-full overflow-hidden rounded-xl border-2 border-ink/12 bg-[#0B180F]">
          <g style={{ animation: `wavescroll ${scrollDur}s linear infinite` }}>
            <path d={path} fill="none" stroke="#23B5D3" strokeWidth="2.5" />
            <path d={path} transform={`translate(${W} 0)`} fill="none" stroke="#23B5D3" strokeWidth="2.5" />
          </g>
        </svg>

        {mode === 'speaker' ? (
          <>
            <label className="mt-4 block">
              <span className="mb-1 flex justify-between text-xs font-bold uppercase tracking-wide text-ink/60">
                <span>Frequency</span><span className="font-mono-lab text-pcb">{freq} Hz</span>
              </span>
              <input type="range" min="100" max="1200" step="20" value={freq}
                onChange={(e) => setFreq(Number(e.target.value))}
                className="h-2 w-full cursor-grab accent-pcb active:cursor-grabbing" />
            </label>
            <button onClick={playTone} className="lab-btn mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-ink bg-pcb px-6 py-2.5 font-extrabold text-white">
              <Volume2 className="h-4 w-4" /> Play tone
            </button>
            <p className="mt-3 text-center text-sm font-semibold text-ink/60">
              A speaker just reverses a microphone: an electrical wave pushes a membrane, and the membrane pushes air.
            </p>
          </>
        ) : (
          <p className="mt-4 text-center text-sm font-semibold text-ink/60">
            A microphone's membrane vibrates with incoming sound, and that vibration becomes exactly this kind of wobbly, irregular wave — nothing like a clean tone.
          </p>
        )}
      </div>
      <style>{`@keyframes wavescroll { from { transform: translateX(0); } to { transform: translateX(-${W}px); } }`}</style>
    </WidgetShell>
  );
}

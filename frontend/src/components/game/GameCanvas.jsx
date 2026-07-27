import { useEffect, useRef, useState } from 'react';
import { attachCanvas, setKeys } from '../../services/gameRuntime';

// Maps a browser KeyboardEvent.key onto the short names students type in
// game.key_down("left"). Letters pass through lowercased.
function keyName(e) {
  const map = {
    ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down',
    ' ': 'space', Spacebar: 'space', Enter: 'enter', Escape: 'escape',
  };
  return map[e.key] || String(e.key).toLowerCase();
}

// True when the keystroke is aimed at somewhere you can type. The game listens
// on `window` so a student can play without clicking the stage first — but that
// also catches every keystroke meant for the code editor. Typing must always
// win: swallowing space there makes the editor look broken, and swallowing the
// arrow keys stops you moving the cursor through your own code.
// Matched with closest() rather than by tag: Monaco's current EditContext host
// is a plain <div role="textbox"> that reports isContentEditable === false, so
// tag and contentEditable checks alone miss it — and missing it means the space
// bar does nothing in the code editor.
const TYPING_SELECTOR = [
  'input', 'textarea', 'select',
  '[contenteditable=""]', '[contenteditable="true"]',
  '[role="textbox"]',
  '.monaco-editor',
].join(', ');

function isTypingTarget(el) {
  return !!(el && typeof el.closest === 'function' && el.closest(TYPING_SELECTOR));
}

// The stage. Control of this canvas is transferred to the worker, so React
// never draws to it — it only sizes it and forwards keyboard state.
export default function GameCanvas({ width = 480, height = 360, focusHint = true }) {
  const canvasRef = useRef(null);
  const heldRef = useRef(new Set());
  // Control of this element is handed to the worker, and touching width/height
  // on a transferred canvas throws InvalidStateError. So the attributes are
  // frozen at their first value; the worker resizes its own backing store from
  // each game's stage size, and the CSS aspect ratio below still follows props.
  const [initialSize] = useState({ width, height });

  useEffect(() => {
    if (canvasRef.current) attachCanvas(canvasRef.current);
  }, []);

  useEffect(() => {
    const held = heldRef.current;
    const push = () => setKeys([...held]);

    const down = (e) => {
      if (isTypingTarget(e.target)) return;
      const name = keyName(e);
      // Arrows and space scroll the page — a game needs them.
      if (['left', 'right', 'up', 'down', 'space'].includes(name)) e.preventDefault();
      if (!held.has(name)) { held.add(name); push(); }
    };
    // Key-ups are never filtered: a key pressed on the stage and released after
    // clicking into the editor must still be let go, or the player "sticks".
    const up = (e) => {
      held.delete(keyName(e));
      push();
    };
    // Releasing focus must clear held keys, or a character "sticks" moving.
    const clear = () => { if (held.size) { held.clear(); push(); } };

    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', clear);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', clear);
      clear();
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="overflow-hidden rounded-xl border-2 border-ink shadow-[4px_4px_0_rgba(22,36,29,0.9)]">
        <canvas
          ref={canvasRef}
          width={initialSize.width}
          height={initialSize.height}
          className="block h-auto w-full max-w-full"
          style={{ aspectRatio: `${width} / ${height}`, imageRendering: 'auto' }}
        />
      </div>
      {focusHint && (
        <p className="text-[11px] font-semibold text-ink/40">
          Click the page, then use your arrow keys to play.
        </p>
      )}
    </div>
  );
}

/**
 * A number input with its own plus/minus buttons, used by the Python
 * playground widgets. Native spinners are hidden because the dial already has
 * larger, easier targets and the browser arrows push the value off centre.
 */
export default function NumberDial({ label, value, onChange, min, max }) {
  const clamp = (n) => {
    if (typeof min === 'number' && n < min) return min;
    if (typeof max === 'number' && n > max) return max;
    return n;
  };

  return (
    <div>
      <p className="ref-tag mb-1 text-ink/55">{label}</p>
      <div className="flex items-center gap-2 rounded-xl border-2 border-ink bg-paper px-2 py-2">
        <button
          onClick={() => onChange(clamp(value - 1))}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border-2 border-ink bg-white font-lab text-lg font-extrabold leading-none text-ink transition-colors hover:bg-pcb hover:text-white"
          aria-label={`Decrease ${label}`}
        >
          -
        </button>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(clamp(Number(e.target.value) || 0))}
          aria-label={label}
          className="w-full min-w-0 appearance-none bg-transparent text-center font-mono-lab text-2xl font-extrabold text-ink outline-none [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <button
          onClick={() => onChange(clamp(value + 1))}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border-2 border-ink bg-white font-lab text-lg font-extrabold leading-none text-ink transition-colors hover:bg-pcb hover:text-white"
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
}

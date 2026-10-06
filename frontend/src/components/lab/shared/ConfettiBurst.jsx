const CONFETTI_COLORS = ['#FFB40A', '#5B0DA8', '#E63C22', '#0097F8', '#1B1B1B', '#00C48C'];

// A one-shot shower of falling confetti, absolutely positioned over its parent.
export default function ConfettiBurst() {
  const pieces = Array.from({ length: 48 }, (_, i) => i);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((i) => (
        <span
          key={i}
          className="absolute top-0 block h-3 w-2 rounded-sm animate-[confettiFall_linear_forwards]"
          style={{
            left: `${(i / pieces.length) * 100}%`,
            backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
            animationDuration: `${2 + (i % 5) * 0.4}s`,
            animationDelay: `${(i % 7) * 0.12}s`,
          }}
        />
      ))}
    </div>
  );
}

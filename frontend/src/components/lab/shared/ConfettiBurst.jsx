const CONFETTI_COLORS = ['#FFC93C', '#1F7A5C', '#E8503A', '#23B5D3', '#16241D', '#3FBF7F'];

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

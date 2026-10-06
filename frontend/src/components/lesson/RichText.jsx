/**
 * Course text with `backticked` words rendered as inline code.
 *
 * The lesson JSON has always been written with Markdown style backticks around
 * things like `def` and `.append()`, but the renderer printed the backticks
 * literally, so every one of them read as a typo. This is deliberately not a
 * Markdown parser: one rule, applied to a course-wide convention that already
 * exists.
 */
export default function RichText({ value, className }) {
  const text = String(value ?? '');
  if (!text.includes('`')) return <span className={className}>{text}</span>;

  // Odd-numbered pieces sit between a pair of backticks. A trailing unpaired
  // backtick therefore stays plain text rather than swallowing the rest.
  const parts = text.split('`');
  const paired = parts.length % 2 === 1;

  return (
    <span className={className}>
      {parts.map((part, i) =>
        paired && i % 2 === 1 ? (
          <code
            key={i}
            className="rounded-md border border-ink/15 bg-ink/[0.06] px-1.5 py-0.5 font-mono-lab text-[0.85em] font-bold text-ink"
          >
            {part}
          </code>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </span>
  );
}

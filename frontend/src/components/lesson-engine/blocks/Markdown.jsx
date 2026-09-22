import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Lesson prose is authored as Markdown so the content files stay readable and
// diffable. This maps every element react-markdown can emit onto the bench
// styling the rest of the app uses, so authored text can never introduce a
// typeface or colour that isn't in the design system.

const COMPONENTS = {
  h1: (props) => <h1 className="font-lab mb-4 mt-8 text-2xl font-extrabold text-ink first:mt-0" {...props} />,
  h2: (props) => <h2 className="font-lab mb-3 mt-8 text-xl font-bold text-ink first:mt-0" {...props} />,
  h3: (props) => <h3 className="font-lab mb-2 mt-6 text-lg font-bold text-ink first:mt-0" {...props} />,
  p: (props) => <p className="mb-4 leading-relaxed text-ink/75 last:mb-0" {...props} />,
  ul: (props) => <ul className="mb-4 list-disc space-y-1.5 pl-6 text-ink/75 last:mb-0" {...props} />,
  ol: (props) => <ol className="mb-4 list-decimal space-y-1.5 pl-6 text-ink/75 last:mb-0" {...props} />,
  li: (props) => <li className="leading-relaxed" {...props} />,
  strong: (props) => <strong className="font-bold text-ink" {...props} />,
  em: (props) => <em className="italic" {...props} />,
  a: (props) => (
    <a
      className="font-semibold text-pcb underline decoration-pcb/40 underline-offset-2 hover:decoration-pcb"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    />
  ),
  blockquote: (props) => (
    <blockquote className="mb-4 border-l-4 border-ink/15 pl-4 italic text-ink/60 last:mb-0" {...props} />
  ),
  hr: () => <hr className="my-6 border-t-2 border-ink/10" />,

  // Fenced blocks arrive as <pre><code>; inline ticks as a bare <code>. The
  // `pre` wrapper carries the dark panel, so `code` inside it must not repaint
  // itself — hence the two different treatments.
  pre: (props) => (
    <pre
      className="mb-4 overflow-x-auto rounded-xl border-2 border-ink bg-[#0B180F] p-4 font-mono-lab text-sm text-white/90 last:mb-0"
      {...props}
    />
  ),
  code: ({ className, children, ...rest }) => {
    const fenced = typeof className === 'string' && className.startsWith('language-');
    if (fenced) return <code className={className} {...rest}>{children}</code>;
    return (
      <code className="rounded bg-ink/8 px-1.5 py-0.5 font-mono-lab text-[0.9em] text-ink" {...rest}>
        {children}
      </code>
    );
  },

  // GFM tables.
  table: (props) => (
    <div className="mb-4 overflow-x-auto last:mb-0">
      <table className="w-full border-collapse text-left text-sm" {...props} />
    </div>
  ),
  th: (props) => <th className="border-2 border-ink/15 bg-paper px-3 py-2 font-bold text-ink" {...props} />,
  td: (props) => <td className="border-2 border-ink/15 px-3 py-2 text-ink/75" {...props} />,
};

/**
 * Render a Markdown string with the course's styling.
 * @param {{ md: string, className?: string }} props
 */
export default function Markdown({ md, className = '' }) {
  if (!md) return null;
  return (
    <div className={className}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={COMPONENTS}>
        {md}
      </ReactMarkdown>
    </div>
  );
}

import { X } from 'lucide-react';
import { PALETTE, makeBlock } from './palette';

/** A recursive block list: renders each block plus its own nested stacks for repeat/if, disabled while a run is in progress. */
export default function BlockStack({ blocks, onChange, depth = 0, disabled }) {
  const setBlock = (id, patch) => onChange(blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  const removeBlock = (id) => onChange(blocks.filter((b) => b.id !== id));
  const addBlock = (type) => onChange([...blocks, makeBlock(type)]);

  return (
    <div className={depth > 0 ? 'ml-4 border-l-2 border-ink/15 pl-3' : ''}>
      <div className="space-y-1.5">
        {blocks.map((block) => (
          <div key={block.id}>
            <div className="flex items-center gap-2 rounded-lg border-2 border-ink bg-white px-2.5 py-1.5">
              <span className="text-base">{PALETTE.find((p) => p.type === block.type)?.emoji}</span>
              <span className="flex-1 text-sm font-bold text-ink">
                {block.type === 'repeat' ? 'Repeat' : block.type === 'if' ? 'If wall ahead' : PALETTE.find((p) => p.type === block.type)?.label}
              </span>
              {block.type === 'repeat' && (
                <div className="flex items-center gap-1">
                  <button
                    disabled={disabled}
                    onClick={() => setBlock(block.id, { count: block.count === 'forever' ? 3 : 'forever' })}
                    className="rounded border border-ink/30 px-1.5 py-0.5 text-xs font-bold text-ink/70"
                  >
                    {block.count === 'forever' ? '∞' : 'N'}
                  </button>
                  {block.count !== 'forever' && (
                    <input
                      type="number" min="1" max="20" value={block.count} disabled={disabled}
                      onChange={(e) => setBlock(block.id, { count: Math.max(1, Number(e.target.value) || 1) })}
                      className="w-12 rounded border-2 border-ink/20 px-1 py-0.5 text-center font-mono-lab text-xs"
                    />
                  )}
                  <span className="text-xs font-semibold text-ink/50">times</span>
                </div>
              )}
              <button disabled={disabled} onClick={() => removeBlock(block.id)} className="text-ink/30 hover:text-wire">
                <X className="h-4 w-4" />
              </button>
            </div>

            {block.type === 'repeat' && (
              <div className="mt-1.5">
                <BlockStack blocks={block.children} onChange={(c) => setBlock(block.id, { children: c })} depth={depth + 1} disabled={disabled} />
              </div>
            )}
            {block.type === 'if' && (
              <div className="mt-1.5 space-y-2">
                <div>
                  <p className="ml-4 text-[11px] font-bold uppercase tracking-wide text-pcb">then</p>
                  <BlockStack blocks={block.children} onChange={(c) => setBlock(block.id, { children: c })} depth={depth + 1} disabled={disabled} />
                </div>
                <div>
                  <p className="ml-4 text-[11px] font-bold uppercase tracking-wide text-wire">else</p>
                  <BlockStack blocks={block.elseChildren} onChange={(c) => setBlock(block.id, { elseChildren: c })} depth={depth + 1} disabled={disabled} />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {PALETTE.map((p) => (
          <button
            key={p.type} disabled={disabled} onClick={() => addBlock(p.type)}
            className="rounded-lg border-2 border-dashed border-ink/25 px-2 py-1 text-xs font-bold text-ink/50 hover:border-pcb/50 hover:text-pcb"
          >
            {p.emoji} {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}

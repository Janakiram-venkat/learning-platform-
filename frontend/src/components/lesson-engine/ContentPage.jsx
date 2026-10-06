import BlockRenderer from './blocks/BlockRenderer';

/**
 * A teaching page: a stack of blocks, nothing to pass. Next is always enabled.
 * @param {{ page: { title?: string, blocks: Array<object> } }} props
 */
export default function ContentPage({ page }) {
  return (
    <div className="space-y-6">
      {page.title && (
        <h2 className="font-lab text-2xl font-extrabold text-ink sm:text-3xl">{page.title}</h2>
      )}
      {(page.blocks || []).map((block, i) => (
        <BlockRenderer key={i} block={block} />
      ))}
    </div>
  );
}

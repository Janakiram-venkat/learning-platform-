import Markdown from './Markdown';
import Callout from './Callout';
import RunnableExample from './RunnableExample';

// One place that knows how a content block's `type` maps to a component.
// Adding a block kind to the lesson schema is one entry here plus its renderer.

/**
 * @param {{ block: { type: string, [k: string]: any } }} props
 */
export default function BlockRenderer({ block }) {
  switch (block.type) {
    case 'text':
      return <Markdown md={block.md} />;
    case 'tip':
      return <Callout variant="tip" md={block.md} title={block.title} />;
    case 'warning':
      return <Callout variant="warning" md={block.md} title={block.title} />;
    case 'example':
      return (
        <RunnableExample
          files={block.files}
          tabs={block.tabs}
          caption={block.caption}
          label={block.label}
        />
      );
    default:
      // Authoring mistake, not a user-facing state — loud in dev, silent in prod.
      if (import.meta.env.DEV) {
        console.warn(`BlockRenderer: unknown block type "${block.type}"`, block);
      }
      return null;
  }
}

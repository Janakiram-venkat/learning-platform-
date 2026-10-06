import CodeRunner from '../../webdev/CodeRunner';

/**
 * A worked example: code the student can read, run and fiddle with, but which
 * isn't graded. Auto-runs so the result is on screen before they read on —
 * "here is the code AND what it does" in one glance.
 *
 * Edits here are throwaway by design (no `storageKey`): an example is a
 * scratchpad, and a student who breaks one should get the working version back
 * by moving away and returning.
 *
 * @param {object} props
 * @param {{html?:string, css?:string, js?:string}} props.files
 * @param {Array<'html'|'css'|'js'>} [props.tabs]
 * @param {string} [props.caption] Shown under the runner.
 * @param {string} [props.label] Title in the runner's action bar.
 */
export default function RunnableExample({ files, tabs = ['html'], caption, label }) {
  return (
    <figure className="m-0">
      <CodeRunner label={label || 'Example'} starter={files} tabs={tabs} autoRun />
      {caption && (
        <figcaption className="mt-2 px-1 text-sm italic leading-relaxed text-ink/55">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

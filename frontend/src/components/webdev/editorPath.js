// Monaco keys every text model by URI, and @monaco-editor/react's
// `getOrCreateModel` does `monaco.editor.getModel(Uri.parse(path))` before it
// creates anything. Two editors mounted with the same `path` therefore end up
// *sharing one model*: they edit the same buffer, fire each other's `onChange`,
// and dispose each other's model on unmount.
//
// A task page mounts two runners (the student's editor and the read-only
// solution) and a content page can mount several examples, so every runner
// needs its own URI namespace. These helpers produce it.

let counter = 0;

/**
 * A process-unique id for one CodeRunner instance. Called once per mount.
 * @returns {string} e.g. `r7`
 */
export function nextRunnerId() {
  counter += 1;
  return `r${counter}`;
}

/**
 * The Monaco model URI for one file inside one runner.
 *
 * The scheme is explicit so `Uri.parse` doesn't fall back to a schemeless URI,
 * and the runner id sits above the filename so the language is still inferred
 * from the `.html`/`.css`/`.js` extension.
 *
 * @param {string} runnerId  From {@link nextRunnerId}.
 * @param {string} fileLabel e.g. `index.html`
 * @returns {string}
 */
export function editorPath(runnerId, fileLabel) {
  return `file:///runner/${runnerId}/${fileLabel}`;
}

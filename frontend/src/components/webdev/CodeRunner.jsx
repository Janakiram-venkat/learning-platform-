import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, Square, RotateCcw, Minus, Plus, Eye, TerminalSquare } from 'lucide-react';
import Terminal from '../editor/Terminal';
import { useWebRunner } from '../../hooks/useWebRunner';
import { loadCode, saveCode, clearCode } from '../../lib/webdev/storage';
import { editorPath, nextRunnerId } from './editorPath';

// Monaco is ~1MB of editor. A student reading a content page shouldn't pay for
// it, so it only arrives when a runnable block actually mounts.
const MonacoEditor = lazy(() => import('@monaco-editor/react'));

const TAB_META = {
  html: { label: 'index.html', language: 'html', dot: 'bg-wire' },
  css: { label: 'style.css', language: 'css', dot: 'bg-led' },
  js: { label: 'script.js', language: 'javascript', dot: 'bg-signal' },
};

const EMPTY = { html: '', css: '', js: '' };

/**
 * A three-file code editor wired to a sandboxed live preview and a terminal.
 *
 * The one runnable surface for the whole web-dev course: lesson examples,
 * graded tasks and the mini project are all this component with different
 * props. It owns the student's edits (seeded from `starter`, autosaved under
 * `storageKey`) and runs them in an iframe that cannot see this page.
 *
 * @param {object} props
 * @param {{html?:string, css?:string, js?:string}} [props.starter] Code to start from.
 * @param {Array<'html'|'css'|'js'>} [props.tabs] Which files the student edits.
 * @param {string} [props.storageKey] Autosave id. Omit to make edits throwaway.
 * @param {Array<object>|null} [props.checks] Task checks, graded inside the frame.
 * @param {(results: Array<{index:number,passed:boolean,message:string}>) => void} [props.onCheckResults]
 * @param {boolean} [props.autoRun] Run once on mount - used by lesson examples.
 * @param {boolean} [props.readOnly] Show the code without letting it be edited.
 * @param {'preview'|'terminal'} [props.initialPane] Which output pane to open
 *        on. Defaults to the preview whenever there is a page to draw. A run
 *        that errors still opens on the terminal, and the student's own click
 *        always wins.
 * @param {string} [props.label] Heading shown above the editor.
 * @param {string} [props.className] Extra classes on the outer wrapper.
 */
export default function CodeRunner({
  starter = EMPTY,
  tabs = ['html'],
  storageKey,
  checks = null,
  onCheckResults,
  autoRun = false,
  readOnly = false,
  initialPane,
  label,
  className = '',
}) {
  const activeTabs = tabs.length ? tabs : ['html'];

  // This runner's own Monaco namespace. Without it, a page with two runners
  // (task + solution, or two examples) hands both the same model path and they
  // share one buffer - see editorPath.js.
  const [runnerId] = useState(nextRunnerId);

  // Starter is authored data and never changes for a given page, but it arrives
  // as a fresh object literal each render - memoise on its contents so the
  // effects below don't re-fire forever.
  const starterKey = JSON.stringify(starter);
  const baseline = useMemo(
    () => ({ ...EMPTY, ...starter }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- starterKey is the stable identity of `starter`
    [starterKey],
  );

  const [files, setFiles] = useState(() => ({ ...baseline, ...(storageKey ? loadCode(storageKey) : null) }));
  const [tab, setTab] = useState(activeTabs[0]);
  const [fontSize, setFontSize] = useState(14);
  // The student's explicit pane choice, cleared on every run so the automatic
  // choice below gets to decide again for the new output.
  const [paneChoice, setPaneChoice] = useState(null);

  const {
    iframeRef, srcDoc, frameKey, lines, running, title,
    run, stop, reset: resetRunner, handleFrameLoad,
  } = useWebRunner({ onChecks: onCheckResults });

  // Which output pane to show, derived rather than stored: a pure HTML/CSS
  // block has nothing to say in a terminal, a JS console exercise has nothing
  // to *show*, and an error beats a silently blank preview either way. An
  // explicit click always wins.
  const errored = lines.some((l) => l.type === 'err');
  // "Has something to show" is about the HTML, not about whether there's an
  // HTML *tab*: a CSS-only exercise still edits a real page, and opening it on
  // an empty terminal would hide the very thing being styled.
  const hasPage = activeTabs.includes('html') || !!files.html?.trim();
  const pane = paneChoice
    ?? (errored ? 'terminal' : initialPane ?? (hasPage ? 'preview' : 'terminal'));

  // A new page means new starter code and a clean runner.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- re-seed the editors when the page's starter code changes
    setFiles({ ...baseline, ...(storageKey ? loadCode(storageKey) : null) });
    setTab(activeTabs[0]);
    setPaneChoice(null);
    resetRunner();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- activeTabs is derived from props and stable per page
  }, [baseline, storageKey, resetRunner]);

  // Autosave, debounced: typing shouldn't hit localStorage on every keystroke.
  useEffect(() => {
    if (!storageKey || readOnly) return undefined;
    const t = setTimeout(() => saveCode(storageKey, files), 400);
    return () => clearTimeout(t);
  }, [files, storageKey, readOnly]);

  const filesRef = useRef(files);
  useEffect(() => { filesRef.current = files; }, [files]);

  const checksRef = useRef(checks);
  useEffect(() => { checksRef.current = checks; }, [checks]);

  const handleRun = useCallback(() => {
    setPaneChoice(null);
    run(filesRef.current, checksRef.current);
  }, [run]);

  // Examples render already-run, so the student sees the result before reading
  // on. Keyed on the starter so navigating between pages re-runs the new one.
  useEffect(() => {
    if (!autoRun) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- priming the iframe (an external system) is what this effect is for
    handleRun();
  }, [autoRun, handleRun, baseline]);

  const handleReset = () => {
    if (
      JSON.stringify(files) !== JSON.stringify(baseline) &&
      !window.confirm('Reset this code back to the starter? Your changes will be lost.')
    ) return;
    setFiles(baseline);
    if (storageKey) clearCode(storageKey);
  };

  const setActiveFile = (value) => setFiles((prev) => ({ ...prev, [tab]: value ?? '' }));

  // Ctrl/Cmd+Enter runs, from inside the editor.
  const handleMount = (editor, monaco) => {
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => handleRun());
  };

  const toolBtn =
    'flex items-center gap-1 rounded-md px-2 py-1 text-xs font-bold text-ink/60 transition-colors ' +
    'hover:bg-ink/8 hover:text-ink focus-visible:outline-2 focus-visible:outline-pcb disabled:opacity-40';

  const paneBtn = (active) =>
    'flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-bold transition-colors ' +
    'focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-pcb ' +
    (active ? 'border-pcb text-pcb' : 'border-transparent text-ink/45 hover:text-ink');

  return (
    <div className={`overflow-hidden rounded-2xl border-2 border-ink bg-white shadow-[4px_4px_0_rgba(22,36,29,0.9)] ${className}`}>
      {/* Action bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-ink bg-pcb px-3 py-2">
        <span className="font-lab text-sm font-bold text-white">{label || 'Try it'}</span>
        <div className="flex items-center gap-2">
          {running && (
            <button
              onClick={stop}
              className="flex items-center gap-1.5 rounded-lg border-2 border-ink bg-white px-3 py-1.5 text-xs font-extrabold text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <Square className="h-3.5 w-3.5" aria-hidden="true" /> Stop
            </button>
          )}
          <button
            onClick={handleRun}
            title="Run (Ctrl/Cmd + Enter)"
            className="flex items-center gap-1.5 rounded-lg border-2 border-ink bg-signal px-4 py-1.5 text-xs font-extrabold text-ink transition-transform active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <Play className="h-3.5 w-3.5" aria-hidden="true" /> Run
          </button>
        </div>
      </div>

      {/* Editor left, output right; stacked on anything narrower than lg. */}
      <div className="flex flex-col lg:flex-row">
        {/* --- Editor --- */}
        <div className="flex min-w-0 flex-col border-b-2 border-ink/15 lg:w-1/2 lg:border-b-0 lg:border-r-2">
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-1 border-b border-ink/10 bg-paper px-2 py-1">
            <div role="tablist" aria-label="Files" className="flex items-center gap-0.5">
              {activeTabs.map((id) => {
                const meta = TAB_META[id];
                const active = tab === id;
                return (
                  <button
                    key={id}
                    role="tab"
                    id={`file-tab-${id}`}
                    aria-selected={active}
                    aria-controls="file-editor"
                    onClick={() => setTab(id)}
                    className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold transition-colors focus-visible:outline-2 focus-visible:outline-pcb ${
                      active ? 'bg-ink/10 text-ink' : 'text-ink/45 hover:text-ink'
                    }`}
                  >
                    <span className={`h-2 w-2 rounded-full ${meta.dot}`} aria-hidden="true" />
                    {meta.label}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-0.5">
              <button onClick={() => setFontSize((f) => Math.max(11, f - 1))} className={toolBtn} aria-label="Smaller text">
                <Minus className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              <span className="w-5 text-center text-xs font-bold text-ink/40">{fontSize}</span>
              <button onClick={() => setFontSize((f) => Math.min(24, f + 1))} className={toolBtn} aria-label="Larger text">
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              {!readOnly && (
                <>
                  <span className="mx-1 h-4 w-px bg-ink/10" />
                  <button onClick={handleReset} className={toolBtn} title="Reset to starter code">
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                    <span className="hidden sm:inline">Reset</span>
                  </button>
                </>
              )}
            </div>
          </div>

          <div id="file-editor" role="tabpanel" aria-labelledby={`file-tab-${tab}`} className="h-[280px] lg:h-[340px]">
            <Suspense fallback={<div className="flex h-full items-center justify-center bg-[#1e1e1e] text-sm font-bold text-white/40">Loading editor…</div>}>
              <MonacoEditor
                height="100%"
                path={editorPath(runnerId, TAB_META[tab].label)}
                language={TAB_META[tab].language}
                value={files[tab] ?? ''}
                // A read-only runner has nothing to report: keeping the
                // listener off means it can never write its `value` back over
                // another editor's text.
                onChange={readOnly ? undefined : setActiveFile}
                onMount={handleMount}
                theme="vs-dark"
                options={{
                  readOnly,
                  fontSize,
                  minimap: { enabled: false },
                  fontFamily: "'JetBrains Mono', 'Fira Code', ui-monospace, monospace",
                  wordWrap: 'on',
                  scrollBeyondLastLine: false,
                  padding: { top: 12, bottom: 12 },
                  tabSize: 2,
                  lineNumbers: 'on',
                  bracketPairColorization: { enabled: true },
                  autoClosingBrackets: 'always',
                  renderLineHighlight: 'all',
                  automaticLayout: true,
                  scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10 },
                }}
              />
            </Suspense>
          </div>
        </div>

        {/* --- Output --- */}
        <div className="flex min-w-0 flex-col lg:w-1/2">
          <div role="tablist" aria-label="Output" className="flex shrink-0 items-center border-b border-ink/10 bg-paper px-2">
            <button
              role="tab"
              aria-selected={pane === 'preview'}
              aria-controls="output-pane"
              onClick={() => setPaneChoice('preview')}
              className={paneBtn(pane === 'preview')}
            >
              <Eye className="h-3.5 w-3.5" aria-hidden="true" /> Preview
            </button>
            <button
              role="tab"
              aria-selected={pane === 'terminal'}
              aria-controls="output-pane"
              onClick={() => setPaneChoice('terminal')}
              className={paneBtn(pane === 'terminal')}
            >
              <TerminalSquare className="h-3.5 w-3.5" aria-hidden="true" /> Terminal
              {errored
                ? <span className="h-1.5 w-1.5 rounded-full bg-wire" aria-label="has errors" />
                // Clicking a link in the preview answers in the terminal, which
                // is the wrong pane to be looking at. Say that something landed.
                : pane !== 'terminal' && lines.length > 0 && (
                  <span
                    className="rounded-full bg-pcb px-1.5 text-[10px] font-extrabold leading-4 text-white"
                    aria-label={`${lines.length} new terminal messages`}
                  >
                    {lines.length}
                  </span>
                )}
            </button>
          </div>

          <div id="output-pane" className="h-[280px] bg-white lg:h-[340px]">
            {/* Both panes stay mounted: switching to the terminal must not
                reload the preview (and restart the student's script). */}
            <div className={`h-full ${pane === 'preview' ? '' : 'hidden'}`}>
              {srcDoc ? (
                <div className="flex h-full flex-col">
                  {/* A mock browser tab. <title> is invisible inside the frame,
                      so without this there is nowhere to see what it does. */}
                  <div className="flex shrink-0 items-center gap-1.5 border-b border-ink/10 bg-ink/5 px-2 py-1">
                    <span className="flex max-w-[70%] items-center gap-1.5 rounded-t-md border border-ink/12 border-b-0 bg-white px-2.5 py-1">
                      <span className="h-2 w-2 shrink-0 rounded-sm bg-ink/25" aria-hidden="true" />
                      <span className="truncate text-[11px] font-bold text-ink/70">
                        {title ? title : <span className="italic text-ink/35">Untitled page</span>}
                      </span>
                    </span>
                  </div>
                  <iframe
                    key={frameKey}
                    ref={iframeRef}
                    title="Live preview of your page"
                    srcDoc={srcDoc}
                    onLoad={handleFrameLoad}
                    sandbox="allow-scripts"
                    className="min-h-0 w-full flex-1 border-0 bg-white"
                  />
                </div>
              ) : (
                <div className="flex h-full items-center justify-center px-6 text-center text-sm font-semibold text-ink/40">
                  Press&nbsp;<span className="rounded border border-ink/20 bg-paper px-1.5 py-0.5 font-mono-lab text-xs">Run</span>&nbsp;to see your page.
                </div>
              )}
            </div>
            <div className={`h-full ${pane === 'terminal' ? '' : 'hidden'}`}>
              <Terminal
                lines={lines}
                running={running}
                waiting={false}
                onSubmit={() => {}}
                emptyHint="console.log(…) output shows up here."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

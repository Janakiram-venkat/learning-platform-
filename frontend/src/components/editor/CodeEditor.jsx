import { useEffect, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import { Copy, Check, RotateCcw, Download, Minus, Plus } from 'lucide-react';

// A code editor with a small IDE-style toolbar: run shortcut, copy, reset to
// starter, download, and font-size controls. `onRun` (if given) is bound to
// Ctrl/Cmd+Enter inside the editor so learners can run without leaving the keys.
export default function CodeEditor({
  code,
  onChange,
  onRun,
  starterCode,
  language = 'python',
  filename = 'main.py',
}) {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const [fontSize, setFontSize] = useState(15);
  const [copied, setCopied] = useState(false);

  // Keep the run handler fresh without re-binding the Monaco command each render.
  const onRunRef = useRef(onRun);
  useEffect(() => { onRunRef.current = onRun; }, [onRun]);

  const handleMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    // Ctrl/Cmd+Enter runs the code.
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      onRunRef.current?.();
    });
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch { /* clipboard blocked */ }
  };

  const reset = () => {
    if (starterCode == null) return;
    if (code !== starterCode && !window.confirm('Reset your code back to the starter? Your changes will be lost.')) return;
    onChange(starterCode);
  };

  const download = () => {
    const blob = new Blob([code || ''], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const btn = 'flex items-center gap-1 rounded-md px-2 py-1 text-xs font-bold text-ink/60 transition-colors hover:bg-ink/8 hover:text-ink disabled:opacity-40';

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-md border-2 border-ink/15 bg-white">
      {/* Toolbar */}
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-ink/10 bg-paper px-2 py-1">
        <span className="flex items-center gap-1.5 pl-1 text-xs font-bold text-ink/45">
          <span className="h-2.5 w-2.5 rounded-full bg-pcb" /> {filename}
        </span>
        <div className="flex items-center gap-0.5">
          <button onClick={() => setFontSize((f) => Math.max(11, f - 1))} className={btn} title="Smaller text">
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="w-6 text-center text-xs font-bold text-ink/40">{fontSize}</span>
          <button onClick={() => setFontSize((f) => Math.min(24, f + 1))} className={btn} title="Larger text">
            <Plus className="h-3.5 w-3.5" />
          </button>
          <span className="mx-1 h-4 w-px bg-ink/10" />
          <button onClick={copy} className={btn} title="Copy code">
            {copied ? <Check className="h-3.5 w-3.5 text-pcb" /> : <Copy className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <button onClick={download} className={btn} title="Download file">
            <Download className="h-3.5 w-3.5" />
          </button>
          {starterCode != null && (
            <button onClick={reset} className={btn} title="Reset to starter code">
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="min-h-0 flex-1">
        <Editor
          height="100%"
          defaultLanguage={language}
          language={language}
          value={code}
          onChange={onChange}
          onMount={handleMount}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize,
            fontFamily: "'JetBrains Mono', 'Fira Code', ui-monospace, monospace",
            fontLigatures: true,
            lineNumbers: 'on',
            wordWrap: 'on',
            scrollBeyondLastLine: false,
            padding: { top: 14, bottom: 14 },
            tabSize: 4,
            insertSpaces: true,
            bracketPairColorization: { enabled: true },
            autoClosingBrackets: 'always',
            autoClosingQuotes: 'always',
            matchBrackets: 'always',
            renderLineHighlight: 'all',
            cursorBlinking: 'smooth',
            smoothScrolling: true,
            suggestOnTriggerCharacters: true,
            quickSuggestions: true,
            scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10 },
            // Re-layout when the split pane is dragged so nothing overflows.
            automaticLayout: true,
          }}
        />
      </div>
    </div>
  );
}

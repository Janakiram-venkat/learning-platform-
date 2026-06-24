import Editor from '@monaco-editor/react';

export default function CodeEditor({ code, onChange }) {
  return (
    <div className="h-full w-full border border-gray-200 rounded-md overflow-hidden">
      <Editor
        height="100%"
        defaultLanguage="python"
        value={code}
        onChange={onChange}
        theme="light"
        options={{
          minimap: { enabled: false },
          fontSize: 16,
          lineNumbers: 'on',
          wordWrap: 'on',
          scrollBeyondLastLine: false,
          padding: { top: 16 },
          // Observe the container and re-layout when it resizes (e.g. when the
          // lesson/editor splitter is dragged) so the editor never overflows.
          automaticLayout: true
        }}
      />
    </div>
  );
}

export default function OutputPanel({ output, isRunning, error }) {
  return (
    <div className="bg-[#111827] text-white p-4 rounded-md h-full flex flex-col font-mono text-sm overflow-y-auto">
      <div className="text-gray-400 mb-2 border-b border-gray-700 pb-2 flex justify-between">
        <span>Output Console</span>
        {isRunning && <span className="text-blue-400 animate-pulse">Running...</span>}
      </div>
      <div className="flex-1 whitespace-pre-wrap">
        {error ? (
          <span className="text-red-400">{error}</span>
        ) : (
          <span>{output || 'Output will appear here...'}</span>
        )}
      </div>
    </div>
  );
}

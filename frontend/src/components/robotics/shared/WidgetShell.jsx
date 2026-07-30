/**
 * The frame every robotics widget sits in.
 *
 * Deliberately the same shape as the Python course's LessonSimulation shell —
 * ink border, hard shadow, signal-yellow title bar — so an interactive block
 * reads as the same kind of object wherever a student meets one.
 *
 * `side` is the wide-screen affordance. A widget is normally a stack: scene on
 * top, readout underneath. On a narrow sheet that's right, but once the sheet
 * is wide the stack leaves the scene short and the readout stretched across a
 * metre of nothing. Pass the readout as `side` and it moves into a rail on the
 * right, letting the scene take the height it was starving for.
 *
 * The breakpoint is a *container* query against the lesson sheet (which
 * declares `container-type: inline-size`) rather than a viewport one: some
 * lessons put a 600px editor panel beside the content, so viewport width says
 * very little about how much room this widget has. 68rem is where the split
 * starts paying — below it the 21rem rail would leave the scene narrower than
 * it is tall. Every widget uses that same threshold, so the page flips to two
 * columns all at once rather than piecemeal. Class strings are written out in
 * full: Tailwind scans source text, so a composed one is invisible to it.
 */
export default function WidgetShell({ title, hint, controls, footer, side, children }) {
  return (
    <div className="my-8 overflow-hidden rounded-2xl border-2 border-ink bg-white shadow-[4px_4px_0_rgba(22,36,29,0.9)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-ink bg-signal px-4 py-3">
        <span className="font-lab text-sm font-bold text-ink">{title}</span>
        {controls}
      </div>

      {side ? (
        <div className="grid @min-[68rem]:grid-cols-[minmax(0,1fr)_21rem]">
          <div className="min-w-0">{children}</div>
          <div className="min-w-0 border-t-2 border-ink/10 @min-[68rem]:max-h-[min(64vh,680px)] @min-[68rem]:overflow-y-auto @min-[68rem]:border-l-2 @min-[68rem]:border-t-0">
            {side}
          </div>
        </div>
      ) : (
        children
      )}

      {(hint || footer) && (
        <div className="border-t-2 border-ink/10 bg-paper/60 px-4 py-3">
          {footer}
          {hint && <p className="text-sm font-semibold text-ink/60">{hint}</p>}
        </div>
      )}
    </div>
  );
}

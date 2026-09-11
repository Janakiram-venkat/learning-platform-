# Game engine improvements

The contest reuses the game-dev course's engine: the `stage` Python library
(`frontend/src/game/stage.py`) running in a Pyodide worker
(`frontend/src/workers/game.worker.js`) that draws to an OffscreenCanvas, driven
from `frontend/src/services/gameRuntime.js`. Python never loops — it sets up
sprites and an `every_frame` function, and the worker calls back into Python
once per frame.

This list came from reading that code ahead of the first contest. Items 1–5 are
fixes to land **before** a competition (bugs or unfairness); 6–9 make students'
games better. Every engine change also applies to the game-dev course, since both
share the same runtime.

| # | Improvement | Why | Status |
|---|---|---|---|
| 1 | Recover from a game that freezes mid-play | A loop that never ends inside `every_frame` hangs the worker; Stop does nothing, and after the timeout kills the worker the screen stays blank until the page is reloaded | Done |
| 2 | Same game speed on every monitor | The loop runs one update per screen refresh, so games run 2× faster on a 120Hz laptop than a 60Hz one | Done |
| 3 | Show `print()` from inside `every_frame` | Only prints during setup reach the page; prints from the game loop are silently lost, which makes debugging hard | Done |
| 4 | Arrow keys work right after Ctrl+Enter | Ctrl+Enter leaves focus in the code editor, which swallows the arrow keys, so the game doesn't respond | Done |
| 5 | Screen matches the game's size | The on-page screen is always 480×360; `Game(width=800, height=400)` is drawn squashed | Done |
| 6 | Mouse and click input | Keyboard only today — rules out clicker, aiming and drag games | Later |
| 7 | Sound effects | A small named pack (`game.play("coin")`), like the picture pack | Later |
| 8 | Sprite rotation (`sprite.angle`) | Spinning and aiming; follows how `scale_x`/`scale_y` were added | Later |
| 9 | Cheaper frames with many sprites | Each frame sends every sprite twice (render list + the grading `all` list); live play only needs the first | Later |

Also noticed, low priority: `touching()` treats `Text` as a 20px square centred
on its position, but text is drawn from its top-left corner.

## Design notes

### 1. Freeze recovery
- **Detect:** while a game loop is running, the worker sends a small "alive"
  message a few times a second. If none arrives for 4 seconds, the main thread
  terminates the worker and shows *"Your game froze…"*. The clock only runs while
  the tab is visible, because a hidden tab pauses animation frames and would
  otherwise look like a freeze.
- **Recover the screen:** a canvas can only be handed to a worker once. Whenever
  the worker is torn down (this watchdog, the existing 15s setup timeout, or a
  timed-out check), `GameCanvas` remounts a fresh `<canvas>` element and hands
  that to the new worker.

### 2. Fixed timestep
- The worker advances the game in fixed 1/60-second steps based on elapsed time,
  whatever the refresh rate. At 120Hz some frames do no update; at 30Hz some
  frames do two.
- Catch-up is capped at 4 steps per frame, so a slow frame or a dropped moment
  can't turn into a burst of fast-forward.
- Python gains `_step_json(keys, steps)`: several updates and one snapshot per
  call, so catch-up frames don't pay for extra snapshots. The headless checker
  keeps using `_tick_json` and is unchanged.

### 3. Prints from the game loop
- After setup, stdout keeps flowing into a buffer that the worker sends to the
  page with the "alive" message (so at most a few times a second). The page keeps
  only the latest output, so a game printing every frame can't flood memory.

### 4. Focus
- Starting a game moves focus out of the code editor, so the keyboard reaches the
  game straight away. Click back into the editor to keep typing.

### 5. Screen size
- The worker reports the game's `width`/`height` when a run starts, and the page
  sizes the screen to that shape. The contest page, the judging panel and the
  course page all use it.

## Verification (items 1–5)

Run on the real contest page in headless Chrome against a local SQLite backend:

- **Speed:** the browser was drawing about 45 frames a second; the game still
  advanced about 62 updates a second, so catch-up works (before the change it
  would have run at 45). Not yet tested on a monitor faster than 60Hz — that
  direction uses the same code, but those frames skip their update instead.
- **Freeze:** a `while True` inside `every_frame` was caught after about 5.6s with
  the new message. The next game ran and drew on a fresh screen without
  reloading. Pressing Stop on a healthy game did not trigger a false freeze.
  **Not verified:** that a hidden tab doesn't count as a freeze. Headless Chrome
  kept the tab "visible", so that path is untested.
- **Prints:** `print()` inside `every_frame` shows up under the screen a few
  times a second.
- **Focus:** after Ctrl+Enter from the editor, focus left the editor and the
  arrow key moved the player.
- **Screen size:** `Game(width=640, height=360)` got a 16:9 screen with no
  stretching.
- **No regressions:** the course's headless checker still grades correctly (a
  moving ball passes `moves`, a still one fails), and the full contest flow
  (autosave, offline recovery, submit, judging, results, phone layout) still
  passes.

Known limit: a very tall stage (e.g. 360×640) gets a very tall screen, because
the screen always fills its column's width.

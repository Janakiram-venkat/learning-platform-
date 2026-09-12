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
| 6 | Mouse and click input | Keyboard only today — rules out clicker, aiming and drag games | Done |
| 7 | Sound effects | A small named pack (`game.play("coin")`), like the picture pack | Done |
| 8 | Sprite rotation (`sprite.angle`) | Spinning and aiming; follows how `scale_x`/`scale_y` were added | Done |
| 9 | Cheaper frames with many sprites | Each frame sends every sprite twice (render list + the grading `all` list); live play only needs the first | Done |

Also fixed: `touching()` treated `Text` as a 20px square centred on its
position, but text is drawn from its top-left corner. Its hitbox now starts at
the top-left and is roughly as wide as the words.

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

### 6. Mouse
- New in Python: `game.mouse_x`, `game.mouse_y`, `game.mouse_down()`,
  `game.clicked()` / `game.clicked(thing)` and `game.mouse_over(thing)`.
- `GameCanvas` forwards pointer events (mouse, pen and touch) as fractions of
  the screen; the worker turns them into stage pixels, so it's right at any
  stage size and any on-page size. It captures the pointer on press, so a
  release off the screen still counts.
- A click is queued until the next update and counts on exactly one frame, even
  when a screen frame runs several catch-up updates.
- Check scenarios can drive the mouse: `mouse: {"*": [x, y]}` for where the
  pointer sits and `clicks: {"30": [x, y]}` for a click on that frame.
- Page scrolling on a phone is left alone, so a tap works but dragging a finger
  across the screen scrolls the page. Add `touch-action: none` to the canvas if
  a contest ever needs drag-on-phone.

### 7. Sound
- `game.play(name)` with ten names: coin, jump, hit, boom, laser, powerup, win,
  lose, click, pop. A wrong name raises an error that lists them.
- The sounds are made on the spot with Web Audio (`frontend/src/game/sounds.js`),
  so there are no files. Workers can't play audio, so each snapshot carries the
  frame's sound names and the page plays them.
- The audio is unlocked on the Play press (browsers block sound until the person
  interacts). The same sound can't restart within 60ms, and at most 8 play at
  once, so a game calling `play` every frame isn't a wall of noise.

### 8. Rotation
- `sprite.angle` (degrees, clockwise), `sprite.turn(degrees)` and
  `sprite.point_at(x, y)` (turns the sprite's right side toward the spot). Like
  scale, it only changes how the sprite looks; its hitbox doesn't turn.

### 9. Cheaper frames
- Live frames skip the `all` list and the unused `name`/`visible` fields in the
  drawing list. With 500 sprites (CPython): 2.2ms → 0.95ms per snapshot,
  147KB → 66KB of JSON per frame. The checker still gets the full list.

New checker rules: `turns` (a sprite's angle changes) and `plays_sound`
(optionally `sound: "coin"`).

## Verification (items 6–9)

- **Course unaffected:** every step's solution and starter code, in every check
  scenario, produces the same checker trace on the old and new `stage.py` (85 of
  85, same random seed), including the Text hitbox change.
- **In the browser** (contest page, headless Chrome, local SQLite backend):
  on a 640×360 stage, hovering the balloon reported `mouse 500 100 … over True`.
  A click on empty space reported `click at 200 250` and didn't pop it; a click
  on the balloon popped it exactly once. `mouse_down()` was True while held and
  False after release. The rocket aimed at the pointer and the star spun.
  Sounds created their tones after the real Play click.
- **Checker:** a scenario that clicks the balloon passes `count_drops` and
  `plays_sound`; one that clicks elsewhere fails both. `turns` passes only when
  the star actually spins.
- **Items 1–5 re-run:** they still pass (60 updates/s at a 45fps browser, freeze
  caught in 5.5s and recovered, focus, 16:9 screen, checker).
- **Not verified:** how the sounds actually sound — headless Chrome has no
  speakers, so only "the tones were created" is checked. Worth a listen.

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

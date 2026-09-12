"""stage: the Pocket Lab game kit.

A deliberately tiny game library for kids. The whole public API is:

    Game, Sprite, Box, Ball, Text, random_number

Design note for maintainers: `game.start()` does NOT loop. It only marks the
game as ready and hands control back. The JavaScript side then drives
requestAnimationFrame and calls `_step_json()` once per screen frame (the
checker calls `_tick_json()` once per frame, headless). That keeps the
student's program a normal run-to-completion script, so nothing blocks the
worker and an infinite loop in their own code is still catchable.
"""

import json
import math
import random as _random

# The stage every newly-created sprite attaches itself to. Set by Game().
_stage = None


def random_number(low, high):
    """A whole number between low and high (both included)."""
    return _random.randint(low, high)


# --- the picture pack -------------------------------------------------------
#
# There is no key on a laptop that types an emoji, so every picture also has a
# plain name you CAN type. These three lines all make the same cat:
#
#     Sprite("cat", x=100, y=100)     <- the name, nothing to import
#     Sprite(CAT, x=100, y=100)       <- the constant, if you imported it
#     Sprite("🐱", x=100, y=100)       <- the emoji itself, if you can paste one
#
# Every picture below was checked to make sure it actually draws on the stage.
PICTURES = {
    # animals
    "cat": "🐱", "dog": "🐶", "rabbit": "🐰", "frog": "🐸", "monkey": "🐵",
    "panda": "🐼", "fox": "🦊", "bee": "🐝", "ladybug": "🐞", "butterfly": "🦋",
    "turtle": "🐢", "fish": "🐟", "octopus": "🐙", "crab": "🦀", "chick": "🐔",
    "unicorn": "🦄",
    # food
    "apple": "🍎", "banana": "🍌", "grapes": "🍇", "strawberry": "🍓",
    "cherry": "🍒", "pizza": "🍕", "burger": "🍔", "donut": "🍩",
    "cookie": "🍪", "cake": "🎂", "carrot": "🥕",
    # sky and weather
    "star": "⭐", "sparkle": "✨", "moon": "🌙", "sun": "☀️", "cloud": "☁️",
    "lightning": "⚡", "fire": "🔥", "drop": "💧", "rainbow": "🌈",
    # plants
    "tree": "🌳", "cactus": "🌵", "flower": "🌻", "mushroom": "🍄",
    # balls and sport
    "ball": "🏀", "football": "⚽", "tennis": "🎾", "eight_ball": "🎱",
    # vehicles
    "rocket": "🚀", "car": "🚗", "bus": "🚌", "plane": "✈️",
    "helicopter": "🚁", "boat": "⛵",
    # things
    "basket": "🧺", "castle": "🏰", "gift": "🎁", "gem": "💎", "key": "🔑",
    "bomb": "💣", "balloon": "🎈", "bell": "🔔", "ice": "🧊", "rock": "🪨",
    # characters
    "alien": "👾", "ghost": "👻", "skull": "💀", "robot": "🤖",
    "pumpkin": "🎃",
    # symbols
    "heart": "❤️", "trophy": "🏆", "target": "🎯", "medal": "🥇",
    "tick": "✅", "cross": "❌",
}

# Every name above also exists as a SHOUTY constant, so `from stage import CAT`
# works. Built from the one table so the two can never drift apart.
globals().update({name.upper(): char for name, char in PICTURES.items()})


# --- the sound pack ---------------------------------------------------------
#
# game.play("coin") plays one of these. The sounds are made up on the spot by
# the browser (see sounds.js), so there are no files to load: the names here
# must match the ones there.
SOUNDS = ("coin", "jump", "hit", "boom", "laser", "powerup", "win", "lose",
          "click", "pop")


def picture(name):
    """Turn a picture name like "cat" into the emoji it stands for.

    Anything we don't recognise is handed straight back, so a real emoji (or
    any text you fancy drawing) still works exactly as before.
    """
    if isinstance(name, str):
        return PICTURES.get(name.strip().lower(), name)
    return name


class _Thing:
    """Shared behaviour for everything you can put on the stage."""

    def __init__(self, x=0, y=0, name=None):
        self.x = x
        self.y = y
        self.name = name
        self.visible = True
        self.dead = False
        if _stage is not None:
            _stage._add(self)

    # --- movement -------------------------------------------------------
    def move(self, dx=0, dy=0):
        """Shift by dx across and dy down."""
        self.x += dx
        self.y += dy

    def go_to(self, x, y):
        self.x = x
        self.y = y

    def hide(self):
        self.visible = False

    def show(self):
        self.visible = True

    def remove(self):
        """Take this off the stage for good."""
        self.dead = True
        self.visible = False

    # --- collision ------------------------------------------------------
    def _box(self):
        """(left, top, right, bottom): overridden by shapes with real size."""
        half = getattr(self, "size", 40) / 2
        return (self.x - half, self.y - half, self.x + half, self.y + half)

    def touching(self, other):
        """True when this thing overlaps another thing."""
        if other is None or self.dead or other.dead:
            return False
        al, at, ar, ab = self._box()
        bl, bt, br, bb = other._box()
        return al < br and ar > bl and at < bb and ab > bt

    def _render(self):
        raise NotImplementedError


class Sprite(_Thing):
    """A character drawn from a picture, e.g. Sprite("cat", x=100, y=80).

    `look` can be a picture name ("cat"), a constant (CAT), or an emoji you
    pasted in. `color` only matters when the look is plain text rather than an
    emoji; emoji bring their own colours.
    """

    def __init__(self, look="🙂", x=0, y=0, size=40, name=None, color="#FFFFFF"):
        self.look = picture(look)
        self.size = size
        self.color = color
        # How stretched the sprite is drawn, across and down. 1.0 is normal
        # size; bigger stretches that way, smaller squashes it. Purely visual:
        # collision boxes never look at these.
        self.scale_x = 1.0
        self.scale_y = 1.0
        # How far the sprite is turned, in degrees, clockwise. 0 is the
        # picture as drawn; 90 is a quarter turn. Purely visual, like scale.
        self.angle = 0
        super().__init__(x, y, name)

    def turn(self, degrees):
        """Spin by this many degrees: positive is clockwise."""
        self.angle = (self.angle + degrees) % 360

    def point_at(self, x, y):
        """Turn so the sprite's RIGHT-hand side faces the spot (x, y).

        Most pictures don't face right to begin with (a rocket points up and to
        the right), so add a few degrees afterwards if yours looks off:
        cannon.point_at(game.mouse_x, game.mouse_y); cannon.turn(45)
        """
        if x == self.x and y == self.y:
            return
        self.angle = math.degrees(math.atan2(y - self.y, x - self.x)) % 360

    def _render(self):
        return {"kind": "emoji", "look": self.look, "x": self.x, "y": self.y,
                "size": self.size, "color": self.color,
                "scale_x": self.scale_x, "scale_y": self.scale_y,
                "angle": self.angle}


class Box(_Thing):
    """A rectangle, e.g. Box(x=0, y=200, width=400, height=100, color="green")."""

    def __init__(self, x=0, y=0, width=60, height=40, color="#3FBF7F", name=None):
        self.width = width
        self.height = height
        self.color = color
        super().__init__(x, y, name)

    def _box(self):
        return (self.x, self.y, self.x + self.width, self.y + self.height)

    def _render(self):
        return {"kind": "box", "x": self.x, "y": self.y, "width": self.width,
                "height": self.height, "color": self.color}


class Ball(_Thing):
    """A circle, e.g. Ball(x=100, y=100, radius=20, color="red")."""

    def __init__(self, x=0, y=0, radius=20, color="#E8503A", name=None):
        self.radius = radius
        self.color = color
        super().__init__(x, y, name)

    @property
    def size(self):
        return self.radius * 2

    def _box(self):
        r = self.radius
        return (self.x - r, self.y - r, self.x + r, self.y + r)

    def _render(self):
        return {"kind": "ball", "x": self.x, "y": self.y, "radius": self.radius, "color": self.color}


class Text(_Thing):
    """Words on the stage, e.g. Text("Score: 0", x=10, y=20)."""

    def __init__(self, words="", x=10, y=24, size=20, color="#FFFFFF", name=None):
        self.words = words
        self.size = size
        self.color = color
        super().__init__(x, y, name)

    def _box(self):
        # Text is drawn from its top-left corner, so its hitbox is too. The
        # width is a guess (bold letters average a bit over half their height
        # across): close enough for "did the ball hit the word".
        width = len(str(self.words)) * self.size * 0.6
        return (self.x, self.y, self.x + width, self.y + self.size)

    def _render(self):
        return {"kind": "text", "words": str(self.words), "x": self.x, "y": self.y,
                "size": self.size, "color": self.color}


class Game:
    """The stage itself. Make one of these first, before any sprites."""

    def __init__(self, width=480, height=360, background="#0B1020", title=""):
        global _stage
        self.width = width
        self.height = height
        self.background = background
        self.title = title
        self.things = []
        self.frame = 0
        self.over = False
        self._update = None
        self._keys = set()
        self._started = False
        self._shake_frames = 0
        self._shake_power = 0
        # Where the mouse is on the stage. Starts in the middle until the
        # mouse first moves over the screen.
        self.mouse_x = width // 2
        self.mouse_y = height // 2
        self._mouse_held = False
        self._clicks = []        # [(x, y), ...] pressed since the last frame
        self._sounds = []        # names played since the last snapshot
        _stage = self

    def _add(self, thing):
        self.things.append(thing)

    # --- the game loop --------------------------------------------------
    def every_frame(self, fn):
        """Decorator. The function below it runs once per frame, ~60 times a second."""
        self._update = fn
        return fn

    def start(self):
        """Hand the game over to the screen. Put this at the very end."""
        self._started = True

    def stop(self):
        """End the game: the loop stops calling your every_frame function."""
        self.over = True

    def shake(self, frames=8, power=6):
        """Rattle the whole screen for a moment: call this on a big impact."""
        self._shake_frames = frames
        self._shake_power = power

    def play(self, sound):
        """Play a sound effect: game.play("coin"). See SOUNDS for the names."""
        name = str(sound).strip().lower()
        if name not in SOUNDS:
            raise ValueError(
                f'There is no sound called "{sound}". Try one of: ' + ", ".join(SOUNDS))
        self._sounds.append(name)

    # --- input ----------------------------------------------------------
    def key_down(self, key):
        """True while an arrow key or letter is held: game.key_down("left")."""
        return str(key).lower() in self._keys

    def mouse_down(self):
        """True while the mouse button (or a finger) is pressed on the stage."""
        return self._mouse_held

    def clicked(self, thing=None):
        """True on the frame a click lands (on `thing`, if you name one).

        if game.clicked(star):
            star.remove()
        """
        if thing is None:
            return bool(self._clicks)
        if thing.dead or not thing.visible:
            return False
        return any(_inside(thing, x, y) for x, y in self._clicks)

    def mouse_over(self, thing):
        """True while the mouse pointer is on top of `thing`."""
        if thing.dead or not thing.visible:
            return False
        return _inside(thing, self.mouse_x, self.mouse_y)

    # --- helpers students use -------------------------------------------
    def on_screen(self, thing, margin=0):
        left, top, right, bottom = thing._box()
        return (right >= -margin and left <= self.width + margin
                and bottom >= -margin and top <= self.height + margin)

    def clamp_inside(self, thing):
        """Keep a thing from wandering off the edges of the stage."""
        left, top, right, bottom = thing._box()
        if left < 0:
            thing.x += -left
        if right > self.width:
            thing.x -= right - self.width
        if top < 0:
            thing.y += -top
        if bottom > self.height:
            thing.y -= bottom - self.height

    # --- called by the runtime, not by students --------------------------
    def _set_mouse(self, mouse):
        """Take in the mouse as the page saw it: {"x", "y", "down", "clicks"}.

        Called with None on the catch-up frames of a screen frame, so a click
        counts once rather than once per update.
        """
        if mouse is None:
            self._clicks = []
            return
        if mouse.get("x") is not None:
            self.mouse_x = mouse["x"]
            self.mouse_y = mouse["y"]
        self._mouse_held = bool(mouse.get("down"))
        self._clicks = [(c[0], c[1]) for c in mouse.get("clicks") or []]

    def _tick(self, keys, mouse=None):
        self._keys = set(keys)
        self._set_mouse(mouse)
        if self._update is not None and not self.over:
            self._update()
        if self._shake_frames > 0:
            self._shake_frames -= 1
        self.frame += 1
        self.things = [t for t in self.things if not t.dead]

    def _snapshot(self, for_checker=True):
        """Everything the renderer and the behaviour checker need this frame.

        Live play only draws, so it asks for for_checker=False and skips the
        `all` list: with a lot of sprites that list is most of the work.
        """
        # One random jitter per frame, shared by every visible thing, so the
        # whole picture rattles together like a camera shake, not each
        # sprite jittering on its own. It only ever touches the RENDER list,
        # never the `all` list the checker grades, so shaking a passing game
        # can't make its behaviour checks flaky.
        if self._shake_frames > 0:
            jx = _random.randint(-self._shake_power, self._shake_power)
            jy = _random.randint(-self._shake_power, self._shake_power)
        else:
            jx = jy = 0

        things = []
        for t in self.things:
            if not t.visible:
                continue
            # Only what the painter needs: names and visibility are the
            # checker's business and live in `all`.
            rendered = t._render()
            rendered["x"] += jx
            rendered["y"] += jy
            things.append(rendered)

        snap = {
            "width": self.width,
            "height": self.height,
            "background": self.background,
            "frame": self.frame,
            "over": self.over,
            "shaking": self._shake_frames > 0,
            "sounds": list(self._sounds),
            "things": things,
        }
        if for_checker:
            # `all` includes hidden things too: the behaviour checker needs to
            # follow something even while it is invisible. `words` lets a check
            # see a score label actually change. `scale_x`/`scale_y`/`angle`
            # let it see squash-and-stretch or spinning actually happening.
            snap["all"] = [
                {"name": t.name, "x": t.x, "y": t.y, "kind": type(t).__name__,
                 "visible": t.visible, "words": getattr(t, "words", None),
                 "scale_x": getattr(t, "scale_x", None),
                 "scale_y": getattr(t, "scale_y", None),
                 "angle": getattr(t, "angle", None)}
                for t in self.things
            ]
        return snap


def _inside(thing, x, y):
    """True when the point (x, y) is inside the thing's hitbox."""
    left, top, right, bottom = thing._box()
    return left <= x <= right and top <= y <= bottom


# --- runtime bridge (the worker calls these; students never do) -----------

def _current():
    return _stage


def _tick_json(keys_json, mouse_json="null"):
    """One frame for the headless checker, with the full `all` list."""
    g = _stage
    if g is None:
        return "null"
    g._tick(json.loads(keys_json), json.loads(mouse_json))
    return _send(g, g._snapshot())


def _step_json(keys_json, steps, mouse_json="null"):
    """Advance `steps` frames with the same keys held, then snapshot once.

    The live loop runs at a fixed 60 updates a second whatever the screen's
    refresh rate, so one screen frame can owe more than one update. Only the
    last one gets drawn, so only the last one pays for a snapshot, and a
    drawing-only one at that. Sounds from every one of the steps are kept.
    """
    g = _stage
    if g is None:
        return "null"
    keys = json.loads(keys_json)
    mouse = json.loads(mouse_json)
    for i in range(steps):
        # Clicks land on the first update only; the rest just see the mouse
        # where it is.
        g._tick(keys, mouse if i == 0 or mouse is None else dict(mouse, clicks=[]))
        if g.over:
            break
    return _send(g, g._snapshot(for_checker=False))


def _snapshot_json():
    """Frame zero, drawn before the loop starts. Carries setup's sounds."""
    g = _stage
    if g is None:
        return "null"
    return _send(g, g._snapshot(for_checker=False))


def _send(g, snap):
    # Each sound goes out in exactly one snapshot, then is forgotten.
    g._sounds = []
    return json.dumps(snap)


def _started():
    return _stage is not None and _stage._started


def _is_animated():
    """True when the student registered an every_frame function.

    A scene with no every_frame can never change, so the runtime paints it once
    and skips the frame loop entirely instead of burning 60fps on a still life.
    """
    return _stage is not None and _stage._update is not None


def _reset():
    global _stage
    _stage = None

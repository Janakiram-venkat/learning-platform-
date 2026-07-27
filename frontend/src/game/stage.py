"""stage — the Pocket Lab game kit.

A deliberately tiny game library for kids. The whole public API is:

    Game, Sprite, Box, Ball, Text, random_number

Design note for maintainers: `game.start()` does NOT loop. It only marks the
game as ready and hands control back. The JavaScript side then drives
requestAnimationFrame and calls `_tick()` once per frame. That keeps the
student's program a normal run-to-completion script, so nothing blocks the
worker and an infinite loop in their own code is still catchable.
"""

import json
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
        """(left, top, right, bottom) — overridden by shapes with real size."""
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
    emoji — emoji bring their own colours.
    """

    def __init__(self, look="🙂", x=0, y=0, size=40, name=None, color="#FFFFFF"):
        self.look = picture(look)
        self.size = size
        self.color = color
        super().__init__(x, y, name)

    def _render(self):
        return {"kind": "emoji", "look": self.look, "x": self.x, "y": self.y,
                "size": self.size, "color": self.color}


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
        """End the game — the loop stops calling your every_frame function."""
        self.over = True

    # --- input ----------------------------------------------------------
    def key_down(self, key):
        """True while an arrow key or letter is held: game.key_down("left")."""
        return str(key).lower() in self._keys

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
    def _tick(self, keys):
        self._keys = set(keys)
        if self._update is not None and not self.over:
            self._update()
        self.frame += 1
        self.things = [t for t in self.things if not t.dead]

    def _snapshot(self):
        """Everything the renderer and the behaviour checker need this frame."""
        return {
            "width": self.width,
            "height": self.height,
            "background": self.background,
            "frame": self.frame,
            "over": self.over,
            "things": [
                dict(t._render(), name=t.name, visible=t.visible)
                for t in self.things if t.visible
            ],
            # `all` includes hidden things too — the behaviour checker needs to
            # follow something even while it is invisible. `words` lets a check
            # see a score label actually change.
            "all": [
                {"name": t.name, "x": t.x, "y": t.y, "kind": type(t).__name__,
                 "visible": t.visible, "words": getattr(t, "words", None)}
                for t in self.things
            ],
        }


# --- runtime bridge (the worker calls these; students never do) -----------

def _current():
    return _stage


def _tick_json(keys_json):
    g = _stage
    if g is None:
        return "null"
    g._tick(json.loads(keys_json))
    return json.dumps(g._snapshot())


def _snapshot_json():
    g = _stage
    if g is None:
        return "null"
    return json.dumps(g._snapshot())


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

// The `stage` library, described item by item.
//
// One table, two readers: the in-course reference page (/course/:id/reference)
// and the public game manual (/manual). Keeping it here means a function can
// never be documented in one place and missing from the other.
//
// Each item is { sig, what, example, note? }. `note` is the "why it works like
// that" paragraph both pages hide behind a toggle: background, never a rule you
// need before you can use the function.

export const API_GROUPS = [
  {
    id: 'setup',
    title: 'Starting a game',
    blurb: 'Every game begins and ends with these. The stage has to exist before anything can stand on it.',
    items: [
      {
        sig: 'Game(width=480, height=360, background="#0B1020", title="")',
        what: 'Builds the stage: the screen everything is drawn on. Make this first, before any sprites.',
        example: 'game = Game(width=480, height=360, background="#0B1020")',
        note: 'Every thing you create afterwards quietly attaches itself to the stage that already exists. That is why a sprite never needs telling which screen it belongs to, and why making one BEFORE the Game gives you nothing on screen.',
      },
      {
        sig: 'game.width   game.height',
        what: 'How big the stage is, in the same numbers as x and y. Use these instead of typing 480 and 360 everywhere.',
        example: 'if bullet.x > game.width:\n    bullet.remove()',
        note: 'Written this way, a game keeps working after you change the stage size on the very first line. Numbers you typed by hand do not.',
      },
      {
        sig: 'game.start()',
        what: 'Hands your finished game over to the screen. Always the last line.',
        example: 'game.start()',
        note: 'Surprisingly, this does not loop. It only marks the game as ready and hands control back, so your program runs start-to-finish like any other script. The frame loop lives outside Python and calls back in once per frame, which is why a mistake in your code can never freeze the page.',
      },
      {
        sig: '@game.every_frame',
        what: 'Marks the function below it as the one to run once per frame, about 60 times a second.',
        example: '@game.every_frame\ndef update():\n    ball.x = ball.x + 3',
        note: 'A line beginning with @ is a decorator: it hands the function underneath to whatever follows the @. The game keeps it in its pocket and calls it every frame. This is why your game needs no while True: loop of its own.',
      },
      {
        sig: 'game.stop()',
        what: 'Ends the game. Your every_frame function stops being called.',
        example: 'if lives == 0:\n    game.stop()',
        note: 'Everything on the stage stays exactly where it was, so a GAME OVER label you show on the same frame is still there to read. Stopping is not the same as clearing.',
      },
    ],
  },
  {
    id: 'things',
    title: 'Things you can put on the stage',
    blurb: 'Four kinds of thing. Sprites and Balls are measured from their middle; Boxes and Text from their top-left corner.',
    items: [
      {
        sig: 'Sprite(look, x=0, y=0, size=40, name=None, color="#FFFFFF")',
        what: 'A character drawn from a picture. `look` is a picture name ("cat"), a constant (CAT), or an emoji.',
        example: 'cat = Sprite("cat", x=240, y=180, size=60)\nhero = Sprite("rocket", x=100, y=100, size=48)',
        note: 'Measured from its MIDDLE, so a size=60 sprite at y=180 reaches from 150 to 210. `color` only matters when the look is ordinary text: Sprite("1UP") draws the letters, and emoji bring their own colours.',
      },
      {
        sig: 'Box(x=0, y=0, width=60, height=40, color="#3FBF7F", name=None)',
        what: 'A plain coloured rectangle. Your ground, walls and platforms.',
        example: 'ground = Box(x=0, y=300, width=480, height=60, color="#1F7A5C")',
        note: 'Measured from its TOP-LEFT corner, not its middle: that is how nearly every graphics system stores a rectangle, because a corner plus a size is the cheapest thing to both draw and test for overlaps.',
      },
      {
        sig: 'Ball(x=0, y=0, radius=20, color="#E8503A", name=None)',
        what: 'A circle. Measured from its middle, like a sprite.',
        example: 'ball = Ball(x=60, y=180, radius=22, color="#E8503A")',
        note: 'Its `size` is worked out for you as radius times 2, so the collision code can treat it like anything else on the stage.',
      },
      {
        sig: 'Text(words, x=10, y=24, size=20, color="#FFFFFF", name=None)',
        what: 'Words on the stage. Scores, titles, GAME OVER.',
        example: 'label = Text("Score: 0", x=16, y=16, size=22, color="#FFC93C")\nlabel.words = "Score: 7"',
        note: 'The stage re-reads .words on every repaint, so changing it updates the screen within a sixtieth of a second. Measured from its top-left corner.',
      },
      {
        sig: 'thing.color',
        what: 'The colour of a Box, Ball or Text. Any CSS colour works: "red", "#FFC93C", "rgb(20,40,60)".',
        example: 'if game.mouse_over(button):\n    button.color = "#FFC93C"\nelse:\n    button.color = "#1F7A5C"',
      },
    ],
  },
  {
    id: 'moving',
    title: 'Moving and hiding things',
    blurb: 'Every thing on the stage (sprite, box, ball or text) understands all of these.',
    items: [
      {
        sig: 'thing.x   thing.y',
        what: 'Where it is. Change them to move it. x grows to the right, y grows DOWNWARDS.',
        example: 'cat.x = cat.x + 3\ncat.y = cat.y - 1',
      },
      { sig: 'thing.move(dx, dy)', what: 'Shift by dx across and dy down: the same as adding to x and y yourself.', example: 'cat.move(3, 0)' },
      { sig: 'thing.go_to(x, y)', what: 'Jump straight to an exact spot.', example: 'apple.go_to(240, 0)' },
      {
        sig: 'thing.hide()   thing.show()   thing.visible',
        what: 'Make it invisible, or bring it back. It stays on the stage either way.',
        example: 'ghost.hide()\nif game.frame % 120 == 0:\n    ghost.show()',
        note: 'Hiding is how you park something you will want again: a bullet waiting to be fired, a spare life, a menu screen. Removing it would mean building a new one.',
      },
      {
        sig: 'thing.remove()',
        what: 'Take it off the stage for good.',
        example: 'coin.remove()',
        note: 'Removed things are swept up at the end of the frame, not mid-way through it, so a list you are looping over cannot change underneath you.',
      },
      {
        sig: 'thing.dead',
        what: 'True once something has been removed. Useful when you keep your own list of sprites.',
        example: 'enemies = [e for e in enemies if not e.dead]',
      },
    ],
  },
  {
    id: 'asking',
    title: 'Asking the game questions',
    blurb: 'These give you True or False, which is exactly what an if wants.',
    items: [
      {
        sig: 'thing.touching(other)',
        what: 'True when two things overlap.',
        example: 'if basket.touching(apple):\n    score = score + 1',
        note: 'Every thing has an invisible rectangle around it called a hitbox. This asks whether the two rectangles overlap across AND down: both have to be true. It is why you sometimes die to a spike you would swear you missed: you touched its box, not its point.',
      },
      {
        sig: 'game.key_down(key)',
        what: 'True while a key is held. Use "left", "right", "up", "down", "space", "enter", "escape", or any letter.',
        example: 'if game.key_down("left"):\n    basket.x = basket.x - 6',
        note: 'It never waits: it answers instantly with what is true right now, and you ask again next frame. That is called polling, and it is why holding a key gives smooth movement rather than one nudge.',
      },
      {
        sig: 'game.clamp_inside(thing)',
        what: 'Keeps a thing from wandering off the edges of the stage.',
        example: 'game.clamp_inside(basket)',
        note: "Works from the thing's real edges rather than a number you guessed, so it stays correct even after you change its size. Call it AFTER you move: move first, then correct.",
      },
      {
        sig: 'game.on_screen(thing, margin=0)',
        what: 'True while any part of the thing is still visible. Give a margin to count a little way off the edge as still on.',
        example: 'if not game.on_screen(bullet):\n    bullet.remove()',
        note: 'Every sprite you forget to remove is still drawn and still tested, forever. A game quietly piling up a thousand off-screen bullets is the usual reason one starts to stutter.',
      },
      {
        sig: 'game.frame',
        what: 'How many frames have run so far. Handy for timing: 60 frames is about a second.',
        example: 'if game.frame % 60 == 0:\n    spawn_enemy()',
      },
      { sig: 'game.over', what: 'True once game.stop() has been called.', example: 'if not game.over:\n    score = score + 1' },
    ],
  },
  {
    id: 'mouse',
    title: 'The mouse',
    blurb: 'For clicking, aiming and dragging. A tap on a touch screen counts as a click.',
    items: [
      {
        sig: 'game.mouse_x   game.mouse_y',
        what: 'Where the mouse pointer is on the stage, in the same numbers as x and y.',
        example: 'crosshair.go_to(game.mouse_x, game.mouse_y)',
        note: 'Until the mouse first moves over the screen, these point at the middle of the stage.',
      },
      {
        sig: 'game.clicked()   game.clicked(thing)',
        what: 'True on the one frame a click happens, anywhere or on that thing.',
        example: 'if game.clicked(balloon):\n    balloon.remove()',
        note: 'A click is over in an instant, so this is True for just one frame and then False again. That is what you want for "pop the balloon": one click, one pop. For "keep firing while held", use mouse_down() instead.',
      },
      {
        sig: 'game.mouse_down()',
        what: 'True while the mouse button (or a finger) is held down on the stage.',
        example: 'if game.mouse_down():\n    gem.go_to(game.mouse_x, game.mouse_y)',
      },
      {
        sig: 'game.mouse_over(thing)',
        what: 'True while the pointer is on top of the thing, for buttons that light up.',
        example: 'if game.mouse_over(button):\n    button.color = "#FFC93C"',
      },
    ],
  },
  {
    id: 'feel',
    title: 'Sound, spinning and squashing',
    blurb: 'None of this changes what your game does. All of it changes how it feels to play, which is most of what a judge notices.',
    items: [
      {
        sig: 'game.play(sound)',
        what: 'Plays a sound effect: "coin", "jump", "hit", "boom", "laser", "powerup", "win", "lose", "click" or "pop".',
        example: 'if basket.touching(apple):\n    game.play("coin")',
        note: 'There are no sound files. Each sound is made on the spot from a wave that wobbles a certain number of times a second: the faster it wobbles, the higher the note. "coin" is two quick high notes; "boom" is a burst of random noise sliding down. The same trick powered every sound in 1980s arcade games. A name that is not on the list raises an error, so check your spelling.',
      },
      {
        sig: 'game.shake(frames=8, power=6)',
        what: 'Rattles the whole screen for a moment. Call it on a big impact.',
        example: 'if ship.touching(rock):\n    game.play("boom")\n    game.shake(12, 8)',
        note: 'The jitter is added when the picture is painted, not to the sprites themselves, so nothing really moves: a shake can never knock your player through a wall.',
      },
      {
        sig: 'sprite.angle',
        what: 'How far a sprite is turned, in degrees. 0 is how the picture normally looks; 90 is a quarter turn clockwise.',
        example: 'wheel.angle = wheel.angle + 5',
        note: 'Turning only changes how it looks. Its hitbox stays the same square, so touching() works exactly as before.',
      },
      {
        sig: 'sprite.turn(degrees)',
        what: 'Spin by that many degrees. Positive turns clockwise, negative turns the other way.',
        example: '@game.every_frame\ndef update():\n    star.turn(3)',
      },
      {
        sig: 'sprite.point_at(x, y)',
        what: "Turns the sprite so its right-hand side faces that spot.",
        example: 'cannon.point_at(game.mouse_x, game.mouse_y)',
        note: 'Most pictures do not face right to start with (the rocket points up and to the right, for example), so if yours looks off, add a turn() straight after to line it up.',
      },
      {
        sig: 'sprite.scale_x   sprite.scale_y',
        what: 'How stretched a sprite is drawn, across and down. 1.0 is normal, 1.4 is fatter, 0.6 is squashed.',
        example: 'hero.scale_y = 0.7\nhero.scale_x = 1.3',
        note: 'Squash on landing and stretch on take-off is the oldest trick in animation. Two lines of it make a jump feel twice as good, and like angle it never touches the hitbox.',
      },
    ],
  },
  {
    id: 'extras',
    title: 'Odds and ends',
    blurb: '',
    items: [
      {
        sig: 'random_number(low, high)',
        what: 'A whole number between low and high, both included.',
        example: 'apple.x = random_number(30, 450)',
        note: 'Computers cannot truly be random; they run a formula tangled enough that the answer is unpredictable to us. Good enough for a falling apple, and the same idea shuffles every online deck of cards.',
      },
      {
        sig: 'PICTURES   /   CAT, DOG, ROCKET ...',
        what: 'The picture pack. Every picture has a typable name, and a SHOUTY constant you can import.',
        example: 'from stage import Game, Sprite, DOG\n\npup = Sprite(DOG, x=100, y=100)\nsame = Sprite("dog", x=200, y=100)',
      },
      {
        sig: 'thing.name',
        what: 'An optional name tag inside the thing, which the step checker can follow.',
        example: 'apple = Sprite("apple", x=240, y=0, name="apple")',
        note: 'Different from the Python label on the left of the = sign. That one is for you; this one is for the game.',
      },
      {
        sig: 'print(anything)',
        what: 'Ordinary Python print. Whatever you print appears under the stage, which is how you spy on a number that is misbehaving.',
        example: 'print("speed is", speed)',
        note: 'Printing on every one of 60 frames a second floods the panel, so guard it: if game.frame % 30 == 0: print(...). Printing costs time too, so take them out before you submit.',
      },
    ],
  },
];

export default API_GROUPS;

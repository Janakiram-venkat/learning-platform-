import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, Code2, Copy, Check, ChevronDown, Rocket, Gamepad2, Trophy, Wrench,
  AlertTriangle, ListChecks, Volume2, Palette, Map, Download, GraduationCap, Lightbulb,
} from 'lucide-react';
import STAGE_SOURCE from '../game/stage.py?raw';
import { API_GROUPS } from '../game/stageApi';
import PicturePack from '../components/game/PicturePack';

// The public game dev manual.
//
// Deliberately reachable without an account (/manual): a contest is open to
// people who have not worked through the course, and "read the manual first" is
// only fair advice if the manual is one click away from the contest page.
//
// Two rules this page is built on, both learned the hard way:
//
//  1. EVERY code block is a whole program that runs on its own. A beginner does
//     not paste a fragment into the right place; they paste it into an empty
//     editor and press Play. A snippet that assumes `player` already exists
//     hands them a NameError as their first experience of the manual.
//  2. Nothing is hidden from the printer. Collapsed panels stay in the DOM and
//     the PDF button expands them all before calling print(), so the saved file
//     is the whole manual rather than a page of headings.

/* -------------------------------------------------------------- content */

// The words the rest of the manual uses. Written for someone who has never
// programmed: no term is explained using another term from further down.
const GLOSSARY = [
  ['program', 'The list of instructions you write. The computer does them in order, top to bottom, exactly as written.'],
  ['line', 'One instruction. Order matters: a line can only use something that an earlier line already made.'],
  ['variable', 'A name you give to a value so you can use it later. score = 0 means "from now on, score means 0".'],
  ['value', 'A piece of information. 7 is a number, "Score: 0" is text (quotes make it text), True and False are answers to yes-or-no questions.'],
  ['function', 'A job with a name. random_number is a function: you give it two numbers, it gives you one back.'],
  ['call', 'Using a function, by writing its name and round brackets: game.stop(). The brackets are what makes it happen.'],
  ['argument', 'Something you hand to a function inside its brackets. In Sprite("cat", x=100) both "cat" and x=100 are arguments.'],
  ['attribute', 'A piece of something, reached with a dot. cat.x is the cat’s across-position. You can read it and you can change it.'],
  ['sprite', 'A picture standing on the stage, like the cat or the rocket. Anything the player sees and cares about is usually a sprite.'],
  ['stage', 'The black rectangle your game is drawn on. Also the name of the library you import from.'],
  ['frame', 'One picture of the game. The screen redraws about 60 frames a second, and your update() runs once per frame.'],
  ['list', 'A row of values kept under one name, written in square brackets: rocks = []. You add to it with .append() and walk through it with a for loop.'],
  ['if', 'Do the lines underneath only when something is true. The lines underneath must be pushed in by four spaces.'],
  ['indent', 'The four spaces at the start of a line. Python uses them to see which lines belong inside an if or a def. They are not decoration.'],
  ['comment', 'Anything after a # on a line. Python ignores it. It is a note to yourself.'],
  ['decorator', 'A line starting with @ that hands the function below it to something else. You need exactly one: @game.every_frame.'],
  ['hitbox', 'The invisible rectangle around each thing. touching() asks whether two hitboxes overlap.'],
  ['error', 'The computer saying it could not do what you asked, and why. It appears under the stage with the line number. It is information, not a telling-off.'],
];

// The first program, one line at a time. This is the single most important
// panel on the page for a true beginner.
const FIRST_PROGRAM = [
  ['from stage import Game, Sprite', 'Borrow two tools from the stage library: the screen, and a way to put a picture on it. Nothing in your program works without this line.'],
  ['', ''],
  ['game = Game(width=480, height=360,', 'Make the screen and call it game. 480 wide, 360 tall, with a dark blue background.'],
  ['            background="#101828")', 'The colour is text in quotes. "#101828" is a dark navy. Any colour name like "black" works too.'],
  ['', ''],
  ['cat = Sprite("cat", x=60, y=180, size=48)', 'Put a cat on the stage, 60 across and 180 down, drawn 48 big. Call it cat so you can talk to it later.'],
  ['', ''],
  ['@game.every_frame', 'The next function is the one to run over and over, about 60 times a second.'],
  ['def update():', 'Start of that function. Everything belonging to it is pushed in four spaces.'],
  ['    cat.x = cat.x + 2', 'Move the cat 2 to the right. Not once: every frame. That is what makes it look like movement.'],
  ['    if cat.x > game.width:', 'Has the cat gone off the right-hand edge?'],
  ['        cat.x = 0', 'If so, put it back at the left. Pushed in eight spaces, because it belongs to the if, which belongs to the function.'],
  ['', ''],
  ['game.start()', 'Hand the finished game to the screen. Always the last line. Without it the stage stays empty.'],
];

const FIRST_PROGRAM_CODE = `from stage import Game, Sprite

game = Game(width=480, height=360, background="#101828")

cat = Sprite("cat", x=60, y=180, size=48)


@game.every_frame
def update():
    cat.x = cat.x + 2
    if cat.x > game.width:
        cat.x = 0


game.start()`;

const SOUND_NOTES = [
  ['coin', 'Two quick rising notes. Picking something up.'],
  ['pop', 'A short blip. Bubbles, balloons, taps.'],
  ['jump', 'A note sliding upwards. Leaving the ground.'],
  ['laser', 'A thin note sliding down fast. Shooting.'],
  ['hit', 'A short dull thud. Taking damage.'],
  ['boom', 'Noise sliding down. Explosions, crashes.'],
  ['powerup', 'A little rising run of notes. A bonus.'],
  ['win', 'A bright three-note flourish. You did it.'],
  ['lose', 'The same flourish falling. You did not.'],
  ['click', 'A tick. Buttons and menus.'],
];

// Every recipe is a WHOLE program. Paste it into an empty editor, press Play,
// and it runs. Each one is checked against the real stage.py before shipping.
const RECIPES = [
  {
    id: 'r-keys',
    title: 'Move something with the arrow keys',
    does: 'A cat you can steer around the stage with the four arrow keys, which cannot escape off the edges.',
    how: 'Every frame, ask whether each key is held down. If it is, change x or y by a small amount. Doing that 60 times a second is what smooth movement is.',
    code: `from stage import Game, Sprite

game = Game(width=480, height=360, background="#101828")
player = Sprite("cat", x=240, y=180, size=48)


@game.every_frame
def update():
    if game.key_down("left"):
        player.x = player.x - 5
    if game.key_down("right"):
        player.x = player.x + 5
    if game.key_down("up"):
        player.y = player.y - 5
    if game.key_down("down"):
        player.y = player.y + 5

    game.clamp_inside(player)


game.start()`,
    tweak: 'Change 5 to 2 for a slow, heavy feel, or to 10 for a twitchy one.',
    watch: 'Four separate ifs, never elif. With elif, holding left and up together would only ever move you left.',
  },
  {
    id: 'r-score',
    title: 'A score that goes up',
    does: 'Click the star, the star jumps somewhere new and the score in the corner goes up by one.',
    how: 'A score needs two things that people forget to connect: a number you keep, and a Text on the stage that shows it. Change the number, then immediately change the label.',
    code: `from stage import Game, Sprite, Text, random_number

game = Game(width=480, height=360, background="#101828")
star = Sprite("star", x=240, y=180, size=48)

score = 0
score_label = Text("Score: 0", x=14, y=12, size=20, color="#FFC93C")


@game.every_frame
def update():
    global score

    if game.clicked(star):
        score = score + 1
        score_label.words = "Score: " + str(score)
        game.play("coin")
        star.go_to(random_number(40, 440), random_number(40, 320))


game.start()`,
    tweak: 'Give points of different sizes: score = score + 5 for a rarer, faster target.',
    watch: 'str(score) turns the number into text. Writing "Score: " + score instead is a TypeError, because Python will not glue a number onto a sentence for you.',
  },
  {
    id: 'r-fall',
    title: 'Something that falls, over and over',
    does: 'An apple drops from the top of the stage, and when it reaches the bottom it reappears at the top somewhere else. Forever.',
    how: 'Push it down a little each frame. When it passes the bottom edge, move it back above the top edge at a random x. One apple, reused, rather than a new one each time.',
    code: `from stage import Game, Sprite, random_number

game = Game(width=480, height=360, background="#101828")
apple = Sprite("apple", x=240, y=-20, size=36)


@game.every_frame
def update():
    apple.y = apple.y + 4

    if apple.y > game.height:
        apple.go_to(random_number(30, game.width - 30), -20)


game.start()`,
    tweak: 'Add a second apple: copy the two apple lines, rename it apple2, and give it a different speed.',
    watch: 'Starting it at y = -20 (just above the stage) rather than y = 0 means it slides in from off the top instead of appearing out of nowhere.',
  },
  {
    id: 'r-gravity',
    title: 'Gravity and jumping',
    does: 'A frog standing on the ground. Hold space and it jumps, then falls back down and lands.',
    how: 'This is the one recipe worth understanding properly. Do not move the frog down by a fixed amount. Keep a speed, add a little gravity to the SPEED every frame, then add the speed to y. Falling then starts slow and gets faster, exactly like real falling.',
    code: `from stage import Game, Sprite, Box

game = Game(width=480, height=360, background="#101828")
ground = Box(x=0, y=310, width=480, height=50, color="#1F7A5C")
hero = Sprite("frog", x=100, y=285, size=46)

GROUND_Y = 285
speed_y = 0


@game.every_frame
def update():
    global speed_y

    speed_y = speed_y + 0.6        # gravity pulls a bit harder every frame
    hero.y = hero.y + speed_y

    if hero.y >= GROUND_Y:         # landed
        hero.y = GROUND_Y
        speed_y = 0

        if game.key_down("space"):
            speed_y = -11          # negative is upwards
            game.play("jump")


game.start()`,
    tweak: 'Two numbers control the whole feel. 0.6 is the weight: make it 0.3 for the moon. -11 is the jump strength: make it -16 to jump higher.',
    watch: 'Negative speed means going up, because y grows downwards on a screen. The jump is inside the "landed" if on purpose, so you cannot jump again in mid-air.',
  },
  {
    id: 'r-many',
    title: 'Lots of enemies at once',
    does: 'Rocks fly in from the right, one every so often, and disappear once they are off the left-hand edge.',
    how: 'You cannot name a hundred rocks. Keep them in a list instead: add a new one now and then, and each frame walk through the list moving every one of them.',
    code: `from stage import Game, Sprite, random_number

game = Game(width=480, height=360, background="#0B1020")
rocks = []


@game.every_frame
def update():
    if game.frame % 40 == 0:          # every 40 frames, about 0.7 seconds
        rocks.append(Sprite("rock",
                            x=game.width + 20,
                            y=random_number(30, game.height - 30),
                            size=40))

    for rock in list(rocks):          # list(rocks) is a safe copy to walk
        rock.x = rock.x - 4

        if not game.on_screen(rock):
            rock.remove()             # take it off the stage
            rocks.remove(rock)        # and out of your list


game.start()`,
    tweak: 'Change 40 to 15 for a downpour. Change -4 to -8 to make them twice as fast.',
    watch: 'Two removals, and you need both. remove() takes it off the screen; rocks.remove() takes it out of your list so you stop moving something nobody can see.',
  },
  {
    id: 'r-shoot',
    title: 'Firing bullets',
    does: 'A rocket on the left, aliens drifting in from the right. Click anywhere to fire, and a hit removes both the bullet and the alien.',
    how: 'A bullet is just a small fast thing in a list. Make one when the player clicks, move them all each frame, and compare every bullet against every alien.',
    code: `from stage import Game, Sprite, Ball, random_number

game = Game(width=480, height=360, background="#0B1020")
ship = Sprite("rocket", x=60, y=180, size=44)
bullets = []
aliens = []


@game.every_frame
def update():
    if game.key_down("up"):
        ship.y = ship.y - 5
    if game.key_down("down"):
        ship.y = ship.y + 5
    game.clamp_inside(ship)

    if game.clicked():
        bullets.append(Ball(x=ship.x + 20, y=ship.y, radius=5, color="#FFC93C"))
        game.play("laser")

    if game.frame % 70 == 0:
        aliens.append(Sprite("alien", x=500, y=random_number(30, 330), size=40))

    for alien in list(aliens):
        alien.x = alien.x - 2
        if not game.on_screen(alien):
            alien.remove()
            aliens.remove(alien)

    for bullet in list(bullets):
        bullet.x = bullet.x + 9

        if not game.on_screen(bullet):
            bullet.remove()
            bullets.remove(bullet)
            continue

        for alien in list(aliens):
            if bullet.touching(alien):
                game.play("boom")
                bullet.remove()
                bullets.remove(bullet)
                alien.remove()
                aliens.remove(alien)
                break


game.start()`,
    tweak: 'Swap game.clicked() for game.key_down("space") to fire with the keyboard instead. Note that a held key fires every frame, which is a machine gun.',
    watch: 'The break after a hit matters. That bullet is gone, so carrying on comparing it to the other aliens would be comparing something that no longer exists.',
  },
  {
    id: 'r-timer',
    title: 'A countdown clock',
    does: 'Thirty seconds counting down in the corner. At zero the game says TIME UP and stops.',
    how: 'The game runs at about 60 frames a second, so game.frame divided by 60 is roughly how many seconds have passed. No clock needed.',
    code: `from stage import Game, Sprite, Text

game = Game(width=480, height=360, background="#142033")
gem = Sprite("gem", x=240, y=200, size=52)
time_label = Text("Time: 30", x=350, y=12, size=20, color="#23B5D3")


@game.every_frame
def update():
    seconds_left = 30 - game.frame // 60
    time_label.words = "Time: " + str(seconds_left)
    gem.turn(2)

    if seconds_left <= 0:
        Text("TIME UP", x=150, y=150, size=40)
        game.play("win")
        game.stop()


game.start()`,
    tweak: 'Change 30 to 60 for a longer round, or count upwards with game.frame // 60 on its own.',
    watch: '// is whole-number division. 90 // 60 is 1, not 1.5, which is exactly what a clock display wants.',
  },
  {
    id: 'r-lives',
    title: 'Lives, and a proper game over',
    does: 'Three hearts. Press space to take a hit. At zero lives the stage says GAME OVER and everything stops.',
    how: 'Ending well is worth marks and costs four lines. Say what happened, show it on the stage, make a noise, then stop. A game that simply freezes looks broken.',
    code: `from stage import Game, Sprite, Text

game = Game(width=480, height=360, background="#101828")
hero = Sprite("panda", x=240, y=200, size=56)

lives = 3
lives_label = Text("Lives: 3", x=14, y=12, size=20, color="#E8503A")
hint = Text("Press space to take a hit", x=120, y=320, size=16)


@game.every_frame
def update():
    global lives

    if game.key_down("space") and game.frame % 30 == 0:
        lives = lives - 1
        lives_label.words = "Lives: " + str(lives)
        game.play("hit")
        game.shake(10, 6)

        if lives <= 0:
            hero.hide()
            Text("GAME OVER", x=120, y=140, size=42)
            game.play("lose")
            game.stop()


game.start()`,
    tweak: 'Add a score and print it under GAME OVER: Text("Final score: " + str(score), x=150, y=190, size=20).',
    watch: 'Everything stays on screen after game.stop(), so a label added on the very same frame is still readable. Stopping is not the same as clearing.',
  },
  {
    id: 'r-states',
    title: 'A start screen, then the game',
    does: 'A title screen that waits for space, then the real game begins.',
    how: 'Keep one variable saying which screen you are on, and have update() do completely different work depending on it. This is how every real game does menus, levels and pauses.',
    code: `from stage import Game, Sprite, Text

game = Game(width=480, height=360, background="#101828")
player = Sprite("rocket", x=60, y=180, size=44)
player.hide()

title = Text("PRESS SPACE", x=120, y=150, size=36, color="#FFC93C")
mode = "title"


@game.every_frame
def update():
    global mode

    if mode == "title":
        if game.key_down("space"):
            title.hide()
            player.show()
            game.play("click")
            mode = "play"
        return              # nothing else happens while on the title screen

    # everything below here is the real game
    player.x = player.x + 3
    if player.x > game.width:
        player.x = 0


game.start()`,
    tweak: 'Add a third mode, "over", and switch to it when the player loses. Then space on the over screen can send them back to "play".',
    watch: 'That return is what keeps the two screens apart. Without it the game would be playing underneath your title the whole time.',
  },
  {
    id: 'r-aim',
    title: 'Aim at the mouse',
    does: 'A rocket in the middle that always points at your mouse pointer, and a target that follows it.',
    how: 'point_at turns a sprite so its right-hand side faces a spot. Most pictures are not drawn facing right, so add a turn() afterwards to line yours up.',
    code: `from stage import Game, Sprite

game = Game(width=480, height=360, background="#0B1020")
cannon = Sprite("rocket", x=240, y=180, size=56)
crosshair = Sprite("target", x=240, y=180, size=32)


@game.every_frame
def update():
    cannon.point_at(game.mouse_x, game.mouse_y)
    cannon.turn(45)          # the rocket is drawn pointing up and right

    crosshair.go_to(game.mouse_x, game.mouse_y)

    if game.mouse_down():
        crosshair.size = 44
    else:
        crosshair.size = 32


game.start()`,
    tweak: 'Take out the turn(45) line and watch the rocket sit at a funny angle. That is what the correction is for.',
    watch: 'point_at sets the angle outright, so calling it every frame is fine. turn() adds to the angle, so calling it every frame spins the sprite forever.',
  },
  {
    id: 'r-harder',
    title: 'Getting harder as you go',
    does: 'A basket catching apples, where every catch makes the next apple fall faster.',
    how: 'Keep the difficulty in a variable and nudge it up whenever the player does well. A game that never gets harder is finished in the player’s head long before it is finished on screen.',
    code: `from stage import Game, Sprite, Text, random_number

game = Game(width=480, height=360, background="#101828")
basket = Sprite("basket", x=240, y=310, size=52)
apple = Sprite("apple", x=240, y=-20, size=36)

speed = 3
score = 0
label = Text("Score: 0", x=14, y=12, size=20, color="#FFC93C")


@game.every_frame
def update():
    global speed, score

    if game.key_down("left"):
        basket.x = basket.x - 7
    if game.key_down("right"):
        basket.x = basket.x + 7
    game.clamp_inside(basket)

    apple.y = apple.y + speed

    if basket.touching(apple):
        score = score + 1
        label.words = "Score: " + str(score)
        speed = min(speed + 0.3, 12)     # faster, but never above 12
        game.play("coin")
        apple.go_to(random_number(30, 450), -20)

    elif apple.y > game.height:
        apple.go_to(random_number(30, 450), -20)


game.start()`,
    tweak: 'Make it ramp faster with 0.6 instead of 0.3, or cap it lower than 12 if it becomes impossible.',
    watch: 'Always cap the difficulty. Something that speeds up forever stops being a challenge and becomes a coin flip.',
  },
  {
    id: 'r-juice',
    title: 'Make it feel good',
    does: 'The same catching game, with a sound, a screen shake and a squash on every catch. Play this one next to the recipe above and the difference is obvious.',
    how: 'None of this changes a single rule of your game, and all of it changes how the game feels in the first ten seconds. In a contest this is the cheapest scoring there is.',
    code: `from stage import Game, Sprite, random_number

game = Game(width=480, height=360, background="#101828")
basket = Sprite("basket", x=240, y=310, size=52)
apple = Sprite("apple", x=240, y=-20, size=36)


@game.every_frame
def update():
    if game.key_down("left"):
        basket.x = basket.x - 7
    if game.key_down("right"):
        basket.x = basket.x + 7
    game.clamp_inside(basket)

    apple.y = apple.y + 4
    apple.turn(4)                                  # tumbling, not sliding

    if basket.touching(apple):
        game.play("coin")                          # 1. a sound on every event
        game.shake(6, 4)                           # 2. a rattle on impact
        basket.scale_y = 0.7                       # 3. squash flat...
        basket.scale_x = 1.3
        apple.go_to(random_number(30, 450), -20)

    elif apple.y > game.height:
        game.play("lose")
        apple.go_to(random_number(30, 450), -20)

    # ...then ease back to normal, a fifth of the way each frame
    basket.scale_x = basket.scale_x + (1.0 - basket.scale_x) * 0.2
    basket.scale_y = basket.scale_y + (1.0 - basket.scale_y) * 0.2


game.start()`,
    tweak: 'Try 0.05 instead of 0.2 in the last two lines for a slow, wobbly recovery.',
    watch: 'That easing line is worth stealing forever. Moving a value a fifth of the way towards its target every frame gives smooth springy motion in one line, with no maths.',
  },
];

// Whole games, start to finish. Each one runs exactly as printed.
const FULL_GAMES = [
  {
    id: 'g-catch',
    title: 'Apple Catcher',
    teaches: 'Keyboard control, score, lives, difficulty ramp',
    blurb: 'The best first game: it has a goal, a way to lose, and it gets harder. About 50 lines.',
    code: `from stage import Game, Sprite, Box, Text, random_number

game = Game(width=480, height=360, background="#101828")

ground = Box(x=0, y=330, width=480, height=30, color="#1F7A5C")
basket = Sprite("basket", x=240, y=305, size=48)
apple = Sprite("apple", x=240, y=-20, size=36)

score = 0
lives = 3
speed = 3

score_label = Text("Score: 0", x=14, y=12, size=20, color="#FFC93C")
lives_label = Text("Lives: 3", x=370, y=12, size=20, color="#E8503A")


def new_apple():
    apple.go_to(random_number(30, game.width - 30), -20)


@game.every_frame
def update():
    global score, lives, speed

    # 1. the player
    if game.key_down("left"):
        basket.x = basket.x - 7
    if game.key_down("right"):
        basket.x = basket.x + 7
    game.clamp_inside(basket)

    # 2. the apple
    apple.y = apple.y + speed

    # 3. caught it
    if basket.touching(apple):
        score = score + 1
        speed = min(speed + 0.2, 11)
        score_label.words = "Score: " + str(score)
        game.play("coin")
        new_apple()

    # 4. missed it
    elif apple.y > game.height:
        lives = lives - 1
        lives_label.words = "Lives: " + str(lives)
        game.play("lose")
        game.shake(8, 5)
        new_apple()

        if lives == 0:
            Text("GAME OVER", x=120, y=140, size=42)
            Text("Final score: " + str(score), x=150, y=190, size=20, color="#FFC93C")
            game.stop()


game.start()`,
  },
  {
    id: 'g-dodge',
    title: 'Asteroid Dodge',
    teaches: 'Lists, spawning, removing, screen shake',
    blurb: 'Endless dodging. This is the shape of most arcade games: a stream of things coming at you, and one that ends it.',
    code: `from stage import Game, Sprite, Text, random_number

game = Game(width=480, height=360, background="#0B1020")

ship = Sprite("rocket", x=70, y=180, size=44)
rocks = []
score = 0
score_label = Text("0", x=16, y=12, size=24, color="#23B5D3")


@game.every_frame
def update():
    global score

    # the ship
    if game.key_down("up"):
        ship.y = ship.y - 5
    if game.key_down("down"):
        ship.y = ship.y + 5
    game.clamp_inside(ship)

    # a new rock now and then, more often as the score climbs
    gap = max(14, 40 - score // 3)
    if game.frame % gap == 0:
        rocks.append(Sprite("rock",
                            x=game.width + 24,
                            y=random_number(30, game.height - 30),
                            size=40))

    for rock in list(rocks):
        rock.x = rock.x - 4
        rock.turn(3)

        if ship.touching(rock):
            game.play("boom")
            game.shake(16, 9)
            Text("CRASHED", x=140, y=150, size=40, color="#E8503A")
            Text("Dodged " + str(score), x=165, y=200, size=20)
            game.stop()

        elif not game.on_screen(rock):
            rock.remove()
            rocks.remove(rock)
            score = score + 1
            score_label.words = str(score)


game.start()`,
  },
  {
    id: 'g-pop',
    title: 'Balloon Pop',
    teaches: 'Mouse clicks, a countdown, a clean ending',
    blurb: 'A timed game: no way to lose, just a score when the clock runs out. Works on a phone too, because a tap counts as a click.',
    code: `from stage import Game, Sprite, Text, random_number

game = Game(width=480, height=360, background="#142033")

balloons = []
score = 0

score_label = Text("Popped: 0", x=14, y=12, size=20, color="#FFC93C")
time_label = Text("Time: 30", x=350, y=12, size=20, color="#23B5D3")


@game.every_frame
def update():
    global score

    seconds_left = 30 - game.frame // 60
    time_label.words = "Time: " + str(seconds_left)

    if seconds_left <= 0:
        Text("TIME UP", x=150, y=140, size=40)
        Text("You popped " + str(score), x=150, y=190, size=20, color="#FFC93C")
        game.play("win")
        game.stop()
        return

    if game.frame % 22 == 0:
        balloons.append(Sprite("balloon",
                               x=random_number(30, game.width - 30),
                               y=game.height + 24,
                               size=44))

    for b in list(balloons):
        b.y = b.y - 2

        if game.clicked(b):
            game.play("pop")
            score = score + 1
            score_label.words = "Popped: " + str(score)
            b.remove()
            balloons.remove(b)

        elif b.y < -30:
            b.remove()
            balloons.remove(b)


game.start()`,
  },
];

const ERRORS = [
  {
    msg: "NameError: name 'player' is not defined",
    means: 'You used a name the program has never been told about. Nearly always: you pasted part of a program rather than all of it, or you spelled the name differently from where you made it.',
    fix: 'Check that a line further up actually makes it, for example player = Sprite("cat", x=240, y=180). Spelling and capital letters must match exactly: Player and player are two different names.',
  },
  {
    msg: "NameError: name 'Sprite' is not defined",
    means: 'You used a tool you never borrowed. Python genuinely has not heard of it.',
    fix: 'Put everything you need on the first line: from stage import Game, Sprite, Box, Ball, Text, random_number',
  },
  {
    msg: 'Nothing appears on the stage at all',
    means: 'Almost always one of two things: there is no game.start() at the bottom, or something was made before the Game was made.',
    fix: 'The order is fixed. Game(...) first, your sprites second, game.start() last.',
  },
  {
    msg: "UnboundLocalError: local variable 'score' referenced before assignment",
    means: 'update() tried to change a variable that was made outside it. Python assumed you wanted a brand new one, then found it empty.',
    fix: 'Add global score as the first line inside update(). One line can list several: global score, lives, speed',
  },
  {
    msg: 'TypeError: can only concatenate str (not "int") to str',
    means: 'You tried to glue a number onto a piece of text.',
    fix: 'Wrap the number in str(): "Score: " + str(score)',
  },
  {
    msg: 'IndentationError: expected an indented block',
    means: 'The lines under a def or an if are not pushed in, or are pushed in by different amounts.',
    fix: 'Four spaces for each level, the same everywhere. Never mix tabs and spaces in one file.',
  },
  {
    msg: 'SyntaxError: invalid syntax',
    means: 'Python could not read the line at all. Look at the line ABOVE the one it names as well: a bracket or quote left open makes the next line look like nonsense.',
    fix: 'Check for a missing ), a missing ", and a missing : at the end of every if, else, for and def line.',
  },
  {
    msg: 'There is no sound called "ding"',
    means: 'game.play() only knows ten names.',
    fix: 'coin, pop, jump, laser, hit, boom, powerup, win, lose, click.',
  },
  {
    msg: 'AttributeError: NoneType object has no attribute ...',
    means: 'You are talking to something that was never made, or that was made after the line using it.',
    fix: 'Make sure the Game exists before any sprite, and that the name is created above the line that uses it.',
  },
  {
    msg: 'ValueError: list.remove(x): x not in list',
    means: 'You took the same thing out of a list twice, usually in two different ifs on the same frame.',
    fix: 'Use elif for the second test, or remove it once and then continue to the next item.',
  },
  {
    msg: 'The game runs for a second, then stutters',
    means: 'Things are piling up off-screen. Every one of them is still being drawn and still being tested.',
    fix: 'Whenever something leaves the stage, call remove() on it and take it out of your list.',
  },
  {
    msg: 'The arrow keys move the cursor in my code instead of the player',
    means: 'The editor has the keyboard, because that is where you were last typing.',
    fix: 'Click once on the stage, then play. Typing always wins over playing, otherwise the editor would feel broken.',
  },
];

const CONTEST_STEPS = [
  {
    title: 'Before the start time',
    body: 'The contest page shows a waiting room with a countdown. The brief is sealed on the server until the clock hits zero, so there is nothing to peek at and nothing to gain by refreshing. The page opens itself the moment the contest begins.',
  },
  {
    title: 'The brief appears',
    body: 'You get the editor, the stage, and a Brief panel underneath it. Read the brief and the Rules tab before you write anything. A game that ignores the theme scores badly however good it is.',
  },
  {
    title: 'Build, and press Play often',
    body: 'Play (or Ctrl and Enter together) runs your code. Run it after every small change rather than writing forty lines and hoping. Errors and anything you print appear under the stage.',
  },
  {
    title: 'Your work saves itself',
    body: 'Every keystroke is kept in your browser straight away, and the copy on the server is written whenever you pause typing for a couple of seconds. The header tells you which state you are in. If the wifi drops it keeps retrying, and reloading the page brings your code back.',
  },
  {
    title: 'Submitting is final',
    body: 'Submit locks in exactly what is in the editor and you cannot edit afterwards. You do not have to submit: whatever is saved when the clock runs out counts as your entry. There is no reward for finishing early, so most people should simply keep working.',
  },
  {
    title: 'Results',
    body: 'A judge plays the entries and scores them out of 100, sometimes with a comment. When the organizer publishes the results, a Results tab appears on the contest page with your score and the leaderboard.',
  },
];

const CHECKLIST = [
  'It runs with no error from the very first press of Play.',
  'Someone who has never seen it knows what to do within five seconds.',
  'There is a way to win, a way to lose, or a score. Preferably two of the three.',
  'The score or state is on screen as Text, not only in your head.',
  'Every event makes a sound.',
  'It gets harder, or it ends.',
  'It does the thing the brief actually asked for.',
  'No leftover print() calls firing every frame.',
];

const CONTENTS = [
  ['start', 'Read this first'],
  ['words', 'The words you will see'],
  ['first', 'Your first program, line by line'],
  ['shape', 'How a game is put together'],
  ['stage', 'The stage and its numbers'],
  ['reference', 'Every function, explained'],
  ['pictures', 'Pictures and sounds'],
  ['recipes', 'Recipes: how do I ...'],
  ['games', 'Three complete games'],
  ['errors', 'When it goes wrong'],
  ['contest', 'The contest, step by step'],
  ['source', "The library's own code"],
];

/* ---------------------------------------------------------------- pieces */

function CodeBlock({ children, tone = 'dark', label }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(children);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch { /* clipboard blocked */ }
  };
  return (
    <div className="group relative">
      {label && (
        <p className="ref-tag mb-1.5 flex items-center gap-1.5 text-ink/45">
          <Check className="h-3.5 w-3.5 text-pcb" /> {label}
        </p>
      )}
      <pre
        className={`overflow-x-auto rounded-xl px-4 py-3 font-mono text-xs leading-relaxed ${
          tone === 'dark'
            ? 'border-2 border-ink bg-ink text-white/90'
            : 'border-2 border-ink/10 bg-paper text-ink/80'
        }`}
      >
        {children}
      </pre>
      <button
        onClick={copy}
        aria-label="Copy this code"
        className="no-print absolute right-2 top-2 rounded-lg border-2 border-ink/20 bg-white/90 p-1.5 text-ink/70 opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-pcb" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}

function Section({ id, icon: Icon, tag, title, intro, children }) {
  return (
    <section id={id} className="scroll-mt-20">
      <div className="mb-4">
        {tag && <p className="ref-tag text-pcb">{tag}</p>}
        <h2 className="flex items-center gap-2 font-lab text-2xl font-extrabold text-ink">
          {Icon && <Icon className="h-6 w-6 shrink-0 text-pcb" />} {title}
        </h2>
        {intro && <p className="mt-2 max-w-2xl leading-relaxed text-ink/70">{intro}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function ApiItem({ sig, what, example, note, forceOpen }) {
  const [open, setOpen] = useState(false);
  const shown = open || forceOpen;
  return (
    <li className="rounded-xl border-2 border-ink/15 bg-white p-3">
      <code className="block overflow-x-auto whitespace-pre rounded-lg bg-ink px-3 py-2 font-mono text-xs leading-relaxed text-signal">
        {sig}
      </code>
      <p className="mt-2 text-ink/80">{what}</p>
      {example && (
        <pre className="mt-2 overflow-x-auto rounded-lg border-2 border-ink/10 bg-paper px-3 py-2 font-mono text-xs leading-relaxed text-ink/75">
          {example}
        </pre>
      )}
      {note && (
        <>
          <button
            onClick={() => setOpen((o) => !o)}
            aria-expanded={shown}
            className="no-print mt-2 inline-flex items-center gap-1 text-xs font-extrabold uppercase tracking-wide text-pcb"
          >
            Why it works like that
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${shown ? 'rotate-180' : ''}`} />
          </button>
          {shown && <p className="mt-2 text-sm leading-relaxed text-ink/70">{note}</p>}
        </>
      )}
    </li>
  );
}

/* ------------------------------------------------------------------ page */

export default function GameManual() {
  const [showSource, setShowSource] = useState(false);
  const [openGame, setOpenGame] = useState(FULL_GAMES[0].id);
  // Set while the print dialog is being prepared: every collapsed panel opens
  // so the PDF is the whole manual rather than a list of headings.
  const [printing, setPrinting] = useState(false);

  // The browser names the saved PDF after the page title.
  useEffect(() => {
    const was = document.title;
    document.title = 'Pocket Lab - Game Dev Manual';
    return () => { document.title = was; };
  }, []);

  const downloadPdf = () => {
    setPrinting(true);
    // One paint for the expanded panels before the dialog freezes the page.
    setTimeout(() => {
      window.print();
      setPrinting(false);
    }, 250);
  };

  return (
    <div className="bench-grid flex-1 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Masthead */}
        <header className="lab-panel-pcb mb-6 px-6 py-7 sm:px-8">
          <p className="ref-tag text-white/60">Pocket Lab</p>
          <h1 className="font-lab text-3xl font-extrabold text-white sm:text-4xl">
            The game dev manual
          </h1>
          <p className="mt-3 max-w-2xl leading-relaxed text-white/80">
            How to build a game in Python with the{' '}
            <code className="rounded bg-black/25 px-1.5 py-0.5 font-mono text-sm">stage</code> library,
            written for someone who has never written a line of code before. Every function, every word
            explained, twelve recipes and three finished games you can copy and run today.
          </p>
          <p className="mt-2 max-w-2xl font-semibold text-signal">
            Every block of code on this page is a complete program. Copy it, paste it into an empty
            editor, press Play, and it runs.
          </p>
          <div className="no-print mt-5 flex flex-wrap gap-2">
            <Link
              to="/contests"
              className="lab-btn flex items-center gap-2 rounded-xl border-2 border-ink bg-signal px-4 py-2.5 font-extrabold text-ink"
            >
              <Trophy className="h-4 w-4" /> Contests
            </Link>
            <button
              onClick={downloadPdf}
              className="lab-btn flex items-center gap-2 rounded-xl border-2 border-ink bg-white px-4 py-2.5 font-extrabold text-ink"
            >
              <Download className="h-4 w-4" /> Download as PDF
            </button>
            <a
              href="#reference"
              className="lab-btn flex items-center gap-2 rounded-xl border-2 border-ink bg-white px-4 py-2.5 font-extrabold text-ink"
            >
              <BookOpen className="h-4 w-4" /> Jump to the functions
            </a>
          </div>
          <p className="no-print mt-2 text-sm text-white/55">
            The PDF button opens your browser&apos;s print window. Choose &quot;Save as PDF&quot; as the
            printer to keep the whole manual, all 12 sections, as one file.
          </p>
        </header>

        <div className="lg:flex lg:items-start lg:gap-8">
          {/* Contents */}
          <nav className="no-print lab-panel mb-6 p-4 lg:sticky lg:top-20 lg:mb-0 lg:w-60 lg:shrink-0">
            <p className="ref-tag mb-2 text-ink/50">Contents</p>
            <ol className="space-y-1">
              {CONTENTS.map(([id, label], i) => (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    className="flex gap-2 rounded-lg px-2 py-1.5 text-sm font-bold text-ink/70 transition-colors hover:bg-pcb/10 hover:text-pcb"
                  >
                    <span className="font-mono text-ink/35">{i + 1}</span> {label}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="min-w-0 flex-1 space-y-10">
            {/* 1. Read this first */}
            <Section
              id="start"
              icon={Rocket}
              tag="Section 1"
              title="Read this first"
              intro="Five minutes, no code. If you have never programmed before, this is the part that makes the rest make sense."
            >
              <div className="lab-panel p-5">
                <h3 className="mb-2 font-lab text-lg font-extrabold text-ink">What you are actually doing</h3>
                <p className="leading-relaxed text-ink/80">
                  A computer does exactly what it is told, in the order it is told, and nothing else. A
                  program is that list of instructions. You are going to write instructions like "put a cat
                  here", "move it a bit to the right", and "if the cat touches the apple, add a point".
                </p>
                <p className="mt-3 leading-relaxed text-ink/80">
                  A game looks alive because the computer repeats those instructions about{' '}
                  <strong>60 times every second</strong>. Each repeat is called a frame. Nothing on the
                  stage moves by itself: something moves because you moved it a tiny bit, sixty times a
                  second.
                </p>
              </div>

              <div className="lab-panel p-5">
                <h3 className="mb-2 font-lab text-lg font-extrabold text-ink">How to run your code</h3>
                <ol className="space-y-2 text-ink/80">
                  <li><strong>1.</strong> Type or paste code into the editor on the left.</li>
                  <li><strong>2.</strong> Press <strong>Play</strong> (or hold Ctrl and press Enter).</li>
                  <li><strong>3.</strong> The game appears on the black stage on the right. Click the stage once before using the arrow keys, so the keyboard is talking to the game and not to the editor.</li>
                  <li><strong>4.</strong> If something is wrong, a message appears under the stage in red, with the line number. That is the computer helping you, not scolding you.</li>
                </ol>
              </div>

              <div className="lab-panel p-5">
                <h3 className="mb-2 font-lab text-lg font-extrabold text-ink">Five rules that prevent most mistakes</h3>
                <ul className="space-y-2 text-ink/80">
                  {[
                    ['Order matters.', 'A line can only use something an earlier line already made.'],
                    ['Spelling matters.', 'cat and Cat are two different names, and the computer will not guess.'],
                    ['Spaces at the start of a line matter.', 'Four spaces means "this line belongs inside the thing above".'],
                    ['Quotes make text.', '"cat" is a piece of text. cat without quotes is a name you made.'],
                    ['Brackets come in pairs.', 'Every ( needs a ). A missing one usually shows up as an error on the NEXT line.'],
                  ].map(([bold, rest]) => (
                    <li key={bold} className="flex gap-2">
                      <span className="text-pcb">-</span>
                      <span><strong>{bold}</strong> {rest}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="lab-panel p-5">
                <h3 className="mb-2 font-lab text-lg font-extrabold text-ink">The one line every game starts with</h3>
                <p className="mb-3 text-ink/80">
                  Python knows nothing about games until you ask for the tools by name. That is all this
                  line does: it borrows six tools from the <strong>stage</strong> library.
                </p>
                <CodeBlock>from stage import Game, Sprite, Box, Ball, Text, random_number</CodeBlock>
                <p className="mt-3 text-ink/80">
                  Borrowing all six every time is a perfectly good habit. Use one you did not borrow and
                  Python says <code className="rounded bg-ink/8 px-1 font-mono text-sm">NameError</code>,
                  which just means "I have never heard of that".
                </p>
              </div>
            </Section>

            {/* 2. Glossary */}
            <Section
              id="words"
              icon={GraduationCap}
              tag="Section 2"
              title="The words you will see"
              intro="Every term the rest of this manual uses, in plain language. Come back here whenever a word looks like jargon."
            >
              <div className="lab-panel p-4">
                <dl className="divide-y-2 divide-ink/8">
                  {GLOSSARY.map(([word, meaning]) => (
                    <div key={word} className="grid gap-1 py-3 sm:grid-cols-[8.5rem_1fr] sm:gap-4">
                      <dt className="font-mono text-sm font-extrabold text-pcb">{word}</dt>
                      <dd className="leading-relaxed text-ink/80">{meaning}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </Section>

            {/* 3. First program */}
            <Section
              id="first"
              icon={Lightbulb}
              tag="Section 3"
              title="Your first program, line by line"
              intro="A cat that walks across the screen and wraps around to the other side. Fourteen lines, and once you understand these, every other program on this page is the same idea with more in the middle."
            >
              <div className="lab-panel p-5">
                <CodeBlock label="Complete program. Copy it, paste it, press Play.">{FIRST_PROGRAM_CODE}</CodeBlock>
              </div>

              <div className="lab-panel p-4">
                <h3 className="mb-2 px-1 font-lab text-lg font-extrabold text-ink">What each line does</h3>
                <dl className="divide-y-2 divide-ink/8">
                  {FIRST_PROGRAM.map(([code, meaning], i) => (
                    code === '' ? (
                      <div key={i} className="py-1.5" aria-hidden="true" />
                    ) : (
                      <div key={i} className="grid gap-2 py-3 sm:grid-cols-[19rem_1fr] sm:gap-4">
                        <dt>
                          <code className="block overflow-x-auto whitespace-pre rounded-lg bg-ink px-2.5 py-1.5 font-mono text-xs text-signal">
                            {code}
                          </code>
                        </dt>
                        <dd className="leading-relaxed text-ink/80">{meaning}</dd>
                      </div>
                    )
                  ))}
                </dl>
              </div>

              <div className="lab-panel p-5">
                <h3 className="mb-2 font-lab text-lg font-extrabold text-ink">Now break it on purpose</h3>
                <p className="mb-3 text-ink/80">
                  The fastest way to learn what a line does is to change it and watch. Try these four, one
                  at a time, pressing Play after each.
                </p>
                <ul className="space-y-2 text-ink/80">
                  {[
                    ['Change 2 to 8 in cat.x = cat.x + 2.', 'The cat sprints. The number is how many dots it moves per frame.'],
                    ['Change "cat" to "rocket".', 'A different picture. Try "dog", "ghost", "pizza".'],
                    ['Change size=48 to size=120.', 'A giant cat. Size is measured from the middle outwards.'],
                    ['Delete the last line, game.start().', 'Nothing happens at all. That is what that line is for.'],
                  ].map(([change, result]) => (
                    <li key={change} className="flex gap-2">
                      <span className="text-pcb">-</span>
                      <span><strong>{change}</strong> {result}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Section>

            {/* 4. Shape */}
            <Section
              id="shape"
              icon={Gamepad2}
              tag="Section 4"
              title="How a game is put together"
              intro="Every stage game has exactly three parts, always in this order. Get the order wrong and nothing appears."
            >
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  {
                    n: '1',
                    h: 'Set up, once',
                    p: 'Make the Game, then everything that stands on it: sprites, boxes, labels. Also your starting numbers, like score = 0. This part runs a single time.',
                  },
                  {
                    n: '2',
                    h: 'The frame function',
                    p: 'One function marked @game.every_frame. It runs about 60 times a second and holds all the movement, all the collisions, all the rules.',
                  },
                  {
                    n: '3',
                    h: 'game.start()',
                    p: 'The last line. It hands your finished game to the screen. Nothing moves without it.',
                  },
                ].map((b) => (
                  <div key={b.n} className="lab-panel p-5">
                    <span className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg border-2 border-ink bg-signal font-lab font-extrabold text-ink">
                      {b.n}
                    </span>
                    <h3 className="font-lab font-extrabold text-ink">{b.h}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-ink/70">{b.p}</p>
                  </div>
                ))}
              </div>

              <div className="lab-panel p-5">
                <h3 className="mb-2 font-lab text-lg font-extrabold text-ink">
                  Why there is no loop in your code
                </h3>
                <p className="text-ink/80">
                  A game is a loop: read the keys, move things, draw, repeat. You never write that loop. You
                  hand over one function and the page calls it for you, once per frame. Two useful things
                  follow from that.
                </p>
                <ul className="mt-3 space-y-2 text-ink/75">
                  <li className="flex gap-2">
                    <span className="text-pcb">-</span>
                    <span>Your program runs start to finish like any other, so a mistake cannot freeze the page.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-pcb">-</span>
                    <span>
                      Work belongs in <code className="rounded bg-ink/8 px-1 font-mono text-sm">update()</code>{' '}
                      only if it must happen every frame. Making a sprite in there makes 60 of them a second.
                    </span>
                  </li>
                </ul>
                <p className="mt-3 text-ink/80">
                  Time is counted in frames, not seconds. 60 frames is about one second, which is why{' '}
                  <code className="rounded bg-ink/8 px-1 font-mono text-sm">game.frame % 60 == 0</code> means
                  "once a second".
                </p>
              </div>

              <div className="lab-panel p-5">
                <h3 className="mb-2 font-lab text-lg font-extrabold text-ink">
                  Changing a number from inside update()
                </h3>
                <p className="text-ink/80">
                  This catches out nearly everyone once. A variable made outside the function can be{' '}
                  <em>read</em> inside it, but to <em>change</em> it you must say{' '}
                  <code className="rounded bg-ink/8 px-1 font-mono text-sm">global</code> first. Sprites are
                  different: changing <code className="font-mono">cat.x</code> is changing something inside
                  the cat, not swapping the cat for a new one, so no global is needed.
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="ref-tag mb-1 text-wire">Broken</p>
                    <CodeBlock tone="light">{`score = 0

@game.every_frame
def update():
    score = score + 1   # UnboundLocalError`}</CodeBlock>
                  </div>
                  <div>
                    <p className="ref-tag mb-1 text-pcb">Works</p>
                    <CodeBlock tone="light">{`score = 0

@game.every_frame
def update():
    global score
    score = score + 1`}</CodeBlock>
                  </div>
                </div>
              </div>
            </Section>

            {/* 5. Stage */}
            <Section
              id="stage"
              icon={Map}
              tag="Section 5"
              title="The stage and its numbers"
              intro="Two facts about the coordinates explain most of the surprises beginners hit."
            >
              <div className="lab-panel p-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <h3 className="font-lab font-extrabold text-ink">y grows downwards</h3>
                    <p className="mt-1 text-ink/75">
                      (0, 0) is the top-left corner. Bigger y is further DOWN the screen, which is upside
                      down from the graphs in maths class. So moving up means subtracting, and gravity means
                      adding.
                    </p>
                    <h3 className="mt-4 font-lab font-extrabold text-ink">Anchors differ by shape</h3>
                    <p className="mt-1 text-ink/75">
                      Sprites and Balls are positioned by their <strong>middle</strong>. Boxes and Text are
                      positioned by their <strong>top-left corner</strong>. A Box at y=300 starts at 300 and
                      grows downwards; a Sprite at y=300 is centred there.
                    </p>
                  </div>
                  <div>
                    <svg viewBox="0 0 300 235" className="w-full" role="img" aria-label="Map of the stage: 0,0 at the top left, x growing right, y growing down">
                      <rect x="30" y="25" width="240" height="180" rx="6" fill="#101828" stroke="#16241D" strokeWidth="3" />
                      <text x="38" y="45" fontSize="11" fontFamily="monospace" fill="#FFFFFF" opacity="0.7">(0, 0)</text>
                      <text x="222" y="222" fontSize="11" fontFamily="monospace" fill="#16241D">(480, 360)</text>
                      <line x1="30" y1="16" x2="150" y2="16" stroke="#1F7A5C" strokeWidth="2" markerEnd="url(#ar)" />
                      <text x="156" y="20" fontSize="11" fontFamily="monospace" fill="#1F7A5C">x</text>
                      <line x1="21" y1="25" x2="21" y2="120" stroke="#E8503A" strokeWidth="2" markerEnd="url(#ar2)" />
                      <text x="8" y="132" fontSize="11" fontFamily="monospace" fill="#E8503A">y</text>
                      <defs>
                        <marker id="ar" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto">
                          <path d="M0,0 L7,3 L0,6 Z" fill="#1F7A5C" />
                        </marker>
                        <marker id="ar2" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto">
                          <path d="M0,0 L7,3 L0,6 Z" fill="#E8503A" />
                        </marker>
                      </defs>
                      <circle cx="150" cy="115" r="4" fill="#FFC93C" />
                      <text x="158" y="119" fontSize="11" fontFamily="monospace" fill="#FFC93C">(240, 180)</text>
                      <rect x="30" y="185" width="240" height="20" fill="#1F7A5C" opacity="0.85" />
                      <text x="36" y="199" fontSize="10" fontFamily="monospace" fill="#EDF3EE">Box(x=0, y=330, width=480, height=30)</text>
                    </svg>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {[
                    ['Off the top', 'y less than 0'],
                    ['Off the bottom', 'y greater than game.height'],
                    ['The middle', 'game.width // 2, game.height // 2'],
                  ].map(([h, v]) => (
                    <div key={h} className="rounded-xl border-2 border-ink/12 bg-paper p-3">
                      <p className="ref-tag text-ink/45">{h}</p>
                      <code className="font-mono text-sm font-bold text-ink">{v}</code>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lab-panel p-5">
                <h3 className="mb-2 font-lab text-lg font-extrabold text-ink">Colours</h3>
                <p className="text-ink/80">
                  Anywhere a colour is asked for, any web colour works: a name like{' '}
                  <code className="rounded bg-ink/8 px-1 font-mono text-sm">"red"</code>, or a hex code like{' '}
                  <code className="rounded bg-ink/8 px-1 font-mono text-sm">"#FFC93C"</code>. A hex code is
                  three pairs: how much red, how much green, how much blue, each from 00 to FF.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    ['#101828', 'night sky'],
                    ['#0B1020', 'deep space'],
                    ['#1F7A5C', 'grass'],
                    ['#FFC93C', 'gold'],
                    ['#E8503A', 'danger'],
                    ['#23B5D3', 'water'],
                  ].map(([hex, label]) => (
                    <span key={hex} className="flex items-center gap-2 rounded-lg border-2 border-ink/12 bg-white px-2.5 py-1.5">
                      <span className="h-4 w-4 rounded border border-ink/20" style={{ background: hex }} />
                      <code className="font-mono text-xs font-bold text-ink">{hex}</code>
                      <span className="text-xs text-ink/50">{label}</span>
                    </span>
                  ))}
                </div>
              </div>
            </Section>

            {/* 6. Reference */}
            <Section
              id="reference"
              icon={BookOpen}
              tag="Section 6"
              title="Every function, explained"
              intro="The whole library. Nothing else exists, so if it is not on this list, it is not something you can call."
            >
              {API_GROUPS.map((g) => (
                <div key={g.id} className="lab-panel p-5">
                  <h3 className="font-lab text-xl font-extrabold text-ink">{g.title}</h3>
                  {g.blurb && <p className="mb-4 mt-1 text-sm text-ink/55">{g.blurb}</p>}
                  <ul className="space-y-2.5">
                    {g.items.map((it) => <ApiItem key={it.sig} {...it} forceOpen={printing} />)}
                  </ul>
                </div>
              ))}
            </Section>

            {/* 7. Pictures and sounds */}
            <Section
              id="pictures"
              icon={Palette}
              tag="Section 7"
              title="Pictures and sounds"
              intro="No files to load and nothing to draw yourself. Every picture has a name you can type on any keyboard, and every sound is invented on the spot by the browser."
            >
              <div className="lab-panel p-5">
                <h3 className="mb-1 font-lab text-lg font-extrabold text-ink">The picture pack</h3>
                <p className="mb-3 text-ink/75">
                  Three ways of saying the same thing. Use the first one: it needs nothing but a keyboard.
                </p>
                <CodeBlock>{`Sprite("cat", x=100, y=100)     # the name, nothing to import
Sprite(CAT, x=100, y=100)       # the constant: from stage import CAT
Sprite("\u{1F431}", x=100, y=100)      # the emoji itself, if you can paste one`}</CodeBlock>
                <p className="mt-3 text-ink/75">
                  Anything the pack does not recognise is drawn as it is, so plain text works too:{' '}
                  <code className="rounded bg-ink/8 px-1 font-mono text-sm">Sprite("1UP", color="#FFC93C")</code>.
                </p>
                <div className="mt-4">
                  <PicturePack forceOpen={printing} />
                </div>
              </div>

              <div className="lab-panel p-5">
                <h3 className="mb-1 flex items-center gap-2 font-lab text-lg font-extrabold text-ink">
                  <Volume2 className="h-5 w-5 text-pcb" /> The ten sounds
                </h3>
                <p className="mb-3 text-ink/75">
                  <code className="rounded bg-ink/8 px-1 font-mono text-sm">game.play("coin")</code>. Any
                  other name causes an error, so these ten are worth knowing by heart.
                </p>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {SOUND_NOTES.map(([name, what]) => (
                    <li key={name} className="flex items-start gap-3 rounded-xl border-2 border-ink/12 bg-paper p-2.5">
                      <code className="shrink-0 rounded-md bg-ink px-2 py-1 font-mono text-xs font-bold text-signal">{name}</code>
                      <span className="text-sm text-ink/70">{what}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-sm text-ink/60">
                  A sound on every event is the single cheapest way to make a game feel finished. Catching,
                  losing, jumping, clicking a button: all of them deserve one.
                </p>
              </div>
            </Section>

            {/* 8. Recipes */}
            <Section
              id="recipes"
              icon={Wrench}
              tag="Section 8"
              title="Recipes: how do I ..."
              intro="Twelve patterns that between them cover most of what a small game needs. Every one is a whole working program: paste it into an empty editor and press Play before you change anything."
            >
              {RECIPES.map((r, i) => (
                <div key={r.id} id={r.id} className="lab-panel scroll-mt-20 p-5">
                  <div className="mb-3 flex items-start gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 border-ink bg-signal font-lab text-sm font-extrabold text-ink">
                      {i + 1}
                    </span>
                    <div>
                      <h3 className="font-lab text-lg font-extrabold text-ink">{r.title}</h3>
                      <p className="mt-1 text-ink/75"><strong>What it does.</strong> {r.does}</p>
                      <p className="mt-1 leading-relaxed text-ink/75"><strong>How it works.</strong> {r.how}</p>
                    </div>
                  </div>
                  <CodeBlock label="Complete program. Copy it, paste it, press Play.">{r.code}</CodeBlock>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <p className="flex gap-2 rounded-xl border-2 border-pcb/30 bg-pcb/5 p-3 text-sm text-ink/80">
                      <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-pcb" />
                      <span><strong>Try changing:</strong> {r.tweak}</span>
                    </p>
                    <p className="flex gap-2 rounded-xl border-2 border-signal/50 bg-signal/10 p-3 text-sm text-ink/80">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-ink/60" />
                      <span><strong>Watch out:</strong> {r.watch}</span>
                    </p>
                  </div>
                </div>
              ))}
            </Section>

            {/* 9. Full games */}
            <Section
              id="games"
              icon={Gamepad2}
              tag="Section 9"
              title="Three complete games"
              intro="Every line of three finished games. Copy one into the editor, press Play, then change one number at a time and watch what happens. Taking a working game apart teaches more than starting from an empty file."
            >
              {FULL_GAMES.map((g) => {
                const open = openGame === g.id || printing;
                return (
                  <div key={g.id} className="lab-panel overflow-hidden">
                    <button
                      onClick={() => setOpenGame(open ? null : g.id)}
                      aria-expanded={open}
                      className="flex w-full items-center gap-3 p-5 text-left"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="ref-tag text-pcb">{g.teaches}</span>
                        <span className="block font-lab text-lg font-extrabold text-ink">{g.title}</span>
                        <span className="mt-0.5 block text-sm text-ink/65">{g.blurb}</span>
                      </span>
                      <ChevronDown className={`no-print h-5 w-5 shrink-0 text-ink/50 transition-transform ${open ? 'rotate-180' : ''}`} />
                    </button>
                    {open && (
                      <div className="px-5 pb-5">
                        <CodeBlock label="Complete program. Copy it, paste it, press Play.">{g.code}</CodeBlock>
                      </div>
                    )}
                  </div>
                );
              })}
            </Section>

            {/* 10. Errors */}
            <Section
              id="errors"
              icon={AlertTriangle}
              tag="Section 10"
              title="When it goes wrong"
              intro="Errors appear under the stage with your own line numbers. Here is what the twelve you will actually meet are telling you. An error is not a failure: it is the computer telling you exactly where to look."
            >
              <div className="lab-panel divide-y-2 divide-ink/8 p-2">
                {ERRORS.map((e) => (
                  <div key={e.msg} className="p-3">
                    <code className="block overflow-x-auto whitespace-pre-wrap rounded-lg bg-wire/10 px-3 py-2 font-mono text-xs font-bold text-wire">
                      {e.msg}
                    </code>
                    <p className="mt-2 text-ink/75"><strong>What it means.</strong> {e.means}</p>
                    <p className="mt-1 text-ink/75"><strong>The fix.</strong> {e.fix}</p>
                  </div>
                ))}
              </div>
              <div className="lab-panel p-5">
                <h3 className="mb-2 font-lab text-lg font-extrabold text-ink">How to debug anything</h3>
                <ol className="space-y-2 text-ink/75">
                  <li><strong>1.</strong> Read the LAST line of the error first. That is the actual complaint; everything above it is the route the computer took to get there.</li>
                  <li><strong>2.</strong> Find the line number it names. It is your file, so the line is on your screen.</li>
                  <li><strong>3.</strong> Look at the line above it too. An unclosed bracket or quote blames the line after itself.</li>
                  <li><strong>4.</strong> Print the number you doubt: <code className="rounded bg-ink/8 px-1 font-mono text-sm">if game.frame % 30 == 0: print(speed)</code>. A value you can see is a value you can fix.</li>
                  <li><strong>5.</strong> Change one thing, then press Play. Two changes at once and you cannot tell which one worked.</li>
                </ol>
              </div>
            </Section>

            {/* 11. Contest */}
            <Section
              id="contest"
              icon={Trophy}
              tag="Section 11"
              title="The contest, step by step"
              intro="A contest is a timed build: a brief, a clock, the same editor you already know, and a judge at the end. Nothing about the library changes."
            >
              <ol className="space-y-3">
                {CONTEST_STEPS.map((s, i) => (
                  <li key={s.title} className="lab-panel flex gap-4 p-5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 border-ink bg-signal font-lab font-extrabold text-ink">
                      {i + 1}
                    </span>
                    <div>
                      <h3 className="font-lab font-extrabold text-ink">{s.title}</h3>
                      <p className="mt-1 leading-relaxed text-ink/75">{s.body}</p>
                    </div>
                  </li>
                ))}
              </ol>

              <div className="lab-panel p-5">
                <h3 className="mb-1 flex items-center gap-2 font-lab text-lg font-extrabold text-ink">
                  <ListChecks className="h-5 w-5 text-pcb" /> The checklist before you submit
                </h3>
                <p className="mb-3 text-ink/75">
                  A plain game that ticks all of these beats an ambitious one that crashes. Every time.
                </p>
                <ul className="space-y-2">
                  {CHECKLIST.map((c) => (
                    <li key={c} className="flex items-start gap-2.5 rounded-xl border-2 border-ink/12 bg-paper p-2.5 text-ink/80">
                      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 border-ink/40" />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="lab-panel p-5">
                <h3 className="mb-2 font-lab text-lg font-extrabold text-ink">How to spend the clock</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    ['First tenth', 'Read the brief twice. Pick one idea small enough that you would bet on finishing it. Write it down in a comment at the top.'],
                    ['Next half', 'Get it playable end to end: player moves, thing happens, score changes, game ends. Ugly is fine. Playable is the goal.'],
                    ['Next quarter', 'Make it feel good: sounds, a shake, a title, colours, difficulty that climbs. This is where the marks are.'],
                    ['Last tenth', 'Stop adding. Play it three times from a fresh Play. Fix anything that errors, delete stray prints, check it against the checklist.'],
                  ].map(([when, what]) => (
                    <div key={when} className="rounded-xl border-2 border-ink/12 bg-paper p-4">
                      <p className="ref-tag text-pcb">{when}</p>
                      <p className="mt-1 text-sm leading-relaxed text-ink/75">{what}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-ink/75">
                  One more piece of advice, worth more than the rest: <strong>keep the game running at all
                  times</strong>. Never leave the code in a half-finished state you cannot press Play on. If
                  the clock runs out mid-idea, whatever is saved is your entry, and a working small game
                  scores while a broken big one does not.
                </p>
              </div>
            </Section>

            {/* 12. Source */}
            <Section
              id="source"
              icon={Code2}
              tag="Section 12"
              title="The library's own code"
              intro="Everything in this manual is written in the same ordinary Python you have been writing. About 500 lines, with no magic in any of them. Reading the tools you use is one of the best habits a programmer can pick up."
            >
              <div className="lab-panel p-5">
                <button
                  onClick={() => setShowSource((s) => !s)}
                  className="no-print lab-btn flex items-center gap-2 rounded-xl border-2 border-ink bg-signal px-4 py-2.5 font-extrabold text-ink"
                >
                  <Code2 className="h-4 w-4" /> {showSource ? 'Hide stage.py' : 'Read stage.py'}
                </button>
                {(showSource || printing) && (
                  <div className="mt-4">
                    <CodeBlock>{STAGE_SOURCE}</CodeBlock>
                  </div>
                )}
              </div>
            </Section>

            <footer className="lab-panel flex flex-wrap items-center justify-between gap-4 p-5">
              <p className="font-lab font-bold text-ink/70">
                That is the whole library. Go and build something.
              </p>
              <div className="no-print flex flex-wrap gap-2">
                <button
                  onClick={downloadPdf}
                  className="lab-btn flex items-center gap-2 rounded-xl border-2 border-ink bg-white px-4 py-2.5 font-extrabold text-ink"
                >
                  <Download className="h-4 w-4" /> Download as PDF
                </button>
                <Link
                  to="/contests"
                  className="lab-btn flex items-center gap-2 rounded-xl border-2 border-ink bg-signal px-4 py-2.5 font-extrabold text-ink"
                >
                  <Trophy className="h-4 w-4" /> See the contests
                </Link>
              </div>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}

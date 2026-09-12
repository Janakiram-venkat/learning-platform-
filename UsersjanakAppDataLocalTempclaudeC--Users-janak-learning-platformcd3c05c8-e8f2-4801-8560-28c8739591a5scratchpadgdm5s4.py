from stage import Game, Sprite, Box, Text

game = Game(width=480, height=360, background="#123024")

ground = Box(x=0, y=320, width=480, height=40, color="#1F7A5C", name="ground")
platform = Box(x=160, y=200, width=160, height=16, color="#3FBF7F", name="platform")

frog = Sprite("frog", x=240, y=60, size=40, name="frog")
frog.vy = 0

star_a = Sprite("star", x=300, y=300, size=26, name="star0")
star_b = Sprite("star", x=400, y=300, size=26, name="star1")
stars = [star_a, star_b]

game.score = 0
label = Text("Stars: 0", x=16, y=16, size=20, color="#FFC93C")

# The flag to reach, and the hazard to avoid.
goal = Sprite("trophy", x=440, y=300, size=30, name="goal")
fire = Sprite("fire", x=60, y=300, size=30, name="fire")


@game.every_frame
def update():
    if game.key_down("left"):
        frog.x = frog.x - 4
    if game.key_down("right"):
        frog.x = frog.x + 4

    if game.key_down("up") and frog.y >= 300:
        frog.vy = -14

    frog.vy = frog.vy + 1
    frog.y = frog.y + frog.vy

    if frog.touching(platform) and frog.vy > 0:
        frog.y = platform.y - 20
        frog.vy = 0

    if frog.y > 300:
        frog.y = 300
        frog.vy = 0

    for star in stars:
        if frog.touching(star):
            star.remove()
            game.score = game.score + 1
            label.words = "Stars: " + str(game.score)

    # Reached the flag: a win.
    if frog.touching(goal):
        label.words = "You reached the flag!"
        game.stop()

    # Fell in the fire: a loss.
    if frog.touching(fire):
        label.words = "You fell in the fire!"
        game.stop()


game.start()

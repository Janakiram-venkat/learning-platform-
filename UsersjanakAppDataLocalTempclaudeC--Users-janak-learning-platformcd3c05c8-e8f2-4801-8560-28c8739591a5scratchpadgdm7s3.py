from stage import Game, Sprite, Box, Text

game = Game(width=480, height=360, background="#0B1020")

LEVEL = [
    "########",
    "#..S...#",
    "#.....##",
    "#....S.#",
    "#......#",
    "#......X",
]

walls = []
stars = []

for row in range(6):
    for col in range(8):
        ch = LEVEL[row][col]
        if ch == "#":
            wall = Box(x=col*60, y=row*60, width=60, height=60, color="#2A3B55", name="wall" + str(row) + "_" + str(col))
            walls.append(wall)
        elif ch == "S":
            star = Sprite("star", x=col*60+30, y=row*60+30, size=26, name="star" + str(row) + "_" + str(col))
            stars.append(star)
        elif ch == "X":
            door = Sprite("castle", x=col*60+30, y=row*60+30, size=36, name="door")

robot = Sprite("robot", x=90, y=90, size=40, name="robot")

title = Text("MAZE ESCAPE", x=140, y=150, size=26, color="#FFC93C", name="title")
subtitle = Text("Press SPACE to start", x=110, y=190, size=16, color="#FFFFFF", name="subtitle")

game.state = "start"
game.score = 0
score_label = Text("Stars: 0", x=16, y=16, size=20, color="#FFC93C", name="score_label")

game.timer = 600
timer_label = Text("Time: 10", x=380, y=16, size=18, color="#FFFFFF", name="timer_label")


@game.every_frame
def update():
    if game.state == "start":
        if game.key_down("space"):
            game.state = "playing"
            title.hide()
            subtitle.hide()
        return

    game.timer = game.timer - 1
    timer_label.words = "Time: " + str(game.timer // 60)
    if game.timer <= 0:
        score_label.words = "Out of time!"
        game.stop()

    old_x = robot.x
    if game.key_down("left"):
        robot.x = robot.x - 3
    if game.key_down("right"):
        robot.x = robot.x + 3
    for wall in walls:
        if robot.touching(wall):
            robot.x = old_x
            break

    old_y = robot.y
    if game.key_down("up"):
        robot.y = robot.y - 3
    if game.key_down("down"):
        robot.y = robot.y + 3
    for wall in walls:
        if robot.touching(wall):
            robot.y = old_y
            break

    game.clamp_inside(robot)

    for star in stars:
        if robot.touching(star):
            star.remove()
            game.score = game.score + 1
            score_label.words = "Stars: " + str(game.score)

    if robot.touching(door):
        score_label.words = "You escaped! Stars: " + str(game.score)
        game.stop()


game.start()

/**
 * Builds a full, self-contained Python script: a small `Robot`/world
 * simulation (real kinematics, real ray-cast distance, a line-follow
 * track), the student's code, and a footer that always prints a JSON trace.
 *
 * The key trick that lets students write an unmodified `while True:` safely:
 * Python owns the *entire* simulation internally — `robot.forward()` just
 * advances its own x/y/heading and appends to a trace list, synchronously,
 * with no need to hand control back to JS. Every robot method ticks an
 * internal counter and raises `TickBudgetExceeded` past `max_ticks`, which
 * *our* wrapper (not the student's code) catches — so a real infinite loop
 * still terminates in well under a second of wall-clock CPU time, and the
 * partial trace up to that point is still returned. JS then replays the
 * recorded trace as an animation afterward — this is executed through the
 * platform's existing, already-shipped Pyodide worker (`runPythonInBrowser`
 * / `compilerService.runPython`), not a new one.
 */
export function buildRobotScript(world, studentCode, maxTicks = 900) {
  const worldJson = JSON.stringify(world);
  const indented = studentCode
    .split('\n')
    .map((line) => `    ${line}`)
    .join('\n');

  return `import json, math

_WORLD = json.loads('''${worldJson}''')
_MAX_TICKS = ${maxTicks}

class TickBudgetExceeded(Exception):
    pass

def _seg_hit(px, py, dx, dy, x1, y1, x2, y2):
    ex, ey = x2 - x1, y2 - y1
    denom = dx * ey - dy * ex
    if abs(denom) < 1e-9:
        return None
    t = ((x1 - px) * ey - (y1 - py) * ex) / denom
    u = ((x1 - px) * dy - (y1 - py) * dx) / denom
    if t >= 0 and 0 <= u <= 1:
        return t
    return None

def _rect_edges(x, y, w, h):
    return [
        (x, y, x + w, y),
        (x + w, y, x + w, y + h),
        (x + w, y + h, x, y + h),
        (x, y + h, x, y),
    ]

class _World:
    def __init__(self, spec):
        self.w = spec['width']
        self.h = spec['height']
        self.obstacles = spec.get('obstacles') or []
        self.goal = spec.get('goal')
        self.line = spec.get('line')

    def _segments(self):
        segs = list(_rect_edges(0, 0, self.w, self.h))
        for o in self.obstacles:
            segs += _rect_edges(o['x'], o['y'], o['w'], o['h'])
        return segs

    def ray_distance(self, px, py, heading, max_dist=250):
        dx, dy = math.cos(heading), math.sin(heading)
        best = max_dist
        for (x1, y1, x2, y2) in self._segments():
            t = _seg_hit(px, py, dx, dy, x1, y1, x2, y2)
            if t is not None and t < best:
                best = t
        return round(best, 1)

    def line_y(self, x):
        if not self.line:
            return None
        return self.line['baseY'] + self.line['amp'] * math.sin(x / self.line['freq'])

class Robot:
    def __init__(self, spec, max_ticks):
        self._world = _World(spec)
        s = spec['start']
        self.x, self.y = float(s['x']), float(s['y'])
        self.heading = math.radians(s['heading'])
        self._trace = [{'x': self.x, 'y': self.y, 'h': self.heading}]
        self._says = []
        self._ticks = 0
        self._max_ticks = max_ticks
        self.reached_goal = False

    def _tick(self):
        self._ticks += 1
        if self._ticks > self._max_ticks:
            raise TickBudgetExceeded()
        g = self._world.goal
        if g and not self.reached_goal:
            if (self.x - g['x']) ** 2 + (self.y - g['y']) ** 2 <= g['r'] ** 2:
                self.reached_goal = True
        self._trace.append({'x': self.x, 'y': self.y, 'h': self.heading})

    def forward(self, speed=50, seconds=0.3):
        steps = max(1, int(seconds * 15))
        dt = seconds / steps
        for _ in range(steps):
            self.x += math.cos(self.heading) * speed * dt
            self.y += math.sin(self.heading) * speed * dt
            self._tick()

    def backward(self, speed=50, seconds=0.3):
        self.forward(-speed, seconds)

    def left(self, degrees=90):
        self.heading -= math.radians(degrees)
        self._tick()

    def right(self, degrees=90):
        self.heading += math.radians(degrees)
        self._tick()

    def stop(self):
        self._tick()

    def wait(self, seconds=0.3):
        steps = max(1, int(seconds * 15))
        for _ in range(steps):
            self._tick()

    def distance(self):
        self._tick()
        return self._world.ray_distance(self.x, self.y, self.heading)

    def line(self):
        self._tick()
        if not self._world.line:
            return (False, False)
        off = 6
        lx = self.x + math.cos(self.heading + 0.3) * 10
        rx = self.x + math.cos(self.heading - 0.3) * 10
        ly = self._world.line_y(lx)
        ry = self._world.line_y(rx)
        return (abs(self.y - ly) < off if ly is not None else False,
                abs(self.y - ry) < off if ry is not None else False)

    def led(self, r, g, b):
        self._tick()

    def say(self, text):
        self._says.append(str(text))

robot = Robot(_WORLD, _MAX_TICKS)
_error = None

try:
${indented}
except TickBudgetExceeded:
    pass
except Exception as _e:
    _error = str(_e)

print('__ROBOT_TRACE__' + json.dumps({
    'trace': robot._trace,
    'ticks': robot._ticks,
    'reachedGoal': robot.reached_goal,
    'budgetExceeded': robot._ticks > robot._max_ticks,
    'says': robot._says,
    'error': _error,
}))
`;
}

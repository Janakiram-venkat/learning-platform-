import sys, os, json

sys.path.insert(0, os.path.join("frontend", "src", "game"))
import stage

STAGE_W, STAGE_H = None, None

def run_scenario(code, frames, keys_spec):
    stage._stage = None
    ns = {}
    exec(compile(code, "<sol>", "exec"), ns)
    game = stage._stage
    trace = []
    for i in range(frames):
        keys = keys_spec.get("*", []) if isinstance(keys_spec, dict) else []
        game._tick(keys)
        snap = game._snapshot(for_checker=True)
        trace.append(snap)
        if snap["over"]:
            break
    return trace, game.width, game.height

def series_for(trace, name, kind):
    names = set()
    for f in trace:
        for t in f["all"]:
            if name and t["name"] != name:
                continue
            if kind and t["kind"] != kind:
                continue
            names.add(t["name"])
    out = []
    for key in names:
        pts = []
        for f in trace:
            t = next((x for x in f["all"] if x["name"] == key), None)
            if t:
                pts.append({"x": t["x"], "y": t["y"]})
        if pts:
            out.append(pts)
    return out

def rule_exists(rule, trace, w, h):
    want = rule.get("count", 1)
    for f in trace:
        n = sum(1 for t in f["all"] if (not rule.get("kind") or t["kind"] == rule["kind"]) and (not rule.get("name") or t["name"] == rule["name"]))
        if n >= want:
            return True
    return False

def rule_moves(rule, trace, w, h):
    axis = rule.get("axis", "x")
    m = rule.get("distance", 20)
    for pts in series_for(trace, rule.get("name"), rule.get("kind")):
        vals = [p[axis] for p in pts]
        if max(vals) - min(vals) >= m:
            return True
    return False

def rule_still(rule, trace, w, h):
    axis = rule.get("axis", "x")
    for pts in series_for(trace, rule.get("name"), rule.get("kind")):
        vals = [p[axis] for p in pts]
        if max(vals) - min(vals) < 1:
            return True
    return False

def rule_bounces(rule, trace, w, h):
    axis = rule.get("axis", "x")
    times = rule.get("times", 1)
    for pts in series_for(trace, rule.get("name"), rule.get("kind")):
        flips = 0
        d = 0
        for i in range(1, len(pts)):
            diff = pts[i][axis] - pts[i-1][axis]
            sign = (diff > 0) - (diff < 0)
            if sign == 0:
                continue
            if d != 0 and sign != d:
                flips += 1
            d = sign
        if flips >= times:
            return True
    return False

def rule_stays_inside(rule, trace, w, h):
    pad = rule.get("slack", 4)
    for pts in series_for(trace, rule.get("name"), rule.get("kind")):
        if all(-pad <= p["x"] <= w+pad and -pad <= p["y"] <= h+pad for p in pts):
            return True
    return False

def rule_in_area(rule, trace, w, h):
    for pts in series_for(trace, rule.get("name"), rule.get("kind")):
        if all(rule["x1"] <= p["x"] <= rule["x2"] and rule["y1"] <= p["y"] <= rule["y2"] for p in pts):
            return True
    return False

def rule_ends_in_area(rule, trace, w, h):
    for pts in series_for(trace, rule.get("name"), rule.get("kind")):
        last = pts[-1]
        if rule["x1"] <= last["x"] <= rule["x2"] and rule["y1"] <= last["y"] <= rule["y2"]:
            return True
    return False

def rule_reset_above(rule, trace, w, h):
    axis = rule.get("axis", "y")
    limit = rule.get("y", 300)
    jump = rule.get("jump", 50)
    for pts in series_for(trace, rule.get("name"), rule.get("kind")):
        for i in range(1, len(pts)):
            before = pts[i-1][axis]
            after = pts[i][axis]
            if before - after > jump and before < limit:
                return True
    return False

def rule_text_changes(rule, trace, w, h):
    words = {}
    for f in trace:
        for t in f["all"]:
            if t["kind"] != "Text":
                continue
            if rule.get("name") and t["name"] != rule["name"]:
                continue
            key = t["name"]
            words.setdefault(key, set()).add(str(t["words"]))
    return any(len(s) > 1 for s in words.values())

def rule_count_drops(rule, trace, w, h):
    counts = [sum(1 for t in f["all"] if not rule.get("kind") or t["kind"] == rule["kind"]) for f in trace]
    return min(counts) < max(counts)

def rule_game_over(rule, trace, w, h):
    return any(f["over"] for f in trace)

RULES = {
    "exists": rule_exists, "moves": rule_moves, "still": rule_still, "bounces": rule_bounces,
    "stays_inside": rule_stays_inside, "in_area": rule_in_area, "ends_in_area": rule_ends_in_area,
    "reset_above": rule_reset_above, "text_changes": rule_text_changes, "count_drops": rule_count_drops,
    "game_over": rule_game_over,
}

def differs(rule, by_scenario):
    a = by_scenario.get(rule["between"][0])
    b = by_scenario.get(rule["between"][1])
    if not a or not b:
        return False
    last_a = a[0][-1]["all"]
    last_b = b[0][-1]["all"]
    n = min(len(last_a), len(last_b))
    for i in range(n):
        if abs(last_a[i]["x"] - last_b[i]["x"]) > 2 or abs(last_a[i]["y"] - last_b[i]["y"]) > 2:
            return True
    return False

def grade(code, check):
    scenarios = check.get("scenarios") or [{"name": "default", "frames": check.get("frames", 90), "keys": check.get("keys", {})}]
    by_scenario = {}
    for s in scenarios:
        by_scenario[s["name"]] = run_scenario(code, s["frames"], s.get("keys", {}))
    results = []
    first = scenarios[0]["name"]
    for rule in check["rules"]:
        if rule["what"] == "differs":
            passed = differs(rule, by_scenario)
        else:
            trace, w, h = by_scenario.get(rule.get("in"), by_scenario[first])
            fn = RULES.get(rule["what"])
            try:
                passed = fn(rule, trace, w, h) if fn else None
            except Exception as e:
                passed = f"ERROR:{e}"
        results.append((rule["label"], passed))
    return results

data = json.load(open("gd_extract_all.json", encoding="utf-8"))

for mod, steps in data.items():
    print(f"=== {mod} ===")
    for i, s in enumerate(steps):
        print(f" step {i}:")
        for label, passed in grade(s["solution"], s["check"]):
            print("   ", passed, "-", label)

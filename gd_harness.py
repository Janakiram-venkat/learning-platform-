import sys, os, json, random

sys.path.insert(0, os.path.join("frontend", "src", "game"))
import stage

def run_scenario(code, frames, keys_spec):
    # fresh module state
    stage._stage = None
    g_ns = {}
    exec(compile(code, "<sol>", "exec"), g_ns)
    game = stage._stage
    trace = []
    for i in range(frames):
        keys = keys_spec.get("*", []) if isinstance(keys_spec, dict) else []
        game._tick(keys)
        snap = game._snapshot(for_checker=True)
        trace.append(snap)
        if snap["over"]:
            break
    return trace

def game_over(trace):
    return any(f["over"] for f in trace)

def text_changes(trace):
    words = {}
    for f in trace:
        for i, t in enumerate(f["all"]):
            if t["kind"] != "Text":
                continue
            key = t["name"] or f"#{i}"
            words.setdefault(key, set()).add(str(t["words"]))
    return any(len(s) > 1 for s in words.values())

def grade(check, code):
    scenarios = check.get("scenarios") or [{"name": "default", "frames": check.get("frames", 90), "keys": check.get("keys", {})}]
    by_scenario = {}
    for s in scenarios:
        by_scenario[s["name"]] = run_scenario(code, s["frames"], s.get("keys", {}))
    results = []
    for rule in check["rules"]:
        trace = by_scenario.get(rule.get("in"), by_scenario[scenarios[0]["name"]])
        if rule["what"] == "game_over":
            passed = game_over(trace)
        elif rule["what"] == "text_changes":
            passed = text_changes(trace)
        else:
            passed = None
        results.append((rule["label"], passed))
    return results

data = json.load(open("gd_extract.json", encoding="utf-8"))

print("=== module5 step4 ===")
for label, passed in grade(data["m5check"], data["m5"]):
    print(passed, "-", label)

print("=== module7 step3 ===")
for label, passed in grade(data["m7check"], data["m7"]):
    print(passed, "-", label)

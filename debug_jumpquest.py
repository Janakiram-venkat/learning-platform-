import json
import sys
sys.path.insert(0, r'C:\Users\janak\learning platform\frontend\src\game')
import stage

course = json.load(open(r'C:\Users\janak\learning platform\backend\courses\gamedev\module5.json', encoding='utf-8'))
for idx, step in enumerate(course['steps'], start=1):
    if 'check' not in step:
        continue
    ns = {'__name__': '__main__'}
    try:
        exec(step['solution'], ns)
    except Exception as e:
        print('STEP', idx, step['title'], 'EXEC_ERROR', type(e).__name__, e)
        continue
    g = ns['game']
    frame_count = 200
    keys = []
    check = step['check']
    if isinstance(check, dict) and 'keys' in check and check['keys'].get('*'):
        keys = check['keys']['*']
    if isinstance(check, dict) and 'scenarios' in check:
        scen = check['scenarios'][0]
        frame_count = scen.get('frames', frame_count)
        if scen.get('keys') and scen['keys'].get('*'):
            keys = scen['keys']['*']
    print('STEP', idx, step['title'])
    for _ in range(frame_count):
        g._tick(keys, None)
        if g.over:
            print('  OVER')
            break
    sample = []
    for t in g.things:
        if getattr(t, 'name', None):
            sample.append((t.name, type(t).__name__, getattr(t, 'x', None), getattr(t, 'y', None), getattr(t, 'visible', None), getattr(t, 'dead', None), getattr(t, 'words', None)))
    print('  THINGS', sample)
    print('  SCORE', getattr(g, 'score', None), 'LABEL', [getattr(t, 'words', None) for t in g.things if hasattr(t, 'words')])

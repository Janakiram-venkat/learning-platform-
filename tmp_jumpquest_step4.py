import json, importlib.util
spec = importlib.util.spec_from_file_location('stage', r'C:\Users\janak\learning platform\frontend\src\game\stage.py')
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)
with open(r'C:\Users\janak\learning platform\backend\courses\gamedev\module5.json', encoding='utf-8') as f:
    course = json.load(f)
step = course['steps'][3]
ns = {'__name__': '__main__'}
exec(step['solution'], ns)
g = ns['game']
print('STARTED', g._started)
for i in range(150):
    g._tick(['right'], None)
    if g.over:
        print('OVER', i)
        break
print('FROG', g.things[1].x, g.things[1].y)
print('STARS', [(t.name, t.visible, t.dead) for t in g.things if getattr(t, 'name', None) and 'star' in str(t.name)])
print('TEXT', [getattr(t, 'words', None) for t in g.things if hasattr(t, 'words')])
print('SCORE', getattr(g, 'score', None))

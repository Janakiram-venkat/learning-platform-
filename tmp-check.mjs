import fs from 'fs';
import { checkGame } from './frontend/src/services/gameRuntime.js';
const mod = JSON.parse(fs.readFileSync('./backend/courses/gamedev/module5.json','utf8'));
for (let i = 0; i < mod.steps.length; i++) {
  const s = mod.steps[i];
  if (!s.check) continue;
  const res = await checkGame(s.solution, s.check);
  console.log('STEP', i + 1, s.title, 'ok=', res.ok, 'error=', res.error || '', 'results=', JSON.stringify(res.results?.map(r => ({ label: r.label, passed: r.passed }))));
}

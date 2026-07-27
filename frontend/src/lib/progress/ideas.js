// Saved "Design Your Own AI" concept cards from the AI course's design stage.

import { notifyProgressChange } from './keys';
import { readJSON, writeJSON } from './storage';

const IDEAS_KEY = 'aiIdeas';

export function getAiIdeas() {
  return readJSON(IDEAS_KEY, []);
}

export function saveAiIdea(idea) {
  const ideas = getAiIdeas();
  ideas.push({ ...idea, savedAt: new Date().toISOString() });
  writeJSON(IDEAS_KEY, ideas);
  notifyProgressChange();
}

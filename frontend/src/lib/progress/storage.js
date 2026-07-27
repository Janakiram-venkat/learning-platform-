// Small localStorage helpers shared by the progress modules.
//
// Every read is defensive: a corrupt or missing value must never throw, because
// a student's saved progress is the one thing we can't ask them to re-enter.

export function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

export function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false; // quota exceeded / private mode
  }
}

export function readInt(key, fallback = 0) {
  try {
    return parseInt(localStorage.getItem(key) || '', 10) || fallback;
  } catch {
    return fallback;
  }
}

export function writeInt(key, value) {
  try {
    localStorage.setItem(key, String(value));
    return true;
  } catch {
    return false;
  }
}

import { useCallback, useEffect, useRef, useState } from 'react';
import { contestService } from '../services/api';

// How long typing has to pause before the code is saved to the server.
const SAVE_DELAY_MS = 2500;
// After a failed save (e.g. the wifi dropped), try again this often.
const RETRY_DELAY_MS = 10000;
// How often to re-read the contest window. An organizer can start a contest
// early, hand out extra minutes or call time from the admin page, and a
// student already sitting on the page should see that without refreshing.
const POLL_MS = 15000;
// Keep polling this long past the deadline, so a contest reopened just after
// time was called still reaches the students who are still on the page.
const POLL_AFTER_END_MS = 5 * 60 * 1000;

const backupKey = (contestId, userId) => `contest-backup:${contestId}:${userId}`;

function readBackup(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeBackup(key, code) {
  try {
    localStorage.setItem(key, JSON.stringify({ code, at: Date.now() }));
  } catch { /* storage full or blocked — the server copy still exists */ }
}

function clearBackup(key) {
  try { localStorage.removeItem(key); } catch { /* ignore */ }
}

const phaseAt = (contest, now) => {
  if (!contest) return null;
  if (now < Date.parse(contest.start_at)) return 'upcoming';
  if (now < Date.parse(contest.end_at)) return 'live';
  return 'ended';
};

// Server time, ticking once a second. Everything time-based on the page (the
// countdown, when the brief unseals, when editing locks) runs off this rather
// than the student's own clock, which may be wrong.
function useServerNow(offsetMs) {
  const [now, setNow] = useState(() => Date.now() + offsetMs);
  useEffect(() => {
    const tick = () => setNow(Date.now() + offsetMs);
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [offsetMs]);
  return now;
}

/**
 * One student's work on one contest: loading it, autosaving it, and submitting.
 *
 * Saving is layered so nothing typed is lost:
 *  - every keystroke goes to a localStorage backup immediately;
 *  - the server copy is written once typing pauses (and retried if it fails);
 *  - on reload, a backup newer than the server copy wins and is re-saved.
 */
export function useContestEntry(contestId, userId) {
  const [contest, setContest] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [offset, setOffset] = useState(0);
  const [code, setCodeState] = useState('');
  const [entryLoaded, setEntryLoaded] = useState(false);
  const [submittedAt, setSubmittedAt] = useState(null);
  const [result, setResult] = useState(null); // { score, judge_comment } once published
  const [saveState, setSaveState] = useState('idle'); // idle | unsaved | saving | saved | error
  const [saveError, setSaveError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const now = useServerNow(offset);
  const phase = phaseAt(contest, now);
  const locked = !!submittedAt || phase !== 'live';

  const key = backupKey(contestId, userId);
  const codeRef = useRef('');
  const savedRef = useRef('');
  const lockedRef = useRef(true);
  const timerRef = useRef(null);
  const inFlightRef = useRef(null);
  const saveRef = useRef(null);

  useEffect(() => { lockedRef.current = locked; }, [locked]);

  const applyEntry = useCallback((entry) => {
    setOffset(Date.parse(entry.server_now) - Date.now());
    setSubmittedAt(entry.submitted_at);
    setResult(entry.score != null ? { score: entry.score, judge_comment: entry.judge_comment } : null);

    let next = entry.code;
    let dirty = false;
    const backup = readBackup(key);
    if (entry.submitted_at) {
      clearBackup(key);
    } else if (backup && backup.code !== entry.code) {
      // Backup timestamps are the student's clock; server ones are the server's.
      const serverSavedAt = entry.updated_at ? Date.parse(entry.updated_at) : 0;
      const backupAt = backup.at + (Date.parse(entry.server_now) - Date.now());
      if (backupAt > serverSavedAt) { next = backup.code; dirty = true; }
    }
    codeRef.current = next;
    savedRef.current = dirty ? entry.code : next;
    setCodeState(next);
    setSaveState(dirty ? 'unsaved' : entry.updated_at ? 'saved' : 'idle');
    setEntryLoaded(true);
    return dirty;
  }, [key]);

  const load = useCallback(async () => {
    try {
      const { data } = await contestService.get(contestId);
      setOffset(Date.parse(data.server_now) - Date.now());
      setContest(data);
      setLoadError('');
      if (data.status === 'upcoming') return;
      const { data: entry } = await contestService.getEntry(contestId);
      // A recovered backup is only worth re-saving while the contest is live.
      if (applyEntry(entry) && data.status === 'live') saveRef.current?.();
    } catch (err) {
      setLoadError(err?.response?.data?.detail || 'Could not load this contest. Check your connection and refresh.');
    }
  }, [contestId, applyEntry]);

  // Writes the current code to the server. Never runs two saves at once: a
  // save requested mid-flight just runs again once the first one lands.
  const save = useCallback(async () => {
    clearTimeout(timerRef.current);
    if (inFlightRef.current) { await inFlightRef.current; }
    const sending = codeRef.current;
    if (sending === savedRef.current) {
      setSaveState((s) => (s === 'unsaved' || s === 'error' ? 'saved' : s));
      return;
    }
    setSaveState('saving');
    const request = contestService.saveEntry(contestId, sending)
      .then(({ data }) => {
        savedRef.current = sending;
        setOffset(Date.parse(data.server_now) - Date.now());
        setSaveError('');
        if (codeRef.current === sending) setSaveState('saved');
        else timerRef.current = setTimeout(() => saveRef.current?.(), SAVE_DELAY_MS);
      })
      .catch((err) => {
        const status = err?.response?.status;
        if (status === 409 || status === 403) {
          // Submitted from another tab, or the clock ran out: the server's
          // version is now final, so show that.
          setSaveError(err.response.data?.detail || '');
          setSaveState('error');
          load();
          return;
        }
        setSaveError('Not saved to the server yet: your work is kept on this device and will retry.');
        setSaveState('error');
        timerRef.current = setTimeout(() => saveRef.current?.(), RETRY_DELAY_MS);
      })
      .finally(() => { inFlightRef.current = null; });
    inFlightRef.current = request;
    await request;
  }, [contestId, load]);

  useEffect(() => { saveRef.current = save; }, [save]);

  const setCode = useCallback((next) => {
    if (lockedRef.current) return;
    const value = next ?? '';
    codeRef.current = value;
    setCodeState(value);
    writeBackup(key, value);
    setSaveState('unsaved');
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => saveRef.current?.(), SAVE_DELAY_MS);
  }, [key]);

  const submit = useCallback(async () => {
    clearTimeout(timerRef.current);
    setSubmitting(true);
    try {
      if (inFlightRef.current) await inFlightRef.current;
      const { data } = await contestService.submit(contestId, codeRef.current);
      applyEntry(data);
      setSaveError('');
      return true;
    } catch (err) {
      setSaveError(err?.response?.data?.detail || 'Could not submit. Check your connection and try again.');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [contestId, applyEntry]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- first load of server state; every setState in load() happens after an await
    load();
  }, [load]);

  // Poll the window, never the entry: re-reading the entry would fight with
  // whatever the student is typing, while the contest row is read-only to
  // them and safe to refresh at any moment.
  useEffect(() => {
    if (!contest) return undefined;
    const id = setInterval(async () => {
      if (document.hidden) return;
      if (Date.now() + offset > Date.parse(contest.end_at) + POLL_AFTER_END_MS) return;
      try {
        const { data } = await contestService.get(contestId);
        setOffset(Date.parse(data.server_now) - Date.now());
        // Only the window and the published flag can move under the student;
        // swapping the whole row in would also re-seal a brief mid-contest if
        // the poll and the clock ever disagreed by a second.
        setContest((cur) => (cur && (cur.start_at !== data.start_at
          || cur.end_at !== data.end_at
          || cur.results_published !== data.results_published)
          ? { ...cur, start_at: data.start_at, end_at: data.end_at, results_published: data.results_published }
          : cur));
      } catch { /* a dropped poll is harmless; the next one is 15s away */ }
    }, POLL_MS);
    return () => clearInterval(id);
  }, [contestId, contest, offset]);

  // The moment the countdown crosses the start, fetch the now-unsealed brief.
  // At the end, push the last edits while the server's grace window is open.
  const prevPhase = useRef(phase);
  useEffect(() => {
    const was = prevPhase.current;
    prevPhase.current = phase;
    if (phase === 'live' && was && was !== 'live') load();
    if (was === 'live' && phase === 'ended' && codeRef.current !== savedRef.current) saveRef.current?.();
  }, [phase, load]);

  // Leaving with unsaved edits: warn, and fire one last save on the way out.
  useEffect(() => {
    const warn = (e) => {
      if (!lockedRef.current && codeRef.current !== savedRef.current) {
        saveRef.current?.();
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', warn);
    return () => {
      window.removeEventListener('beforeunload', warn);
      clearTimeout(timerRef.current);
      if (!lockedRef.current && codeRef.current !== savedRef.current) saveRef.current?.();
    };
  }, []);

  return {
    contest, loadError, phase, now, locked, entryLoaded,
    code, setCode, submittedAt, result,
    saveState, saveError, saveNow: save, submit, submitting, reload: load,
  };
}

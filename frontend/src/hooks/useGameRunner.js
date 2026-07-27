import { useCallback, useEffect, useRef, useState } from 'react';
import {
  runGame, stopGame, checkGame, warmupGameRuntime, isGameRuntimeReady, onGameEvent,
  onRuntimeStatus,
} from '../services/gameRuntime';

// Drives one game step: run it live on the canvas, or grade it headless.
export function useGameRunner() {
  const [running, setRunning] = useState(false);
  const [booting, setBooting] = useState(!isGameRuntimeReady());
  const [error, setError] = useState('');
  const [output, setOutput] = useState('');
  const [checking, setChecking] = useState(false);
  const [results, setResults] = useState(null); // [{ label, passed }] | null
  const aliveRef = useRef(true);

  useEffect(() => {
    aliveRef.current = true;
    warmupGameRuntime().then(() => { if (aliveRef.current) setBooting(!isGameRuntimeReady()); });
    return () => { aliveRef.current = false; stopGame(); };
  }, []);

  // The runtime can also be torn down and rebooted underneath us (a remounted
  // canvas can't reuse the old worker), so track it rather than assuming that
  // one successful boot lasts for the life of the page.
  useEffect(() => onRuntimeStatus((isReady) => {
    if (aliveRef.current) setBooting(!isReady);
  }), []);

  // The worker tells us when the loop ends on its own (game.stop() or a crash
  // inside every_frame, which only surfaces once a frame actually runs).
  useEffect(() => onGameEvent((msg) => {
    if (!aliveRef.current) return;
    if (msg.type === 'over') setRunning(false);
    if (msg.type === 'error') { setError(msg.error); setRunning(false); }
  }), []);

  const run = useCallback(async (code) => {
    setError('');
    setOutput('');
    setRunning(true);
    const res = await runGame(code);
    if (!aliveRef.current) return;
    if (res.error) { setError(res.error); setRunning(false); return; }
    setOutput(res.output || '');
  }, []);

  const stop = useCallback(() => { stopGame(); setRunning(false); }, []);

  const check = useCallback(async (code, checkSpec) => {
    setChecking(true);
    setError('');
    stopGame();
    setRunning(false);
    const res = await checkGame(code, checkSpec);
    if (!aliveRef.current) return null;
    setChecking(false);
    if (!res.ok) { setError(res.error); setResults(null); return null; }
    setResults(res.results);
    return res.results;
  }, []);

  const resetResults = useCallback(() => setResults(null), []);

  return { run, stop, check, running, booting, checking, error, output, results, resetResults };
}

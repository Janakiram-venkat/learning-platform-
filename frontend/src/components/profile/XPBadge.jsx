import { useState, useEffect } from 'react';
import { Zap } from 'lucide-react';
import { getXP, getLevelInfo } from '../../lib/progress';

/**
 * Live XP + level pill for the navbar. Updates instantly whenever XP is
 * awarded anywhere in the app (progress.js fires an 'xp-change' event), and
 * briefly pops to celebrate the gain.
 */
export default function XPBadge() {
  const [xp, setXp] = useState(getXP());
  const [pop, setPop] = useState(false);

  useEffect(() => {
    const onChange = (e) => {
      setXp(e.detail?.total ?? getXP());
      setPop(true);
      const t = setTimeout(() => setPop(false), 450);
      return () => clearTimeout(t);
    };
    window.addEventListener('xp-change', onChange);
    return () => window.removeEventListener('xp-change', onChange);
  }, []);

  const { level } = getLevelInfo(xp);

  return (
    <div
      className={`hidden items-center gap-1.5 rounded-lg border-2 border-ink bg-signal px-3 py-1.5 text-sm font-extrabold text-ink sm:flex ${pop ? 'animate-pop' : ''}`}
      title={`Level ${level} · ${xp} XP`}
    >
      <Zap className="h-4 w-4 fill-ink" />
      <span>Lv {level}</span>
      <span className="text-ink/40">·</span>
      <span>{xp} XP</span>
    </div>
  );
}

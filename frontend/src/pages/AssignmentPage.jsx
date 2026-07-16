import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { courseService } from '../services/api';
import {
  isAssignmentUnlocked,
  markAssignmentComplete,
  getAssignmentKey,
  awardXPOnce,
  getNextLessonAfterModule,
  notifyProgressChange,
} from '../utils/progress';
import {
  Sparkles, Bug, Wand2, Brain, Blocks, Flame, Check, X,
  ArrowRight, RotateCcw, Star, Trophy, Lightbulb, Link2,
} from 'lucide-react';

// Visual identity for each round type — drives the chip label and icon.
const ROUND_META = {
  predict: { label: 'Predict the Output', icon: Wand2, accent: 'from-violet-500 to-purple-600', chip: 'bg-violet-100 text-violet-700' },
  bug:     { label: 'Fix the Bug',         icon: Bug,   accent: 'from-rose-500 to-pink-600',     chip: 'bg-rose-100 text-rose-700' },
  concept: { label: 'Quick Thinking',      icon: Brain, accent: 'from-teal-500 to-cyan-600',     chip: 'bg-teal-100 text-teal-700' },
  order:   { label: 'Build the Code',      icon: Blocks, accent: 'from-orange-500 to-amber-500', chip: 'bg-orange-100 text-orange-700' },
  match:   { label: 'Match the Pairs',     icon: Link2, accent: 'from-sky-500 to-blue-600',      chip: 'bg-sky-100 text-sky-700' },
};

const CONFETTI_COLORS = ['#34d399', '#60a5fa', '#fbbf24', '#f472b6', '#a78bfa', '#f87171'];

// Fisher–Yates shuffle that guarantees the result differs from the input
// (so an ordering puzzle never starts already solved).
function shuffleDistinct(arr) {
  if (arr.length < 2) return [...arr];
  let out;
  do {
    out = [...arr];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
  } while (out.every((v, i) => v.id === arr[i].id));
  return out;
}

export default function AssignmentPage() {
  const { courseId, moduleId } = useParams(); // moduleId e.g. "module1"
  const navigate = useNavigate();

  const [assignment, setAssignment] = useState(null);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // --- Game state ---
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);   // chosen option (mcq)
  const [locked, setLocked] = useState(false);       // round answered correctly / revealed
  const [wrongThisRound, setWrongThisRound] = useState(false);
  const [streak, setStreak] = useState(0);
  const [firstTryCorrect, setFirstTryCorrect] = useState(0);
  const [finished, setFinished] = useState(false);
  const [stars, setStars] = useState(0);
  const [xpGained, setXpGained] = useState(0);

  // --- Ordering-puzzle state (drag blocks into numbered slots) ---
  const [orderPool, setOrderPool] = useState([]);   // unplaced blocks [{id, text}]
  const [orderSlots, setOrderSlots] = useState([]); // array length N of block|null
  const [orderSel, setOrderSel] = useState(null);   // tap-selected pool block id
  const [orderShake, setOrderShake] = useState(false);

  // --- Match-the-following state (drag answers into each left slot) ---
  const [matchRight, setMatchRight] = useState([]);   // shuffled right items [{id, text}]
  const [matchSel, setMatchSel] = useState(null);     // tap-selected right id
  const [matchAssign, setMatchAssign] = useState({}); // { leftIndex: rightId }
  const [matchShake, setMatchShake] = useState(false);
  const [matchFeedback, setMatchFeedback] = useState(null); // per-left bool after a wrong check

  // Drag payload (same-window DnD) + the slot currently hovered, for highlight.
  const dragRef = useRef(null);
  const [dragOver, setDragOver] = useState(null); // { kind: 'order'|'match'|'pool', idx }

  const rounds = assignment?.rounds || [];
  const round = rounds[index];
  const total = rounds.length;
  // The lesson to send students back to when they finish — the next module's
  // first lesson, so they continue with content instead of the course list.
  const nextLessonId = getNextLessonAfterModule(course, moduleId.replace('module', ''));

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([
      courseService.getCourse(courseId),
      courseService.getAssignment(courseId, moduleId),
    ])
      .then(([courseRes, assignmentRes]) => {
        if (!active) return;
        const course = courseRes.data.data;
        const numericId = moduleId.replace('module', '');
        const mod = course.modules?.find(
          m => String(m.moduleId ?? m.id) === numericId
        );
        // Don't let students jump into the arcade before finishing the module.
        if (!mod || !isAssignmentUnlocked(mod)) {
          navigate('/', { replace: true });
          return;
        }
        setCourse(course);
        setAssignment(assignmentRes.data.data);
      })
      .catch(() => {
        if (active) setNotFound(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [courseId, moduleId, navigate]);

  // Reset per-round state whenever we move to a new round.
  useEffect(() => {
    if (!round) return;
    setSelected(null);
    setLocked(false);
    setWrongThisRound(false);
    setOrderShake(false);
    setMatchShake(false);
    setMatchSel(null);
    setMatchAssign({});
    setMatchFeedback(null);
    setOrderSel(null);
    setDragOver(null);
    dragRef.current = null;
    if (round.type === 'order') {
      const blocks = round.solution.map((text, i) => ({ id: i, text }));
      setOrderPool(shuffleDistinct(blocks));
      setOrderSlots(Array(round.solution.length).fill(null));
    }
    if (round.type === 'match') {
      // Right-hand options keep their pair index as id, but appear shuffled.
      const rights = round.pairs.map((p, i) => ({ id: i, text: p.right }));
      setMatchRight(shuffleDistinct(rights));
    }
  }, [index, round]);

  const handleSelect = (i) => {
    if (locked) return;
    setSelected(i);
    setLocked(true);
    if (i === round.answer) {
      setStreak(s => s + 1);
      if (!wrongThisRound) setFirstTryCorrect(n => n + 1);
    } else {
      setStreak(0);
      setWrongThisRound(true);
    }
  };

  // ---------- Ordering puzzle: drop a block into slot `slotIndex` ----------
  // Works for both drag (block carried via dragRef) and tap (selected pool id).
  const placeOrderBlock = (blockId, slotIndex) => {
    if (locked || blockId == null) return;
    setOrderSlots(prevSlots => {
      const slots = [...prevSlots];
      // Remove the block from wherever it currently lives.
      const fromSlot = slots.findIndex(b => b && b.id === blockId);
      let block = fromSlot >= 0 ? slots[fromSlot] : orderPool.find(b => b.id === blockId);
      if (!block) return prevSlots;
      if (fromSlot >= 0) slots[fromSlot] = null;
      const displaced = slots[slotIndex];        // block already sitting in target
      slots[slotIndex] = block;
      // Update the pool: take the placed block out, return any displaced block.
      setOrderPool(pool => {
        let next = pool.filter(b => b.id !== blockId);
        if (displaced && displaced.id !== blockId) next = [...next, displaced];
        return next;
      });
      return slots;
    });
    setOrderSel(null);
  };

  // Pull a block out of a slot back into the pool.
  const returnOrderBlock = (slotIndex) => {
    if (locked) return;
    setOrderSlots(prevSlots => {
      const slots = [...prevSlots];
      const block = slots[slotIndex];
      if (!block) return prevSlots;
      slots[slotIndex] = null;
      setOrderPool(pool => [...pool, block]);
      return slots;
    });
  };

  // Tapping a pool block drops it into the first empty slot.
  const tapOrderPool = (blockId) => {
    if (locked) return;
    const firstEmpty = orderSlots.findIndex(s => s === null);
    if (firstEmpty >= 0) placeOrderBlock(blockId, firstEmpty);
    else setOrderSel(id => (id === blockId ? null : blockId));
  };

  const checkOrder = () => {
    const filled = orderSlots.every(Boolean);
    const correct = filled && orderSlots.map(b => b.text).join('\n') === round.solution.join('\n');
    if (correct) {
      setLocked(true);
      setStreak(s => s + 1);
      if (!wrongThisRound) setFirstTryCorrect(n => n + 1);
    } else {
      setStreak(0);
      setWrongThisRound(true);
      setOrderShake(true);
      setTimeout(() => setOrderShake(false), 500);
    }
  };

  // ---------- Match the following: drop right item onto left slot ----------
  const assignRight = (rightId, leftIndex) => {
    if (locked || rightId == null || leftIndex == null) return;
    setMatchFeedback(null); // editing clears the last check's hints
    setMatchAssign(prev => {
      const next = {};
      // Each answer can sit in only one slot — drop it from any other.
      for (const [k, v] of Object.entries(prev)) {
        if (v !== rightId) next[k] = v;
      }
      next[leftIndex] = rightId;
      return next;
    });
    setMatchSel(null);
  };

  // Tapping a pool answer fills the first empty left slot.
  const tapMatchPool = (rightId) => {
    if (locked) return;
    const firstEmpty = round.pairs.findIndex((_, i) => matchAssign[i] === undefined);
    if (firstEmpty >= 0) assignRight(rightId, firstEmpty);
    else setMatchSel(id => (id === rightId ? null : rightId));
  };

  const returnMatch = (leftIndex) => {
    if (locked) return;
    setMatchFeedback(null);
    setMatchAssign(prev => {
      const next = { ...prev };
      delete next[leftIndex];
      return next;
    });
  };

  const checkMatch = () => {
    const pairs = round.pairs;
    const allAssigned = pairs.every((_, i) => matchAssign[i] !== undefined);
    // Per-left correctness: chosen answer text must equal its true partner.
    const correctness = pairs.map((p, i) => {
      const chosen = matchRight.find(r => r.id === matchAssign[i]);
      return !!(chosen && chosen.text === p.right);
    });
    const allCorrect = allAssigned && correctness.every(Boolean);
    if (allCorrect) {
      setLocked(true);
      setMatchFeedback(null);
      setStreak(s => s + 1);
      if (!wrongThisRound) setFirstTryCorrect(n => n + 1);
    } else {
      setStreak(0);
      setWrongThisRound(true);
      setMatchShake(true);
      setTimeout(() => setMatchShake(false), 500);
      // Show which boxes are right (green) and which are wrong (red) so the
      // student knows exactly what to rearrange.
      setMatchFeedback(correctness);
    }
  };

  // --- HTML5 drag-and-drop plumbing (tap fallbacks handled above) ---
  const onDragStart = (payload) => (e) => {
    if (locked) return;
    dragRef.current = payload;
    e.dataTransfer.effectAllowed = 'move';
    try { e.dataTransfer.setData('text/plain', String(payload.id)); } catch { /* some browsers */ }
  };
  const onDragEnd = () => { dragRef.current = null; setDragOver(null); };
  const allowDrop = (over) => (e) => {
    if (locked || !dragRef.current) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOver(over);
  };
  const handleDrop = (handler) => (e) => {
    e.preventDefault();
    const payload = dragRef.current;
    setDragOver(null);
    dragRef.current = null;
    if (payload) handler(payload);
  };

  const finish = useCallback(() => {
    const ratio = total > 0 ? firstTryCorrect / total : 0;
    const earnedStars = ratio === 1 ? 3 : ratio >= 0.6 ? 2 : 1;
    setStars(earnedStars);
    markAssignmentComplete(getAssignmentKey({ moduleId: moduleId.replace('module', '') }), earnedStars);

    // XP: 20 per first-try-correct round + a star bonus. Once per module.
    const gained = awardXPOnce(`arcade-${moduleId}`, firstTryCorrect * 20 + earnedStars * 10);
    setXpGained(gained);

    // Drop an arcade badge into the profile (once).
    try {
      const badges = JSON.parse(localStorage.getItem('earnedBadges') || '[]');
      const badgeId = `arcade-${moduleId}`;
      if (!badges.some(b => b.id === badgeId)) {
        badges.push({
          id: badgeId,
          name: `${assignment.title} Champion`,
          type: 'arcade',
          earnedAt: new Date().toISOString(),
        });
        localStorage.setItem('earnedBadges', JSON.stringify(badges));
        notifyProgressChange();
      }
    } catch { /* ignore storage errors */ }

    setFinished(true);
  }, [total, firstTryCorrect, moduleId, assignment]);

  const next = () => {
    if (index + 1 >= total) finish();
    else setIndex(i => i + 1);
  };

  const playAgain = () => {
    setFinished(false);
    setIndex(0);
    setStreak(0);
    setFirstTryCorrect(0);
    setStars(0);
  };

  if (loading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24">
        <div className="animate-float text-5xl">🎮</div>
        <p className="font-display text-lg font-semibold text-[#6C63A6]">Loading the arcade...</p>
      </div>
    );
  }

  if (notFound || !assignment) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24 text-center">
        <span className="text-5xl">🚧</span>
        <p className="font-display text-lg font-semibold text-[#6C63A6]">This challenge isn't ready yet.</p>
        <Link to="/" className="rounded-xl bg-purple-600 px-5 py-2.5 font-bold text-white">Back to Quests</Link>
      </div>
    );
  }

  // ---------- Results screen ----------
  if (finished) {
    return (
      <div className="relative mx-auto flex w-full max-w-2xl flex-col items-center px-6 py-16 text-center">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {Array.from({ length: 50 }).map((_, i) => (
            <span
              key={i}
              className="absolute top-0 block h-3 w-2 rounded-sm"
              style={{
                left: `${(i / 50) * 100}%`,
                backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
                animation: `confettiFall ${2 + (i % 5) * 0.4}s linear ${(i % 7) * 0.12}s forwards`,
              }}
            />
          ))}
        </div>

        <div className="relative">
          <div className="mb-4 animate-bounce-in text-6xl">{assignment.emoji || '🏆'}</div>
          <h1 className="font-display mb-2 text-3xl font-bold text-[#2D2A4A]">Challenge Complete!</h1>
          <p className="mb-6 font-semibold text-[#6C63A6]">{assignment.title}</p>

          {/* Stars */}
          <div className="mb-6 flex items-center justify-center gap-3">
            {[1, 2, 3].map((s) => (
              <Star
                key={s}
                className={`h-14 w-14 animate-star-pop ${s <= stars ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'}`}
                style={{ animationDelay: `${s * 0.15}s` }}
              />
            ))}
          </div>

          <div className="mb-8 flex flex-wrap items-center justify-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 font-bold text-[#2D2A4A] shadow ring-1 ring-purple-100">
              <Trophy className="h-5 w-5 text-amber-500" />
              {firstTryCorrect} / {total} nailed on the first try
            </span>
            {xpGained > 0 && (
              <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-5 py-2.5 font-extrabold text-white shadow">
                <Sparkles className="h-5 w-5" /> +{xpGained} XP
              </span>
            )}
          </div>

          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              onClick={playAgain}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-purple-300 bg-white px-6 py-3 font-extrabold text-purple-700 transition-transform hover:scale-105 active:scale-95"
            >
              <RotateCcw className="h-5 w-5" /> Play Again
            </button>
            {nextLessonId ? (
              <Link
                to={`/course/${courseId}/lesson/${nextLessonId}`}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-violet-600 px-6 py-3 font-extrabold text-white shadow-md transition-transform hover:scale-105 active:scale-95"
              >
                Continue Learning <ArrowRight className="h-5 w-5" />
              </Link>
            ) : (
              <Link
                to="/"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-violet-600 px-6 py-3 font-extrabold text-white shadow-md transition-transform hover:scale-105 active:scale-95"
              >
                Back to Quests <ArrowRight className="h-5 w-5" />
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ---------- Active round ----------
  const meta = ROUND_META[round.type] || ROUND_META.concept;
  const RoundIcon = meta.icon;
  const isOrder = round.type === 'order';
  const isMatch = round.type === 'match';
  const orderSolved = locked && isOrder;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:py-10">
      {/* Header: title + streak */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{assignment.emoji || '🎮'}</span>
          <h1 className="font-display text-lg font-bold text-[#2D2A4A] sm:text-xl">{assignment.title}</h1>
        </div>
        {streak >= 2 && (
          <span className="inline-flex animate-correct items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1.5 text-sm font-extrabold text-orange-600">
            <Flame className="h-4 w-4" /> {streak} streak!
          </span>
        )}
      </div>

      {/* Progress bar + dots */}
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-xs font-bold text-[#6C63A6]">
          <span>Round {index + 1} of {total}</span>
          <span>{Math.round((index / total) * 100)}% done</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-purple-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-purple-500 to-violet-500 transition-all duration-500"
            style={{ width: `${(index / total) * 100}%` }}
          />
        </div>
      </div>

      {/* Round card */}
      <div key={index} className="animate-slide-up rounded-3xl border-2 border-purple-100 bg-white p-5 shadow-lg sm:p-8">
        <span className={`mb-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold ${meta.chip}`}>
          <RoundIcon className="h-3.5 w-3.5" /> {meta.label}
        </span>

        <h2 className="mb-5 text-xl font-bold text-[#2D2A4A] sm:text-2xl">{round.prompt}</h2>

        {round.code && (
          <pre className="mb-6 overflow-x-auto rounded-2xl bg-gray-900 p-5 font-mono text-sm text-gray-100 shadow-inner">
            {round.code}
          </pre>
        )}

        {/* --- Multiple choice --- */}
        {!isOrder && !isMatch && (
          <div className="space-y-3">
            {round.options.map((opt, i) => {
              const isChosen = selected === i;
              const isAnswer = i === round.answer;
              let style = 'border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50';
              let anim = '';
              if (locked) {
                if (isAnswer) { style = 'border-green-500 bg-green-50 text-green-800'; anim = 'animate-correct'; }
                else if (isChosen) { style = 'border-rose-400 bg-rose-50 text-rose-700'; anim = 'animate-shake'; }
                else style = 'border-gray-200 bg-white opacity-60';
              }
              return (
                <button
                  key={i}
                  onClick={() => handleSelect(i)}
                  disabled={locked}
                  className={`flex w-full items-center justify-between gap-3 rounded-2xl border-2 px-5 py-4 text-left font-semibold transition-all active:scale-[0.98] ${style} ${anim}`}
                >
                  <span className="font-mono text-sm sm:text-base">{opt}</span>
                  {locked && isAnswer && <Check className="h-5 w-5 shrink-0 text-green-600" />}
                  {locked && isChosen && !isAnswer && <X className="h-5 w-5 shrink-0 text-rose-500" />}
                </button>
              );
            })}
          </div>
        )}

        {/* --- Ordering puzzle (drag blocks into numbered slots) --- */}
        {isOrder && (
          <div className="space-y-5">
            <p className="text-sm font-semibold text-[#6C63A6]">Drag the blocks into the right order — or tap a block to drop it in the next slot.</p>

            {/* The program: numbered slots */}
            <div className={`space-y-2 rounded-2xl border-2 border-dashed p-3 transition-colors ${orderShake ? 'animate-shake border-rose-400 bg-rose-50' : orderSolved ? 'border-green-400 bg-green-50' : 'border-purple-200 bg-purple-50/40'}`}>
              {orderSlots.map((block, slotIndex) => {
                const isOver = dragOver?.kind === 'order' && dragOver.idx === slotIndex;
                return (
                  <div
                    key={slotIndex}
                    onDragOver={allowDrop({ kind: 'order', idx: slotIndex })}
                    onDragLeave={() => setDragOver(null)}
                    onDrop={handleDrop((p) => placeOrderBlock(p.id, slotIndex))}
                    className={`flex items-center gap-3 rounded-xl border-2 px-3 py-2 transition-all ${
                      block ? 'border-purple-200 bg-white' : isOver ? 'border-orange-400 bg-orange-50' : 'border-dashed border-purple-200 bg-white/50'
                    }`}
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-extrabold text-purple-600">{slotIndex + 1}</span>
                    {block ? (
                      <button
                        draggable={!locked}
                        onDragStart={onDragStart({ id: block.id, from: 'slot', slotIndex })}
                        onDragEnd={onDragEnd}
                        onClick={() => returnOrderBlock(slotIndex)}
                        disabled={locked}
                        className="flex-1 cursor-grab rounded-lg bg-purple-50 px-3 py-1.5 text-left font-mono text-sm text-[#2D2A4A] transition-transform active:cursor-grabbing active:scale-[0.98] disabled:cursor-default"
                      >
                        <span className="whitespace-pre">{block.text}</span>
                      </button>
                    ) : (
                      <span className="flex-1 text-sm font-semibold text-gray-300">drop a line here…</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Pool of code blocks (also a drop target to put blocks back) */}
            <div
              onDragOver={allowDrop({ kind: 'pool', idx: -1 })}
              onDragLeave={() => setDragOver(null)}
              onDrop={handleDrop((p) => p.from === 'slot' && returnOrderBlock(p.slotIndex))}
              className="flex min-h-[3rem] flex-wrap gap-2 rounded-2xl border-2 border-dashed border-orange-200 bg-orange-50/40 p-3"
            >
              {orderPool.length === 0 && <span className="px-1 py-2 text-sm font-semibold text-gray-400">All blocks placed 👍</span>}
              {orderPool.map((item) => (
                <button
                  key={item.id}
                  draggable={!locked}
                  onDragStart={onDragStart({ id: item.id, from: 'pool' })}
                  onDragEnd={onDragEnd}
                  onClick={() => tapOrderPool(item.id)}
                  disabled={locked}
                  className={`cursor-grab rounded-xl border-2 px-4 py-2.5 font-mono text-sm shadow-sm transition-transform hover:scale-105 active:cursor-grabbing active:scale-95 ${orderSel === item.id ? 'border-orange-500 bg-orange-100 text-orange-900 ring-2 ring-orange-200' : 'border-orange-200 bg-orange-50 text-orange-900'}`}
                >
                  <span className="whitespace-pre">{item.text}</span>
                </button>
              ))}
            </div>

            {!locked && (
              <button
                onClick={checkOrder}
                disabled={orderSlots.some(s => s === null)}
                className="w-full rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-3.5 font-extrabold text-white shadow-md transition-transform enabled:hover:scale-[1.02] enabled:active:scale-95 disabled:opacity-40"
              >
                Check My Code
              </button>
            )}
          </div>
        )}

        {/* --- Match the following (drag answers into each box) --- */}
        {isMatch && (
          <div className="space-y-5">
            <p className="text-sm font-semibold text-[#6C63A6]">Drag each answer into its box — or tap an answer, then tap a box.</p>

            {/* Prompt + placeholder slot rows */}
            <div className={`space-y-3 ${matchShake ? 'animate-shake' : ''}`}>
              {round.pairs.map((p, i) => {
                const assignedId = matchAssign[i];
                const assigned = assignedId !== undefined ? matchRight.find(r => r.id === assignedId) : null;
                // Green/red comes either from the final solved state (locked) or
                // from the hint feedback after a wrong "Check".
                const fb = matchFeedback?.[i];
                const correct = (locked && assigned && assigned.text === p.right) || fb === true;
                const wrong = (locked && assigned && assigned.text !== p.right) || (fb === false && !!assigned);
                const isOver = dragOver?.kind === 'match' && dragOver.idx === i;
                let slotStyle = 'border-dashed border-sky-200 bg-sky-50/40';
                if (correct) slotStyle = 'border-green-400 bg-green-50';
                else if (wrong) slotStyle = 'border-rose-400 bg-rose-50';
                else if (isOver) slotStyle = 'border-orange-400 bg-orange-50';
                else if (assigned) slotStyle = 'border-sky-300 bg-white';
                return (
                  <div key={i} className="flex items-center gap-2 sm:gap-3">
                    <div className="w-2/5 shrink-0 rounded-2xl border-2 border-gray-200 bg-white px-3 py-3 font-mono text-sm font-bold text-[#2D2A4A]">
                      {p.left}
                    </div>
                    <Link2 className="h-4 w-4 shrink-0 text-sky-300" />
                    <div
                      onDragOver={allowDrop({ kind: 'match', idx: i })}
                      onDragLeave={() => setDragOver(null)}
                      onDrop={handleDrop((pl) => assignRight(pl.id, i))}
                      className={`flex min-h-[3.25rem] flex-1 items-center gap-2 rounded-2xl border-2 px-3 py-2 transition-all ${slotStyle}`}
                    >
                      {assigned ? (
                        <button
                          draggable={!locked}
                          onDragStart={onDragStart({ id: assigned.id, from: 'slot', leftIndex: i })}
                          onDragEnd={onDragEnd}
                          onClick={() => returnMatch(i)}
                          disabled={locked}
                          className={`flex-1 cursor-grab text-left font-mono text-sm active:cursor-grabbing disabled:cursor-default ${wrong ? 'text-rose-700' : correct ? 'text-green-700' : 'text-sky-800'}`}
                        >
                          {assigned.text}
                        </button>
                      ) : (
                        <span className="flex-1 text-xs font-semibold text-gray-300">drop the answer here…</span>
                      )}
                      {correct && <Check className="h-4 w-4 shrink-0 text-green-600" />}
                      {wrong && <X className="h-4 w-4 shrink-0 text-rose-500" />}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Hint shown after a wrong check — points out what to rearrange */}
            {matchFeedback && !locked && (() => {
              const wrongCount = matchFeedback.filter(v => v === false).length;
              return (
                <div className="flex items-start gap-3 rounded-2xl bg-amber-50 p-4 text-amber-900 ring-1 ring-amber-100 animate-slide-up">
                  <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                  <p className="text-sm font-medium leading-relaxed">
                    <span className="font-bold">Almost! </span>
                    The boxes in <span className="font-bold text-green-700">green</span> are correct — leave those.
                    {wrongCount === 1
                      ? ' 1 box is still wrong (in red). Drag that answer out and try a different one!'
                      : ` ${wrongCount} boxes are still wrong (in red). Drag those answers out and swap them around!`}
                  </p>
                </div>
              );
            })()}

            {/* Answer pool (drop here to take an answer back out) */}
            <div
              onDragOver={allowDrop({ kind: 'pool', idx: -1 })}
              onDragLeave={() => setDragOver(null)}
              onDrop={handleDrop((pl) => pl.from === 'slot' && returnMatch(pl.leftIndex))}
              className="flex min-h-[3rem] flex-wrap gap-2 rounded-2xl border-2 border-dashed border-orange-200 bg-orange-50/40 p-3"
            >
              {matchRight.every(r => Object.values(matchAssign).includes(r.id)) && (
                <span className="px-1 py-2 text-sm font-semibold text-gray-400">All answers placed 👍</span>
              )}
              {matchRight.map((r) => {
                if (Object.values(matchAssign).includes(r.id)) return null;
                return (
                  <button
                    key={r.id}
                    draggable={!locked}
                    onDragStart={onDragStart({ id: r.id, from: 'pool' })}
                    onDragEnd={onDragEnd}
                    onClick={() => tapMatchPool(r.id)}
                    disabled={locked}
                    className={`cursor-grab rounded-xl border-2 px-4 py-2.5 font-mono text-sm shadow-sm transition-transform hover:scale-105 active:cursor-grabbing active:scale-95 ${matchSel === r.id ? 'border-orange-500 bg-orange-100 text-orange-900 ring-2 ring-orange-200' : 'border-orange-200 bg-orange-50 text-orange-900'}`}
                  >
                    {r.text}
                  </button>
                );
              })}
            </div>

            {!locked && (
              <button
                onClick={checkMatch}
                disabled={round.pairs.some((_, i) => matchAssign[i] === undefined)}
                className="w-full rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 px-6 py-3.5 font-extrabold text-white shadow-md transition-transform enabled:hover:scale-[1.02] enabled:active:scale-95 disabled:opacity-40"
              >
                Check My Matches
              </button>
            )}
          </div>
        )}

        {/* Explanation + Next */}
        {locked && (
          <div className="mt-6 animate-slide-up">
            <div className="flex items-start gap-3 rounded-2xl bg-indigo-50 p-4 text-indigo-900 ring-1 ring-indigo-100">
              <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-indigo-500" />
              <p className="text-sm font-medium leading-relaxed">{round.explain}</p>
            </div>
            <button
              onClick={next}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-violet-600 px-6 py-3.5 font-extrabold text-white shadow-md transition-transform hover:scale-[1.02] active:scale-95"
            >
              {index + 1 >= total ? 'See My Results' : 'Next Round'}
              {index + 1 >= total ? <Sparkles className="h-5 w-5" /> : <ArrowRight className="h-5 w-5" />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

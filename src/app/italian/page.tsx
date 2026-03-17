'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useFamilyMember } from '@/components/FamilyContext';
import ThemedBackground from '@/components/ThemedBackground';
import { PHRASES, CATEGORIES, type ItalianPhrase } from './data';

// ─── Helpers ───────────────────────────────────────────────

function speak(text: string, rate = 0.85) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'it-IT';
  u.rate = rate;
  u.pitch = 1;
  // try to find a native Italian voice
  const voices = window.speechSynthesis.getVoices();
  const italian = voices.find(v => v.lang.startsWith('it'));
  if (italian) u.voice = italian;
  window.speechSynthesis.speak(u);
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[''`]/g, "'").replace(/[^\w\s'àèéìòù]/g, '').replace(/\s+/g, ' ').trim();
}

function fuzzyMatch(input: string, target: string): boolean {
  const a = normalize(input);
  const b = normalize(target);
  if (a === b) return true;
  // allow minor typos: Levenshtein distance ≤ 2 for strings > 5 chars
  if (b.length > 5) {
    const dist = levenshtein(a, b);
    return dist <= 2;
  }
  return a === b;
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] !== b[j - 1] ? 1 : 0)
      );
  return dp[m][n];
}

// Generate wrong answers for multiple choice
function getDistractors(correct: ItalianPhrase, field: 'english' | 'italian', count = 3): string[] {
  const pool = PHRASES.filter(p => p.id !== correct.id && p.category === correct.category);
  const extra = PHRASES.filter(p => p.id !== correct.id && p.category !== correct.category);
  const combined = shuffle([...pool, ...extra]);
  const seen = new Set([correct[field]]);
  const result: string[] = [];
  for (const p of combined) {
    if (!seen.has(p[field])) {
      result.push(p[field]);
      seen.add(p[field]);
    }
    if (result.length >= count) break;
  }
  return result;
}

type QuestionType = 'mc-ita-to-eng' | 'mc-eng-to-ita' | 'type-italian' | 'listen-type';

function pickQuestionType(index: number): QuestionType {
  // Progressive difficulty: early=MC heavy, middle=mixed, late=typing/listening heavy
  const rand = Math.random();
  if (index < 30) {
    // 60% MC, 25% reverse MC, 15% type
    if (rand < 0.6) return 'mc-ita-to-eng';
    if (rand < 0.85) return 'mc-eng-to-ita';
    return 'type-italian';
  } else if (index < 70) {
    // 25% MC, 25% reverse MC, 25% type, 25% listen
    if (rand < 0.25) return 'mc-ita-to-eng';
    if (rand < 0.50) return 'mc-eng-to-ita';
    if (rand < 0.75) return 'type-italian';
    return 'listen-type';
  } else {
    // 15% MC, 15% reverse MC, 35% type, 35% listen
    if (rand < 0.15) return 'mc-ita-to-eng';
    if (rand < 0.30) return 'mc-eng-to-ita';
    if (rand < 0.65) return 'type-italian';
    return 'listen-type';
  }
}

// ─── Confetti ──────────────────────────────────────────────

function Confetti() {
  const pieces = Array.from({ length: 80 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 2,
    size: 6 + Math.random() * 8,
    color: ['#009246', '#FFFFFF', '#CE2B37', '#F59E0B', '#8B5CF6', '#EC4899'][Math.floor(Math.random() * 6)],
    rotation: Math.random() * 360,
    duration: 2 + Math.random() * 3,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map(p => (
        <motion.div key={p.id}
          initial={{ y: -20, x: `${p.x}vw`, opacity: 1, rotate: 0, scale: 1 }}
          animate={{ y: '110vh', rotate: p.rotation + 720, scale: [1, 1.2, 0.8], opacity: [1, 1, 0] }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeIn' }}
          style={{ position: 'absolute', width: p.size, height: p.size * 1.5, backgroundColor: p.color, borderRadius: 2 }}
        />
      ))}
    </div>
  );
}

// ─── Components ────────────────────────────────────────────

function PhraseCard({ phrase, index }: { phrase: ItalianPhrase; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const cat = CATEGORIES.find(c => c.id === phrase.category);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02, duration: 0.3 }}
      onClick={() => setExpanded(!expanded)}
      className="glass rounded-2xl p-5 cursor-pointer hover:bg-white/[0.06] transition-all group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: `${cat?.color}20`, color: cat?.color }}>
              {cat?.icon} {cat?.label}
            </span>
            <div className="flex gap-0.5">
              {[1, 2, 3].map(d => (
                <div key={d} className={`w-1.5 h-1.5 rounded-full ${d <= phrase.difficulty ? 'bg-green-400' : 'bg-white/10'}`} />
              ))}
            </div>
          </div>
          <p className="text-xl font-bold text-white mb-1">{phrase.italian}</p>
          <p className="text-white/50 text-sm">{phrase.english}</p>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); speak(phrase.italian); }}
          className="flex-shrink-0 w-10 h-10 rounded-xl bg-white/5 hover:bg-green-500/20 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
          title="Listen"
        >
          <span className="text-lg">🔊</span>
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-white/30 uppercase tracking-widest">Pronunciation</span>
              </div>
              <p className="text-lg text-green-400/80 font-mono italic">{phrase.pronunciation}</p>
              <button
                onClick={(e) => { e.stopPropagation(); speak(phrase.italian, 0.6); }}
                className="mt-3 text-xs px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-all"
              >
                🐢 Speak Slowly
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main Page ─────────────────────────────────────────────

type ViewMode = 'browse' | 'flashcards' | 'challenge';

export default function ItalianPage() {
  const { currentMember } = useFamilyMember();
  const [view, setView] = useState<ViewMode>('browse');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [fontSize, setFontSizeState] = useState(16);

  // Load saved font size
  useEffect(() => {
    const saved = localStorage.getItem('italian-font-size');
    if (saved) setFontSizeState(parseInt(saved));
  }, []);
  const updateFontSize = (s: number) => { setFontSizeState(s); localStorage.setItem('italian-font-size', String(s)); };

  // Flash card state
  const [flashIndex, setFlashIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [learned, setLearned] = useState<Set<number>>(new Set());
  const [flashDeck, setFlashDeck] = useState<ItalianPhrase[]>([]);

  // Challenge state
  const [challengeActive, setChallengeActive] = useState(false);
  const [challengeQuestions, setChallengeQuestions] = useState<ItalianPhrase[]>([]);
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [questionType, setQuestionType] = useState<QuestionType>('mc-ita-to-eng');
  const [mcOptions, setMcOptions] = useState<string[]>([]);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [timeLeft, setTimeLeft] = useState(20);
  const [showResult, setShowResult] = useState<'correct' | 'wrong' | null>(null);
  const [challengeWon, setChallengeWon] = useState(false);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [answeredThisQuestion, setAnsweredThisQuestion] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [listenPlayed, setListenPlayed] = useState(false);
  const [wrongAnswer, setWrongAnswer] = useState<string | null>(null);

  // Filter phrases
  const filtered = PHRASES.filter(p => {
    if (selectedCategory && p.category !== selectedCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return p.italian.toLowerCase().includes(q) || p.english.toLowerCase().includes(q);
    }
    return true;
  });

  // ─── Flashcard Logic ──────────────────────────────

  const startFlashcards = useCallback((cat?: string) => {
    const deck = cat ? shuffle(PHRASES.filter(p => p.category === cat)) : shuffle([...PHRASES]);
    setFlashDeck(deck);
    setFlashIndex(0);
    setFlipped(false);
    setLearned(new Set());
    setView('flashcards');
  }, []);

  const flashCards = flashDeck.filter(p => !learned.has(p.id));
  const currentFlash = flashCards[flashIndex];
  const flashProgress = flashDeck.length > 0 ? (learned.size / flashDeck.length) * 100 : 0;

  // ─── Challenge Logic ──────────────────────────────

  const setupQuestion = useCallback((questions: ItalianPhrase[], index: number) => {
    const phrase = questions[index];
    if (!phrase) return;
    const type = pickQuestionType(index);
    setQuestionType(type);
    setTypedAnswer('');
    setShowResult(null);
    setAnsweredThisQuestion(false);
    setTimeLeft(20);
    setListenPlayed(false);
    setWrongAnswer(null);

    if (type === 'mc-ita-to-eng') {
      const distractors = getDistractors(phrase, 'english');
      setMcOptions(shuffle([phrase.english, ...distractors]));
    } else if (type === 'mc-eng-to-ita') {
      const distractors = getDistractors(phrase, 'italian');
      setMcOptions(shuffle([phrase.italian, ...distractors]));
    } else {
      setMcOptions([]);
    }

    // Auto-play audio for listen questions
    if (type === 'listen-type') {
      setTimeout(() => {
        speak(phrase.italian, 0.85);
        setListenPlayed(true);
      }, 500);
    }
  }, []);

  const startChallenge = useCallback(() => {
    const questions = shuffle([...PHRASES]);
    setChallengeQuestions(questions);
    setChallengeIndex(0);
    setStreak(0);
    setChallengeActive(true);
    setChallengeWon(false);
    setTotalAttempts(prev => prev + 1);
    setView('challenge');
    setupQuestion(questions, 0);
  }, [setupQuestion]);

  // Timer
  useEffect(() => {
    if (view !== 'challenge' || !challengeActive || showResult || challengeWon) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Time's up = wrong
          clearInterval(timerRef.current!);
          handleWrong();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, challengeActive, challengeIndex, showResult, challengeWon]);

  const handleWrong = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setShowResult('wrong');
    setAnsweredThisQuestion(true);
    const phrase = challengeQuestions[challengeIndex];
    if (phrase) setWrongAnswer(`${phrase.italian} = ${phrase.english}`);
    if (streak > bestStreak) setBestStreak(streak);
    // Reset after delay
    setTimeout(() => {
      const newQuestions = shuffle([...PHRASES]);
      setChallengeQuestions(newQuestions);
      setChallengeIndex(0);
      setStreak(0);
      setShowResult(null);
      setupQuestion(newQuestions, 0);
    }, 3000);
  }, [challengeQuestions, challengeIndex, streak, bestStreak, setupQuestion]);

  const handleCorrect = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setShowResult('correct');
    setAnsweredThisQuestion(true);
    const newStreak = streak + 1;
    setStreak(newStreak);
    if (newStreak > bestStreak) setBestStreak(newStreak);

    if (newStreak >= 100) {
      // WIN!
      setTimeout(() => setChallengeWon(true), 800);
      return;
    }

    setTimeout(() => {
      const nextIndex = challengeIndex + 1;
      setChallengeIndex(nextIndex);
      setupQuestion(challengeQuestions, nextIndex);
    }, 1200);
  }, [streak, bestStreak, challengeIndex, challengeQuestions, setupQuestion]);

  const checkAnswer = useCallback((answer: string) => {
    if (answeredThisQuestion) return;
    const phrase = challengeQuestions[challengeIndex];
    if (!phrase) return;

    let correct = false;
    if (questionType === 'mc-ita-to-eng') {
      correct = answer === phrase.english;
    } else if (questionType === 'mc-eng-to-ita') {
      correct = answer === phrase.italian;
    } else if (questionType === 'type-italian') {
      correct = fuzzyMatch(answer, phrase.italian);
    } else if (questionType === 'listen-type') {
      correct = fuzzyMatch(answer, phrase.english);
    }

    if (correct) handleCorrect();
    else handleWrong();
  }, [answeredThisQuestion, challengeQuestions, challengeIndex, questionType, handleCorrect, handleWrong]);

  const challengePhrase = challengeQuestions[challengeIndex];

  // ─── Render ───────────────────────────────────────

  return (
    <div className="min-h-screen relative" style={{ fontSize }}>
      <ThemedBackground theme="italian" />

      {/* Navigation Bar */}
      <div className="border-b border-white/5 sticky top-0 z-40 backdrop-blur-xl bg-[#050510]/80">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/" className="text-white/40 hover:text-white/80 transition-colors text-sm flex items-center gap-2">
            ← Home
          </Link>
          <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1">
            {([
              ['browse', '📖 Browse'],
              ['flashcards', '🃏 Flash Cards'],
              ['challenge', '🏆 $100 Challenge'],
            ] as [ViewMode, string][]).map(([mode, label]) => (
              <button key={mode}
                onClick={() => {
                  if (mode === 'flashcards') startFlashcards();
                  else if (mode === 'challenge') startChallenge();
                  else setView(mode);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  view === mode ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-white/5 rounded-xl overflow-hidden">
              <button onClick={() => updateFontSize(Math.max(14, fontSize - 2))}
                className="text-white/40 hover:text-white/70 hover:bg-white/10 transition-all font-bold px-2 py-1 text-sm"
                title="Smaller">A−</button>
              <span className="text-white/20 border-x border-white/5 px-1.5 py-1 text-[10px]">{fontSize}</span>
              <button onClick={() => updateFontSize(Math.min(28, fontSize + 2))}
                className="text-white/40 hover:text-white/70 hover:bg-white/10 transition-all font-bold px-2 py-1 text-sm"
                title="Bigger">A+</button>
            </div>
            {currentMember && (
              <span className="text-white/30 text-sm">{currentMember.emoji} {currentMember.name}</span>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════ BROWSE MODE ═══════════════════════════ */}
      {view === 'browse' && (
        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Hero */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
            <div className="flex items-center justify-center gap-3 mb-3">
              <span className="text-5xl">🇮🇹</span>
            </div>
            <h1 className="text-5xl font-bold mb-3">
              <span className="bg-gradient-to-r from-green-400 via-white to-red-400 bg-clip-text text-transparent">
                Learn Italian
              </span>
            </h1>
            <p className="text-white/40 text-lg max-w-xl mx-auto">
              100 essential phrases for your Italian vacation. Listen, study, and master them all.
            </p>
          </motion.div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {[
              { label: 'Phrases', value: '100', icon: '📝' },
              { label: 'Categories', value: '8', icon: '📂' },
              { label: 'With Audio', value: '100', icon: '🔊' },
              { label: 'Prize', value: '$100', icon: '💰' },
            ].map(s => (
              <div key={s.label} className="glass rounded-2xl p-4 text-center">
                <div className="text-2xl mb-1">{s.icon}</div>
                <div className="text-2xl font-bold">{s.value}</div>
                <div className="text-xs text-white/30">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Category Pills + Search */}
          <div className="mb-6 space-y-4">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  !selectedCategory ? 'bg-white/15 text-white' : 'bg-white/5 text-white/40 hover:text-white/60'
                }`}
              >
                All ({PHRASES.length})
              </button>
              {CATEGORIES.map(cat => {
                const count = PHRASES.filter(p => p.category === cat.id).length;
                return (
                  <button key={cat.id}
                    onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 ${
                      selectedCategory === cat.id ? 'text-white' : 'text-white/40 hover:text-white/60'
                    }`}
                    style={selectedCategory === cat.id ? { backgroundColor: `${cat.color}25`, color: cat.color } : { backgroundColor: 'rgba(255,255,255,0.03)' }}
                  >
                    {cat.icon} {cat.label} <span className="text-xs opacity-50">({count})</span>
                  </button>
                );
              })}
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="Search phrases..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pl-10 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/20 transition-colors"
              />
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20">🔍</span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-3 mb-8">
            <button
              onClick={() => startFlashcards(selectedCategory || undefined)}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-500/20 text-green-400 text-sm font-medium hover:from-green-600/30 hover:to-emerald-600/30 transition-all"
            >
              🃏 Study {selectedCategory ? CATEGORIES.find(c => c.id === selectedCategory)?.label : 'All'} as Flash Cards
            </button>
            <button
              onClick={() => { speak(filtered[Math.floor(Math.random() * filtered.length)]?.italian || 'Ciao'); }}
              className="px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-white/50 text-sm hover:text-white/70 transition-all"
            >
              🎲 Random Phrase
            </button>
          </div>

          {/* Phrase Grid */}
          <div className="grid gap-3 md:grid-cols-2">
            {filtered.map((phrase, i) => (
              <PhraseCard key={phrase.id} phrase={phrase} index={i} />
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-20 text-white/20">
              <div className="text-5xl mb-4">🔍</div>
              <p>No phrases match your search.</p>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════ FLASHCARD MODE ═══════════════════════════ */}
      {view === 'flashcards' && (
        <div className="max-w-2xl mx-auto px-6 py-8">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Category quick-switch */}
            <div className="flex flex-wrap gap-2 mb-6 justify-center">
              <button onClick={() => startFlashcards()}
                className="px-3 py-1.5 rounded-lg text-xs bg-white/5 text-white/40 hover:text-white/60 transition-all">
                All
              </button>
              {CATEGORIES.map(cat => (
                <button key={cat.id} onClick={() => startFlashcards(cat.id)}
                  className="px-3 py-1.5 rounded-lg text-xs bg-white/5 text-white/40 hover:text-white/60 transition-all">
                  {cat.icon} {cat.label}
                </button>
              ))}
            </div>

            {/* Progress */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-white/30">{learned.size} of {flashDeck.length} learned</span>
                <span className="text-xs text-white/30">{Math.round(flashProgress)}%</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg, #009246, #FFFFFF80, #CE2B37)' }}
                  initial={{ width: 0 }} animate={{ width: `${flashProgress}%` }} transition={{ duration: 0.5 }} />
              </div>
            </div>

            {flashCards.length === 0 ? (
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-16">
                <div className="text-7xl mb-4">🎉</div>
                <h2 className="text-3xl font-bold mb-2">Perfetto!</h2>
                <p className="text-white/40 mb-2">You reviewed all {flashDeck.length} phrases!</p>
                <p className="text-white/20 text-sm mb-6">Ready for the $100 challenge?</p>
                <div className="flex gap-3 justify-center">
                  <button onClick={() => startFlashcards()}
                    className="px-6 py-3 rounded-xl bg-white/5 text-white/50 font-medium">Start Over</button>
                  <button onClick={startChallenge}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-red-500 text-white font-medium">
                    🏆 Take the Challenge
                  </button>
                </div>
              </motion.div>
            ) : currentFlash && (
              <div>
                <p className="text-center text-white/20 text-sm mb-4">
                  Card {flashIndex + 1} of {flashCards.length}
                </p>

                {/* Flashcard */}
                <div style={{ perspective: '1200px' }}>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`${currentFlash.id}-${flipped}`}
                      initial={{ rotateY: 90, opacity: 0 }}
                      animate={{ rotateY: 0, opacity: 1 }}
                      exit={{ rotateY: -90, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      onClick={() => setFlipped(!flipped)}
                      className="glass rounded-3xl p-10 min-h-[380px] flex flex-col items-center justify-center cursor-pointer hover:bg-white/[0.04] transition-colors select-none relative overflow-hidden"
                    >
                      {/* Italian flag accent line */}
                      <div className="absolute top-0 left-0 right-0 h-1 flex">
                        <div className="flex-1 bg-green-500" />
                        <div className="flex-1 bg-white" />
                        <div className="flex-1 bg-red-500" />
                      </div>

                      {!flipped ? (
                        <div className="text-center">
                          <p className="text-xs text-white/20 uppercase tracking-[0.3em] mb-6">Italiano</p>
                          <p className="text-4xl sm:text-5xl font-bold mb-4">{currentFlash.italian}</p>
                          <p className="text-sm text-green-400/60 font-mono mt-2">{currentFlash.pronunciation}</p>
                          <button
                            onClick={(e) => { e.stopPropagation(); speak(currentFlash.italian); }}
                            className="mt-6 w-14 h-14 rounded-full bg-white/5 hover:bg-green-500/20 flex items-center justify-center mx-auto transition-all hover:scale-110 active:scale-95"
                          >
                            <span className="text-2xl">🔊</span>
                          </button>
                          <p className="text-white/15 text-xs mt-6">Tap card to reveal translation</p>
                        </div>
                      ) : (
                        <div className="text-center w-full">
                          <p className="text-xs text-white/20 uppercase tracking-[0.3em] mb-4">English</p>
                          <p className="text-3xl sm:text-4xl font-bold text-green-400 mb-6">{currentFlash.english}</p>
                          <div className="border-t border-white/10 pt-4 space-y-2">
                            <p className="text-xl text-white/60">{currentFlash.italian}</p>
                            <p className="text-sm text-white/25 font-mono italic">{currentFlash.pronunciation}</p>
                          </div>
                          <div className="mt-4 flex items-center justify-center gap-2">
                            <button onClick={(e) => { e.stopPropagation(); speak(currentFlash.italian); }}
                              className="text-xs px-3 py-1.5 rounded-lg bg-white/5 text-white/30 hover:text-white/60 transition-all">
                              🔊 Normal
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); speak(currentFlash.italian, 0.55); }}
                              className="text-xs px-3 py-1.5 rounded-lg bg-white/5 text-white/30 hover:text-white/60 transition-all">
                              🐢 Slow
                            </button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-6 justify-center flex-wrap">
                  <button onClick={() => { setFlashIndex(Math.max(0, flashIndex - 1)); setFlipped(false); }}
                    disabled={flashIndex === 0}
                    className="px-5 py-3 rounded-xl bg-white/5 text-white/40 text-sm disabled:opacity-20">
                    ← Prev
                  </button>

                  {flipped ? (
                    <>
                      <button onClick={() => { setFlashIndex((flashIndex + 1) % flashCards.length); setFlipped(false); }}
                        className="px-5 py-3 rounded-xl bg-amber-500/15 text-amber-400 text-sm font-medium border border-amber-500/20">
                        🔄 Study Again
                      </button>
                      <button onClick={() => {
                        setLearned(prev => new Set([...prev, currentFlash.id]));
                        const remaining = flashCards.filter(p => p.id !== currentFlash.id);
                        if (remaining.length > 0) setFlashIndex(Math.min(flashIndex, remaining.length - 1));
                        setFlipped(false);
                      }}
                        className="px-5 py-3 rounded-xl bg-green-500/15 text-green-400 text-sm font-medium border border-green-500/20">
                        ✅ Got It!
                      </button>
                    </>
                  ) : (
                    <button onClick={() => setFlipped(true)}
                      className="px-8 py-3 rounded-xl bg-gradient-to-r from-green-500/20 to-red-500/20 text-green-400 text-sm font-medium border border-green-500/20">
                      Show Answer
                    </button>
                  )}

                  <button onClick={() => { setFlashIndex(Math.min(flashCards.length - 1, flashIndex + 1)); setFlipped(false); }}
                    disabled={flashIndex >= flashCards.length - 1}
                    className="px-5 py-3 rounded-xl bg-white/5 text-white/40 text-sm disabled:opacity-20">
                    Next →
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* ═══════════════════════════ $100 CHALLENGE ═══════════════════════════ */}
      {view === 'challenge' && (
        <div className="max-w-2xl mx-auto px-6 py-8">
          {challengeWon ? (
            <>
              <Confetti />
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', damping: 15, stiffness: 200 }}
                className="text-center py-12"
              >
                <motion.div
                  animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  className="text-8xl mb-6"
                >
                  🏆
                </motion.div>
                <h1 className="text-5xl font-bold mb-4">
                  <span className="bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-400 bg-clip-text text-transparent">
                    HAI VINTO!
                  </span>
                </h1>
                <p className="text-2xl text-white/60 mb-2">You got all 100 correct in a row!</p>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 1, type: 'spring' }}
                  className="inline-block my-8"
                >
                  <div className="glass rounded-3xl p-8 inline-block">
                    <div className="text-6xl font-bold text-green-400 mb-2">$100</div>
                    <div className="text-white/40 text-sm">Prize Earned</div>
                  </div>
                </motion.div>
                <p className="text-white/30 text-sm mb-8">
                  {currentMember ? `${currentMember.name}, tell ` : 'Tell '}Dad to add this to your to-do list as completed!
                </p>
                <div className="flex gap-3 justify-center">
                  <button onClick={() => setView('browse')}
                    className="px-6 py-3 rounded-xl bg-white/5 text-white/50 font-medium">Back to Phrases</button>
                  <button onClick={startChallenge}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-red-500 text-white font-medium">
                    Play Again (for glory)
                  </button>
                </div>
              </motion.div>
            </>
          ) : !challengeActive ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-12">
              <div className="text-7xl mb-6">🏆</div>
              <h1 className="text-4xl font-bold mb-4">The $100 Challenge</h1>
              <p className="text-white/50 mb-8 max-w-md mx-auto">
                Get all 100 Italian phrases correct <strong className="text-white">in a row</strong>, in a single sitting.
                One wrong answer and you start over from zero.
              </p>
              <div className="glass rounded-2xl p-6 max-w-md mx-auto mb-8 text-left space-y-3">
                <h3 className="font-bold text-white/80 text-sm uppercase tracking-widest mb-4">Rules</h3>
                <div className="flex gap-3 text-sm text-white/50">
                  <span className="text-green-400">✓</span>
                  <span>4 question types: multiple choice, reverse MC, type the Italian, and listen & type</span>
                </div>
                <div className="flex gap-3 text-sm text-white/50">
                  <span className="text-green-400">✓</span>
                  <span>20 seconds per question — no time to look things up</span>
                </div>
                <div className="flex gap-3 text-sm text-white/50">
                  <span className="text-green-400">✓</span>
                  <span>Questions get harder as you progress (more typing, more listening)</span>
                </div>
                <div className="flex gap-3 text-sm text-white/50">
                  <span className="text-red-400">✗</span>
                  <span>One wrong answer = restart from question 1 with a new shuffle</span>
                </div>
                <div className="flex gap-3 text-sm text-white/50">
                  <span className="text-red-400">✗</span>
                  <span>No pausing — must complete in one sitting</span>
                </div>
              </div>
              <button onClick={startChallenge}
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-green-500 via-white/80 to-red-500 text-black font-bold text-lg hover:scale-105 transition-transform">
                Accept the Challenge
              </button>
            </motion.div>
          ) : challengePhrase && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {/* Streak + Progress Bar */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold">
                      {streak > 0 && (
                        <motion.span
                          key={streak}
                          initial={{ scale: 1.5, color: '#4ADE80' }}
                          animate={{ scale: 1, color: '#ffffff80' }}
                          className="inline-block"
                        >
                          🔥 {streak}/100
                        </motion.span>
                      )}
                      {streak === 0 && <span className="text-white/40">0/100</span>}
                    </span>
                    {bestStreak > 0 && streak < bestStreak && (
                      <span className="text-xs text-white/20">Best: {bestStreak}</span>
                    )}
                  </div>
                  {/* Timer */}
                  <div className={`flex items-center gap-2 text-sm font-mono ${
                    timeLeft <= 5 ? 'text-red-400' : timeLeft <= 10 ? 'text-amber-400' : 'text-white/40'
                  }`}>
                    <motion.span
                      key={timeLeft}
                      initial={timeLeft <= 5 ? { scale: 1.3 } : {}}
                      animate={{ scale: 1 }}
                    >
                      ⏱ {timeLeft}s
                    </motion.span>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="h-3 bg-white/5 rounded-full overflow-hidden relative">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: 'linear-gradient(90deg, #009246, #F5F5F5, #CE2B37)' }}
                    animate={{ width: `${streak}%` }}
                    transition={{ duration: 0.3 }}
                  />
                  {/* milestone markers */}
                  {[25, 50, 75].map(m => (
                    <div key={m} className="absolute top-0 bottom-0 w-px bg-white/10" style={{ left: `${m}%` }}>
                      <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] text-white/15">{m}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Question Card */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${challengeIndex}-${questionType}`}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.3 }}
                  className="glass rounded-3xl p-8 relative overflow-hidden"
                >
                  {/* Question type badge */}
                  <div className="flex items-center justify-between mb-6">
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                      questionType === 'mc-ita-to-eng' ? 'bg-blue-500/15 text-blue-400' :
                      questionType === 'mc-eng-to-ita' ? 'bg-purple-500/15 text-purple-400' :
                      questionType === 'type-italian' ? 'bg-amber-500/15 text-amber-400' :
                      'bg-pink-500/15 text-pink-400'
                    }`}>
                      {questionType === 'mc-ita-to-eng' ? '🇮🇹 → 🇬🇧 Pick the English' :
                       questionType === 'mc-eng-to-ita' ? '🇬🇧 → 🇮🇹 Pick the Italian' :
                       questionType === 'type-italian' ? '⌨️ Type in Italian' :
                       '👂 Listen & Type English'}
                    </span>
                    <span className="text-xs text-white/20">#{challengeIndex + 1}</span>
                  </div>

                  {/* Prompt */}
                  <div className="text-center mb-8">
                    {questionType === 'mc-ita-to-eng' && (
                      <div>
                        <p className="text-xs text-white/20 uppercase tracking-widest mb-3">What does this mean?</p>
                        <p className="text-4xl font-bold mb-3">{challengePhrase.italian}</p>
                        <button onClick={() => speak(challengePhrase.italian)}
                          className="text-white/20 hover:text-white/50 transition-colors text-sm">
                          🔊 Listen
                        </button>
                      </div>
                    )}
                    {questionType === 'mc-eng-to-ita' && (
                      <div>
                        <p className="text-xs text-white/20 uppercase tracking-widest mb-3">How do you say this in Italian?</p>
                        <p className="text-3xl font-bold text-white/80">{challengePhrase.english}</p>
                      </div>
                    )}
                    {questionType === 'type-italian' && (
                      <div>
                        <p className="text-xs text-white/20 uppercase tracking-widest mb-3">Type this in Italian</p>
                        <p className="text-3xl font-bold text-white/80 mb-1">{challengePhrase.english}</p>
                        <p className="text-xs text-white/15">Tip: minor typos are forgiven</p>
                      </div>
                    )}
                    {questionType === 'listen-type' && (
                      <div>
                        <p className="text-xs text-white/20 uppercase tracking-widest mb-4">Listen and type what it means in English</p>
                        <button onClick={() => speak(challengePhrase.italian)}
                          className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500/20 to-red-500/20 border border-white/10 flex items-center justify-center mx-auto hover:scale-110 active:scale-95 transition-transform"
                        >
                          <span className="text-4xl">{listenPlayed ? '🔊' : '▶️'}</span>
                        </button>
                        <button onClick={() => speak(challengePhrase.italian, 0.55)}
                          className="mt-2 text-xs text-white/20 hover:text-white/40 transition-colors">
                          🐢 Play slowly
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Answer Area */}
                  {(questionType === 'mc-ita-to-eng' || questionType === 'mc-eng-to-ita') && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {mcOptions.map((opt, i) => {
                        const isCorrectAnswer = questionType === 'mc-ita-to-eng'
                          ? opt === challengePhrase.english
                          : opt === challengePhrase.italian;
                        let btnStyle = 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10';
                        if (showResult && isCorrectAnswer) {
                          btnStyle = 'bg-green-500/20 border-green-500/40 text-green-400';
                        } else if (showResult === 'wrong' && !isCorrectAnswer && answeredThisQuestion) {
                          btnStyle = 'bg-white/5 border-white/5 text-white/20';
                        }

                        return (
                          <motion.button
                            key={opt}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            disabled={answeredThisQuestion}
                            onClick={() => checkAnswer(opt)}
                            className={`p-4 rounded-xl border text-left text-sm font-medium transition-all ${btnStyle} disabled:cursor-default`}
                          >
                            <span className="text-white/20 mr-2">{String.fromCharCode(65 + i)}.</span>
                            {opt}
                          </motion.button>
                        );
                      })}
                    </div>
                  )}

                  {(questionType === 'type-italian' || questionType === 'listen-type') && (
                    <div>
                      <form onSubmit={(e) => { e.preventDefault(); if (typedAnswer.trim()) checkAnswer(typedAnswer.trim()); }}>
                        <input
                          ref={inputRef}
                          type="text"
                          value={typedAnswer}
                          onChange={e => setTypedAnswer(e.target.value)}
                          disabled={answeredThisQuestion}
                          placeholder={questionType === 'type-italian' ? 'Type the Italian phrase...' : 'Type the English meaning...'}
                          autoFocus
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-lg text-white placeholder-white/20 focus:outline-none focus:border-white/20 transition-colors disabled:opacity-50"
                        />
                        <button type="submit" disabled={answeredThisQuestion || !typedAnswer.trim()}
                          className="mt-3 w-full py-3 rounded-xl bg-gradient-to-r from-green-600/30 to-emerald-600/30 border border-green-500/20 text-green-400 font-medium disabled:opacity-30 transition-all">
                          Submit Answer
                        </button>
                      </form>
                    </div>
                  )}

                  {/* Result Overlay */}
                  <AnimatePresence>
                    {showResult && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className={`mt-6 p-4 rounded-xl text-center ${
                          showResult === 'correct'
                            ? 'bg-green-500/10 border border-green-500/20'
                            : 'bg-red-500/10 border border-red-500/20'
                        }`}
                      >
                        {showResult === 'correct' ? (
                          <div>
                            <span className="text-2xl">✅</span>
                            <p className="text-green-400 font-bold mt-1">Corretto!</p>
                          </div>
                        ) : (
                          <div>
                            <span className="text-2xl">❌</span>
                            <p className="text-red-400 font-bold mt-1">Sbagliato!</p>
                            {wrongAnswer && (
                              <p className="text-white/40 text-sm mt-2">The answer was: <strong className="text-white/60">{wrongAnswer}</strong></p>
                            )}
                            <p className="text-white/20 text-xs mt-2">Restarting from question 1...</p>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </AnimatePresence>

              {/* Challenge Stats */}
              <div className="mt-8 grid grid-cols-3 gap-3">
                <div className="glass rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-green-400">{streak}</div>
                  <div className="text-[10px] text-white/25 uppercase tracking-widest">Current Streak</div>
                </div>
                <div className="glass rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-amber-400">{bestStreak}</div>
                  <div className="text-[10px] text-white/25 uppercase tracking-widest">Best Streak</div>
                </div>
                <div className="glass rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-white/50">{totalAttempts}</div>
                  <div className="text-[10px] text-white/25 uppercase tracking-widest">Attempts</div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useFamilyMember } from '@/components/FamilyContext';
import ThemedBackground from '@/components/ThemedBackground';

interface VocabEntry {
  id: string; germanWord: string; englishWord: string;
  exampleSentence: string | null; dateAdded: string; confidence: number;
}

function VocabContent() {
  const searchParams = useSearchParams();
  const startMode = searchParams.get('mode') === 'flashcards' ? 'flash' : 'list';
  const { currentMember, setShowPicker } = useFamilyMember();
  const [vocab, setVocab] = useState<VocabEntry[]>([]);
  const [view, setView] = useState<'list' | 'flash'>(startMode as 'list' | 'flash');
  const [flashIndex, setFlashIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'alpha'>('recent');
  const [learned, setLearned] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (currentMember) {
      fetch(`/api/german/vocab?user=${encodeURIComponent(currentMember.name)}`)
        .then((r) => r.json()).then(setVocab);
    }
  }, [currentMember]);

  const handleDelete = async (id: string) => {
    await fetch(`/api/german/vocab?id=${id}`, { method: 'DELETE' });
    setVocab((prev) => prev.filter((v) => v.id !== id));
  };

  const markLearned = (id: string) => {
    setLearned((prev) => new Set([...prev, id]));
    const remaining = vocab.filter((v) => !learned.has(v.id) && v.id !== id);
    if (remaining.length > 0) {
      setFlashIndex(Math.min(flashIndex, remaining.length - 1));
    }
    setFlipped(false);
  };

  const sorted = [...vocab].sort((a, b) => {
    if (sortBy === 'alpha') return a.germanWord.localeCompare(b.germanWord);
    return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
  });

  const flashCards = vocab.filter((v) => !learned.has(v.id));
  const currentCard = flashCards[flashIndex];
  const progress = vocab.length > 0 ? ((learned.size / vocab.length) * 100) : 0;

  if (!currentMember) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <ThemedBackground theme="german" />
        <div className="glass rounded-3xl p-10 max-w-md w-full text-center">
          <div className="text-5xl mb-4">📚</div>
          <h1 className="text-2xl font-bold mb-2">My Vocabulary</h1>
          <p className="text-white/40 text-sm mb-6">Pick your profile to see your saved words</p>
          <button onClick={() => setShowPicker(true)}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-red-500 text-white font-medium">Choose Profile</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <ThemedBackground theme="german" />

      <div className="border-b border-white/5">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/german" className="text-white/40 hover:text-white/80 transition-colors text-sm">← Back to Videos</Link>
          <span className="text-white/30 text-sm">{currentMember.emoji} {currentMember.name} · {vocab.length} words</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">📚 My Vocabulary</h1>
          <div className="flex gap-1 bg-white/5 rounded-xl p-1">
            <button onClick={() => setView('list')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === 'list' ? 'bg-white/10 text-white' : 'text-white/40'}`}>
              📋 List
            </button>
            <button onClick={() => { setView('flash'); setFlashIndex(0); setFlipped(false); setLearned(new Set()); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === 'flash' ? 'bg-white/10 text-white' : 'text-white/40'}`}>
              🃏 Flash Cards
            </button>
          </div>
        </div>

        {vocab.length === 0 ? (
          <div className="text-center py-20 text-white/20">
            <div className="text-5xl mb-4">📚</div>
            <p>No vocabulary saved yet.</p>
            <p className="text-xs mt-2">Watch videos and click &ldquo;+ Save&rdquo; on words to build your list!</p>
            <Link href="/german" className="inline-block mt-4 px-6 py-3 rounded-xl bg-white/5 text-white/60 hover:text-white transition-colors">Browse Videos</Link>
          </div>
        ) : view === 'list' ? (
          <div>
            <div className="flex justify-end mb-4">
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as 'recent' | 'alpha')}
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white [&>option]:bg-gray-900">
                <option value="recent">Most Recent</option>
                <option value="alpha">A-Z</option>
              </select>
            </div>
            <div className="space-y-2">
              {sorted.map((entry, i) => (
                <motion.div key={entry.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="glass rounded-xl p-4 flex items-start gap-4 group hover:bg-white/[0.04] transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-lg font-bold">{entry.germanWord}</span>
                      <span className="text-white/20">→</span>
                      <span className="text-white/60">{entry.englishWord}</span>
                    </div>
                    {entry.exampleSentence && (
                      <p className="text-white/25 text-xs italic mt-1">&ldquo;{entry.exampleSentence}&rdquo;</p>
                    )}
                  </div>
                  <span className="text-[10px] text-white/15 flex-shrink-0">
                    {new Date(entry.dateAdded).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  <button onClick={() => handleDelete(entry.id)}
                    className="text-white/10 hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">✕</button>
                </motion.div>
              ))}
            </div>
          </div>
        ) : (
          /* ====== FLASH CARDS ====== */
          <div>
            {/* Progress bar */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-white/30">{learned.size} of {vocab.length} learned this session</span>
                <span className="text-xs text-white/30">{Math.round(progress)}%</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div className="h-full bg-gradient-to-r from-yellow-500 to-green-500 rounded-full"
                  initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.5 }} />
              </div>
            </div>

            {flashCards.length === 0 ? (
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-16">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-2xl font-bold mb-2">All Done!</h2>
                <p className="text-white/40 mb-6">You reviewed all {vocab.length} words!</p>
                <button onClick={() => { setLearned(new Set()); setFlashIndex(0); setFlipped(false); }}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-red-500 text-white font-medium">Start Over</button>
              </motion.div>
            ) : currentCard && (
              <div className="max-w-lg mx-auto">
                <p className="text-center text-white/20 text-sm mb-4">Card {flashIndex + 1} of {flashCards.length}</p>

                {/* Flash card */}
                <div style={{ perspective: '1000px' }}>
                  <AnimatePresence mode="wait">
                    <motion.div key={`${currentCard.id}-${flipped}`}
                      initial={{ rotateY: 90, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }}
                      exit={{ rotateY: -90, opacity: 0 }} transition={{ duration: 0.25 }}
                      onClick={() => setFlipped(!flipped)}
                      className="glass rounded-3xl p-10 min-h-[320px] flex flex-col items-center justify-center cursor-pointer hover:bg-white/[0.04] transition-colors select-none">
                      {!flipped ? (
                        <div className="text-center">
                          <p className="text-xs text-white/20 uppercase tracking-widest mb-6">German</p>
                          <p className="text-5xl font-bold mb-4">{currentCard.germanWord}</p>
                          <p className="text-white/20 text-sm mt-8">Tap to reveal</p>
                        </div>
                      ) : (
                        <div className="text-center w-full">
                          <p className="text-xs text-white/20 uppercase tracking-widest mb-4">English</p>
                          <p className="text-4xl font-bold text-green-400 mb-6">{currentCard.englishWord}</p>
                          <div className="border-t border-white/10 pt-4">
                            <p className="text-xl text-white/70">{currentCard.germanWord}</p>
                          </div>
                          {currentCard.exampleSentence && (
                            <div className="mt-4 p-4 bg-white/5 rounded-xl text-left">
                              <p className="text-xs text-white/20 uppercase tracking-widest mb-2">Example Sentence</p>
                              <p className="text-sm text-white/50 italic">&ldquo;{currentCard.exampleSentence}&rdquo;</p>
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-6 justify-center flex-wrap">
                  <button onClick={() => { setFlashIndex(Math.max(0, flashIndex - 1)); setFlipped(false); }}
                    disabled={flashIndex === 0}
                    className="px-5 py-3 rounded-xl bg-white/5 text-white/40 text-sm disabled:opacity-20">← Prev</button>

                  {flipped ? (
                    <>
                      <button onClick={() => { setFlashIndex((flashIndex + 1) % flashCards.length); setFlipped(false); }}
                        className="px-5 py-3 rounded-xl bg-amber-500/15 text-amber-400 text-sm font-medium border border-amber-500/20">
                        🔄 Study Again
                      </button>
                      <button onClick={() => markLearned(currentCard.id)}
                        className="px-5 py-3 rounded-xl bg-green-500/15 text-green-400 text-sm font-medium border border-green-500/20">
                        ✅ Got It!
                      </button>
                    </>
                  ) : (
                    <button onClick={() => setFlipped(true)}
                      className="px-8 py-3 rounded-xl bg-gradient-to-r from-yellow-500/20 to-red-500/20 text-yellow-400 text-sm font-medium border border-yellow-500/20">
                      Show Answer
                    </button>
                  )}

                  <button onClick={() => { setFlashIndex(Math.min(flashCards.length - 1, flashIndex + 1)); setFlipped(false); }}
                    disabled={flashIndex >= flashCards.length - 1}
                    className="px-5 py-3 rounded-xl bg-white/5 text-white/40 text-sm disabled:opacity-20">Next →</button>
                </div>

                {flipped && (
                  <div className="text-center mt-4">
                    <button onClick={() => { handleDelete(currentCard.id); setFlipped(false); }}
                      className="text-[10px] text-white/15 hover:text-red-400 transition-colors">Remove from vocabulary</button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function VocabPage() {
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-4xl animate-pulse">📚</div></div>}><VocabContent /></Suspense>;
}

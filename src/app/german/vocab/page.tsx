'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useFamilyMember } from '@/components/FamilyContext';
import ThemedBackground from '@/components/ThemedBackground';

interface VocabEntry {
  id: string;
  germanWord: string;
  englishWord: string;
  exampleSentence: string | null;
  dateAdded: string;
  confidence: number;
}

export default function VocabPage() {
  const { currentMember, setShowPicker } = useFamilyMember();
  const [vocab, setVocab] = useState<VocabEntry[]>([]);
  const [flashMode, setFlashMode] = useState(false);
  const [flashIndex, setFlashIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'alpha'>('recent');

  useEffect(() => {
    if (currentMember) {
      fetchVocab(currentMember.name);
    }
  }, [currentMember]);

  const fetchVocab = async (name: string) => {
    const res = await fetch(`/api/german/vocab?user=${encodeURIComponent(name)}`);
    setVocab(await res.json());
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/german/vocab?id=${id}`, { method: 'DELETE' });
    setVocab((prev) => prev.filter((v) => v.id !== id));
  };

  const sorted = [...vocab].sort((a, b) => {
    if (sortBy === 'alpha') return a.germanWord.localeCompare(b.germanWord);
    return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
  });

  const flashCards = vocab.length > 0 ? vocab : [];

  if (!currentMember) {
    return (
      <div className="min-h-screen flex items-center justify-center relative z-10">
        <div className="glass rounded-3xl p-10 max-w-md w-full text-center">
          <div className="text-5xl mb-4">📚</div>
          <h1 className="text-2xl font-bold mb-2">My Vocabulary</h1>
          <p className="text-white/40 text-sm mb-6">Pick your profile to see your saved words</p>
          <button
            onClick={() => setShowPicker(true)}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-red-500 text-white font-medium"
          >
            Choose Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative z-10"><ThemedBackground theme="german" />
      {/* Header */}
      <div className="border-b border-white/5">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/german" className="text-white/40 hover:text-white/80 transition-colors text-sm">
            ← Back to Videos
          </Link>
          <span className="text-white/30 text-sm">{currentMember.emoji} {currentMember.name}</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">📚 My Vocabulary</h1>
            <p className="text-white/40 text-sm mt-1">{vocab.length} words saved</p>
          </div>
          <div className="flex gap-2">
            {vocab.length >= 2 && (
              <button
                onClick={() => { setFlashMode(!flashMode); setFlashIndex(0); setShowAnswer(false); }}
                className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  flashMode
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                    : 'bg-white/5 text-white/50 border border-white/10 hover:text-white'
                }`}
              >
                {flashMode ? '✕ Exit' : '🃏 Flash Cards'}
              </button>
            )}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'recent' | 'alpha')}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none [&>option]:bg-gray-900"
            >
              <option value="recent">Most Recent</option>
              <option value="alpha">A-Z</option>
            </select>
          </div>
        </div>

        {/* Flash card mode */}
        <AnimatePresence>
          {flashMode && flashCards.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mb-12"
            >
              <div
                className="glass rounded-3xl p-12 text-center cursor-pointer min-h-[250px] flex flex-col items-center justify-center"
                onClick={() => setShowAnswer(!showAnswer)}
              >
                <p className="text-white/30 text-xs uppercase tracking-wider mb-4">
                  {flashIndex + 1} / {flashCards.length} · Click to flip
                </p>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={showAnswer ? 'answer' : 'question'}
                    initial={{ rotateY: 90, opacity: 0 }}
                    animate={{ rotateY: 0, opacity: 1 }}
                    exit={{ rotateY: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {!showAnswer ? (
                      <div>
                        <p className="text-4xl font-bold mb-2">{flashCards[flashIndex].germanWord}</p>
                        <p className="text-white/20 text-sm">What does this mean?</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-3xl font-bold text-green-400 mb-2">{flashCards[flashIndex].englishWord}</p>
                        {flashCards[flashIndex].exampleSentence && (
                          <p className="text-white/30 text-sm italic mt-3">
                            &ldquo;{flashCards[flashIndex].exampleSentence}&rdquo;
                          </p>
                        )}
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
              <div className="flex justify-center gap-3 mt-4">
                <button
                  onClick={() => { setFlashIndex(Math.max(0, flashIndex - 1)); setShowAnswer(false); }}
                  disabled={flashIndex === 0}
                  className="px-4 py-2 rounded-xl bg-white/5 text-white/50 disabled:opacity-20"
                >
                  ← Prev
                </button>
                <button
                  onClick={() => {
                    setFlashIndex((flashIndex + 1) % flashCards.length);
                    setShowAnswer(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-white/10 text-white"
                >
                  Next →
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Vocab list */}
        {vocab.length === 0 ? (
          <div className="text-center py-20 text-white/30">
            <div className="text-5xl mb-4">📭</div>
            <p>No vocabulary saved yet.</p>
            <p className="text-sm mt-2">Watch videos and save words to build your list!</p>
            <Link href="/german" className="inline-block mt-4 px-6 py-3 rounded-xl bg-white/5 text-white/60 hover:text-white transition-colors">
              Browse Videos
            </Link>
          </div>
        ) : (
          <div className="glass rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-white/30 border-b border-white/10">
                  <th className="text-left py-3 px-4 font-medium">German</th>
                  <th className="text-left py-3 px-4 font-medium">English</th>
                  <th className="text-left py-3 px-4 font-medium hidden md:table-cell">Example</th>
                  <th className="text-left py-3 px-4 font-medium hidden sm:table-cell">Added</th>
                  <th className="py-3 px-4"></th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((entry) => (
                  <tr key={entry.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 font-bold">{entry.germanWord}</td>
                    <td className="py-3 px-4 text-white/60">{entry.englishWord}</td>
                    <td className="py-3 px-4 text-white/30 text-xs italic hidden md:table-cell">
                      {entry.exampleSentence || '—'}
                    </td>
                    <td className="py-3 px-4 text-white/20 text-xs hidden sm:table-cell">
                      {new Date(entry.dateAdded).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="text-white/20 hover:text-red-400 transition-colors text-xs"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

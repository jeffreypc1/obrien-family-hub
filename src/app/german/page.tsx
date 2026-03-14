'use client';
import ThemedBackground from '@/components/ThemedBackground';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface GermanVideo {
  id: string;
  youtubeId: string;
  title: string;
  channel: string;
  skillLevel: string;
  description: string | null;
  _count: { segments: number };
  vocabItems: Array<{ germanWord: string; englishWord: string }>;
}

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

const LEVEL_INFO: Record<string, { label: string; color: string; description: string }> = {
  A1: { label: 'Beginner', color: '#22C55E', description: 'Greetings, numbers, basic phrases' },
  A2: { label: 'Elementary', color: '#84CC16', description: 'Daily life, simple conversations' },
  B1: { label: 'Intermediate', color: '#EAB308', description: 'Opinions, travel, work topics' },
  B2: { label: 'Upper Intermediate', color: '#F97316', description: 'Complex discussions, news' },
  C1: { label: 'Advanced', color: '#EF4444', description: 'Academic topics, nuanced debate' },
  C2: { label: 'Mastery', color: '#A855F7', description: 'Native-level, literature, culture' },
};

export default function GermanPage() {
  const [videos, setVideos] = useState<GermanVideo[]>([]);
  const [activeLevel, setActiveLevel] = useState('A1');
  const [loading, setLoading] = useState(true);
  const [showAddVideo, setShowAddVideo] = useState(false);
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [addingVideo, setAddingVideo] = useState(false);

  const fetchVideos = () => {
    fetch('/api/german/videos')
      .then((r) => r.json())
      .then((data) => { setVideos(data); setLoading(false); });
  };

  useEffect(() => { fetchVideos(); }, []);

  const handleAddVideo = async () => {
    if (!newVideoUrl.trim()) return;
    setAddingVideo(true);
    const res = await fetch('/api/german/videos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ youtubeUrl: newVideoUrl.trim(), skillLevel: activeLevel }),
    });
    if (res.ok) {
      setNewVideoUrl('');
      setShowAddVideo(false);
      fetchVideos();
    } else {
      const err = await res.json();
      alert(err.error || 'Failed to add video');
    }
    setAddingVideo(false);
  };

  const handleDeleteVideo = async (id: string) => {
    if (!confirm('Remove this video?')) return;
    await fetch(`/api/german/videos?id=${id}`, { method: 'DELETE' });
    setVideos((prev) => prev.filter((v) => v.id !== id));
  };

  const filteredVideos = videos.filter((v) => v.skillLevel === activeLevel);
  const levelInfo = LEVEL_INFO[activeLevel];

  return (
    <div className="min-h-screen relative"><ThemedBackground theme="german" />
      {/* Header */}
      <div className="border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-white/40 hover:text-white/80 transition-colors text-sm">
            ← Back to Hub
          </Link>
          <Link
            href="/german/vocab"
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white/60 hover:text-white hover:bg-white/10 transition-all"
          >
            📚 My Vocabulary
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="text-6xl mb-4">🇩🇪</div>
          <h1 className="text-5xl font-bold gradient-text bg-gradient-to-r from-yellow-400 via-red-400 to-yellow-400 mb-3">
            Learn German
          </h1>
          <p className="text-white/40 text-lg">
            Watch videos, follow transcripts, build your vocabulary
          </p>
        </motion.div>

        {/* Level selector */}
        <div className="flex justify-center gap-2 mb-12 flex-wrap">
          {LEVELS.map((level) => {
            const info = LEVEL_INFO[level];
            const count = videos.filter((v) => v.skillLevel === level).length;
            return (
              <button
                key={level}
                onClick={() => setActiveLevel(level)}
                className={`px-5 py-3 rounded-2xl text-sm font-medium transition-all relative ${
                  activeLevel === level
                    ? 'text-white scale-105'
                    : 'text-white/40 hover:text-white/70 bg-white/5'
                }`}
                style={activeLevel === level ? {
                  background: `${info.color}20`,
                  border: `1px solid ${info.color}40`,
                  boxShadow: `0 0 30px ${info.color}15`,
                } : {}}
              >
                <span className="font-bold">{level}</span>
                <span className="ml-1.5 opacity-60">{info.label}</span>
                {count > 0 && (
                  <span className="ml-2 text-xs opacity-40">({count})</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Level description */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeLevel}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-center mb-10"
          >
            <span
              className="inline-block px-4 py-1.5 rounded-full text-xs font-medium tracking-wider uppercase"
              style={{ background: `${levelInfo.color}15`, color: levelInfo.color }}
            >
              {levelInfo.description}
            </span>
          </motion.div>
        </AnimatePresence>

        {/* Video grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="text-4xl animate-spin">🇩🇪</div>
          </div>
        ) : filteredVideos.length === 0 ? (
          <div className="text-center py-20 text-white/30">
            <div className="text-5xl mb-4">📭</div>
            <p>No videos for {activeLevel} yet.</p>
          </div>
        ) : (
          <motion.div
            key={activeLevel}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredVideos.map((video, i) => (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="relative group/card"
              >
                {/* Delete button */}
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteVideo(video.id); }}
                  className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full bg-black/70 text-white/40 hover:text-red-400 hover:bg-black/90 flex items-center justify-center text-xs opacity-0 group-hover/card:opacity-100 transition-all"
                  title="Remove video"
                >
                  ✕
                </button>

                <Link href={`/german/watch?id=${video.id}`}>
                  <div className="glass rounded-2xl overflow-hidden group cursor-pointer hover:border-white/20 transition-all"
                    style={{ boxShadow: `0 0 40px ${levelInfo.color}08` }}>
                    {/* Thumbnail */}
                    <div className="relative aspect-video bg-black/40 overflow-hidden">
                      <img
                        src={`https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                        <span className="text-4xl opacity-0 group-hover:opacity-100 transition-opacity">▶️</span>
                      </div>
                      <div className="absolute top-2 left-2 px-2.5 py-1 rounded-lg text-xs font-bold"
                        style={{ background: `${levelInfo.color}CC`, color: 'white' }}>
                        {video.skillLevel}
                      </div>
                      {video._count.segments > 0 && (
                        <div className="absolute bottom-2 right-2 px-2 py-1 rounded-lg bg-black/70 text-xs text-white/70">
                          📜 Transcript
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      <h3 className="font-bold text-sm leading-snug mb-1 group-hover:text-white transition-colors line-clamp-2">
                        {video.title}
                      </h3>
                      <p className="text-white/40 text-xs">{video.channel}</p>
                      {video.description && (
                        <p className="text-white/30 text-xs mt-2 line-clamp-2">{video.description}</p>
                      )}
                      {video.vocabItems.length > 0 && (
                        <div className="flex gap-1 mt-3 flex-wrap">
                          {video.vocabItems.slice(0, 4).map((v, j) => (
                            <span key={j} className="px-2 py-0.5 rounded-full bg-white/5 text-[10px] text-white/40">
                              {v.germanWord}
                            </span>
                          ))}
                          {video.vocabItems.length > 4 && (
                            <span className="text-[10px] text-white/20 self-center">+{video.vocabItems.length - 4}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Add your own video */}
        <div className="mt-8">
          {!showAddVideo ? (
            <button
              onClick={() => setShowAddVideo(true)}
              className="w-full py-4 rounded-2xl border-2 border-dashed border-white/10 text-white/30 hover:text-white/60 hover:border-white/25 transition-all text-sm flex items-center justify-center gap-2"
            >
              <span className="text-lg">+</span> Add your own YouTube video to {activeLevel}
            </button>
          ) : (
            <div className="glass rounded-2xl p-5">
              <h3 className="text-sm font-medium text-white/60 mb-3">Add a YouTube video to {activeLevel}</h3>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newVideoUrl}
                  onChange={(e) => setNewVideoUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddVideo()}
                  placeholder="Paste YouTube URL or video ID..."
                  autoFocus
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-yellow-500 text-sm"
                />
                <button
                  onClick={handleAddVideo}
                  disabled={addingVideo || !newVideoUrl.trim()}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-red-500 text-white font-medium text-sm disabled:opacity-30 transition-opacity"
                >
                  {addingVideo ? '...' : 'Add'}
                </button>
                <button
                  onClick={() => { setShowAddVideo(false); setNewVideoUrl(''); }}
                  className="px-4 py-3 rounded-xl bg-white/5 text-white/40 text-sm"
                >
                  Cancel
                </button>
              </div>
              <p className="text-white/20 text-xs mt-2">
                Supports youtube.com links, youtu.be short links, or just the video ID
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

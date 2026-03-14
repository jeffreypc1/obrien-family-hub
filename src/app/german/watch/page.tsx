'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useFamilyMember } from '@/components/FamilyContext';

interface Segment {
  id: string;
  startTime: number;
  endTime: number;
  germanText: string;
  englishText: string;
  sortOrder: number;
}

interface VocabItem {
  id: string;
  germanWord: string;
  englishWord: string;
  partOfSpeech: string | null;
  exampleSentence: string | null;
  exampleTranslation: string | null;
}

interface VideoData {
  id: string;
  youtubeId: string;
  title: string;
  channel: string;
  skillLevel: string;
  segments: Segment[];
  vocabItems: VocabItem[];
}

type TranscriptMode = 'german' | 'english' | 'both';

function WatchPageContent() {
  const searchParams = useSearchParams();
  const videoId = searchParams.get('id');

  const [video, setVideo] = useState<VideoData | null>(null);
  const { currentMember, setShowPicker } = useFamilyMember();
  const [mode, setMode] = useState<TranscriptMode>('both');
  const [showTranscript, setShowTranscript] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [addedWords, setAddedWords] = useState<Set<string>>(new Set());
  const [showVocab, setShowVocab] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [fetchingTranscript, setFetchingTranscript] = useState(false);
  const [fetchError, setFetchError] = useState('');

  const playerRef = useRef<YT.Player | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<number | null>(null);

  // Load video data
  useEffect(() => {
    if (!videoId) return;
    fetch(`/api/german/transcript?videoId=${videoId}`)
      .then((r) => r.json())
      .then((data) => {
        setVideo(data);
        if (data.segments?.length > 0) setShowTranscript(true);
      });
  }, [videoId]);

  // Load YouTube IFrame API and create player
  useEffect(() => {
    if (!video) return;

    const loadAPI = () => {
      return new Promise<void>((resolve) => {
        if (window.YT?.Player) {
          resolve();
          return;
        }
        const existing = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
        if (!existing) {
          const tag = document.createElement('script');
          tag.src = 'https://www.youtube.com/iframe_api';
          document.head.appendChild(tag);
        }
        // Poll for YT to be ready (more reliable than callback)
        const check = setInterval(() => {
          if (window.YT?.Player) {
            clearInterval(check);
            resolve();
          }
        }, 100);
      });
    };

    loadAPI().then(() => {
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch {}
      }
      playerRef.current = new window.YT.Player('yt-player', {
        videoId: video.youtubeId,
        width: '100%',
        height: '100%',
        playerVars: { rel: 0, modestbranding: 1 },
        events: {
          onReady: () => setPlayerReady(true),
        },
      });
    });

    return () => {
      if (pollingRef.current) cancelAnimationFrame(pollingRef.current);
    };
  }, [video]);

  // Continuous time polling using requestAnimationFrame (more reliable than setInterval)
  useEffect(() => {
    if (!playerReady) return;

    const poll = () => {
      try {
        if (playerRef.current?.getCurrentTime) {
          const t = playerRef.current.getCurrentTime();
          setCurrentTime(t);
        }
      } catch {}
      pollingRef.current = requestAnimationFrame(poll);
    };
    pollingRef.current = requestAnimationFrame(poll);

    return () => {
      if (pollingRef.current) cancelAnimationFrame(pollingRef.current);
    };
  }, [playerReady]);

  // Auto-scroll to active line
  const prevActiveId = useRef<string | null>(null);
  const activeSegment = video?.segments.find(
    (s) => currentTime >= s.startTime && currentTime < s.endTime
  );

  useEffect(() => {
    if (activeSegment && activeSegment.id !== prevActiveId.current) {
      prevActiveId.current = activeSegment.id;
      // Scroll after a small delay to let the ref update
      setTimeout(() => {
        if (activeLineRef.current && containerRef.current) {
          activeLineRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
        }
      }, 50);
    }
  }, [activeSegment]);

  const seekTo = useCallback((time: number) => {
    playerRef.current?.seekTo(time, true);
    setCurrentTime(time);
  }, []);

  const fetchTranscript = async () => {
    if (!video) return;
    setFetchingTranscript(true);
    setFetchError('');
    try {
      const res = await fetch('/api/german/fetch-transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId: video.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFetchError(data.error || 'Failed to fetch transcript');
      } else {
        // Reload video data to get new segments
        const updated = await fetch(`/api/german/transcript?videoId=${video.id}`);
        const updatedData = await updated.json();
        setVideo(updatedData);
        setShowTranscript(true);
      }
    } catch (e) {
      setFetchError(e instanceof Error ? e.message : 'Network error');
    }
    setFetchingTranscript(false);
  };

  const addToVocab = async (item: VocabItem) => {
    if (!currentMember) {
      setShowPicker(true);
      return;
    }

    await fetch('/api/german/vocab', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userName: currentMember.name,
        germanWord: item.germanWord,
        englishWord: item.englishWord,
        exampleSentence: item.exampleSentence,
        sourceVideoId: video?.id,
      }),
    });

    setAddedWords((prev) => new Set([...prev, item.germanWord]));
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  if (!video) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-4xl animate-spin">🇩🇪</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative z-10">
      {/* Header */}
      <div className="border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/german" className="text-white/40 hover:text-white/80 transition-colors text-sm">
            ← Back to Videos
          </Link>
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-lg text-xs font-bold"
              style={{ background: '#EAB30830', color: '#EAB308' }}>
              {video.skillLevel}
            </span>
            <span className="text-white/30 text-sm">{video.channel}</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-6">{video.title}</h1>

        {/* YouTube Player */}
        <div className="relative aspect-video rounded-2xl overflow-hidden bg-black mb-4 shadow-2xl ring-1 ring-white/10">
          <div id="yt-player" className="absolute inset-0 w-full h-full" />
        </div>

        {/* Debug: current time indicator */}
        {playerReady && video.segments.length > 0 && (
          <div className="text-xs text-white/20 mb-2 font-mono">
            ▶ {formatTime(currentTime)}
            {activeSegment && <span className="text-yellow-400/50 ml-2">● synced</span>}
          </div>
        )}

        {/* Toggle buttons */}
        <div className="flex flex-wrap gap-3 mb-6">
          {video.segments.length > 0 ? (
            <button
              onClick={() => setShowTranscript(!showTranscript)}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                showTranscript
                  ? 'bg-white/10 text-white border border-white/20'
                  : 'bg-white/5 text-white/50 hover:text-white border border-white/10'
              }`}
            >
              📜 {showTranscript ? 'Hide' : 'Show'} Transcript ({video.segments.length} lines)
            </button>
          ) : (
            <button
              onClick={fetchTranscript}
              disabled={fetchingTranscript}
              className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all bg-gradient-to-r from-yellow-500/20 to-red-500/20 border border-yellow-500/30 text-yellow-400 hover:from-yellow-500/30 hover:to-red-500/30 disabled:opacity-50"
            >
              {fetchingTranscript ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">🔄</span> Fetching transcript + translating...
                </span>
              ) : (
                '📜 Fetch Transcript & Translation'
              )}
            </button>
          )}

          {/* Refetch button when transcript exists */}
          {video.segments.length > 0 && (
            <button
              onClick={fetchTranscript}
              disabled={fetchingTranscript}
              className="px-3 py-2.5 rounded-xl text-xs font-medium text-white/30 hover:text-white/60 bg-white/5 border border-white/10 transition-all disabled:opacity-50"
              title="Re-fetch transcript from YouTube"
            >
              {fetchingTranscript ? '🔄' : '↻ Refetch'}
            </button>
          )}

          {showTranscript && video.segments.length > 0 && (
            <div className="flex gap-1 bg-white/5 rounded-xl p-1">
              {([
                { key: 'german' as const, label: '🇩🇪 Deutsch' },
                { key: 'english' as const, label: '🇺🇸 English' },
                { key: 'both' as const, label: '🇩🇪/🇺🇸 Both' },
              ]).map((m) => (
                <button key={m.key} onClick={() => setMode(m.key)}
                  className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                    mode === m.key ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'
                  }`}>
                  {m.label}
                </button>
              ))}
            </div>
          )}

          {video.vocabItems.length > 0 && (
            <button onClick={() => setShowVocab(!showVocab)}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ml-auto ${
                showVocab
                  ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                  : 'bg-white/5 text-white/50 hover:text-white border border-white/10'
              }`}>
              📚 Vocabulary ({video.vocabItems.length})
            </button>
          )}
        </div>

        {/* Fetch error */}
        {fetchError && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {fetchError}
          </div>
        )}

        {/* Transcript panel — full width */}
        <AnimatePresence>
          {showTranscript && video.segments.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div ref={containerRef}
                className="glass rounded-2xl max-h-[600px] overflow-y-auto divide-y divide-white/5 scroll-smooth mb-6">
                {video.segments.map((seg) => {
                  const isActive = activeSegment?.id === seg.id;
                  return (
                    <div key={seg.id}
                      ref={isActive ? activeLineRef : undefined}
                      onClick={() => seekTo(seg.startTime)}
                      className={`flex gap-5 px-6 py-5 cursor-pointer transition-all duration-300 ${
                        isActive
                          ? 'bg-yellow-400/15 border-l-4 border-yellow-400'
                          : 'hover:bg-white/5 border-l-4 border-transparent'
                      }`}>
                      <span className={`text-sm font-mono flex-shrink-0 pt-1 ${
                        isActive ? 'text-yellow-400 font-bold' : 'text-white/25'
                      }`}>
                        {formatTime(seg.startTime)}
                      </span>
                      <div className="flex-1 space-y-2">
                        {(mode === 'german' || mode === 'both') && (
                          <p className={`text-lg md:text-xl leading-relaxed transition-colors duration-300 ${
                            isActive ? 'text-white font-semibold' : 'text-white/70'
                          }`}>
                            {seg.germanText}
                          </p>
                        )}
                        {(mode === 'english' || mode === 'both') && (
                          <p className={`text-base md:text-lg leading-relaxed transition-colors duration-300 ${
                            mode === 'both' ? (isActive ? 'text-white/60 italic' : 'text-white/35 italic')
                              : isActive ? 'text-white font-medium' : 'text-white/60'
                          }`}>
                            {seg.englishText}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Vocabulary panel */}
        <AnimatePresence>
          {showVocab && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="glass rounded-2xl p-6 max-h-[600px] overflow-y-auto">
                <h3 className="text-sm font-medium text-white/40 uppercase tracking-wider mb-5">
                  Key Vocabulary — {video.vocabItems.length} words
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {video.vocabItems.map((item) => {
                    const isAdded = addedWords.has(item.germanWord);
                    return (
                      <div key={item.id} className="flex items-start gap-3 bg-white/[0.02] rounded-xl p-4 hover:bg-white/[0.05] transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-base">{item.germanWord}</span>
                            {item.partOfSpeech && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/25">{item.partOfSpeech}</span>
                            )}
                          </div>
                          <p className="text-white/60 text-sm">{item.englishWord}</p>
                          {item.exampleSentence && (
                            <div className="mt-2 pl-3 border-l-2 border-white/10">
                              <p className="text-white/40 text-xs">{item.exampleSentence}</p>
                              {item.exampleTranslation && (
                                <p className="text-white/25 text-xs italic mt-0.5">{item.exampleTranslation}</p>
                              )}
                            </div>
                          )}
                        </div>
                        <button onClick={() => addToVocab(item)} disabled={isAdded}
                          className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                            isAdded ? 'bg-green-500/10 text-green-400' : 'bg-white/5 text-white/40 hover:text-white hover:bg-white/10'
                          }`}>
                          {isAdded ? '✓ Saved' : '+ Save'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function WatchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-4xl animate-spin">🇩🇪</div>
      </div>
    }>
      <WatchPageContent />
    </Suspense>
  );
}

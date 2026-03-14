'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

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
  const [mode, setMode] = useState<TranscriptMode>('both');
  const [showTranscript, setShowTranscript] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [userName, setUserName] = useState('');
  const [addedWords, setAddedWords] = useState<Set<string>>(new Set());
  const [showVocab, setShowVocab] = useState(false);

  const playerRef = useRef<YT.Player | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);

  // Load video data
  useEffect(() => {
    if (!videoId) return;
    fetch(`/api/german/transcript?videoId=${videoId}`)
      .then((r) => r.json())
      .then(setVideo);
  }, [videoId]);

  // Load YouTube IFrame API
  useEffect(() => {
    if (!video) return;

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const existing = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
    if (!existing) document.head.appendChild(tag);

    const initPlayer = () => {
      if (playerRef.current) playerRef.current.destroy();
      playerRef.current = new window.YT.Player('yt-player', {
        videoId: video.youtubeId,
        playerVars: { rel: 0, modestbranding: 1 },
        events: {
          onStateChange: (e: YT.OnStateChangeEvent) => {
            setIsPlaying(e.data === window.YT.PlayerState.PLAYING);
          },
        },
      });
    };

    if (window.YT?.Player) {
      initPlayer();
    } else {
      (window as unknown as Record<string, () => void>).onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      if (timeIntervalRef.current) clearInterval(timeIntervalRef.current);
    };
  }, [video]);

  // Poll current time when playing
  useEffect(() => {
    if (isPlaying) {
      timeIntervalRef.current = setInterval(() => {
        if (playerRef.current?.getCurrentTime) {
          setCurrentTime(playerRef.current.getCurrentTime());
        }
      }, 250);
    } else {
      if (timeIntervalRef.current) clearInterval(timeIntervalRef.current);
    }
    return () => {
      if (timeIntervalRef.current) clearInterval(timeIntervalRef.current);
    };
  }, [isPlaying]);

  // Auto-scroll to active line
  useEffect(() => {
    if (activeLineRef.current && containerRef.current) {
      const container = containerRef.current;
      const line = activeLineRef.current;
      const lineTop = line.offsetTop - container.offsetTop;
      const containerScroll = container.scrollTop;
      const containerHeight = container.clientHeight;

      if (lineTop < containerScroll || lineTop > containerScroll + containerHeight - 80) {
        container.scrollTo({ top: lineTop - containerHeight / 3, behavior: 'smooth' });
      }
    }
  }, [currentTime]);

  const seekTo = useCallback((time: number) => {
    playerRef.current?.seekTo(time, true);
    setCurrentTime(time);
  }, []);

  const activeSegment = video?.segments.find(
    (s) => currentTime >= s.startTime && currentTime < s.endTime
  );

  const addToVocab = async (item: VocabItem) => {
    if (!userName) {
      const name = prompt('Enter your name to save vocabulary:');
      if (!name) return;
      setUserName(name);
    }

    const currentName = userName || (document.querySelector<HTMLInputElement>('#vocab-name-input')?.value ?? '');
    await fetch('/api/german/vocab', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userName: currentName || userName,
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
            <span
              className="px-2.5 py-1 rounded-lg text-xs font-bold"
              style={{ background: '#EAB30830', color: '#EAB308' }}
            >
              {video.skillLevel}
            </span>
            <span className="text-white/30 text-sm">{video.channel}</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Video title */}
        <h1 className="text-2xl font-fredoka font-bold mb-6">{video.title}</h1>

        {/* YouTube Player */}
        <div className="relative aspect-video rounded-2xl overflow-hidden bg-black mb-4 shadow-2xl ring-1 ring-white/10">
          <div id="yt-player" className="absolute inset-0 w-full h-full" />
        </div>

        {/* Transcript toggle buttons */}
        {video.segments.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-6">
            <button
              onClick={() => { setShowTranscript(!showTranscript); }}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                showTranscript
                  ? 'bg-white/10 text-white border border-white/20'
                  : 'bg-white/5 text-white/50 hover:text-white border border-white/10'
              }`}
            >
              📜 {showTranscript ? 'Hide' : 'Show'} Transcript
            </button>

            {showTranscript && (
              <div className="flex gap-1 bg-white/5 rounded-xl p-1">
                {([
                  { key: 'german' as const, label: '🇩🇪 Deutsch' },
                  { key: 'english' as const, label: '🇺🇸 English' },
                  { key: 'both' as const, label: '🇩🇪/🇺🇸 Both' },
                ]).map((m) => (
                  <button
                    key={m.key}
                    onClick={() => setMode(m.key)}
                    className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                      mode === m.key ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            )}

            {video.vocabItems.length > 0 && (
              <button
                onClick={() => setShowVocab(!showVocab)}
                className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ml-auto ${
                  showVocab
                    ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                    : 'bg-white/5 text-white/50 hover:text-white border border-white/10'
                }`}
              >
                📚 Vocabulary ({video.vocabItems.length})
              </button>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Transcript panel */}
          <AnimatePresence>
            {showTranscript && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="lg:col-span-2"
              >
                <div
                  ref={containerRef}
                  className="glass rounded-2xl max-h-[500px] overflow-y-auto divide-y divide-white/5 scroll-smooth"
                >
                  {video.segments.map((seg) => {
                    const isActive = activeSegment?.id === seg.id;
                    return (
                      <div
                        key={seg.id}
                        ref={isActive ? activeLineRef : undefined}
                        onClick={() => seekTo(seg.startTime)}
                        className={`flex gap-4 p-4 cursor-pointer transition-all ${
                          isActive
                            ? 'bg-white/10 border-l-2 border-yellow-400'
                            : 'hover:bg-white/5 border-l-2 border-transparent'
                        }`}
                      >
                        {/* Timestamp */}
                        <span className={`text-xs font-mono flex-shrink-0 pt-0.5 ${
                          isActive ? 'text-yellow-400' : 'text-white/20'
                        }`}>
                          {formatTime(seg.startTime)}
                        </span>

                        {/* Text */}
                        <div className="flex-1 space-y-1">
                          {(mode === 'german' || mode === 'both') && (
                            <p className={`text-sm leading-relaxed ${
                              isActive ? 'text-white font-medium' : 'text-white/70'
                            }`}>
                              {seg.germanText}
                            </p>
                          )}
                          {(mode === 'english' || mode === 'both') && (
                            <p className={`text-sm leading-relaxed ${
                              mode === 'both' ? 'text-white/40 italic' : isActive ? 'text-white' : 'text-white/70'
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
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={showTranscript ? 'lg:col-span-1' : 'lg:col-span-3'}
              >
                <div className="glass rounded-2xl p-5 max-h-[500px] overflow-y-auto">
                  <h3 className="text-sm font-medium text-white/40 uppercase tracking-wider mb-4">
                    Key Vocabulary
                  </h3>
                  <div className="space-y-3">
                    {video.vocabItems.map((item) => {
                      const isAdded = addedWords.has(item.germanWord);
                      return (
                        <div key={item.id} className="flex items-start gap-3 group">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm">{item.germanWord}</span>
                              {item.partOfSpeech && (
                                <span className="text-[10px] text-white/20 italic">{item.partOfSpeech}</span>
                              )}
                            </div>
                            <p className="text-white/50 text-xs">{item.englishWord}</p>
                            {item.exampleSentence && (
                              <p className="text-white/30 text-[11px] mt-1 italic">
                                &ldquo;{item.exampleSentence}&rdquo;
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => addToVocab(item)}
                            disabled={isAdded}
                            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                              isAdded
                                ? 'bg-green-500/10 text-green-400'
                                : 'bg-white/5 text-white/40 hover:text-white hover:bg-white/10'
                            }`}
                          >
                            {isAdded ? '✓ Added' : '+ Save'}
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

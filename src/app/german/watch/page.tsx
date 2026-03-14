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
  const [showTranscript, setShowTranscript] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
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

        {/* Transcript + Vocab toggle buttons */}
        <div className="flex flex-wrap gap-3 mb-6">
          {video.segments.length > 0 && (
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
          )}

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

        {/* Transcript panel — full width, larger text */}
        <AnimatePresence>
          {showTranscript && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div
                ref={containerRef}
                className="glass rounded-2xl max-h-[600px] overflow-y-auto divide-y divide-white/5 scroll-smooth"
              >
                {video.segments.map((seg) => {
                  const isActive = activeSegment?.id === seg.id;
                  return (
                    <div
                      key={seg.id}
                      ref={isActive ? activeLineRef : undefined}
                      onClick={() => seekTo(seg.startTime)}
                      className={`flex gap-5 px-6 py-5 cursor-pointer transition-all ${
                        isActive
                          ? 'bg-yellow-400/10 border-l-4 border-yellow-400'
                          : 'hover:bg-white/5 border-l-4 border-transparent'
                      }`}
                    >
                      {/* Timestamp */}
                      <span className={`text-sm font-mono flex-shrink-0 pt-1 ${
                        isActive ? 'text-yellow-400 font-bold' : 'text-white/25'
                      }`}>
                        {formatTime(seg.startTime)}
                      </span>

                      {/* Text — large and readable */}
                      <div className="flex-1 space-y-2">
                        {(mode === 'german' || mode === 'both') && (
                          <p className={`text-lg md:text-xl leading-relaxed ${
                            isActive ? 'text-white font-semibold' : 'text-white/80'
                          }`}>
                            {seg.germanText}
                          </p>
                        )}
                        {(mode === 'english' || mode === 'both') && (
                          <p className={`text-base md:text-lg leading-relaxed ${
                            mode === 'both' ? 'text-white/40 italic' : isActive ? 'text-white font-medium' : 'text-white/70'
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

        {/* Vocabulary panel — full width, grid layout */}
        <AnimatePresence>
          {showVocab && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-6"
            >
              <div className="glass rounded-2xl p-6 max-h-[600px] overflow-y-auto">
                <h3 className="text-sm font-medium text-white/40 uppercase tracking-wider mb-5">
                  Key Vocabulary — {video.vocabItems.length} words
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {video.vocabItems.map((item) => {
                    const isAdded = addedWords.has(item.germanWord);
                    return (
                      <div key={item.id} className="flex items-start gap-3 bg-white/[0.02] rounded-xl p-4 group hover:bg-white/[0.05] transition-colors">
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
                              <p className="text-white/40 text-xs leading-relaxed">
                                {item.exampleSentence}
                              </p>
                              {item.exampleTranslation && (
                                <p className="text-white/25 text-xs italic mt-0.5">
                                  {item.exampleTranslation}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => addToVocab(item)}
                          disabled={isAdded}
                          className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                            isAdded
                              ? 'bg-green-500/10 text-green-400'
                              : 'bg-white/5 text-white/40 hover:text-white hover:bg-white/10'
                          }`}
                        >
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

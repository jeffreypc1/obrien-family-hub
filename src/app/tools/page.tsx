'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import ThemedBackground from '@/components/ThemedBackground';

// ─── YouTube to Podcast Tool ───────────────────────────────

interface ProcessResult {
  success: boolean;
  title: string;
  summary: string;
  transcript: string;
  filename: string;
  error?: string;
}

const STEPS = [
  { key: 'info', label: 'Fetching video info', icon: '🔍' },
  { key: 'transcript', label: 'Extracting transcript', icon: '📝' },
  { key: 'summary', label: 'Generating AI summary', icon: '🤖' },
  { key: 'tts', label: 'Converting to speech', icon: '🗣️' },
  { key: 'download', label: 'Downloading original audio', icon: '⬇️' },
  { key: 'stitch', label: 'Stitching audio files', icon: '🎵' },
  { key: 'publish', label: 'Publishing to podcast feed', icon: '📡' },
];

function YouTubeToPodcast() {
  const [url, setUrl] = useState('');
  const [summarySeconds, setSummarySeconds] = useState(60);
  const [processing, setProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);

  const process = async () => {
    if (!url.trim()) return;
    setProcessing(true);
    setResult(null);
    setError(null);
    setCurrentStep(0);

    // Simulate step progress (the API does it all in one call)
    const stepInterval = setInterval(() => {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
    }, 8000); // ~8 seconds per step estimate

    try {
      const res = await fetch('/api/tools/youtube-to-podcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), summarySeconds }),
      });

      clearInterval(stepInterval);
      setCurrentStep(STEPS.length);

      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || 'Something went wrong');
      } else {
        setResult(data);
      }
    } catch (e) {
      clearInterval(stepInterval);
      setError(e instanceof Error ? e.message : 'Network error');
    }

    setProcessing(false);
  };

  return (
    <div>
      {/* Input area */}
      <div className="glass rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">🎙️</span>
          <div>
            <h2 className="text-xl font-bold">YouTube to Podcast</h2>
            <p className="text-white/30 text-sm">Paste a URL, get an AI-briefed podcast episode</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-white/30 font-semibold block mb-1.5">YOUTUBE URL</label>
            <input
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              disabled={processing}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-base placeholder-white/20 focus:outline-none focus:border-purple-500/30 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="text-xs text-white/30 font-semibold block mb-1.5">AI SUMMARY LENGTH</label>
            <div className="flex items-center gap-3">
              <div className="flex gap-2">
                {[30, 60, 90, 120, 180].map(s => (
                  <button key={s}
                    onClick={() => setSummarySeconds(s)}
                    disabled={processing}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      summarySeconds === s
                        ? 'bg-purple-500/20 text-purple-400 ring-1 ring-purple-500/30'
                        : 'bg-white/5 text-white/40 hover:text-white/60'
                    }`}>
                    {s < 60 ? `${s}s` : `${s / 60}m`}
                  </button>
                ))}
              </div>
              <span className="text-white/20 text-sm">
                ~{Math.round(summarySeconds * 2.5)} words
              </span>
            </div>
          </div>

          <button
            onClick={process}
            disabled={processing || !url.trim()}
            className="w-full py-4 rounded-xl font-bold text-lg transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-30"
            style={{
              background: 'linear-gradient(135deg, rgba(168,85,247,0.3), rgba(236,72,153,0.3))',
              color: '#C084FC',
              border: '1px solid rgba(168,85,247,0.3)',
            }}>
            {processing ? '🔄 Processing...' : '🎙️ Create Podcast Episode'}
          </button>
        </div>
      </div>

      {/* Processing steps */}
      <AnimatePresence>
        {processing && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="glass rounded-2xl p-6 mb-6">
            <h3 className="text-sm font-semibold text-white/40 mb-4">PROCESSING</h3>
            <div className="space-y-3">
              {STEPS.map((step, i) => {
                const isActive = i === currentStep;
                const isDone = i < currentStep;
                return (
                  <div key={step.key} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                      isDone ? 'bg-green-500/15 text-green-400' :
                      isActive ? 'bg-purple-500/15 text-purple-400' :
                      'bg-white/5 text-white/15'
                    }`}>
                      {isDone ? '✓' : isActive ? (
                        <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                          ⏳
                        </motion.span>
                      ) : step.icon}
                    </div>
                    <span className={`text-sm ${
                      isDone ? 'text-green-400/70' :
                      isActive ? 'text-white font-medium' :
                      'text-white/20'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="text-white/15 text-xs mt-4">This takes 1-2 minutes. Don&apos;t close the page.</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="rounded-2xl bg-red-500/10 border border-red-500/20 p-5 mb-6">
          <p className="text-red-400 font-semibold mb-1">❌ Error</p>
          <p className="text-red-400/70 text-sm">{error}</p>
          <button onClick={() => setError(null)}
            className="mt-3 text-xs text-red-400/40 hover:text-red-400/60">Dismiss</button>
        </motion.div>
      )}

      {/* Result */}
      {result && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="glass rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-4xl">🎉</span>
              <div>
                <h3 className="text-xl font-bold text-green-400">Published!</h3>
                <p className="text-white/40 text-sm">{result.title}</p>
              </div>
            </div>

            <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-4 mb-4">
              <p className="text-green-400/70 text-sm">
                ✅ Episode is now in your podcast feed. Open Apple Podcasts and pull down to refresh.
              </p>
              <p className="text-white/20 text-xs mt-1">File: {result.filename}</p>
            </div>

            {/* Summary preview */}
            <div className="mb-4">
              <h4 className="text-xs text-white/30 font-semibold mb-2">AI SUMMARY</h4>
              <p className="text-white/50 text-sm leading-relaxed whitespace-pre-wrap">{result.summary}</p>
            </div>

            {/* Transcript toggle */}
            <button onClick={() => setShowTranscript(!showTranscript)}
              className="text-xs text-white/20 hover:text-white/40 transition-colors">
              {showTranscript ? '▾ Hide transcript' : '▸ Show transcript preview'}
            </button>
            {showTranscript && (
              <div className="mt-3 p-4 bg-white/[0.02] rounded-xl max-h-60 overflow-y-auto">
                <p className="text-white/25 text-xs leading-relaxed">{result.transcript}</p>
              </div>
            )}
          </div>

          <button onClick={() => { setResult(null); setUrl(''); }}
            className="w-full py-3 rounded-xl bg-white/5 text-white/40 hover:text-white/60 transition-all text-sm font-medium">
            + Create Another Episode
          </button>
        </motion.div>
      )}
    </div>
  );
}

// ─── Main Tools Page ───────────────────────────────────────

const TOOLS = [
  { id: 'youtube-podcast', name: 'YouTube to Podcast', icon: '🎙️', description: 'Convert any YouTube video into an AI-briefed podcast episode' },
];

export default function ToolsPage() {
  const [activeTool, setActiveTool] = useState<string | null>('youtube-podcast');

  return (
    <div className="min-h-screen relative">
      <ThemedBackground theme="events" />

      {/* Header */}
      <div className="border-b border-white/5 sticky top-0 z-40 backdrop-blur-xl bg-[#050510]/80">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/" className="text-white/40 hover:text-white/80 transition-colors text-sm">← Home</Link>
          <div className="flex items-center gap-2">
            <span className="text-xl">🛠️</span>
            <h1 className="text-sm font-bold">Custom Apps</h1>
          </div>
          <div className="w-16" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Tool selector */}
        <div className="flex gap-2 mb-8 overflow-x-auto">
          {TOOLS.map(tool => (
            <button key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all flex-shrink-0 ${
                activeTool === tool.id
                  ? 'bg-purple-500/15 text-purple-400 ring-1 ring-purple-500/30'
                  : 'bg-white/5 text-white/40 hover:text-white/60'
              }`}>
              <span className="text-lg">{tool.icon}</span>
              <span className="text-sm">{tool.name}</span>
            </button>
          ))}
          <div className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/[0.02] border border-dashed border-white/10 text-white/15 text-sm flex-shrink-0">
            + More coming soon
          </div>
        </div>

        {/* Active tool */}
        {activeTool === 'youtube-podcast' && <YouTubeToPodcast />}
      </div>
    </div>
  );
}

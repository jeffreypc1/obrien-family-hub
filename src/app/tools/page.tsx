'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import ThemedBackground from '@/components/ThemedBackground';

// ─── Types ─────────────────────────────────────────────────

interface ProcessResult {
  success: boolean;
  title: string;
  channel: string;
  summary: string;
  transcript: string;
  filename: string;
  thumbnailUrl: string;
}

interface Episode {
  id: string;
  title: string;
  videoId: string;
  videoUrl: string;
  channel: string;
  summary: string;
  transcript: string;
  filename: string;
  thumbnailUrl: string | null;
  durationSec: number | null;
  createdAt: string;
}

// ─── Summary Document Pop-out ──────────────────────────────

function SummaryDoc({ episode, onClose }: { episode: Episode; onClose: () => void }) {
  const date = new Date(episode.createdAt).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const printSummary = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>${episode.title}</title>
      <style>
        body { font-family: Georgia, serif; max-width: 700px; margin: 40px auto; padding: 20px; color: #222; line-height: 1.7; }
        h1 { font-size: 22px; margin-bottom: 4px; }
        .meta { color: #888; font-size: 13px; margin-bottom: 24px; }
        .summary { font-size: 16px; white-space: pre-wrap; }
        .transcript { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 13px; color: #666; }
        .transcript h2 { font-size: 16px; color: #444; }
        @media print { body { margin: 20px; } }
      </style></head><body>
      <h1>${episode.title}</h1>
      <div class="meta">${episode.channel} &middot; ${date} &middot; <a href="${episode.videoUrl}" target="_blank">Watch on YouTube</a></div>
      <div class="summary">${episode.summary}</div>
      <div class="transcript"><h2>Full Transcript</h2><p>${episode.transcript}</p></div>
      </body></html>`);
    w.document.close();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <motion.div initial={{ scale: 0.93, y: 30 }} animate={{ scale: 1, y: 0 }}
        onClick={e => e.stopPropagation()}
        className="relative glass rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              {episode.thumbnailUrl && (
                <img src={episode.thumbnailUrl} alt="" className="w-20 h-14 object-cover rounded-lg flex-shrink-0" />
              )}
              <div>
                <h2 className="text-lg font-bold leading-tight">{episode.title}</h2>
                <p className="text-white/30 text-sm mt-1">{episode.channel} &middot; {date}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/30 hover:text-white/60 text-xl flex-shrink-0">✕</button>
          </div>
          <div className="flex gap-2 mt-4">
            <a href={episode.videoUrl} target="_blank" rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-red-500/10 text-red-400 text-xs font-medium border border-red-500/20 hover:bg-red-500/20 transition-all">
              ▶️ Watch on YouTube
            </a>
            <button onClick={printSummary}
              className="px-4 py-2 rounded-xl bg-white/5 text-white/40 text-xs font-medium border border-white/10 hover:bg-white/10 transition-all">
              🖨️ Print / Save as PDF
            </button>
            <button onClick={() => navigator.clipboard.writeText(episode.summary)}
              className="px-4 py-2 rounded-xl bg-white/5 text-white/40 text-xs font-medium border border-white/10 hover:bg-white/10 transition-all">
              📋 Copy Summary
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <h3 className="text-xs text-white/30 font-semibold uppercase tracking-widest mb-3">AI Summary</h3>
          <p className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap mb-8">{episode.summary}</p>

          <h3 className="text-xs text-white/30 font-semibold uppercase tracking-widest mb-3">Full Transcript</h3>
          <p className="text-white/30 text-xs leading-relaxed whitespace-pre-wrap">{episode.transcript}</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Library Tab ───────────────────────────────────────────

function LibraryTab() {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);

  useEffect(() => {
    fetch('/api/tools/youtube-to-podcast/episodes')
      .then(r => r.ok ? r.json() : [])
      .then(data => { setEpisodes(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-center py-20 text-white/20"><span className="text-4xl animate-pulse">📚</span></div>;
  }

  if (episodes.length === 0) {
    return (
      <div className="text-center py-20">
        <span className="text-5xl mb-4 block">📚</span>
        <p className="text-white/30">No episodes yet. Create your first one!</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {episodes.map(ep => {
          const date = new Date(ep.createdAt).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
          });
          return (
            <motion.div key={ep.id}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              onClick={() => setSelectedEpisode(ep)}
              className="glass rounded-2xl p-4 cursor-pointer hover:bg-white/[0.06] active:scale-[0.99] transition-all group">
              <div className="flex items-start gap-4">
                {ep.thumbnailUrl && (
                  <img src={ep.thumbnailUrl} alt=""
                    className="w-24 h-16 object-cover rounded-xl flex-shrink-0 group-hover:ring-1 ring-white/20 transition-all" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm leading-tight mb-1">{ep.title}</p>
                  <p className="text-white/30 text-xs mb-2">{ep.channel} &middot; {date}</p>
                  <p className="text-white/25 text-xs line-clamp-2">{ep.summary}</p>
                </div>
                <span className="text-white/15 text-xs flex-shrink-0 group-hover:text-white/30 transition-colors">
                  View →
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {selectedEpisode && (
          <SummaryDoc episode={selectedEpisode} onClose={() => setSelectedEpisode(null)} />
        )}
      </AnimatePresence>
    </>
  );
}

// ─── YouTube to Podcast Tool ───────────────────────────────

const STEPS = [
  { key: 'info', label: 'Fetching video info & channel', icon: '🔍' },
  { key: 'transcript', label: 'Extracting transcript', icon: '📝' },
  { key: 'summary', label: 'Generating AI summary', icon: '🤖' },
  { key: 'tts', label: 'Converting summary to speech', icon: '🗣️' },
  { key: 'download', label: 'Downloading original audio', icon: '⬇️' },
  { key: 'stitch', label: 'Stitching AI intro + original audio', icon: '🎵' },
  { key: 'publish', label: 'Publishing to podcast feed', icon: '📡' },
];

function YouTubeToPodcast({ onEpisodeCreated }: { onEpisodeCreated: () => void }) {
  const [url, setUrl] = useState('');
  const [summarySeconds, setSummarySeconds] = useState(60);
  const [emailTo, setEmailTo] = useState('');
  const [processing, setProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const process = async () => {
    if (!url.trim()) return;
    setProcessing(true);
    setResult(null);
    setError(null);
    setEmailSent(false);
    setCurrentStep(0);

    const stepInterval = setInterval(() => {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
    }, 8000);

    try {
      const res = await fetch('/api/tools/youtube-to-podcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), summarySeconds, emailTo: emailTo.trim() || null }),
      });

      clearInterval(stepInterval);
      setCurrentStep(STEPS.length);

      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || 'Something went wrong');
      } else {
        setResult(data);
        onEpisodeCreated();
      }
    } catch (e) {
      clearInterval(stepInterval);
      setError(e instanceof Error ? e.message : 'Network error');
    }

    setProcessing(false);
  };

  const sendEmail = () => {
    if (!result || !emailTo.trim()) return;
    const recipients = emailTo.split(',').map(e => e.trim()).filter(Boolean);
    const subject = encodeURIComponent(result.title);
    const body = encodeURIComponent(
      `${result.title}\nBy: ${result.channel}\n\n--- AI Summary ---\n\n${result.summary}\n\n--- Original Video ---\nhttps://www.youtube.com/watch?v=${url.match(/(?:v=|\/|youtu\.be\/)([0-9A-Za-z_-]{11})/)?.[1] || ''}\n\n---\nGenerated by O'Brien Family Hub`
    );
    window.open(`mailto:${recipients.join(',')}?subject=${subject}&body=${body}`, '_blank');
    setEmailSent(true);
  };

  return (
    <div>
      {/* Input area */}
      <div className="glass rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-5">
          <span className="text-3xl">🎙️</span>
          <div>
            <h2 className="text-xl font-bold">YouTube to Podcast</h2>
            <p className="text-white/30 text-sm">Paste a URL, get an AI-briefed podcast episode with summary</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-white/30 font-semibold block mb-1.5">YOUTUBE URL</label>
            <input value={url} onChange={e => setUrl(e.target.value)} disabled={processing}
              placeholder="https://youtube.com/watch?v=..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-base placeholder-white/20 focus:outline-none focus:border-purple-500/30 disabled:opacity-50" />
          </div>

          <div>
            <label className="text-xs text-white/30 font-semibold block mb-1.5">AI SUMMARY LENGTH</label>
            <div className="flex items-center gap-3">
              <div className="flex gap-2">
                {[30, 60, 90, 120, 180].map(s => (
                  <button key={s} onClick={() => setSummarySeconds(s)} disabled={processing}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      summarySeconds === s ? 'bg-purple-500/20 text-purple-400 ring-1 ring-purple-500/30' : 'bg-white/5 text-white/40 hover:text-white/60'
                    }`}>
                    {s < 60 ? `${s}s` : `${s / 60}m`}
                  </button>
                ))}
              </div>
              <span className="text-white/20 text-sm">~{Math.round(summarySeconds * 2.5)} words</span>
            </div>
          </div>

          <div>
            <label className="text-xs text-white/30 font-semibold block mb-1.5">EMAIL SUMMARY TO (optional)</label>
            <input value={emailTo} onChange={e => setEmailTo(e.target.value)} disabled={processing}
              placeholder="email@example.com, another@example.com"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-purple-500/30 disabled:opacity-50" />
            <p className="text-white/15 text-xs mt-1">Separate multiple emails with commas</p>
          </div>

          <button onClick={process} disabled={processing || !url.trim()}
            className="w-full py-4 rounded-xl font-bold text-lg transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-30"
            style={{
              background: 'linear-gradient(135deg, rgba(168,85,247,0.3), rgba(236,72,153,0.3))',
              color: '#C084FC', border: '1px solid rgba(168,85,247,0.3)',
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
                      isDone ? 'bg-green-500/15 text-green-400' : isActive ? 'bg-purple-500/15 text-purple-400' : 'bg-white/5 text-white/15'
                    }`}>
                      {isDone ? '✓' : isActive ? (
                        <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>⏳</motion.span>
                      ) : step.icon}
                    </div>
                    <span className={`text-sm ${isDone ? 'text-green-400/70' : isActive ? 'text-white font-medium' : 'text-white/20'}`}>
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
          <p className="text-red-400 font-semibold mb-1">Error</p>
          <p className="text-red-400/70 text-sm">{error}</p>
          <button onClick={() => setError(null)} className="mt-3 text-xs text-red-400/40 hover:text-red-400/60">Dismiss</button>
        </motion.div>
      )}

      {/* Result */}
      {result && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="glass rounded-2xl p-6 mb-6">
            <div className="flex items-start gap-4 mb-4">
              {result.thumbnailUrl && (
                <img src={result.thumbnailUrl} alt="" className="w-28 h-20 object-cover rounded-xl flex-shrink-0" />
              )}
              <div>
                <h3 className="text-xl font-bold text-green-400">Published!</h3>
                <p className="text-white/50 text-sm">{result.title}</p>
                <p className="text-white/25 text-xs mt-0.5">by {result.channel}</p>
              </div>
            </div>

            <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-4 mb-5">
              <p className="text-green-400/70 text-sm">
                Episode is live in your podcast feed. Open Apple Podcasts and pull down to refresh.
              </p>
            </div>

            {/* Email button */}
            {emailTo.trim() && (
              <div className="mb-5">
                <button onClick={sendEmail}
                  className={`w-full py-3 rounded-xl font-medium text-sm transition-all ${
                    emailSent
                      ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                      : 'bg-blue-500/15 text-blue-400 border border-blue-500/20 hover:bg-blue-500/25'
                  }`}>
                  {emailSent ? '✅ Email opened!' : `📧 Email summary to ${emailTo}`}
                </button>
              </div>
            )}

            {/* Summary preview */}
            <div className="mb-4">
              <h4 className="text-xs text-white/30 font-semibold mb-2">AI SUMMARY</h4>
              <p className="text-white/50 text-sm leading-relaxed whitespace-pre-wrap">{result.summary}</p>
            </div>

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

          <button onClick={() => { setResult(null); setUrl(''); setEmailSent(false); }}
            className="w-full py-3 rounded-xl bg-white/5 text-white/40 hover:text-white/60 transition-all text-sm font-medium">
            + Create Another Episode
          </button>
        </motion.div>
      )}
    </div>
  );
}

// ─── Main Tools Page ───────────────────────────────────────

export default function ToolsPage() {
  const [activeTab, setActiveTab] = useState<'create' | 'library'>('create');
  const [libraryKey, setLibraryKey] = useState(0);

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
        {/* Tab bar */}
        <div className="flex gap-2 mb-8">
          <button onClick={() => setActiveTab('create')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all ${
              activeTab === 'create' ? 'bg-purple-500/15 text-purple-400 ring-1 ring-purple-500/30' : 'bg-white/5 text-white/40 hover:text-white/60'
            }`}>
            <span className="text-lg">🎙️</span>
            <span className="text-sm">Create Episode</span>
          </button>
          <button onClick={() => setActiveTab('library')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all ${
              activeTab === 'library' ? 'bg-cyan-500/15 text-cyan-400 ring-1 ring-cyan-500/30' : 'bg-white/5 text-white/40 hover:text-white/60'
            }`}>
            <span className="text-lg">📚</span>
            <span className="text-sm">Library</span>
          </button>
          <div className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/[0.02] border border-dashed border-white/10 text-white/15 text-sm flex-shrink-0">
            + More tools coming
          </div>
        </div>

        {/* Active content */}
        {activeTab === 'create' && (
          <YouTubeToPodcast onEpisodeCreated={() => setLibraryKey(k => k + 1)} />
        )}
        {activeTab === 'library' && <LibraryTab key={libraryKey} />}
      </div>
    </div>
  );
}

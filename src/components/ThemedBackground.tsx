'use client';

const THEMES: Record<string, { gradient: string; pattern: string; emoji: string }> = {
  kitchen: {
    gradient: 'from-orange-950/40 via-red-950/20 to-amber-950/30',
    pattern: 'radial-gradient(circle at 20% 80%, rgba(255,107,53,0.06) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,140,90,0.04) 0%, transparent 50%)',
    emoji: '🍳',
  },
  german: {
    gradient: 'from-yellow-950/30 via-red-950/15 to-yellow-950/20',
    pattern: 'radial-gradient(circle at 30% 70%, rgba(234,179,8,0.05) 0%, transparent 50%), radial-gradient(circle at 70% 30%, rgba(220,38,38,0.04) 0%, transparent 50%)',
    emoji: '🇩🇪',
  },
  eurovision: {
    gradient: 'from-pink-950/30 via-purple-950/20 to-blue-950/25',
    pattern: 'radial-gradient(circle at 25% 75%, rgba(233,30,140,0.06) 0%, transparent 50%), radial-gradient(circle at 75% 25%, rgba(123,47,190,0.04) 0%, transparent 50%)',
    emoji: '🎤',
  },
  travel: {
    gradient: 'from-cyan-950/30 via-blue-950/20 to-indigo-950/25',
    pattern: 'radial-gradient(circle at 40% 60%, rgba(6,182,212,0.05) 0%, transparent 50%), radial-gradient(circle at 60% 40%, rgba(59,130,246,0.04) 0%, transparent 50%)',
    emoji: '✈️',
  },
  photos: {
    gradient: 'from-rose-950/30 via-pink-950/20 to-red-950/25',
    pattern: 'radial-gradient(circle at 50% 50%, rgba(244,63,94,0.05) 0%, transparent 50%)',
    emoji: '📸',
  },
  events: {
    gradient: 'from-violet-950/30 via-purple-950/20 to-fuchsia-950/25',
    pattern: 'radial-gradient(circle at 30% 70%, rgba(139,92,246,0.05) 0%, transparent 50%)',
    emoji: '📅',
  },
  todos: {
    gradient: 'from-emerald-950/30 via-green-950/20 to-teal-950/25',
    pattern: 'radial-gradient(circle at 60% 40%, rgba(16,185,129,0.05) 0%, transparent 50%)',
    emoji: '✅',
  },
  recommendations: {
    gradient: 'from-amber-950/30 via-yellow-950/20 to-orange-950/25',
    pattern: 'radial-gradient(circle at 40% 60%, rgba(245,158,11,0.05) 0%, transparent 50%)',
    emoji: '💡',
  },
  shopping: {
    gradient: 'from-green-950/30 via-emerald-950/20 to-teal-950/25',
    pattern: 'radial-gradient(circle at 50% 50%, rgba(34,197,94,0.05) 0%, transparent 50%)',
    emoji: '🛒',
  },
};

export default function ThemedBackground({ theme }: { theme: string }) {
  const t = THEMES[theme] || THEMES.kitchen;

  return (
    <div className="fixed inset-0 -z-10 pointer-events-none">
      <div className={`absolute inset-0 bg-gradient-to-br ${t.gradient}`} />
      <div className="absolute inset-0" style={{ backgroundImage: t.pattern }} />
      {/* Subtle floating emoji watermark */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[200px] opacity-[0.015] select-none">
        {t.emoji}
      </div>
    </div>
  );
}

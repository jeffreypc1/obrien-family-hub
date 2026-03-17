'use client';

const THEMES: Record<string, { gradient: string; pattern: string; emoji: string }> = {
  kitchen: {
    gradient: 'linear-gradient(135deg, rgba(120,40,0,0.25) 0%, rgba(80,10,10,0.15) 50%, rgba(100,50,0,0.2) 100%)',
    pattern: 'radial-gradient(circle at 20% 80%, rgba(255,107,53,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,140,90,0.06) 0%, transparent 50%)',
    emoji: '🍳',
  },
  german: {
    gradient: 'linear-gradient(135deg, rgba(100,80,0,0.2) 0%, rgba(100,10,10,0.12) 50%, rgba(100,80,0,0.15) 100%)',
    pattern: 'radial-gradient(circle at 30% 70%, rgba(234,179,8,0.07) 0%, transparent 50%), radial-gradient(circle at 70% 30%, rgba(220,38,38,0.05) 0%, transparent 50%)',
    emoji: '🇩🇪',
  },
  eurovision: {
    gradient: 'linear-gradient(135deg, rgba(100,10,60,0.2) 0%, rgba(50,20,80,0.15) 50%, rgba(20,30,70,0.18) 100%)',
    pattern: 'radial-gradient(circle at 25% 75%, rgba(233,30,140,0.08) 0%, transparent 50%)',
    emoji: '🎤',
  },
  travel: {
    gradient: 'linear-gradient(135deg, rgba(0,60,80,0.2) 0%, rgba(10,20,60,0.15) 100%)',
    pattern: 'radial-gradient(circle at 40% 60%, rgba(6,182,212,0.06) 0%, transparent 50%)',
    emoji: '✈️',
  },
  photos: {
    gradient: 'linear-gradient(135deg, rgba(80,15,30,0.2) 0%, rgba(60,10,30,0.15) 100%)',
    pattern: 'radial-gradient(circle at 50% 50%, rgba(244,63,94,0.06) 0%, transparent 50%)',
    emoji: '📸',
  },
  events: {
    gradient: 'linear-gradient(135deg, rgba(50,20,80,0.2) 0%, rgba(60,10,60,0.15) 100%)',
    pattern: 'radial-gradient(circle at 30% 70%, rgba(139,92,246,0.06) 0%, transparent 50%)',
    emoji: '📅',
  },
  todos: {
    gradient: 'linear-gradient(135deg, rgba(10,60,40,0.2) 0%, rgba(10,40,30,0.15) 100%)',
    pattern: 'radial-gradient(circle at 60% 40%, rgba(16,185,129,0.06) 0%, transparent 50%)',
    emoji: '✅',
  },
  recommendations: {
    gradient: 'linear-gradient(135deg, rgba(80,60,0,0.2) 0%, rgba(60,40,0,0.15) 100%)',
    pattern: 'radial-gradient(circle at 40% 60%, rgba(245,158,11,0.06) 0%, transparent 50%)',
    emoji: '💡',
  },
  cruise: {
    gradient: 'linear-gradient(135deg, rgba(0,30,60,0.3) 0%, rgba(0,20,50,0.2) 50%, rgba(10,30,60,0.25) 100%)',
    pattern: 'radial-gradient(circle at 20% 80%, rgba(6,182,212,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(59,130,246,0.06) 0%, transparent 50%)',
    emoji: '🚢',
  },
  italian: {
    gradient: 'linear-gradient(135deg, rgba(0,80,40,0.2) 0%, rgba(60,10,10,0.12) 50%, rgba(0,60,30,0.15) 100%)',
    pattern: 'radial-gradient(circle at 25% 75%, rgba(0,146,70,0.07) 0%, transparent 50%), radial-gradient(circle at 75% 25%, rgba(206,43,55,0.06) 0%, transparent 50%)',
    emoji: '🇮🇹',
  },
  shopping: {
    gradient: 'linear-gradient(135deg, rgba(10,50,30,0.2) 0%, rgba(10,40,25,0.15) 100%)',
    pattern: 'radial-gradient(circle at 50% 50%, rgba(34,197,94,0.06) 0%, transparent 50%)',
    emoji: '🛒',
  },
};

export default function ThemedBackground({ theme }: { theme: string }) {
  const t = THEMES[theme] || THEMES.kitchen;

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: -1, background: '#050510' }}>
      <div className="absolute inset-0" style={{ backgroundImage: t.gradient }} />
      <div className="absolute inset-0" style={{ backgroundImage: t.pattern }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[200px] opacity-[0.025] select-none">
        {t.emoji}
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const DONE_EMOJIS = ['🎉', '✅', '💪', '⭐', '🔥', '👏', '🙌', '💯', '🏆', '🎊'];
const DONE_MESSAGES = ['Nice work!', 'Crushed it!', 'Done!', 'Boom!', 'Nailed it!', 'Way to go!', 'Awesome!', 'Let\'s go!'];

const EGG_ANIMATIONS = [
  { emoji: '🥚', reveal: '🎁', color: '#FFD700' },
  { emoji: '🥚', reveal: '💰', color: '#22C55E' },
  { emoji: '🥚', reveal: '🎉', color: '#E91E8C' },
  { emoji: '🥚', reveal: '⭐', color: '#F59E0B' },
  { emoji: '🥚', reveal: '🏆', color: '#8B5CF6' },
];

interface TaskCelebrationProps {
  type: 'done' | 'easter-egg';
  easterEgg?: { title: string; description: string; dollarAmount?: number; otherReward?: string };
  onComplete: () => void;
}

export default function TaskCelebration({ type, easterEgg, onComplete }: TaskCelebrationProps) {
  const [phase, setPhase] = useState<'show' | 'fade'>('show');

  useEffect(() => {
    const duration = type === 'easter-egg' ? 4000 : 1500;
    const timer = setTimeout(() => setPhase('fade'), duration - 300);
    const complete = setTimeout(onComplete, duration);
    return () => { clearTimeout(timer); clearTimeout(complete); };
  }, [type, onComplete]);

  if (type === 'done') {
    const emoji = DONE_EMOJIS[Math.floor(Math.random() * DONE_EMOJIS.length)];
    const message = DONE_MESSAGES[Math.floor(Math.random() * DONE_MESSAGES.length)];

    return (
      <div className={`fixed inset-0 z-[70] flex items-center justify-center pointer-events-none transition-opacity duration-300 ${phase === 'fade' ? 'opacity-0' : 'opacity-100'}`}>
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 15 }}
          className="text-center"
        >
          <motion.div
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 0.5 }}
            className="text-7xl mb-2"
          >
            {emoji}
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl font-bold text-white bg-black/40 backdrop-blur-sm rounded-2xl px-6 py-2"
          >
            {message}
          </motion.p>
        </motion.div>

        {/* Particle burst */}
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i / 12) * Math.PI * 2;
          return (
            <motion.span key={i} className="absolute text-2xl"
              initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
              animate={{
                x: Math.cos(angle) * 150,
                y: Math.sin(angle) * 150 - 50,
                opacity: 0,
                scale: 0.5,
              }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              style={{ left: '50%', top: '50%' }}
            >
              {['✨', '⭐', '🌟', '💫', '🎵', '🎶', '💪', '🔥', '❤️', '💎', '🌈', '🎊'][i]}
            </motion.span>
          );
        })}
      </div>
    );
  }

  // Easter egg animation
  const anim = EGG_ANIMATIONS[Math.floor(Math.random() * EGG_ANIMATIONS.length)];

  return (
    <div className={`fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${phase === 'fade' ? 'opacity-0' : 'opacity-100'}`}>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 12 }}
        className="text-center max-w-md"
      >
        {/* Egg crack animation */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1.3, 0],
            rotate: [0, -10, 10, 0],
          }}
          transition={{ duration: 1, times: [0, 0.3, 0.6, 1] }}
          className="text-8xl mb-4 inline-block"
        >
          {anim.emoji}
        </motion.div>

        {/* Reveal */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.8, type: 'spring', stiffness: 200 }}
        >
          <div className="text-6xl mb-4">{anim.reveal}</div>
          <div className="bg-black/70 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="text-sm uppercase tracking-widest text-amber-400 mb-2"
            >
              🥚 Easter Egg Found!
            </motion.p>
            <motion.h3
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
              className="text-2xl font-bold mb-2"
            >
              {easterEgg?.title || 'Surprise!'}
            </motion.h3>
            {easterEgg?.description && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.4 }}
                className="text-white/50 text-sm mb-3"
              >
                {easterEgg.description}
              </motion.p>
            )}
            {easterEgg?.dollarAmount && (
              <motion.p
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.6, type: 'spring' }}
                className="text-3xl font-bold text-emerald-400"
              >
                +${easterEgg.dollarAmount.toFixed(2)}
              </motion.p>
            )}
            {easterEgg?.otherReward && (
              <motion.p
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.6, type: 'spring' }}
                className="text-xl font-bold text-amber-400"
              >
                🎁 {easterEgg.otherReward}
              </motion.p>
            )}
          </div>
        </motion.div>

        {/* Sparkle ring */}
        {Array.from({ length: 20 }).map((_, i) => {
          const angle = (i / 20) * Math.PI * 2;
          const delay = 0.8 + Math.random() * 0.5;
          return (
            <motion.span key={i} className="absolute text-xl"
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                x: Math.cos(angle) * (120 + Math.random() * 60),
                y: Math.sin(angle) * (120 + Math.random() * 60),
                opacity: [0, 1, 0],
                scale: [0, 1.5, 0],
              }}
              transition={{ delay, duration: 1.5 }}
              style={{ left: '50%', top: '40%' }}
            >
              {['✨', '⭐', '🌟', '💫', '🎊', '🎉', '💰', '🔥', '💎', '🌈', '🥇', '🏆', '💸', '🎁', '❤️', '🦄', '🎪', '🎯', '🍀', '🌺'][i]}
            </motion.span>
          );
        })}
      </motion.div>
    </div>
  );
}

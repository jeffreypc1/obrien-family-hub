'use client';

import { motion } from 'framer-motion';
import Starfield from '@/components/Starfield';
import CursorTrail from '@/components/CursorTrail';
import AppCard from '@/components/AppCard';
import { FAMILY_APPS } from './apps';

export default function Home() {
  const year = new Date().getFullYear();

  return (
    <>
      <Starfield />
      <CursorTrail />

      <div className="relative z-10">
        {/* ============ HERO ============ */}
        <section className="min-h-screen flex flex-col items-center justify-center px-6 relative">
          {/* Ambient glow behind title */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-purple-500/5 blur-[120px] pointer-events-none" />

          {/* Animated crest / family icon */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 100, damping: 15, delay: 0.2 }}
            className="mb-8"
          >
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-blue-500/20 border border-white/10 flex items-center justify-center backdrop-blur-xl shadow-2xl">
              <span className="text-5xl md:text-6xl">🏠</span>
            </div>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="text-6xl md:text-8xl lg:text-9xl font-fredoka font-bold text-center leading-none mb-4"
          >
            <span className="gradient-text bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400">
              O&apos;Brien
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="text-lg md:text-xl text-white/30 tracking-[0.3em] uppercase font-outfit font-light mb-12"
          >
            Family Hub
          </motion.p>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.1 }}
            className="text-white/40 text-center max-w-md text-sm md:text-base leading-relaxed mb-16"
          >
            Our corner of the internet. Apps, games, and things we
            built — just for us.
          </motion.p>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.8 }}
            className="absolute bottom-12"
          >
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
              className="flex flex-col items-center gap-2"
            >
              <span className="text-white/20 text-xs tracking-widest uppercase">Explore</span>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-white/20">
                <path d="M10 4L10 16M10 16L4 10M10 16L16 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.div>
          </motion.div>
        </section>

        {/* ============ APPS ============ */}
        <section className="max-w-4xl mx-auto px-6 pb-32">
          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-fredoka font-bold gradient-text bg-gradient-to-r from-white/80 to-white/40 mb-3">
              Our Apps
            </h2>
            <p className="text-white/30 text-sm">
              {FAMILY_APPS.filter(a => a.status === 'live').length} live
              {FAMILY_APPS.filter(a => a.status === 'coming-soon').length > 0 &&
                ` · ${FAMILY_APPS.filter(a => a.status === 'coming-soon').length} coming soon`
              }
            </p>
          </motion.div>

          {/* App cards */}
          <div className="space-y-8">
            {FAMILY_APPS.map((app, i) => (
              <AppCard key={app.id} app={app} index={i} />
            ))}
          </div>
        </section>

        {/* ============ FOOTER ============ */}
        <footer className="border-t border-white/5 py-12 px-6">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🏠</span>
              <span className="font-fredoka text-white/30 text-sm">
                O&apos;Brien Family Hub
              </span>
            </div>
            <p className="text-white/15 text-xs">
              Made with love · {year}
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}

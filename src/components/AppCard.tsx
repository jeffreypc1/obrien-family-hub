'use client';

import { motion } from 'framer-motion';
import type { FamilyApp } from '@/app/apps';

interface AppCardProps {
  app: FamilyApp;
  index: number;
}

export default function AppCard({ app, index }: AppCardProps) {
  const isLive = app.status === 'live';

  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, delay: index * 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <motion.a
        href={isLive ? app.url : undefined}
        target={isLive && app.url.startsWith('http') ? '_blank' : undefined}
        rel={isLive && app.url.startsWith('http') ? 'noopener noreferrer' : undefined}
        className={`block glass rounded-3xl overflow-hidden group relative ${app.glowClass} ${
          isLive ? 'cursor-pointer' : 'cursor-default'
        }`}
        whileHover={isLive ? { scale: 1.02, y: -4 } : {}}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        {/* Top gradient bar */}
        <div className={`h-1.5 bg-gradient-to-r ${app.gradient}`} />

        <div className="p-8 md:p-10">
          <div className="flex items-start justify-between mb-6">
            {/* Icon */}
            <motion.div
              className="text-6xl md:text-7xl"
              whileHover={{ rotate: [0, -10, 10, -5, 0], scale: 1.1 }}
              transition={{ duration: 0.5 }}
            >
              {app.icon}
            </motion.div>

            {/* Status badge */}
            <div className={`px-3 py-1 rounded-full text-xs font-medium tracking-wider uppercase ${
              isLive
                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                : 'bg-white/5 text-white/30 border border-white/10'
            }`}>
              {isLive ? 'Live' : 'Coming Soon'}
            </div>
          </div>

          {/* Title */}
          <h3 className={`text-3xl md:text-4xl font-fredoka font-bold mb-2 gradient-text bg-gradient-to-r ${app.gradient}`}>
            {app.name}
          </h3>

          {/* Tagline */}
          <p className="text-white/40 text-sm font-medium tracking-widest uppercase mb-4">
            {app.tagline}
          </p>

          {/* Description */}
          <p className="text-white/60 text-base leading-relaxed mb-6 max-w-xl">
            {app.description}
          </p>

          {/* CTA */}
          {isLive ? (
            <div className="flex items-center gap-3 group/cta">
              <div
                className={`px-6 py-3 rounded-2xl bg-gradient-to-r ${app.gradient} text-white font-medium text-sm
                  group-hover:shadow-lg transition-shadow`}
              >
                Open App
              </div>
              <motion.span
                className="text-white/40 text-xl"
                animate={{ x: [0, 5, 0] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
              >
                →
              </motion.span>
            </div>
          ) : (
            <div className="text-white/20 text-sm italic">
              We&apos;re cooking this one up...
            </div>
          )}
        </div>

        {/* Hover shimmer overlay */}
        {isLive && (
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
            <div
              className={`absolute inset-0 bg-gradient-to-r ${app.gradient} opacity-[0.03]`}
            />
          </div>
        )}
      </motion.a>
    </motion.div>
  );
}

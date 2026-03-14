'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Starfield from '@/components/Starfield';
import CursorTrail from '@/components/CursorTrail';
import { FAMILY_APPS } from './apps';
import { useFamilyMember } from '@/components/FamilyContext';
import Link from 'next/link';

interface HubConfig {
  heroTitle: string;
  heroSubtitle: string;
  heroCopy: string;
  heroIcon: string;
  fontPrimary: string;
}

export default function Home() {
  const { currentMember } = useFamilyMember();
  const [config, setConfig] = useState<HubConfig | null>(null);
  const year = new Date().getFullYear();

  useEffect(() => {
    fetch('/api/admin').then((r) => r.json()).then((data) => {
      if (data.config) setConfig(data.config);
    });
  }, []);

  // Load selected font
  useEffect(() => {
    if (config?.fontPrimary && config.fontPrimary !== 'Outfit') {
      const link = document.createElement('link');
      link.href = `https://fonts.googleapis.com/css2?family=${config.fontPrimary.replace(/ /g, '+')}:wght@300;400;500;600;700&display=swap`;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
      document.body.style.fontFamily = `"${config.fontPrimary}", sans-serif`;
    }
  }, [config?.fontPrimary]);

  const liveApps = FAMILY_APPS.filter((a) => a.status === 'live');
  const comingSoon = FAMILY_APPS.filter((a) => a.status === 'coming-soon');

  return (
    <>
      <Starfield />
      <CursorTrail />

      <div className="relative z-10">
        {/* ============ HERO ============ */}
        <section className="min-h-[70vh] flex flex-col items-center justify-center px-6 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-purple-500/5 blur-[120px] pointer-events-none" />

          {/* Icon */}
          <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 100, damping: 15, delay: 0.2 }}
            className="mb-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-blue-500/20 border border-white/10 flex items-center justify-center backdrop-blur-xl">
              <span className="text-4xl">{config?.heroIcon || '🏠'}</span>
            </div>
          </motion.div>

          {/* Title */}
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="text-6xl md:text-8xl font-bold text-center leading-none mb-3">
            <span className="gradient-text bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400">
              {config?.heroTitle || "O'Brien"}
            </span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="text-lg text-white/30 tracking-[0.3em] uppercase font-light mb-8">
            {config?.heroSubtitle || 'Family Hub'}
          </motion.p>

          {/* Current member greeting */}
          {currentMember && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }}
              className="text-white/30 text-sm mb-6">
              Hey {currentMember.emoji} {currentMember.name}!
            </motion.p>
          )}

          {/* Scroll indicator */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
            className="mt-8">
            <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 2 }}
              className="flex flex-col items-center gap-1">
              <span className="text-white/15 text-xs tracking-widest uppercase">Apps</span>
              <span className="text-white/15">↓</span>
            </motion.div>
          </motion.div>
        </section>

        {/* ============ APPS GRID ============ */}
        <section className="max-w-6xl mx-auto px-6 pb-20">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {liveApps.map((app, i) => (
              <motion.div key={app.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ duration: 0.5, delay: i * 0.1 }}>
                <motion.a
                  href={app.url}
                  target={app.url.startsWith('http') ? '_blank' : undefined}
                  rel={app.url.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className={`block glass rounded-2xl overflow-hidden group relative ${app.glowClass} aspect-square`}
                  whileHover={{ scale: 1.04, y: -4 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
                  {/* Top gradient line */}
                  <div className={`h-1 bg-gradient-to-r ${app.gradient}`} />

                  <div className="p-5 flex flex-col h-full">
                    {/* Icon */}
                    <motion.div className="text-4xl mb-3"
                      whileHover={{ rotate: [0, -8, 8, 0], scale: 1.1 }}
                      transition={{ duration: 0.4 }}>
                      {app.icon}
                    </motion.div>

                    {/* Name */}
                    <h3 className={`text-lg font-bold mb-1 gradient-text bg-gradient-to-r ${app.gradient} leading-tight`}>
                      {app.name}
                    </h3>

                    {/* Tagline */}
                    <p className="text-white/30 text-[11px] tracking-wider uppercase mb-auto">
                      {app.tagline}
                    </p>

                    {/* Arrow */}
                    <div className="flex justify-end mt-3">
                      <motion.span className="text-white/20 text-lg group-hover:text-white/50 transition-colors"
                        animate={{ x: [0, 3, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}>
                        →
                      </motion.span>
                    </div>
                  </div>

                  {/* Hover overlay */}
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-r ${app.gradient} opacity-[0.03]`} />
                </motion.a>
              </motion.div>
            ))}

            {/* Coming soon cards */}
            {comingSoon.map((app, i) => (
              <motion.div key={app.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: (liveApps.length + i) * 0.1 }}>
                <div className="glass rounded-2xl overflow-hidden aspect-square opacity-50">
                  <div className="h-1 bg-white/10" />
                  <div className="p-5 flex flex-col h-full">
                    <div className="text-4xl mb-3 grayscale">{app.icon}</div>
                    <h3 className="text-lg font-bold mb-1 text-white/30">{app.name}</h3>
                    <p className="text-white/15 text-[11px] tracking-wider uppercase mb-auto">{app.tagline}</p>
                    <span className="text-[10px] text-white/20 uppercase tracking-wider">Coming Soon</span>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Admin card */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: FAMILY_APPS.length * 0.1 }}>
              <Link href="/admin">
                <div className="glass rounded-2xl overflow-hidden aspect-square group hover:border-white/20 transition-all cursor-pointer">
                  <div className="h-1 bg-white/10" />
                  <div className="p-5 flex flex-col h-full">
                    <div className="text-4xl mb-3">⚙️</div>
                    <h3 className="text-lg font-bold mb-1 text-white/40 group-hover:text-white/70 transition-colors">Admin</h3>
                    <p className="text-white/15 text-[11px] tracking-wider uppercase mb-auto">Settings</p>
                    <span className="text-white/10 text-lg group-hover:text-white/30 transition-colors">→</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* ============ FOOTER ============ */}
        <footer className="border-t border-white/5 py-8 px-6">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <span className="text-white/15 text-xs">O&apos;Brien Family · {year}</span>
            <span className="text-white/10 text-xs">Made with love</span>
          </div>
        </footer>
      </div>
    </>
  );
}

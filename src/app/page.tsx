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
  appVisibilityJson?: string | null;
  appOverridesJson?: string | null;
  expandedAppsJson?: string | null;
  requirePin?: number;
}

export default function Home() {
  const { currentMember, setShowPicker } = useFamilyMember();
  const [config, setConfig] = useState<HubConfig | null>(null);
  const year = new Date().getFullYear();

  useEffect(() => {
    fetch('/api/admin').then((r) => r.json()).then((data) => {
      if (data.config) setConfig(data.config);
    });
  }, []);

  // Font and size are now handled globally by GlobalSettings component

  // Filter by visibility settings
  const visibility: Record<string, boolean> = {};
  if (config?.appVisibilityJson) {
    try { Object.assign(visibility, JSON.parse(config.appVisibilityJson!)); } catch {}
  }
  // App overrides (custom names/descriptions from admin)
  const overrides: Record<string, { name?: string; tagline?: string; description?: string }> = {};
  if (config?.appOverridesJson) {
    try { Object.assign(overrides, JSON.parse(config.appOverridesJson)); } catch {}
  }

  // Parse expanded apps list
  const expandedApps: string[] = [];
  if (config?.expandedAppsJson) {
    try { expandedApps.push(...JSON.parse(config.expandedAppsJson)); } catch {}
  }
  const isExpanded = currentMember?.role === 'expanded';

  const visibleApps = FAMILY_APPS
    .filter((a) => visibility[a.id] !== false)
    .filter((a) => !isExpanded || expandedApps.includes(a.id)) // expanded members only see shared apps
    .map((a) => ({
      ...a,
      name: overrides[a.id]?.name || a.name,
      tagline: overrides[a.id]?.tagline || a.tagline,
      description: overrides[a.id]?.description || a.description,
    }));
  const liveApps = visibleApps.filter((a) => a.status === 'live');
  const comingSoon = visibleApps.filter((a) => a.status === 'coming-soon');

  // If no member selected, show hero + prompt (no apps)
  if (!currentMember) {
    return (
      <>
        <Starfield />
        <CursorTrail />
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-purple-500/5 blur-[120px] pointer-events-none" />

          <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 100, damping: 15 }} className="mb-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-blue-500/20 border border-white/10 flex items-center justify-center">
              <span className="text-4xl">{config?.heroIcon || '🏠'}</span>
            </div>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-6xl md:text-8xl font-bold text-center leading-none mb-3">
            <span className="gradient-text bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400">
              {config?.heroTitle || "O'Brien"}
            </span>
          </motion.h1>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
            className="text-lg text-white/30 tracking-[0.3em] uppercase font-light mb-10">
            {config?.heroSubtitle || 'Family Hub'}
          </motion.p>

          <motion.button
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }}
            onClick={() => setShowPicker(true)}
            className="px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold text-lg hover:scale-105 transition-transform shadow-lg shadow-purple-500/20"
          >
            Who&apos;s here? →
          </motion.button>
        </div>
      </>
    );
  }

  return (
    <>
      <Starfield />
      <CursorTrail />

      <div className="relative z-10">
        {/* 3D House mode button */}
        <div className="absolute top-6 right-6 z-20">
          <Link href="/home-3d"
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/30 hover:text-white hover:bg-white/10 text-xs transition-all flex items-center gap-2">
            🏡 3D House
          </Link>
        </div>

        {/* ============ HERO (compact when member selected) ============ */}
        <section className="pt-20 pb-12 flex flex-col items-center px-6 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-purple-500/5 blur-[120px] pointer-events-none" />

          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="text-6xl md:text-8xl font-bold text-center leading-none mb-3"
            style={{ textShadow: '0 0 60px rgba(168, 85, 247, 0.15), 0 0 120px rgba(236, 72, 153, 0.08)' }}>
            <span className="gradient-text bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400">
              {config?.heroTitle || "O'Brien"}
            </span>
          </motion.h1>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="text-base text-white/30 tracking-[0.3em] uppercase font-light mb-4">
            {config?.heroSubtitle || 'Family Hub'}
          </motion.p>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            className="text-white/40 text-sm">
            Hey {currentMember.emoji} {currentMember.name}
          </motion.p>
        </section>

        {/* ============ APPS GRID ============ */}
        <section className="max-w-5xl mx-auto px-6 pb-20">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {liveApps.map((app, i) => (
              <motion.div key={app.id}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.08 }}>
                <motion.a
                  href={app.url}
                  target={app.url.startsWith('http') ? '_blank' : undefined}
                  rel={app.url.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="block rounded-2xl overflow-hidden group relative aspect-square border border-white/[0.12] bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/[0.25] transition-all duration-300"
                  style={{ boxShadow: `0 0 0px ${app.accentColor}00` }}
                  whileHover={{ scale: 1.03, y: -3, boxShadow: `0 8px 40px ${app.accentColor}20` }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}>

                  {/* Top gradient line */}
                  <div className={`h-1 bg-gradient-to-r ${app.gradient}`} />

                  <div className="p-5 flex flex-col h-full relative z-10">
                    {/* Icon */}
                    <span className="text-4xl mb-3 block group-hover:scale-110 transition-transform">{app.icon}</span>

                    {/* Name — always readable */}
                    <h3 className="text-base font-bold text-white mb-1 leading-tight">{app.name}</h3>

                    {/* Tagline */}
                    <p className="text-white/40 group-hover:text-white/60 text-[11px] tracking-wider uppercase mb-auto transition-colors">
                      {app.tagline}
                    </p>

                    {/* Arrow */}
                    <div className="flex justify-end mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-white/50 text-sm">Open →</span>
                    </div>
                  </div>
                </motion.a>
              </motion.div>
            ))}

            {/* Coming soon cards */}
            {comingSoon.map((app, i) => (
              <motion.div key={app.id}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: (liveApps.length + i) * 0.08 }}>
                <div className="rounded-2xl overflow-hidden aspect-square border border-white/[0.08] bg-white/[0.02] opacity-40">
                  <div className="h-1 bg-white/5" />
                  <div className="p-5 flex flex-col h-full">
                    <span className="text-4xl mb-3 grayscale">{app.icon}</span>
                    <h3 className="text-base font-bold text-white/30 mb-1">{app.name}</h3>
                    <p className="text-white/15 text-[11px] tracking-wider uppercase mb-auto">{app.tagline}</p>
                    <span className="text-[10px] text-white/15 uppercase tracking-wider">Coming Soon</span>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Admin card */}
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: FAMILY_APPS.length * 0.08 }}>
              <Link href="/admin">
                <div className="rounded-2xl overflow-hidden aspect-square border border-white/[0.08] bg-white/[0.02] group hover:bg-white/[0.05] hover:border-white/[0.15] transition-all cursor-pointer">
                  <div className="h-1 bg-white/5" />
                  <div className="p-5 flex flex-col h-full">
                    <span className="text-4xl mb-3">⚙️</span>
                    <h3 className="text-base font-bold text-white/30 group-hover:text-white/60 transition-colors mb-1">Admin</h3>
                    <p className="text-white/15 text-[11px] tracking-wider uppercase mb-auto">Settings</p>
                    <span className="text-white/10 group-hover:text-white/30 transition-colors text-sm">→</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/5 py-8 px-6">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <span className="text-white/15 text-xs">O&apos;Brien Family · {year}</span>
            <span className="text-white/10 text-xs">Made with love</span>
          </div>
        </footer>
      </div>
    </>
  );
}

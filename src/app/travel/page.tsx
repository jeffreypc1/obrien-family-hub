'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useFamilyMember } from '@/components/FamilyContext';
import ThemedBackground from '@/components/ThemedBackground';

interface Trip {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  status: string;
  description: string | null;
  createdBy: string | null;
  _count: { items: number; photos: number };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  dream: { label: 'Dream', color: '#C084FC', icon: '💭' },
  planned: { label: 'Planned', color: '#60A5FA', icon: '📋' },
  active: { label: 'Active', color: '#34D399', icon: '✈️' },
  completed: { label: 'Completed', color: '#9CA3AF', icon: '✅' },
};

export default function TravelPage() {
  const { currentMember } = useFamilyMember();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDest, setNewDest] = useState('');
  const [newStart, setNewStart] = useState('');
  const [newEnd, setNewEnd] = useState('');
  const [newStatus, setNewStatus] = useState('planned');
  const [newDesc, setNewDesc] = useState('');
  const [filter, setFilter] = useState<string>('all');

  const fetchTrips = () => {
    fetch('/api/trips').then((r) => r.json()).then(setTrips);
  };
  useEffect(() => { fetchTrips(); }, []);

  const handleCreate = async () => {
    if (!newTitle.trim() || !newDest.trim() || !newStart || !newEnd) return;
    await fetch('/api/trips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: newTitle.trim(), destination: newDest.trim(),
        startDate: newStart, endDate: newEnd, status: newStatus,
        description: newDesc.trim() || null, createdBy: currentMember?.name,
      }),
    });
    setNewTitle(''); setNewDest(''); setNewStart(''); setNewEnd(''); setNewDesc(''); setNewStatus('planned');
    setShowNew(false);
    fetchTrips();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this trip?')) return;
    await fetch(`/api/trips?id=${id}`, { method: 'DELETE' });
    fetchTrips();
  };

  const formatRange = (start: string, end: string) => {
    const s = new Date(start + 'T00:00:00');
    const e = new Date(end + 'T00:00:00');
    const days = Math.ceil((e.getTime() - s.getTime()) / 86400000) + 1;
    return `${s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${e.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · ${days} days`;
  };

  const filtered = filter === 'all' ? trips : trips.filter((t) => t.status === filter);

  return (
    <div className="min-h-screen relative">
      <ThemedBackground theme="travel" />

      <div className="border-b border-white/5">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-white/40 hover:text-white/80 transition-colors text-sm">← Back to Hub</Link>
          <span className="text-white/30 text-sm">{currentMember?.emoji} {currentMember?.name}</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">✈️ Travel</h1>
          <button onClick={() => setShowNew(true)}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium text-sm hover:scale-105 transition-transform">
            + New Trip
          </button>
        </div>

        {/* Status filter */}
        <div className="flex gap-2 mb-8 flex-wrap">
          <button onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-xl text-sm transition-all ${filter === 'all' ? 'bg-white/10 text-white' : 'bg-white/5 text-white/40'}`}>
            All ({trips.length})
          </button>
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
            const count = trips.filter((t) => t.status === key).length;
            return (
              <button key={key} onClick={() => setFilter(key)}
                className={`px-4 py-2 rounded-xl text-sm transition-all ${
                  filter === key ? `text-white` : 'bg-white/5 text-white/40'}`}
                style={filter === key ? { background: `${cfg.color}20`, border: `1px solid ${cfg.color}40` } : {}}>
                {cfg.icon} {cfg.label} {count > 0 && `(${count})`}
              </button>
            );
          })}
        </div>

        {/* Create trip form */}
        <AnimatePresence>
          {showNew && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="glass rounded-2xl p-6 mb-8 space-y-4">
              <h3 className="text-sm font-medium text-white/60">New Trip</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Trip name (e.g., Summer in Europe)" autoFocus
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-cyan-500 text-sm" />
                <input type="text" value={newDest} onChange={(e) => setNewDest(e.target.value)}
                  placeholder="Destination (e.g., Paris, France)"
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-cyan-500 text-sm" />
              </div>
              <div className="flex gap-4 flex-wrap">
                <div>
                  <label className="text-xs text-white/30 block mb-1">Start</label>
                  <input type="date" value={newStart} onChange={(e) => setNewStart(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm [color-scheme:dark]" />
                </div>
                <div>
                  <label className="text-xs text-white/30 block mb-1">End</label>
                  <input type="date" value={newEnd} onChange={(e) => setNewEnd(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm [color-scheme:dark]" />
                </div>
                <div>
                  <label className="text-xs text-white/30 block mb-1">Status</label>
                  <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm [&>option]:bg-gray-900">
                    {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                      <option key={key} value={key}>{cfg.icon} {cfg.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Description (optional)" rows={2}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none text-sm resize-none" />
              <div className="flex gap-2">
                <button onClick={handleCreate} disabled={!newTitle.trim() || !newDest.trim() || !newStart || !newEnd}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium text-sm disabled:opacity-30">Create Trip</button>
                <button onClick={() => setShowNew(false)} className="px-4 py-2.5 rounded-xl bg-white/5 text-white/40 text-sm">Cancel</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Trip cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map((trip, i) => {
            const cfg = STATUS_CONFIG[trip.status] || STATUS_CONFIG.planned;
            return (
              <motion.div key={trip.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}>
                <Link href={`/travel/trip?id=${trip.id}`}>
                  <div className="glass rounded-2xl overflow-hidden group cursor-pointer hover:border-white/15 transition-all"
                    style={{ boxShadow: `0 0 30px ${cfg.color}08` }}>
                    {/* Top bar */}
                    <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${cfg.color}, ${cfg.color}88)` }} />

                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-lg group-hover:text-white transition-colors">{trip.title}</h3>
                          <p className="text-white/40 text-sm">📍 {trip.destination}</p>
                        </div>
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider"
                          style={{ background: `${cfg.color}20`, color: cfg.color }}>
                          {cfg.icon} {cfg.label}
                        </span>
                      </div>

                      <p className="text-white/30 text-xs mb-3">{formatRange(trip.startDate, trip.endDate)}</p>

                      {trip.description && <p className="text-white/25 text-xs line-clamp-2 mb-3">{trip.description}</p>}

                      <div className="flex items-center gap-4 text-[10px] text-white/20">
                        <span>📋 {trip._count.items} items</span>
                        <span>📸 {trip._count.photos} photos</span>
                        {trip.createdBy && <span className="ml-auto">by {trip.createdBy}</span>}
                      </div>
                    </div>
                  </div>
                </Link>
                <button onClick={(e) => { e.preventDefault(); handleDelete(trip.id); }}
                  className="text-[10px] text-white/10 hover:text-red-400 mt-1 ml-2 transition-colors">Delete trip</button>
              </motion.div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20 text-white/20">
            <div className="text-5xl mb-4">✈️</div>
            <p>{filter === 'all' ? 'No trips yet. Start planning!' : `No ${filter} trips.`}</p>
          </div>
        )}
      </div>
    </div>
  );
}

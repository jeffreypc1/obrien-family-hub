'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useFamilyMember } from '@/components/FamilyContext';
import ThemedBackground from '@/components/ThemedBackground';

interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  emoji: string;
  date: string;
  recurring: string | null;
  createdBy: string | null;
}

interface LocalEvent {
  id: string;
  title: string;
  description: string | null;
  date: string | null;
  venue: string | null;
  city: string;
  url: string | null;
  source: string | null;
  imageUrl: string | null;
}

const EVENT_EMOJIS = ['📅', '🎂', '🎄', '🎃', '💍', '🎓', '🏖️', '🎪', '🏈', '🎵', '🍽️', '✈️', '🏠', '❤️', '🎁', '🥳', '⛪', '🏥'];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function EventsPage() {
  const { currentMember } = useFamilyMember();
  const [tab, setTab] = useState<'calendar' | 'local'>('calendar');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [localEvents, setLocalEvents] = useState<LocalEvent[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newEmoji, setNewEmoji] = useState('📅');
  const [newRecurring, setNewRecurring] = useState('');
  const [locations, setLocations] = useState<string[]>([]);
  const [activeCity, setActiveCity] = useState('');
  const [newCity, setNewCity] = useState('');
  const [fetching, setFetching] = useState(false);

  const fetchEvents = useCallback(async () => {
    const res = await fetch('/api/events');
    setEvents(await res.json());
  }, []);

  const fetchLocalEvents = useCallback(async (city: string) => {
    const res = await fetch(`/api/local-events?city=${encodeURIComponent(city)}`);
    setLocalEvents(await res.json());
  }, []);

  useEffect(() => {
    fetchEvents();
    // Load locations from admin config
    fetch('/api/admin').then((r) => r.json()).then((data) => {
      if (data.config?.locationsJson) {
        try {
          const locs = JSON.parse(data.config.locationsJson);
          setLocations(locs);
          if (locs.length > 0) { setActiveCity(locs[0]); fetchLocalEvents(locs[0]); }
        } catch {}
      }
    });
  }, [fetchEvents, fetchLocalEvents]);

  const handleAddEvent = async () => {
    if (!newTitle.trim() || !newDate) return;
    await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: newTitle.trim(),
        description: newDesc.trim() || null,
        emoji: newEmoji,
        date: newDate,
        recurring: newRecurring || null,
        createdBy: currentMember?.name,
      }),
    });
    setNewTitle(''); setNewDate(''); setNewDesc(''); setNewEmoji('📅'); setNewRecurring('');
    setShowAdd(false);
    fetchEvents();
  };

  const handleDeleteEvent = async (id: string) => {
    await fetch(`/api/events?id=${id}`, { method: 'DELETE' });
    fetchEvents();
  };

  const handleFetchLocal = async () => {
    if (!activeCity) return;
    setFetching(true);
    await fetch('/api/local-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'fetch', city: activeCity }),
    });
    await fetchLocalEvents(activeCity);
    setFetching(false);
  };

  const handleAddCity = async () => {
    if (!newCity.trim()) return;
    const updated = [...locations, newCity.trim()];
    setLocations(updated);
    setActiveCity(newCity.trim());
    setNewCity('');
    // Save to admin config
    await fetch('/api/admin', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: '', config: { locationsJson: JSON.stringify(updated) } }),
    }).catch(() => {});
    fetchLocalEvents(newCity.trim());
  };

  const handleDeleteLocal = async (id: string) => {
    await fetch(`/api/local-events?id=${id}`, { method: 'DELETE' });
    if (activeCity) fetchLocalEvents(activeCity);
  };

  const addToCalendar = (event: LocalEvent | CalendarEvent) => {
    const title = encodeURIComponent(event.title);
    const date = ('date' in event && event.date) ? event.date.replace(/-/g, '') : '';
    const details = encodeURIComponent(('description' in event && event.description) || '');
    window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${date}/${date}&details=${details}`, '_blank');
  };

  // Sort events: upcoming first, then past
  const now = new Date().toISOString().split('T')[0];
  const upcomingEvents = events.filter((e) => e.date >= now).sort((a, b) => a.date.localeCompare(b.date));
  const pastEvents = events.filter((e) => e.date < now).sort((a, b) => b.date.localeCompare(a.date));

  const formatDate = (d: string) => {
    const dt = new Date(d + 'T00:00:00');
    return { day: dt.getDate(), month: MONTHS[dt.getMonth()], year: dt.getFullYear(), weekday: dt.toLocaleDateString('en-US', { weekday: 'short' }) };
  };

  const daysUntil = (d: string) => {
    const diff = Math.ceil((new Date(d + 'T00:00:00').getTime() - new Date().setHours(0, 0, 0, 0)) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    if (diff < 7) return `In ${diff} days`;
    if (diff < 30) return `In ${Math.floor(diff / 7)} weeks`;
    return `In ${Math.floor(diff / 30)} months`;
  };

  return (
    <div className="min-h-screen relative">
      <ThemedBackground theme="events" />

      <div className="border-b border-white/5">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-white/40 hover:text-white/80 transition-colors text-sm">← Back to Hub</Link>
          <span className="text-white/30 text-sm">{currentMember?.emoji} {currentMember?.name}</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">📅 Events</h1>
          {tab === 'calendar' && (
            <button onClick={() => setShowAdd(true)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-medium text-sm hover:scale-105 transition-transform">
              + Add Event
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white/5 rounded-xl p-1 mb-8 max-w-md">
          <button onClick={() => setTab('calendar')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${tab === 'calendar' ? 'bg-white/10 text-white' : 'text-white/40'}`}>
            📅 Family Calendar
          </button>
          <button onClick={() => setTab('local')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${tab === 'local' ? 'bg-white/10 text-white' : 'text-white/40'}`}>
            🗺️ Local Events
          </button>
        </div>

        {/* ====== ADD EVENT FORM ====== */}
        <AnimatePresence>
          {showAdd && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="glass rounded-2xl p-6 mb-8 space-y-4">
              <h3 className="text-sm font-medium text-white/60">New Event</h3>
              <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Event name..." autoFocus
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-violet-500 text-sm" />
              <div className="flex gap-4 flex-wrap">
                <div>
                  <label className="text-xs text-white/30 block mb-1">Date</label>
                  <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none [color-scheme:dark]" />
                </div>
                <div>
                  <label className="text-xs text-white/30 block mb-1">Recurring</label>
                  <select value={newRecurring} onChange={(e) => setNewRecurring(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none [&>option]:bg-gray-900">
                    <option value="">One-time</option>
                    <option value="yearly">Every year</option>
                    <option value="monthly">Every month</option>
                    <option value="weekly">Every week</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-white/30 block mb-1">Emoji</label>
                <div className="flex gap-1.5 flex-wrap">
                  {EVENT_EMOJIS.map((e) => (
                    <button key={e} onClick={() => setNewEmoji(e)}
                      className={`text-xl p-1.5 rounded-lg ${newEmoji === e ? 'bg-white/15 ring-1 ring-white/30' : 'hover:bg-white/5'}`}>{e}</button>
                  ))}
                </div>
              </div>
              <textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Description (optional)" rows={2}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-violet-500 text-sm resize-none" />
              <div className="flex gap-2">
                <button onClick={handleAddEvent} disabled={!newTitle.trim() || !newDate}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-medium text-sm disabled:opacity-30">Create</button>
                <button onClick={() => setShowAdd(false)} className="px-4 py-2.5 rounded-xl bg-white/5 text-white/40 text-sm">Cancel</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ====== FAMILY CALENDAR ====== */}
        {tab === 'calendar' && (
          <div className="space-y-6">
            {/* Upcoming */}
            {upcomingEvents.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-white/40 uppercase tracking-wider mb-4">Upcoming</h3>
                <div className="space-y-3">
                  {upcomingEvents.map((evt) => {
                    const d = formatDate(evt.date);
                    const until = daysUntil(evt.date);
                    return (
                      <motion.div key={evt.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="glass rounded-xl p-4 flex items-center gap-4 group hover:bg-white/[0.04] transition-colors">
                        {/* Date block */}
                        <div className="w-14 h-14 rounded-xl bg-violet-500/10 border border-violet-500/20 flex flex-col items-center justify-center flex-shrink-0">
                          <span className="text-[10px] text-violet-400 uppercase font-bold">{d.month}</span>
                          <span className="text-xl font-bold text-white">{d.day}</span>
                        </div>
                        <span className="text-2xl flex-shrink-0">{evt.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm">{evt.title}</h4>
                          {evt.description && <p className="text-white/30 text-xs mt-0.5 line-clamp-1">{evt.description}</p>}
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-violet-400/70">{until}</span>
                            {evt.recurring && <span className="text-[10px] text-white/20">🔁 {evt.recurring}</span>}
                          </div>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => addToCalendar(evt)} className="text-[10px] text-white/30 hover:text-white/60 px-2 py-1 rounded bg-white/5">
                            📅 Add to Calendar
                          </button>
                          <button onClick={() => handleDeleteEvent(evt.id)} className="text-[10px] text-white/15 hover:text-red-400 px-2 py-1 rounded bg-white/5">✕</button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Past */}
            {pastEvents.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-white/20 uppercase tracking-wider mb-4">Past</h3>
                <div className="space-y-2">
                  {pastEvents.slice(0, 10).map((evt) => {
                    const d = formatDate(evt.date);
                    return (
                      <div key={evt.id} className="flex items-center gap-4 px-4 py-3 opacity-40 hover:opacity-60 transition-opacity group">
                        <div className="w-10 h-10 rounded-lg bg-white/5 flex flex-col items-center justify-center flex-shrink-0">
                          <span className="text-[8px] text-white/40 uppercase">{d.month}</span>
                          <span className="text-sm font-bold text-white/50">{d.day}</span>
                        </div>
                        <span className="text-lg">{evt.emoji}</span>
                        <span className="text-sm text-white/50">{evt.title}</span>
                        <button onClick={() => handleDeleteEvent(evt.id)} className="text-white/10 hover:text-red-400 text-xs ml-auto opacity-0 group-hover:opacity-100">✕</button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {events.length === 0 && (
              <div className="text-center py-20 text-white/20">
                <div className="text-5xl mb-4">📅</div>
                <p>No events yet. Add birthdays, holidays, and more!</p>
              </div>
            )}
          </div>
        )}

        {/* ====== LOCAL EVENTS ====== */}
        {tab === 'local' && (
          <div>
            {/* City selector */}
            <div className="flex gap-2 mb-6 flex-wrap items-center">
              {locations.map((city) => (
                <button key={city} onClick={() => { setActiveCity(city); fetchLocalEvents(city); }}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    activeCity === city ? 'bg-violet-500/15 text-violet-400 border border-violet-500/30' : 'bg-white/5 text-white/40 border border-white/10'}`}>
                  📍 {city}
                </button>
              ))}
              <div className="flex gap-1">
                <input type="text" value={newCity} onChange={(e) => setNewCity(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCity()}
                  placeholder="Add city..."
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none w-36" />
                <button onClick={handleAddCity} className="px-3 py-2 rounded-xl bg-white/5 text-white/40 text-sm hover:text-white">+</button>
              </div>
            </div>

            {activeCity && (
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm text-white/50">Events near <strong className="text-white">{activeCity}</strong></h3>
                <button onClick={handleFetchLocal} disabled={fetching}
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-white text-xs transition-all disabled:opacity-30">
                  {fetching ? '🔄 Searching...' : '🔍 Search for Events'}
                </button>
              </div>
            )}

            {/* Local events table */}
            {localEvents.length > 0 ? (
              <div className="glass rounded-2xl overflow-hidden">
                <div className="divide-y divide-white/5">
                  {localEvents.map((evt) => (
                    <div key={evt.id} className="flex items-start gap-4 p-4 group hover:bg-white/[0.02] transition-colors">
                      {evt.imageUrl && (
                        <img src={evt.imageUrl} alt="" className="w-16 h-12 rounded-lg object-cover flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium line-clamp-1">{evt.title}</h4>
                        {evt.description && <p className="text-white/30 text-xs mt-1 line-clamp-2">{evt.description}</p>}
                        <div className="flex items-center gap-3 mt-2 text-[10px] text-white/20">
                          {evt.date && <span>📅 {evt.date}</span>}
                          {evt.venue && <span>📍 {evt.venue}</span>}
                          {evt.source && <span>via {evt.source}</span>}
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        {evt.url && (
                          <a href={evt.url} target="_blank" rel="noopener noreferrer"
                            className="text-[10px] text-white/30 hover:text-white/60 px-2 py-1 rounded bg-white/5">
                            🔗 View
                          </a>
                        )}
                        <button onClick={() => addToCalendar(evt)}
                          className="text-[10px] text-white/30 hover:text-white/60 px-2 py-1 rounded bg-white/5">
                          📅 Add
                        </button>
                        <button onClick={() => handleDeleteLocal(evt.id)}
                          className="text-[10px] text-white/10 hover:text-red-400 px-2 py-1 rounded bg-white/5 opacity-0 group-hover:opacity-100">✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : activeCity ? (
              <div className="text-center py-16 text-white/20">
                <div className="text-4xl mb-3">🗺️</div>
                <p>No events found for {activeCity}.</p>
                <p className="text-xs mt-1">Click &ldquo;Search for Events&rdquo; to find some!</p>
              </div>
            ) : (
              <div className="text-center py-16 text-white/20">
                <div className="text-4xl mb-3">📍</div>
                <p>Add a city above to discover local events.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

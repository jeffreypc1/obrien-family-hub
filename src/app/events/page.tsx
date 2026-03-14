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
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Current month view
  const now = new Date();
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [viewYear, setViewYear] = useState(now.getFullYear());

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
        title: newTitle.trim(), description: newDesc.trim() || null,
        emoji: newEmoji, date: newDate, recurring: newRecurring || null,
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

  const addToCalendar = (event: { title: string; date?: string | null; description?: string | null }) => {
    const title = encodeURIComponent(event.title);
    const date = event.date ? event.date.replace(/-/g, '') : '';
    const details = encodeURIComponent(event.description || '');
    window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${date}/${date}&details=${details}`, '_blank');
  };

  // ===== Calendar grid logic =====
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const getEventsForDate = (dateStr: string) => {
    return events.filter((e) => {
      if (e.date === dateStr) return true;
      // Handle yearly recurring (match month-day)
      if (e.recurring === 'yearly' && e.date.slice(5) === dateStr.slice(5)) return true;
      return false;
    });
  };

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };
  const goToToday = () => { setViewMonth(now.getMonth()); setViewYear(now.getFullYear()); };

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];
  const daysUntil = (d: string) => {
    const diff = Math.ceil((new Date(d + 'T00:00:00').getTime() - new Date().setHours(0, 0, 0, 0)) / 86400000);
    if (diff === 0) return 'Today'; if (diff === 1) return 'Tomorrow';
    if (diff < 0) return `${Math.abs(diff)} days ago`;
    if (diff < 7) return `In ${diff} days`;
    return `In ${Math.floor(diff / 7)} weeks`;
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

        {/* Add event form */}
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
                    <option value="yearly">Every year (birthdays, etc.)</option>
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

        {/* ====== CALENDAR GRID ====== */}
        {tab === 'calendar' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Month grid */}
            <div className="lg:col-span-2">
              <div className="glass rounded-2xl overflow-hidden">
                {/* Month header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                  <button onClick={prevMonth} className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all">
                    ←
                  </button>
                  <div className="text-center">
                    <h2 className="text-xl font-bold">{MONTH_NAMES[viewMonth]} {viewYear}</h2>
                    {(viewMonth !== now.getMonth() || viewYear !== now.getFullYear()) && (
                      <button onClick={goToToday} className="text-[10px] text-violet-400 hover:text-violet-300 mt-0.5">
                        Go to today
                      </button>
                    )}
                  </div>
                  <button onClick={nextMonth} className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all">
                    →
                  </button>
                </div>

                {/* Day names header */}
                <div className="grid grid-cols-7 border-b border-white/5">
                  {DAY_NAMES.map((d) => (
                    <div key={d} className="text-center py-2 text-[11px] text-white/25 font-medium uppercase tracking-wider">
                      {d}
                    </div>
                  ))}
                </div>

                {/* Day cells */}
                <div className="grid grid-cols-7">
                  {/* Empty cells before first day */}
                  {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                    <div key={`empty-${i}`} className="aspect-square border-b border-r border-white/[0.03]" />
                  ))}

                  {/* Day cells */}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const dayEvents = getEventsForDate(dateStr);
                    const isToday = dateStr === today;
                    const isSelected = dateStr === selectedDate;
                    const isWeekend = (firstDayOfMonth + i) % 7 === 0 || (firstDayOfMonth + i) % 7 === 6;

                    return (
                      <button key={day}
                        onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                        className={`aspect-square border-b border-r border-white/[0.03] p-1 flex flex-col items-center transition-all relative ${
                          isSelected ? 'bg-violet-500/15' : isToday ? 'bg-white/[0.04]' : 'hover:bg-white/[0.03]'
                        }`}>
                        <span className={`text-sm font-medium w-7 h-7 rounded-full flex items-center justify-center ${
                          isToday ? 'bg-violet-500 text-white' : isWeekend ? 'text-white/30' : 'text-white/60'
                        }`}>
                          {day}
                        </span>
                        {/* Event dots */}
                        {dayEvents.length > 0 && (
                          <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                            {dayEvents.slice(0, 3).map((evt, j) => (
                              <span key={j} className="text-[10px] leading-none">{evt.emoji}</span>
                            ))}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Sidebar: selected date details or upcoming */}
            <div className="space-y-4">
              {selectedDate ? (
                <div className="glass rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-sm">
                      {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </h3>
                    <button onClick={() => setSelectedDate(null)} className="text-white/20 hover:text-white/50 text-xs">✕</button>
                  </div>
                  {selectedDateEvents.length > 0 ? (
                    <div className="space-y-3">
                      {selectedDateEvents.map((evt) => (
                        <div key={evt.id} className="flex items-start gap-3 group">
                          <span className="text-xl">{evt.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium">{evt.title}</h4>
                            {evt.description && <p className="text-white/30 text-xs mt-0.5">{evt.description}</p>}
                            {evt.recurring && <span className="text-[10px] text-violet-400/50">🔁 {evt.recurring}</span>}
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => addToCalendar(evt)} className="text-[9px] text-white/25 hover:text-white/50 px-1.5 py-0.5 rounded bg-white/5">📅</button>
                            <button onClick={() => handleDeleteEvent(evt.id)} className="text-[9px] text-white/15 hover:text-red-400 px-1.5 py-0.5 rounded bg-white/5">✕</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-white/20 text-sm">No events on this day.</p>
                  )}
                  <button onClick={() => { setNewDate(selectedDate); setShowAdd(true); }}
                    className="w-full mt-4 py-2 rounded-xl border border-dashed border-white/10 text-white/25 hover:text-white/50 text-xs transition-colors">
                    + Add event on this day
                  </button>
                </div>
              ) : (
                /* Upcoming events list */
                <div className="glass rounded-2xl p-5">
                  <h3 className="font-bold text-sm text-white/50 mb-4">Upcoming</h3>
                  {events.filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 8).map((evt) => (
                    <div key={evt.id} className="flex items-center gap-3 py-2 group">
                      <span className="text-lg">{evt.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-medium truncate">{evt.title}</h4>
                        <span className="text-[10px] text-violet-400/60">{daysUntil(evt.date)}</span>
                      </div>
                      <span className="text-[10px] text-white/15">{new Date(evt.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
                  ))}
                  {events.filter((e) => e.date >= today).length === 0 && (
                    <p className="text-white/15 text-xs">No upcoming events</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ====== LOCAL EVENTS ====== */}
        {tab === 'local' && (
          <div>
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

            {localEvents.length > 0 ? (
              <div className="glass rounded-2xl overflow-hidden">
                <div className="divide-y divide-white/5">
                  {localEvents.map((evt) => (
                    <div key={evt.id} className="flex items-start gap-4 p-4 group hover:bg-white/[0.02] transition-colors">
                      {evt.imageUrl && <img src={evt.imageUrl} alt="" className="w-16 h-12 rounded-lg object-cover flex-shrink-0" />}
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
                            className="text-[10px] text-white/30 hover:text-white/60 px-2 py-1 rounded bg-white/5">🔗 View</a>
                        )}
                        <button onClick={() => addToCalendar(evt)} className="text-[10px] text-white/30 hover:text-white/60 px-2 py-1 rounded bg-white/5">📅 Add</button>
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

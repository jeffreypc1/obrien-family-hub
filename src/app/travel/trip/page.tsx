'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useFamilyMember } from '@/components/FamilyContext';
import ThemedBackground from '@/components/ThemedBackground';

interface TripItem { id: string; date: string; time: string | null; endTime: string | null; type: string; title: string; details: string | null; address: string | null; url: string | null; }
interface TripPhoto { id: string; date: string; imageUrl: string; caption: string | null; uploadedBy: string | null; createdAt: string; }
interface Trip { id: string; title: string; destination: string; startDate: string; endDate: string; status: string; description: string | null; items: TripItem[]; photos: TripPhoto[]; }

const ITEM_TYPES: Record<string, { icon: string; color: string }> = {
  flight: { icon: '✈️', color: '#60A5FA' },
  hotel: { icon: '🏨', color: '#A78BFA' },
  restaurant: { icon: '🍽️', color: '#F97316' },
  activity: { icon: '🎯', color: '#34D399' },
  museum: { icon: '🏛️', color: '#FBBF24' },
  transport: { icon: '🚗', color: '#6B7280' },
  shopping: { icon: '🛍️', color: '#F472B6' },
  other: { icon: '📌', color: '#9CA3AF' },
};

function TripContent() {
  const searchParams = useSearchParams();
  const tripId = searchParams.get('id');
  const { currentMember } = useFamilyMember();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [showAddItem, setShowAddItem] = useState(false);
  const [showPhotoViewer, setShowPhotoViewer] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);

  // Add item form
  const [itemTitle, setItemTitle] = useState('');
  const [itemType, setItemType] = useState('activity');
  const [itemTime, setItemTime] = useState('');
  const [itemEndTime, setItemEndTime] = useState('');
  const [itemDetails, setItemDetails] = useState('');
  const [itemAddress, setItemAddress] = useState('');
  const [itemUrl, setItemUrl] = useState('');

  // Photo upload
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoCaption, setPhotoCaption] = useState('');

  const fetchTrip = useCallback(async () => {
    if (!tripId) return;
    const res = await fetch('/api/trips');
    const trips = await res.json();
    const found = trips.find((t: Trip) => t.id === tripId);
    if (found) setTrip(found);
  }, [tripId]);

  useEffect(() => { fetchTrip(); }, [fetchTrip]);

  // Generate array of dates between start and end
  const getDays = () => {
    if (!trip) return [];
    const days: string[] = [];
    const start = new Date(trip.startDate + 'T00:00:00');
    const end = new Date(trip.endDate + 'T00:00:00');
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      days.push(d.toISOString().split('T')[0]);
    }
    return days;
  };
  const days = getDays();

  const getItemsForDay = (date: string) => (trip?.items || []).filter((i) => i.date === date).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  const getPhotosForDay = (date: string) => (trip?.photos || []).filter((p) => p.date === date);

  const handleAddItem = async () => {
    if (!tripId || !selectedDay || !itemTitle.trim()) return;
    await fetch('/api/trip-items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tripId, date: selectedDay, time: itemTime || null, endTime: itemEndTime || null,
        type: itemType, title: itemTitle.trim(), details: itemDetails.trim() || null,
        address: itemAddress.trim() || null, url: itemUrl.trim() || null,
      }),
    });
    setItemTitle(''); setItemTime(''); setItemEndTime(''); setItemDetails(''); setItemAddress(''); setItemUrl('');
    setShowAddItem(false);
    fetchTrip();
  };

  const handleDeleteItem = async (id: string) => {
    await fetch(`/api/trip-items?id=${id}`, { method: 'DELETE' });
    fetchTrip();
  };

  const handleAddPhoto = async () => {
    if (!tripId || !selectedDay || !photoUrl.trim()) return;
    await fetch('/api/trip-photos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tripId, date: selectedDay, imageUrl: photoUrl.trim(),
        caption: photoCaption.trim() || null, uploadedBy: currentMember?.name,
      }),
    });
    setPhotoUrl(''); setPhotoCaption('');
    fetchTrip();
  };

  const formatDay = (d: string) => {
    const dt = new Date(d + 'T00:00:00');
    return { weekday: dt.toLocaleDateString('en-US', { weekday: 'short' }), month: dt.toLocaleDateString('en-US', { month: 'short' }), day: dt.getDate() };
  };

  const selectedPhotos = selectedDay ? getPhotosForDay(selectedDay) : trip?.photos || [];

  if (!trip) return <div className="min-h-screen flex items-center justify-center"><div className="text-4xl animate-pulse">✈️</div></div>;

  const statusCfg = { dream: { color: '#C084FC', icon: '💭' }, planned: { color: '#60A5FA', icon: '📋' }, active: { color: '#34D399', icon: '✈️' }, completed: { color: '#9CA3AF', icon: '✅' } }[trip.status] || { color: '#60A5FA', icon: '📋' };

  return (
    <div className="min-h-screen relative">
      <ThemedBackground theme="travel" />

      <div className="border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/travel" className="text-white/40 hover:text-white/80 transition-colors text-sm">← Back to Trips</Link>
          <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase" style={{ background: `${statusCfg.color}20`, color: statusCfg.color }}>
            {statusCfg.icon} {trip.status}
          </span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Trip header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1">{trip.title}</h1>
          <p className="text-white/40">📍 {trip.destination} · {days.length} days</p>
          {trip.description && <p className="text-white/25 text-sm mt-2">{trip.description}</p>}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ===== DAY TIMELINE (left) ===== */}
          <div className="lg:col-span-1 space-y-2 max-h-[80vh] overflow-y-auto pr-2">
            <h3 className="text-sm text-white/40 uppercase tracking-wider mb-3 sticky top-0 bg-[#050510] py-2 z-10">Itinerary</h3>
            {days.map((day, i) => {
              const d = formatDay(day);
              const items = getItemsForDay(day);
              const photos = getPhotosForDay(day);
              const isSelected = selectedDay === day;
              const isToday = day === new Date().toISOString().split('T')[0];

              return (
                <button key={day} onClick={() => setSelectedDay(isSelected ? null : day)}
                  className={`w-full text-left p-3 rounded-xl transition-all ${
                    isSelected ? 'bg-cyan-500/10 border border-cyan-500/20' : 'hover:bg-white/[0.03] border border-transparent'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${
                      isToday ? 'bg-cyan-500 text-white' : isSelected ? 'bg-cyan-500/20' : 'bg-white/5'}`}>
                      <span className="text-[9px] uppercase font-bold text-white/50">{d.weekday}</span>
                      <span className="text-lg font-bold">{d.day}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-white/30">{d.month} {d.day} · Day {i + 1}</div>
                      {items.length > 0 ? (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {items.slice(0, 4).map((it) => (
                            <span key={it.id} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/40">
                              {ITEM_TYPES[it.type]?.icon || '📌'} {it.title.length > 15 ? it.title.slice(0, 15) + '…' : it.title}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[10px] text-white/15">No plans yet</span>
                      )}
                    </div>
                    {photos.length > 0 && <span className="text-[10px] text-white/20">📸{photos.length}</span>}
                  </div>
                </button>
              );
            })}
          </div>

          {/* ===== DAY DETAIL (right) ===== */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {selectedDay ? (
                <motion.div key={selectedDay} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <div className="glass rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-bold">
                        {new Date(selectedDay + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                      </h2>
                      <button onClick={() => setShowAddItem(true)}
                        className="px-4 py-2 rounded-xl bg-cyan-500/15 text-cyan-400 text-xs font-medium border border-cyan-500/20">
                        + Add Item
                      </button>
                    </div>

                    {/* Day items */}
                    <div className="space-y-3 mb-6">
                      {getItemsForDay(selectedDay).map((item) => {
                        const typeCfg = ITEM_TYPES[item.type] || ITEM_TYPES.other;
                        return (
                          <div key={item.id} className="flex gap-4 p-4 bg-white/[0.02] rounded-xl group hover:bg-white/[0.04] transition-colors">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${typeCfg.color}15` }}>
                              <span className="text-lg">{typeCfg.icon}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-medium">{item.title}</h4>
                                <span className="text-[10px] text-white/20 uppercase">{item.type}</span>
                              </div>
                              {(item.time || item.endTime) && (
                                <p className="text-xs text-cyan-400/60 mt-0.5">
                                  🕐 {item.time}{item.endTime ? ` – ${item.endTime}` : ''}
                                </p>
                              )}
                              {item.details && <p className="text-white/30 text-xs mt-1">{item.details}</p>}
                              {item.address && <p className="text-white/20 text-[10px] mt-1">📍 {item.address}</p>}
                              {item.url && <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-cyan-400/50 text-[10px] hover:text-cyan-400 mt-1 inline-block">🔗 Link</a>}
                            </div>
                            <button onClick={() => handleDeleteItem(item.id)} className="text-white/10 hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                          </div>
                        );
                      })}
                      {getItemsForDay(selectedDay).length === 0 && (
                        <p className="text-white/15 text-sm text-center py-6">No plans for this day yet.</p>
                      )}
                    </div>

                    {/* Add item form */}
                    <AnimatePresence>
                      {showAddItem && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                          className="border-t border-white/5 pt-5 space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <input type="text" value={itemTitle} onChange={(e) => setItemTitle(e.target.value)} placeholder="Title..." autoFocus
                              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder-white/20 focus:outline-none" />
                            <select value={itemType} onChange={(e) => setItemType(e.target.value)}
                              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm [&>option]:bg-gray-900">
                              {Object.entries(ITEM_TYPES).map(([key, cfg]) => (<option key={key} value={key}>{cfg.icon} {key}</option>))}
                            </select>
                          </div>
                          <div className="flex gap-3">
                            <div><label className="text-[10px] text-white/25 block mb-0.5">Start</label>
                              <input type="time" value={itemTime} onChange={(e) => setItemTime(e.target.value)}
                                className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs [color-scheme:dark]" />
                            </div>
                            <div><label className="text-[10px] text-white/25 block mb-0.5">End</label>
                              <input type="time" value={itemEndTime} onChange={(e) => setItemEndTime(e.target.value)}
                                className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs [color-scheme:dark]" />
                            </div>
                          </div>
                          <input type="text" value={itemAddress} onChange={(e) => setItemAddress(e.target.value)} placeholder="Address..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder-white/20 focus:outline-none" />
                          <textarea value={itemDetails} onChange={(e) => setItemDetails(e.target.value)} placeholder="Details..." rows={2}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder-white/20 focus:outline-none resize-none" />
                          <input type="text" value={itemUrl} onChange={(e) => setItemUrl(e.target.value)} placeholder="Link (optional)"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder-white/20 focus:outline-none" />
                          <div className="flex gap-2">
                            <button onClick={handleAddItem} disabled={!itemTitle.trim()} className="px-5 py-2 rounded-xl bg-cyan-500/20 text-cyan-400 text-sm font-medium disabled:opacity-30">Add</button>
                            <button onClick={() => setShowAddItem(false)} className="px-4 py-2 rounded-xl bg-white/5 text-white/40 text-sm">Cancel</button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Photos section */}
                    <div className="border-t border-white/5 mt-6 pt-5">
                      <h3 className="text-sm font-medium text-white/40 mb-3">📸 Photos</h3>
                      {getPhotosForDay(selectedDay).length > 0 && (
                        <div className="grid grid-cols-3 gap-2 mb-4">
                          {getPhotosForDay(selectedDay).map((photo, i) => (
                            <button key={photo.id} onClick={() => { setPhotoIndex(i); setShowPhotoViewer(true); }}
                              className="aspect-square rounded-lg overflow-hidden hover:ring-2 ring-cyan-500/50 transition-all">
                              <img src={photo.imageUrl} alt={photo.caption || ''} className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      )}
                      {/* Upload photo */}
                      <div className="flex gap-2">
                        <input type="text" value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)}
                          placeholder="Paste image URL..." className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder-white/20 focus:outline-none" />
                        <input type="text" value={photoCaption} onChange={(e) => setPhotoCaption(e.target.value)}
                          placeholder="Caption..." className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder-white/20 focus:outline-none" />
                        <button onClick={handleAddPhoto} disabled={!photoUrl.trim()}
                          className="px-4 py-2 rounded-xl bg-white/5 text-white/40 text-sm hover:text-white disabled:opacity-20">📸 Add</button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 text-white/15">
                  <div className="text-5xl mb-4">📋</div>
                  <p>Select a day from the itinerary to see details</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Photo viewer modal */}
      <AnimatePresence>
        {showPhotoViewer && selectedPhotos.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-6"
            onClick={() => setShowPhotoViewer(false)}>
            <button onClick={() => setShowPhotoViewer(false)} className="absolute top-6 right-6 text-white/50 hover:text-white text-2xl z-10">✕</button>
            <button onClick={(e) => { e.stopPropagation(); setPhotoIndex(Math.max(0, photoIndex - 1)); }}
              className="absolute left-6 text-white/30 hover:text-white text-3xl">←</button>
            <div className="max-w-4xl max-h-[80vh] relative" onClick={(e) => e.stopPropagation()}>
              <img src={selectedPhotos[photoIndex]?.imageUrl} alt="" className="max-w-full max-h-[75vh] object-contain rounded-xl" />
              {selectedPhotos[photoIndex]?.caption && (
                <p className="text-center text-white/60 text-sm mt-3">{selectedPhotos[photoIndex].caption}</p>
              )}
              <p className="text-center text-white/20 text-xs mt-1">
                {photoIndex + 1} / {selectedPhotos.length}
                {selectedPhotos[photoIndex]?.uploadedBy && ` · by ${selectedPhotos[photoIndex].uploadedBy}`}
              </p>
            </div>
            <button onClick={(e) => { e.stopPropagation(); setPhotoIndex(Math.min(selectedPhotos.length - 1, photoIndex + 1)); }}
              className="absolute right-6 text-white/30 hover:text-white text-3xl">→</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function TripPage() {
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-4xl animate-pulse">✈️</div></div>}><TripContent /></Suspense>;
}

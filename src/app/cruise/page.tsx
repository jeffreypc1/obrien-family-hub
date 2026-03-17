'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useFamilyMember } from '@/components/FamilyContext';
import ThemedBackground from '@/components/ThemedBackground';

// ─── Types ─────────────────────────────────────────────────

interface CruiseChoice {
  id: string;
  activityId: string;
  userName: string;
  choice: string;
  customStartTime: string | null;
  customEndTime: string | null;
  comment: string | null;
}

interface CruiseActivity {
  id: string;
  dayId: string;
  name: string;
  description: string | null;
  startTime: string;
  endTime: string;
  cost: number | null;
  location: string | null;
  type: string;
  isRecommended: boolean;
  sortOrder: number;
  choices: CruiseChoice[];
}

interface CruiseDay {
  id: string;
  dayNumber: number;
  date: string;
  portName: string | null;
  isSeaDay: boolean;
  arrivalTime: string | null;
  departureTime: string | null;
  description: string | null;
  activities: CruiseActivity[];
}

// ─── Constants ─────────────────────────────────────────────

const TYPE_ICONS: Record<string, string> = {
  excursion: '🗺️',
  dining: '🍽️',
  event: '🎉',
  show: '🎭',
  port: '🚢',
};

const TYPE_COLORS: Record<string, string> = {
  excursion: '#3B82F6',
  dining: '#F59E0B',
  event: '#8B5CF6',
  show: '#EC4899',
  port: '#06B6D4',
};

const TYPE_LABELS: Record<string, string> = {
  excursion: 'Shore Excursion',
  dining: 'Dining',
  event: 'Activity',
  show: 'Entertainment',
  port: 'Ship Event',
};

type ColumnKey = 'skip' | 'maybe' | 'definitely';
type FilterType = 'all' | 'excursion' | 'dining' | 'event' | 'show' | 'port';

const COLUMNS: { key: ColumnKey; label: string; icon: string; accent: string; bgHover: string }[] = [
  { key: 'skip', label: 'Skip', icon: '⏭️', accent: 'rgba(255,255,255,0.15)', bgHover: 'rgba(255,255,255,0.08)' },
  { key: 'maybe', label: 'Interested', icon: '🤔', accent: 'rgba(245,158,11,0.5)', bgHover: 'rgba(245,158,11,0.08)' },
  { key: 'definitely', label: 'Going!', icon: '✅', accent: 'rgba(34,197,94,0.5)', bgHover: 'rgba(34,197,94,0.08)' },
];

// Port metadata: weather, flags, tips
const PORT_DATA: Record<string, { flag: string; country: string; tempC: number; tempF: number; condition: string; icon: string; humidity: number; wind: string; tip: string }> = {
  'Civitavecchia (Rome), Italy': { flag: '🇮🇹', country: 'Italy', tempC: 28, tempF: 82, condition: 'Sunny', icon: '☀️', humidity: 55, wind: '8 mph', tip: 'Sunscreen & comfortable walking shoes for cobblestones' },
  'Katakolon (Olympia), Greece': { flag: '🇬🇷', country: 'Greece', tempC: 30, tempF: 86, condition: 'Sunny & Hot', icon: '🌞', humidity: 45, wind: '6 mph', tip: 'Bring a hat and water — ruins have no shade' },
  'Santorini, Greece': { flag: '🇬🇷', country: 'Greece', tempC: 27, tempF: 81, condition: 'Sunny & Breezy', icon: '🌤️', humidity: 50, wind: '14 mph', tip: 'Windy on the caldera — secure hats & bring a light layer' },
  'Kusadasi (Ephesus), Turkey': { flag: '🇹🇷', country: 'Turkey', tempC: 32, tempF: 90, condition: 'Hot & Sunny', icon: '🔥', humidity: 35, wind: '5 mph', tip: 'Hottest port — bring extra water, wear breathable clothes' },
  'Amalfi Coast (Salerno), Italy': { flag: '🇮🇹', country: 'Italy', tempC: 27, tempF: 81, condition: 'Partly Cloudy', icon: '⛅', humidity: 60, wind: '7 mph', tip: 'Perfect weather — bring a camera for the cliffside views' },
};
const SEA_DAY_WEATHER = { tempC: 25, tempF: 77, condition: 'Clear Skies', icon: '🌊', humidity: 65, wind: '10 mph', tip: 'Great pool day — don\'t forget sunscreen!' };

function getPortWeather(day: CruiseDay) {
  if (day.isSeaDay) return SEA_DAY_WEATHER;
  return PORT_DATA[day.portName || ''] || SEA_DAY_WEATHER;
}

function getPortFlag(portName: string | null): string {
  if (!portName) return '🌊';
  return PORT_DATA[portName]?.flag || '📍';
}

// Countdown
function getCountdown(targetDate: string): { days: number; hours: number; mins: number; past: boolean } {
  const now = new Date();
  const target = new Date(targetDate + 'T00:00:00');
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) return { days: 0, hours: 0, mins: 0, past: true };
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return { days, hours, mins, past: false };
}

const FONT_SIZES = [
  { label: 'S', value: 14 },
  { label: 'M', value: 16 },
  { label: 'L', value: 18 },
  { label: 'XL', value: 21 },
  { label: '2XL', value: 24 },
];

// ─── Helpers ───────────────────────────────────────────────

function formatTime(t: string): string {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hr = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hr}:${m.toString().padStart(2, '0')} ${ampm}`;
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function minutesToDisplay(mins: number): string {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

// ─── Activity Card ─────────────────────────────────────────

function ActivityCard({
  activity, currentUser, allChoices, dragging, onDragStart, members, fontSize, onCardClick,
}: {
  activity: CruiseActivity;
  currentUser: string;
  allChoices: CruiseChoice[];
  dragging: string | null;
  onDragStart: (id: string) => void;
  members: { name: string; emoji: string; color: string }[];
  fontSize: number;
  onCardClick: (activity: CruiseActivity) => void;
}) {
  const isDragging = dragging === activity.id;
  const typeIcon = TYPE_ICONS[activity.type] || '📌';
  const typeColor = TYPE_COLORS[activity.type] || '#6B7280';
  const scale = fontSize / 16;

  const myChoice = allChoices.find(c => c.activityId === activity.id && c.userName === currentUser);
  const displayStart = myChoice?.customStartTime || activity.startTime;
  const displayEnd = myChoice?.customEndTime || activity.endTime;
  const hasCustomTime = !!(myChoice?.customStartTime || myChoice?.customEndTime);
  const duration = timeToMinutes(displayEnd) - timeToMinutes(displayStart);
  const durationDisplay = minutesToDisplay(duration > 0 ? duration : duration + 24 * 60);

  const otherChoices = allChoices.filter(c => c.activityId === activity.id && c.userName !== currentUser);
  const goingMembers = otherChoices.filter(c => c.choice === 'definitely');
  const maybeMembers = otherChoices.filter(c => c.choice === 'maybe');

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: isDragging ? 0.4 : 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      draggable
      onDragStart={(e) => {
        onDragStart(activity.id);
        if (e && 'dataTransfer' in e) {
          const de = e as unknown as React.DragEvent;
          de.dataTransfer.setData('text/plain', activity.id);
          de.dataTransfer.effectAllowed = 'move';
        }
      }}
      onClick={() => onCardClick(activity)}
      className={`glass rounded-2xl cursor-pointer hover:bg-white/[0.06] active:scale-[0.98] transition-all group relative ${
        activity.isRecommended ? 'ring-1 ring-amber-400/40' : ''
      }`}
      style={{ padding: `${12 * scale}px ${14 * scale}px` }}
    >
      {activity.isRecommended && (
        <div className="absolute -top-2.5 -right-2 bg-amber-500 text-black font-bold rounded-full"
          style={{ fontSize: 10 * scale, padding: `${2 * scale}px ${6 * scale}px` }}>
          ⭐ FAMILY
        </div>
      )}

      <div className="flex items-start gap-3">
        <div className="rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ width: 36 * scale, height: 36 * scale, backgroundColor: `${typeColor}20`, color: typeColor, fontSize: 16 * scale }}>
          {typeIcon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold leading-tight" style={{ fontSize: 15 * scale }}>{activity.name}</p>

          <div className="flex items-center gap-2 flex-wrap" style={{ marginTop: 4 * scale }}>
            <span className={`font-medium ${hasCustomTime ? 'text-cyan-400' : ''}`}
              style={{ fontSize: 13 * scale, color: hasCustomTime ? undefined : 'rgba(255,255,255,0.6)' }}>
              {formatTime(displayStart)} – {formatTime(displayEnd)}
            </span>
            <span style={{ fontSize: 11 * scale, color: 'rgba(255,255,255,0.25)' }}>{durationDisplay}</span>
            {hasCustomTime && <span className="text-cyan-400/40" style={{ fontSize: 9 * scale }}>✏️ custom</span>}
          </div>

          {myChoice?.comment && (
            <p className="text-cyan-400/50 italic" style={{ fontSize: 11 * scale, marginTop: 3 * scale }}>
              &ldquo;{myChoice.comment}&rdquo;
            </p>
          )}

          {activity.description && (
            <p className="line-clamp-2" style={{ fontSize: 12 * scale, color: 'rgba(255,255,255,0.3)', marginTop: 4 * scale }}>
              {activity.description}
            </p>
          )}

          <div className="flex items-center gap-2 flex-wrap" style={{ marginTop: 6 * scale }}>
            {activity.cost != null && activity.cost > 0 && (
              <span className="rounded-lg bg-green-500/10 text-green-400 font-semibold border border-green-500/15"
                style={{ fontSize: 11 * scale, padding: `${2 * scale}px ${6 * scale}px` }}>
                ${activity.cost}/pp
              </span>
            )}
            {activity.location && (
              <span style={{ fontSize: 11 * scale, color: 'rgba(255,255,255,0.25)' }}>📍 {activity.location}</span>
            )}
            <span className="rounded-lg"
              style={{ fontSize: 10 * scale, padding: `${1 * scale}px ${5 * scale}px`, backgroundColor: `${typeColor}15`, color: typeColor }}>
              {TYPE_LABELS[activity.type] || activity.type}
            </span>
          </div>

          {(goingMembers.length > 0 || maybeMembers.length > 0) && (
            <div className="flex items-center gap-1.5 flex-wrap" style={{ marginTop: 8 * scale }}>
              {goingMembers.map(c => {
                const m = members.find(mem => mem.name === c.userName);
                const ct = c.customStartTime ? formatTime(c.customStartTime) : '';
                return (
                  <span key={c.id} className="rounded-full bg-green-500/10 border border-green-500/20 flex items-center gap-1"
                    style={{ fontSize: 12 * scale, padding: `${1 * scale}px ${6 * scale}px` }}
                    title={`${c.userName}${ct ? ` @ ${ct}` : ''}${c.comment ? `: ${c.comment}` : ''}`}>
                    {m?.emoji || '👤'}{ct && <span className="text-green-400/50" style={{ fontSize: 9 * scale }}>{ct}</span>}
                  </span>
                );
              })}
              {maybeMembers.map(c => {
                const m = members.find(mem => mem.name === c.userName);
                return (
                  <span key={c.id} className="rounded-full bg-amber-500/10 border border-amber-500/20"
                    style={{ fontSize: 12 * scale, padding: `${1 * scale}px ${6 * scale}px` }}
                    title={`${c.userName} is interested`}>
                    {m?.emoji || '👤'}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Activity Detail Modal ─────────────────────────────────

function ActivityModal({
  activity, currentUser, allChoices, members, onSave, onClose, fontSize, defaultStatus,
}: {
  activity: CruiseActivity;
  currentUser: string;
  allChoices: CruiseChoice[];
  members: { name: string; emoji: string; color: string }[];
  onSave: (activityId: string, choice: ColumnKey, startTime: string | null, endTime: string | null, comment: string | null) => void;
  onClose: () => void;
  fontSize: number;
  defaultStatus?: ColumnKey;
}) {
  const scale = fontSize / 16;
  const typeIcon = TYPE_ICONS[activity.type] || '📌';
  const typeColor = TYPE_COLORS[activity.type] || '#6B7280';
  const myChoice = allChoices.find(c => c.activityId === activity.id && c.userName === currentUser);
  const currentStatus = defaultStatus || (myChoice?.choice as ColumnKey) || 'skip';

  const [status, setStatus] = useState<ColumnKey>(currentStatus);
  const [startTime, setStartTime] = useState(myChoice?.customStartTime || activity.startTime);
  const [endTime, setEndTime] = useState(myChoice?.customEndTime || activity.endTime);
  const [comment, setComment] = useState(myChoice?.comment || '');
  const [useCustomTime, setUseCustomTime] = useState(!!(myChoice?.customStartTime || myChoice?.customEndTime));

  const otherChoices = allChoices.filter(c => c.activityId === activity.id && c.userName !== currentUser);
  const goingMembers = otherChoices.filter(c => c.choice === 'definitely');
  const maybeMembers = otherChoices.filter(c => c.choice === 'maybe');
  const duration = timeToMinutes(endTime) - timeToMinutes(startTime);
  const durationDisplay = minutesToDisplay(duration > 0 ? duration : duration + 24 * 60);

  const handleSave = () => {
    onSave(
      activity.id,
      status,
      useCustomTime ? startTime : null,
      useCustomTime ? endTime : null,
      comment.trim() || null,
    );
    onClose();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <motion.div initial={{ scale: 0.93, y: 30 }} animate={{ scale: 1, y: 0 }}
        onClick={e => e.stopPropagation()}
        className="relative glass rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        style={{ padding: `${24 * scale}px` }}>

        {/* Close */}
        <button onClick={onClose} className="absolute top-4 right-4 text-white/30 hover:text-white/60 transition-colors"
          style={{ fontSize: 20 * scale }}>✕</button>

        {/* Header */}
        <div className="flex items-start gap-3" style={{ marginBottom: 16 * scale }}>
          <div className="rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ width: 48 * scale, height: 48 * scale, backgroundColor: `${typeColor}20`, color: typeColor, fontSize: 22 * scale }}>
            {typeIcon}
          </div>
          <div>
            <h2 className="font-bold" style={{ fontSize: 20 * scale }}>{activity.name}</h2>
            <p className="text-white/40" style={{ fontSize: 13 * scale }}>
              {TYPE_LABELS[activity.type]} · {formatTime(activity.startTime)} – {formatTime(activity.endTime)}
            </p>
          </div>
        </div>

        {activity.description && (
          <p className="text-white/40" style={{ fontSize: 13 * scale, marginBottom: 12 * scale }}>{activity.description}</p>
        )}

        <div className="flex items-center gap-3 flex-wrap" style={{ marginBottom: 20 * scale }}>
          {activity.cost != null && activity.cost > 0 && (
            <span className="rounded-xl bg-green-500/10 text-green-400 font-semibold border border-green-500/15"
              style={{ fontSize: 13 * scale, padding: `${4 * scale}px ${10 * scale}px` }}>
              💰 ${activity.cost}/person
            </span>
          )}
          {activity.location && (
            <span className="text-white/30" style={{ fontSize: 13 * scale }}>📍 {activity.location}</span>
          )}
          {activity.isRecommended && (
            <span className="rounded-xl bg-amber-500/10 text-amber-400 font-semibold border border-amber-500/15"
              style={{ fontSize: 12 * scale, padding: `${3 * scale}px ${8 * scale}px` }}>
              ⭐ Recommended for all
            </span>
          )}
        </div>

        {/* Who else is going */}
        {(goingMembers.length > 0 || maybeMembers.length > 0) && (
          <div className="rounded-xl bg-white/[0.03] border border-white/5" style={{ padding: `${12 * scale}px`, marginBottom: 20 * scale }}>
            <p className="text-white/30 font-semibold" style={{ fontSize: 11 * scale, marginBottom: 8 * scale }}>
              WHO ELSE
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 * scale }}>
              {goingMembers.map(c => {
                const m = members.find(mem => mem.name === c.userName);
                return (
                  <div key={c.id} className="flex items-center gap-2">
                    <span style={{ fontSize: 16 * scale }}>{m?.emoji || '👤'}</span>
                    <span className="font-medium text-green-400/80" style={{ fontSize: 13 * scale }}>{c.userName}</span>
                    <span className="text-green-400/40" style={{ fontSize: 11 * scale }}>going</span>
                    {c.customStartTime && (
                      <span className="text-white/25" style={{ fontSize: 11 * scale }}>
                        @ {formatTime(c.customStartTime)}–{formatTime(c.customEndTime || activity.endTime)}
                      </span>
                    )}
                    {c.comment && (
                      <span className="text-white/20 italic" style={{ fontSize: 11 * scale }}>&ldquo;{c.comment}&rdquo;</span>
                    )}
                  </div>
                );
              })}
              {maybeMembers.map(c => {
                const m = members.find(mem => mem.name === c.userName);
                return (
                  <div key={c.id} className="flex items-center gap-2">
                    <span style={{ fontSize: 16 * scale }}>{m?.emoji || '👤'}</span>
                    <span className="font-medium text-amber-400/80" style={{ fontSize: 13 * scale }}>{c.userName}</span>
                    <span className="text-amber-400/40" style={{ fontSize: 11 * scale }}>interested</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-white/10" style={{ marginBottom: 16 * scale }} />

        {/* Your Status */}
        <p className="text-white/40 font-semibold" style={{ fontSize: 12 * scale, marginBottom: 8 * scale }}>YOUR STATUS</p>
        <div className="flex gap-2" style={{ marginBottom: 16 * scale }}>
          {COLUMNS.map(col => (
            <button key={col.key} onClick={() => setStatus(col.key)}
              className={`flex-1 rounded-xl font-semibold transition-all text-center ${
                status === col.key ? 'ring-2' : 'bg-white/5 text-white/40 hover:bg-white/10'
              }`}
              style={{
                fontSize: 13 * scale,
                padding: `${10 * scale}px ${8 * scale}px`,
                ...(status === col.key ? {
                  backgroundColor: col.key === 'definitely' ? 'rgba(34,197,94,0.15)' : col.key === 'maybe' ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.05)',
                  color: col.key === 'definitely' ? '#4ADE80' : col.key === 'maybe' ? '#FBBF24' : 'rgba(255,255,255,0.5)',
                  ringColor: col.key === 'definitely' ? 'rgba(34,197,94,0.4)' : col.key === 'maybe' ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.15)',
                } : {}),
              }}>
              {col.icon} {col.label}
            </button>
          ))}
        </div>

        {/* Custom Time */}
        {(status === 'definitely' || status === 'maybe') && (
          <>
            <div className="flex items-center justify-between" style={{ marginBottom: 8 * scale }}>
              <p className="text-white/40 font-semibold" style={{ fontSize: 12 * scale }}>YOUR TIME</p>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-white/25" style={{ fontSize: 11 * scale }}>Custom time</span>
                <div className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${useCustomTime ? 'bg-cyan-500/40' : 'bg-white/10'}`}
                  onClick={() => { setUseCustomTime(!useCustomTime); if (!useCustomTime) { setStartTime(myChoice?.customStartTime || activity.startTime); setEndTime(myChoice?.customEndTime || activity.endTime); } }}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${useCustomTime ? 'left-5' : 'left-0.5'}`} />
                </div>
              </label>
            </div>

            {useCustomTime ? (
              <div className="flex items-center gap-3" style={{ marginBottom: 16 * scale }}>
                <div className="flex-1">
                  <label className="text-white/20 block" style={{ fontSize: 10 * scale, marginBottom: 3 * scale }}>Start</label>
                  <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
                    className="w-full bg-white/10 border border-cyan-500/30 rounded-xl text-cyan-400 focus:outline-none focus:border-cyan-400"
                    style={{ fontSize: 15 * scale, padding: `${8 * scale}px ${10 * scale}px` }} />
                </div>
                <span className="text-white/20 mt-4" style={{ fontSize: 14 * scale }}>→</span>
                <div className="flex-1">
                  <label className="text-white/20 block" style={{ fontSize: 10 * scale, marginBottom: 3 * scale }}>End</label>
                  <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)}
                    className="w-full bg-white/10 border border-cyan-500/30 rounded-xl text-cyan-400 focus:outline-none focus:border-cyan-400"
                    style={{ fontSize: 15 * scale, padding: `${8 * scale}px ${10 * scale}px` }} />
                </div>
                <span className="text-white/20 mt-4" style={{ fontSize: 11 * scale }}>{durationDisplay}</span>
              </div>
            ) : (
              <p className="text-white/20" style={{ fontSize: 12 * scale, marginBottom: 16 * scale }}>
                Using default: {formatTime(activity.startTime)} – {formatTime(activity.endTime)}
              </p>
            )}

            {/* Comment */}
            <p className="text-white/40 font-semibold" style={{ fontSize: 12 * scale, marginBottom: 6 * scale }}>NOTE (optional)</p>
            <textarea value={comment} onChange={e => setComment(e.target.value)}
              placeholder="e.g., Meeting at elevator Deck 5 at 6:45..."
              rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 resize-none focus:outline-none focus:border-white/20"
              style={{ fontSize: 13 * scale, padding: `${8 * scale}px ${10 * scale}px`, marginBottom: 16 * scale }} />
          </>
        )}

        {/* Save */}
        <button onClick={handleSave}
          className="w-full rounded-xl font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{
            fontSize: 15 * scale,
            padding: `${12 * scale}px`,
            background: status === 'definitely' ? 'linear-gradient(135deg, rgba(34,197,94,0.3), rgba(16,185,129,0.3))' :
                        status === 'maybe' ? 'linear-gradient(135deg, rgba(245,158,11,0.3), rgba(234,179,8,0.3))' :
                        'rgba(255,255,255,0.05)',
            color: status === 'definitely' ? '#4ADE80' : status === 'maybe' ? '#FBBF24' : 'rgba(255,255,255,0.5)',
            border: `1px solid ${status === 'definitely' ? 'rgba(34,197,94,0.3)' : status === 'maybe' ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.1)'}`,
          }}>
          {status === 'definitely' ? '✅ Save — I\'m Going!' : status === 'maybe' ? '🤔 Save — Interested' : '⏭️ Save — Skip'}
        </button>
      </motion.div>
    </motion.div>
  );
}

// ─── What's Everyone Doing? ────────────────────────────────

function WhatEveryoneDoing({
  day, allChoices, members, currentUser, onJoin, fontSize,
}: {
  day: CruiseDay;
  allChoices: CruiseChoice[];
  members: { name: string; emoji: string; color: string }[];
  currentUser: string;
  onJoin: (activityId: string) => void;
  fontSize: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const scale = fontSize / 16;
  const dayChoices = allChoices.filter(c => day.activities.some(a => a.id === c.activityId));

  // Activities that at least one other person is doing
  const popularActivities = day.activities
    .map(a => {
      const goers = dayChoices.filter(c => c.activityId === a.id && c.choice === 'definitely' && c.userName !== currentUser);
      const maybes = dayChoices.filter(c => c.activityId === a.id && c.choice === 'maybe' && c.userName !== currentUser);
      const myChoice = dayChoices.find(c => c.activityId === a.id && c.userName === currentUser);
      return { activity: a, goers, maybes, myChoice };
    })
    .filter(x => x.goers.length > 0 || x.maybes.length > 0)
    .sort((a, b) => b.goers.length - a.goers.length);

  if (popularActivities.length === 0) return null;

  return (
    <div className="glass rounded-2xl overflow-hidden">
      <button onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between hover:bg-white/[0.02] transition-colors"
        style={{ padding: `${14 * scale}px ${16 * scale}px` }}>
        <div className="flex items-center gap-3">
          <span style={{ fontSize: 20 * scale }}>🔍</span>
          <span className="font-semibold" style={{ fontSize: 15 * scale }}>What&apos;s Everyone Doing?</span>
          <span className="rounded-full bg-cyan-500/15 text-cyan-400 font-medium"
            style={{ fontSize: 11 * scale, padding: `${2 * scale}px ${8 * scale}px` }}>
            {popularActivities.length} activities
          </span>
        </div>
        <span className={`text-white/30 transition-transform ${expanded ? 'rotate-180' : ''}`} style={{ fontSize: 14 * scale }}>▾</span>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div style={{ padding: `0 ${16 * scale}px ${16 * scale}px` }}>
              <p className="text-white/25 mb-3" style={{ fontSize: 11 * scale }}>
                See what family members are doing and join them!
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 * scale }}>
                {popularActivities.map(({ activity: a, goers, maybes, myChoice }) => {
                  const typeColor = TYPE_COLORS[a.type] || '#6B7280';
                  const amGoing = myChoice?.choice === 'definitely';
                  const amMaybe = myChoice?.choice === 'maybe';
                  return (
                    <div key={a.id} className="rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all"
                      style={{ padding: `${10 * scale}px ${12 * scale}px` }}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span style={{ fontSize: 14 * scale }}>{TYPE_ICONS[a.type] || '📌'}</span>
                            <span className="font-semibold" style={{ fontSize: 14 * scale }}>{a.name}</span>
                            <span className="rounded-lg"
                              style={{ fontSize: 9 * scale, padding: `${1 * scale}px ${4 * scale}px`, backgroundColor: `${typeColor}15`, color: typeColor }}>
                              {TYPE_LABELS[a.type]}
                            </span>
                          </div>
                          <p className="text-white/40" style={{ fontSize: 12 * scale }}>
                            {formatTime(a.startTime)} – {formatTime(a.endTime)}
                            {a.location && <span className="text-white/20"> · 📍 {a.location}</span>}
                          </p>
                          {/* Who's going */}
                          <div className="flex items-center gap-2 flex-wrap" style={{ marginTop: 6 * scale }}>
                            {goers.map(c => {
                              const m = members.find(mem => mem.name === c.userName);
                              return (
                                <span key={c.id} className="rounded-lg bg-green-500/10 border border-green-500/15 flex items-center gap-1"
                                  style={{ fontSize: 11 * scale, padding: `${2 * scale}px ${6 * scale}px` }}>
                                  <span>{m?.emoji || '👤'}</span>
                                  <span className="text-green-400/70">{c.userName}</span>
                                  {c.customStartTime && (
                                    <span className="text-green-400/40" style={{ fontSize: 9 * scale }}>@ {formatTime(c.customStartTime)}</span>
                                  )}
                                </span>
                              );
                            })}
                            {maybes.map(c => {
                              const m = members.find(mem => mem.name === c.userName);
                              return (
                                <span key={c.id} className="rounded-lg bg-amber-500/10 border border-amber-500/15 flex items-center gap-1"
                                  style={{ fontSize: 11 * scale, padding: `${2 * scale}px ${6 * scale}px` }}>
                                  <span>{m?.emoji || '👤'}</span>
                                  <span className="text-amber-400/70">{c.userName}</span>
                                  <span className="text-amber-400/30" style={{ fontSize: 9 * scale }}>maybe</span>
                                </span>
                              );
                            })}
                          </div>
                        </div>
                        {/* Join button */}
                        <div className="flex-shrink-0">
                          {amGoing ? (
                            <span className="rounded-xl bg-green-500/15 text-green-400 border border-green-500/20 font-medium"
                              style={{ fontSize: 11 * scale, padding: `${5 * scale}px ${10 * scale}px`, display: 'block' }}>
                              ✅ Going
                            </span>
                          ) : (
                            <button onClick={() => onJoin(a.id)}
                              className="rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/20 font-semibold hover:bg-cyan-500/25 transition-all"
                              style={{ fontSize: 12 * scale, padding: `${6 * scale}px ${12 * scale}px` }}>
                              {amMaybe ? '🙋 Join!' : '+ Join'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Timeline Gap ──────────────────────────────────────────

function TimelineSpacer({ minutes, isOverlap, fontSize }: { minutes: number; isOverlap?: boolean; fontSize: number }) {
  if (minutes <= 0) return null;
  const scale = fontSize / 16;

  if (isOverlap) {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-red-500/10 border border-red-500/20"
        style={{ padding: `${8 * scale}px ${14 * scale}px`, margin: `${3 * scale}px 0` }}>
        <div className="flex-1 border-t border-dashed border-red-500/20" />
        <span className="flex-shrink-0 text-red-400 font-bold" style={{ fontSize: 14 * scale }}>
          ⚠️ {minutesToDisplay(minutes)} overlap!
        </span>
        <div className="flex-1 border-t border-dashed border-red-500/20" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-xl bg-green-500/8 border border-green-500/15"
      style={{ padding: `${8 * scale}px ${14 * scale}px`, margin: `${3 * scale}px 0` }}>
      <div className="flex-1 border-t border-dashed border-green-500/20" />
      <span className="flex-shrink-0 text-green-400 font-bold" style={{ fontSize: 14 * scale }}>
        ⏳ {minutesToDisplay(minutes)} free
      </span>
      <div className="flex-1 border-t border-dashed border-green-500/20" />
    </div>
  );
}

// ─── Add Activity Modal (user-friendly) ────────────────────

const QUICK_TYPES = [
  { key: 'restaurant', label: 'Restaurant / Cafe', icon: '🍽️', type: 'dining' },
  { key: 'excursion', label: 'Shore Excursion', icon: '🗺️', type: 'excursion' },
  { key: 'viator', label: 'Viator / GetYourGuide', icon: '🎫', type: 'excursion' },
  { key: 'activity', label: 'Activity / Sightseeing', icon: '📸', type: 'event' },
  { key: 'show', label: 'Show / Entertainment', icon: '🎭', type: 'show' },
  { key: 'other', label: 'Other', icon: '📌', type: 'event' },
];

function AddActivityModal({
  dayId, dayLabel, onClose, onAdded, fontSize, userName,
}: {
  dayId: string;
  dayLabel: string;
  onClose: () => void;
  onAdded: () => void;
  fontSize: number;
  userName: string;
}) {
  const scale = fontSize / 16;
  const [step, setStep] = useState<'type' | 'details'>('type');
  const [selectedType, setSelectedType] = useState(QUICK_TYPES[0]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('12:00');
  const [cost, setCost] = useState('');
  const [location, setLocation] = useState('');
  const [link, setLink] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);

    // 1) Create the activity
    const res = await fetch('/api/cruise/activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dayId,
        name: name.trim(),
        description: [description, link ? `🔗 ${link}` : ''].filter(Boolean).join('\n') || null,
        startTime,
        endTime,
        cost: cost ? parseFloat(cost) : null,
        location: location || null,
        type: selectedType.type,
        isRecommended: false,
      }),
    });
    const activity = await res.json();

    // 2) Auto-mark the creator as "Going!"
    await fetch('/api/cruise/choices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        activityId: activity.id,
        userName,
        choice: 'definitely',
        customStartTime: startTime,
        customEndTime: endTime,
      }),
    });

    setSaving(false);
    onAdded();
    onClose();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <motion.div initial={{ scale: 0.93, y: 30 }} animate={{ scale: 1, y: 0 }}
        onClick={e => e.stopPropagation()}
        className="relative glass rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        style={{ padding: `${24 * scale}px` }}>

        <button onClick={onClose} className="absolute top-4 right-4 text-white/30 hover:text-white/60"
          style={{ fontSize: 20 * scale }}>✕</button>

        <h2 className="font-bold" style={{ fontSize: 20 * scale, marginBottom: 4 * scale }}>
          ➕ Add to {dayLabel}
        </h2>
        <p className="text-white/35" style={{ fontSize: 12 * scale, marginBottom: 20 * scale }}>
          Add a restaurant, excursion, Viator tour, or anything else
        </p>

        {step === 'type' ? (
          <>
            <p className="text-white/40 font-semibold" style={{ fontSize: 12 * scale, marginBottom: 10 * scale }}>
              WHAT KIND?
            </p>
            <div className="grid grid-cols-2" style={{ gap: 8 * scale, marginBottom: 20 * scale }}>
              {QUICK_TYPES.map(qt => (
                <button key={qt.key}
                  onClick={() => { setSelectedType(qt); setStep('details'); }}
                  className="rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.08] hover:border-white/20 transition-all text-left"
                  style={{ padding: `${12 * scale}px ${14 * scale}px` }}>
                  <span style={{ fontSize: 24 * scale }}>{qt.icon}</span>
                  <p className="font-semibold text-white/80" style={{ fontSize: 13 * scale, marginTop: 4 * scale }}>
                    {qt.label}
                  </p>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <button onClick={() => setStep('type')}
              className="text-white/30 hover:text-white/50 transition-all"
              style={{ fontSize: 12 * scale, marginBottom: 12 * scale }}>
              ← Back to type selection
            </button>

            <div className="flex items-center gap-2" style={{ marginBottom: 16 * scale }}>
              <span style={{ fontSize: 20 * scale }}>{selectedType.icon}</span>
              <span className="text-white/50 font-medium" style={{ fontSize: 13 * scale }}>{selectedType.label}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 * scale }}>
              {/* Name */}
              <div>
                <label className="text-white/30 font-semibold block" style={{ fontSize: 11 * scale, marginBottom: 4 * scale }}>
                  NAME *
                </label>
                <input value={name} onChange={e => setName(e.target.value)} autoFocus
                  placeholder={
                    selectedType.key === 'restaurant' ? 'e.g., Lunch at Trattoria da Mario' :
                    selectedType.key === 'viator' ? 'e.g., Skip-the-line Colosseum Tour' :
                    selectedType.key === 'excursion' ? 'e.g., Ancient Olympia Walking Tour' :
                    'e.g., Sunset photos from the cliff'
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/30"
                  style={{ fontSize: 14 * scale, padding: `${10 * scale}px ${12 * scale}px` }} />
              </div>

              {/* Time */}
              <div>
                <label className="text-white/30 font-semibold block" style={{ fontSize: 11 * scale, marginBottom: 4 * scale }}>
                  TIME
                </label>
                <div className="flex items-center" style={{ gap: 8 * scale }}>
                  <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500/30"
                    style={{ fontSize: 14 * scale, padding: `${8 * scale}px ${10 * scale}px` }} />
                  <span className="text-white/20" style={{ fontSize: 13 * scale }}>→</span>
                  <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500/30"
                    style={{ fontSize: 14 * scale, padding: `${8 * scale}px ${10 * scale}px` }} />
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="text-white/30 font-semibold block" style={{ fontSize: 11 * scale, marginBottom: 4 * scale }}>
                  LOCATION
                </label>
                <input value={location} onChange={e => setLocation(e.target.value)}
                  placeholder={
                    selectedType.key === 'restaurant' ? 'e.g., Via Roma 42, Fira' :
                    'e.g., Old Town, Santorini'
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/30"
                  style={{ fontSize: 14 * scale, padding: `${10 * scale}px ${12 * scale}px` }} />
              </div>

              {/* Cost + Link row */}
              <div className="flex" style={{ gap: 10 * scale }}>
                <div className="flex-1">
                  <label className="text-white/30 font-semibold block" style={{ fontSize: 11 * scale, marginBottom: 4 * scale }}>
                    COST PER PERSON
                  </label>
                  <input value={cost} onChange={e => setCost(e.target.value)}
                    placeholder="$ (optional)"
                    className="w-full bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/30"
                    style={{ fontSize: 14 * scale, padding: `${10 * scale}px ${12 * scale}px` }} />
                </div>
                <div className="flex-1">
                  <label className="text-white/30 font-semibold block" style={{ fontSize: 11 * scale, marginBottom: 4 * scale }}>
                    LINK (optional)
                  </label>
                  <input value={link} onChange={e => setLink(e.target.value)}
                    placeholder="viator.com/..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/30"
                    style={{ fontSize: 14 * scale, padding: `${10 * scale}px ${12 * scale}px` }} />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-white/30 font-semibold block" style={{ fontSize: 11 * scale, marginBottom: 4 * scale }}>
                  NOTES (optional)
                </label>
                <textarea value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="Any details, meeting point, booking reference..."
                  rows={2}
                  className="w-full bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 resize-none focus:outline-none focus:border-cyan-500/30"
                  style={{ fontSize: 13 * scale, padding: `${10 * scale}px ${12 * scale}px` }} />
              </div>

              {/* Save */}
              <button onClick={handleSave} disabled={saving || !name.trim()}
                className="w-full rounded-xl font-bold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-30"
                style={{
                  fontSize: 15 * scale,
                  padding: `${12 * scale}px`,
                  background: 'linear-gradient(135deg, rgba(6,182,212,0.3), rgba(59,130,246,0.3))',
                  color: '#67E8F9',
                  border: '1px solid rgba(6,182,212,0.3)',
                }}>
                {saving ? 'Adding...' : `${selectedType.icon} Add & Mark as Going!`}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── Packing List ──────────────────────────────────────────

interface PackingItemData {
  id: string; userName: string; category: string; name: string;
  packed: boolean; isCustom: boolean; sortOrder: number;
}

function PackingListPanel({
  userName, allMembers, onClose, fontSize,
}: {
  userName: string;
  allMembers: { name: string; emoji: string }[];
  onClose: () => void;
  fontSize: number;
}) {
  const scale = fontSize / 16;
  const [items, setItems] = useState<PackingItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('📌 Custom');
  const [viewUser, setViewUser] = useState(userName);
  const [familyProgress, setFamilyProgress] = useState<Record<string, { total: number; packed: number }>>({});

  const fetchItems = useCallback(async (user: string) => {
    setLoading(true);
    const res = await fetch(`/api/cruise/packing?userName=${encodeURIComponent(user)}`);
    const data = await res.json();
    setItems(data);
    setLoading(false);
  }, []);

  // Fetch family progress
  const fetchFamilyProgress = useCallback(async () => {
    const progress: Record<string, { total: number; packed: number }> = {};
    for (const m of allMembers) {
      const res = await fetch(`/api/cruise/packing?userName=${encodeURIComponent(m.name)}`);
      const data = await res.json();
      progress[m.name] = { total: data.length, packed: data.filter((i: PackingItemData) => i.packed).length };
    }
    setFamilyProgress(progress);
  }, [allMembers]);

  useEffect(() => { fetchItems(viewUser); }, [fetchItems, viewUser]);
  useEffect(() => { fetchFamilyProgress(); }, [fetchFamilyProgress]);

  const toggleItem = async (id: string, packed: boolean) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, packed } : i));
    await fetch('/api/cruise/packing', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'toggle', id, packed }),
    });
    fetchFamilyProgress();
  };

  const addItem = async () => {
    if (!newItemName.trim()) return;
    const res = await fetch('/api/cruise/packing', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add', userName: viewUser, name: newItemName.trim(), category: newItemCategory }),
    });
    const item = await res.json();
    setItems(prev => [...prev, item]);
    setNewItemName('');
    fetchFamilyProgress();
  };

  const deleteItem = async (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
    await fetch(`/api/cruise/packing?id=${id}`, { method: 'DELETE' });
    fetchFamilyProgress();
  };

  // Group by category
  const categories = [...new Set(items.map(i => i.category))];
  const totalPacked = items.filter(i => i.packed).length;
  const totalItems = items.length;
  const pctPacked = totalItems > 0 ? Math.round((totalPacked / totalItems) * 100) : 0;
  const isViewingSelf = viewUser === userName;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <motion.div
        initial={{ y: 50, scale: 0.95 }} animate={{ y: 0, scale: 1 }}
        onClick={e => e.stopPropagation()}
        className="relative glass rounded-t-3xl sm:rounded-3xl w-full sm:max-w-2xl max-h-[92vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="border-b border-white/10" style={{ padding: `${16 * scale}px ${20 * scale}px` }}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold flex items-center" style={{ fontSize: 20 * scale, gap: 8 * scale }}>
                🧳 Packing List
              </h2>
              <p className="text-white/30" style={{ fontSize: 12 * scale }}>
                {totalPacked}/{totalItems} packed · {pctPacked}% ready
              </p>
            </div>
            <button onClick={onClose} className="text-white/30 hover:text-white/60"
              style={{ fontSize: 22 * scale }}>✕</button>
          </div>

          {/* Progress bar */}
          <div className="rounded-full overflow-hidden bg-white/5" style={{ height: 8 * scale, marginTop: 10 * scale }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: pctPacked === 100 ? 'linear-gradient(90deg, #22C55E, #10B981)' : 'linear-gradient(90deg, #06B6D4, #3B82F6)' }}
              initial={{ width: 0 }} animate={{ width: `${pctPacked}%` }} transition={{ duration: 0.5 }}
            />
          </div>
          {pctPacked === 100 && (
            <p className="text-green-400 font-semibold text-center" style={{ fontSize: 13 * scale, marginTop: 6 * scale }}>
              ✅ All packed and ready to go!
            </p>
          )}
        </div>

        {/* Family member switcher */}
        <div className="border-b border-white/5 flex items-center overflow-x-auto"
          style={{ padding: `${8 * scale}px ${20 * scale}px`, gap: 6 * scale }}>
          {allMembers.map(m => {
            const prog = familyProgress[m.name];
            const pct = prog ? Math.round((prog.packed / prog.total) * 100) : 0;
            const isActive = viewUser === m.name;
            return (
              <button key={m.name} onClick={() => setViewUser(m.name)}
                className={`flex-shrink-0 flex items-center rounded-xl transition-all ${
                  isActive ? 'bg-cyan-500/15 ring-1 ring-cyan-500/30' : 'bg-white/[0.03] hover:bg-white/[0.06]'
                }`}
                style={{ padding: `${5 * scale}px ${10 * scale}px`, gap: 6 * scale }}>
                <span style={{ fontSize: 16 * scale }}>{m.emoji}</span>
                <div className="text-left hidden sm:block">
                  <p className={`font-medium ${isActive ? 'text-white' : 'text-white/50'}`} style={{ fontSize: 11 * scale }}>
                    {m.name}
                  </p>
                  <p className={pct === 100 ? 'text-green-400' : 'text-white/20'} style={{ fontSize: 9 * scale }}>
                    {prog ? `${pct}%` : '—'}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Items list */}
        <div className="flex-1 overflow-y-auto" style={{ padding: `${12 * scale}px ${20 * scale}px` }}>
          {loading ? (
            <div className="text-center py-10">
              <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                className="inline-block" style={{ fontSize: 32 * scale }}>🧳</motion.span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 * scale }}>
              {categories.map(cat => {
                const catItems = items.filter(i => i.category === cat);
                const catPacked = catItems.filter(i => i.packed).length;
                const allDone = catPacked === catItems.length;
                return (
                  <div key={cat}>
                    <div className="flex items-center justify-between" style={{ marginBottom: 6 * scale }}>
                      <h3 className="font-bold" style={{ fontSize: 14 * scale }}>
                        {cat}
                      </h3>
                      <span className={`font-medium ${allDone ? 'text-green-400' : 'text-white/25'}`}
                        style={{ fontSize: 11 * scale }}>
                        {allDone ? '✅' : `${catPacked}/${catItems.length}`}
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 * scale }}>
                      {catItems.map(item => (
                        <div key={item.id}
                          className={`flex items-center rounded-xl transition-all group ${
                            item.packed ? 'bg-green-500/[0.04]' : 'bg-white/[0.02] hover:bg-white/[0.04]'
                          }`}
                          style={{ padding: `${7 * scale}px ${10 * scale}px`, gap: 10 * scale }}>
                          <button
                            onClick={() => isViewingSelf && toggleItem(item.id, !item.packed)}
                            disabled={!isViewingSelf}
                            className={`flex-shrink-0 rounded-lg border-2 flex items-center justify-center transition-all ${
                              item.packed
                                ? 'bg-green-500/20 border-green-500/40 text-green-400'
                                : 'border-white/15 text-transparent hover:border-white/30'
                            }`}
                            style={{ width: 24 * scale, height: 24 * scale, fontSize: 13 * scale }}
                          >
                            {item.packed ? '✓' : ''}
                          </button>
                          <span className={`flex-1 ${item.packed ? 'line-through text-white/25' : 'text-white/70'}`}
                            style={{ fontSize: 14 * scale }}>
                            {item.name}
                          </span>
                          {item.isCustom && isViewingSelf && (
                            <button onClick={() => deleteItem(item.id)}
                              className="text-white/10 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                              style={{ fontSize: 12 * scale }}>✕</button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Add item footer */}
        {isViewingSelf && (
          <div className="border-t border-white/10" style={{ padding: `${12 * scale}px ${20 * scale}px` }}>
            <div className="flex items-center" style={{ gap: 8 * scale }}>
              <select value={newItemCategory} onChange={e => setNewItemCategory(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl text-white/60 [&>option]:bg-gray-900"
                style={{ fontSize: 12 * scale, padding: `${8 * scale}px ${6 * scale}px` }}>
                <option value="📄 Documents">📄 Documents</option>
                <option value="👕 Clothing">👕 Clothing</option>
                <option value="🧴 Toiletries">🧴 Toiletries</option>
                <option value="🏖️ Beach & Pool">🏖️ Beach</option>
                <option value="🔌 Electronics">🔌 Electronics</option>
                <option value="🚢 Cruise Essentials">🚢 Cruise</option>
                <option value="🎉 Fun & Comfort">🎉 Fun</option>
                <option value="📌 Custom">📌 Custom</option>
              </select>
              <input value={newItemName} onChange={e => setNewItemName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addItem()}
                placeholder="Add an item..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/30"
                style={{ fontSize: 14 * scale, padding: `${8 * scale}px ${12 * scale}px` }} />
              <button onClick={addItem} disabled={!newItemName.trim()}
                className="rounded-xl bg-cyan-500/20 text-cyan-400 font-semibold border border-cyan-500/20 hover:bg-cyan-500/30 transition-all disabled:opacity-30"
                style={{ fontSize: 13 * scale, padding: `${8 * scale}px ${14 * scale}px` }}>
                + Add
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── Admin Panel ───────────────────────────────────────────

function AdminPanel({
  days, onClose, onRefresh, fontSize, setFontSize,
}: {
  days: CruiseDay[];
  onClose: () => void;
  onRefresh: () => void;
  fontSize: number;
  setFontSize: (s: number) => void;
}) {
  const [activeTab, setActiveTab] = useState<'activities' | 'days' | 'settings'>('settings');
  const [selectedDay, setSelectedDay] = useState(days[0]?.id || '');
  const [form, setForm] = useState({
    name: '', description: '', startTime: '09:00', endTime: '12:00',
    cost: '', location: '', type: 'excursion', isRecommended: false,
  });
  const [saving, setSaving] = useState(false);
  const [dayForm, setDayForm] = useState({
    dayNumber: '', date: '', portName: '', isSeaDay: false,
    arrivalTime: '', departureTime: '', description: '',
  });

  const addActivity = async () => {
    if (!form.name || !selectedDay) return;
    setSaving(true);
    await fetch('/api/cruise/activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dayId: selectedDay, name: form.name, description: form.description || null,
        startTime: form.startTime, endTime: form.endTime,
        cost: form.cost ? parseFloat(form.cost) : null, location: form.location || null,
        type: form.type, isRecommended: form.isRecommended,
      }),
    });
    setForm({ name: '', description: '', startTime: '09:00', endTime: '12:00', cost: '', location: '', type: 'excursion', isRecommended: false });
    setSaving(false);
    onRefresh();
  };

  const addDay = async () => {
    if (!dayForm.dayNumber || !dayForm.date) return;
    setSaving(true);
    await fetch('/api/cruise/days', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dayNumber: parseInt(dayForm.dayNumber), date: dayForm.date,
        portName: dayForm.portName || null, isSeaDay: dayForm.isSeaDay,
        arrivalTime: dayForm.arrivalTime || null, departureTime: dayForm.departureTime || null,
        description: dayForm.description || null,
      }),
    });
    setDayForm({ dayNumber: '', date: '', portName: '', isSeaDay: false, arrivalTime: '', departureTime: '', description: '' });
    setSaving(false);
    onRefresh();
  };

  const deleteActivity = async (id: string) => {
    await fetch(`/api/cruise/activities?id=${id}`, { method: 'DELETE' });
    onRefresh();
  };

  const reseed = async () => {
    setSaving(true);
    await fetch('/api/cruise/seed?force=1', { method: 'POST' });
    setSaving(false);
    onRefresh();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }}
        onClick={e => e.stopPropagation()}
        className="relative glass rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col">

        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-xl font-bold">⚙️ Cruise Admin</h2>
          <button onClick={onClose} className="text-white/30 hover:text-white/60 text-2xl leading-none">✕</button>
        </div>

        <div className="flex gap-1 p-3 bg-white/[0.02]">
          {(['settings', 'activities', 'days'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab ? 'bg-white/10 text-white' : 'text-white/40'
              }`}>
              {tab === 'settings' ? '🎛️ Display' : tab === 'activities' ? '🗺️ Activities' : '📅 Days'}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold mb-3 text-white/70">Font Size</h3>
                <p className="text-xs text-white/30 mb-4">Adjust the text size across the entire cruise planner.</p>
                <div className="flex gap-2">
                  {FONT_SIZES.map(fs => (
                    <button key={fs.value} onClick={() => setFontSize(fs.value)}
                      className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                        fontSize === fs.value
                          ? 'bg-cyan-500/20 text-cyan-400 ring-1 ring-cyan-500/30'
                          : 'bg-white/5 text-white/40 hover:bg-white/10'
                      }`}
                      style={{ fontSize: fs.value }}>
                      {fs.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-white/20 mt-2 text-center">Current: {fontSize}px</p>
              </div>

              <div className="border-t border-white/10 pt-4">
                <h3 className="text-sm font-semibold mb-3 text-white/70">Data Management</h3>
                <button onClick={reseed} disabled={saving}
                  className="w-full py-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 font-medium hover:bg-red-500/20 transition-all disabled:opacity-30">
                  {saving ? 'Reseeding...' : '🔄 Reset & Reseed Itinerary Data'}
                </button>
                <p className="text-xs text-white/20 mt-2 text-center">This will delete all choices and reload the default itinerary.</p>
              </div>
            </div>
          )}

          {activeTab === 'activities' && (
            <>
              <div className="space-y-3">
                <select value={selectedDay} onChange={e => setSelectedDay(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm [&>option]:bg-gray-900">
                  {days.map(d => (
                    <option key={d.id} value={d.id}>Day {d.dayNumber} — {d.portName || 'Sea Day'} ({d.date})</option>
                  ))}
                </select>
                <input placeholder="Activity name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm placeholder-white/20" />
                <input placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm placeholder-white/20" />
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs text-white/30 mb-1 block">Start</label>
                    <input type="time" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm" /></div>
                  <div><label className="text-xs text-white/30 mb-1 block">End</label>
                    <input type="time" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm" /></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <input placeholder="Cost ($)" value={form.cost} onChange={e => setForm(f => ({ ...f, cost: e.target.value }))}
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm placeholder-white/20" />
                  <input placeholder="Location" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm placeholder-white/20" />
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm [&>option]:bg-gray-900">
                    <option value="excursion">🗺️ Excursion</option>
                    <option value="dining">🍽️ Dining</option>
                    <option value="event">🎉 Event</option>
                    <option value="show">🎭 Show</option>
                    <option value="port">🚢 Port</option>
                  </select>
                </div>
                <label className="flex items-center gap-2 text-sm text-white/50 cursor-pointer py-1">
                  <input type="checkbox" checked={form.isRecommended}
                    onChange={e => setForm(f => ({ ...f, isRecommended: e.target.checked }))} className="rounded" />
                  ⭐ Recommended for all family members
                </label>
                <button onClick={addActivity} disabled={saving || !form.name}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600/30 to-blue-600/30 border border-cyan-500/20 text-cyan-400 font-semibold disabled:opacity-30">
                  {saving ? 'Adding...' : '+ Add Activity'}
                </button>
              </div>
              <div className="mt-4 space-y-1.5">
                <h3 className="text-xs text-white/30 uppercase tracking-widest mb-2">Activities on this day</h3>
                {days.find(d => d.id === selectedDay)?.activities.map(a => (
                  <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] group hover:bg-white/[0.04] transition-colors">
                    <span>{TYPE_ICONS[a.type] || '📌'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{a.name}</p>
                      <p className="text-xs text-white/25">{formatTime(a.startTime)} – {formatTime(a.endTime)}{a.location ? ` · ${a.location}` : ''}</p>
                    </div>
                    {a.isRecommended && <span className="text-xs text-amber-400">⭐</span>}
                    <button onClick={() => deleteActivity(a.id)}
                      className="text-white/10 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all text-sm">✕</button>
                  </div>
                ))}
              </div>
            </>
          )}

          {activeTab === 'days' && (
            <div className="space-y-3">
              <input placeholder="Day number *" value={dayForm.dayNumber}
                onChange={e => setDayForm(f => ({ ...f, dayNumber: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm placeholder-white/20" />
              <input type="date" value={dayForm.date}
                onChange={e => setDayForm(f => ({ ...f, date: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm" />
              <input placeholder="Port name (leave empty for sea day)" value={dayForm.portName}
                onChange={e => setDayForm(f => ({ ...f, portName: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm placeholder-white/20" />
              <label className="flex items-center gap-2 text-sm text-white/50">
                <input type="checkbox" checked={dayForm.isSeaDay}
                  onChange={e => setDayForm(f => ({ ...f, isSeaDay: e.target.checked }))} className="rounded" />
                🌊 Sea Day
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-white/30 mb-1 block">Arrive</label>
                  <input type="time" value={dayForm.arrivalTime}
                    onChange={e => setDayForm(f => ({ ...f, arrivalTime: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm" /></div>
                <div><label className="text-xs text-white/30 mb-1 block">Depart</label>
                  <input type="time" value={dayForm.departureTime}
                    onChange={e => setDayForm(f => ({ ...f, departureTime: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm" /></div>
              </div>
              <input placeholder="Description" value={dayForm.description}
                onChange={e => setDayForm(f => ({ ...f, description: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm placeholder-white/20" />
              <button onClick={addDay} disabled={saving || !dayForm.dayNumber || !dayForm.date}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600/30 to-blue-600/30 border border-cyan-500/20 text-cyan-400 font-semibold disabled:opacity-30">
                {saving ? 'Adding...' : '+ Add Day'}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Family Coordination ───────────────────────────────────

function FamilyOverview({
  day, allChoices, members, currentUser, fontSize,
}: {
  day: CruiseDay;
  allChoices: CruiseChoice[];
  members: { name: string; emoji: string; color: string }[];
  currentUser: string;
  fontSize: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const scale = fontSize / 16;
  const dayChoices = allChoices.filter(c => day.activities.some(a => a.id === c.activityId));

  return (
    <div className="glass rounded-2xl overflow-hidden">
      <button onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between hover:bg-white/[0.02] transition-colors"
        style={{ padding: `${14 * scale}px ${16 * scale}px` }}>
        <div className="flex items-center gap-3">
          <span style={{ fontSize: 20 * scale }}>👨‍👩‍👧‍👦</span>
          <span className="font-semibold" style={{ fontSize: 15 * scale }}>Family Coordination</span>
        </div>
        <div className="flex items-center gap-2">
          {members.slice(0, 8).map(m => {
            const hasChoices = dayChoices.some(c => c.userName === m.name && c.choice === 'definitely');
            return <span key={m.name} className={hasChoices ? '' : 'opacity-20'} style={{ fontSize: 18 * scale }} title={m.name}>{m.emoji}</span>;
          })}
          <span className={`text-white/30 transition-transform ${expanded ? 'rotate-180' : ''}`} style={{ fontSize: 14 * scale }}>▾</span>
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="space-y-2" style={{ padding: `0 ${16 * scale}px ${16 * scale}px` }}>
              {members.map(member => {
                const memberChoices = dayChoices.filter(c => c.userName === member.name);
                const going = memberChoices
                  .filter(c => c.choice === 'definitely')
                  .map(c => day.activities.find(a => a.id === c.activityId))
                  .filter(Boolean)
                  .sort((a, b) => timeToMinutes(a!.startTime) - timeToMinutes(b!.startTime));
                const maybeCount = memberChoices.filter(c => c.choice === 'maybe').length;
                const isMe = member.name === currentUser;

                return (
                  <div key={member.name}
                    className={`rounded-xl ${isMe ? 'bg-white/[0.04] ring-1 ring-white/10' : 'bg-white/[0.02]'}`}
                    style={{ padding: `${10 * scale}px ${12 * scale}px` }}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span style={{ fontSize: 18 * scale }}>{member.emoji}</span>
                      <span className={`font-semibold ${isMe ? 'text-white' : 'text-white/60'}`} style={{ fontSize: 14 * scale }}>
                        {member.name} {isMe && <span className="text-white/25" style={{ fontSize: 11 * scale }}>(you)</span>}
                      </span>
                      <span className="text-green-400/60 ml-auto" style={{ fontSize: 11 * scale }}>{going.length} going</span>
                      {maybeCount > 0 && <span className="text-amber-400/60" style={{ fontSize: 11 * scale }}>{maybeCount} maybe</span>}
                    </div>
                    {going.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {going.map(a => (
                          <span key={a!.id} className="rounded-lg bg-green-500/10 text-green-400/70 border border-green-500/10"
                            style={{ fontSize: 11 * scale, padding: `${2 * scale}px ${6 * scale}px` }}>
                            {formatTime(a!.startTime)} {a!.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="italic text-white/15" style={{ fontSize: 11 * scale }}>No activities selected yet</p>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────

export default function CruisePage() {
  const { currentMember, setShowPicker } = useFamilyMember();
  const [days, setDays] = useState<CruiseDay[]>([]);
  const [allChoices, setAllChoices] = useState<CruiseChoice[]>([]);
  const [members, setMembers] = useState<{ name: string; emoji: string; color: string }[]>([]);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [dragging, setDragging] = useState<string | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [seeded, setSeeded] = useState(false);
  const [hoveredCol, setHoveredCol] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [fontSize, setFontSize] = useState(18);
  const [modalActivity, setModalActivity] = useState<CruiseActivity | null>(null);
  const [pendingDropChoice, setPendingDropChoice] = useState<ColumnKey | null>(null);
  const [viewingMember, setViewingMember] = useState<string | null>(null); // null = viewing self
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [showPacking, setShowPacking] = useState(false);
  const dragOverCol = useRef<string | null>(null);

  // Load saved font size
  useEffect(() => {
    const saved = localStorage.getItem('cruise-font-size');
    if (saved) setFontSize(parseInt(saved));
  }, []);

  const updateFontSize = useCallback((size: number) => {
    setFontSize(size);
    localStorage.setItem('cruise-font-size', String(size));
  }, []);

  const scale = fontSize / 16;

  // Fetch data
  const fetchData = useCallback(async () => {
    const [daysRes, choicesRes, membersRes] = await Promise.all([
      fetch('/api/cruise/days').then(r => r.ok ? r.json() : []),
      fetch('/api/cruise/choices').then(r => r.ok ? r.json() : []),
      fetch('/api/members').then(r => r.ok ? r.json() : []),
    ]);
    setDays(daysRes);
    setAllChoices(choicesRes);
    setMembers(membersRes);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch('/api/cruise/days')
      .then(r => r.ok ? r.json() : [])
      .then(async (d) => {
        if ((!d || d.length === 0) && !seeded) {
          setSeeded(true);
          await fetch('/api/cruise/seed', { method: 'POST' });
          fetchData();
        } else {
          fetchData();
        }
      })
      .catch(() => fetchData());
  }, [fetchData, seeded]);

  const currentDay = days[selectedDayIndex];

  // Who we are viewing — self or another member
  const viewName = viewingMember || currentMember?.name || '';
  const isViewingSelf = !viewingMember || viewingMember === currentMember?.name;

  const getChoice = useCallback((activityId: string): ColumnKey => {
    if (!viewName) return 'skip';
    const choice = allChoices.find(c => c.activityId === activityId && c.userName === viewName);
    if (!choice) return 'skip';
    return choice.choice as ColumnKey;
  }, [allChoices, viewName]);

  // Unified save: choice + custom time + comment
  const saveChoice = useCallback(async (
    activityId: string, choice: ColumnKey,
    customStartTime: string | null = null, customEndTime: string | null = null,
    comment: string | null = null,
  ) => {
    if (!currentMember) return;
    // Optimistic update
    setAllChoices(prev => {
      const idx = prev.findIndex(c => c.activityId === activityId && c.userName === currentMember.name);
      const newChoice: CruiseChoice = {
        id: idx >= 0 ? prev[idx].id : `temp-${Date.now()}`,
        activityId, userName: currentMember.name, choice, customStartTime, customEndTime, comment,
      };
      if (idx >= 0) { const u = [...prev]; u[idx] = newChoice; return u; }
      return [...prev, newChoice];
    });
    const res = await fetch('/api/cruise/choices', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activityId, userName: currentMember.name, choice, customStartTime, customEndTime, comment }),
    });
    const saved = await res.json();
    setAllChoices(prev => [
      ...prev.filter(c => !(c.activityId === activityId && c.userName === currentMember.name)),
      saved,
    ]);
  }, [currentMember]);

  // Open modal for a card click
  const openCardModal = useCallback((activity: CruiseActivity) => {
    setPendingDropChoice(null);
    setModalActivity(activity);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, colKey: string) => {
    e.preventDefault(); e.dataTransfer.dropEffect = 'move';
    dragOverCol.current = colKey; setHoveredCol(colKey);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, colKey: ColumnKey) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    if (id && currentDay) {
      const activity = currentDay.activities.find(a => a.id === id);
      if (activity) {
        if (colKey === 'definitely' || colKey === 'maybe') {
          // Open modal so user can set their time + comment
          setPendingDropChoice(colKey);
          setModalActivity(activity);
        } else {
          // Skip — just save directly
          saveChoice(id, colKey);
        }
      }
    }
    setDragging(null); setHoveredCol(null);
  }, [currentDay, saveChoice]);

  // Get effective time for an activity (custom if set, otherwise default)
  const getEffectiveTime = useCallback((activity: CruiseActivity): { start: string; end: string } => {
    if (!viewName) return { start: activity.startTime, end: activity.endTime };
    const choice = allChoices.find(c => c.activityId === activity.id && c.userName === viewName);
    return {
      start: choice?.customStartTime || activity.startTime,
      end: choice?.customEndTime || activity.endTime,
    };
  }, [allChoices, viewName]);

  const getActivitiesForColumn = useCallback((col: ColumnKey): CruiseActivity[] => {
    if (!currentDay) return [];
    return currentDay.activities
      .filter(a => getChoice(a.id) === col)
      .filter(a => filter === 'all' || a.type === filter)
      .sort((a, b) => {
        const ta = getEffectiveTime(a);
        const tb = getEffectiveTime(b);
        return timeToMinutes(ta.start) - timeToMinutes(tb.start);
      });
  }, [currentDay, getChoice, filter, getEffectiveTime]);

  const getTimelineWithGaps = useCallback((activities: CruiseActivity[]) => {
    if (activities.length === 0) return [];
    const items: { type: 'activity' | 'gap' | 'overlap'; activity?: CruiseActivity; minutes?: number }[] = [];
    for (let i = 0; i < activities.length; i++) {
      const thisTime = getEffectiveTime(activities[i]);
      items.push({ type: 'activity', activity: activities[i] });
      if (i < activities.length - 1) {
        const nextTime = getEffectiveTime(activities[i + 1]);
        const gap = timeToMinutes(nextTime.start) - timeToMinutes(thisTime.end);
        if (gap > 0) {
          items.push({ type: 'gap', minutes: gap });
        } else if (gap < 0) {
          items.push({ type: 'overlap', minutes: Math.abs(gap) });
        }
      }
    }
    return items;
  }, [getEffectiveTime]);

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <ThemedBackground theme="cruise" />
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
          className="text-6xl">⚓</motion.div>
      </div>
    );
  }

  // No profile
  if (!currentMember) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <ThemedBackground theme="cruise" />
        <div className="glass rounded-3xl p-12 max-w-md w-full text-center">
          <div className="text-7xl mb-4">🚢</div>
          <h1 className="text-3xl font-bold mb-2">Cruise Planner</h1>
          <p className="text-white/40 mb-6">Pick your profile to start planning your trip!</p>
          <button onClick={() => setShowPicker(true)}
            className="px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold text-lg">
            Choose Profile
          </button>
        </div>
      </div>
    );
  }

  // Filter counts for current day
  const filterCounts = currentDay ? {
    all: currentDay.activities.length,
    excursion: currentDay.activities.filter(a => a.type === 'excursion').length,
    dining: currentDay.activities.filter(a => a.type === 'dining').length,
    event: currentDay.activities.filter(a => a.type === 'event').length,
    show: currentDay.activities.filter(a => a.type === 'show').length,
    port: currentDay.activities.filter(a => a.type === 'port').length,
  } : { all: 0, excursion: 0, dining: 0, event: 0, show: 0, port: 0 };

  return (
    <div className="min-h-screen relative" style={{ fontSize }}>
      <ThemedBackground theme="cruise" />

      {/* ── Header ── */}
      <div className="border-b border-white/5 sticky top-0 z-40 backdrop-blur-xl bg-[#050510]/80">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between" style={{ padding: `${10 * scale}px ${16 * scale}px` }}>
          <Link href="/" className="text-white/40 hover:text-white/80 transition-colors" style={{ fontSize: 13 * scale }}>← Home</Link>
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 22 * scale }}>🚢</span>
            <div className="hidden sm:block">
              <h1 className="font-bold leading-tight" style={{ fontSize: 15 * scale }}>Enchanted Princess</h1>
              {(() => {
                const cd = getCountdown('2026-06-09');
                return cd.past ? (
                  <p className="text-white/30" style={{ fontSize: 11 * scale }}>Jun 9–16, 2026 · Mediterranean & Aegean</p>
                ) : (
                  <p style={{ fontSize: 11 * scale }}>
                    <span className="text-cyan-400 font-semibold">{cd.days}d {cd.hours}h {cd.mins}m</span>
                    <span className="text-white/25"> until departure</span>
                  </p>
                );
              })()}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Font size quick toggle */}
            <div className="flex items-center bg-white/5 rounded-xl overflow-hidden">
              <button onClick={() => updateFontSize(Math.max(14, fontSize - 2))}
                className="text-white/40 hover:text-white/70 hover:bg-white/10 transition-all font-bold"
                style={{ padding: `${5 * scale}px ${8 * scale}px`, fontSize: 13 * scale }}
                title="Smaller text">A−</button>
              <span className="text-white/20 border-x border-white/5"
                style={{ padding: `${5 * scale}px ${6 * scale}px`, fontSize: 10 * scale }}>{fontSize}</span>
              <button onClick={() => updateFontSize(Math.min(28, fontSize + 2))}
                className="text-white/40 hover:text-white/70 hover:bg-white/10 transition-all font-bold"
                style={{ padding: `${5 * scale}px ${8 * scale}px`, fontSize: 13 * scale }}
                title="Bigger text">A+</button>
            </div>
            <button onClick={() => setShowPacking(true)}
              className="rounded-xl bg-cyan-500/10 text-cyan-400/70 hover:text-cyan-400 hover:bg-cyan-500/20 transition-all font-medium"
              style={{ fontSize: 12 * scale, padding: `${6 * scale}px ${10 * scale}px` }}>
              🧳 Pack
            </button>
            <button onClick={() => setShowAdmin(true)}
              className="rounded-xl bg-white/5 text-white/40 hover:text-white/60 transition-all"
              style={{ fontSize: 12 * scale, padding: `${6 * scale}px ${10 * scale}px` }}>
              ⚙️
            </button>
            <span style={{ fontSize: 14 * scale }}>{currentMember.emoji}</span>
          </div>
        </div>
      </div>

      {/* ── Day Selector ── */}
      <div className="border-b border-white/5 bg-[#050510]/40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto" style={{ padding: `${10 * scale}px ${16 * scale}px` }}>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {days.map((day, i) => {
              const isActive = i === selectedDayIndex;
              const goingCount = day.activities.filter(a => getChoice(a.id) === 'definitely').length;
              return (
                <button key={day.id} onClick={() => { setSelectedDayIndex(i); setFilter('all'); }}
                  className={`flex-shrink-0 rounded-xl text-left transition-all ${
                    isActive ? 'bg-white/10 ring-1 ring-white/20' : 'bg-white/[0.03] hover:bg-white/[0.06]'
                  }`} style={{ padding: `${8 * scale}px ${14 * scale}px` }}>
                  <div className="flex items-center gap-2" style={{ marginBottom: 2 * scale }}>
                    <span className={`font-bold ${isActive ? 'text-cyan-400' : 'text-white/50'}`} style={{ fontSize: 12 * scale }}>
                      Day {day.dayNumber}
                    </span>
                    {goingCount > 0 && (
                      <span className="rounded-full bg-green-500/15 text-green-400 font-medium"
                        style={{ fontSize: 10 * scale, padding: `${1 * scale}px ${5 * scale}px` }}>{goingCount}</span>
                    )}
                  </div>
                  <p className={isActive ? 'text-white/60' : 'text-white/25'} style={{ fontSize: 11 * scale }}>
                    {day.isSeaDay ? '🌊 At Sea' : `${getPortFlag(day.portName)} ${day.portName?.split(',')[0]}`}
                  </p>
                  <p className="text-white/15" style={{ fontSize: 10 * scale }}>{formatDate(day.date)}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {currentDay && (
        <>
          {/* ── Port Info + Weather ── */}
          <div className="border-b border-white/5">
            <div className="max-w-7xl mx-auto" style={{ padding: `${12 * scale}px ${16 * scale}px` }}>
              <div className="flex items-center gap-4 flex-wrap">
                {/* Port name + description */}
                <div className="flex items-center gap-3">
                  <span style={{ fontSize: 28 * scale }}>{currentDay.isSeaDay ? '🌊' : getPortFlag(currentDay.portName)}</span>
                  <div>
                    <p className="font-bold" style={{ fontSize: 17 * scale }}>
                      {currentDay.isSeaDay ? 'Day at Sea' : currentDay.portName}
                    </p>
                    <p className="text-white/35" style={{ fontSize: 12 * scale }}>{currentDay.description}</p>
                  </div>
                </div>

                {/* Arrival / Departure */}
                <div className="flex items-center gap-4 text-white/35" style={{ fontSize: 13 * scale }}>
                  {currentDay.arrivalTime && (
                    <span>🛬 <strong className="text-white/55">{formatTime(currentDay.arrivalTime)}</strong></span>
                  )}
                  {currentDay.departureTime && (
                    <span>🛫 <strong className="text-white/55">{formatTime(currentDay.departureTime)}</strong></span>
                  )}
                </div>

                {/* Weather widget */}
                {(() => {
                  const w = getPortWeather(currentDay);
                  return (
                    <div className="ml-auto flex items-center rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/15"
                      style={{ padding: `${8 * scale}px ${14 * scale}px`, gap: 10 * scale }}>
                      <span style={{ fontSize: 28 * scale }}>{w.icon}</span>
                      <div>
                        <p className="font-bold text-amber-300" style={{ fontSize: 16 * scale }}>
                          {w.tempF}°F <span className="text-white/25 font-normal" style={{ fontSize: 11 * scale }}>/ {w.tempC}°C</span>
                        </p>
                        <p className="text-white/35" style={{ fontSize: 10 * scale }}>{w.condition} · 💨 {w.wind}</p>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Packing tip */}
              {(() => {
                const w = getPortWeather(currentDay);
                return (
                  <p className="text-white/20 mt-1.5" style={{ fontSize: 11 * scale }}>
                    💡 <strong className="text-white/30">Tip:</strong> {w.tip}
                  </p>
                );
              })()}
            </div>
          </div>

          {/* ── Filter Bar ── */}
          <div className="border-b border-white/5">
            <div className="max-w-7xl mx-auto" style={{ padding: `${8 * scale}px ${16 * scale}px` }}>
              <div className="flex gap-1.5 overflow-x-auto">
                {([
                  { key: 'all', label: 'All', icon: '📋' },
                  { key: 'excursion', label: 'Excursions', icon: '🗺️' },
                  { key: 'dining', label: 'Dining', icon: '🍽️' },
                  { key: 'event', label: 'Activities', icon: '🎉' },
                  { key: 'show', label: 'Shows', icon: '🎭' },
                  { key: 'port', label: 'Ship', icon: '🚢' },
                ] as { key: FilterType; label: string; icon: string }[]).map(f => {
                  const count = filterCounts[f.key];
                  if (f.key !== 'all' && count === 0) return null;
                  return (
                    <button key={f.key} onClick={() => setFilter(f.key)}
                      className={`flex-shrink-0 rounded-xl font-medium transition-all flex items-center gap-1.5 ${
                        filter === f.key ? 'bg-white/10 text-white' : 'bg-white/[0.03] text-white/40 hover:text-white/60'
                      }`}
                      style={{ fontSize: 12 * scale, padding: `${5 * scale}px ${10 * scale}px` }}>
                      {f.icon} {f.label}
                      <span className="text-white/25" style={{ fontSize: 10 * scale }}>({count})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Family Ribbon ── */}
          {members.length > 0 && (
            <div className="border-b border-white/5">
              <div className="max-w-7xl mx-auto flex items-center" style={{ padding: `${8 * scale}px ${16 * scale}px`, gap: 8 * scale }}>
                <span className="text-white/25 flex-shrink-0 font-medium" style={{ fontSize: 11 * scale }}>Viewing:</span>
                <div className="flex items-center overflow-x-auto" style={{ gap: 4 * scale }}>
                  {/* Self button */}
                  <button
                    onClick={() => setViewingMember(null)}
                    className={`flex items-center gap-1.5 rounded-xl transition-all flex-shrink-0 ${
                      isViewingSelf ? 'bg-cyan-500/15 ring-1 ring-cyan-500/30 text-white' : 'bg-white/[0.03] text-white/40 hover:bg-white/[0.06]'
                    }`}
                    style={{ padding: `${5 * scale}px ${10 * scale}px` }}
                  >
                    <span style={{ fontSize: 16 * scale }}>{currentMember.emoji}</span>
                    <span className="font-medium" style={{ fontSize: 12 * scale }}>Me</span>
                  </button>
                  {/* Other members */}
                  {members.filter(m => m.name !== currentMember.name).map(m => {
                    const isViewing = viewingMember === m.name;
                    const hasChoicesToday = currentDay ? allChoices.some(c =>
                      c.userName === m.name && currentDay.activities.some(a => a.id === c.activityId) && c.choice !== 'skip'
                    ) : false;
                    return (
                      <button key={m.name}
                        onClick={() => setViewingMember(isViewing ? null : m.name)}
                        className={`flex items-center gap-1.5 rounded-xl transition-all flex-shrink-0 ${
                          isViewing ? 'bg-cyan-500/15 ring-1 ring-cyan-500/30 text-white' : 'bg-white/[0.03] text-white/40 hover:bg-white/[0.06]'
                        } ${!hasChoicesToday && !isViewing ? 'opacity-40' : ''}`}
                        style={{ padding: `${5 * scale}px ${10 * scale}px` }}
                        title={`${m.name}${hasChoicesToday ? '' : ' (no selections yet)'}`}
                      >
                        <span style={{ fontSize: 16 * scale }}>{m.emoji}</span>
                        <span className="font-medium hidden sm:inline" style={{ fontSize: 12 * scale }}>{m.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Viewing banner when looking at someone else */}
          {!isViewingSelf && (
            <div className="max-w-7xl mx-auto" style={{ padding: `${8 * scale}px ${16 * scale}px 0` }}>
              <div className="rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-between"
                style={{ padding: `${8 * scale}px ${14 * scale}px` }}>
                <div className="flex items-center" style={{ gap: 8 * scale }}>
                  <span style={{ fontSize: 18 * scale }}>{members.find(m => m.name === viewingMember)?.emoji || '👤'}</span>
                  <span className="font-semibold text-cyan-400" style={{ fontSize: 14 * scale }}>
                    Viewing {viewingMember}&apos;s schedule
                  </span>
                  <span className="text-cyan-400/40" style={{ fontSize: 11 * scale }}>(read-only)</span>
                </div>
                <button onClick={() => setViewingMember(null)}
                  className="rounded-lg bg-white/10 text-white/60 hover:text-white font-medium transition-all"
                  style={{ fontSize: 12 * scale, padding: `${4 * scale}px ${10 * scale}px` }}>
                  ← Back to mine
                </button>
              </div>
            </div>
          )}

          {/* ── Kanban Board ── */}
          <div className="max-w-7xl mx-auto" style={{ padding: `${20 * scale}px ${16 * scale}px` }}>

            {/* Add Activity Button */}
            {isViewingSelf && currentDay && (
              <div style={{ marginBottom: 14 * scale }}>
                <button onClick={() => setShowAddActivity(true)}
                  className="w-full rounded-2xl border-2 border-dashed border-cyan-500/20 hover:border-cyan-500/40 bg-cyan-500/[0.03] hover:bg-cyan-500/[0.06] transition-all group"
                  style={{ padding: `${14 * scale}px` }}>
                  <div className="flex items-center justify-center" style={{ gap: 8 * scale }}>
                    <span className="rounded-full bg-cyan-500/15 group-hover:bg-cyan-500/25 transition-all flex items-center justify-center"
                      style={{ width: 32 * scale, height: 32 * scale, fontSize: 16 * scale }}>
                      ➕
                    </span>
                    <span className="font-semibold text-cyan-400/70 group-hover:text-cyan-400 transition-all" style={{ fontSize: 14 * scale }}>
                      Add a Restaurant, Excursion, or Activity
                    </span>
                  </div>
                  <p className="text-white/20 group-hover:text-white/30 transition-all text-center" style={{ fontSize: 11 * scale, marginTop: 2 * scale }}>
                    Found something on Viator? Want lunch at a local spot? Add it here.
                  </p>
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: 16 * scale }}>
              {COLUMNS.map(col => {
                const activities = getActivitiesForColumn(col.key);
                const showTimeline = col.key === 'definitely' || col.key === 'maybe';
                const timeline = showTimeline ? getTimelineWithGaps(activities) : [];
                const isHovered = hoveredCol === col.key;

                return (
                  <div key={col.key}
                    onDragOver={isViewingSelf ? (e) => handleDragOver(e, col.key) : undefined}
                    onDragLeave={isViewingSelf ? () => setHoveredCol(null) : undefined}
                    onDrop={isViewingSelf ? (e) => handleDrop(e, col.key) : undefined}
                    className={`rounded-2xl border transition-all ${
                      isHovered ? 'ring-2 ring-white/20 scale-[1.01]' : ''
                    }`}
                    style={{
                      borderColor: isHovered ? col.accent : 'rgba(255,255,255,0.06)',
                      backgroundColor: isHovered ? col.bgHover : 'rgba(255,255,255,0.015)',
                    }}>

                    <div className="border-b border-white/5 flex items-center justify-between"
                      style={{ padding: `${12 * scale}px ${14 * scale}px` }}>
                      <div className="flex items-center" style={{ gap: 8 * scale }}>
                        <span style={{ fontSize: 18 * scale }}>{col.icon}</span>
                        <span className="font-bold" style={{ fontSize: 15 * scale, color: col.accent.replace('0.5', '1').replace('0.15', '0.6') }}>
                          {col.label}
                        </span>
                      </div>
                      <span className="text-white/25 bg-white/5 rounded-full font-medium"
                        style={{ fontSize: 11 * scale, padding: `${2 * scale}px ${8 * scale}px` }}>
                        {activities.length}
                      </span>
                    </div>

                    <div style={{ padding: 10 * scale, minHeight: 160 * scale }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 * scale }}>
                        {activities.length === 0 ? (
                          <div className={`text-center ${isHovered ? 'text-white/30' : 'text-white/10'} transition-colors`}
                            style={{ padding: `${40 * scale}px 0` }}>
                            <p style={{ fontSize: 24 * scale, marginBottom: 6 * scale }}>{isHovered ? '👆' : col.icon}</p>
                            <p style={{ fontSize: 12 * scale }}>{isHovered ? 'Drop here!' : 'Drag activities here'}</p>
                          </div>
                        ) : showTimeline ? (
                          timeline.map((item, i) =>
                            item.type === 'gap' ? (
                              <TimelineSpacer key={`gap-${i}`} minutes={item.minutes!} fontSize={fontSize} />
                            ) : item.type === 'overlap' ? (
                              <TimelineSpacer key={`overlap-${i}`} minutes={item.minutes!} isOverlap fontSize={fontSize} />
                            ) : (
                              <ActivityCard key={item.activity!.id} activity={item.activity!}
                                currentUser={viewName} allChoices={allChoices}
                                dragging={dragging} onDragStart={setDragging}
                                members={members} fontSize={fontSize} onCardClick={isViewingSelf ? openCardModal : () => {}} />
                            )
                          )
                        ) : (
                          <AnimatePresence>
                            {activities.map(a => (
                              <ActivityCard key={a.id} activity={a}
                                currentUser={viewName} allChoices={allChoices}
                                dragging={dragging} onDragStart={setDragging}
                                members={members} fontSize={fontSize} onCardClick={isViewingSelf ? openCardModal : () => {}} />
                            ))}
                          </AnimatePresence>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── What's Everyone Doing? ── */}
            <div style={{ marginTop: 20 * scale }}>
              <WhatEveryoneDoing day={currentDay} allChoices={allChoices}
                members={members} currentUser={currentMember.name}
                onJoin={(activityId) => {
                  const a = currentDay.activities.find(act => act.id === activityId);
                  if (a) { setPendingDropChoice('definitely'); setModalActivity(a); }
                }}
                fontSize={fontSize} />
            </div>

            {/* ── Family Coordination ── */}
            <div style={{ marginTop: 12 * scale }}>
              <FamilyOverview day={currentDay} allChoices={allChoices}
                members={members} currentUser={currentMember.name} fontSize={fontSize} />
            </div>

            {/* ── Day Summary + Trip Totals ── */}
            <div className="glass rounded-2xl" style={{ marginTop: 12 * scale, padding: `${16 * scale}px` }}>
              <div className="flex items-center justify-between flex-wrap" style={{ gap: 16 * scale, marginBottom: 10 * scale }}>
                <div className="flex items-center" style={{ gap: 20 * scale, fontSize: 14 * scale }}>
                  <span className="text-white/35">
                    ✅ <strong className="text-green-400">{getActivitiesForColumn('definitely').length}</strong> going
                  </span>
                  <span className="text-white/35">
                    🤔 <strong className="text-amber-400">{getActivitiesForColumn('maybe').length}</strong> maybe
                  </span>
                  <span className="text-white/35">
                    ⏭️ <strong className="text-white/50">{getActivitiesForColumn('skip').length}</strong> skip
                  </span>
                </div>
                {(() => {
                  const dayCost = getActivitiesForColumn('definitely').reduce((s, a) => s + (a.cost || 0), 0);
                  return dayCost > 0 ? (
                    <span className="text-white/35" style={{ fontSize: 14 * scale }}>
                      💰 Today: <strong className="text-green-400">${dayCost}</strong>/pp
                    </span>
                  ) : null;
                })()}
              </div>

              {/* Trip total cost across all days */}
              {(() => {
                const tripTotal = days.reduce((total, day) => {
                  return total + day.activities
                    .filter(a => {
                      const choice = allChoices.find(c => c.activityId === a.id && c.userName === viewName);
                      return choice?.choice === 'definitely';
                    })
                    .reduce((s, a) => s + (a.cost || 0), 0);
                }, 0);
                const totalActivities = days.reduce((total, day) => {
                  return total + day.activities.filter(a => {
                    const choice = allChoices.find(c => c.activityId === a.id && c.userName === viewName);
                    return choice?.choice === 'definitely';
                  }).length;
                }, 0);
                return (
                  <div className="flex items-center justify-between border-t border-white/5"
                    style={{ paddingTop: 10 * scale }}>
                    <span className="text-white/20" style={{ fontSize: 12 * scale }}>
                      🚢 Full trip: <strong className="text-white/40">{totalActivities}</strong> activities across 8 days
                    </span>
                    {tripTotal > 0 && (
                      <span className="text-white/20" style={{ fontSize: 12 * scale }}>
                        💰 Trip total: <strong className="text-cyan-400">${tripTotal}</strong>/pp
                      </span>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </>
      )}

      <AnimatePresence>
        {showPacking && (
          <PackingListPanel
            userName={currentMember.name}
            allMembers={members}
            onClose={() => setShowPacking(false)}
            fontSize={fontSize}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAdmin && (
          <AdminPanel days={days} onClose={() => setShowAdmin(false)} onRefresh={fetchData}
            fontSize={fontSize} setFontSize={updateFontSize} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddActivity && currentDay && (
          <AddActivityModal
            dayId={currentDay.id}
            dayLabel={`Day ${currentDay.dayNumber} — ${currentDay.isSeaDay ? 'Sea Day' : currentDay.portName?.split(',')[0]}`}
            onClose={() => setShowAddActivity(false)}
            onAdded={fetchData}
            fontSize={fontSize}
            userName={currentMember.name}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modalActivity && (
          <ActivityModal
            activity={modalActivity}
            currentUser={currentMember.name}
            allChoices={allChoices}
            members={members}
            fontSize={fontSize}
            onClose={() => { setModalActivity(null); setPendingDropChoice(null); }}
            onSave={(activityId, choice, startTime, endTime, comment) => {
              saveChoice(activityId, choice, startTime, endTime, comment);
            }}
            // If dropped onto a column, pre-select that status
            {...(pendingDropChoice ? { defaultStatus: pendingDropChoice } : {})}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

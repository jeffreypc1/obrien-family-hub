'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface FamilyMember {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

interface HubConfig {
  heroTitle: string;
  heroSubtitle: string;
  heroCopy: string;
  heroIcon: string;
  fontPrimary: string;
}

const EMOJIS = ['🎤', '🎵', '🌟', '✨', '🎸', '💃', '🕺', '🦄', '🔥', '💎', '🦋', '🌸', '⭐', '🎪', '🎭', '🧑‍🍳', '📚', '🎮'];
const COLORS = ['#E91E8C', '#7B2FBE', '#1B8FE3', '#E8A317', '#2ECC71', '#E74C3C', '#F39C12', '#1ABC9C', '#9B59B6', '#3498DB'];

const FONT_OPTIONS = [
  { value: 'Outfit', label: 'Outfit', preview: 'Clean & modern' },
  { value: 'Inter', label: 'Inter', preview: 'Sharp & professional' },
  { value: 'DM Sans', label: 'DM Sans', preview: 'Friendly & geometric' },
  { value: 'Space Grotesk', label: 'Space Grotesk', preview: 'Techy & bold' },
  { value: 'Nunito', label: 'Nunito', preview: 'Soft & rounded' },
  { value: 'Poppins', label: 'Poppins', preview: 'Sleek & popular' },
  { value: 'Raleway', label: 'Raleway', preview: 'Elegant & thin' },
  { value: 'Sora', label: 'Sora', preview: 'Futuristic & clean' },
  { value: 'Manrope', label: 'Manrope', preview: 'Warm & readable' },
  { value: 'Plus Jakarta Sans', label: 'Plus Jakarta Sans', preview: 'Polished & premium' },
];

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [pin, setPin] = useState('');
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [config, setConfig] = useState<HubConfig | null>(null);
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState('🎤');
  const [newColor, setNewColor] = useState('#E91E8C');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const fetchData = async () => {
    const res = await fetch('/api/admin');
    const data = await res.json();
    setMembers(data.members || []);
    setConfig(data.config || { heroTitle: "O'Brien", heroSubtitle: 'Family Hub', heroCopy: '', heroIcon: '🏠', fontPrimary: 'Outfit' });
  };

  useEffect(() => { fetchData(); }, []);

  const apiCall = async (body: Record<string, unknown>) => {
    setSaving(true);
    const res = await fetch('/api/admin', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin, ...body }),
    });
    if (!res.ok) {
      const err = await res.json();
      setMessage(err.error || 'Error');
      setSaving(false);
      return false;
    }
    const data = await res.json();
    setMembers(data.members || []);
    setConfig(data.config);
    setSaving(false);
    setMessage('Saved!');
    setTimeout(() => setMessage(''), 2000);
    return true;
  };

  const handleAddMember = async () => {
    if (!newName.trim()) return;
    const ok = await apiCall({ newMember: { name: newName.trim(), emoji: newEmoji, color: newColor } });
    if (ok) setNewName('');
  };

  const handleDeleteMember = async (id: string) => {
    if (!confirm('Remove this family member?')) return;
    await apiCall({ deleteMemberId: id });
  };

  const handleSaveConfig = async () => {
    if (!config) return;
    await apiCall({ config });
  };

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center relative z-10">
        <div className="glass rounded-3xl p-10 max-w-md w-full text-center">
          <div className="text-5xl mb-4">🔐</div>
          <h1 className="text-2xl font-bold mb-2">Admin Panel</h1>
          <p className="text-white/40 text-sm mb-6">Enter the family PIN</p>
          <div className="flex gap-2">
            <input type="password" value={pin} onChange={(e) => setPin(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && setAuthed(true)}
              placeholder="PIN..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-center tracking-widest placeholder-white/30 focus:outline-none focus:border-purple-500" />
            <button onClick={() => setAuthed(true)}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium">
              Enter
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative z-10">
      <div className="border-b border-white/5">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-white/40 hover:text-white/80 transition-colors text-sm">← Back to Hub</Link>
          <div className="flex items-center gap-3">
            {message && <span className="text-green-400 text-sm animate-pulse">{message}</span>}
            <span className="text-white/20 text-xs">Admin</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12 space-y-10">
        <h1 className="text-3xl font-bold">⚙️ Admin Panel</h1>

        {/* ====== FAMILY MEMBERS ====== */}
        <section className="glass rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-6">👨‍👩‍👧‍👦 Family Members</h2>

          <div className="space-y-3 mb-6">
            {members.map((m) => (
              <div key={m.id} className="flex items-center gap-4 p-3 bg-white/[0.02] rounded-xl">
                <span className="text-2xl">{m.emoji}</span>
                <span className="font-medium flex-1" style={{ color: m.color }}>{m.name}</span>
                <div className="w-5 h-5 rounded-full" style={{ backgroundColor: m.color }} />
                <button onClick={() => handleDeleteMember(m.id)}
                  className="text-white/20 hover:text-red-400 text-sm transition-colors">Remove</button>
              </div>
            ))}
          </div>

          <div className="border-t border-white/10 pt-5 space-y-4">
            <h3 className="text-sm text-white/40 font-medium">Add Member</h3>
            <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddMember()}
              placeholder="Name..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-purple-500" />
            <div>
              <label className="text-xs text-white/30 block mb-2">Emoji</label>
              <div className="flex gap-1.5 flex-wrap">
                {EMOJIS.map((e) => (
                  <button key={e} onClick={() => setNewEmoji(e)}
                    className={`text-xl p-1.5 rounded-lg ${newEmoji === e ? 'bg-white/15 ring-1 ring-white/30' : 'hover:bg-white/5'}`}>{e}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-white/30 block mb-2">Color</label>
              <div className="flex gap-1.5">
                {COLORS.map((c) => (
                  <button key={c} onClick={() => setNewColor(c)}
                    className={`w-8 h-8 rounded-full border-2 transition-transform ${newColor === c ? 'border-white scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
            <button onClick={handleAddMember} disabled={saving || !newName.trim()}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium disabled:opacity-30">
              {saving ? '...' : 'Add Member'}
            </button>
          </div>
        </section>

        {/* ====== FONT SELECTION ====== */}
        <section className="glass rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-6">🔤 Font</h2>
          <p className="text-white/40 text-sm mb-4">Choose the primary font for the hub and all apps</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {FONT_OPTIONS.map((font) => (
              <button key={font.value} onClick={() => setConfig((c) => c ? { ...c, fontPrimary: font.value } : c)}
                className={`text-left p-4 rounded-xl transition-all ${
                  config?.fontPrimary === font.value
                    ? 'bg-purple-500/15 border border-purple-500/30 ring-1 ring-purple-500/20'
                    : 'bg-white/[0.02] border border-white/5 hover:bg-white/[0.05]'
                }`}>
                <link href={`https://fonts.googleapis.com/css2?family=${font.value.replace(/ /g, '+')}:wght@400;600;700&display=swap`} rel="stylesheet" />
                <span className="text-lg font-bold" style={{ fontFamily: `"${font.value}", sans-serif` }}>{font.label}</span>
                <span className="text-xs text-white/30 ml-2">{font.preview}</span>
                <p className="mt-1 text-sm text-white/50" style={{ fontFamily: `"${font.value}", sans-serif` }}>
                  The quick brown fox jumps over the lazy dog
                </p>
              </button>
            ))}
          </div>

          <button onClick={handleSaveConfig} disabled={saving}
            className="mt-4 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium disabled:opacity-30">
            {saving ? 'Saving...' : 'Save Font Choice'}
          </button>
        </section>

        {/* ====== LANDING PAGE TEXT ====== */}
        <section className="glass rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-6">🏠 Landing Page</h2>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-white/30 block mb-1">Title</label>
              <input type="text" value={config?.heroTitle || ''} onChange={(e) => setConfig((c) => c ? { ...c, heroTitle: e.target.value } : c)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500" />
            </div>
            <div>
              <label className="text-xs text-white/30 block mb-1">Subtitle</label>
              <input type="text" value={config?.heroSubtitle || ''} onChange={(e) => setConfig((c) => c ? { ...c, heroSubtitle: e.target.value } : c)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500" />
            </div>
            <div>
              <label className="text-xs text-white/30 block mb-1">Description</label>
              <textarea value={config?.heroCopy || ''} onChange={(e) => setConfig((c) => c ? { ...c, heroCopy: e.target.value } : c)}
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500" />
            </div>
            <button onClick={handleSaveConfig} disabled={saving}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium disabled:opacity-30">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

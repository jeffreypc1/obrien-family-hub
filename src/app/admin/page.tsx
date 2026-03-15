'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FAMILY_APPS } from '@/app/apps';

interface FamilyMember {
  id: string;
  name: string;
  emoji: string;
  color: string;
  landingMode: string;
  pin: string | null;
}

interface HubConfig {
  heroTitle: string;
  heroSubtitle: string;
  heroCopy: string;
  heroIcon: string;
  fontPrimary: string;
  roomMappingsJson: string | null;
  appVisibilityJson?: string | null;
  locationsJson?: string | null;
  appOverridesJson?: string | null;
  requirePin?: number | null;
}

interface RoomMapping {
  id: string;
  label: string;
  app: string;
}

const DEFAULT_ROOM_MAPPINGS: RoomMapping[] = [
  { id: 'kitchen', label: '🍳 Kitchen', app: '/recipes' },
  { id: 'living', label: '📺 Living Room', app: '/german' },
  { id: 'inlaw', label: '🎤 In-Law Suite', app: 'https://eurovision-family.vercel.app' },
  { id: 'garage', label: '✅ Garage', app: '/todos' },
  { id: 'door', label: '📅 Front Door', app: '/events' },
  { id: 'garden', label: '✈️ Garden', app: '/travel' },
  { id: 'porch', label: '💡 Porch Light', app: '/recommendations' },
  { id: 'mailbox', label: '📸 Mailbox', app: '/photos' },
];

const APP_OPTIONS = [
  { value: '/recipes', label: '🍳 Family Recipes' },
  { value: '/german', label: '🇩🇪 Learn German' },
  { value: 'https://eurovision-family.vercel.app', label: '🎤 Eurovision Ranker' },
  { value: '/todos', label: '✅ To Do List' },
  { value: '/events', label: '📅 Events' },
  { value: '/travel', label: '✈️ Travel' },
  { value: '/recommendations', label: '💡 Recommendations' },
  { value: '/photos', label: '📸 Photos' },
];

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
  const [roomMappings, setRoomMappings] = useState<RoomMapping[]>(DEFAULT_ROOM_MAPPINGS);
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState('🎤');
  const [newColor, setNewColor] = useState('#E91E8C');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['members']));

  const fetchData = async () => {
    const res = await fetch('/api/admin');
    const data = await res.json();
    setMembers(data.members || []);
    const cfg = data.config || { heroTitle: "O'Brien", heroSubtitle: 'Family Hub', heroCopy: '', heroIcon: '🏠', fontPrimary: 'Outfit', roomMappingsJson: null };
    setConfig(cfg);
    if (cfg.roomMappingsJson) {
      try { setRoomMappings(JSON.parse(cfg.roomMappingsJson)); } catch {}
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Load ALL font options so previews work
  useEffect(() => {
    const families = FONT_OPTIONS.map((f) => `family=${f.value.replace(/ /g, '+')}:wght@400;600;700`).join('&');
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?${families}&display=swap`;
    document.head.appendChild(link);
  }, []);

  const apiCall = async (body: Record<string, unknown>) => {
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch('/api/admin', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, ...body }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(`Error: ${data.error || 'Something went wrong'}`);
        setSaving(false);
        return false;
      }
      setMembers(data.members || []);
      setConfig(data.config);
      setSaving(false);
      setMessage('✓ Saved!');
      setTimeout(() => setMessage(''), 3000);
      return true;
    } catch (e) {
      setMessage(`Error: ${e instanceof Error ? e.message : 'Network error'}`);
      setSaving(false);
      return false;
    }
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

  const handleLogin = async () => {
    // Verify PIN before showing admin
    const res = await fetch('/api/admin', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin, config: {} }), // no-op update to verify PIN
    });
    if (res.ok) {
      setAuthed(true);
    } else {
      setMessage('Error: Wrong PIN');
    }
  };

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center relative z-10">
        <div className="glass rounded-3xl p-10 max-w-md w-full text-center">
          <div className="text-5xl mb-4">🔐</div>
          <h1 className="text-2xl font-bold mb-2">Admin Panel</h1>
          <p className="text-white/40 text-sm mb-6">Enter the family PIN</p>
          {message && <p className="text-red-400 text-sm mb-4">{message}</p>}
          <div className="flex gap-2">
            <input type="password" value={pin} onChange={(e) => setPin(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="PIN..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-center tracking-widest placeholder-white/30 focus:outline-none focus:border-purple-500" />
            <button onClick={handleLogin}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium">
              Enter
            </button>
          </div>
        </div>
      </div>
    );
  }

  const toggleSection = (id: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const Section = ({ id, icon, title, subtitle, children }: { id: string; icon: string; title: string; subtitle?: string; children: React.ReactNode }) => {
    const isOpen = openSections.has(id);
    return (
      <div className="glass rounded-2xl overflow-hidden">
        <button onClick={() => toggleSection(id)}
          className="w-full flex items-center gap-3 px-6 py-4 text-left hover:bg-white/[0.02] transition-colors">
          <span className="text-xl">{icon}</span>
          <div className="flex-1">
            <h2 className="text-base font-bold">{title}</h2>
            {subtitle && <p className="text-[11px] text-white/30 mt-0.5">{subtitle}</p>}
          </div>
          <span className={`text-white/20 transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
        </button>
        {isOpen && (
          <div className="px-6 pb-6 border-t border-white/5 pt-5">
            {children}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen relative">
      <div className="border-b border-white/5">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-white/40 hover:text-white/80 transition-colors text-sm">← Back to Hub</Link>
          <div className="flex items-center gap-3">
            {message && (
              <span className={`text-sm px-3 py-1 rounded-lg ${
                message.startsWith('Error') ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'
              }`}>{message}</span>
            )}
            <span className="text-white/20 text-xs">Admin</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-3">
        <h1 className="text-3xl font-bold mb-6">⚙️ Admin Panel</h1>

        <Section id="members" icon="👨‍👩‍👧‍👦" title="Family Members" subtitle="Add, remove, and configure PINs">

          <div className="space-y-3 mb-6">
            {members.map((m) => (
              <div key={m.id} className="p-4 bg-white/[0.02] rounded-xl space-y-3">
                <div className="flex items-center gap-4">
                  <span className="text-2xl">{m.emoji}</span>
                  <span className="font-medium flex-1" style={{ color: m.color }}>{m.name}</span>
                  <div className="w-5 h-5 rounded-full" style={{ backgroundColor: m.color }} />
                  <button onClick={() => handleDeleteMember(m.id)}
                    className="text-white/20 hover:text-red-400 text-sm transition-colors">Remove</button>
                </div>
                <div className="flex items-center gap-4 flex-wrap">
                  {/* PIN */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-white/25">PIN:</span>
                    <input type="text" maxLength={4} placeholder="None" defaultValue={m.pin || ''}
                      onBlur={(e) => apiCall({ updateMember: { id: m.id, pin: e.target.value || null } })}
                      className="w-16 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white text-center tracking-widest placeholder-white/15 focus:outline-none" />
                  </div>
                  {/* Landing mode */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-white/25">Landing:</span>
                    <button
                      onClick={() => apiCall({ updateMember: { id: m.id, landingMode: m.landingMode === '3d-house' ? 'classic' : '3d-house' } })}
                      className={`px-3 py-1 rounded-lg text-[11px] font-medium transition-all ${
                        m.landingMode === '3d-house'
                          ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                          : 'bg-white/5 text-white/30 border border-white/10'
                      }`}>
                      {m.landingMode === '3d-house' ? '🛸 3D House' : '📋 Classic'}
                    </button>
                  </div>
                </div>
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
        </Section>

        <Section id="visibility" icon="👁️" title="App Visibility" subtitle="Turn apps on or off on the home page">
          <div className="space-y-3">
            {(() => {
              let visibility: Record<string, boolean> = {};
              if (config?.appVisibilityJson) try { visibility = JSON.parse(config.appVisibilityJson); } catch {}

              return FAMILY_APPS.map((app) => {
                const isVisible = visibility[app.id] !== false; // default true
                return (
                  <div key={app.id} className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{app.icon}</span>
                      <span className={`text-sm font-medium ${isVisible ? 'text-white' : 'text-white/30'}`}>{app.name}</span>
                      {app.status === 'coming-soon' && <span className="text-[10px] text-white/20 bg-white/5 px-2 py-0.5 rounded">Coming Soon</span>}
                    </div>
                    <button
                      onClick={() => {
                        const updated = { ...visibility, [app.id]: !isVisible };
                        apiCall({ config: { appVisibilityJson: JSON.stringify(updated) } });
                      }}
                      className={`w-11 h-6 rounded-full transition-colors relative ${isVisible ? 'bg-emerald-500' : 'bg-white/15'}`}>
                      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${isVisible ? 'left-6' : 'left-1'}`} />
                    </button>
                  </div>
                );
              });
            })()}
          </div>
        </Section>

        <Section id="locations" icon="📍" title="Locations" subtitle="Cities for local event discovery">
          <div className="space-y-2 mb-4">
            {(() => {
              let locs: string[] = [];
              if (config?.locationsJson) try { locs = JSON.parse(config.locationsJson!); } catch {}
              return locs.map((city: string, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl">
                  <span className="text-sm">📍 {city}</span>
                  <button onClick={() => {
                    const updated = locs.filter((_, j) => j !== i);
                    apiCall({ config: { locationsJson: JSON.stringify(updated) } });
                  }} className="text-white/20 hover:text-red-400 text-xs">Remove</button>
                </div>
              ));
            })()}
          </div>
          <div className="flex gap-2">
            <input type="text" id="new-location" placeholder="City, State or City, Country..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm placeholder-white/30 focus:outline-none" />
            <button onClick={() => {
              const input = document.getElementById('new-location') as HTMLInputElement;
              if (!input.value.trim()) return;
              let locs: string[] = [];
              if (config?.locationsJson) try { locs = JSON.parse(config.locationsJson); } catch {}
              apiCall({ config: { locationsJson: JSON.stringify([...locs, input.value.trim()]) } });
              input.value = '';
            }} className="px-4 py-2 rounded-xl bg-violet-500/20 text-violet-400 text-sm font-medium">Add</button>
          </div>
        </Section>

        <Section id="settings" icon="⚙️" title="Settings" subtitle="Font, PIN, and security settings">

          <div className="space-y-6">
            {/* Font picker */}
            <div>
              <label className="text-xs text-white/30 block mb-2">Font</label>
              <select value={config?.fontPrimary || 'Outfit'}
                onChange={(e) => { setConfig((c) => c ? { ...c, fontPrimary: e.target.value } : c); }}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none [&>option]:bg-gray-900"
                style={{ fontFamily: `"${config?.fontPrimary || 'Outfit'}", sans-serif` }}>
                {FONT_OPTIONS.map((f) => (
                  <option key={f.value} value={f.value}>{f.label} — {f.preview}</option>
                ))}
              </select>
              <p className="mt-2 text-sm text-white/40" style={{ fontFamily: `"${config?.fontPrimary || 'Outfit'}", sans-serif` }}>
                Preview: The quick brown fox jumps over the lazy dog
              </p>
            </div>

            {/* Require PIN toggle */}
            <div className="flex items-center justify-between p-4 bg-white/[0.02] rounded-xl">
              <div>
                <h3 className="text-sm font-medium">🔐 Require PIN to log in</h3>
                <p className="text-[10px] text-white/25 mt-0.5">When on, family members must enter their 4-digit PIN</p>
              </div>
              <button onClick={() => {
                const current = config?.requirePin ? 1 : 0;
                apiCall({ config: { requirePin: current ? 0 : 1 } });
              }}
                className={`w-11 h-6 rounded-full transition-colors relative ${
                  config?.requirePin ? 'bg-emerald-500' : 'bg-white/15'}`}>
                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  config?.requirePin ? 'left-6' : 'left-1'}`} />
              </button>
            </div>

            {/* Font size */}
            <div className="p-4 bg-white/[0.02] rounded-xl">
              <h3 className="text-sm font-medium mb-2">🔤 Global Font Size</h3>
              <p className="text-[10px] text-white/25 mb-3">Adjust the base font size for the entire site</p>
              <div className="flex items-center gap-3">
                {[14, 15, 16, 17, 18, 19, 20].map((size) => (
                  <button key={size} onClick={() => {
                    document.documentElement.style.setProperty('--base-font-size', `${size}px`);
                    apiCall({ config: { fontSize: size } });
                  }}
                    className={`w-10 h-10 rounded-xl text-sm font-medium transition-all ${
                      size === 16 ? 'ring-1 ring-white/20 bg-white/10 text-white' : 'bg-white/5 text-white/30 hover:text-white'
                    }`}>
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Chore payment limits */}
            <div className="p-4 bg-white/[0.02] rounded-xl space-y-3">
              <h3 className="text-sm font-medium">💰 Chore Payment Limits</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-white/25 block mb-1">Minimum payout ($)</label>
                  <input type="number" step="1" min="1" defaultValue="20" id="admin-min-payout"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none" />
                </div>
                <div>
                  <label className="text-[10px] text-white/25 block mb-1">Max active task amount ($)</label>
                  <input type="number" step="1" min="1" defaultValue="20" id="admin-max-active"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none" />
                </div>
              </div>
              <p className="text-[9px] text-white/15">Min payout: won&apos;t show Pay button until earned this much. Max active: kids can&apos;t grab more tasks until under this limit.</p>
              <button onClick={() => {
                const mp = (document.getElementById('admin-min-payout') as HTMLInputElement).value;
                const ma = (document.getElementById('admin-max-active') as HTMLInputElement).value;
                apiCall({ config: { minPayout: parseFloat(mp) || 20, maxActiveAmount: parseFloat(ma) || 20 } });
              }} className="px-4 py-2 rounded-lg bg-white/5 text-white/40 text-xs hover:text-white">Save Limits</button>
            </div>

            {/* Change admin PIN */}
            <div className="p-4 bg-white/[0.02] rounded-xl">
              <h3 className="text-sm font-medium mb-2">🔑 Admin Panel PIN</h3>
              <p className="text-[10px] text-white/25 mb-3">Change the PIN used to access this admin panel. Current default: obrien2026</p>
              <div className="flex gap-2">
                <input type="text" id="new-admin-pin" placeholder="New admin PIN..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none" />
                <button onClick={() => {
                  const input = document.getElementById('new-admin-pin') as HTMLInputElement;
                  if (input.value.trim()) {
                    apiCall({ config: { adminPin: input.value.trim() } });
                    input.value = '';
                  }
                }} className="px-4 py-2 rounded-lg bg-white/5 text-white/40 text-sm hover:text-white">Update</button>
              </div>
            </div>

            <button onClick={handleSaveConfig} disabled={saving}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium disabled:opacity-30">
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </Section>

        <Section id="recurring" icon="🔁" title="Weekly Chores" subtitle="Auto-recurring tasks assigned to family members">
          <WeeklyChoresAdmin members={members} currentMember={members[0]?.name || 'Admin'} apiCall={apiCall} />
        </Section>

        <Section id="grab-templates" icon="🏷️" title="Bulk Grab Tasks" subtitle="Post multiple unclaimed tasks at once from a template library">
          <GrabTemplatesAdmin currentMember={members[0]?.name || 'Admin'} />
        </Section>

        <Section id="grade-incentives" icon="🎓" title="Grade Incentives" subtitle="GPA multipliers and missing assignment penalties for chore payments">
          <GradeIncentivesAdmin adminPin={pin} />
        </Section>

        <Section id="chore-collections" icon="📦" title="Chore Collections" subtitle="Weekly bundles — all items must be done by deadline to earn the reward">
          <ChoreCollectionsAdmin members={members} currentMember={members[0]?.name || 'Admin'} />
        </Section>

        <Section id="cards" icon="🎨" title="Card Names & Descriptions" subtitle="Customize how apps appear on the home page">

          <div className="space-y-4">
            {FAMILY_APPS.map((app) => {
              let overrides: Record<string, Record<string, string>> = {};
              if (config?.appOverridesJson) {
                try { overrides = JSON.parse(config!.appOverridesJson!); } catch {}
              }
              const o = overrides[app.id] || {};

              return (
                <div key={app.id} className="p-4 bg-white/[0.02] rounded-xl space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{app.icon}</span>
                    <span className="text-sm text-white/50">{app.id}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-white/25 block mb-1">Card Name</label>
                      <input type="text" defaultValue={o.name || app.name} placeholder={app.name}
                        onBlur={(e) => {
                          const updated = { ...overrides, [app.id]: { ...o, name: e.target.value.trim() || app.name } };
                          apiCall({ config: { appOverridesJson: JSON.stringify(updated) } });
                        }}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-[10px] text-white/25 block mb-1">Tagline</label>
                      <input type="text" defaultValue={o.tagline || app.tagline} placeholder={app.tagline}
                        onBlur={(e) => {
                          const updated = { ...overrides, [app.id]: { ...o, tagline: e.target.value.trim() || app.tagline } };
                          apiCall({ config: { appOverridesJson: JSON.stringify(updated) } });
                        }}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Section>

        <Section id="landing" icon="🏠" title="Landing Page" subtitle="Hero title, subtitle, and description text">

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
        </Section>

        <Section id="rooms" icon="🏡" title="3D House Room Mappings" subtitle="Choose what each room of the 3D house links to">

          <div className="space-y-3">
            {roomMappings.map((room, idx) => (
              <div key={room.id} className="flex items-center gap-4 p-4 bg-white/[0.02] rounded-xl">
                {/* Room location (fixed) */}
                <div className="w-28 flex-shrink-0">
                  <span className="text-xs text-white/25 uppercase tracking-wider">
                    {room.id === 'kitchen' ? 'Right Window' :
                     room.id === 'living' ? 'Left Window' :
                     room.id === 'inlaw' ? 'In-Law Suite' :
                     room.id === 'garage' ? 'Garage' :
                     room.id === 'door' ? 'Front Door' :
                     room.id === 'garden' ? 'Garden' :
                     room.id === 'porch' ? 'Porch' :
                     room.id === 'mailbox' ? 'Mailbox' : room.id}
                  </span>
                </div>

                {/* Label (editable) */}
                <input
                  type="text"
                  value={room.label}
                  onChange={(e) => {
                    const updated = [...roomMappings];
                    updated[idx] = { ...updated[idx], label: e.target.value };
                    setRoomMappings(updated);
                  }}
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                />

                {/* App selector */}
                <span className="text-white/20 text-xs">→</span>
                <select
                  value={room.app}
                  onChange={(e) => {
                    const updated = [...roomMappings];
                    updated[idx] = { ...updated[idx], app: e.target.value };
                    setRoomMappings(updated);
                  }}
                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none [&>option]:bg-gray-900 min-w-[180px]"
                >
                  {APP_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <button
            onClick={() => apiCall({ config: { roomMappingsJson: JSON.stringify(roomMappings) } })}
            disabled={saving}
            className="mt-4 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium disabled:opacity-30"
          >
            {saving ? 'Saving...' : 'Save Room Mappings'}
          </button>
        </Section>
      </div>
    </div>
  );
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface ChoreItem { id: string; title: string; description: string | null; dayOfWeek: number; dollarAmount: number | null; assignedTo: string; }

function WeeklyChoresAdmin({ members, currentMember, apiCall }: { members: Array<{ id: string; name: string; emoji: string }>; currentMember: string; apiCall: (body: Record<string, unknown>) => Promise<boolean> }) {
  const [chores, setChores] = useState<ChoreItem[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newDay, setNewDay] = useState(1);
  const [newAmount, setNewAmount] = useState('');
  const [newAssign, setNewAssign] = useState('');
  const [genMsg, setGenMsg] = useState('');

  const fetchChores = () => fetch('/api/recurring-chores').then((r) => r.json()).then(setChores);
  useEffect(() => { fetchChores(); }, []);

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    await fetch('/api/recurring-chores', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle.trim(), dayOfWeek: newDay, dollarAmount: newAmount ? parseFloat(newAmount) : null, assignedTo: newAssign || currentMember, createdBy: currentMember }),
    });
    setNewTitle(''); setNewAmount('');
    fetchChores();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/recurring-chores?id=${id}`, { method: 'DELETE' });
    fetchChores();
  };

  const handleGenerate = async () => {
    const res = await fetch('/api/recurring-chores', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'generate' }) });
    const data = await res.json();
    setGenMsg(`✅ Created ${data.count} tasks for this week`);
    setTimeout(() => setGenMsg(''), 3000);
  };

  return (
    <div className="space-y-4">
      {/* Generate button */}
      <div className="flex items-center gap-3 p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
        <button onClick={handleGenerate} className="px-4 py-2 rounded-xl bg-emerald-500/15 text-emerald-400 text-xs font-medium border border-emerald-500/20 hover:bg-emerald-500/25">
          🔄 Generate This Week&apos;s Tasks
        </button>
        <span className="text-[10px] text-white/25">Creates todo items for each recurring chore this week</span>
        {genMsg && <span className="text-xs text-emerald-400">{genMsg}</span>}
      </div>

      {/* Existing chores grouped by day */}
      {DAYS.map((day, dayIdx) => {
        const dayChores = chores.filter((c) => c.dayOfWeek === dayIdx);
        if (dayChores.length === 0) return null;
        return (
          <div key={dayIdx}>
            <h4 className="text-xs text-white/30 uppercase tracking-wider mb-2">{day}</h4>
            <div className="space-y-1">
              {dayChores.map((c) => (
                <div key={c.id} className="flex items-center gap-3 p-2 bg-white/[0.02] rounded-lg group">
                  <span className="text-sm flex-1">{c.title}</span>
                  {c.dollarAmount && <span className="text-xs text-emerald-400">${c.dollarAmount.toFixed(2)}</span>}
                  <span className="text-[10px] text-white/20">{members.find((m) => m.name === c.assignedTo)?.emoji} {c.assignedTo}</span>
                  <button onClick={() => handleDelete(c.id)} className="text-white/10 hover:text-red-400 text-xs opacity-0 group-hover:opacity-100">✕</button>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Add new */}
      <div className="border-t border-white/10 pt-4 space-y-3">
        <h4 className="text-xs text-white/30">Add weekly chore</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Task name..."
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none col-span-2 md:col-span-1" />
          <select value={newDay} onChange={(e) => setNewDay(Number(e.target.value))}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white [&>option]:bg-gray-900">
            {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
          </select>
          <input type="number" step="0.5" min="0" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} placeholder="$ amount"
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none" />
          <select value={newAssign} onChange={(e) => setNewAssign(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white [&>option]:bg-gray-900">
            <option value="">Assign to...</option>
            {members.map((m) => <option key={m.id} value={m.name}>{m.emoji} {m.name}</option>)}
          </select>
        </div>
        <button onClick={handleAdd} disabled={!newTitle.trim()} className="px-4 py-2 rounded-xl bg-emerald-500/15 text-emerald-400 text-xs font-medium disabled:opacity-30">Add Chore</button>
      </div>
    </div>
  );
}

interface GrabTemplate { id: string; title: string; description: string | null; dollarAmount: number | null; category: string; }
const GRAB_CATEGORIES: Record<string, { icon: string; label: string }> = {
  outdoor: { icon: '🌿', label: 'Outdoor' }, indoor: { icon: '🏠', label: 'Indoor' },
  kitchen: { icon: '🍽️', label: 'Kitchen' }, pets: { icon: '🐾', label: 'Pets' }, general: { icon: '📦', label: 'General' },
};

function GrabTemplatesAdmin({ currentMember }: { currentMember: string }) {
  const [templates, setTemplates] = useState<GrabTemplate[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [amountOverrides, setAmountOverrides] = useState<Record<string, number>>({});
  const [posting, setPosting] = useState(false);
  const [result, setResult] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newCat, setNewCat] = useState('general');
  const [filterCat, setFilterCat] = useState('all');

  const fetchTemplates = () => fetch('/api/grab-templates').then((r) => r.json()).then(setTemplates);
  useEffect(() => { fetchTemplates(); }, []);

  const toggleSelect = (id: string) => {
    setSelected((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };

  const selectAll = () => {
    const filtered = filterCat === 'all' ? templates : templates.filter((t) => t.category === filterCat);
    setSelected(new Set(filtered.map((t) => t.id)));
  };

  const handlePost = async () => {
    if (selected.size === 0) return;
    setPosting(true);
    const res = await fetch('/api/grab-templates', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'bulk-post', templateIds: [...selected], createdBy: currentMember, amountOverrides }),
    });
    const data = await res.json();
    setResult(`✅ Posted ${data.count} grab tasks!`);
    setSelected(new Set());
    setTimeout(() => setResult(''), 4000);
    setPosting(false);
  };

  const handleAddCustom = async () => {
    if (!newTitle.trim()) return;
    await fetch('/api/grab-templates', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle.trim(), dollarAmount: newAmount ? parseFloat(newAmount) : null, category: newCat }),
    });
    setNewTitle(''); setNewAmount('');
    fetchTemplates();
  };

  const filtered = filterCat === 'all' ? templates : templates.filter((t) => t.category === filterCat);

  return (
    <div className="space-y-4">
      {/* Action bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={handlePost} disabled={posting || selected.size === 0}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium text-sm disabled:opacity-30">
          {posting ? '...' : `🏷️ Post ${selected.size} as Grab Tasks`}
        </button>
        <button onClick={selectAll} className="px-3 py-2 rounded-lg bg-white/5 text-white/40 text-xs hover:text-white">Select All</button>
        <button onClick={() => setSelected(new Set())} className="px-3 py-2 rounded-lg bg-white/5 text-white/40 text-xs hover:text-white">Clear</button>
        {result && <span className="text-emerald-400 text-sm">{result}</span>}
      </div>

      {/* Category filter */}
      <div className="flex gap-1 flex-wrap">
        <button onClick={() => setFilterCat('all')} className={`px-3 py-1 rounded-lg text-[10px] ${filterCat === 'all' ? 'bg-white/10 text-white' : 'bg-white/5 text-white/25'}`}>All ({templates.length})</button>
        {Object.entries(GRAB_CATEGORIES).map(([k, c]) => {
          const count = templates.filter((t) => t.category === k).length;
          return <button key={k} onClick={() => setFilterCat(k)} className={`px-3 py-1 rounded-lg text-[10px] ${filterCat === k ? 'bg-white/10 text-white' : 'bg-white/5 text-white/25'}`}>{c.icon} {c.label} ({count})</button>;
        })}
      </div>

      {/* Template list with checkboxes + inline edit */}
      <div className="space-y-1 max-h-[500px] overflow-y-auto">
        {filtered.map((t) => {
          const isSelected = selected.has(t.id);
          const cat = GRAB_CATEGORIES[t.category] || GRAB_CATEGORIES.general;
          return (
            <div key={t.id} className={`flex items-center gap-2 p-3 rounded-xl transition-all ${isSelected ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-white/[0.01] border border-transparent hover:bg-white/[0.03]'}`}>
              <div onClick={() => toggleSelect(t.id)}
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center text-xs cursor-pointer flex-shrink-0 transition-all ${isSelected ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-white/15'}`}>
                {isSelected && '✓'}
              </div>
              <span className="text-sm flex-shrink-0">{cat.icon}</span>
              {/* Editable title — visible border */}
              <input type="text" defaultValue={t.title}
                onBlur={(e) => {
                  if (e.target.value.trim() !== t.title) {
                    fetch('/api/grab-templates', { method: 'PUT', headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ id: t.id, title: e.target.value.trim() }) }).then(() => fetchTemplates());
                  }
                }}
                className="flex-1 bg-white/5 border border-white/10 text-sm text-white rounded-lg px-2 py-1 focus:border-emerald-500 focus:outline-none min-w-0" />
              {/* Editable description — visible border */}
              <input type="text" defaultValue={t.description || ''} placeholder="+ add description"
                onBlur={(e) => {
                  fetch('/api/grab-templates', { method: 'PUT', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: t.id, description: e.target.value.trim() }) }).then(() => fetchTemplates());
                }}
                className="w-32 md:w-48 bg-white/5 border border-white/10 text-[11px] text-white/40 rounded-lg px-2 py-1 focus:border-emerald-500 focus:text-white/60 focus:outline-none hidden md:block" />
              {/* Editable amount */}
              <input type="number" step="0.5" min="0"
                defaultValue={t.dollarAmount ?? ''}
                onBlur={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  if (val !== t.dollarAmount) {
                    fetch('/api/grab-templates', { method: 'PUT', headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ id: t.id, dollarAmount: val }) }).then(() => fetchTemplates());
                  }
                  setAmountOverrides((p) => ({ ...p, [t.id]: val }));
                }}
                placeholder="$"
                className="w-16 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-emerald-400 text-right focus:outline-none flex-shrink-0" />
              {/* Exempt from cap */}
              <button onClick={async () => {
                await fetch('/api/grab-templates', { method: 'PUT', headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ id: t.id, exemptFromCap: (t as unknown as Record<string, unknown>).exemptFromCap ? 0 : 1 }) });
                fetchTemplates();
              }} className={`text-[9px] px-1.5 py-0.5 rounded flex-shrink-0 transition-all ${
                (t as unknown as Record<string, unknown>).exemptFromCap ? 'bg-amber-500/15 text-amber-400' : 'bg-white/5 text-white/15 hover:text-white/40'}`}
                title="Exempt from $20 cap">
                {(t as unknown as Record<string, unknown>).exemptFromCap ? '⭐' : '☆'}
              </button>
              {/* Delete */}
              <button onClick={async () => {
                await fetch(`/api/grab-templates?id=${t.id}`, { method: 'DELETE' });
                fetchTemplates();
              }} className="text-white/10 hover:text-red-400 text-xs flex-shrink-0 ml-1">✕</button>
            </div>
          );
        })}
      </div>

      {/* Add custom template */}
      <div className="border-t border-white/10 pt-4 space-y-3">
        <h4 className="text-xs text-white/30">Add custom task to library</h4>
        <div className="flex gap-2">
          <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Task name..."
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none" />
          <input type="number" step="0.5" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} placeholder="$"
            className="w-20 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none" />
          <select value={newCat} onChange={(e) => setNewCat(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white [&>option]:bg-gray-900">
            {Object.entries(GRAB_CATEGORIES).map(([k, c]) => <option key={k} value={k}>{c.icon} {c.label}</option>)}
          </select>
          <button onClick={handleAddCustom} disabled={!newTitle.trim()} className="px-4 py-2 rounded-lg bg-white/5 text-white/40 text-xs hover:text-white disabled:opacity-20">Add</button>
        </div>
      </div>
    </div>
  );
}

const DAYS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface ChoreCollectionData {
  id: string; title: string; assignedTo: string; dollarAmount: number; dueDay: number;
  items: Array<{ id: string; title: string; dayOfWeek: number }>;
  weeks: Array<{ id: string; weekStart: string; dueDate: string; completedItemsJson: string; allComplete: number }>;
}

function ChoreCollectionsAdmin({ members, currentMember }: { members: Array<{ id: string; name: string; emoji: string }>; currentMember: string }) {
  const [collections, setCollections] = useState<ChoreCollectionData[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAssign, setNewAssign] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newDueDay, setNewDueDay] = useState(6);
  const [addingItemTo, setAddingItemTo] = useState<string | null>(null);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemDay, setNewItemDay] = useState(1);

  const fetchCollections = () => fetch('/api/chore-collections').then((r) => r.json()).then(setCollections);
  useEffect(() => { fetchCollections(); }, []);

  const handleCreate = async () => {
    if (!newTitle.trim() || !newAssign || !newAmount) return;
    await fetch('/api/chore-collections', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create', title: newTitle.trim(), assignedTo: newAssign, createdBy: currentMember, dollarAmount: parseFloat(newAmount), dueDay: newDueDay }),
    });
    setNewTitle(''); setNewAmount(''); setShowCreate(false);
    fetchCollections();
  };

  const handleAddItem = async (collectionId: string) => {
    if (!newItemTitle.trim()) return;
    await fetch('/api/chore-collections', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add-item', collectionId, title: newItemTitle.trim(), dayOfWeek: newItemDay }),
    });
    setNewItemTitle(''); setAddingItemTo(null);
    fetchCollections();
  };

  const handleGenerate = async (collectionId: string) => {
    await fetch('/api/chore-collections', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'generate-week', collectionId }),
    });
    fetchCollections();
  };

  const handleDeleteItem = async (itemId: string) => {
    await fetch(`/api/chore-collections?itemId=${itemId}`, { method: 'DELETE' });
    fetchCollections();
  };

  const handleDeleteCollection = async (id: string) => {
    if (!confirm('Delete this collection?')) return;
    await fetch(`/api/chore-collections?id=${id}`, { method: 'DELETE' });
    fetchCollections();
  };

  return (
    <div className="space-y-4">
      {/* Existing collections */}
      {collections.map((c) => (
        <div key={c.id} className="p-4 bg-white/[0.02] rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-sm">{c.title}</h4>
              <p className="text-[10px] text-white/30">
                {members.find((m) => m.name === c.assignedTo)?.emoji} {c.assignedTo} · 💰 ${c.dollarAmount.toFixed(2)} · Due {DAYS_FULL[c.dueDay]}
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleGenerate(c.id)} className="px-3 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 text-[10px] font-medium">🔄 Generate Week</button>
              <button onClick={() => handleDeleteCollection(c.id)} className="text-white/10 hover:text-red-400 text-xs">✕</button>
            </div>
          </div>

          {/* Items */}
          <div className="space-y-1">
            {c.items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-2 bg-white/[0.02] rounded-lg group">
                <span className="text-[10px] text-white/25 w-16">{DAYS_FULL[item.dayOfWeek].slice(0, 3)}</span>
                <span className="text-sm flex-1">{item.title}</span>
                <button onClick={() => handleDeleteItem(item.id)} className="text-white/10 hover:text-red-400 text-xs opacity-0 group-hover:opacity-100">✕</button>
              </div>
            ))}
          </div>

          {/* Add item */}
          {addingItemTo === c.id ? (
            <div className="flex gap-2">
              <select value={newItemDay} onChange={(e) => setNewItemDay(Number(e.target.value))}
                className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white [&>option]:bg-gray-900">
                {DAYS_FULL.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
              <input type="text" value={newItemTitle} onChange={(e) => setNewItemTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddItem(c.id)}
                placeholder="Chore name..." autoFocus
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-white/20 focus:outline-none" />
              <button onClick={() => handleAddItem(c.id)} className="px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 text-xs">Add</button>
              <button onClick={() => setAddingItemTo(null)} className="text-white/20 text-xs">✕</button>
            </div>
          ) : (
            <button onClick={() => setAddingItemTo(c.id)} className="text-[10px] text-white/20 hover:text-white/40">+ Add chore item</button>
          )}
        </div>
      ))}

      {/* Create new collection */}
      {!showCreate ? (
        <button onClick={() => setShowCreate(true)} className="w-full py-3 rounded-xl border border-dashed border-white/10 text-white/25 hover:text-white/50 text-sm">+ New Chore Collection</button>
      ) : (
        <div className="p-4 bg-white/[0.02] rounded-xl space-y-3">
          <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Collection name (e.g., Weekly Chores)"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none" />
          <div className="grid grid-cols-3 gap-3">
            <select value={newAssign} onChange={(e) => setNewAssign(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white [&>option]:bg-gray-900">
              <option value="">Assign to...</option>
              {members.map((m) => <option key={m.id} value={m.name}>{m.emoji} {m.name}</option>)}
            </select>
            <input type="number" step="1" min="1" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} placeholder="$ reward"
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none" />
            <select value={newDueDay} onChange={(e) => setNewDueDay(Number(e.target.value))}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white [&>option]:bg-gray-900">
              {DAYS_FULL.map((d, i) => <option key={i} value={i}>Due {d}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} disabled={!newTitle.trim() || !newAssign || !newAmount}
              className="px-4 py-2 rounded-lg bg-emerald-500/15 text-emerald-400 text-xs font-medium disabled:opacity-30">Create</button>
            <button onClick={() => setShowCreate(false)} className="text-white/20 text-xs">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

interface GpaMultiplier { minGpa: number; maxGpa: number; multiplier: number; label: string; }
interface MissingPenalty { minMissing: number; maxMissing: number; adjustment: number; label: string; }

function GradeIncentivesAdmin({ adminPin }: { adminPin: string }) {
  const [multipliers, setMultipliers] = useState<GpaMultiplier[]>([]);
  const [penalties, setPenalties] = useState<MissingPenalty[]>([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetch('/api/admin').then((r) => r.json()).then((data) => {
      if (data.config?.gradeMultipliersJson) {
        try { setMultipliers(JSON.parse(data.config.gradeMultipliersJson)); } catch {}
      }
      if (data.config?.missingPenaltiesJson) {
        try { setPenalties(JSON.parse(data.config.missingPenaltiesJson)); } catch {}
      }
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await fetch('/api/admin', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: adminPin, config: { gradeMultipliersJson: JSON.stringify(multipliers), missingPenaltiesJson: JSON.stringify(penalties) } }),
    });
    setSaving(false);
    setMsg('✓ Saved!');
    setTimeout(() => setMsg(''), 3000);
  };

  const updateMultiplier = (idx: number, field: string, value: string) => {
    setMultipliers((prev) => prev.map((m, i) => i === idx ? { ...m, [field]: field === 'label' ? value : parseFloat(value) || 0 } : m));
  };

  const updatePenalty = (idx: number, field: string, value: string) => {
    setPenalties((prev) => prev.map((p, i) => i === idx ? { ...p, [field]: field === 'label' ? value : parseFloat(value) || 0 } : p));
  };

  return (
    <div className="space-y-6">
      {/* GPA Multipliers */}
      <div>
        <h4 className="text-sm font-bold text-white/50 mb-3">📊 GPA Multipliers</h4>
        <p className="text-sm text-white/25 mb-4">Weekly chore earnings are multiplied based on current GPA. A 2.0x multiplier means double pay!</p>
        <div className="space-y-2">
          <div className="grid grid-cols-5 gap-2 text-sm text-white/30 font-medium px-2">
            <span>Label</span><span>Min GPA</span><span>Max GPA</span><span>Multiplier</span><span></span>
          </div>
          {multipliers.map((m, i) => (
            <div key={i} className="grid grid-cols-5 gap-2 items-center">
              <input value={m.label} onChange={(e) => updateMultiplier(i, 'label', e.target.value)}
                className="bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-sm text-white focus:outline-none" />
              <input type="number" step="0.1" value={m.minGpa} onChange={(e) => updateMultiplier(i, 'minGpa', e.target.value)}
                className="bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-sm text-white focus:outline-none" />
              <input type="number" step="0.01" value={m.maxGpa} onChange={(e) => updateMultiplier(i, 'maxGpa', e.target.value)}
                className="bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-sm text-white focus:outline-none" />
              <div className="flex items-center gap-1">
                <input type="number" step="0.05" value={m.multiplier} onChange={(e) => updateMultiplier(i, 'multiplier', e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-sm text-white focus:outline-none w-20" />
                <span className="text-sm text-white/20">x</span>
              </div>
              <button onClick={() => setMultipliers((prev) => prev.filter((_, j) => j !== i))}
                className="text-white/15 hover:text-red-400 text-sm">✕</button>
            </div>
          ))}
          <button onClick={() => setMultipliers((prev) => [...prev, { minGpa: 0, maxGpa: 0, multiplier: 1, label: '' }])}
            className="text-sm text-white/25 hover:text-white/50">+ Add tier</button>
        </div>
      </div>

      {/* Missing Assignment Adjustments */}
      <div>
        <h4 className="text-sm font-bold text-white/50 mb-3">⚠️ Missing Assignment Adjustments</h4>
        <p className="text-sm text-white/25 mb-4">Positive = bonus added. Negative = percentage deducted from weekly earnings.</p>
        <div className="space-y-2">
          <div className="grid grid-cols-5 gap-2 text-sm text-white/30 font-medium px-2">
            <span>Label</span><span>Min Missing</span><span>Max Missing</span><span>Adjustment %</span><span></span>
          </div>
          {penalties.map((p, i) => (
            <div key={i} className="grid grid-cols-5 gap-2 items-center">
              <input value={p.label} onChange={(e) => updatePenalty(i, 'label', e.target.value)}
                className="bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-sm text-white focus:outline-none" />
              <input type="number" value={p.minMissing} onChange={(e) => updatePenalty(i, 'minMissing', e.target.value)}
                className="bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-sm text-white focus:outline-none" />
              <input type="number" value={p.maxMissing} onChange={(e) => updatePenalty(i, 'maxMissing', e.target.value)}
                className="bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-sm text-white focus:outline-none" />
              <div className="flex items-center gap-1">
                <input type="number" step="5" value={p.adjustment} onChange={(e) => updatePenalty(i, 'adjustment', e.target.value)}
                  className={`bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-sm focus:outline-none w-20 ${p.adjustment > 0 ? 'text-emerald-400' : p.adjustment < 0 ? 'text-red-400' : 'text-white'}`} />
                <span className="text-sm text-white/20">{p.adjustment > 0 ? '$' : '%'}</span>
              </div>
              <button onClick={() => setPenalties((prev) => prev.filter((_, j) => j !== i))}
                className="text-white/15 hover:text-red-400 text-sm">✕</button>
            </div>
          ))}
          <button onClick={() => setPenalties((prev) => [...prev, { minMissing: 0, maxMissing: 0, adjustment: 0, label: '' }])}
            className="text-sm text-white/25 hover:text-white/50">+ Add tier</button>
        </div>
      </div>

      {/* Preview */}
      <div className="p-4 bg-white/[0.02] rounded-xl">
        <h4 className="text-sm font-bold text-white/40 mb-3">📋 Preview: $20 base weekly earnings</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {multipliers.map((m) => {
            const base = 20;
            const adjusted = base * m.multiplier;
            return (
              <div key={m.label} className="text-center p-2 bg-white/[0.02] rounded-lg">
                <span className="text-sm text-white/40 block">{m.label}</span>
                <span className="text-sm text-white/20 block">{m.minGpa}–{m.maxGpa} GPA</span>
                <span className="text-lg font-bold block" style={{ color: m.multiplier >= 1.5 ? '#22C55E' : m.multiplier >= 1 ? '#60A5FA' : '#EF4444' }}>
                  ${adjusted.toFixed(0)} <span className="text-sm font-normal">({m.multiplier}x)</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={handleSave} disabled={saving}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium disabled:opacity-30">
          {saving ? 'Saving...' : 'Save Incentives'}
        </button>
        {msg && <span className="text-emerald-400 text-sm">{msg}</span>}
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useFamilyMember } from '@/components/FamilyContext';
import ThemedBackground from '@/components/ThemedBackground';

interface WishItem {
  id: string; title: string; description: string | null; imageUrl: string | null;
  linkUrl: string | null; price: string | null; category: string; priority: string;
  addedBy: string; claimedBy: string | null; createdAt: string;
}

const CATEGORIES: Record<string, { icon: string; label: string }> = {
  general: { icon: '🎁', label: 'General' },
  electronics: { icon: '📱', label: 'Electronics' },
  books: { icon: '📚', label: 'Books' },
  clothing: { icon: '👕', label: 'Clothing' },
  experiences: { icon: '🎪', label: 'Experiences' },
  travel: { icon: '✈️', label: 'Travel Dreams' },
  home: { icon: '🏠', label: 'Home' },
  games: { icon: '🎮', label: 'Games' },
  other: { icon: '💫', label: 'Other' },
};

const PRIORITIES: Record<string, { label: string; color: string }> = {
  'must-have': { label: 'Must Have', color: '#EF4444' },
  'really-want': { label: 'Really Want', color: '#F59E0B' },
  'nice-to-have': { label: 'Nice to Have', color: '#6366F1' },
  'dream': { label: 'Dream', color: '#C084FC' },
};

export default function WishlistPage() {
  const { currentMember, members, setShowPicker } = useFamilyMember();
  const [items, setItems] = useState<WishItem[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [personFilter, setPersonFilter] = useState<string>('all');
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newImage, setNewImage] = useState('');
  const [newLink, setNewLink] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newCat, setNewCat] = useState('general');
  const [newPriority, setNewPriority] = useState('nice-to-have');

  const fetchItems = () => fetch('/api/wishlist').then((r) => r.json()).then(setItems);
  useEffect(() => { fetchItems(); }, []);

  const handleAdd = async () => {
    if (!currentMember || !newTitle.trim()) return;
    await fetch('/api/wishlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: newTitle.trim(), description: newDesc.trim() || null,
        imageUrl: newImage.trim() || null, linkUrl: newLink.trim() || null,
        price: newPrice.trim() || null, category: newCat, priority: newPriority,
        addedBy: currentMember.name,
      }),
    });
    setNewTitle(''); setNewDesc(''); setNewImage(''); setNewLink(''); setNewPrice('');
    setShowAdd(false); fetchItems();
  };

  const handleClaim = async (id: string) => {
    if (!currentMember) { setShowPicker(true); return; }
    const item = items.find((i) => i.id === id);
    const claimedBy = item?.claimedBy === currentMember.name ? null : currentMember.name;
    await fetch('/api/wishlist', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, claimedBy }),
    });
    fetchItems();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/wishlist?id=${id}`, { method: 'DELETE' });
    fetchItems();
  };

  const filtered = items
    .filter((i) => filter === 'all' || i.category === filter)
    .filter((i) => personFilter === 'all' || i.addedBy === personFilter);

  // Group by person
  const people = [...new Set(items.map((i) => i.addedBy))];

  return (
    <div className="min-h-screen relative">
      <ThemedBackground theme="recommendations" />

      <div className="border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-white/40 hover:text-white/80 transition-colors text-sm">← Back to Hub</Link>
          <span className="text-white/30 text-sm">{currentMember?.emoji} {currentMember?.name}</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">🎁 Wish List</h1>
            <p className="text-white/40 text-sm mt-1">Birthdays, holidays, or just because</p>
          </div>
          <button onClick={() => { if (!currentMember) { setShowPicker(true); return; } setShowAdd(true); }}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-medium text-sm hover:scale-105 transition-transform">
            + Add Wish
          </button>
        </div>

        {/* Person filter */}
        <div className="flex gap-2 mb-4 flex-wrap">
          <button onClick={() => setPersonFilter('all')}
            className={`px-4 py-2 rounded-xl text-sm transition-all ${personFilter === 'all' ? 'bg-white/10 text-white' : 'bg-white/5 text-white/35'}`}>
            Everyone
          </button>
          {people.map((p) => (
            <button key={p} onClick={() => setPersonFilter(p)}
              className={`px-4 py-2 rounded-xl text-sm transition-all ${personFilter === p ? 'bg-white/10 text-white' : 'bg-white/5 text-white/35'}`}>
              {members.find((m) => m.name === p)?.emoji || '👤'} {p}
            </button>
          ))}
        </div>

        {/* Category filter */}
        <div className="flex gap-2 mb-8 flex-wrap">
          <button onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs transition-all ${filter === 'all' ? 'bg-white/10 text-white' : 'bg-white/5 text-white/25'}`}>
            All
          </button>
          {Object.entries(CATEGORIES).map(([key, cat]) => (
            <button key={key} onClick={() => setFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all ${filter === key ? 'bg-white/10 text-white' : 'bg-white/5 text-white/25'}`}>
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>

        {/* Add form */}
        <AnimatePresence>
          {showAdd && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="glass rounded-2xl p-6 mb-8 space-y-4">
              <h3 className="text-sm font-medium text-white/60">Add to your wish list</h3>
              <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="What do you want?" autoFocus
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 text-sm focus:outline-none" />
              <textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Why? Any details? (optional)" rows={2}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 text-sm resize-none focus:outline-none" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <select value={newCat} onChange={(e) => setNewCat(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm [&>option]:bg-gray-900">
                  {Object.entries(CATEGORIES).map(([k, c]) => <option key={k} value={k}>{c.icon} {c.label}</option>)}
                </select>
                <select value={newPriority} onChange={(e) => setNewPriority(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm [&>option]:bg-gray-900">
                  {Object.entries(PRIORITIES).map(([k, p]) => <option key={k} value={k}>{p.label}</option>)}
                </select>
                <input type="text" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} placeholder="Price (optional)"
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder-white/20 focus:outline-none" />
                <input type="text" value={newLink} onChange={(e) => setNewLink(e.target.value)} placeholder="Link (optional)"
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder-white/20 focus:outline-none" />
              </div>
              <input type="text" value={newImage} onChange={(e) => setNewImage(e.target.value)} placeholder="Image URL (optional)"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 text-sm focus:outline-none" />
              <div className="flex gap-2">
                <button onClick={handleAdd} disabled={!newTitle.trim()}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-medium text-sm disabled:opacity-30">Add to List</button>
                <button onClick={() => setShowAdd(false)} className="px-4 py-2.5 rounded-xl bg-white/5 text-white/40 text-sm">Cancel</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Wish items */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-white/20">
            <div className="text-5xl mb-4">🎁</div>
            <p>No wishes yet. Add something you&apos;d love to have!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((item, i) => {
              const cat = CATEGORIES[item.category] || CATEGORIES.general;
              const pri = PRIORITIES[item.priority] || PRIORITIES['nice-to-have'];
              const isMine = item.addedBy === currentMember?.name;
              const isClaimed = !!item.claimedBy;
              const claimedByMe = item.claimedBy === currentMember?.name;

              return (
                <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`glass rounded-2xl overflow-hidden group transition-all ${isClaimed && !isMine ? 'opacity-50' : ''}`}>
                  {item.imageUrl && (
                    <div className="aspect-video overflow-hidden">
                      <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-bold text-sm leading-snug">{item.title}</h3>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold whitespace-nowrap" style={{ background: `${pri.color}20`, color: pri.color }}>
                        {pri.label}
                      </span>
                    </div>
                    {item.description && <p className="text-white/35 text-xs mb-2 line-clamp-2">{item.description}</p>}
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/30">{cat.icon} {cat.label}</span>
                      {item.price && <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">💰 {item.price}</span>}
                      <span className="text-[10px] text-white/20 ml-auto">
                        {members.find((m) => m.name === item.addedBy)?.emoji} {item.addedBy}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.linkUrl && (
                        <a href={item.linkUrl} target="_blank" rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-white/5 text-white/40 text-xs hover:text-white transition-all">🔗 View</a>
                      )}
                      {!isMine && (
                        <button onClick={() => handleClaim(item.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            claimedByMe ? 'bg-green-500/15 text-green-400' : isClaimed ? 'bg-white/5 text-white/20' : 'bg-pink-500/10 text-pink-400 hover:bg-pink-500/20'}`}>
                          {claimedByMe ? '✓ I got this' : isClaimed ? `Claimed by ${item.claimedBy}` : '🎁 I\'ll get this'}
                        </button>
                      )}
                      {isMine && (
                        <button onClick={() => handleDelete(item.id)}
                          className="px-3 py-1.5 rounded-lg bg-white/5 text-white/15 text-xs hover:text-red-400 transition-colors ml-auto">Remove</button>
                      )}
                    </div>
                    {isClaimed && isMine && (
                      <p className="text-[10px] text-green-400/50 mt-2">🎉 Someone is getting this for you!</p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

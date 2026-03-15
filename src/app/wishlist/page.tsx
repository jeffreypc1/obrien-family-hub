'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useFamilyMember } from '@/components/FamilyContext';
import ThemedBackground from '@/components/ThemedBackground';

interface WishComment { id: string; authorName: string; authorEmoji: string | null; text: string; createdAt: string; }
interface WishItem {
  id: string; title: string; description: string | null; imageUrl: string | null;
  linkUrl: string | null; price: string | null; category: string; priority: string;
  addedBy: string; claimedBy: string | null; archived: number | null; comments: WishComment[];
}

const PRIORITIES: Record<string, { label: string; color: string; icon: string }> = {
  'must-have': { label: 'Must Have', color: '#EF4444', icon: '🔴' },
  'really-want': { label: 'Really Want', color: '#F59E0B', icon: '🟡' },
  'nice-to-have': { label: 'Nice to Have', color: '#6366F1', icon: '🔵' },
  'dream': { label: 'Dream', color: '#C084FC', icon: '💭' },
};

const CATEGORIES: Record<string, { icon: string; label: string }> = {
  general: { icon: '🎁', label: 'General' }, electronics: { icon: '📱', label: 'Electronics' },
  books: { icon: '📚', label: 'Books' }, clothing: { icon: '👕', label: 'Clothing' },
  experiences: { icon: '🎪', label: 'Experiences' }, travel: { icon: '✈️', label: 'Travel' },
  home: { icon: '🏠', label: 'Home' }, games: { icon: '🎮', label: 'Games' }, other: { icon: '💫', label: 'Other' },
};

export default function WishlistPage() {
  const { currentMember, members, setShowPicker } = useFamilyMember();
  const [items, setItems] = useState<WishItem[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null);
  const [expandedWish, setExpandedWish] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  // Form
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newImage, setNewImage] = useState('');
  const [newLink, setNewLink] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newCat, setNewCat] = useState('general');
  const [newPriority, setNewPriority] = useState('nice-to-have');

  const fetchItems = () => fetch(`/api/wishlist${showArchived ? '?archived=1' : ''}`).then((r) => r.json()).then(setItems);
  useEffect(() => { fetchItems(); }, [showArchived]);

  const handleAdd = async () => {
    if (!currentMember || !newTitle.trim()) return;
    await fetch('/api/wishlist', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: newTitle.trim(), description: newDesc.trim() || null,
        imageUrl: newImage.trim() || null, linkUrl: newLink.trim() || null,
        price: newPrice.trim() || null, category: newCat, priority: newPriority, addedBy: currentMember.name,
      }),
    });
    setNewTitle(''); setNewDesc(''); setNewImage(''); setNewLink(''); setNewPrice('');
    setShowAdd(false); fetchItems();
  };

  const handleClaim = async (id: string) => {
    if (!currentMember) { setShowPicker(true); return; }
    const item = items.find((i) => i.id === id);
    await fetch('/api/wishlist', { method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, claimedBy: item?.claimedBy === currentMember.name ? null : currentMember.name }) });
    fetchItems();
  };

  const handleArchive = async (id: string) => {
    const item = items.find((i) => i.id === id);
    await fetch('/api/wishlist', { method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, archived: item?.archived ? 0 : 1 }) });
    fetchItems();
  };

  const handleComment = async (wishId: string) => {
    if (!currentMember || !commentText.trim()) return;
    await fetch('/api/wishlist', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'comment', wishId, authorName: currentMember.name, authorEmoji: currentMember.emoji, text: commentText.trim() }) });
    setCommentText(''); fetchItems();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/wishlist?id=${id}`, { method: 'DELETE' }); fetchItems();
  };

  // People who have wishes
  const peopleWithWishes = members.filter((m) => items.some((i) => i.addedBy === m.name && !i.archived));
  const selectedItems = selectedPerson
    ? items.filter((i) => i.addedBy === selectedPerson && (showArchived || !i.archived))
    : [];

  return (
    <div className="min-h-screen relative">
      <ThemedBackground theme="recommendations" />

      <div className="border-b border-white/5">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-white/40 hover:text-white/80 transition-colors text-sm">← Back to Hub</Link>
          <span className="text-white/30 text-sm">{currentMember?.emoji} {currentMember?.name}</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">🎁 Wish List</h1>
            <p className="text-white/40 text-sm mt-1">Tap a person to see what they want</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { if (!currentMember) { setShowPicker(true); return; } setShowAdd(true); }}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-medium text-sm hover:scale-105 transition-transform">
              + Add Wish
            </button>
            <button onClick={() => setShowArchived(!showArchived)}
              className={`px-4 py-2.5 rounded-xl text-xs transition-all ${showArchived ? 'bg-white/10 text-white' : 'bg-white/5 text-white/30'}`}>
              📦 {showArchived ? 'Hide' : 'Show'} Archived
            </button>
          </div>
        </div>

        {/* Add form */}
        <AnimatePresence>
          {showAdd && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="glass rounded-2xl p-6 mb-8 space-y-4">
              <h3 className="text-sm font-medium text-white/60">Add to your wish list</h3>
              <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="What do you want?" autoFocus
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 text-sm focus:outline-none" />
              <textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Details — size, color, why you want it..." rows={2}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 text-sm resize-none focus:outline-none" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <select value={newCat} onChange={(e) => setNewCat(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm [&>option]:bg-gray-900">
                  {Object.entries(CATEGORIES).map(([k, c]) => <option key={k} value={k}>{c.icon} {c.label}</option>)}
                </select>
                <select value={newPriority} onChange={(e) => setNewPriority(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm [&>option]:bg-gray-900">
                  {Object.entries(PRIORITIES).map(([k, p]) => <option key={k} value={k}>{p.icon} {p.label}</option>)}
                </select>
                <input type="text" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} placeholder="Price"
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder-white/20" />
                <input type="text" value={newLink} onChange={(e) => setNewLink(e.target.value)} placeholder="Link (auto-fetches image!)"
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder-white/20" />
              </div>
              <input type="text" value={newImage} onChange={(e) => setNewImage(e.target.value)} placeholder="Image URL (optional — leave blank if you added a link)"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 text-sm" />
              <div className="flex gap-2">
                <button onClick={handleAdd} disabled={!newTitle.trim()}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-medium text-sm disabled:opacity-30">Add to List</button>
                <button onClick={() => setShowAdd(false)} className="px-4 py-2.5 rounded-xl bg-white/5 text-white/40 text-sm">Cancel</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!selectedPerson ? (
          /* ====== PERSON CARDS ====== */
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            {peopleWithWishes.map((person, i) => {
              const personItems = items.filter((it) => it.addedBy === person.name && !it.archived);
              const topPriority = personItems.sort((a, b) => {
                const order = ['must-have', 'really-want', 'nice-to-have', 'dream'];
                return order.indexOf(a.priority) - order.indexOf(b.priority);
              })[0];
              const previewImage = personItems.find((it) => it.imageUrl)?.imageUrl;

              return (
                <motion.button key={person.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => setSelectedPerson(person.name)}
                  className="glass rounded-2xl overflow-hidden text-left group hover:border-white/15 transition-all">
                  {/* Preview image */}
                  <div className="h-32 bg-gradient-to-br from-pink-950/50 to-rose-950/50 overflow-hidden relative">
                    {previewImage && (
                      <img src={previewImage} alt="" className="w-full h-full object-cover opacity-40 group-hover:opacity-60 group-hover:scale-105 transition-all duration-500" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-3 left-4">
                      <span className="text-4xl">{person.emoji}</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h2 className="text-xl font-bold mb-1" style={{ color: person.color }}>{person.name}</h2>
                    <p className="text-white/30 text-sm">{personItems.length} wish{personItems.length !== 1 ? 'es' : ''}</p>
                    {topPriority && (
                      <p className="text-white/20 text-xs mt-2 truncate">
                        Top: {topPriority.title}
                      </p>
                    )}
                  </div>
                </motion.button>
              );
            })}

            {peopleWithWishes.length === 0 && (
              <div className="col-span-full text-center py-20 text-white/20">
                <div className="text-5xl mb-4">🎁</div>
                <p>No wishes yet. Add something!</p>
              </div>
            )}
          </div>
        ) : (
          /* ====== PERSON'S WISH LIST ====== */
          <div>
            <button onClick={() => setSelectedPerson(null)}
              className="text-white/40 hover:text-white text-sm mb-6 flex items-center gap-2">
              ← Back to everyone
            </button>

            <div className="flex items-center gap-4 mb-8">
              <span className="text-5xl">{members.find((m) => m.name === selectedPerson)?.emoji}</span>
              <div>
                <h2 className="text-3xl font-bold" style={{ color: members.find((m) => m.name === selectedPerson)?.color }}>
                  {selectedPerson}&apos;s Wishes
                </h2>
                <p className="text-white/30 text-sm">{selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''}</p>
              </div>
            </div>

            <div className="space-y-4">
              {selectedItems.map((item, i) => {
                const pri = PRIORITIES[item.priority] || PRIORITIES['nice-to-have'];
                const cat = CATEGORIES[item.category] || CATEGORIES.general;
                const isMine = item.addedBy === currentMember?.name;
                const isExpanded = expandedWish === item.id;
                const isClaimed = !!item.claimedBy;
                const claimedByMe = item.claimedBy === currentMember?.name;

                return (
                  <motion.div key={item.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`glass rounded-2xl overflow-hidden ${item.archived ? 'opacity-40' : ''}`}>
                    <div className="flex">
                      {/* Image */}
                      {item.imageUrl && (
                        <div className="w-36 md:w-48 flex-shrink-0 overflow-hidden">
                          <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                        </div>
                      )}

                      {/* Content */}
                      <div className="flex-1 p-5">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div>
                            <h3 className="text-lg font-bold">{item.title}</h3>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: `${pri.color}20`, color: pri.color }}>
                                {pri.icon} {pri.label}
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/30">{cat.icon} {cat.label}</span>
                              {item.price && <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">💰 {item.price}</span>}
                            </div>
                          </div>
                        </div>

                        {item.description && <p className="text-white/40 text-sm mb-3">{item.description}</p>}

                        {/* Actions */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {item.linkUrl && (
                            <a href={item.linkUrl} target="_blank" rel="noopener noreferrer"
                              className="px-3 py-1.5 rounded-lg bg-white/5 text-white/40 text-xs hover:text-white">🔗 View Item</a>
                          )}
                          {!isMine && !item.archived && (
                            <button onClick={() => handleClaim(item.id)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                claimedByMe ? 'bg-green-500/15 text-green-400' : isClaimed ? 'bg-white/5 text-white/20' : 'bg-pink-500/10 text-pink-400'}`}>
                              {claimedByMe ? '✓ I got this' : isClaimed ? `Claimed` : '🎁 I\'ll get this'}
                            </button>
                          )}
                          <button onClick={() => setExpandedWish(isExpanded ? null : item.id)}
                            className="px-3 py-1.5 rounded-lg bg-white/5 text-white/30 text-xs hover:text-white">
                            💬 {item.comments.length > 0 ? item.comments.length : 'Comment'}
                          </button>
                          {isMine && (
                            <>
                              <button onClick={() => handleArchive(item.id)}
                                className="px-3 py-1.5 rounded-lg bg-white/5 text-white/15 text-xs hover:text-white/40">
                                {item.archived ? '↩ Restore' : '📦 Archive'}
                              </button>
                              <button onClick={() => handleDelete(item.id)}
                                className="px-3 py-1.5 rounded-lg bg-white/5 text-white/10 text-xs hover:text-red-400 ml-auto">✕</button>
                            </>
                          )}
                        </div>

                        {/* Claimed notice for owner */}
                        {isClaimed && isMine && !item.archived && (
                          <p className="text-green-400/50 text-xs mt-2">🎉 Someone is getting this for you!</p>
                        )}

                        {/* Comments */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                              className="mt-4 pt-4 border-t border-white/5 space-y-3 overflow-hidden">
                              {item.comments.map((c) => (
                                <div key={c.id} className="flex gap-2">
                                  <span className="text-sm">{c.authorEmoji || '💬'}</span>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[11px] font-medium text-white/50">{c.authorName}</span>
                                      <span className="text-[9px] text-white/15">{new Date(c.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-sm text-white/60">{c.text}</p>
                                  </div>
                                </div>
                              ))}
                              <div className="flex gap-2">
                                <input type="text" value={expandedWish === item.id ? commentText : ''}
                                  onChange={(e) => setCommentText(e.target.value)}
                                  onKeyDown={(e) => e.key === 'Enter' && handleComment(item.id)}
                                  placeholder="Ask a question or comment..."
                                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none" />
                                <button onClick={() => handleComment(item.id)} disabled={!commentText.trim()}
                                  className="px-4 py-2 rounded-lg bg-white/5 text-white/40 text-xs disabled:opacity-20">Send</button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useFamilyMember } from '@/components/FamilyContext';
import ThemedBackground from '@/components/ThemedBackground';

interface Comment { id: string; authorName: string; authorEmoji: string | null; text: string; createdAt: string; }
interface Rec { id: string; category: string; title: string; description: string | null; imageUrl: string | null; linkUrl: string | null; linkLabel: string | null; recommendedBy: string; likes: number; likedByJson: string | null; comments: Comment[]; createdAt: string; }

const CATEGORIES: Record<string, { icon: string; color: string; label: string }> = {
  movies: { icon: '📺', color: '#818CF8', label: 'Movies & TV' },
  books: { icon: '📚', color: '#F59E0B', label: 'Books' },
  podcasts: { icon: '🎧', color: '#34D399', label: 'Podcasts & Music' },
  travel: { icon: '✈️', color: '#22D3EE', label: 'Travel' },
  restaurants: { icon: '🍽️', color: '#FB923C', label: 'Restaurants' },
  products: { icon: '🛍️', color: '#F472B6', label: 'Things We Love' },
  lifehacks: { icon: '💡', color: '#FBBF24', label: 'Life Hacks' },
  recipes: { icon: '🍳', color: '#F97316', label: 'Recipes' },
  videos: { icon: '🎬', color: '#A78BFA', label: 'Videos' },
  articles: { icon: '📰', color: '#60A5FA', label: 'Articles' },
  activities: { icon: '🎯', color: '#2DD4BF', label: 'Things to Do' },
  website: { icon: '🌐', color: '#6366F1', label: 'Family Website Ideas' },
  other: { icon: '💬', color: '#9CA3AF', label: 'Other' },
};

export default function RecommendationsPage() {
  const { currentMember, setShowPicker } = useFamilyMember();
  const [recs, setRecs] = useState<Rec[]>([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');

  // Form
  const [newCat, setNewCat] = useState('movies');
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newImage, setNewImage] = useState('');
  const [newLink, setNewLink] = useState('');
  const [newLinkLabel, setNewLinkLabel] = useState('');

  const fetchRecs = () => fetch('/api/recommendations').then((r) => r.json()).then(setRecs);
  useEffect(() => { fetchRecs(); }, []);

  const handleAdd = async () => {
    if (!currentMember || !newTitle.trim()) return;
    await fetch('/api/recommendations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category: newCat, title: newTitle.trim(), description: newDesc.trim() || null,
        imageUrl: newImage.trim() || null, linkUrl: newLink.trim() || null,
        linkLabel: newLinkLabel.trim() || null, recommendedBy: currentMember.name,
      }),
    });
    setNewTitle(''); setNewDesc(''); setNewImage(''); setNewLink(''); setNewLinkLabel('');
    setShowAdd(false);
    fetchRecs();
  };

  const handleLike = async (id: string) => {
    if (!currentMember) { setShowPicker(true); return; }
    await fetch('/api/recommendations', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'like', userName: currentMember.name }),
    });
    fetchRecs();
  };

  const handleComment = async (recId: string) => {
    if (!currentMember || !commentText.trim()) return;
    await fetch('/api/rec-comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recommendationId: recId, authorName: currentMember.name,
        authorEmoji: currentMember.emoji, text: commentText.trim(),
      }),
    });
    setCommentText('');
    fetchRecs();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/recommendations?id=${id}`, { method: 'DELETE' });
    fetchRecs();
  };

  // Filter and search
  const filtered = recs
    .filter((r) => filter === 'all' || r.category === filter)
    .filter((r) => !search || r.title.toLowerCase().includes(search.toLowerCase()) || r.description?.toLowerCase().includes(search.toLowerCase()));

  const isLiked = (r: Rec) => {
    if (!currentMember) return false;
    try { return JSON.parse(r.likedByJson || '[]').includes(currentMember.name); } catch { return false; }
  };

  return (
    <div className="min-h-screen relative">
      <ThemedBackground theme="recommendations" />

      <div className="border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-white/40 hover:text-white/80 transition-colors text-sm">← Back to Hub</Link>
          <span className="text-white/30 text-sm">{currentMember?.emoji} {currentMember?.name}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">💡 O&apos;Brien Recommendation Board</h1>
          <p className="text-white/40 text-sm">Share what you love. Discover what the family is into.</p>
        </div>

        {/* Add + Search bar */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <button onClick={() => { if (!currentMember) { setShowPicker(true); return; } setShowAdd(true); }}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-sm hover:scale-105 transition-transform shadow-lg shadow-amber-500/20">
            + Add Recommendation
          </button>
          <div className="flex-1 min-w-[200px]">
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="🔍 Search recommendations..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-white placeholder-white/25 focus:outline-none focus:border-amber-500/50 text-sm" />
          </div>
        </div>

        {/* Category filters */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 flex-wrap">
          <button onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
              filter === 'all' ? 'bg-white/10 text-white' : 'bg-white/5 text-white/35 hover:text-white/60'}`}>
            All ({recs.length})
          </button>
          {Object.entries(CATEGORIES).map(([key, cat]) => {
            const count = recs.filter((r) => r.category === key).length;
            if (count === 0 && filter !== key) return null;
            return (
              <button key={key} onClick={() => setFilter(key)}
                className={`px-4 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                  filter === key ? 'text-white' : 'bg-white/5 text-white/35 hover:text-white/60'}`}
                style={filter === key ? { background: `${cat.color}20`, border: `1px solid ${cat.color}40` } : {}}>
                {cat.icon} {cat.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Add form */}
        <AnimatePresence>
          {showAdd && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="glass rounded-2xl p-6 mb-8 space-y-4">
              <h3 className="text-sm font-medium text-white/60">Share a recommendation</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select value={newCat} onChange={(e) => setNewCat(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm [&>option]:bg-gray-900">
                  {Object.entries(CATEGORIES).map(([key, cat]) => (
                    <option key={key} value={key}>{cat.icon} {cat.label}</option>
                  ))}
                </select>
                <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="What are you recommending?" autoFocus
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 focus:outline-none text-sm" />
              </div>
              <textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Why do you recommend it? (1-2 sentences)" rows={2}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 focus:outline-none text-sm resize-none" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input type="text" value={newImage} onChange={(e) => setNewImage(e.target.value)}
                  placeholder="Image URL (optional)"
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 focus:outline-none text-sm" />
                <input type="text" value={newLink} onChange={(e) => setNewLink(e.target.value)}
                  placeholder="Link URL (optional)"
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 focus:outline-none text-sm" />
                <input type="text" value={newLinkLabel} onChange={(e) => setNewLinkLabel(e.target.value)}
                  placeholder="Link label (e.g., Watch on Netflix)"
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 focus:outline-none text-sm" />
              </div>
              <div className="flex gap-2">
                <button onClick={handleAdd} disabled={!newTitle.trim()}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium text-sm disabled:opacity-30">Share</button>
                <button onClick={() => setShowAdd(false)} className="px-4 py-2.5 rounded-xl bg-white/5 text-white/40 text-sm">Cancel</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Masonry grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-white/20">
            <div className="text-5xl mb-4">💡</div>
            <p>{search ? 'No results found.' : 'No recommendations yet. Be the first to share!'}</p>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
            {filtered.map((rec, i) => {
              const cat = CATEGORIES[rec.category] || CATEGORIES.other;
              const liked = isLiked(rec);
              const isExpanded = expandedCard === rec.id;

              return (
                <motion.div key={rec.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="break-inside-avoid glass rounded-2xl overflow-hidden group hover:border-white/15 transition-all">

                  {/* Image */}
                  {rec.imageUrl && (
                    <div className="relative overflow-hidden">
                      <img src={rec.imageUrl} alt={rec.title} className="w-full object-cover group-hover:scale-105 transition-transform duration-500" style={{ maxHeight: '250px' }} />
                      <div className="absolute top-2 left-2">
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider"
                          style={{ background: `${cat.color}CC`, color: 'white' }}>
                          {cat.icon} {cat.label}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="p-4">
                    {/* Category tag (if no image) */}
                    {!rec.imageUrl && (
                      <span className="inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider mb-2"
                        style={{ background: `${cat.color}20`, color: cat.color }}>
                        {cat.icon} {cat.label}
                      </span>
                    )}

                    {/* Title */}
                    <h3 className="font-bold text-sm mb-1">{rec.title}</h3>

                    {/* Description */}
                    {rec.description && <p className="text-white/40 text-xs leading-relaxed mb-3">{rec.description}</p>}

                    {/* Recommended by */}
                    <p className="text-[10px] text-white/25 mb-3">
                      Recommended by <strong className="text-white/40">{rec.recommendedBy}</strong> · {new Date(rec.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>

                    {/* Link */}
                    {rec.linkUrl && (
                      <a href={rec.linkUrl} target="_blank" rel="noopener noreferrer"
                        className="inline-block px-4 py-2 rounded-xl text-xs font-medium transition-all mb-3 hover:scale-105"
                        style={{ background: `${cat.color}15`, color: cat.color, border: `1px solid ${cat.color}30` }}>
                        {rec.linkLabel || '🔗 Check it out'} →
                      </a>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-2 border-t border-white/5">
                      <button onClick={() => handleLike(rec.id)}
                        className={`flex items-center gap-1 text-xs transition-all ${liked ? 'text-red-400' : 'text-white/25 hover:text-red-400'}`}>
                        {liked ? '❤️' : '🤍'} {rec.likes > 0 && rec.likes}
                      </button>
                      <button onClick={() => setExpandedCard(isExpanded ? null : rec.id)}
                        className="flex items-center gap-1 text-xs text-white/25 hover:text-white/50">
                        💬 {rec.comments.length > 0 && rec.comments.length}
                      </button>
                      {rec.recommendedBy === currentMember?.name && (
                        <button onClick={() => handleDelete(rec.id)}
                          className="text-white/10 hover:text-red-400 text-xs ml-auto transition-colors opacity-0 group-hover:opacity-100">✕</button>
                      )}
                    </div>

                    {/* Comments */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                          className="mt-3 pt-3 border-t border-white/5 space-y-2 overflow-hidden">
                          {rec.comments.map((c) => (
                            <div key={c.id} className="flex gap-2">
                              <span className="text-sm">{c.authorEmoji || '💬'}</span>
                              <div>
                                <span className="text-[10px] font-medium text-white/40">{c.authorName}</span>
                                <p className="text-xs text-white/50">{c.text}</p>
                              </div>
                            </div>
                          ))}
                          <div className="flex gap-2 mt-2">
                            <input type="text" value={expandedCard === rec.id ? commentText : ''} onChange={(e) => setCommentText(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleComment(rec.id)}
                              placeholder="Add a comment..."
                              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-white/20 focus:outline-none" />
                            <button onClick={() => handleComment(rec.id)} disabled={!commentText.trim()}
                              className="px-3 py-1.5 rounded-lg bg-white/5 text-white/40 text-xs hover:text-white disabled:opacity-20">Send</button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
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

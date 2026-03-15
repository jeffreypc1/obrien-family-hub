'use client';
import ThemedBackground from '@/components/ThemedBackground';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useFamilyMember } from '@/components/FamilyContext';

interface RecipeRating {
  id: string;
  memberName: string;
  stars: number;
  createdAt: string;
}

interface RecipeItem {
  id: string;
  tabId: string;
  title: string;
  url: string | null;
  youtubeId: string | null;
  imageUrl: string | null;
  description: string | null;
  servings: number | null;
  source: string | null;
  addedBy: string | null;
  tagsJson: string | null;
  ratings: RecipeRating[];
}

interface RecipeTagItem {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface RecipeTab {
  id: string;
  name: string;
  icon: string;
  _count: { items: number };
}

export default function RecipesPage() {
  const { currentMember, setShowPicker } = useFamilyMember();
  const [tabs, setTabs] = useState<RecipeTab[]>([]);
  const [activeTab, setActiveTab] = useState('');
  const [items, setItems] = useState<RecipeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddRecipe, setShowAddRecipe] = useState(false);
  const [showAddTab, setShowAddTab] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [adding, setAdding] = useState(false);
  const [newTabName, setNewTabName] = useState('');
  const [newTabIcon, setNewTabIcon] = useState('🍽️');
  const [allTags, setAllTags] = useState<RecipeTagItem[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);
  const [newCustomTag, setNewCustomTag] = useState('');

  const fetchTabs = useCallback(async () => {
    const res = await fetch('/api/recipes/tabs');
    const data = await res.json();
    setTabs(data);
    if (data.length > 0 && !activeTab) setActiveTab(data[0].id);
  }, [activeTab]);

  const fetchItems = useCallback(async () => {
    if (!activeTab) return;
    const res = await fetch(`/api/recipes/items?tabId=${activeTab}`);
    setItems(await res.json());
    setLoading(false);
  }, [activeTab]);

  const fetchTags = useCallback(async () => {
    const res = await fetch('/api/recipe-tags');
    setAllTags(await res.json());
  }, []);

  useEffect(() => { fetchTabs(); fetchTags(); }, [fetchTabs, fetchTags]);
  useEffect(() => { if (activeTab) fetchItems(); }, [activeTab, fetchItems]);

  const handleAddRecipe = async () => {
    if (!newTitle.trim() && !newUrl.trim()) return;
    setAdding(true);
    const res = await fetch('/api/recipes/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tabId: activeTab,
        title: newTitle.trim() || 'auto',
        url: newUrl.trim() || null,
        addedBy: currentMember?.name || 'Anonymous',
        tagsJson: selectedTags.length > 0 ? JSON.stringify(selectedTags) : null,
      }),
    });
    if (res.ok) {
      setNewUrl('');
      setNewTitle('');
      setSelectedTags([]);
      setShowAddRecipe(false);
      fetchItems();
      fetchTabs();
    }
    setAdding(false);
  };

  const handleAddTab = async () => {
    if (!newTabName.trim()) return;
    await fetch('/api/recipes/tabs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newTabName.trim(), icon: newTabIcon }),
    });
    setNewTabName('');
    setShowAddTab(false);
    fetchTabs();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this recipe?')) return;
    await fetch(`/api/recipes/items?id=${id}`, { method: 'DELETE' });
    fetchItems();
    fetchTabs();
  };

  const handleRate = async (recipeId: string, stars: number) => {
    if (!currentMember) { setShowPicker(true); return; }
    await fetch('/api/recipes/ratings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipeId, memberName: currentMember.name, stars }),
    });
    fetchItems();
  };

  const activeTabData = tabs.find((t) => t.id === activeTab);
  const TAB_ICONS = ['🍽️', '🥘', '🥗', '🍰', '🥞', '🍹', '🍿', '🍕', '🌮', '🍜', '🧁', '🥩', '🐟', '🥖', '🫕'];

  return (
    <div className="min-h-screen relative"><ThemedBackground theme="kitchen" />
      <div className="border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-white/40 hover:text-white/80 transition-colors text-sm">← Back to Hub</Link>
          <Link href="/recipes/shopping" className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white/60 hover:text-white hover:bg-white/10 transition-all">
            🛒 Shopping List
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="text-6xl mb-4">👨‍🍳</div>
          <h1 className="text-5xl font-bold gradient-text bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 mb-3">
            Family Recipes
          </h1>
          <p className="text-white/40 text-lg">Cook together, rate everything, build the family cookbook</p>
        </motion.div>

        {/* Tab bar */}
        <div className="flex gap-2 mb-10 flex-wrap items-center">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => { setActiveTab(tab.id); setLoading(true); }}
              className={`px-5 py-3 rounded-2xl text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-orange-500/15 border border-orange-500/30 text-white scale-105'
                  : 'bg-white/5 text-white/40 hover:text-white/70'
              }`}>
              <span className="mr-1.5">{tab.icon}</span>
              {tab.name}
              <span className="ml-2 text-xs opacity-40">({tab._count.items})</span>
            </button>
          ))}
          {!showAddTab ? (
            <button onClick={() => setShowAddTab(true)}
              className="px-4 py-3 rounded-2xl border-2 border-dashed border-white/10 text-white/20 hover:text-white/50 hover:border-white/25 text-sm transition-all">
              + Tab
            </button>
          ) : (
            <div className="flex gap-2 items-center glass rounded-2xl p-2">
              <div className="flex gap-1">
                {TAB_ICONS.slice(0, 8).map((icon) => (
                  <button key={icon} onClick={() => setNewTabIcon(icon)}
                    className={`text-lg p-1 rounded ${newTabIcon === icon ? 'bg-white/15' : ''}`}>{icon}</button>
                ))}
              </div>
              <input type="text" value={newTabName} onChange={(e) => setNewTabName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTab()}
                placeholder="Tab name..." autoFocus
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none w-32" />
              <button onClick={handleAddTab} className="px-3 py-2 rounded-lg bg-orange-500/20 text-orange-400 text-sm font-medium">Add</button>
              <button onClick={() => setShowAddTab(false)} className="text-white/30 text-sm px-2">✕</button>
            </div>
          )}
        </div>

        {/* Tag filter bar */}
        {(() => {
          // Get tags used in current tab's items
          const tabTags = new Set<string>();
          items.forEach((item) => {
            if (item.tagsJson) {
              try { (JSON.parse(item.tagsJson) as string[]).forEach((t) => tabTags.add(t)); } catch {}
            }
          });
          const usedTags = allTags.filter((t) => tabTags.has(t.name));

          if (usedTags.length === 0) return null;
          return (
            <div className="flex gap-1.5 mb-6 flex-wrap">
              <button onClick={() => setActiveTagFilter(null)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  !activeTagFilter ? 'bg-white/10 text-white' : 'bg-white/5 text-white/30 hover:text-white/60'}`}>
                All
              </button>
              {usedTags.map((tag) => {
                const count = items.filter((item) => {
                  try { return item.tagsJson && (JSON.parse(item.tagsJson) as string[]).includes(tag.name); } catch { return false; }
                }).length;
                return (
                  <button key={tag.id} onClick={() => setActiveTagFilter(activeTagFilter === tag.name ? null : tag.name)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      activeTagFilter === tag.name ? 'text-white' : 'text-white/30 hover:text-white/60'}`}
                    style={activeTagFilter === tag.name ? { background: `${tag.color}25`, border: `1px solid ${tag.color}40`, color: tag.color } : { background: 'rgba(255,255,255,0.03)' }}>
                    {tag.icon} {tag.name} <span className="opacity-50 ml-0.5">({count})</span>
                  </button>
                );
              })}
            </div>
          );
        })()}

        {/* Recipe cards grid */}
        {loading ? (
          <div className="flex justify-center py-20"><div className="text-4xl animate-spin">🍳</div></div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div key={`${activeTab}-${activeTagFilter}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.filter((item) => {
                if (!activeTagFilter) return true;
                try { return item.tagsJson && (JSON.parse(item.tagsJson) as string[]).includes(activeTagFilter); } catch { return false; }
              }).map((item, i) => {
                const avgRating = item.ratings.length
                  ? item.ratings.reduce((s, r) => s + r.stars, 0) / item.ratings.length : 0;
                const myRating = item.ratings.filter((r) => r.memberName === currentMember?.name);
                const myLatest = myRating.length ? myRating[myRating.length - 1].stars : 0;
                const itemTags: string[] = item.tagsJson ? JSON.parse(item.tagsJson) : [];

                return (
                  <motion.div key={item.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }} className="relative group/card">
                    {/* Delete */}
                    <button onClick={() => handleDelete(item.id)}
                      className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full bg-black/70 text-white/40 hover:text-red-400 hover:bg-black/90 flex items-center justify-center text-xs opacity-0 group-hover/card:opacity-100 transition-all">✕</button>

                    <Link href={`/recipes/watch?id=${item.id}`}>
                      <div className="glass rounded-2xl overflow-hidden group cursor-pointer hover:border-white/20 transition-all"
                        style={{ boxShadow: '0 0 40px rgba(249, 115, 22, 0.05)' }}>
                        {/* Thumbnail */}
                        <div className="relative aspect-video bg-gradient-to-br from-orange-950/50 to-red-950/50 overflow-hidden">
                          {item.imageUrl || item.youtubeId ? (
                            <img src={item.imageUrl || `https://img.youtube.com/vi/${item.youtubeId}/mqdefault.jpg`}
                              alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-5xl">
                              {activeTabData?.icon || '🍽️'}
                            </div>
                          )}
                          {item.youtubeId && (
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                              <span className="text-4xl opacity-0 group-hover:opacity-100 transition-opacity">▶️</span>
                            </div>
                          )}
                          {avgRating > 0 && (
                            <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm rounded-full px-3 py-1 text-sm flex items-center gap-1">
                              ⭐ <span className="font-bold">{avgRating.toFixed(1)}</span>
                              <span className="text-white/40">({item.ratings.length})</span>
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="p-4">
                          <h3 className="font-bold text-sm leading-snug mb-1 group-hover:text-white transition-colors line-clamp-2">{item.title}</h3>
                          {item.source && <p className="text-white/30 text-xs">{item.source}</p>}
                          {itemTags.length > 0 && (
                            <div className="flex gap-1 mt-1.5 flex-wrap">
                              {itemTags.map((tagName) => {
                                const tag = allTags.find((t) => t.name === tagName);
                                return (
                                  <span key={tagName} className="text-[9px] px-1.5 py-0.5 rounded-full"
                                    style={{ background: `${tag?.color || '#6B7280'}15`, color: tag?.color || '#6B7280' }}>
                                    {tag?.icon || '🏷️'} {tagName}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                          {item.description && <p className="text-white/25 text-xs mt-1 line-clamp-2">{item.description}</p>}
                        </div>
                      </div>
                    </Link>

                    {/* Quick rate + tag bar */}
                    <div className="flex items-center gap-1 mt-2 px-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button key={star} onClick={() => handleRate(item.id, star)}
                          className="star-btn text-lg select-none">
                          {star <= myLatest ? '⭐' : '☆'}
                        </button>
                      ))}
                      {myLatest > 0 && <span className="text-[10px] text-white/20 ml-1">Your: {myLatest}★</span>}
                      <button onClick={async (e) => {
                        e.preventDefault();
                        const tagNames = prompt('Enter tags (comma separated):\n\nAvailable: ' + allTags.map((t) => t.name).join(', ') + '\n\nCurrent: ' + itemTags.join(', '));
                        if (tagNames !== null) {
                          const tags = tagNames.split(',').map((t) => t.trim()).filter(Boolean);
                          await fetch('/api/recipes/items', { method: 'PUT', headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id: item.id, tagsJson: JSON.stringify(tags) }) });
                          fetchItems();
                        }
                      }} className="px-2 py-1 rounded-lg bg-white/5 text-white/40 hover:text-white hover:bg-white/10 text-xs ml-auto transition-all" title="Edit tags">
                        🏷️ Tags
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Add recipe */}
        <div className="mt-8">
          {!showAddRecipe ? (
            <button onClick={() => setShowAddRecipe(true)}
              className="w-full py-4 rounded-2xl border-2 border-dashed border-white/10 text-white/30 hover:text-white/60 hover:border-white/25 transition-all text-sm flex items-center justify-center gap-2">
              <span className="text-lg">+</span> Add a recipe to {activeTabData?.name || 'this tab'}
            </button>
          ) : (
            <div className="glass rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-medium text-white/60">Add recipe to {activeTabData?.icon} {activeTabData?.name}</h3>
              <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Recipe name (or leave blank to auto-detect from URL)"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-orange-500 text-sm" />
              <input type="text" value={newUrl} onChange={(e) => setNewUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddRecipe()}
                placeholder="Paste YouTube URL or any recipe link (optional)"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-orange-500 text-sm" />
              {/* Tag selector */}
              <div>
                <label className="text-xs text-white/30 block mb-2">Tags</label>
                <div className="flex gap-1.5 flex-wrap">
                  {allTags.map((tag) => {
                    const isSelected = selectedTags.includes(tag.name);
                    return (
                      <button key={tag.id} type="button"
                        onClick={() => setSelectedTags((prev) => isSelected ? prev.filter((t) => t !== tag.name) : [...prev, tag.name])}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                          isSelected ? 'text-white' : 'text-white/25 hover:text-white/50'}`}
                        style={isSelected ? { background: `${tag.color}25`, border: `1px solid ${tag.color}40`, color: tag.color } : { background: 'rgba(255,255,255,0.03)' }}>
                        {tag.icon} {tag.name}
                      </button>
                    );
                  })}
                </div>
                {/* Add custom tag */}
                <div className="flex gap-2 mt-2">
                  <input type="text" value={newCustomTag} onChange={(e) => setNewCustomTag(e.target.value)}
                    placeholder="+ New tag..."
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-white/15 focus:outline-none w-32" />
                  {newCustomTag.trim() && (
                    <button onClick={async () => {
                      await fetch('/api/recipe-tags', { method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: newCustomTag.trim() }) });
                      setSelectedTags((prev) => [...prev, newCustomTag.trim()]);
                      setNewCustomTag('');
                      fetchTags();
                    }} className="px-3 py-1.5 rounded-lg bg-orange-500/15 text-orange-400 text-xs">Add</button>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={handleAddRecipe} disabled={adding || (!newTitle.trim() && !newUrl.trim())}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-medium text-sm disabled:opacity-30">
                  {adding ? 'Adding...' : 'Add Recipe'}
                </button>
                <button onClick={() => { setShowAddRecipe(false); setNewUrl(''); setNewTitle(''); setSelectedTags([]); }}
                  className="px-4 py-3 rounded-xl bg-white/5 text-white/40 text-sm">Cancel</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

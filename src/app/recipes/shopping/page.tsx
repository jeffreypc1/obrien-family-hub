'use client';
import ThemedBackground from '@/components/ThemedBackground';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useFamilyMember } from '@/components/FamilyContext';

interface ShoppingItem {
  name: string;
  quantity: number;
  unit: string;
  category: string;
  source?: string;
  checked?: boolean;
}

const CATEGORIES = ['Produce', 'Meat & Seafood', 'Dairy', 'Bakery', 'Pantry', 'Spices', 'Frozen', 'Other'];
const CATEGORY_ICONS: Record<string, string> = {
  'Produce': '🥬', 'Meat & Seafood': '🥩', 'Dairy': '🧀', 'Bakery': '🥖',
  'Pantry': '🥫', 'Spices': '🧂', 'Frozen': '🧊', 'Other': '📦',
};

export default function ShoppingPage() {
  const { currentMember, setShowPicker } = useFamilyMember();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentMember) return;
    fetch(`/api/recipes/shopping?member=${encodeURIComponent(currentMember.name)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.itemsJson) {
          try { setItems(JSON.parse(data.itemsJson)); } catch {}
        }
        setLoading(false);
      });
  }, [currentMember]);

  const saveList = async (newItems: ShoppingItem[]) => {
    if (!currentMember) return;
    setItems(newItems);
    await fetch('/api/recipes/shopping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberName: currentMember.name, itemsJson: JSON.stringify(newItems) }),
    });
  };

  const toggleCheck = (index: number) => {
    const updated = [...items];
    updated[index] = { ...updated[index], checked: !updated[index].checked };
    saveList(updated);
  };

  const removeItem = (index: number) => {
    const updated = items.filter((_, i) => i !== index);
    saveList(updated);
  };

  const clearChecked = () => {
    saveList(items.filter((i) => !i.checked));
  };

  const clearAll = () => {
    if (confirm('Clear entire shopping list?')) saveList([]);
  };

  // Group by category
  const grouped: Record<string, Array<ShoppingItem & { originalIndex: number }>> = {};
  items.forEach((item, i) => {
    const cat = item.category || 'Other';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push({ ...item, originalIndex: i });
  });

  // Generate text version for sharing
  const generateText = () => {
    let text = '🛒 O\'Brien Family Shopping List\n\n';
    for (const cat of CATEGORIES) {
      const catItems = grouped[cat];
      if (!catItems?.length) continue;
      text += `${CATEGORY_ICONS[cat] || '📦'} ${cat}\n`;
      for (const item of catItems) {
        const check = item.checked ? '✅' : '⬜';
        text += `  ${check} ${item.quantity} ${item.unit} ${item.name}`;
        if (item.source) text += ` (${item.source})`;
        text += '\n';
      }
      text += '\n';
    }
    return text;
  };

  const handleEmail = () => {
    const text = generateText();
    const subject = encodeURIComponent("O'Brien Family Shopping List");
    const body = encodeURIComponent(text);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const handleText = () => {
    const text = generateText();
    // Use SMS URI scheme
    window.open(`sms:?body=${encodeURIComponent(text)}`);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generateText());
    alert('Copied to clipboard!');
  };

  if (!currentMember) {
    return (
      <div className="min-h-screen flex items-center justify-center relative z-10">
        <div className="glass rounded-3xl p-10 max-w-md w-full text-center">
          <div className="text-5xl mb-4">🛒</div>
          <h1 className="text-2xl font-bold mb-2">Shopping List</h1>
          <p className="text-white/40 text-sm mb-6">Pick your profile to see your list</p>
          <button onClick={() => setShowPicker(true)}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-medium">
            Choose Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative"><ThemedBackground theme="shopping" />
      <div className="border-b border-white/5">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/recipes" className="text-white/40 hover:text-white/80 transition-colors text-sm">← Back to Recipes</Link>
          <span className="text-white/30 text-sm">{currentMember.emoji} {currentMember.name}</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">🛒 Shopping List</h1>
            <p className="text-white/40 text-sm mt-1">
              {items.length} items · {items.filter((i) => i.checked).length} checked off
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleCopy} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/50 hover:text-white text-xs transition-all">
              📋 Copy
            </button>
            <button onClick={handleEmail} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/50 hover:text-white text-xs transition-all">
              ✉️ Email
            </button>
            <button onClick={handleText} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/50 hover:text-white text-xs transition-all">
              💬 Text
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="text-4xl animate-spin">🛒</div></div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 text-white/30">
            <div className="text-5xl mb-4">🛒</div>
            <p>Shopping list is empty.</p>
            <p className="text-sm mt-2">Add ingredients from recipe pages!</p>
            <Link href="/recipes" className="inline-block mt-4 px-6 py-3 rounded-xl bg-white/5 text-white/60 hover:text-white transition-colors">
              Browse Recipes
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {CATEGORIES.map((cat) => {
              const catItems = grouped[cat];
              if (!catItems?.length) return null;
              return (
                <motion.div key={cat} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="glass rounded-2xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-white/10 flex items-center gap-2">
                    <span className="text-lg">{CATEGORY_ICONS[cat]}</span>
                    <h3 className="font-medium text-sm">{cat}</h3>
                    <span className="text-xs text-white/20">({catItems.length})</span>
                  </div>
                  <div className="divide-y divide-white/5">
                    {catItems.map((item) => (
                      <div key={item.originalIndex}
                        className={`flex items-center gap-4 px-5 py-3 transition-all ${item.checked ? 'opacity-40' : ''}`}>
                        <button onClick={() => toggleCheck(item.originalIndex)}
                          className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center text-xs transition-all ${
                            item.checked ? 'bg-green-500/20 border-green-500/50 text-green-400' : 'border-white/20 hover:border-white/40'
                          }`}>
                          {item.checked && '✓'}
                        </button>
                        <span className="font-mono text-orange-400 min-w-[4rem] text-right text-sm">
                          {item.quantity} {item.unit}
                        </span>
                        <span className={`flex-1 text-sm ${item.checked ? 'line-through' : ''}`}>{item.name}</span>
                        {item.source && <span className="text-[10px] text-white/15 hidden sm:block">{item.source}</span>}
                        <button onClick={() => removeItem(item.originalIndex)}
                          className="text-white/15 hover:text-red-400 text-xs transition-colors">✕</button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })}

            <div className="flex gap-3 justify-center pt-4">
              {items.some((i) => i.checked) && (
                <button onClick={clearChecked}
                  className="px-5 py-2.5 rounded-xl bg-white/5 text-white/40 text-sm hover:text-white transition-all">
                  Remove checked items
                </button>
              )}
              <button onClick={clearAll}
                className="px-5 py-2.5 rounded-xl bg-red-500/10 text-red-400/60 text-sm hover:text-red-400 transition-all">
                Clear all
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useFamilyMember } from '@/components/FamilyContext';
import ThemedBackground from '@/components/ThemedBackground';

interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
  category: string; // Produce, Meat, Dairy, Pantry, Spices, Frozen, Other
}

interface RecipeData {
  id: string;
  title: string;
  url: string | null;
  youtubeId: string | null;
  description: string | null;
  servings: number | null;
  prepTime: number | null;
  cookTime: number | null;
  ingredientsJson: string | null;
  instructionsJson: string | null;
  source: string | null;
  ratings: Array<{ memberName: string; stars: number }>;
  tab: { name: string; icon: string };
}

const UNIT_CONVERSIONS: Record<string, { grams: number; label: string }> = {
  cup: { grams: 240, label: 'g' },
  tbsp: { grams: 15, label: 'g' },
  tsp: { grams: 5, label: 'g' },
  oz: { grams: 28.35, label: 'g' },
  lb: { grams: 453.6, label: 'g' },
};

function WatchContent() {
  const searchParams = useSearchParams();
  const recipeId = searchParams.get('id');
  const { currentMember, setShowPicker } = useFamilyMember();

  const [recipe, setRecipe] = useState<RecipeData | null>(null);
  const [showIngredients, setShowIngredients] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [scaledServings, setScaledServings] = useState(4);
  const [useWeight, setUseWeight] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [editMode, setEditMode] = useState(false);
  const [editIngredients, setEditIngredients] = useState('');
  const [editInstructions, setEditInstructions] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [extractResult, setExtractResult] = useState('');

  const fetchRecipe = useCallback(async () => {
    if (!recipeId) return;
    const res = await fetch(`/api/recipes/items?id=${recipeId}`);
    const data = await res.json();
    setRecipe(data);
    setScaledServings(data?.servings || 4);

    if (data?.ingredientsJson) {
      try { setEditIngredients(JSON.parse(data.ingredientsJson).map((i: Ingredient) => `${i.quantity} ${i.unit} ${i.name}`).join('\n')); } catch {}
    }
    if (data?.instructionsJson) {
      try { setEditInstructions(JSON.parse(data.instructionsJson).join('\n')); } catch {}
    }
  }, [recipeId]);

  useEffect(() => { fetchRecipe(); }, [fetchRecipe]);

  const handleExtractRecipe = async () => {
    if (!recipe?.youtubeId) return;
    setExtracting(true);
    setExtractResult('');
    try {
      const res = await fetch('/api/recipes/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ youtubeId: recipe.youtubeId }),
      });
      const data = await res.json();

      if (data.ingredients?.length > 0 || data.instructions?.length > 0) {
        // Format ingredients for the editor
        const ingText = data.ingredients.join('\n');
        const instText = data.instructions.join('\n');
        setEditIngredients(ingText);
        setEditInstructions(instText);
        setEditMode(true);
        setExtractResult(`✅ Found ${data.ingredients.length} ingredients and ${data.instructions.length} steps! Review and save.`);

        if (data.servings) setScaledServings(data.servings);
      } else if (data.descriptionPreview) {
        // Couldn't parse structured data, show raw description for manual copy
        setEditIngredients(data.descriptionPreview);
        setEditMode(true);
        setExtractResult('⚠️ Couldn\'t auto-parse. Raw description loaded — edit manually.');
      } else {
        setExtractResult('❌ No recipe data found in video description or transcript.');
      }
    } catch (e) {
      setExtractResult(`❌ Error: ${e instanceof Error ? e.message : 'Unknown'}`);
    }
    setExtracting(false);
  };

  const ingredients: Ingredient[] = recipe?.ingredientsJson ? JSON.parse(recipe.ingredientsJson) : [];
  const instructions: string[] = recipe?.instructionsJson ? JSON.parse(recipe.instructionsJson) : [];
  const baseServings = recipe?.servings || 4;
  const scale = scaledServings / baseServings;

  const scaleQuantity = (qty: number, unit: string) => {
    const scaled = qty * scale;
    if (useWeight && UNIT_CONVERSIONS[unit]) {
      return `${Math.round(scaled * UNIT_CONVERSIONS[unit].grams)}${UNIT_CONVERSIONS[unit].label}`;
    }
    return scaled % 1 === 0 ? String(scaled) : scaled.toFixed(1);
  };

  const handleSaveEdits = async () => {
    // Parse ingredients from text (format: "2 cups flour")
    const parsedIngredients = editIngredients.split('\n').filter(Boolean).map((line) => {
      const match = line.match(/^([\d./]+)\s+(\S+)\s+(.+)$/);
      if (match) {
        return { quantity: parseFloat(match[1]), unit: match[2], name: match[3].trim(), category: 'Other' };
      }
      return { quantity: 1, unit: 'unit', name: line.trim(), category: 'Other' };
    });

    const parsedInstructions = editInstructions.split('\n').filter(Boolean);

    await fetch('/api/recipes/items', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: recipe?.id,
        ingredientsJson: JSON.stringify(parsedIngredients),
        instructionsJson: JSON.stringify(parsedInstructions),
      }),
    });

    setEditMode(false);
    fetchRecipe();
  };

  const handleRate = async (stars: number) => {
    if (!currentMember) { setShowPicker(true); return; }
    await fetch('/api/recipes/ratings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipeId: recipe?.id, memberName: currentMember.name, stars }),
    });
    fetchRecipe();
  };

  const addToShoppingList = async () => {
    if (!currentMember) { setShowPicker(true); return; }
    // Get existing list
    const res = await fetch(`/api/recipes/shopping?member=${encodeURIComponent(currentMember.name)}`);
    const existing = await res.json();
    let currentItems: Ingredient[] = [];
    if (existing?.itemsJson) {
      try { currentItems = JSON.parse(existing.itemsJson); } catch {}
    }

    // Add scaled ingredients
    const newItems = ingredients.map((ing) => ({
      ...ing,
      quantity: parseFloat((ing.quantity * scale).toFixed(2)),
      source: recipe?.title,
    }));

    const merged = [...currentItems, ...newItems];
    await fetch('/api/recipes/shopping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberName: currentMember.name, itemsJson: JSON.stringify(merged) }),
    });
    alert('Added to shopping list!');
  };

  if (!recipe) {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-4xl animate-spin">🍳</div></div>;
  }

  const avgRating = recipe.ratings.length ? recipe.ratings.reduce((s, r) => s + r.stars, 0) / recipe.ratings.length : 0;
  const myLatest = recipe.ratings.filter((r) => r.memberName === currentMember?.name).slice(-1)[0]?.stars || 0;

  return (
    <div className="min-h-screen relative"><ThemedBackground theme="kitchen" />
      <div className="border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/recipes" className="text-white/40 hover:text-white/80 transition-colors text-sm">← Back to Recipes</Link>
          <div className="flex items-center gap-2">
            <span className="text-sm text-white/30">{recipe.tab.icon} {recipe.tab.name}</span>
            {/* Font size controls */}
            <div className="flex items-center gap-1 ml-4 bg-white/5 rounded-lg p-1">
              <button onClick={() => setFontSize(Math.max(12, fontSize - 2))} className="w-7 h-7 rounded text-white/40 hover:text-white text-sm flex items-center justify-center">A-</button>
              <button onClick={() => setFontSize(Math.min(28, fontSize + 2))} className="w-7 h-7 rounded text-white/40 hover:text-white text-base flex items-center justify-center font-bold">A+</button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold mb-2">{recipe.title}</h1>

        {/* Rating bar */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <button key={star} onClick={() => handleRate(star)} className="star-btn text-2xl select-none">
                {star <= myLatest ? '⭐' : '☆'}
              </button>
            ))}
          </div>
          {avgRating > 0 && (
            <span className="text-white/40 text-sm">Avg: {avgRating.toFixed(1)}★ ({recipe.ratings.length})</span>
          )}
          {recipe.source && <span className="text-white/20 text-xs ml-auto">{recipe.source}</span>}
        </div>

        {/* Video */}
        {recipe.youtubeId && (
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-black mb-6 shadow-2xl ring-1 ring-white/10">
            <iframe
              src={`https://www.youtube.com/embed/${recipe.youtubeId}?rel=0`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
          </div>
        )}

        {/* Non-YouTube URL */}
        {recipe.url && !recipe.youtubeId && (
          <a href={recipe.url} target="_blank" rel="noopener noreferrer"
            className="inline-block mb-6 px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white text-sm transition-all">
            🔗 View original recipe
          </a>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button onClick={() => setShowIngredients(!showIngredients)}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${showIngredients ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30' : 'bg-white/5 text-white/50 border border-white/10 hover:text-white'}`}>
            🥄 {showIngredients ? 'Hide' : 'Show'} Ingredients
          </button>
          <button onClick={() => setShowInstructions(!showInstructions)}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${showInstructions ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30' : 'bg-white/5 text-white/50 border border-white/10 hover:text-white'}`}>
            📝 {showInstructions ? 'Hide' : 'Show'} Instructions
          </button>
          <button onClick={() => setEditMode(!editMode)}
            className="px-5 py-2.5 rounded-xl text-sm font-medium bg-white/5 text-white/50 border border-white/10 hover:text-white transition-all">
            ✏️ {editMode ? 'Cancel Edit' : 'Edit Recipe'}
          </button>
          {recipe.youtubeId && ingredients.length === 0 && (
            <button onClick={handleExtractRecipe} disabled={extracting}
              className="px-5 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-orange-500/15 to-red-500/15 text-orange-400 border border-orange-500/20 hover:from-orange-500/25 hover:to-red-500/25 transition-all disabled:opacity-50">
              {extracting ? '🔄 Extracting...' : '🤖 Extract Recipe from Video'}
            </button>
          )}
          {ingredients.length > 0 && (
            <button onClick={addToShoppingList}
              className="px-5 py-2.5 rounded-xl text-sm font-medium bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-all ml-auto">
              🛒 Add to Shopping List
            </button>
          )}
        </div>

        {/* Extract result */}
        {extractResult && (
          <div className={`mb-4 px-4 py-3 rounded-xl text-sm ${
            extractResult.startsWith('✅') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
            extractResult.startsWith('⚠️') ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
            'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
            {extractResult}
          </div>
        )}

        {/* Edit mode */}
        {editMode && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6 glass rounded-2xl p-6 space-y-4">
            <p className="text-xs text-white/40">Format ingredients as: <code className="bg-white/10 px-1 rounded">2 cups flour</code> (one per line)</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-white/50 block mb-2">Ingredients</label>
                <textarea value={editIngredients} onChange={(e) => setEditIngredients(e.target.value)}
                  rows={10} placeholder="2 cups flour&#10;1 tsp salt&#10;3 eggs"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-orange-500 text-sm font-mono" />
              </div>
              <div>
                <label className="text-sm text-white/50 block mb-2">Instructions</label>
                <textarea value={editInstructions} onChange={(e) => setEditInstructions(e.target.value)}
                  rows={10} placeholder="Preheat oven to 350°F&#10;Mix dry ingredients&#10;..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-orange-500 text-sm font-mono" />
              </div>
            </div>
            <button onClick={handleSaveEdits} className="px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-medium text-sm">
              Save Recipe Details
            </button>
          </motion.div>
        )}

        {/* Content panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={{ fontSize: `${fontSize}px` }}>
          {/* Instructions (left) */}
          {showInstructions && (
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <div className="glass rounded-2xl p-6 max-h-[700px] overflow-y-auto">
                <h3 className="text-sm font-medium text-white/40 uppercase tracking-wider mb-4">Instructions</h3>
                {instructions.length > 0 ? (
                  <ol className="space-y-4">
                    {instructions.map((step, i) => (
                      <li key={i} className="flex gap-4">
                        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-500/15 text-orange-400 flex items-center justify-center text-sm font-bold">
                          {i + 1}
                        </span>
                        <p className="text-white/80 leading-relaxed pt-1">{step}</p>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-white/30 italic">No instructions yet. Click &ldquo;Edit Recipe&rdquo; to add them.</p>
                )}
              </div>
            </motion.div>
          )}

          {/* Ingredients with calculator (right) */}
          {showIngredients && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <div className="glass rounded-2xl p-6 max-h-[700px] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-white/40 uppercase tracking-wider">Ingredients</h3>
                </div>

                {/* Servings calculator */}
                <div className="flex items-center gap-4 mb-5 p-3 bg-white/5 rounded-xl">
                  <span className="text-sm text-white/50">Servings:</span>
                  <button onClick={() => setScaledServings(Math.max(1, scaledServings - 1))}
                    className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center hover:bg-white/20">-</button>
                  <span className="text-xl font-bold min-w-[2ch] text-center">{scaledServings}</span>
                  <button onClick={() => setScaledServings(scaledServings + 1)}
                    className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center hover:bg-white/20">+</button>
                  {scaledServings !== baseServings && (
                    <button onClick={() => setScaledServings(baseServings)} className="text-xs text-white/30 hover:text-white/60">
                      Reset ({baseServings})
                    </button>
                  )}
                  <div className="ml-auto flex items-center gap-2">
                    <span className="text-xs text-white/30">Weight</span>
                    <button onClick={() => setUseWeight(!useWeight)}
                      className={`w-10 h-6 rounded-full transition-colors relative ${useWeight ? 'bg-orange-500' : 'bg-white/20'}`}>
                      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${useWeight ? 'left-5' : 'left-1'}`} />
                    </button>
                  </div>
                </div>

                {ingredients.length > 0 ? (
                  <div className="space-y-2">
                    {ingredients.map((ing, i) => (
                      <div key={i} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                        <span className="font-mono text-orange-400 min-w-[4rem] text-right">
                          {scaleQuantity(ing.quantity, ing.unit)}
                        </span>
                        <span className="text-white/40 min-w-[3rem]">
                          {useWeight && UNIT_CONVERSIONS[ing.unit] ? '' : ing.unit}
                        </span>
                        <span className="text-white/80">{ing.name}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-white/30 italic">No ingredients yet. Click &ldquo;Edit Recipe&rdquo; to add them.</p>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RecipeWatchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-4xl animate-spin">🍳</div></div>}>
      <WatchContent />
    </Suspense>
  );
}

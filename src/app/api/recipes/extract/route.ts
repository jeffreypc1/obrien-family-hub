import { NextRequest, NextResponse } from 'next/server';
import { YoutubeTranscript } from 'youtube-transcript';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { youtubeId } = body;

  if (!youtubeId) {
    return NextResponse.json({ error: 'youtubeId required' }, { status: 400 });
  }

  let description = '';
  let transcript = '';

  // 1. Try YouTube Data API for video description (often has recipe)
  if (GOOGLE_API_KEY) {
    try {
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${youtubeId}&key=${GOOGLE_API_KEY}`
      );
      if (res.ok) {
        const data = await res.json();
        description = data.items?.[0]?.snippet?.description || '';
      }
    } catch {}
  }

  // 2. Try to get transcript
  try {
    const transcriptItems = await YoutubeTranscript.fetchTranscript(youtubeId, { lang: 'en' });
    if (transcriptItems?.length) {
      transcript = transcriptItems.map((t) => t.text.replace(/<[^>]*>/g, '')).join(' ');
    }
  } catch {
    try {
      const transcriptItems = await YoutubeTranscript.fetchTranscript(youtubeId);
      if (transcriptItems?.length) {
        transcript = transcriptItems.map((t) => t.text.replace(/<[^>]*>/g, '')).join(' ');
      }
    } catch {}
  }

  // 3. Parse ingredients and instructions from description
  const result = parseRecipeFromText(description, transcript);

  return NextResponse.json(result);
}

function parseRecipeFromText(description: string, transcript: string) {
  const ingredients: string[] = [];
  const instructions: string[] = [];
  let servings = 4;

  // Try description first (usually more structured)
  const text = description || transcript;

  if (text) {
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

    let section = 'none';

    for (const line of lines) {
      const lower = line.toLowerCase();

      // Detect section headers
      if (lower.match(/^(ingredients|what you.?ll need|you.?ll need|shopping list)/i)) {
        section = 'ingredients';
        continue;
      }
      if (lower.match(/^(instructions|directions|method|steps|how to make|preparation|recipe)/i)) {
        section = 'instructions';
        continue;
      }
      if (lower.match(/^(notes|tips|nutrition|follow me|subscribe|social|links|equipment|for more)/i)) {
        section = 'none';
        continue;
      }

      // Detect servings
      const servingsMatch = lower.match(/(?:serves?|servings?|makes?|yields?)[:\s]*(\d+)/i);
      if (servingsMatch) {
        servings = parseInt(servingsMatch[1]);
      }

      if (section === 'ingredients') {
        // Lines that look like ingredients (start with -, •, *, number, or fraction)
        const cleaned = line.replace(/^[-•*▪▸►◦]\s*/, '').trim();
        if (cleaned && cleaned.length > 2 && cleaned.length < 200) {
          ingredients.push(cleaned);
        }
      } else if (section === 'instructions') {
        const cleaned = line.replace(/^\d+[.)]\s*/, '').replace(/^step\s*\d+[:.]\s*/i, '').trim();
        if (cleaned && cleaned.length > 5 && cleaned.length < 500) {
          instructions.push(cleaned);
        }
      } else if (section === 'none') {
        // Try to detect ingredient-like lines even outside sections
        // Lines with measurements (cups, tbsp, oz, g, etc.)
        if (line.match(/\d+\s*(cup|tbsp|tsp|oz|g|kg|lb|ml|liter|bunch|clove|pinch|teaspoon|tablespoon)/i)) {
          ingredients.push(line.replace(/^[-•*]\s*/, '').trim());
        }
      }
    }
  }

  // If we couldn't parse from description, try a simpler transcript parse
  if (ingredients.length === 0 && transcript) {
    // Look for common cooking phrases in transcript to build basic instructions
    const sentences = transcript.split(/[.!?]+/).filter((s) => s.trim().length > 10);
    for (const s of sentences.slice(0, 20)) {
      const trimmed = s.trim();
      if (trimmed.match(/\b(add|mix|stir|cook|bake|heat|pour|chop|dice|slice|combine|season|serve|simmer|boil|fry|sauté|preheat|whisk)\b/i)) {
        instructions.push(trimmed);
      }
    }
  }

  return {
    ingredients,
    instructions,
    servings,
    hasDescription: !!description,
    hasTranscript: !!transcript,
    descriptionPreview: description?.slice(0, 500) || null,
  };
}

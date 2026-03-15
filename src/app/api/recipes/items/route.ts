import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tabId = searchParams.get('tabId');
  const id = searchParams.get('id');

  if (id) {
    const item = await prisma.recipeItem.findUnique({
      where: { id },
      include: { ratings: true, tab: true },
    });
    return NextResponse.json(item);
  }

  const where = tabId ? { tabId } : {};
  const items = await prisma.recipeItem.findMany({
    where,
    include: { ratings: true },
    orderBy: { sortOrder: 'asc' },
  });
  return NextResponse.json(items);
}

function extractYoutubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtube.com')) return u.searchParams.get('v');
    if (u.hostname === 'youtu.be') return u.pathname.slice(1);
  } catch {}
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;
  return null;
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { tabId, title, url, description, servings, prepTime, cookTime, ingredientsJson, instructionsJson, source, addedBy, tagsJson } = body;

  if (!tabId || !title?.trim()) {
    return NextResponse.json({ error: 'tabId and title required' }, { status: 400 });
  }

  const youtubeId = url ? extractYoutubeId(url) : null;
  const imageUrl = youtubeId
    ? `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`
    : null;

  // Auto-fetch title from YouTube if URL provided and no title
  let finalTitle = title.trim();
  if (youtubeId && finalTitle === 'auto') {
    try {
      const oembedRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${youtubeId}&format=json`);
      if (oembedRes.ok) {
        const data = await oembedRes.json();
        finalTitle = data.title || finalTitle;
      }
    } catch {}
  }

  const id = `recipe-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const count = await prisma.recipeItem.count({ where: { tabId } });

  const item = await prisma.recipeItem.create({
    data: {
      id,
      tabId,
      title: finalTitle,
      url: url || null,
      youtubeId,
      imageUrl,
      description: description || null,
      servings: servings || 4,
      prepTime: prepTime || null,
      cookTime: cookTime || null,
      ingredientsJson: ingredientsJson || null,
      instructionsJson: instructionsJson || null,
      source: source || null,
      addedBy: addedBy || null,
      tagsJson: tagsJson || null,
      sortOrder: count,
    },
  });

  return NextResponse.json(item);
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, ...data } = body;
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const item = await prisma.recipeItem.update({
    where: { id },
    data,
  });
  return NextResponse.json(item);
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  await prisma.recipeRating.deleteMany({ where: { recipeId: id } });
  await prisma.recipeItem.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

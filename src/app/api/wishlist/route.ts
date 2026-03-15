import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const includeArchived = searchParams.get('archived') === '1';

  const where = includeArchived ? '' : 'WHERE archived = 0 OR archived IS NULL';
  const items = await prisma.$queryRawUnsafe(`SELECT * FROM WishItem ${where} ORDER BY createdAt DESC`) as Record<string, unknown>[];

  // Get comments for each
  const enriched = await Promise.all(items.map(async (item) => {
    const comments = await prisma.$queryRawUnsafe(
      'SELECT * FROM WishComment WHERE wishId = ? ORDER BY createdAt ASC', item.id
    ) as Record<string, unknown>[];
    return { ...item, comments };
  }));

  return NextResponse.json(enriched);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  // Add comment
  if (body.action === 'comment') {
    const { wishId, authorName, authorEmoji, text } = body;
    if (!wishId || !authorName || !text?.trim()) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }
    const id = `wc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    await prisma.$executeRawUnsafe(
      `INSERT INTO WishComment (id, wishId, authorName, authorEmoji, text, createdAt) VALUES (?, ?, ?, ?, ?, datetime('now'))`,
      id, wishId, authorName, authorEmoji || '💬', text.trim()
    );
    return NextResponse.json({ id });
  }

  // Create wish
  const { title, description, imageUrl, linkUrl, price, category, priority, addedBy } = body;
  if (!title?.trim() || !addedBy) {
    return NextResponse.json({ error: 'title and addedBy required' }, { status: 400 });
  }

  // Try to auto-fetch image from link if no image provided
  let finalImage = imageUrl?.trim() || null;
  if (!finalImage && linkUrl?.trim()) {
    try {
      const res = await fetch(linkUrl.trim(), { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        const html = await res.text();
        const ogMatch = html.match(/property="og:image"\s+content="([^"]+)"/i) ||
                        html.match(/content="([^"]+)"\s+property="og:image"/i);
        if (ogMatch) finalImage = ogMatch[1];
      }
    } catch {}
  }

  const id = `wish-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  await prisma.$executeRawUnsafe(
    `INSERT INTO WishItem (id, title, description, imageUrl, linkUrl, price, category, priority, addedBy, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    id, title.trim(), description?.trim() || null, finalImage,
    linkUrl?.trim() || null, price?.trim() || null, category || 'general',
    priority || 'nice-to-have', addedBy
  );

  return NextResponse.json({ id, title: title.trim(), imageUrl: finalImage });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, claimedBy, archived } = body;
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  if (claimedBy !== undefined) {
    await prisma.$executeRawUnsafe('UPDATE WishItem SET claimedBy = ? WHERE id = ?', claimedBy || null, id);
  }
  if (archived !== undefined) {
    await prisma.$executeRawUnsafe('UPDATE WishItem SET archived = ? WHERE id = ?', archived ? 1 : 0, id);
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  await prisma.$executeRawUnsafe('DELETE FROM WishComment WHERE wishId = ?', id);
  await prisma.$executeRawUnsafe('DELETE FROM WishItem WHERE id = ?', id);
  return NextResponse.json({ success: true });
}

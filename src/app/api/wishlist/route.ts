import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const items = await prisma.$queryRawUnsafe('SELECT * FROM WishItem ORDER BY createdAt DESC') as Record<string, unknown>[];
  return NextResponse.json(items);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { title, description, imageUrl, linkUrl, price, category, priority, addedBy } = body;

  if (!title?.trim() || !addedBy) {
    return NextResponse.json({ error: 'title and addedBy required' }, { status: 400 });
  }

  const id = `wish-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  await prisma.$executeRawUnsafe(
    `INSERT INTO WishItem (id, title, description, imageUrl, linkUrl, price, category, priority, addedBy, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    id, title.trim(), description?.trim() || null, imageUrl?.trim() || null,
    linkUrl?.trim() || null, price?.trim() || null, category || 'general',
    priority || 'nice-to-have', addedBy
  );

  return NextResponse.json({ id, title: title.trim() });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, claimedBy } = body;
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  await prisma.$executeRawUnsafe('UPDATE WishItem SET claimedBy = ? WHERE id = ?', claimedBy || null, id);
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  await prisma.$executeRawUnsafe('DELETE FROM WishItem WHERE id = ?', id);
  return NextResponse.json({ success: true });
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const tags = await prisma.$queryRawUnsafe('SELECT * FROM RecipeTag ORDER BY name') as Record<string, unknown>[];
  return NextResponse.json(tags);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, icon, color } = body;
  if (!name?.trim()) return NextResponse.json({ error: 'name required' }, { status: 400 });

  const id = `tag-${name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  await prisma.$executeRawUnsafe(
    `INSERT OR IGNORE INTO RecipeTag (id, name, icon, color, createdAt) VALUES (?, ?, ?, ?, datetime('now'))`,
    id, name.trim(), icon || '🏷️', color || '#6B7280'
  );
  return NextResponse.json({ id });
}

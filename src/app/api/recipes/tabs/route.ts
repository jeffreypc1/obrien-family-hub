import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const tabs = await prisma.recipeTab.findMany({
    orderBy: { sortOrder: 'asc' },
    include: { _count: { select: { items: true } } },
  });
  return NextResponse.json(tabs);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, icon } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Name required' }, { status: 400 });
  }

  const id = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const count = await prisma.recipeTab.count();

  const tab = await prisma.recipeTab.create({
    data: { id, name: name.trim(), icon: icon || '🍽️', sortOrder: count },
  });

  return NextResponse.json(tab);
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  await prisma.recipeItem.deleteMany({ where: { tabId: id } });
  await prisma.recipeTab.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const memberName = searchParams.get('member');
  if (!memberName) return NextResponse.json({ error: 'member required' }, { status: 400 });

  const list = await prisma.shoppingList.findFirst({
    where: { memberName },
    orderBy: { updatedAt: 'desc' },
  });

  return NextResponse.json(list);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { memberName, itemsJson } = body;

  if (!memberName || !itemsJson) {
    return NextResponse.json({ error: 'memberName and itemsJson required' }, { status: 400 });
  }

  // Upsert — one shopping list per member
  const existing = await prisma.shoppingList.findFirst({ where: { memberName } });

  if (existing) {
    const updated = await prisma.shoppingList.update({
      where: { id: existing.id },
      data: { itemsJson },
    });
    return NextResponse.json(updated);
  }

  const list = await prisma.shoppingList.create({
    data: {
      id: `shop-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      memberName,
      itemsJson,
    },
  });

  return NextResponse.json(list);
}

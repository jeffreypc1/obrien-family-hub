import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const members = await prisma.familyMember.findMany({
    orderBy: { createdAt: 'asc' },
  });
  return NextResponse.json(members);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, emoji, color } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  const member = await prisma.familyMember.create({
    data: {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: name.trim(),
      emoji: emoji || '🎵',
      color: color || '#E91E8C',
    },
  });

  return NextResponse.json(member);
}

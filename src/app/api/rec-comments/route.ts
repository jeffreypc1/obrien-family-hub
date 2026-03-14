import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { recommendationId, authorName, authorEmoji, text } = body;

  if (!recommendationId || !authorName || !text?.trim()) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const comment = await prisma.recommendationComment.create({
    data: {
      id: `rc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      recommendationId, authorName, authorEmoji: authorEmoji || '💬',
      text: text.trim(),
    },
  });
  return NextResponse.json(comment);
}

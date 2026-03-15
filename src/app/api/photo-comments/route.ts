import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { photoId, authorName, authorEmoji, text } = body;
  if (!photoId || !authorName || !text?.trim()) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }
  const comment = await prisma.photoComment.create({
    data: {
      id: `pc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      photoId, authorName, authorEmoji: authorEmoji || '💬', text: text.trim(),
    },
  });
  return NextResponse.json(comment);
}

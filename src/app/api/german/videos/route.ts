import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const level = searchParams.get('level');

  const where = level ? { skillLevel: level } : {};

  const videos = await prisma.germanVideo.findMany({
    where,
    include: {
      vocabItems: true,
      _count: { select: { segments: true } },
    },
    orderBy: [{ skillLevel: 'asc' }, { sortOrder: 'asc' }],
  });

  return NextResponse.json(videos);
}

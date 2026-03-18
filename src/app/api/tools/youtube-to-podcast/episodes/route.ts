import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const episodes = await prisma.podcastEpisode.findMany({
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(episodes);
}

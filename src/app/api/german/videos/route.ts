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

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { youtubeUrl, skillLevel } = body;

  if (!youtubeUrl || !skillLevel) {
    return NextResponse.json({ error: 'youtubeUrl and skillLevel required' }, { status: 400 });
  }

  // Extract YouTube video ID from various URL formats
  let ytId = '';
  try {
    const url = new URL(youtubeUrl);
    if (url.hostname.includes('youtube.com')) {
      ytId = url.searchParams.get('v') || '';
    } else if (url.hostname === 'youtu.be') {
      ytId = url.pathname.slice(1);
    }
  } catch {
    // Maybe they just pasted the ID directly
    if (/^[a-zA-Z0-9_-]{11}$/.test(youtubeUrl)) {
      ytId = youtubeUrl;
    }
  }

  if (!ytId) {
    return NextResponse.json({ error: 'Could not extract YouTube video ID' }, { status: 400 });
  }

  // Check if video already exists
  const existing = await prisma.germanVideo.findUnique({ where: { youtubeId: ytId } });
  if (existing) {
    return NextResponse.json({ error: 'Video already added', video: existing }, { status: 409 });
  }

  // Fetch video title from YouTube oembed
  let title = 'Untitled Video';
  let channel = 'Unknown';
  try {
    const oembedRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${ytId}&format=json`);
    if (oembedRes.ok) {
      const data = await oembedRes.json();
      title = data.title || title;
      channel = data.author_name || channel;
    }
  } catch {}

  const id = `user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const video = await prisma.germanVideo.create({
    data: {
      id,
      youtubeId: ytId,
      title,
      channel,
      skillLevel,
      description: `Added by the family`,
      thumbnailUrl: `https://img.youtube.com/vi/${ytId}/mqdefault.jpg`,
      sortOrder: 999,
    },
  });

  return NextResponse.json(video);
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 });
  }

  // Delete associated vocab and segments first
  await prisma.videoVocab.deleteMany({ where: { videoId: id } });
  await prisma.videoSegment.deleteMany({ where: { videoId: id } });
  await prisma.germanVideo.delete({ where: { id } });

  return NextResponse.json({ success: true });
}

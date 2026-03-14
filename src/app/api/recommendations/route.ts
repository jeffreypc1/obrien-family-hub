import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const recs = await prisma.recommendation.findMany({
    include: { comments: { orderBy: { createdAt: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(recs);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { category, title, description, imageUrl, linkUrl, linkLabel, recommendedBy } = body;

  if (!title?.trim() || !category || !recommendedBy) {
    return NextResponse.json({ error: 'title, category, recommendedBy required' }, { status: 400 });
  }

  const rec = await prisma.recommendation.create({
    data: {
      id: `rec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      category, title: title.trim(),
      description: description?.trim() || null,
      imageUrl: imageUrl?.trim() || null,
      linkUrl: linkUrl?.trim() || null,
      linkLabel: linkLabel?.trim() || null,
      recommendedBy,
    },
  });
  return NextResponse.json(rec);
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, action, userName } = body;
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  if (action === 'like' && userName) {
    const rec = await prisma.recommendation.findUnique({ where: { id } });
    if (!rec) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    let likedBy: string[] = [];
    try { likedBy = rec.likedByJson ? JSON.parse(rec.likedByJson) : []; } catch {}

    if (likedBy.includes(userName)) {
      likedBy = likedBy.filter((n) => n !== userName);
    } else {
      likedBy.push(userName);
    }

    const updated = await prisma.recommendation.update({
      where: { id },
      data: { likes: likedBy.length, likedByJson: JSON.stringify(likedBy) },
    });
    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  await prisma.recommendationComment.deleteMany({ where: { recommendationId: id } });
  await prisma.recommendation.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

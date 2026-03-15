import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const albumId = searchParams.get('albumId');

  const where = albumId ? { albumId } : {};
  const photos = await prisma.photo.findMany({
    where,
    include: { comments: { orderBy: { createdAt: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(photos);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { imageUrl, caption, uploadedBy, albumId, dateTaken, location, camera } = body;

  if (!imageUrl || !uploadedBy) {
    return NextResponse.json({ error: 'imageUrl and uploadedBy required' }, { status: 400 });
  }

  const photo = await prisma.photo.create({
    data: {
      id: `photo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      imageUrl, caption: caption?.trim() || null, uploadedBy,
      albumId: albumId || null, dateTaken: dateTaken || new Date().toISOString().split('T')[0],
      location: location?.trim() || null, camera: camera?.trim() || null,
    },
  });
  return NextResponse.json(photo);
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, action, userName, emoji } = body;
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  if (action === 'react' && userName && emoji) {
    const photo = await prisma.photo.findUnique({ where: { id } });
    if (!photo) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    let reactions: Record<string, string[]> = {};
    try { reactions = photo.reactionsJson ? JSON.parse(photo.reactionsJson) : {}; } catch {}

    if (!reactions[emoji]) reactions[emoji] = [];
    if (reactions[emoji].includes(userName)) {
      reactions[emoji] = reactions[emoji].filter((n) => n !== userName);
      if (reactions[emoji].length === 0) delete reactions[emoji];
    } else {
      reactions[emoji].push(userName);
    }

    const updated = await prisma.photo.update({
      where: { id },
      data: { reactionsJson: JSON.stringify(reactions) },
    });
    return NextResponse.json(updated);
  }

  // Generic update
  const { id: photoId, ...data } = body;
  const updated = await prisma.photo.update({ where: { id: photoId }, data });
  return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  await prisma.photoComment.deleteMany({ where: { photoId: id } });
  await prisma.photo.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const albums = await prisma.photoAlbum.findMany({ orderBy: { createdAt: 'desc' } });
  // Get photo counts and covers
  const enriched = await Promise.all(albums.map(async (album) => {
    const count = await prisma.photo.count({ where: { albumId: album.id } });
    const cover = album.coverPhotoId
      ? await prisma.photo.findUnique({ where: { id: album.coverPhotoId } })
      : await prisma.photo.findFirst({ where: { albumId: album.id }, orderBy: { createdAt: 'desc' } });
    return { ...album, photoCount: count, coverUrl: cover?.imageUrl || null };
  }));
  return NextResponse.json(enriched);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { title, description, createdBy } = body;
  if (!title?.trim()) return NextResponse.json({ error: 'title required' }, { status: 400 });

  const album = await prisma.photoAlbum.create({
    data: {
      id: `album-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: title.trim(), description: description?.trim() || null,
      createdBy: createdBy || null,
    },
  });
  return NextResponse.json(album);
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  // Unlink photos from album but don't delete them
  await prisma.photo.updateMany({ where: { albumId: id }, data: { albumId: null } });
  await prisma.photoAlbum.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

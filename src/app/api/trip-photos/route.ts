import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tripId = searchParams.get('tripId');
  const date = searchParams.get('date');

  const where: Record<string, string> = {};
  if (tripId) where.tripId = tripId;
  if (date) where.date = date;

  const photos = await prisma.tripPhoto.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(photos);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { tripId, date, imageUrl, caption, uploadedBy } = body;

  if (!tripId || !date || !imageUrl) {
    return NextResponse.json({ error: 'tripId, date, imageUrl required' }, { status: 400 });
  }

  const photo = await prisma.tripPhoto.create({
    data: {
      id: `photo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      tripId, date, imageUrl, caption: caption || null, uploadedBy: uploadedBy || null,
    },
  });
  return NextResponse.json(photo);
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  await prisma.tripPhoto.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

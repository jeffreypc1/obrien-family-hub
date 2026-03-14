import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const trips = await prisma.trip.findMany({
    include: { items: true, photos: true, _count: { select: { items: true, photos: true } } },
    orderBy: { startDate: 'asc' },
  });
  return NextResponse.json(trips);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { title, destination, startDate, endDate, status, description, createdBy } = body;

  if (!title?.trim() || !destination?.trim() || !startDate || !endDate) {
    return NextResponse.json({ error: 'title, destination, startDate, endDate required' }, { status: 400 });
  }

  const trip = await prisma.trip.create({
    data: {
      id: `trip-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: title.trim(),
      destination: destination.trim(),
      startDate, endDate,
      status: status || 'planned',
      description: description?.trim() || null,
      createdBy: createdBy || null,
    },
  });

  // Also create a calendar event for this trip
  await prisma.calendarEvent.create({
    data: {
      id: `evt-trip-${trip.id}`,
      title: `✈️ ${title.trim()} — ${destination.trim()}`,
      date: startDate,
      emoji: '✈️',
      description: `${startDate} to ${endDate}`,
      createdBy,
    },
  });

  return NextResponse.json(trip);
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, ...data } = body;
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const trip = await prisma.trip.update({ where: { id }, data });
  return NextResponse.json(trip);
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  await prisma.tripPhoto.deleteMany({ where: { tripId: id } });
  await prisma.tripItem.deleteMany({ where: { tripId: id } });
  await prisma.trip.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

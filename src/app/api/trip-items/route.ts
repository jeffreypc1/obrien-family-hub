import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { tripId, date, time, endTime, type, title, details, address, url } = body;

  if (!tripId || !date || !title?.trim()) {
    return NextResponse.json({ error: 'tripId, date, title required' }, { status: 400 });
  }

  const count = await prisma.tripItem.count({ where: { tripId, date } });
  const item = await prisma.tripItem.create({
    data: {
      id: `ti-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      tripId, date, time: time || null, endTime: endTime || null,
      type: type || 'activity', title: title.trim(),
      details: details?.trim() || null, address: address?.trim() || null,
      url: url?.trim() || null, sortOrder: count,
    },
  });
  return NextResponse.json(item);
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, ...data } = body;
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const item = await prisma.tripItem.update({ where: { id }, data });
  return NextResponse.json(item);
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  await prisma.tripItem.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

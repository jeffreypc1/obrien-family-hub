import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const events = await prisma.calendarEvent.findMany({
    orderBy: { date: 'asc' },
  });
  return NextResponse.json(events);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { title, description, emoji, date, startTime, endTime, recurring, createdBy } = body;

  if (!title?.trim() || !date) {
    return NextResponse.json({ error: 'title and date required' }, { status: 400 });
  }

  const event = await prisma.calendarEvent.create({
    data: {
      id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: title.trim(),
      description: description?.trim() || null,
      emoji: emoji || '📅',
      date,
      startTime: startTime || null,
      endTime: endTime || null,
      recurring: recurring || null,
      createdBy: createdBy || null,
    },
  });

  return NextResponse.json(event);
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, ...data } = body;
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const event = await prisma.calendarEvent.update({ where: { id }, data });
  return NextResponse.json(event);
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  await prisma.calendarEvent.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

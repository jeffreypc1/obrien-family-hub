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
  const { title, description, emoji, date, recurring, createdBy } = body;

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
      recurring: recurring || null,
      createdBy: createdBy || null,
    },
  });

  return NextResponse.json(event);
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  await prisma.calendarEvent.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

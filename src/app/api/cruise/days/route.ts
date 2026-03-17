import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const days = await prisma.cruiseDay.findMany({
    orderBy: { dayNumber: 'asc' },
    include: {
      activities: {
        orderBy: { sortOrder: 'asc' },
        include: { choices: true },
      },
    },
  });
  return NextResponse.json(days);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const day = await prisma.cruiseDay.create({
    data: {
      dayNumber: body.dayNumber,
      date: body.date,
      portName: body.portName || null,
      isSeaDay: body.isSeaDay || false,
      arrivalTime: body.arrivalTime || null,
      departureTime: body.departureTime || null,
      description: body.description || null,
    },
  });
  return NextResponse.json(day);
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const day = await prisma.cruiseDay.update({
    where: { id: body.id },
    data: {
      dayNumber: body.dayNumber,
      date: body.date,
      portName: body.portName || null,
      isSeaDay: body.isSeaDay || false,
      arrivalTime: body.arrivalTime || null,
      departureTime: body.departureTime || null,
      description: body.description || null,
    },
  });
  return NextResponse.json(day);
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  await prisma.cruiseDay.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

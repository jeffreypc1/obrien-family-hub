import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const dayId = req.nextUrl.searchParams.get('dayId');
  const where = dayId ? { dayId } : {};
  const activities = await prisma.cruiseActivity.findMany({
    where,
    orderBy: { sortOrder: 'asc' },
    include: { choices: true },
  });
  return NextResponse.json(activities);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const activity = await prisma.cruiseActivity.create({
    data: {
      dayId: body.dayId,
      name: body.name,
      description: body.description || null,
      startTime: body.startTime,
      endTime: body.endTime,
      cost: body.cost || null,
      location: body.location || null,
      type: body.type || 'excursion',
      isRecommended: body.isRecommended || false,
      sortOrder: body.sortOrder || 0,
    },
    include: { choices: true },
  });
  return NextResponse.json(activity);
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const activity = await prisma.cruiseActivity.update({
    where: { id: body.id },
    data: {
      name: body.name,
      description: body.description || null,
      startTime: body.startTime,
      endTime: body.endTime,
      cost: body.cost != null ? body.cost : undefined,
      location: body.location || null,
      type: body.type || 'excursion',
      isRecommended: body.isRecommended ?? undefined,
      sortOrder: body.sortOrder ?? undefined,
    },
    include: { choices: true },
  });
  return NextResponse.json(activity);
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  await prisma.cruiseActivity.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

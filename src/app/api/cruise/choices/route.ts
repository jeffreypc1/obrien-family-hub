import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const userName = req.nextUrl.searchParams.get('userName');
  const where = userName ? { userName } : {};
  const choices = await prisma.cruiseChoice.findMany({ where });
  return NextResponse.json(choices);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  // Upsert: create or update the choice
  const choice = await prisma.cruiseChoice.upsert({
    where: {
      activityId_userName: {
        activityId: body.activityId,
        userName: body.userName,
      },
    },
    update: {
      choice: body.choice,
      customStartTime: body.customStartTime ?? undefined,
      customEndTime: body.customEndTime ?? undefined,
      comment: body.comment ?? undefined,
    },
    create: {
      activityId: body.activityId,
      userName: body.userName,
      choice: body.choice,
      customStartTime: body.customStartTime || null,
      customEndTime: body.customEndTime || null,
      comment: body.comment || null,
    },
  });
  return NextResponse.json(choice);
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  await prisma.cruiseChoice.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

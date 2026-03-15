import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const chores = await prisma.$queryRawUnsafe('SELECT * FROM RecurringChore WHERE active = 1 ORDER BY dayOfWeek, title') as Record<string, unknown>[];
  return NextResponse.json(chores);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { title, description, dayOfWeek, dollarAmount, assignedTo, createdBy } = body;

  if (!title?.trim() || dayOfWeek === undefined || !assignedTo || !createdBy) {
    return NextResponse.json({ error: 'title, dayOfWeek, assignedTo, createdBy required' }, { status: 400 });
  }

  const id = `rc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  await prisma.$executeRawUnsafe(
    `INSERT INTO RecurringChore (id, title, description, dayOfWeek, dollarAmount, assignedTo, createdBy, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    id, title.trim(), description?.trim() || null, dayOfWeek, dollarAmount || null, assignedTo, createdBy
  );

  return NextResponse.json({ id, title: title.trim() });
}

// Generate this week's tasks from recurring chores
export async function PUT(request: NextRequest) {
  const body = await request.json();
  if (body.action !== 'generate') {
    return NextResponse.json({ error: 'action must be generate' }, { status: 400 });
  }

  const chores = await prisma.$queryRawUnsafe('SELECT * FROM RecurringChore WHERE active = 1') as Array<Record<string, unknown>>;
  const today = new Date();
  const created = [];

  for (const chore of chores) {
    // Calculate next occurrence this week
    const choreDay = Number(chore.dayOfWeek); // 0=Sun, 6=Sat
    const currentDay = today.getDay();
    let daysUntil = choreDay - currentDay;
    if (daysUntil < 0) daysUntil += 7;
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + daysUntil);
    const dateStr = targetDate.toISOString().split('T')[0];

    // Check if already created for this date
    const existing = await prisma.todoItem.findFirst({
      where: { title: chore.title as string, assignedTo: chore.assignedTo as string, dueDate: dateStr },
    });

    if (!existing) {
      await prisma.todoItem.create({
        data: {
          id: `todo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          title: chore.title as string,
          description: chore.description as string | null,
          assignedTo: chore.assignedTo as string,
          createdBy: chore.createdBy as string,
          dueDate: dateStr,
          dollarAmount: chore.dollarAmount as number | null,
        },
      });
      created.push({ title: chore.title, date: dateStr, assignedTo: chore.assignedTo });
    }
  }

  return NextResponse.json({ created, count: created.length });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  await prisma.$executeRawUnsafe('DELETE FROM RecurringChore WHERE id = ?', id);
  return NextResponse.json({ success: true });
}

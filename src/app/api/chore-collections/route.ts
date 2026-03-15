import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const collections = await prisma.$queryRawUnsafe('SELECT * FROM ChoreCollection WHERE active = 1 ORDER BY title') as Record<string, unknown>[];
  const enriched = await Promise.all(collections.map(async (c) => {
    const items = await prisma.$queryRawUnsafe('SELECT * FROM ChoreCollectionItem WHERE collectionId = ? ORDER BY dayOfWeek, sortOrder', c.id) as Record<string, unknown>[];
    const weeks = await prisma.$queryRawUnsafe('SELECT * FROM ChoreCollectionWeek WHERE collectionId = ? ORDER BY weekStart DESC', c.id) as Record<string, unknown>[];
    return { ...c, items, weeks };
  }));
  return NextResponse.json(enriched);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  // Create collection
  if (body.action === 'create') {
    const { title, assignedTo, createdBy, dollarAmount, dueDay } = body;
    if (!title?.trim() || !assignedTo || !createdBy || !dollarAmount) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }
    const id = `cc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    await prisma.$executeRawUnsafe(
      'INSERT INTO ChoreCollection (id, title, assignedTo, createdBy, dollarAmount, dueDay, createdAt) VALUES (?, ?, ?, ?, ?, ?, datetime("now"))',
      id, title.trim(), assignedTo, createdBy, dollarAmount, dueDay ?? 6
    );
    return NextResponse.json({ id });
  }

  // Add item to collection
  if (body.action === 'add-item') {
    const { collectionId, title, dayOfWeek } = body;
    if (!collectionId || !title?.trim() || dayOfWeek === undefined) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }
    const id = `cci-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const count = await prisma.$queryRawUnsafe('SELECT COUNT(*) as c FROM ChoreCollectionItem WHERE collectionId = ?', collectionId) as Array<{ c: number }>;
    await prisma.$executeRawUnsafe(
      'INSERT INTO ChoreCollectionItem (id, collectionId, title, dayOfWeek, sortOrder) VALUES (?, ?, ?, ?, ?)',
      id, collectionId, title.trim(), dayOfWeek, count[0]?.c || 0
    );
    return NextResponse.json({ id });
  }

  // Generate week
  if (body.action === 'generate-week') {
    const { collectionId } = body;
    // Get the Monday of this week
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    const weekStart = monday.toISOString().split('T')[0];

    // Get the collection's due day
    const collections = await prisma.$queryRawUnsafe('SELECT * FROM ChoreCollection WHERE id = ?', collectionId) as Array<Record<string, unknown>>;
    if (!collections.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const dueDay = Number(collections[0].dueDay) || 6; // 0=Sun, 6=Sat

    // Calculate due date
    const dueDate = new Date(monday);
    const daysUntilDue = (dueDay - 1 + 7) % 7; // days from Monday
    dueDate.setDate(monday.getDate() + daysUntilDue);
    const dueDateStr = dueDate.toISOString().split('T')[0];

    // Check if already exists
    const existing = await prisma.$queryRawUnsafe('SELECT * FROM ChoreCollectionWeek WHERE collectionId = ? AND weekStart = ?', collectionId, weekStart) as unknown[];
    if (existing.length > 0) return NextResponse.json({ message: 'Already generated', existing: existing[0] });

    const id = `ccw-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    await prisma.$executeRawUnsafe(
      'INSERT INTO ChoreCollectionWeek (id, collectionId, weekStart, dueDate, createdAt) VALUES (?, ?, ?, ?, datetime("now"))',
      id, collectionId, weekStart, dueDateStr
    );
    return NextResponse.json({ id, weekStart, dueDate: dueDateStr });
  }

  // Toggle item completion
  if (body.action === 'toggle-item') {
    const { weekId, itemId } = body;
    const weeks = await prisma.$queryRawUnsafe('SELECT * FROM ChoreCollectionWeek WHERE id = ?', weekId) as Array<Record<string, unknown>>;
    if (!weeks.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const week = weeks[0];
    let completed: string[] = [];
    try { completed = JSON.parse(week.completedItemsJson as string || '[]'); } catch {}

    if (completed.includes(itemId)) {
      completed = completed.filter((id) => id !== itemId);
    } else {
      completed.push(itemId);
    }

    // Check if all items are done
    const items = await prisma.$queryRawUnsafe('SELECT COUNT(*) as c FROM ChoreCollectionItem WHERE collectionId = ?', week.collectionId) as Array<{ c: number }>;
    const allComplete = completed.length >= (items[0]?.c || 0) ? 1 : 0;

    await prisma.$executeRawUnsafe(
      'UPDATE ChoreCollectionWeek SET completedItemsJson = ?, allComplete = ? WHERE id = ?',
      JSON.stringify(completed), allComplete, weekId
    );
    return NextResponse.json({ completed, allComplete });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const itemId = searchParams.get('itemId');

  if (itemId) {
    await prisma.$executeRawUnsafe('DELETE FROM ChoreCollectionItem WHERE id = ?', itemId);
    return NextResponse.json({ success: true });
  }
  if (id) {
    await prisma.$executeRawUnsafe('DELETE FROM ChoreCollectionItem WHERE collectionId = ?', id);
    await prisma.$executeRawUnsafe('DELETE FROM ChoreCollectionWeek WHERE collectionId = ?', id);
    await prisma.$executeRawUnsafe('DELETE FROM ChoreCollection WHERE id = ?', id);
    return NextResponse.json({ success: true });
  }
  return NextResponse.json({ error: 'id required' }, { status: 400 });
}

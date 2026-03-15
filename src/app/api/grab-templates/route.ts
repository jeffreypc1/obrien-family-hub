import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const templates = await prisma.$queryRawUnsafe('SELECT * FROM GrabTaskTemplate ORDER BY category, title') as Record<string, unknown>[];
  return NextResponse.json(templates);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  // Bulk post selected templates as unclaimed tasks
  if (body.action === 'bulk-post' && body.templateIds && body.createdBy) {
    const templates = await prisma.$queryRawUnsafe('SELECT * FROM GrabTaskTemplate') as Array<Record<string, unknown>>;
    const selected = templates.filter((t) => body.templateIds.includes(t.id));
    const created = [];

    for (const t of selected) {
      await prisma.todoItem.create({
        data: {
          id: `todo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          title: t.title as string,
          description: t.description as string | null,
          assignedTo: 'unclaimed',
          createdBy: body.createdBy,
          dollarAmount: (body.amountOverrides?.[t.id as string] as number) || (t.dollarAmount as number | null),
        },
      });
      created.push(t.title);
    }

    return NextResponse.json({ created, count: created.length });
  }

  // Add a custom template
  if (body.title) {
    const id = `gt-custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    await prisma.$executeRawUnsafe(
      `INSERT INTO GrabTaskTemplate (id, title, description, dollarAmount, category, createdAt) VALUES (?, ?, ?, ?, ?, datetime('now'))`,
      id, body.title.trim(), body.description?.trim() || null, body.dollarAmount || null, body.category || 'general'
    );
    return NextResponse.json({ id });
  }

  return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, title, description, dollarAmount, category } = body;
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const updates: string[] = [];
  const values: unknown[] = [];
  if (title !== undefined) { updates.push('title = ?'); values.push(title.trim()); }
  if (description !== undefined) { updates.push('description = ?'); values.push(description?.trim() || null); }
  if (dollarAmount !== undefined) { updates.push('dollarAmount = ?'); values.push(dollarAmount); }
  if (category !== undefined) { updates.push('category = ?'); values.push(category); }

  if (updates.length > 0) {
    values.push(id);
    await prisma.$executeRawUnsafe(`UPDATE GrabTaskTemplate SET ${updates.join(', ')} WHERE id = ?`, ...values);
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  await prisma.$executeRawUnsafe('DELETE FROM GrabTaskTemplate WHERE id = ?', id);
  return NextResponse.json({ success: true });
}

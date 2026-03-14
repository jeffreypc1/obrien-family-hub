import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const assignedTo = searchParams.get('assignedTo');
  const createdBy = searchParams.get('createdBy');

  const where: Record<string, string> = {};
  if (assignedTo) where.assignedTo = assignedTo;
  if (createdBy) where.createdBy = createdBy;

  const todos = await prisma.todoItem.findMany({
    where,
    orderBy: [{ status: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }],
  });

  return NextResponse.json(todos);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { title, description, assignedTo, createdBy, dueDate } = body;

  if (!title?.trim() || !assignedTo || !createdBy) {
    return NextResponse.json({ error: 'title, assignedTo, and createdBy required' }, { status: 400 });
  }

  const todo = await prisma.todoItem.create({
    data: {
      id: `todo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: title.trim(),
      description: description?.trim() || null,
      assignedTo,
      createdBy,
      dueDate: dueDate || null,
    },
  });

  return NextResponse.json(todo);
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, status, title, description, dueDate } = body;

  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const updates: Record<string, unknown> = {};
  if (status) {
    updates.status = status;
    if (status === 'in-progress' && !body.startedAt) {
      updates.startedAt = new Date().toISOString();
    }
    if (status === 'done') {
      updates.completedAt = new Date().toISOString();
    }
    if (status === 'todo') {
      updates.startedAt = null;
      updates.completedAt = null;
    }
    if (status === 'archived') {
      if (!body.completedAt) updates.completedAt = new Date().toISOString();
    }
  }
  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (dueDate !== undefined) updates.dueDate = dueDate;

  const todo = await prisma.todoItem.update({ where: { id }, data: updates });
  return NextResponse.json(todo);
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  await prisma.todoItem.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

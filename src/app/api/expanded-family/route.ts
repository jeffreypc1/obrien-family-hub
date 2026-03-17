import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET: Get expanded family config (which apps are shared)
export async function GET() {
  const config = await prisma.hubConfig.findFirst({ where: { id: 'singleton' } });
  const expandedApps = config?.expandedAppsJson ? JSON.parse(config.expandedAppsJson) : [];
  const members = await prisma.familyMember.findMany({ orderBy: { createdAt: 'asc' } });
  return NextResponse.json({ expandedApps, members });
}

// POST: Update expanded family config
export async function POST(req: NextRequest) {
  const body = await req.json();

  if (body.action === 'set-expanded-apps') {
    await prisma.hubConfig.upsert({
      where: { id: 'singleton' },
      update: { expandedAppsJson: JSON.stringify(body.apps) },
      create: { id: 'singleton', expandedAppsJson: JSON.stringify(body.apps) },
    });
    return NextResponse.json({ ok: true });
  }

  if (body.action === 'add-member') {
    const member = await prisma.familyMember.create({
      data: {
        name: body.name,
        emoji: body.emoji || '👤',
        color: body.color || '#06B6D4',
        role: body.role || 'expanded',
        pin: body.pin || null,
      },
    });
    return NextResponse.json(member);
  }

  if (body.action === 'update-member') {
    const member = await prisma.familyMember.update({
      where: { id: body.id },
      data: {
        name: body.name ?? undefined,
        emoji: body.emoji ?? undefined,
        color: body.color ?? undefined,
        role: body.role ?? undefined,
        pin: body.pin !== undefined ? body.pin : undefined,
      },
    });
    return NextResponse.json(member);
  }

  if (body.action === 'delete-member') {
    await prisma.familyMember.delete({ where: { id: body.id } });
    return NextResponse.json({ ok: true });
  }

  if (body.action === 'seed-expanded') {
    const existing = await prisma.familyMember.findMany({ where: { role: 'expanded' } });
    if (existing.length > 0) {
      return NextResponse.json({ message: 'Expanded members already exist', count: existing.length });
    }

    const expandedMembers = [
      { name: 'Aunt Kelly-kins', emoji: '💖', color: '#EC4899', pin: '1001' },
      { name: 'Uncle Dean Bean', emoji: '🫘', color: '#84CC16', pin: '1002' },
      { name: 'Manga', emoji: '📚', color: '#8B5CF6', pin: '1003' },
      { name: 'Pat Pat', emoji: '🤗', color: '#F59E0B', pin: '1004' },
      { name: 'Trisha-Dish', emoji: '🍽️', color: '#EF4444', pin: '1005' },
      { name: 'Hopey', emoji: '🌟', color: '#06B6D4', pin: '1006' },
      { name: 'Daniella', emoji: '🦋', color: '#A855F7', pin: '1007' },
    ];

    for (const m of expandedMembers) {
      await prisma.familyMember.create({
        data: { ...m, role: 'expanded' },
      });
    }

    // Set default shared apps
    await prisma.hubConfig.upsert({
      where: { id: 'singleton' },
      update: { expandedAppsJson: JSON.stringify(['cruise', 'italian', 'photos', 'recommendations', 'eurovision']) },
      create: { id: 'singleton', expandedAppsJson: JSON.stringify(['cruise', 'italian', 'photos', 'recommendations', 'eurovision']) },
    });

    return NextResponse.json({ message: 'Seeded expanded family', count: expandedMembers.length });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}

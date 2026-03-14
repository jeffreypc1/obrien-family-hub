import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const [config, members] = await Promise.all([
    prisma.hubConfig.findUnique({ where: { id: 'singleton' } }),
    prisma.familyMember.findMany({ orderBy: { createdAt: 'asc' } }),
  ]);
  return NextResponse.json({ config, members });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { pin, config, deleteMemberId, newMember, updateMember } = body;

  if (pin !== process.env.ADMIN_PIN) {
    return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 });
  }

  if (config && Object.keys(config).length > 0) {
    await prisma.hubConfig.upsert({
      where: { id: 'singleton' },
      update: config,
      create: { id: 'singleton', ...config },
    });
  }

  if (deleteMemberId) {
    await prisma.familyMember.delete({ where: { id: deleteMemberId } });
  }

  if (updateMember) {
    const { id: memberId, ...memberData } = updateMember;
    await prisma.familyMember.update({
      where: { id: memberId },
      data: memberData,
    });
  }

  if (newMember) {
    await prisma.familyMember.create({
      data: {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: newMember.name,
        emoji: newMember.emoji || '🎵',
        color: newMember.color || '#E91E8C',
      },
    });
  }

  const [updatedConfig, members] = await Promise.all([
    prisma.hubConfig.findUnique({ where: { id: 'singleton' } }),
    prisma.familyMember.findMany({ orderBy: { createdAt: 'asc' } }),
  ]);

  return NextResponse.json({ config: updatedConfig, members });
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userName = searchParams.get('user');

  if (!userName) {
    return NextResponse.json({ error: 'user required' }, { status: 400 });
  }

  const vocab = await prisma.userVocabList.findMany({
    where: { userName },
    orderBy: { dateAdded: 'desc' },
  });

  return NextResponse.json(vocab);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { userName, germanWord, englishWord, exampleSentence, sourceVideoId } = body;

  if (!userName || !germanWord || !englishWord) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Check if word already exists for this user
  const existing = await prisma.userVocabList.findFirst({
    where: { userName, germanWord },
  });

  if (existing) {
    return NextResponse.json({ message: 'Already in your list', item: existing });
  }

  const item = await prisma.userVocabList.create({
    data: {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      userName,
      germanWord,
      englishWord,
      exampleSentence: exampleSentence || null,
      sourceVideoId: sourceVideoId || null,
    },
  });

  return NextResponse.json(item);
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 });
  }

  await prisma.userVocabList.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

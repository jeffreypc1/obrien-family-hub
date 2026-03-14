import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { recipeId, memberName, stars } = body;

  if (!recipeId || !memberName || !stars || stars < 1 || stars > 5) {
    return NextResponse.json({ error: 'Invalid rating data' }, { status: 400 });
  }

  const rating = await prisma.recipeRating.create({
    data: {
      id: `rating-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      recipeId,
      memberName,
      stars,
    },
  });

  return NextResponse.json(rating);
}

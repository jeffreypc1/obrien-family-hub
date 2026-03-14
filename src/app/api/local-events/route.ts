import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get('city');

  const where = city ? { city } : {};
  const events = await prisma.localEvent.findMany({
    where,
    orderBy: { date: 'asc' },
  });

  return NextResponse.json(events);
}

// Fetch local events from online sources
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { city, action } = body;

  if (action === 'fetch' && city) {
    // Search for events using Google Custom Search or a similar API
    const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
    if (!GOOGLE_API_KEY) {
      return NextResponse.json({ error: 'Google API key not configured' }, { status: 500 });
    }

    try {
      // Use Google search to find events
      const query = encodeURIComponent(`events in ${city} this week 2026`);
      const res = await fetch(
        `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=a832d7965e1944eab&q=${query}&num=10`
      );

      if (!res.ok) {
        // Fallback: create placeholder events from search
        return NextResponse.json({ message: 'Search API unavailable, add events manually', events: [] });
      }

      const data = await res.json();
      const items = data.items || [];

      const events = [];
      for (const item of items.slice(0, 10)) {
        const id = `local-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const existing = await prisma.localEvent.findFirst({ where: { title: item.title, city } });
        if (existing) continue;

        const event = await prisma.localEvent.create({
          data: {
            id,
            title: item.title || 'Event',
            description: item.snippet || null,
            city,
            url: item.link || null,
            source: item.displayLink || null,
            imageUrl: item.pagemap?.cse_thumbnail?.[0]?.src || null,
          },
        });
        events.push(event);
      }

      return NextResponse.json({ events, count: events.length });
    } catch (e) {
      return NextResponse.json({ error: `Failed to fetch: ${e instanceof Error ? e.message : 'Unknown'}` }, { status: 500 });
    }
  }

  // Manual add
  if (body.title && body.city) {
    const event = await prisma.localEvent.create({
      data: {
        id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title: body.title,
        description: body.description || null,
        date: body.date || null,
        venue: body.venue || null,
        city: body.city,
        url: body.url || null,
        source: 'Manual',
      },
    });
    return NextResponse.json(event);
  }

  return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  await prisma.localEvent.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

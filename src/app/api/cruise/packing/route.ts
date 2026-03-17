import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const SUGGESTED_ITEMS: { category: string; items: string[] }[] = [
  {
    category: '📄 Documents',
    items: [
      'Passport', 'Cruise booking confirmation', 'Travel insurance docs',
      'Credit cards', 'Cash (Euros + Turkish Lira)', 'Copies of IDs (digital + paper)',
      'Emergency contact list',
    ],
  },
  {
    category: '👕 Clothing',
    items: [
      'Lightweight shirts/tops (7+)', 'Shorts / skirts', 'Swimsuit(s)',
      'Formal night outfit', 'Light jacket or cardigan (ship AC is cold!)',
      'Comfortable walking shoes', 'Sandals / flip flops', 'Dress shoes (formal night)',
      'Underwear & socks', 'Pajamas', 'Sunhat / baseball cap',
      'Light scarf or wrap',
    ],
  },
  {
    category: '🧴 Toiletries',
    items: [
      'Sunscreen (SPF 50+)', 'Toothbrush & toothpaste', 'Shampoo & conditioner',
      'Deodorant', 'Razor', 'Medications (prescription)', 'Pain reliever / Advil',
      'Sea sickness meds (Dramamine or patches)', 'Band-aids / first aid basics',
      'Hand sanitizer', 'Lip balm with SPF', 'Aloe vera (for sunburn)',
    ],
  },
  {
    category: '🏖️ Beach & Pool',
    items: [
      'Beach towel (or use ship towels)', 'Sunglasses', 'Waterproof phone pouch',
      'Reef-safe sunscreen', 'Snorkel gear (or rent on excursion)',
      'Beach bag',
    ],
  },
  {
    category: '🔌 Electronics',
    items: [
      'Phone charger(s)', 'Portable battery pack', 'Camera',
      'Power strip (no surge protector — cruise rule)',
      'Headphones / earbuds', 'E-reader / Kindle',
      'European power adapter (for ports)',
    ],
  },
  {
    category: '🚢 Cruise Essentials',
    items: [
      'Lanyard for cruise card', 'Small day backpack (for excursions)',
      'Reusable water bottle', 'Magnetic hooks (for cabin walls)',
      'Night light (cabins are DARK)', 'Laundry bag',
      'Highlighters / pens (for daily planner)', 'Binoculars (for scenic cruising)',
      'Door magnets / decorations',
    ],
  },
  {
    category: '🎉 Fun & Comfort',
    items: [
      'Books / magazines', 'Playing cards / travel games',
      'Journal / notebook', 'Fancy accessories (formal night)',
      'Foldable tote bag (for shopping in port)',
      'Snacks for the cabin',
    ],
  },
];

// GET: fetch user's packing list
export async function GET(req: NextRequest) {
  const userName = req.nextUrl.searchParams.get('userName');
  if (!userName) return NextResponse.json({ error: 'Missing userName' }, { status: 400 });

  let items = await prisma.packingItem.findMany({
    where: { userName },
    orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
  });

  // If no items, seed the suggested list for this user
  if (items.length === 0) {
    let order = 0;
    for (const cat of SUGGESTED_ITEMS) {
      for (const name of cat.items) {
        await prisma.packingItem.create({
          data: { userName, category: cat.category, name, sortOrder: order++, isCustom: false },
        });
      }
    }
    items = await prisma.packingItem.findMany({
      where: { userName },
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  return NextResponse.json(items);
}

// POST: add item or toggle packed
export async function POST(req: NextRequest) {
  const body = await req.json();

  if (body.action === 'toggle') {
    const item = await prisma.packingItem.update({
      where: { id: body.id },
      data: { packed: body.packed },
    });
    return NextResponse.json(item);
  }

  if (body.action === 'add') {
    const item = await prisma.packingItem.create({
      data: {
        userName: body.userName,
        category: body.category || '📌 Custom',
        name: body.name,
        isCustom: true,
        sortOrder: 999,
      },
    });
    return NextResponse.json(item);
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}

// DELETE: remove a custom item
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  await prisma.packingItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

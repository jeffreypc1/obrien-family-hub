import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

interface SeedActivity {
  name: string; startTime: string; endTime: string; type: string;
  description: string; cost?: number; location?: string; isRecommended?: boolean;
}
interface SeedDay {
  dayNumber: number; date: string; portName?: string; isSeaDay?: boolean;
  arrivalTime?: string; departureTime?: string; description: string;
  activities: SeedActivity[];
}

// ─── Real Enchanted Princess Voyage N619 ───────────────────
// 7-Night Mediterranean & Aegean — Rome (Civitavecchia) roundtrip
// June 23–30, 2026

const ITINERARY: SeedDay[] = [
  {
    dayNumber: 1, date: '2026-06-09', portName: 'Civitavecchia (Rome), Italy',
    departureTime: '18:00', description: 'Embarkation — Welcome aboard!',
    activities: [
      { name: 'Board the Ship', startTime: '11:00', endTime: '15:00', type: 'port', description: 'Check-in at the Civitavecchia cruise terminal and board the Enchanted Princess' },
      { name: 'Muster Drill', startTime: '16:00', endTime: '16:30', type: 'port', description: 'Required safety muster drill — all guests must attend', isRecommended: true },
      { name: 'Sail Away Party', startTime: '17:30', endTime: '18:30', type: 'event', description: 'Celebrate our departure from the top deck with music, cocktails, and ocean views', isRecommended: true },
      // Dining
      { name: 'Breakfast — Horizon Court Buffet', startTime: '06:30', endTime: '10:00', type: 'dining', description: 'Complimentary buffet breakfast on Deck 14 — omelets, pastries, fruit, and more', location: 'Deck 14 Aft' },
      { name: 'Welcome Dinner — Main Dining Room', startTime: '17:30', endTime: '19:00', type: 'dining', description: 'First seating dinner in the elegant Main Dining Room', location: 'Deck 5 Midship', isRecommended: true },
      { name: 'Welcome Dinner — Main Dining Room (Late)', startTime: '19:30', endTime: '21:30', type: 'dining', description: 'Second seating dinner in the Main Dining Room', location: 'Deck 5 Midship' },
      { name: 'Welcome Aboard Show', startTime: '20:30', endTime: '22:00', type: 'show', description: 'Opening night spectacular in the Princess Theater', location: 'Deck 6 Forward' },
    ],
  },
  {
    dayNumber: 2, date: '2026-06-10', isSeaDay: true, description: 'Cruising the Ionian Sea',
    activities: [
      // Dining
      { name: 'Breakfast — Horizon Court Buffet', startTime: '06:30', endTime: '10:00', type: 'dining', description: 'Full buffet breakfast', location: 'Deck 14 Aft' },
      { name: 'Breakfast — International Café', startTime: '06:00', endTime: '10:00', type: 'dining', description: 'Quick pastries, coffee, and light bites', location: 'Deck 5 Piazza' },
      { name: 'Lunch — Horizon Court Buffet', startTime: '11:30', endTime: '14:00', type: 'dining', description: 'International lunch buffet', location: 'Deck 14 Aft' },
      { name: 'Lunch — Alfredo\'s Pizzeria', startTime: '11:00', endTime: '15:00', type: 'dining', description: 'Complimentary hand-tossed pizza — the best at sea', location: 'Deck 5 Piazza' },
      // Events
      { name: 'Morning Yoga on Deck', startTime: '07:00', endTime: '08:00', type: 'event', description: 'Sunrise yoga on the Lido Deck with ocean views' },
      { name: 'Pool Deck Party', startTime: '11:00', endTime: '13:00', type: 'event', description: 'DJ, games, and poolside fun at the main pool', location: 'Deck 14 Lido' },
      { name: 'Greek Cooking Class', startTime: '14:00', endTime: '15:30', type: 'event', description: 'Learn to make moussaka and baklava with the head chef', cost: 39 },
      { name: 'Afternoon Tea', startTime: '15:30', endTime: '16:30', type: 'dining', description: 'Traditional British afternoon tea with finger sandwiches and scones', location: 'Deck 5 Piazza' },
      { name: 'Family Trivia Night', startTime: '18:00', endTime: '19:00', type: 'event', description: 'Team up for Mediterranean trivia in the Wheelhouse Bar', location: 'Deck 7', isRecommended: true },
      { name: 'Dinner — Main Dining Room', startTime: '17:30', endTime: '19:00', type: 'dining', description: 'First seating dinner', location: 'Deck 5 Midship', isRecommended: true },
      { name: 'Dinner — Main Dining Room (Late)', startTime: '19:30', endTime: '21:30', type: 'dining', description: 'Second seating dinner', location: 'Deck 5 Midship' },
      { name: 'Dinner — Crown Grill', startTime: '17:30', endTime: '21:00', type: 'dining', description: 'Premium steakhouse and seafood (cover charge $39/person)', location: 'Deck 7', cost: 39 },
      { name: 'Comedy Show', startTime: '22:00', endTime: '23:30', type: 'show', description: 'Live stand-up comedy in the Vista Lounge', location: 'Deck 7' },
    ],
  },
  {
    dayNumber: 3, date: '2026-06-11', portName: 'Katakolon (Olympia), Greece',
    arrivalTime: '07:00', departureTime: '16:00', description: 'Birthplace of the Olympic Games',
    activities: [
      // Excursions
      { name: 'Ancient Olympia Tour', startTime: '08:00', endTime: '12:30', type: 'excursion', cost: 129, description: 'Walk the ancient stadium, see the Temple of Zeus, and visit the Archaeological Museum where the Olympic flame was born', location: 'Olympia' },
      { name: 'Olympia & Greek Village Experience', startTime: '08:00', endTime: '13:30', type: 'excursion', cost: 149, description: 'Visit Ancient Olympia plus a traditional hilltop village with olive oil tasting and local lunch', location: 'Olympia & Kaiafas' },
      { name: 'Beach & Wine Tasting', startTime: '09:00', endTime: '14:00', type: 'excursion', cost: 89, description: 'Relax at a stunning Greek beach followed by local wine and meze tasting', location: 'Katakolon Coast' },
      { name: 'Katakolon Village Walk (On Your Own)', startTime: '08:00', endTime: '15:30', type: 'excursion', description: 'Stroll the charming waterfront village, shop for souvenirs, and enjoy seaside cafés', location: 'Katakolon' },
      // Dining
      { name: 'Breakfast — Horizon Court Buffet', startTime: '06:30', endTime: '10:00', type: 'dining', description: 'Full buffet breakfast', location: 'Deck 14 Aft' },
      { name: 'Lunch — Horizon Court Buffet', startTime: '11:30', endTime: '14:00', type: 'dining', description: 'International lunch buffet', location: 'Deck 14 Aft' },
      { name: 'Family Dinner — Main Dining Room', startTime: '17:30', endTime: '19:00', type: 'dining', description: 'Greek night in the Main Dining Room', location: 'Deck 5 Midship', isRecommended: true },
      { name: 'Dinner — Sabatini\'s', startTime: '17:30', endTime: '21:00', type: 'dining', description: 'Italian specialty dining with handmade pasta (cover charge $29/person)', location: 'Deck 5', cost: 29 },
    ],
  },
  {
    dayNumber: 4, date: '2026-06-12', portName: 'Santorini, Greece',
    arrivalTime: '09:00', departureTime: '20:00', description: 'Iconic white-washed cliffs & sunsets',
    activities: [
      // Excursions
      { name: 'Oia & Fira Walking Tour', startTime: '10:00', endTime: '15:00', type: 'excursion', cost: 99, description: 'Explore the iconic blue-domed villages of Oia and Fira with stunning caldera views', location: 'Oia & Fira' },
      { name: 'Santorini Wine & Sunset Tour', startTime: '14:00', endTime: '19:30', type: 'excursion', cost: 139, description: 'Visit three local wineries, taste Assyrtiko wines, and catch the famous Santorini sunset from Oia', location: 'Santorini Wineries' },
      { name: 'Caldera Catamaran Cruise', startTime: '10:30', endTime: '15:30', type: 'excursion', cost: 169, description: 'Sail the caldera, swim in hot springs, snorkel, and enjoy a BBQ lunch on deck', location: 'Santorini Caldera' },
      { name: 'Akrotiri Archaeological Site', startTime: '10:00', endTime: '13:00', type: 'excursion', cost: 79, description: 'Explore the "Pompeii of the Aegean" — a Minoan city preserved in volcanic ash since 1627 BC', location: 'Akrotiri' },
      { name: 'Red Beach & Perissa', startTime: '10:30', endTime: '16:00', type: 'excursion', cost: 59, description: 'Visit Santorini\'s famous Red Beach and relax on the black sand at Perissa', location: 'South Santorini' },
      { name: 'Fira On Your Own (Tender)', startTime: '09:30', endTime: '19:00', type: 'excursion', description: 'Take the tender ashore and explore Fira at your own pace — ride the cable car or donkeys up the cliff', location: 'Fira' },
      // Dining
      { name: 'Breakfast — Horizon Court Buffet', startTime: '06:30', endTime: '10:00', type: 'dining', description: 'Full buffet breakfast', location: 'Deck 14 Aft' },
      { name: 'Family Dinner — Main Dining Room', startTime: '20:30', endTime: '22:00', type: 'dining', description: 'Late dinner after our Santorini day — share stories!', location: 'Deck 5 Midship', isRecommended: true },
      { name: 'Movies Under the Stars', startTime: '22:00', endTime: '00:00', type: 'show', description: 'Outdoor movie on the top deck with popcorn and blankets', location: 'Deck 14' },
    ],
  },
  {
    dayNumber: 5, date: '2026-06-13', portName: 'Kusadasi (Ephesus), Turkey',
    arrivalTime: '07:00', departureTime: '16:00', description: 'Ancient ruins of Ephesus & Turkish bazaars',
    activities: [
      // Excursions
      { name: 'Ephesus Highlights Tour', startTime: '08:00', endTime: '12:00', type: 'excursion', cost: 109, description: 'Guided walk through the ancient city of Ephesus — Library of Celsus, Great Theater, and Terrace Houses', location: 'Ephesus' },
      { name: 'Ephesus & House of the Virgin Mary', startTime: '07:30', endTime: '13:00', type: 'excursion', cost: 139, description: 'Visit the ancient city plus the sacred hillside chapel where Mary is said to have spent her final years', location: 'Ephesus & Bülbüldağı' },
      { name: 'Turkish Cooking & Carpet Weaving', startTime: '09:00', endTime: '13:30', type: 'excursion', cost: 99, description: 'Learn to cook Turkish dishes and watch traditional carpet weaving demonstrations', location: 'Kusadasi' },
      { name: 'Turkish Bath Experience', startTime: '09:00', endTime: '11:30', type: 'excursion', cost: 69, description: 'Traditional hammam experience with steam, scrub, and massage', location: 'Kusadasi' },
      { name: 'Kusadasi Bazaar (On Your Own)', startTime: '08:00', endTime: '15:30', type: 'excursion', description: 'Walk to the famous bazaar — haggle for leather goods, spices, ceramics, and Turkish delight', location: 'Kusadasi Grand Bazaar' },
      // Dining
      { name: 'Breakfast — Horizon Court Buffet', startTime: '06:30', endTime: '10:00', type: 'dining', description: 'Full buffet breakfast', location: 'Deck 14 Aft' },
      { name: 'Lunch — Horizon Court Buffet', startTime: '11:30', endTime: '14:00', type: 'dining', description: 'International lunch buffet', location: 'Deck 14 Aft' },
      { name: 'Family Dinner — Main Dining Room', startTime: '17:30', endTime: '19:00', type: 'dining', description: 'Turkish-themed dinner night', location: 'Deck 5 Midship', isRecommended: true },
      { name: 'Live Music & Cocktails', startTime: '21:00', endTime: '23:00', type: 'show', description: 'Live band in the Piazza atrium with cocktails', location: 'Deck 5 Piazza' },
    ],
  },
  {
    dayNumber: 6, date: '2026-06-14', isSeaDay: true, description: 'Cruising toward the Amalfi Coast',
    activities: [
      // Dining
      { name: 'Breakfast — Horizon Court Buffet', startTime: '06:30', endTime: '10:00', type: 'dining', description: 'Full buffet breakfast', location: 'Deck 14 Aft' },
      { name: 'Breakfast — International Café', startTime: '06:00', endTime: '10:00', type: 'dining', description: 'Quick pastries, coffee, and light bites', location: 'Deck 5 Piazza' },
      { name: 'Lunch — Horizon Court Buffet', startTime: '11:30', endTime: '14:00', type: 'dining', description: 'International lunch buffet', location: 'Deck 14 Aft' },
      { name: 'Lunch — Alfredo\'s Pizzeria', startTime: '11:00', endTime: '15:00', type: 'dining', description: 'Hand-tossed pizza — a must', location: 'Deck 5 Piazza' },
      // Events
      { name: 'Sunrise Meditation', startTime: '06:30', endTime: '07:30', type: 'event', description: 'Peaceful morning meditation on the Sanctuary Deck', location: 'Deck 14' },
      { name: 'Italian Language Class', startTime: '10:00', endTime: '11:00', type: 'event', description: 'Brush up on Italian phrases for our Amalfi Coast stop tomorrow' },
      { name: 'Pool Games Tournament', startTime: '11:00', endTime: '13:00', type: 'event', description: 'Water volleyball, relay races, and pool games', location: 'Deck 14 Lido' },
      { name: 'Wine & Paint', startTime: '14:00', endTime: '16:00', type: 'event', description: 'Paint a Mediterranean scene while sipping Italian wine', cost: 45 },
      { name: 'Gelato Making Class', startTime: '16:00', endTime: '17:00', type: 'event', description: 'Learn to make authentic gelato with the pastry team', cost: 29 },
      { name: 'Formal Night Dinner — Main Dining Room', startTime: '17:30', endTime: '19:00', type: 'dining', description: 'Dress to impress! Formal night first seating', location: 'Deck 5 Midship', isRecommended: true },
      { name: 'Formal Night Dinner (Late Seating)', startTime: '19:30', endTime: '21:30', type: 'dining', description: 'Formal night second seating', location: 'Deck 5 Midship' },
      { name: 'Dinner — Crown Grill', startTime: '17:30', endTime: '21:00', type: 'dining', description: 'Premium steakhouse and seafood ($39/person)', location: 'Deck 7', cost: 39 },
      { name: 'Movie Under the Stars', startTime: '20:30', endTime: '22:30', type: 'show', description: 'Outdoor movie screening with popcorn', location: 'Deck 14', isRecommended: true },
      { name: 'Late Night Dance Party', startTime: '22:30', endTime: '01:00', type: 'event', description: 'DJ and dancing in Club 6', location: 'Deck 7' },
    ],
  },
  {
    dayNumber: 7, date: '2026-06-15', portName: 'Amalfi Coast (Salerno), Italy',
    arrivalTime: '09:00', departureTime: '18:00', description: 'Stunning clifftop villages & limoncello',
    activities: [
      // Excursions
      { name: 'Amalfi & Ravello Tour', startTime: '09:30', endTime: '15:00', type: 'excursion', cost: 149, description: 'Visit the Cathedral of Amalfi, stroll the streets, and explore the gardens of Ravello', location: 'Amalfi & Ravello' },
      { name: 'Pompeii from Salerno', startTime: '09:30', endTime: '14:30', type: 'excursion', cost: 139, description: 'Day trip to the ancient ruins of Pompeii with expert guide', location: 'Pompeii' },
      { name: 'Positano & Limoncello Tasting', startTime: '10:00', endTime: '15:30', type: 'excursion', cost: 119, description: 'Explore the colorful cliffside village and sample limoncello at a family farm', location: 'Positano' },
      { name: 'Amalfi Coast Boat Tour', startTime: '10:00', endTime: '14:00', type: 'excursion', cost: 109, description: 'See the coastline from the water — caves, coves, and breathtaking views', location: 'Amalfi Coast' },
      { name: 'Salerno Walking Tour (On Your Own)', startTime: '09:30', endTime: '17:30', type: 'excursion', description: 'Walk to the medieval cathedral, the lungomare, and explore the old town', location: 'Salerno' },
      // Dining
      { name: 'Breakfast — Horizon Court Buffet', startTime: '06:30', endTime: '10:00', type: 'dining', description: 'Full buffet breakfast', location: 'Deck 14 Aft' },
      { name: 'Lunch — Horizon Court Buffet', startTime: '11:30', endTime: '14:00', type: 'dining', description: 'International lunch buffet', location: 'Deck 14 Aft' },
      { name: "Captain's Farewell Dinner", startTime: '19:00', endTime: '21:00', type: 'dining', description: 'Final night — Captain\'s Gala Dinner in the Main Dining Room. Dress up and celebrate!', location: 'Deck 5 Midship', isRecommended: true },
      { name: 'Dinner — Sabatini\'s', startTime: '18:00', endTime: '21:00', type: 'dining', description: 'Italian specialty farewell dinner ($29/person)', location: 'Deck 5', cost: 29 },
      { name: 'Farewell Show', startTime: '22:00', endTime: '23:30', type: 'show', description: 'Final spectacular show in the Princess Theater', location: 'Deck 6 Forward' },
    ],
  },
  {
    dayNumber: 8, date: '2026-06-16', portName: 'Civitavecchia (Rome), Italy',
    arrivalTime: '06:00', description: 'Disembarkation — Arrivederci!',
    activities: [
      { name: 'Breakfast — Horizon Court Buffet', startTime: '06:00', endTime: '08:00', type: 'dining', description: 'Early breakfast before disembarkation', location: 'Deck 14 Aft' },
      { name: 'Disembarkation', startTime: '07:30', endTime: '10:00', type: 'port', description: 'Collect luggage from the hallway and disembark by assigned time group', isRecommended: true },
    ],
  },
];

// Support force reseed
export async function POST(req: NextRequest) {
  const force = req.nextUrl.searchParams.get('force') === '1';

  if (force) {
    await prisma.cruiseChoice.deleteMany();
    await prisma.cruiseActivity.deleteMany();
    await prisma.cruiseDay.deleteMany();
  } else {
    const existing = await prisma.cruiseDay.count();
    if (existing > 0) {
      return NextResponse.json({ message: 'Already seeded', count: existing });
    }
  }

  for (const day of ITINERARY) {
    const created = await prisma.cruiseDay.create({
      data: {
        dayNumber: day.dayNumber,
        date: day.date,
        portName: day.portName || null,
        isSeaDay: day.isSeaDay || false,
        arrivalTime: day.arrivalTime || null,
        departureTime: day.departureTime || null,
        description: day.description || null,
      },
    });

    for (let i = 0; i < day.activities.length; i++) {
      const a = day.activities[i];
      await prisma.cruiseActivity.create({
        data: {
          dayId: created.id,
          name: a.name,
          description: a.description || null,
          startTime: a.startTime,
          endTime: a.endTime,
          cost: a.cost || null,
          location: a.location || null,
          type: a.type || 'excursion',
          isRecommended: a.isRecommended || false,
          sortOrder: i,
        },
      });
    }
  }

  return NextResponse.json({ message: 'Seeded successfully', days: ITINERARY.length });
}

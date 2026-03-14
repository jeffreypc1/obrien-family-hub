export interface FamilyApp {
  id: string;
  name: string;
  tagline: string;
  description: string;
  url: string;
  icon: string;
  gradient: string;
  glowClass: string;
  accentColor: string;
  status: 'live' | 'coming-soon';
}

// ============================================================
// ADD NEW FAMILY APPS HERE — just add an object to this array!
// ============================================================
export const FAMILY_APPS: FamilyApp[] = [
  {
    id: 'eurovision',
    name: 'Eurovision Ranker',
    tagline: 'Rate. Rank. Celebrate.',
    description: 'Rate all 35 Eurovision 2026 entries, watch music videos, track family rankings over time, and see who has the best taste in music.',
    url: 'https://eurovision-family.vercel.app',
    icon: '🎤',
    gradient: 'from-pink-500 via-purple-500 to-blue-500',
    glowClass: 'glow-pink',
    accentColor: '#E91E8C',
    status: 'live',
  },
  // ---- FUTURE APPS ----
  // Uncomment and customize when ready:
  //
  // {
  //   id: 'recipes',
  //   name: 'Family Recipes',
  //   tagline: 'Cook. Share. Devour.',
  //   description: 'Our family cookbook — recipes passed down, discovered, and invented. Rate them, comment, and never forget grandma\'s secret sauce.',
  //   url: 'https://obrien-recipes.vercel.app',
  //   icon: '🍳',
  //   gradient: 'from-orange-500 via-red-500 to-yellow-500',
  //   glowClass: 'glow-orange',
  //   accentColor: '#F59E0B',
  //   status: 'coming-soon',
  // },
  // {
  //   id: 'travel',
  //   name: 'Trip Planner',
  //   tagline: 'Dream. Plan. Explore.',
  //   description: 'Plan family trips together — vote on destinations, build itineraries, and keep a photo journal of adventures.',
  //   url: 'https://obrien-travel.vercel.app',
  //   icon: '✈️',
  //   gradient: 'from-cyan-500 via-blue-500 to-indigo-500',
  //   glowClass: 'glow-cyan',
  //   accentColor: '#06B6D4',
  //   status: 'coming-soon',
  // },
  // {
  //   id: 'movie-night',
  //   name: 'Movie Night',
  //   tagline: 'Pick. Watch. Review.',
  //   description: 'End the "what should we watch?" debate forever. Everyone votes, the best pick wins, then rate it after.',
  //   url: 'https://obrien-movies.vercel.app',
  //   icon: '🎬',
  //   gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
  //   glowClass: 'glow-green',
  //   accentColor: '#10B981',
  //   status: 'coming-soon',
  // },
];

import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';
import { readFileSync } from 'fs';

// Load .env
const envContent = readFileSync('.env', 'utf-8');
for (const line of envContent.split('\n')) {
  const match = line.match(/^(\w+)=(.*)$/);
  if (match) process.env[match[1]] = match[2].trim();
}

const adapter = new PrismaLibSQL({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new PrismaClient({ adapter } as any);

// Initial set of videos - will be expanded with full research
const videos = [
  // A1 - Beginner
  {
    id: 'a1-01', youtubeId: 'mR2K4gjqOkA', title: 'Introducing Yourself in German', channel: 'Easy German',
    skillLevel: 'A1', description: 'Learn how to introduce yourself and basic greetings in German.',
    vocabItems: [
      { germanWord: 'Hallo', englishWord: 'Hello', partOfSpeech: 'interjection', exampleSentence: 'Hallo, wie geht es dir?', exampleTranslation: 'Hello, how are you?' },
      { germanWord: 'heißen', englishWord: 'to be called', partOfSpeech: 'verb', exampleSentence: 'Ich heiße Anna.', exampleTranslation: 'My name is Anna.' },
      { germanWord: 'kommen', englishWord: 'to come', partOfSpeech: 'verb', exampleSentence: 'Ich komme aus Deutschland.', exampleTranslation: 'I come from Germany.' },
      { germanWord: 'sprechen', englishWord: 'to speak', partOfSpeech: 'verb', exampleSentence: 'Sprechen Sie Deutsch?', exampleTranslation: 'Do you speak German?' },
      { germanWord: 'verstehen', englishWord: 'to understand', partOfSpeech: 'verb', exampleSentence: 'Ich verstehe nicht.', exampleTranslation: 'I don\'t understand.' },
    ],
    segments: [
      { startTime: 0, endTime: 5, germanText: 'Hallo und willkommen bei Easy German!', englishText: 'Hello and welcome to Easy German!', sortOrder: 0 },
      { startTime: 5, endTime: 12, germanText: 'Heute lernen wir, wie man sich auf Deutsch vorstellt.', englishText: 'Today we learn how to introduce yourself in German.', sortOrder: 1 },
      { startTime: 12, endTime: 18, germanText: 'Wie heißt du? Ich heiße Cari.', englishText: 'What is your name? My name is Cari.', sortOrder: 2 },
      { startTime: 18, endTime: 25, germanText: 'Woher kommst du? Ich komme aus Berlin.', englishText: 'Where do you come from? I come from Berlin.', sortOrder: 3 },
      { startTime: 25, endTime: 32, germanText: 'Was machst du? Ich bin Studentin.', englishText: 'What do you do? I am a student.', sortOrder: 4 },
    ],
  },
  {
    id: 'a1-02', youtubeId: 'CNCFNUwFkZI', title: 'Numbers in German 1-100', channel: 'Learn German with Anja',
    skillLevel: 'A1', description: 'Master German numbers from 1 to 100 with clear pronunciation.',
    vocabItems: [
      { germanWord: 'eins', englishWord: 'one', partOfSpeech: 'number', exampleSentence: 'Ich habe eins.', exampleTranslation: 'I have one.' },
      { germanWord: 'zwanzig', englishWord: 'twenty', partOfSpeech: 'number', exampleSentence: 'Er ist zwanzig Jahre alt.', exampleTranslation: 'He is twenty years old.' },
      { germanWord: 'hundert', englishWord: 'hundred', partOfSpeech: 'number', exampleSentence: 'Das kostet hundert Euro.', exampleTranslation: 'That costs a hundred euros.' },
    ],
    segments: [],
  },
  // A2 - Elementary
  {
    id: 'a2-01', youtubeId: 'NVf-tf5gbBk', title: 'A Day in My Life in Berlin', channel: 'Easy German',
    skillLevel: 'A2', description: 'Follow a typical day in Berlin and learn daily routine vocabulary.',
    vocabItems: [
      { germanWord: 'aufstehen', englishWord: 'to get up', partOfSpeech: 'verb', exampleSentence: 'Ich stehe um sieben Uhr auf.', exampleTranslation: 'I get up at seven o\'clock.' },
      { germanWord: 'frühstücken', englishWord: 'to have breakfast', partOfSpeech: 'verb', exampleSentence: 'Wir frühstücken zusammen.', exampleTranslation: 'We have breakfast together.' },
      { germanWord: 'arbeiten', englishWord: 'to work', partOfSpeech: 'verb', exampleSentence: 'Sie arbeitet im Büro.', exampleTranslation: 'She works in the office.' },
      { germanWord: 'einkaufen', englishWord: 'to shop', partOfSpeech: 'verb', exampleSentence: 'Ich gehe einkaufen.', exampleTranslation: 'I go shopping.' },
    ],
    segments: [
      { startTime: 0, endTime: 6, germanText: 'Guten Morgen! Heute zeige ich euch meinen Tag in Berlin.', englishText: 'Good morning! Today I show you my day in Berlin.', sortOrder: 0 },
      { startTime: 6, endTime: 12, germanText: 'Ich stehe normalerweise um halb acht auf.', englishText: 'I usually get up at half past seven.', sortOrder: 1 },
      { startTime: 12, endTime: 18, germanText: 'Dann frühstücke ich und trinke einen Kaffee.', englishText: 'Then I have breakfast and drink a coffee.', sortOrder: 2 },
      { startTime: 18, endTime: 25, germanText: 'Nach dem Frühstück fahre ich mit der U-Bahn zur Arbeit.', englishText: 'After breakfast I take the subway to work.', sortOrder: 3 },
    ],
  },
  // B1 - Intermediate
  {
    id: 'b1-01', youtubeId: 'D2H9tzzJBH0', title: 'What Germans Think About...', channel: 'Easy German',
    skillLevel: 'B1', description: 'Street interviews about opinions — great for learning how to express views.',
    vocabItems: [
      { germanWord: 'Meinung', englishWord: 'opinion', partOfSpeech: 'noun', exampleSentence: 'Was ist deine Meinung?', exampleTranslation: 'What is your opinion?' },
      { germanWord: 'glauben', englishWord: 'to believe/think', partOfSpeech: 'verb', exampleSentence: 'Ich glaube, das ist richtig.', exampleTranslation: 'I believe that is correct.' },
      { germanWord: 'eigentlich', englishWord: 'actually', partOfSpeech: 'adverb', exampleSentence: 'Eigentlich wollte ich nach Hause gehen.', exampleTranslation: 'Actually I wanted to go home.' },
      { germanWord: 'trotzdem', englishWord: 'nevertheless', partOfSpeech: 'adverb', exampleSentence: 'Es regnet, trotzdem gehe ich spazieren.', exampleTranslation: 'It\'s raining, nevertheless I go for a walk.' },
    ],
    segments: [],
  },
  // B2 - Upper Intermediate
  {
    id: 'b2-01', youtubeId: 'U7VrBbNpms4', title: 'How Good Is German Healthcare?', channel: 'Easy German',
    skillLevel: 'B2', description: 'Germans discuss the healthcare system — complex vocabulary and real opinions.',
    vocabItems: [
      { germanWord: 'Gesundheitssystem', englishWord: 'healthcare system', partOfSpeech: 'noun', exampleSentence: 'Das deutsche Gesundheitssystem ist komplex.', exampleTranslation: 'The German healthcare system is complex.' },
      { germanWord: 'Versicherung', englishWord: 'insurance', partOfSpeech: 'noun', exampleSentence: 'Jeder braucht eine Krankenversicherung.', exampleTranslation: 'Everyone needs health insurance.' },
      { germanWord: 'behandeln', englishWord: 'to treat', partOfSpeech: 'verb', exampleSentence: 'Der Arzt behandelt den Patienten.', exampleTranslation: 'The doctor treats the patient.' },
    ],
    segments: [],
  },
  // C1 - Advanced
  {
    id: 'c1-01', youtubeId: 'EhL4J7gk6Hk', title: 'Das Immunsystem erklärt', channel: 'Kurzgesagt',
    skillLevel: 'C1', description: 'The immune system explained in German — scientific vocabulary in an engaging format.',
    vocabItems: [
      { germanWord: 'Immunsystem', englishWord: 'immune system', partOfSpeech: 'noun', exampleSentence: 'Das Immunsystem schützt den Körper.', exampleTranslation: 'The immune system protects the body.' },
      { germanWord: 'Zelle', englishWord: 'cell', partOfSpeech: 'noun', exampleSentence: 'Weiße Blutzellen bekämpfen Krankheiten.', exampleTranslation: 'White blood cells fight diseases.' },
      { germanWord: 'Abwehr', englishWord: 'defense', partOfSpeech: 'noun', exampleSentence: 'Die Abwehr des Körpers ist sehr stark.', exampleTranslation: 'The body\'s defense is very strong.' },
    ],
    segments: [],
  },
  // C2 - Mastery
  {
    id: 'c2-01', youtubeId: 'qp3tMx_SMsg', title: 'Philosophie: Was ist Gerechtigkeit?', channel: 'Kurzgesagt',
    skillLevel: 'C2', description: 'What is justice? A philosophical exploration in native-level German.',
    vocabItems: [
      { germanWord: 'Gerechtigkeit', englishWord: 'justice', partOfSpeech: 'noun', exampleSentence: 'Gerechtigkeit ist ein grundlegendes Prinzip.', exampleTranslation: 'Justice is a fundamental principle.' },
      { germanWord: 'Gesellschaft', englishWord: 'society', partOfSpeech: 'noun', exampleSentence: 'Die Gesellschaft verändert sich ständig.', exampleTranslation: 'Society is constantly changing.' },
      { germanWord: 'Gleichheit', englishWord: 'equality', partOfSpeech: 'noun', exampleSentence: 'Alle Menschen verdienen Gleichheit.', exampleTranslation: 'All people deserve equality.' },
    ],
    segments: [],
  },
];

async function main() {
  console.log('🇩🇪 Seeding German learning videos...\n');

  // Clear existing
  await prisma.videoVocab.deleteMany();
  await prisma.videoSegment.deleteMany();
  await prisma.germanVideo.deleteMany();

  for (const v of videos) {
    const video = await prisma.germanVideo.create({
      data: {
        id: v.id,
        youtubeId: v.youtubeId,
        title: v.title,
        channel: v.channel,
        skillLevel: v.skillLevel,
        description: v.description,
        thumbnailUrl: `https://img.youtube.com/vi/${v.youtubeId}/mqdefault.jpg`,
      },
    });

    for (const vocab of v.vocabItems) {
      await prisma.videoVocab.create({
        data: {
          id: `${v.id}-v-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          videoId: video.id,
          ...vocab,
        },
      });
    }

    for (const seg of v.segments) {
      await prisma.videoSegment.create({
        data: {
          id: `${v.id}-s-${seg.sortOrder}`,
          videoId: video.id,
          ...seg,
        },
      });
    }

    console.log(`  ✅ ${v.skillLevel}: ${v.title} (${v.vocabItems.length} vocab, ${v.segments.length} segments)`);
  }

  console.log(`\n🎉 Seeded ${videos.length} videos!`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

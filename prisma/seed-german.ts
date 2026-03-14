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

interface VideoSeed {
  youtubeId: string;
  title: string;
  channel: string;
  skillLevel: string;
  description: string;
  vocab?: Array<{
    germanWord: string;
    englishWord: string;
    partOfSpeech?: string;
    exampleSentence?: string;
    exampleTranslation?: string;
  }>;
  segments?: Array<{
    startTime: number;
    endTime: number;
    germanText: string;
    englishText: string;
  }>;
}

// Load researched videos
const researchedVideos: VideoSeed[] = JSON.parse(readFileSync('german-learning-videos.json', 'utf-8'));

// Add vocab for key videos
const vocabByYoutubeId: Record<string, VideoSeed['vocab']> = {
  'r94aqLUO0wo': [ // Easy German - Introduce yourself
    { germanWord: 'Hallo', englishWord: 'Hello', partOfSpeech: 'interjection', exampleSentence: 'Hallo, wie geht es dir?', exampleTranslation: 'Hello, how are you?' },
    { germanWord: 'heißen', englishWord: 'to be called', partOfSpeech: 'verb', exampleSentence: 'Ich heiße Anna.', exampleTranslation: 'My name is Anna.' },
    { germanWord: 'kommen', englishWord: 'to come from', partOfSpeech: 'verb', exampleSentence: 'Woher kommst du?', exampleTranslation: 'Where do you come from?' },
    { germanWord: 'wohnen', englishWord: 'to live/reside', partOfSpeech: 'verb', exampleSentence: 'Ich wohne in Berlin.', exampleTranslation: 'I live in Berlin.' },
    { germanWord: 'sprechen', englishWord: 'to speak', partOfSpeech: 'verb', exampleSentence: 'Sprichst du Deutsch?', exampleTranslation: 'Do you speak German?' },
  ],
  '_F_zkRPRX6A': [ // German Cases
    { germanWord: 'Nominativ', englishWord: 'nominative case', partOfSpeech: 'noun', exampleSentence: 'Der Mann ist groß.', exampleTranslation: 'The man is tall.' },
    { germanWord: 'Akkusativ', englishWord: 'accusative case', partOfSpeech: 'noun', exampleSentence: 'Ich sehe den Mann.', exampleTranslation: 'I see the man.' },
    { germanWord: 'Dativ', englishWord: 'dative case', partOfSpeech: 'noun', exampleSentence: 'Ich gebe dem Mann das Buch.', exampleTranslation: 'I give the man the book.' },
    { germanWord: 'bestimmt', englishWord: 'definite', partOfSpeech: 'adjective', exampleSentence: 'Der bestimmte Artikel ist "der".', exampleTranslation: 'The definite article is "der".' },
  ],
  'xoCgEWJZjb8': [ // Breakfast Vocabulary
    { germanWord: 'Frühstück', englishWord: 'breakfast', partOfSpeech: 'noun', exampleSentence: 'Was isst du zum Frühstück?', exampleTranslation: 'What do you eat for breakfast?' },
    { germanWord: 'Brötchen', englishWord: 'bread roll', partOfSpeech: 'noun', exampleSentence: 'Ich esse ein Brötchen mit Butter.', exampleTranslation: 'I eat a bread roll with butter.' },
    { germanWord: 'Marmelade', englishWord: 'jam', partOfSpeech: 'noun', exampleSentence: 'Die Erdbeermarmelade schmeckt gut.', exampleTranslation: 'The strawberry jam tastes good.' },
    { germanWord: 'Müsli', englishWord: 'muesli/cereal', partOfSpeech: 'noun', exampleSentence: 'Ich esse Müsli mit Milch.', exampleTranslation: 'I eat muesli with milk.' },
  ],
  'opdykf17pCg': [ // Favorite Things A2
    { germanWord: 'Lieblings-', englishWord: 'favorite (prefix)', partOfSpeech: 'prefix', exampleSentence: 'Was ist dein Lieblingsessen?', exampleTranslation: 'What is your favorite food?' },
    { germanWord: 'gefallen', englishWord: 'to please/like', partOfSpeech: 'verb', exampleSentence: 'Das gefällt mir sehr.', exampleTranslation: 'I like that a lot.' },
    { germanWord: 'am liebsten', englishWord: 'most of all', partOfSpeech: 'adverb', exampleSentence: 'Am liebsten esse ich Pizza.', exampleTranslation: 'Most of all I like to eat pizza.' },
  ],
  'tG-xUzIKqtA': [ // Doctor appointment
    { germanWord: 'Termin', englishWord: 'appointment', partOfSpeech: 'noun', exampleSentence: 'Ich brauche einen Termin.', exampleTranslation: 'I need an appointment.' },
    { germanWord: 'Arzt', englishWord: 'doctor', partOfSpeech: 'noun', exampleSentence: 'Ich muss zum Arzt gehen.', exampleTranslation: 'I have to go to the doctor.' },
    { germanWord: 'Schmerzen', englishWord: 'pain', partOfSpeech: 'noun', exampleSentence: 'Ich habe Kopfschmerzen.', exampleTranslation: 'I have a headache.' },
    { germanWord: 'verschreiben', englishWord: 'to prescribe', partOfSpeech: 'verb', exampleSentence: 'Der Arzt verschreibt mir Medikamente.', exampleTranslation: 'The doctor prescribes me medication.' },
  ],
  'rChXZL8xfsw': [ // Roadtrip B1
    { germanWord: 'Ausflug', englishWord: 'excursion/trip', partOfSpeech: 'noun', exampleSentence: 'Wir machen einen Ausflug.', exampleTranslation: 'We are going on an excursion.' },
    { germanWord: 'spontan', englishWord: 'spontaneous', partOfSpeech: 'adjective', exampleSentence: 'Das war eine spontane Entscheidung.', exampleTranslation: 'That was a spontaneous decision.' },
    { germanWord: 'Grenze', englishWord: 'border', partOfSpeech: 'noun', exampleSentence: 'Wir fahren über die Grenze.', exampleTranslation: 'We drive across the border.' },
  ],
  'UZc7SE4W8iw': [ // Konjunktiv II
    { germanWord: 'hätte', englishWord: 'would have', partOfSpeech: 'verb', exampleSentence: 'Ich hätte gerne ein Eis.', exampleTranslation: 'I would like an ice cream.' },
    { germanWord: 'wäre', englishWord: 'would be', partOfSpeech: 'verb', exampleSentence: 'Das wäre schön.', exampleTranslation: 'That would be nice.' },
    { germanWord: 'könnte', englishWord: 'could', partOfSpeech: 'verb', exampleSentence: 'Könntest du mir helfen?', exampleTranslation: 'Could you help me?' },
    { germanWord: 'würde', englishWord: 'would', partOfSpeech: 'verb', exampleSentence: 'Ich würde gerne reisen.', exampleTranslation: 'I would like to travel.' },
  ],
  'jOiHKjrehvs': [ // Wo-compounds B2
    { germanWord: 'worüber', englishWord: 'about what', partOfSpeech: 'pronoun', exampleSentence: 'Worüber sprechen wir heute?', exampleTranslation: 'What are we talking about today?' },
    { germanWord: 'woran', englishWord: 'on/at what', partOfSpeech: 'pronoun', exampleSentence: 'Woran denkst du?', exampleTranslation: 'What are you thinking about?' },
    { germanWord: 'wovon', englishWord: 'of/from what', partOfSpeech: 'pronoun', exampleSentence: 'Wovon träumst du?', exampleTranslation: 'What do you dream of?' },
    { germanWord: 'womit', englishWord: 'with what', partOfSpeech: 'pronoun', exampleSentence: 'Womit kann ich Ihnen helfen?', exampleTranslation: 'How can I help you?' },
  ],
  'FZkOTfpZ91k': [ // German justice system
    { germanWord: 'Gericht', englishWord: 'court', partOfSpeech: 'noun', exampleSentence: 'Der Fall kommt vor Gericht.', exampleTranslation: 'The case goes to court.' },
    { germanWord: 'Recht', englishWord: 'law/right', partOfSpeech: 'noun', exampleSentence: 'Jeder hat das Recht auf Bildung.', exampleTranslation: 'Everyone has the right to education.' },
    { germanWord: 'Richter', englishWord: 'judge', partOfSpeech: 'noun', exampleSentence: 'Der Richter spricht das Urteil.', exampleTranslation: 'The judge delivers the verdict.' },
    { germanWord: 'Anwalt', englishWord: 'lawyer', partOfSpeech: 'noun', exampleSentence: 'Sie braucht einen Anwalt.', exampleTranslation: 'She needs a lawyer.' },
  ],
  'ICuT4TqEHsE': [ // Gravastars C1
    { germanWord: 'Schwarzes Loch', englishWord: 'black hole', partOfSpeech: 'noun', exampleSentence: 'Ein Schwarzes Loch verschlingt alles.', exampleTranslation: 'A black hole devours everything.' },
    { germanWord: 'Schwerkraft', englishWord: 'gravity', partOfSpeech: 'noun', exampleSentence: 'Die Schwerkraft hält uns auf der Erde.', exampleTranslation: 'Gravity keeps us on Earth.' },
    { germanWord: 'Oberfläche', englishWord: 'surface', partOfSpeech: 'noun', exampleSentence: 'Die Oberfläche des Planeten ist heiß.', exampleTranslation: 'The surface of the planet is hot.' },
  ],
  'Ri5RzmaCHLU': [ // Aliens C2
    { germanWord: 'Lebensform', englishWord: 'life form', partOfSpeech: 'noun', exampleSentence: 'Gibt es außerirdische Lebensformen?', exampleTranslation: 'Are there extraterrestrial life forms?' },
    { germanWord: 'Voraussetzung', englishWord: 'prerequisite', partOfSpeech: 'noun', exampleSentence: 'Wasser ist eine Voraussetzung für Leben.', exampleTranslation: 'Water is a prerequisite for life.' },
    { germanWord: 'Entwicklung', englishWord: 'development/evolution', partOfSpeech: 'noun', exampleSentence: 'Die Entwicklung des Lebens dauerte Milliarden Jahre.', exampleTranslation: 'The development of life took billions of years.' },
  ],
  'pdPtIvJr8aA': [ // Rosa Luxemburg C2
    { germanWord: 'Revolution', englishWord: 'revolution', partOfSpeech: 'noun', exampleSentence: 'Sie kämpfte für die Revolution.', exampleTranslation: 'She fought for the revolution.' },
    { germanWord: 'Gerechtigkeit', englishWord: 'justice', partOfSpeech: 'noun', exampleSentence: 'Sie glaubte an soziale Gerechtigkeit.', exampleTranslation: 'She believed in social justice.' },
    { germanWord: 'Widerstand', englishWord: 'resistance', partOfSpeech: 'noun', exampleSentence: 'Der Widerstand gegen die Regierung wuchs.', exampleTranslation: 'The resistance against the government grew.' },
    { germanWord: 'Freiheit', englishWord: 'freedom', partOfSpeech: 'noun', exampleSentence: 'Freiheit ist immer die Freiheit der Andersdenkenden.', exampleTranslation: 'Freedom is always the freedom of those who think differently.' },
  ],
};

async function main() {
  console.log('🇩🇪 Seeding German learning videos...\n');

  await prisma.videoVocab.deleteMany();
  await prisma.videoSegment.deleteMany();
  await prisma.germanVideo.deleteMany();

  let count = 0;
  for (const v of researchedVideos) {
    const id = `${v.skillLevel.toLowerCase()}-${String(count + 1).padStart(2, '0')}`;

    await prisma.germanVideo.create({
      data: {
        id,
        youtubeId: v.youtubeId,
        title: v.title,
        channel: v.channel,
        skillLevel: v.skillLevel,
        description: v.description,
        thumbnailUrl: `https://img.youtube.com/vi/${v.youtubeId}/mqdefault.jpg`,
        sortOrder: count,
      },
    });

    // Add vocab if available
    const vocab = vocabByYoutubeId[v.youtubeId];
    if (vocab) {
      for (let j = 0; j < vocab.length; j++) {
        await prisma.videoVocab.create({
          data: {
            id: `${id}-v-${j}`,
            videoId: id,
            germanWord: vocab[j].germanWord,
            englishWord: vocab[j].englishWord,
            partOfSpeech: vocab[j].partOfSpeech || null,
            exampleSentence: vocab[j].exampleSentence || null,
            exampleTranslation: vocab[j].exampleTranslation || null,
          },
        });
      }
    }

    console.log(`  ✅ ${v.skillLevel}: ${v.title}${vocab ? ` (${vocab.length} vocab)` : ''}`);
    count++;
  }

  console.log(`\n🎉 Seeded ${count} videos!`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

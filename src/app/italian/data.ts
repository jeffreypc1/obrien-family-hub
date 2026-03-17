export interface ItalianPhrase {
  id: number;
  italian: string;
  english: string;
  pronunciation: string;
  category: string;
  difficulty: 1 | 2 | 3;
}

export const CATEGORIES = [
  { id: 'greetings', label: 'Greetings & Basics', icon: '👋', color: '#22C55E' },
  { id: 'restaurant', label: 'At the Restaurant', icon: '🍝', color: '#EF4444' },
  { id: 'directions', label: 'Getting Around', icon: '🗺️', color: '#3B82F6' },
  { id: 'shopping', label: 'Shopping', icon: '🛍️', color: '#F59E0B' },
  { id: 'hotel', label: 'At the Hotel', icon: '🏨', color: '#8B5CF6' },
  { id: 'emergency', label: 'Emergency & Health', icon: '🚑', color: '#EF4444' },
  { id: 'social', label: 'Making Friends', icon: '🤝', color: '#EC4899' },
  { id: 'culture', label: 'Culture & Sightseeing', icon: '🏛️', color: '#06B6D4' },
];

export const PHRASES: ItalianPhrase[] = [
  // ==================== GREETINGS & BASICS (13) ====================
  { id: 1, italian: 'Buongiorno', english: 'Good morning / Hello (formal)', pronunciation: 'bwon-JOOR-noh', category: 'greetings', difficulty: 1 },
  { id: 2, italian: 'Buonasera', english: 'Good evening', pronunciation: 'bwon-ah-SEH-rah', category: 'greetings', difficulty: 1 },
  { id: 3, italian: 'Buonanotte', english: 'Good night', pronunciation: 'bwon-ah-NOT-teh', category: 'greetings', difficulty: 1 },
  { id: 4, italian: 'Ciao', english: 'Hi / Bye (informal)', pronunciation: 'CHOW', category: 'greetings', difficulty: 1 },
  { id: 5, italian: 'Come stai?', english: 'How are you? (informal)', pronunciation: 'KOH-meh STAH-ee', category: 'greetings', difficulty: 1 },
  { id: 6, italian: 'Sto bene, grazie', english: 'I\'m fine, thank you', pronunciation: 'stoh BEH-neh GRAH-tsee-eh', category: 'greetings', difficulty: 1 },
  { id: 7, italian: 'Per favore', english: 'Please', pronunciation: 'pair fah-VOH-reh', category: 'greetings', difficulty: 1 },
  { id: 8, italian: 'Grazie mille', english: 'Thank you very much', pronunciation: 'GRAH-tsee-eh MEEL-leh', category: 'greetings', difficulty: 1 },
  { id: 9, italian: 'Prego', english: 'You\'re welcome', pronunciation: 'PREH-goh', category: 'greetings', difficulty: 1 },
  { id: 10, italian: 'Mi scusi', english: 'Excuse me (formal)', pronunciation: 'mee SKOO-zee', category: 'greetings', difficulty: 1 },
  { id: 11, italian: 'Mi dispiace', english: 'I\'m sorry', pronunciation: 'mee dee-SPYAH-cheh', category: 'greetings', difficulty: 1 },
  { id: 12, italian: 'Sì / No', english: 'Yes / No', pronunciation: 'see / noh', category: 'greetings', difficulty: 1 },
  { id: 13, italian: 'Non capisco', english: 'I don\'t understand', pronunciation: 'non kah-PEE-skoh', category: 'greetings', difficulty: 1 },

  // ==================== AT THE RESTAURANT (13) ====================
  { id: 14, italian: 'Un tavolo per due, per favore', english: 'A table for two, please', pronunciation: 'oon TAH-voh-loh pair DOO-eh pair fah-VOH-reh', category: 'restaurant', difficulty: 2 },
  { id: 15, italian: 'Il menù, per favore', english: 'The menu, please', pronunciation: 'eel meh-NOO pair fah-VOH-reh', category: 'restaurant', difficulty: 1 },
  { id: 16, italian: 'Vorrei ordinare', english: 'I would like to order', pronunciation: 'vor-RAY or-dee-NAH-reh', category: 'restaurant', difficulty: 2 },
  { id: 17, italian: 'Cosa mi consiglia?', english: 'What do you recommend?', pronunciation: 'KOH-zah mee kon-SEEL-yah', category: 'restaurant', difficulty: 2 },
  { id: 18, italian: 'Sono allergico/a a...', english: 'I am allergic to...', pronunciation: 'SOH-noh ah-LAIR-jee-koh ah', category: 'restaurant', difficulty: 2 },
  { id: 19, italian: 'Il conto, per favore', english: 'The check, please', pronunciation: 'eel KON-toh pair fah-VOH-reh', category: 'restaurant', difficulty: 1 },
  { id: 20, italian: 'Era squisito!', english: 'It was delicious!', pronunciation: 'EH-rah skwee-ZEE-toh', category: 'restaurant', difficulty: 2 },
  { id: 21, italian: 'Un bicchiere di vino rosso', english: 'A glass of red wine', pronunciation: 'oon bee-KYEH-reh dee VEE-noh ROHS-soh', category: 'restaurant', difficulty: 2 },
  { id: 22, italian: 'Acqua naturale / frizzante', english: 'Still / Sparkling water', pronunciation: 'AH-kwah nah-too-RAH-leh / free-TSAHN-teh', category: 'restaurant', difficulty: 2 },
  { id: 23, italian: 'Posso avere il conto?', english: 'Can I have the bill?', pronunciation: 'POHS-soh ah-VEH-reh eel KON-toh', category: 'restaurant', difficulty: 2 },
  { id: 24, italian: 'Un caffè, per favore', english: 'A coffee, please', pronunciation: 'oon kah-FEH pair fah-VOH-reh', category: 'restaurant', difficulty: 1 },
  { id: 25, italian: 'Vorrei un gelato', english: 'I would like an ice cream', pronunciation: 'vor-RAY oon jeh-LAH-toh', category: 'restaurant', difficulty: 1 },
  { id: 26, italian: 'Dov\'è il bagno?', english: 'Where is the bathroom?', pronunciation: 'doh-VEH eel BAHN-yoh', category: 'restaurant', difficulty: 1 },

  // ==================== GETTING AROUND (13) ====================
  { id: 27, italian: 'Dov\'è la stazione?', english: 'Where is the station?', pronunciation: 'doh-VEH lah stah-tsee-OH-neh', category: 'directions', difficulty: 1 },
  { id: 28, italian: 'Come arrivo a...?', english: 'How do I get to...?', pronunciation: 'KOH-meh ah-REE-voh ah', category: 'directions', difficulty: 2 },
  { id: 29, italian: 'A destra / A sinistra', english: 'To the right / To the left', pronunciation: 'ah DEH-strah / ah see-NEE-strah', category: 'directions', difficulty: 1 },
  { id: 30, italian: 'Sempre dritto', english: 'Straight ahead', pronunciation: 'SEM-preh DREET-toh', category: 'directions', difficulty: 1 },
  { id: 31, italian: 'È lontano da qui?', english: 'Is it far from here?', pronunciation: 'eh lon-TAH-noh dah kwee', category: 'directions', difficulty: 2 },
  { id: 32, italian: 'Un biglietto di andata e ritorno', english: 'A round-trip ticket', pronunciation: 'oon beel-YET-toh dee ahn-DAH-tah eh ree-TOR-noh', category: 'directions', difficulty: 3 },
  { id: 33, italian: 'A che ora parte il treno?', english: 'What time does the train leave?', pronunciation: 'ah keh OH-rah PAR-teh eel TREH-noh', category: 'directions', difficulty: 2 },
  { id: 34, italian: 'Quanto costa il biglietto?', english: 'How much is the ticket?', pronunciation: 'KWAHN-toh KOH-stah eel beel-YET-toh', category: 'directions', difficulty: 2 },
  { id: 35, italian: 'Mi sono perso/a', english: 'I am lost', pronunciation: 'mee SOH-noh PAIR-soh', category: 'directions', difficulty: 1 },
  { id: 36, italian: 'Può indicarmi sulla mappa?', english: 'Can you show me on the map?', pronunciation: 'pwoh in-dee-KAR-mee SOO-lah MAHP-pah', category: 'directions', difficulty: 3 },
  { id: 37, italian: 'Vorrei noleggiare una macchina', english: 'I would like to rent a car', pronunciation: 'vor-RAY noh-lej-JAH-reh OO-nah MAH-kee-nah', category: 'directions', difficulty: 3 },
  { id: 38, italian: 'Dov\'è la fermata dell\'autobus?', english: 'Where is the bus stop?', pronunciation: 'doh-VEH lah fair-MAH-tah dell-OW-toh-boos', category: 'directions', difficulty: 2 },
  { id: 39, italian: 'Quanto tempo ci vuole?', english: 'How long does it take?', pronunciation: 'KWAHN-toh TEM-poh chee VWOH-leh', category: 'directions', difficulty: 2 },

  // ==================== SHOPPING (12) ====================
  { id: 40, italian: 'Quanto costa?', english: 'How much does it cost?', pronunciation: 'KWAHN-toh KOH-stah', category: 'shopping', difficulty: 1 },
  { id: 41, italian: 'Posso provarlo?', english: 'Can I try it on?', pronunciation: 'POHS-soh proh-VAR-loh', category: 'shopping', difficulty: 2 },
  { id: 42, italian: 'È troppo caro', english: 'It\'s too expensive', pronunciation: 'eh TROHP-poh KAH-roh', category: 'shopping', difficulty: 1 },
  { id: 43, italian: 'Avete una taglia più piccola?', english: 'Do you have a smaller size?', pronunciation: 'ah-VEH-teh OO-nah TAHL-yah pyoo pee-KOH-lah', category: 'shopping', difficulty: 3 },
  { id: 44, italian: 'Accettate carte di credito?', english: 'Do you accept credit cards?', pronunciation: 'ah-chet-TAH-teh KAR-teh dee KREH-dee-toh', category: 'shopping', difficulty: 2 },
  { id: 45, italian: 'Sto solo guardando', english: 'I\'m just looking', pronunciation: 'stoh SOH-loh gwar-DAHN-doh', category: 'shopping', difficulty: 2 },
  { id: 46, italian: 'Mi piace questo', english: 'I like this one', pronunciation: 'mee PYAH-cheh KWEH-stoh', category: 'shopping', difficulty: 1 },
  { id: 47, italian: 'Lo prendo', english: 'I\'ll take it', pronunciation: 'loh PREN-doh', category: 'shopping', difficulty: 1 },
  { id: 48, italian: 'C\'è uno sconto?', english: 'Is there a discount?', pronunciation: 'cheh OO-noh SKON-toh', category: 'shopping', difficulty: 2 },
  { id: 49, italian: 'Dov\'è il mercato?', english: 'Where is the market?', pronunciation: 'doh-VEH eel mair-KAH-toh', category: 'shopping', difficulty: 1 },
  { id: 50, italian: 'Posso avere una borsa?', english: 'Can I have a bag?', pronunciation: 'POHS-soh ah-VEH-reh OO-nah BOR-sah', category: 'shopping', difficulty: 2 },
  { id: 51, italian: 'A che ora aprite / chiudete?', english: 'What time do you open / close?', pronunciation: 'ah keh OH-rah ah-PREE-teh / kyoo-DEH-teh', category: 'shopping', difficulty: 2 },

  // ==================== AT THE HOTEL (12) ====================
  { id: 52, italian: 'Ho una prenotazione', english: 'I have a reservation', pronunciation: 'oh OO-nah preh-noh-tah-tsee-OH-neh', category: 'hotel', difficulty: 2 },
  { id: 53, italian: 'Una camera doppia, per favore', english: 'A double room, please', pronunciation: 'OO-nah KAH-meh-rah DOP-pyah pair fah-VOH-reh', category: 'hotel', difficulty: 2 },
  { id: 54, italian: 'Per quante notti?', english: 'For how many nights?', pronunciation: 'pair KWAHN-teh NOT-tee', category: 'hotel', difficulty: 2 },
  { id: 55, italian: 'La colazione è inclusa?', english: 'Is breakfast included?', pronunciation: 'lah koh-lah-tsee-OH-neh eh in-KLOO-zah', category: 'hotel', difficulty: 2 },
  { id: 56, italian: 'A che ora è il check-out?', english: 'What time is check-out?', pronunciation: 'ah keh OH-rah eh eel check-out', category: 'hotel', difficulty: 2 },
  { id: 57, italian: 'C\'è il Wi-Fi?', english: 'Is there Wi-Fi?', pronunciation: 'cheh eel wee-fee', category: 'hotel', difficulty: 1 },
  { id: 58, italian: 'La chiave della camera', english: 'The room key', pronunciation: 'lah KYAH-veh DEL-lah KAH-meh-rah', category: 'hotel', difficulty: 2 },
  { id: 59, italian: 'Può chiamare un taxi?', english: 'Can you call a taxi?', pronunciation: 'pwoh kyah-MAH-reh oon TAK-see', category: 'hotel', difficulty: 2 },
  { id: 60, italian: 'C\'è una cassaforte?', english: 'Is there a safe?', pronunciation: 'cheh OO-nah kahs-sah-FOR-teh', category: 'hotel', difficulty: 2 },
  { id: 61, italian: 'L\'aria condizionata non funziona', english: 'The air conditioning doesn\'t work', pronunciation: 'LAH-ree-ah kon-dee-tsee-oh-NAH-tah non foon-TSEE-oh-nah', category: 'hotel', difficulty: 3 },
  { id: 62, italian: 'Vorrei cambiare camera', english: 'I would like to change rooms', pronunciation: 'vor-RAY kahm-BYAH-reh KAH-meh-rah', category: 'hotel', difficulty: 2 },
  { id: 63, italian: 'Avete camere disponibili?', english: 'Do you have available rooms?', pronunciation: 'ah-VEH-teh KAH-meh-reh dee-spoh-NEE-bee-lee', category: 'hotel', difficulty: 3 },

  // ==================== EMERGENCY & HEALTH (12) ====================
  { id: 64, italian: 'Aiuto!', english: 'Help!', pronunciation: 'ah-YOO-toh', category: 'emergency', difficulty: 1 },
  { id: 65, italian: 'Chiamate la polizia!', english: 'Call the police!', pronunciation: 'kyah-MAH-teh lah poh-lee-TSEE-ah', category: 'emergency', difficulty: 2 },
  { id: 66, italian: 'Ho bisogno di un medico', english: 'I need a doctor', pronunciation: 'oh bee-ZOHN-yoh dee oon MEH-dee-koh', category: 'emergency', difficulty: 2 },
  { id: 67, italian: 'Dov\'è l\'ospedale più vicino?', english: 'Where is the nearest hospital?', pronunciation: 'doh-VEH los-peh-DAH-leh pyoo vee-CHEE-noh', category: 'emergency', difficulty: 3 },
  { id: 68, italian: 'Mi fa male qui', english: 'It hurts here', pronunciation: 'mee fah MAH-leh kwee', category: 'emergency', difficulty: 1 },
  { id: 69, italian: 'Ho perso il passaporto', english: 'I lost my passport', pronunciation: 'oh PAIR-soh eel pahs-sah-POR-toh', category: 'emergency', difficulty: 2 },
  { id: 70, italian: 'Dov\'è la farmacia?', english: 'Where is the pharmacy?', pronunciation: 'doh-VEH lah far-mah-CHEE-ah', category: 'emergency', difficulty: 1 },
  { id: 71, italian: 'Non mi sento bene', english: 'I don\'t feel well', pronunciation: 'non mee SEN-toh BEH-neh', category: 'emergency', difficulty: 1 },
  { id: 72, italian: 'Ho bisogno di un\'ambulanza', english: 'I need an ambulance', pronunciation: 'oh bee-ZOHN-yoh dee oon ahm-boo-LAHN-tsah', category: 'emergency', difficulty: 2 },
  { id: 73, italian: 'Sono stato/a derubato/a', english: 'I have been robbed', pronunciation: 'SOH-noh STAH-toh deh-roo-BAH-toh', category: 'emergency', difficulty: 3 },
  { id: 74, italian: 'C\'è un\'emergenza', english: 'There is an emergency', pronunciation: 'cheh oon eh-mair-JEN-tsah', category: 'emergency', difficulty: 2 },
  { id: 75, italian: 'Ho la febbre', english: 'I have a fever', pronunciation: 'oh lah FEB-breh', category: 'emergency', difficulty: 1 },

  // ==================== MAKING FRIENDS (13) ====================
  { id: 76, italian: 'Come ti chiami?', english: 'What is your name?', pronunciation: 'KOH-meh tee KYAH-mee', category: 'social', difficulty: 1 },
  { id: 77, italian: 'Mi chiamo...', english: 'My name is...', pronunciation: 'mee KYAH-moh', category: 'social', difficulty: 1 },
  { id: 78, italian: 'Piacere di conoscerti', english: 'Nice to meet you', pronunciation: 'pyah-CHEH-reh dee koh-NOH-shair-tee', category: 'social', difficulty: 2 },
  { id: 79, italian: 'Di dove sei?', english: 'Where are you from?', pronunciation: 'dee DOH-veh say', category: 'social', difficulty: 1 },
  { id: 80, italian: 'Sono americano/a', english: 'I am American', pronunciation: 'SOH-noh ah-meh-ree-KAH-noh', category: 'social', difficulty: 1 },
  { id: 81, italian: 'Parli inglese?', english: 'Do you speak English?', pronunciation: 'PAR-lee in-GLEH-zeh', category: 'social', difficulty: 1 },
  { id: 82, italian: 'Parlo un po\' di italiano', english: 'I speak a little Italian', pronunciation: 'PAR-loh oon poh dee ee-tah-LYAH-noh', category: 'social', difficulty: 2 },
  { id: 83, italian: 'Questa è la mia famiglia', english: 'This is my family', pronunciation: 'KWEH-stah eh lah MEE-ah fah-MEEL-yah', category: 'social', difficulty: 2 },
  { id: 84, italian: 'Ci vediamo domani', english: 'See you tomorrow', pronunciation: 'chee veh-DYAH-moh doh-MAH-nee', category: 'social', difficulty: 2 },
  { id: 85, italian: 'È stato un piacere', english: 'It was a pleasure', pronunciation: 'eh STAH-toh oon pyah-CHEH-reh', category: 'social', difficulty: 2 },
  { id: 86, italian: 'Possiamo fare una foto?', english: 'Can we take a photo?', pronunciation: 'pohs-SYAH-moh FAH-reh OO-nah FOH-toh', category: 'social', difficulty: 2 },
  { id: 87, italian: 'Buon viaggio!', english: 'Have a good trip!', pronunciation: 'bwon vee-AH-joh', category: 'social', difficulty: 1 },
  { id: 88, italian: 'In bocca al lupo!', english: 'Good luck! (lit. In the mouth of the wolf)', pronunciation: 'in BOH-kah ahl LOO-poh', category: 'social', difficulty: 2 },

  // ==================== CULTURE & SIGHTSEEING (12) ====================
  { id: 89, italian: 'Quanto costa l\'ingresso?', english: 'How much is the entrance fee?', pronunciation: 'KWAHN-toh KOH-stah lin-GRES-soh', category: 'culture', difficulty: 2 },
  { id: 90, italian: 'A che ora apre il museo?', english: 'What time does the museum open?', pronunciation: 'ah keh OH-rah AH-preh eel moo-ZEH-oh', category: 'culture', difficulty: 2 },
  { id: 91, italian: 'C\'è una visita guidata?', english: 'Is there a guided tour?', pronunciation: 'cheh OO-nah VEE-zee-tah gwee-DAH-tah', category: 'culture', difficulty: 2 },
  { id: 92, italian: 'Che bella vista!', english: 'What a beautiful view!', pronunciation: 'keh BEL-lah VEE-stah', category: 'culture', difficulty: 1 },
  { id: 93, italian: 'Posso fare una foto qui?', english: 'Can I take a photo here?', pronunciation: 'POHS-soh FAH-reh OO-nah FOH-toh kwee', category: 'culture', difficulty: 2 },
  { id: 94, italian: 'Mi piace molto l\'Italia', english: 'I really like Italy', pronunciation: 'mee PYAH-cheh MOL-toh lee-TAH-lyah', category: 'culture', difficulty: 1 },
  { id: 95, italian: 'Questa chiesa è magnifica', english: 'This church is magnificent', pronunciation: 'KWEH-stah KYEH-zah eh mahn-YEE-fee-kah', category: 'culture', difficulty: 2 },
  { id: 96, italian: 'Dov\'è il centro storico?', english: 'Where is the historic center?', pronunciation: 'doh-VEH eel CHEN-troh STOH-ree-koh', category: 'culture', difficulty: 2 },
  { id: 97, italian: 'Vorrei visitare...', english: 'I would like to visit...', pronunciation: 'vor-RAY vee-zee-TAH-reh', category: 'culture', difficulty: 2 },
  { id: 98, italian: 'È un patrimonio dell\'UNESCO', english: 'It is a UNESCO heritage site', pronunciation: 'eh oon pah-tree-MOH-nyoh dell oo-NEH-skoh', category: 'culture', difficulty: 3 },
  { id: 99, italian: 'Che meraviglia!', english: 'How wonderful!', pronunciation: 'keh meh-rah-VEEL-yah', category: 'culture', difficulty: 1 },
  { id: 100, italian: 'La dolce vita', english: 'The sweet life', pronunciation: 'lah DOHL-cheh VEE-tah', category: 'culture', difficulty: 1 },
];

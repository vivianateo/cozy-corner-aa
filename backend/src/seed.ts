import { createApplication } from "@specific-dev/framework";
import { eq } from 'drizzle-orm';
import * as schema from './db/schema/schema.js';

const app = await createApplication(schema);

const places: Array<{
  name: string;
  category: 'ristoranti' | 'parchi' | 'musei' | 'caffè' | 'hotel' | 'altro';
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  imageUrl: string;
  amenities: string[];
}> = [
  {
    name: "Ristorante La Famiglia",
    category: "ristoranti",
    description: "Un accogliente ristorante a conduzione familiare con seggioloni e menu per bambini. Cucina tradizionale milanese in un ambiente rilassato.",
    address: "Via Torino 12, Milano",
    latitude: 45.4654,
    longitude: 9.1859,
    imageUrl: "https://picsum.photos/seed/place1/800/600",
    amenities: ["seggiolone", "menu_bimbi", "fasciatoio"],
  },
  {
    name: "Parco Sempione",
    category: "parchi",
    description: "Il polmone verde di Milano con ampi spazi per giocare, aree picnic e un laghetto. Perfetto per famiglie con bambini piccoli.",
    address: "Viale Alemagna 6, Milano",
    latitude: 45.4719,
    longitude: 9.1765,
    imageUrl: "https://picsum.photos/seed/place2/800/600",
    amenities: ["luogo_gioco", "fasciatoio"],
  },
  {
    name: "Museo dei Bambini Roma",
    category: "musei",
    description: "Museo interattivo dedicato ai bambini dai 3 anni in su. Laboratori creativi, spazi gioco e mostre educative.",
    address: "Via Flaminia 82, Roma",
    latitude: 41.9109,
    longitude: 12.4818,
    imageUrl: "https://picsum.photos/seed/place3/800/600",
    amenities: ["fasciatoio", "luogo_gioco"],
  },
  {
    name: "Caffè Nuvola",
    category: "caffè",
    description: "Caffetteria accogliente con angolo allattamento riservato, fasciatoio e seggioloni. Ottimi dolci artigianali.",
    address: "Via dei Condotti 15, Roma",
    latitude: 41.9058,
    longitude: 12.4797,
    imageUrl: "https://picsum.photos/seed/place4/800/600",
    amenities: ["seggiolone", "fasciatoio"],
  },
  {
    name: "Hotel Bimbi Felici",
    category: "hotel",
    description: "Hotel a misura di famiglia con piscina, baby club, lettini e kit di benvenuto per i più piccoli.",
    address: "Lungarno Corsini 4, Firenze",
    latitude: 43.7687,
    longitude: 11.2488,
    imageUrl: "https://picsum.photos/seed/place5/800/600",
    amenities: ["seggiolone", "menu_bimbi", "fasciatoio", "luogo_gioco"],
  },
  {
    name: "Trattoria Mamma Rosa",
    category: "ristoranti",
    description: "Trattoria napoletana autentica con pizza a legna e pasta fresca. Seggioloni disponibili e personale gentilissimo con i bambini.",
    address: "Via dei Tribunali 47, Napoli",
    latitude: 40.8518,
    longitude: 14.2681,
    imageUrl: "https://picsum.photos/seed/place6/800/600",
    amenities: ["seggiolone", "menu_bimbi", "fasciatoio"],
  },
  {
    name: "Giardini Reali",
    category: "parchi",
    description: "Splendidi giardini storici nel cuore di Torino con fontane, prati e aree gioco attrezzate per bambini.",
    address: "Piazza Castello, Torino",
    latitude: 45.0703,
    longitude: 7.6869,
    imageUrl: "https://picsum.photos/seed/place7/800/600",
    amenities: ["luogo_gioco", "fasciatoio"],
  },
  {
    name: "Museo della Scienza e della Tecnologia",
    category: "musei",
    description: "Il più grande museo scientifico d'Italia con sezioni interattive per bambini, laboratori e sottomarino visitabile.",
    address: "Via San Vittore 21, Milano",
    latitude: 45.4625,
    longitude: 9.1706,
    imageUrl: "https://picsum.photos/seed/place8/800/600",
    amenities: ["fasciatoio", "luogo_gioco"],
  },
  {
    name: "Caffè Letterario Piccolo",
    category: "caffè",
    description: "Caffè tranquillo con libreria per bambini, tappeto giochi e fasciatoio. Ideale per mamme e papà che vogliono rilassarsi.",
    address: "Via Indipendenza 8, Bologna",
    latitude: 44.4949,
    longitude: 11.3426,
    imageUrl: "https://picsum.photos/seed/place9/800/600",
    amenities: ["seggiolone", "fasciatoio"],
  },
  {
    name: "Hotel Villa Toscana",
    category: "hotel",
    description: "Elegante villa toscana con giardino privato, piscina riscaldata e servizio babysitter su richiesta.",
    address: "Via Bolognese 120, Firenze",
    latitude: 43.7896,
    longitude: 11.2658,
    imageUrl: "https://picsum.photos/seed/place10/800/600",
    amenities: ["seggiolone", "menu_bimbi", "fasciatoio", "luogo_gioco"],
  },
  {
    name: "Osteria del Porto",
    category: "ristoranti",
    description: "Osteria sul porto con pesce freschissimo e menu bambini. Seggioloni, fasciatoio e personale attento alle famiglie.",
    address: "Via Marina 5, Napoli",
    latitude: 40.8400,
    longitude: 14.2587,
    imageUrl: "https://picsum.photos/seed/place11/800/600",
    amenities: ["seggiolone", "menu_bimbi", "fasciatoio"],
  },
  {
    name: "Parco della Montagnola",
    category: "parchi",
    description: "Parco urbano con scivoli, altalene e area picnic ombreggiata. Molto frequentato dalle famiglie bolognesi.",
    address: "Via Irnerio, Bologna",
    latitude: 44.5013,
    longitude: 11.3394,
    imageUrl: "https://picsum.photos/seed/place12/800/600",
    amenities: ["luogo_gioco", "fasciatoio"],
  },
  {
    name: "Galleria degli Uffizi Family",
    category: "musei",
    description: "Percorso speciale per famiglie con bambini agli Uffizi. Audioguide dedicate e laboratori artistici nel weekend.",
    address: "Piazzale degli Uffizi 6, Firenze",
    latitude: 43.7677,
    longitude: 11.2553,
    imageUrl: "https://picsum.photos/seed/place13/800/600",
    amenities: ["fasciatoio", "luogo_gioco"],
  },
  {
    name: "Bar Pasticceria Dolce Vita",
    category: "caffè",
    description: "Storica pasticceria torinese con tavolini spaziosi, seggioloni e una vasta scelta di dolci e cioccolatini artigianali.",
    address: "Via Roma 34, Torino",
    latitude: 45.0677,
    longitude: 7.6825,
    imageUrl: "https://picsum.photos/seed/place14/800/600",
    amenities: ["seggiolone", "fasciatoio"],
  },
  {
    name: "Agriturismo Le Colline",
    category: "altro",
    description: "Agriturismo a conduzione familiare con animali da fattoria, orto didattico e laboratori per bambini. Un'esperienza unica nella natura.",
    address: "Strada Provinciale 12, Siena",
    latitude: 43.3188,
    longitude: 11.3307,
    imageUrl: "https://picsum.photos/seed/place15/800/600",
    amenities: ["seggiolone"],
  },
];

const reviews = [
  {
    placeIndex: 0,
    authorName: "Giulia Ferretti",
    rating: 5,
    comment: "Posto meraviglioso! Il personale è stato gentilissimo con la nostra bimba di 18 mesi. Seggiolone comodo e menu per bambini ottimo.",
  },
  {
    placeIndex: 0,
    authorName: "Marco Bianchi",
    rating: 4,
    comment: "Ottima cucina tradizionale. Ci siamo sentiti benvenuti con il nostro bambino piccolo. Torneremo sicuramente!",
  },
  {
    placeIndex: 0,
    authorName: "Sara Conti",
    rating: 5,
    comment: "Finalmente un ristorante dove si può mangiare in pace anche con i bambini. Complimenti alla famiglia che lo gestisce.",
  },
  {
    placeIndex: 1,
    authorName: "Luca Rossi",
    rating: 5,
    comment: "Parco bellissimo e ben tenuto. I miei figli hanno giocato per ore. Perfetto per una giornata in famiglia.",
  },
  {
    placeIndex: 1,
    authorName: "Valentina Marino",
    rating: 4,
    comment: "Spazio verde enorme nel centro di Milano. Le aree gioco sono sicure e ben attrezzate. Consigliato!",
  },
  {
    placeIndex: 2,
    authorName: "Federica Esposito",
    rating: 5,
    comment: "I bambini si sono divertiti tantissimo! Laboratori creativi stupendi e personale molto preparato.",
  },
  {
    placeIndex: 2,
    authorName: "Antonio De Luca",
    rating: 4,
    comment: "Museo interattivo davvero ben fatto. Mia figlia di 4 anni non voleva andarsene. Prezzi ragionevoli.",
  },
  {
    placeIndex: 2,
    authorName: "Chiara Lombardi",
    rating: 5,
    comment: "Esperienza fantastica! Ogni angolo è pensato per i bambini. Lo consiglio a tutte le famiglie in visita a Roma.",
  },
  {
    placeIndex: 3,
    authorName: "Elena Ricci",
    rating: 5,
    comment: "Finalmente un caffè con angolo allattamento vero! Personale discreto e accogliente. I dolci sono deliziosi.",
  },
  {
    placeIndex: 3,
    authorName: "Roberto Gallo",
    rating: 4,
    comment: "Ottimo posto per una pausa con neonati. Fasciatoio pulito e spazioso. Caffè eccellente.",
  },
  {
    placeIndex: 4,
    authorName: "Paola Moretti",
    rating: 5,
    comment: "Hotel perfetto per famiglie! Il baby club ha intrattenuto i nostri figli tutto il giorno. Torneremo l'anno prossimo.",
  },
  {
    placeIndex: 4,
    authorName: "Stefano Barbieri",
    rating: 5,
    comment: "Servizio impeccabile. Lettino per il bambino già pronto all'arrivo, kit di benvenuto adorabile. Personale fantastico.",
  },
  {
    placeIndex: 4,
    authorName: "Marta Colombo",
    rating: 4,
    comment: "Struttura bellissima e molto family friendly. Piscina sicura per i bambini. Unico neo: un po' caro.",
  },
  {
    placeIndex: 5,
    authorName: "Carmela Russo",
    rating: 5,
    comment: "La migliore pizza di Napoli! E con i bambini ci si sente davvero a casa. Porzioni abbondanti e prezzi onesti.",
  },
  {
    placeIndex: 5,
    authorName: "Giovanni Esposito",
    rating: 4,
    comment: "Trattoria autentica napoletana. Il personale ha portato subito il seggiolone senza che lo chiedessimo. Ottimo!",
  },
  {
    placeIndex: 6,
    authorName: "Alessia Fontana",
    rating: 4,
    comment: "Giardini curati e bellissimi. Le fontane incantano i bambini. Ottimo per una passeggiata domenicale.",
  },
  {
    placeIndex: 6,
    authorName: "Davide Ferrari",
    rating: 5,
    comment: "Posto magico nel cuore di Torino. I bambini adorano le aree gioco. Ci veniamo ogni weekend.",
  },
  {
    placeIndex: 7,
    authorName: "Francesca Vitale",
    rating: 5,
    comment: "Museo straordinario! Mio figlio di 6 anni era estasiato. Le sezioni interattive sono fantastiche.",
  },
  {
    placeIndex: 7,
    authorName: "Matteo Greco",
    rating: 4,
    comment: "Imperdibile per le famiglie a Milano. Il sottomarino è spettacolare. Consiglio di prenotare in anticipo.",
  },
  {
    placeIndex: 7,
    authorName: "Laura Martini",
    rating: 5,
    comment: "Abbiamo passato un'intera giornata qui e non abbiamo visto tutto. Perfetto per bambini curiosi.",
  },
  {
    placeIndex: 8,
    authorName: "Silvia Negri",
    rating: 5,
    comment: "Posto incantevole! Il tappeto giochi ha tenuto occupata mia figlia mentre io leggevo. Caffè ottimo.",
  },
  {
    placeIndex: 8,
    authorName: "Andrea Pellegrini",
    rating: 4,
    comment: "Atmosfera rilassata e accogliente. Libreria per bambini ben fornita. Torneremo sicuramente.",
  },
  {
    placeIndex: 9,
    authorName: "Monica Caruso",
    rating: 5,
    comment: "Villa meravigliosa immersa nel verde. Il servizio babysitter ci ha permesso di cenare in pace. Indimenticabile.",
  },
  {
    placeIndex: 9,
    authorName: "Fabio Santoro",
    rating: 4,
    comment: "Hotel di lusso ma davvero family friendly. Piscina riscaldata perfetta anche per i più piccoli.",
  },
  {
    placeIndex: 10,
    authorName: "Rosa Ferrara",
    rating: 4,
    comment: "Pesce freschissimo e ottimo menu bambini. Vista sul porto bellissima. Personale molto disponibile.",
  },
  {
    placeIndex: 10,
    authorName: "Vincenzo Amato",
    rating: 5,
    comment: "La migliore frittura di paranza di Napoli! E con i bambini ci si trova benissimo. Posto autentico.",
  },
  {
    placeIndex: 11,
    authorName: "Beatrice Fabbri",
    rating: 4,
    comment: "Parco verde e ben tenuto. Le altalene e gli scivoli sono sicuri. Ottimo per i bambini piccoli.",
  },
  {
    placeIndex: 11,
    authorName: "Simone Cattaneo",
    rating: 5,
    comment: "Il parco preferito dei miei figli a Bologna. Area picnic ombreggiata perfetta d'estate.",
  },
  {
    placeIndex: 12,
    authorName: "Irene Mancini",
    rating: 5,
    comment: "Percorso famiglia stupendo! Le audioguide per bambini sono coinvolgenti. Mia figlia ha imparato tantissimo.",
  },
  {
    placeIndex: 12,
    authorName: "Claudio Rinaldi",
    rating: 4,
    comment: "Ottima iniziativa per avvicinare i bambini all'arte. I laboratori del weekend sono fantastici.",
  },
  {
    placeIndex: 12,
    authorName: "Nadia Sorrentino",
    rating: 5,
    comment: "Esperienza culturale meravigliosa per tutta la famiglia. Personale preparato e paziente con i bambini.",
  },
  {
    placeIndex: 13,
    authorName: "Teresa Galli",
    rating: 5,
    comment: "Pasticceria storica con dolci eccezionali. I bambini adorano i cioccolatini artigianali. Seggioloni comodi.",
  },
  {
    placeIndex: 13,
    authorName: "Enrico Bassi",
    rating: 4,
    comment: "Ambiente elegante ma accogliente per le famiglie. Ottima colazione. Prezzi nella norma per Torino.",
  },
  {
    placeIndex: 14,
    authorName: "Giovanna Serra",
    rating: 5,
    comment: "Esperienza indimenticabile! I bambini hanno adorato gli animali della fattoria. Cibo genuino e ottimo.",
  },
  {
    placeIndex: 14,
    authorName: "Massimo Conti",
    rating: 5,
    comment: "Agriturismo fantastico. L'orto didattico ha entusiasmato i miei figli. Torneremo ogni estate.",
  },
  {
    placeIndex: 14,
    authorName: "Patrizia Longo",
    rating: 4,
    comment: "Posto autentico e rilassante. I laboratori per bambini sono creativi e divertenti. Consigliato!",
  },
];

try {
  app.logger.info("Starting database seed...");

  // Insert places
  const insertedPlaces = await app.db.insert(schema.places).values(places).returning();
  app.logger.info({ count: insertedPlaces.length }, "Places inserted");

  // Insert reviews and calculate ratings
  const placeReviewCounts: Record<string, { sum: number; count: number }> = {};

  for (const review of reviews) {
    const placeId = insertedPlaces[review.placeIndex].id;
    await app.db.insert(schema.reviews).values({
      placeId,
      authorName: review.authorName,
      rating: review.rating,
      comment: review.comment,
    });

    if (!placeReviewCounts[placeId]) {
      placeReviewCounts[placeId] = { sum: 0, count: 0 };
    }
    placeReviewCounts[placeId].sum += review.rating;
    placeReviewCounts[placeId].count += 1;
  }

  app.logger.info({ count: reviews.length }, "Reviews inserted");

  // Update place ratings
  for (const placeId in placeReviewCounts) {
    const { sum, count } = placeReviewCounts[placeId];
    const avgRating = sum / count;

    await app.db
      .update(schema.places)
      .set({
        avgRating,
        reviewCount: count,
      })
      .where(eq(schema.places.id, placeId));
  }

  app.logger.info("Database seed completed successfully");
  process.exit(0);
} catch (error) {
  app.logger.error({ err: error }, "Database seed failed");
  process.exit(1);
}

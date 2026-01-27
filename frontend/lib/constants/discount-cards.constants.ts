// ============================================================
// PASSENGER DISCOUNT CARDS CONSTANTS
// ============================================================

export interface DiscountCard {
  code: string;
  name: string;
  country: string;
  carrier?: string;
  discountPercent?: number;
  description: string;
  ageRestriction?: { min?: number; max?: number };
  requiresNumber: boolean;
}

// Avrupa'daki popüler indirim kartları
export const DISCOUNT_CARDS: DiscountCard[] = [
  // === ALMANYA (Deutsche Bahn) ===
  {
    code: 'BAHNCARD25',
    name: 'BahnCard 25',
    country: 'DE',
    carrier: 'DBAHN',
    discountPercent: 25,
    description: '%25 indirim (Almanya)',
    requiresNumber: true,
  },
  {
    code: 'BAHNCARD50',
    name: 'BahnCard 50',
    country: 'DE',
    carrier: 'DBAHN',
    discountPercent: 50,
    description: '%50 indirim (Almanya)',
    requiresNumber: true,
  },
  {
    code: 'BAHNCARD100',
    name: 'BahnCard 100',
    country: 'DE',
    carrier: 'DBAHN',
    discountPercent: 100,
    description: 'Sınırsız seyahat (Almanya)',
    requiresNumber: true,
  },

  // === FRANSA (SNCF) ===
  {
    code: 'CARTE_AVANTAGE',
    name: 'Carte Avantage',
    country: 'FR',
    carrier: 'SNCF',
    discountPercent: 30,
    description: '%30 indirim (Fransa)',
    requiresNumber: true,
  },
  {
    code: 'CARTE_JEUNE',
    name: 'Carte Jeune',
    country: 'FR',
    carrier: 'SNCF',
    discountPercent: 30,
    description: '12-27 yaş arası (Fransa)',
    ageRestriction: { min: 12, max: 27 },
    requiresNumber: true,
  },
  {
    code: 'CARTE_SENIOR',
    name: 'Carte Senior+',
    country: 'FR',
    carrier: 'SNCF',
    discountPercent: 30,
    description: '60 yaş üstü (Fransa)',
    ageRestriction: { min: 60 },
    requiresNumber: true,
  },
  {
    code: 'CARTE_WEEKEND',
    name: 'Carte Weekend',
    country: 'FR',
    carrier: 'SNCF',
    discountPercent: 25,
    description: 'Hafta sonu indirimi (Fransa)',
    requiresNumber: true,
  },

  // === İTALYA (Trenitalia) ===
  {
    code: 'CARTAFRECCIA',
    name: 'CartaFRECCIA',
    country: 'IT',
    carrier: 'TRENITALIA',
    description: 'Puan toplama ve indirimler (İtalya)',
    requiresNumber: true,
  },
  {
    code: 'CARTAFRECCIA_YOUNG',
    name: 'CartaFRECCIA Young',
    country: 'IT',
    carrier: 'TRENITALIA',
    discountPercent: 30,
    description: '12-26 yaş arası (İtalya)',
    ageRestriction: { min: 12, max: 26 },
    requiresNumber: true,
  },
  {
    code: 'CARTAFRECCIA_SENIOR',
    name: 'CartaFRECCIA Senior',
    country: 'IT',
    carrier: 'TRENITALIA',
    discountPercent: 30,
    description: '60 yaş üstü (İtalya)',
    ageRestriction: { min: 60 },
    requiresNumber: true,
  },

  // === İSVİÇRE (SBB) ===
  {
    code: 'HALBTAX',
    name: 'Halbtax / Demi-Tarif',
    country: 'CH',
    carrier: 'SBB',
    discountPercent: 50,
    description: '%50 indirim (İsviçre)',
    requiresNumber: true,
  },
  {
    code: 'GA_TRAVELCARD',
    name: 'GA Travelcard',
    country: 'CH',
    carrier: 'SBB',
    discountPercent: 100,
    description: 'Sınırsız seyahat (İsviçre)',
    requiresNumber: true,
  },

  // === AVUSTURYA (ÖBB) ===
  {
    code: 'VORTEILSCARD',
    name: 'ÖBB Vorteilscard',
    country: 'AT',
    carrier: 'OBB',
    discountPercent: 50,
    description: '%50 indirim (Avusturya)',
    requiresNumber: true,
  },
  {
    code: 'VORTEILSCARD_JUGEND',
    name: 'Vorteilscard Jugend',
    country: 'AT',
    carrier: 'OBB',
    discountPercent: 50,
    description: '26 yaş altı (Avusturya)',
    ageRestriction: { max: 26 },
    requiresNumber: true,
  },
  {
    code: 'VORTEILSCARD_SENIOR',
    name: 'Vorteilscard Senior',
    country: 'AT',
    carrier: 'OBB',
    discountPercent: 50,
    description: '60 yaş üstü (Avusturya)',
    ageRestriction: { min: 60 },
    requiresNumber: true,
  },

  // === İSPANYA (Renfe) ===
  {
    code: 'TARJETA_DORADA',
    name: 'Tarjeta Dorada',
    country: 'ES',
    carrier: 'RENFE',
    discountPercent: 40,
    description: '60 yaş üstü veya engelli (İspanya)',
    requiresNumber: true,
  },
  {
    code: 'TARJETA_JOVEN',
    name: 'Tarjeta Joven',
    country: 'ES',
    carrier: 'RENFE',
    discountPercent: 30,
    description: '26 yaş altı (İspanya)',
    ageRestriction: { max: 26 },
    requiresNumber: true,
  },

  // === İNGİLTERE (National Rail) ===
  {
    code: 'RAILCARD_16_25',
    name: '16-25 Railcard',
    country: 'GB',
    carrier: 'RDG',
    discountPercent: 33,
    description: '16-25 yaş arası (İngiltere)',
    ageRestriction: { min: 16, max: 25 },
    requiresNumber: true,
  },
  {
    code: 'RAILCARD_26_30',
    name: '26-30 Railcard',
    country: 'GB',
    carrier: 'RDG',
    discountPercent: 33,
    description: '26-30 yaş arası (İngiltere)',
    ageRestriction: { min: 26, max: 30 },
    requiresNumber: true,
  },
  {
    code: 'RAILCARD_SENIOR',
    name: 'Senior Railcard',
    country: 'GB',
    carrier: 'RDG',
    discountPercent: 33,
    description: '60 yaş üstü (İngiltere)',
    ageRestriction: { min: 60 },
    requiresNumber: true,
  },
  {
    code: 'RAILCARD_FAMILY',
    name: 'Family & Friends Railcard',
    country: 'GB',
    carrier: 'RDG',
    discountPercent: 33,
    description: 'Aile ve arkadaşlar (İngiltere)',
    requiresNumber: true,
  },
  {
    code: 'RAILCARD_TWO_TOGETHER',
    name: 'Two Together Railcard',
    country: 'GB',
    carrier: 'RDG',
    discountPercent: 33,
    description: 'İki kişi birlikte (İngiltere)',
    requiresNumber: true,
  },
  {
    code: 'RAILCARD_DISABLED',
    name: 'Disabled Persons Railcard',
    country: 'GB',
    carrier: 'RDG',
    discountPercent: 33,
    description: 'Engelli yolcular (İngiltere)',
    requiresNumber: true,
  },

  // === EUROSTAR ===
  {
    code: 'EUROSTAR_FREQUENT',
    name: 'Eurostar Frequent Traveller',
    country: 'EU',
    carrier: 'EUROSTAR',
    description: 'Puan toplama (Eurostar)',
    requiresNumber: true,
  },

  // === INTERRAIL / EURAIL ===
  {
    code: 'INTERRAIL_PASS',
    name: 'Interrail Pass',
    country: 'EU',
    description: 'Avrupa çapında geçerli',
    requiresNumber: true,
  },
  {
    code: 'EURAIL_PASS',
    name: 'Eurail Pass',
    country: 'EU',
    description: 'AB dışı vatandaşlar için',
    requiresNumber: true,
  },
];

// Ülkelere göre grupla
export const DISCOUNT_CARDS_BY_COUNTRY: Record<string, DiscountCard[]> = DISCOUNT_CARDS.reduce(
  (acc, card) => {
    if (!acc[card.country]) acc[card.country] = [];
    acc[card.country].push(card);
    return acc;
  },
  {} as Record<string, DiscountCard[]>
);

// Ülke isimleri
export const COUNTRY_NAMES: Record<string, string> = {
  DE: 'Almanya',
  FR: 'Fransa',
  IT: 'İtalya',
  CH: 'İsviçre',
  AT: 'Avusturya',
  ES: 'İspanya',
  GB: 'İngiltere',
  EU: 'Avrupa',
};

// Kart koduna göre bul
export function getDiscountCard(code: string): DiscountCard | undefined {
  return DISCOUNT_CARDS.find(c => c.code === code);
}

// Yaşa göre filtrele
export function getEligibleCards(age: number): DiscountCard[] {
  return DISCOUNT_CARDS.filter(card => {
    if (!card.ageRestriction) return true;
    const { min, max } = card.ageRestriction;
    if (min && age < min) return false;
    if (max && age > max) return false;
    return true;
  });
}

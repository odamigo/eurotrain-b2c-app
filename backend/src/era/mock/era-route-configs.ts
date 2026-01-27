/**
 * Route Configuration Types
 */
export interface DirectRouteConfig {
  duration: number;        // minutes
  basePrice: number;       // EUR
  carrier: string;         // carrier code
  carrierName: string;     // display name
  trainType: 'High-Speed' | 'Inter-City' | 'Night-Train' | 'Branch-Line/Regional';
  trainPrefix: string;     // ES, TGV, ICE, etc.
}

export interface MultiSegmentRouteConfig {
  via: string;             // transfer station code
  segments: [DirectRouteConfig, DirectRouteConfig];
  transferTime: number;    // minutes (layover at transfer station)
  totalDuration: number;   // total including transfer
  totalBasePrice: number;  // combined price
}

// ============================================================
// DIRECT ROUTES (35+ bidirectional)
// ============================================================

export const directRoutes: Record<string, DirectRouteConfig> = {
  // ======== EUROSTAR ========
  'FRPAR-GBLON': { duration: 136, basePrice: 89, carrier: 'EUROSTAR', carrierName: 'Eurostar', trainType: 'High-Speed', trainPrefix: 'ES' },
  'GBLON-FRPAR': { duration: 136, basePrice: 89, carrier: 'EUROSTAR', carrierName: 'Eurostar', trainType: 'High-Speed', trainPrefix: 'ES' },
  'GBLON-BEBRU': { duration: 120, basePrice: 69, carrier: 'EUROSTAR', carrierName: 'Eurostar', trainType: 'High-Speed', trainPrefix: 'ES' },
  'BEBRU-GBLON': { duration: 120, basePrice: 69, carrier: 'EUROSTAR', carrierName: 'Eurostar', trainType: 'High-Speed', trainPrefix: 'ES' },
  'GBLON-NLAMS': { duration: 225, basePrice: 99, carrier: 'EUROSTAR', carrierName: 'Eurostar', trainType: 'High-Speed', trainPrefix: 'ES' },
  'NLAMS-GBLON': { duration: 225, basePrice: 99, carrier: 'EUROSTAR', carrierName: 'Eurostar', trainType: 'High-Speed', trainPrefix: 'ES' },

  // ======== THALYS ========
  'FRPAR-NLAMS': { duration: 195, basePrice: 89, carrier: 'THALYS', carrierName: 'Thalys', trainType: 'High-Speed', trainPrefix: 'THA' },
  'NLAMS-FRPAR': { duration: 195, basePrice: 89, carrier: 'THALYS', carrierName: 'Thalys', trainType: 'High-Speed', trainPrefix: 'THA' },
  'FRPAR-BEBRU': { duration: 82, basePrice: 69, carrier: 'THALYS', carrierName: 'Thalys', trainType: 'High-Speed', trainPrefix: 'THA' },
  'BEBRU-FRPAR': { duration: 82, basePrice: 69, carrier: 'THALYS', carrierName: 'Thalys', trainType: 'High-Speed', trainPrefix: 'THA' },
  'FRPAR-DECOL': { duration: 200, basePrice: 79, carrier: 'THALYS', carrierName: 'Thalys', trainType: 'High-Speed', trainPrefix: 'THA' },
  'DECOL-FRPAR': { duration: 200, basePrice: 79, carrier: 'THALYS', carrierName: 'Thalys', trainType: 'High-Speed', trainPrefix: 'THA' },
  'BEBRU-NLAMS': { duration: 113, basePrice: 49, carrier: 'THALYS', carrierName: 'Thalys', trainType: 'High-Speed', trainPrefix: 'THA' },
  'NLAMS-BEBRU': { duration: 113, basePrice: 49, carrier: 'THALYS', carrierName: 'Thalys', trainType: 'High-Speed', trainPrefix: 'THA' },

  // ======== TGV/SNCF ========
  'FRPAR-FRLYS': { duration: 120, basePrice: 79, carrier: 'SNCF', carrierName: 'TGV', trainType: 'High-Speed', trainPrefix: 'TGV' },
  'FRLYS-FRPAR': { duration: 120, basePrice: 79, carrier: 'SNCF', carrierName: 'TGV', trainType: 'High-Speed', trainPrefix: 'TGV' },
  'FRPAR-FRMRS': { duration: 180, basePrice: 89, carrier: 'SNCF', carrierName: 'TGV', trainType: 'High-Speed', trainPrefix: 'TGV' },
  'FRMRS-FRPAR': { duration: 180, basePrice: 89, carrier: 'SNCF', carrierName: 'TGV', trainType: 'High-Speed', trainPrefix: 'TGV' },
  'FRPAR-FRNIC': { duration: 330, basePrice: 99, carrier: 'SNCF', carrierName: 'TGV', trainType: 'High-Speed', trainPrefix: 'TGV' },
  'FRNIC-FRPAR': { duration: 330, basePrice: 99, carrier: 'SNCF', carrierName: 'TGV', trainType: 'High-Speed', trainPrefix: 'TGV' },
  'FRPAR-ESBAR': { duration: 390, basePrice: 109, carrier: 'SNCF', carrierName: 'TGV', trainType: 'High-Speed', trainPrefix: 'TGV' },
  'ESBAR-FRPAR': { duration: 390, basePrice: 109, carrier: 'SNCF', carrierName: 'TGV', trainType: 'High-Speed', trainPrefix: 'TGV' },
  'FRLYS-FRMRS': { duration: 100, basePrice: 49, carrier: 'SNCF', carrierName: 'TGV', trainType: 'High-Speed', trainPrefix: 'TGV' },
  'FRMRS-FRLYS': { duration: 100, basePrice: 49, carrier: 'SNCF', carrierName: 'TGV', trainType: 'High-Speed', trainPrefix: 'TGV' },

  // ======== TRENITALIA ========
  'ITROM-ITMIL': { duration: 175, basePrice: 69, carrier: 'TRENITALIA', carrierName: 'Frecciarossa', trainType: 'High-Speed', trainPrefix: 'FR' },
  'ITMIL-ITROM': { duration: 175, basePrice: 69, carrier: 'TRENITALIA', carrierName: 'Frecciarossa', trainType: 'High-Speed', trainPrefix: 'FR' },
  'ITROM-ITFLO': { duration: 95, basePrice: 49, carrier: 'TRENITALIA', carrierName: 'Frecciarossa', trainType: 'High-Speed', trainPrefix: 'FR' },
  'ITFLO-ITROM': { duration: 95, basePrice: 49, carrier: 'TRENITALIA', carrierName: 'Frecciarossa', trainType: 'High-Speed', trainPrefix: 'FR' },
  'ITROM-ITVEN': { duration: 225, basePrice: 79, carrier: 'TRENITALIA', carrierName: 'Frecciarossa', trainType: 'High-Speed', trainPrefix: 'FR' },
  'ITVEN-ITROM': { duration: 225, basePrice: 79, carrier: 'TRENITALIA', carrierName: 'Frecciarossa', trainType: 'High-Speed', trainPrefix: 'FR' },
  'ITROM-ITNAP': { duration: 70, basePrice: 45, carrier: 'TRENITALIA', carrierName: 'Frecciarossa', trainType: 'High-Speed', trainPrefix: 'FR' },
  'ITNAP-ITROM': { duration: 70, basePrice: 45, carrier: 'TRENITALIA', carrierName: 'Frecciarossa', trainType: 'High-Speed', trainPrefix: 'FR' },
  'ITMIL-ITFLO': { duration: 100, basePrice: 45, carrier: 'TRENITALIA', carrierName: 'Frecciarossa', trainType: 'High-Speed', trainPrefix: 'FR' },
  'ITFLO-ITMIL': { duration: 100, basePrice: 45, carrier: 'TRENITALIA', carrierName: 'Frecciarossa', trainType: 'High-Speed', trainPrefix: 'FR' },
  'ITMIL-ITVEN': { duration: 145, basePrice: 55, carrier: 'TRENITALIA', carrierName: 'Frecciarossa', trainType: 'High-Speed', trainPrefix: 'FR' },
  'ITVEN-ITMIL': { duration: 145, basePrice: 55, carrier: 'TRENITALIA', carrierName: 'Frecciarossa', trainType: 'High-Speed', trainPrefix: 'FR' },

  // ======== DEUTSCHE BAHN ICE ========
  'DEBER-DEMUC': { duration: 240, basePrice: 89, carrier: 'DBAHN', carrierName: 'ICE', trainType: 'High-Speed', trainPrefix: 'ICE' },
  'DEMUC-DEBER': { duration: 240, basePrice: 89, carrier: 'DBAHN', carrierName: 'ICE', trainType: 'High-Speed', trainPrefix: 'ICE' },
  'DEBER-DEFRA': { duration: 240, basePrice: 79, carrier: 'DBAHN', carrierName: 'ICE', trainType: 'High-Speed', trainPrefix: 'ICE' },
  'DEFRA-DEBER': { duration: 240, basePrice: 79, carrier: 'DBAHN', carrierName: 'ICE', trainType: 'High-Speed', trainPrefix: 'ICE' },
  'DEMUC-DEFRA': { duration: 195, basePrice: 69, carrier: 'DBAHN', carrierName: 'ICE', trainType: 'High-Speed', trainPrefix: 'ICE' },
  'DEFRA-DEMUC': { duration: 195, basePrice: 69, carrier: 'DBAHN', carrierName: 'ICE', trainType: 'High-Speed', trainPrefix: 'ICE' },
  'DEFRA-DECOL': { duration: 70, basePrice: 39, carrier: 'DBAHN', carrierName: 'ICE', trainType: 'High-Speed', trainPrefix: 'ICE' },
  'DECOL-DEFRA': { duration: 70, basePrice: 39, carrier: 'DBAHN', carrierName: 'ICE', trainType: 'High-Speed', trainPrefix: 'ICE' },

  // ======== RENFE AVE ========
  'ESMAD-ESBAR': { duration: 155, basePrice: 69, carrier: 'RENFE', carrierName: 'AVE', trainType: 'High-Speed', trainPrefix: 'AVE' },
  'ESBAR-ESMAD': { duration: 155, basePrice: 69, carrier: 'RENFE', carrierName: 'AVE', trainType: 'High-Speed', trainPrefix: 'AVE' },
  'ESMAD-ESSEV': { duration: 150, basePrice: 65, carrier: 'RENFE', carrierName: 'AVE', trainType: 'High-Speed', trainPrefix: 'AVE' },
  'ESSEV-ESMAD': { duration: 150, basePrice: 65, carrier: 'RENFE', carrierName: 'AVE', trainType: 'High-Speed', trainPrefix: 'AVE' },

  // ======== SBB ========
  'CHZRH-CHGVA': { duration: 170, basePrice: 79, carrier: 'SBB', carrierName: 'SBB', trainType: 'Inter-City', trainPrefix: 'IC' },
  'CHGVA-CHZRH': { duration: 170, basePrice: 79, carrier: 'SBB', carrierName: 'SBB', trainType: 'Inter-City', trainPrefix: 'IC' },
  'CHZRH-CHBRN': { duration: 60, basePrice: 45, carrier: 'SBB', carrierName: 'SBB', trainType: 'Inter-City', trainPrefix: 'IC' },
  'CHBRN-CHZRH': { duration: 60, basePrice: 45, carrier: 'SBB', carrierName: 'SBB', trainType: 'Inter-City', trainPrefix: 'IC' },

  // ======== ÖBB Railjet ========
  'ATVIE-ATSBG': { duration: 145, basePrice: 55, carrier: 'OBB', carrierName: 'Railjet', trainType: 'High-Speed', trainPrefix: 'RJ' },
  'ATSBG-ATVIE': { duration: 145, basePrice: 55, carrier: 'OBB', carrierName: 'Railjet', trainType: 'High-Speed', trainPrefix: 'RJ' },
  'ATVIE-DEMUC': { duration: 240, basePrice: 69, carrier: 'OBB', carrierName: 'Railjet', trainType: 'High-Speed', trainPrefix: 'RJ' },
  'DEMUC-ATVIE': { duration: 240, basePrice: 69, carrier: 'OBB', carrierName: 'Railjet', trainType: 'High-Speed', trainPrefix: 'RJ' },
  'ATVIE-CZPRG': { duration: 240, basePrice: 59, carrier: 'OBB', carrierName: 'Railjet', trainType: 'High-Speed', trainPrefix: 'RJ' },
  'CZPRG-ATVIE': { duration: 240, basePrice: 59, carrier: 'OBB', carrierName: 'Railjet', trainType: 'High-Speed', trainPrefix: 'RJ' },

  // ======== CROSS-BORDER INTERNATIONAL ========
  'FRPAR-CHGVA': { duration: 190, basePrice: 89, carrier: 'TGV_LYRIA', carrierName: 'TGV Lyria', trainType: 'High-Speed', trainPrefix: 'TGV' },
  'CHGVA-FRPAR': { duration: 190, basePrice: 89, carrier: 'TGV_LYRIA', carrierName: 'TGV Lyria', trainType: 'High-Speed', trainPrefix: 'TGV' },
  'FRPAR-CHZRH': { duration: 240, basePrice: 99, carrier: 'TGV_LYRIA', carrierName: 'TGV Lyria', trainType: 'High-Speed', trainPrefix: 'TGV' },
  'CHZRH-FRPAR': { duration: 240, basePrice: 99, carrier: 'TGV_LYRIA', carrierName: 'TGV Lyria', trainType: 'High-Speed', trainPrefix: 'TGV' },
  'ITMIL-CHZRH': { duration: 210, basePrice: 79, carrier: 'SBB', carrierName: 'EuroCity', trainType: 'Inter-City', trainPrefix: 'EC' },
  'CHZRH-ITMIL': { duration: 210, basePrice: 79, carrier: 'SBB', carrierName: 'EuroCity', trainType: 'Inter-City', trainPrefix: 'EC' },
  'DEBER-CZPRG': { duration: 250, basePrice: 49, carrier: 'DBAHN', carrierName: 'EuroCity', trainType: 'Inter-City', trainPrefix: 'EC' },
  'CZPRG-DEBER': { duration: 250, basePrice: 49, carrier: 'DBAHN', carrierName: 'EuroCity', trainType: 'Inter-City', trainPrefix: 'EC' },
  
  // ======== ADDITIONAL POPULAR ROUTES ========
  'FRPAR-ITMIL': { duration: 420, basePrice: 119, carrier: 'TGV_LYRIA', carrierName: 'TGV', trainType: 'High-Speed', trainPrefix: 'TGV' },
  'ITMIL-FRPAR': { duration: 420, basePrice: 119, carrier: 'TGV_LYRIA', carrierName: 'TGV', trainType: 'High-Speed', trainPrefix: 'TGV' },
  'DEBER-NLAMS': { duration: 380, basePrice: 89, carrier: 'DBAHN', carrierName: 'ICE', trainType: 'High-Speed', trainPrefix: 'ICE' },
  'NLAMS-DEBER': { duration: 380, basePrice: 89, carrier: 'DBAHN', carrierName: 'ICE', trainType: 'High-Speed', trainPrefix: 'ICE' },
};

// ============================================================
// MULTI-SEGMENT ROUTES (Connections with transfers)
// ============================================================

export const multiSegmentRoutes: Record<string, MultiSegmentRouteConfig> = {
  // ======== LONDON TO ITALY (via Paris) ========
  'GBLON-ITROM': {
    via: 'FRPAR',
    segments: [
      { duration: 136, basePrice: 89, carrier: 'EUROSTAR', carrierName: 'Eurostar', trainType: 'High-Speed', trainPrefix: 'ES' },
      { duration: 420, basePrice: 119, carrier: 'TGV_LYRIA', carrierName: 'TGV', trainType: 'High-Speed', trainPrefix: 'TGV' },
    ],
    transferTime: 90,
    totalDuration: 646,  // 136 + 90 + 420 = ~10h 46m
    totalBasePrice: 189,
  },
  'ITROM-GBLON': {
    via: 'FRPAR',
    segments: [
      { duration: 420, basePrice: 119, carrier: 'TGV_LYRIA', carrierName: 'TGV', trainType: 'High-Speed', trainPrefix: 'TGV' },
      { duration: 136, basePrice: 89, carrier: 'EUROSTAR', carrierName: 'Eurostar', trainType: 'High-Speed', trainPrefix: 'ES' },
    ],
    transferTime: 90,
    totalDuration: 646,
    totalBasePrice: 189,
  },
  'GBLON-ITMIL': {
    via: 'FRPAR',
    segments: [
      { duration: 136, basePrice: 89, carrier: 'EUROSTAR', carrierName: 'Eurostar', trainType: 'High-Speed', trainPrefix: 'ES' },
      { duration: 420, basePrice: 119, carrier: 'TGV_LYRIA', carrierName: 'TGV', trainType: 'High-Speed', trainPrefix: 'TGV' },
    ],
    transferTime: 75,
    totalDuration: 631,  // ~10h 31m
    totalBasePrice: 179,
  },
  'ITMIL-GBLON': {
    via: 'FRPAR',
    segments: [
      { duration: 420, basePrice: 119, carrier: 'TGV_LYRIA', carrierName: 'TGV', trainType: 'High-Speed', trainPrefix: 'TGV' },
      { duration: 136, basePrice: 89, carrier: 'EUROSTAR', carrierName: 'Eurostar', trainType: 'High-Speed', trainPrefix: 'ES' },
    ],
    transferTime: 75,
    totalDuration: 631,
    totalBasePrice: 179,
  },

  // ======== LONDON TO GERMANY (via Brussels) ========
  'GBLON-DEBER': {
    via: 'BEBRU',
    segments: [
      { duration: 120, basePrice: 69, carrier: 'EUROSTAR', carrierName: 'Eurostar', trainType: 'High-Speed', trainPrefix: 'ES' },
      { duration: 360, basePrice: 89, carrier: 'DBAHN', carrierName: 'ICE', trainType: 'High-Speed', trainPrefix: 'ICE' },
    ],
    transferTime: 60,
    totalDuration: 540,  // 9h
    totalBasePrice: 149,
  },
  'DEBER-GBLON': {
    via: 'BEBRU',
    segments: [
      { duration: 360, basePrice: 89, carrier: 'DBAHN', carrierName: 'ICE', trainType: 'High-Speed', trainPrefix: 'ICE' },
      { duration: 120, basePrice: 69, carrier: 'EUROSTAR', carrierName: 'Eurostar', trainType: 'High-Speed', trainPrefix: 'ES' },
    ],
    transferTime: 60,
    totalDuration: 540,
    totalBasePrice: 149,
  },
  'GBLON-DEFRA': {
    via: 'BEBRU',
    segments: [
      { duration: 120, basePrice: 69, carrier: 'EUROSTAR', carrierName: 'Eurostar', trainType: 'High-Speed', trainPrefix: 'ES' },
      { duration: 180, basePrice: 79, carrier: 'DBAHN', carrierName: 'ICE', trainType: 'High-Speed', trainPrefix: 'ICE' },
    ],
    transferTime: 45,
    totalDuration: 345,  // ~5h 45m
    totalBasePrice: 139,
  },
  'DEFRA-GBLON': {
    via: 'BEBRU',
    segments: [
      { duration: 180, basePrice: 79, carrier: 'DBAHN', carrierName: 'ICE', trainType: 'High-Speed', trainPrefix: 'ICE' },
      { duration: 120, basePrice: 69, carrier: 'EUROSTAR', carrierName: 'Eurostar', trainType: 'High-Speed', trainPrefix: 'ES' },
    ],
    transferTime: 45,
    totalDuration: 345,
    totalBasePrice: 139,
  },

  // ======== SPAIN TO ITALY (via Paris or Lyon) ========
  'ESBAR-ITMIL': {
    via: 'FRLYS',
    segments: [
      { duration: 300, basePrice: 89, carrier: 'SNCF', carrierName: 'TGV', trainType: 'High-Speed', trainPrefix: 'TGV' },
      { duration: 300, basePrice: 89, carrier: 'TGV_LYRIA', carrierName: 'TGV', trainType: 'High-Speed', trainPrefix: 'TGV' },
    ],
    transferTime: 60,
    totalDuration: 660,  // 11h
    totalBasePrice: 159,
  },
  'ITMIL-ESBAR': {
    via: 'FRLYS',
    segments: [
      { duration: 300, basePrice: 89, carrier: 'TGV_LYRIA', carrierName: 'TGV', trainType: 'High-Speed', trainPrefix: 'TGV' },
      { duration: 300, basePrice: 89, carrier: 'SNCF', carrierName: 'TGV', trainType: 'High-Speed', trainPrefix: 'TGV' },
    ],
    transferTime: 60,
    totalDuration: 660,
    totalBasePrice: 159,
  },
  'ESMAD-ITROM': {
    via: 'ESBAR',
    segments: [
      { duration: 155, basePrice: 69, carrier: 'RENFE', carrierName: 'AVE', trainType: 'High-Speed', trainPrefix: 'AVE' },
      { duration: 540, basePrice: 129, carrier: 'SNCF', carrierName: 'TGV', trainType: 'High-Speed', trainPrefix: 'TGV' },
    ],
    transferTime: 90,
    totalDuration: 785,  // ~13h
    totalBasePrice: 189,
  },
  'ITROM-ESMAD': {
    via: 'ESBAR',
    segments: [
      { duration: 540, basePrice: 129, carrier: 'SNCF', carrierName: 'TGV', trainType: 'High-Speed', trainPrefix: 'TGV' },
      { duration: 155, basePrice: 69, carrier: 'RENFE', carrierName: 'AVE', trainType: 'High-Speed', trainPrefix: 'AVE' },
    ],
    transferTime: 90,
    totalDuration: 785,
    totalBasePrice: 189,
  },

  // ======== AMSTERDAM TO GERMANY (various) ========
  'NLAMS-DEMUC': {
    via: 'DEFRA',
    segments: [
      { duration: 240, basePrice: 69, carrier: 'DBAHN', carrierName: 'ICE', trainType: 'High-Speed', trainPrefix: 'ICE' },
      { duration: 195, basePrice: 69, carrier: 'DBAHN', carrierName: 'ICE', trainType: 'High-Speed', trainPrefix: 'ICE' },
    ],
    transferTime: 30,
    totalDuration: 465,  // ~7h 45m
    totalBasePrice: 129,
  },
  'DEMUC-NLAMS': {
    via: 'DEFRA',
    segments: [
      { duration: 195, basePrice: 69, carrier: 'DBAHN', carrierName: 'ICE', trainType: 'High-Speed', trainPrefix: 'ICE' },
      { duration: 240, basePrice: 69, carrier: 'DBAHN', carrierName: 'ICE', trainType: 'High-Speed', trainPrefix: 'ICE' },
    ],
    transferTime: 30,
    totalDuration: 465,
    totalBasePrice: 129,
  },

  // ======== SWITZERLAND TO AUSTRIA ========
  'CHZRH-ATVIE': {
    via: 'DEMUC',
    segments: [
      { duration: 240, basePrice: 79, carrier: 'SBB', carrierName: 'EuroCity', trainType: 'Inter-City', trainPrefix: 'EC' },
      { duration: 240, basePrice: 69, carrier: 'OBB', carrierName: 'Railjet', trainType: 'High-Speed', trainPrefix: 'RJ' },
    ],
    transferTime: 45,
    totalDuration: 525,  // ~8h 45m
    totalBasePrice: 139,
  },
  'ATVIE-CHZRH': {
    via: 'DEMUC',
    segments: [
      { duration: 240, basePrice: 69, carrier: 'OBB', carrierName: 'Railjet', trainType: 'High-Speed', trainPrefix: 'RJ' },
      { duration: 240, basePrice: 79, carrier: 'SBB', carrierName: 'EuroCity', trainType: 'Inter-City', trainPrefix: 'EC' },
    ],
    transferTime: 45,
    totalDuration: 525,
    totalBasePrice: 139,
  },

  // ======== PRAGUE CONNECTIONS ========
  'CZPRG-FRPAR': {
    via: 'DEFRA',
    segments: [
      { duration: 300, basePrice: 59, carrier: 'DBAHN', carrierName: 'EuroCity', trainType: 'Inter-City', trainPrefix: 'EC' },
      { duration: 240, basePrice: 89, carrier: 'DBAHN', carrierName: 'ICE', trainType: 'High-Speed', trainPrefix: 'ICE' },
    ],
    transferTime: 45,
    totalDuration: 585,  // ~9h 45m
    totalBasePrice: 139,
  },
  'FRPAR-CZPRG': {
    via: 'DEFRA',
    segments: [
      { duration: 240, basePrice: 89, carrier: 'DBAHN', carrierName: 'ICE', trainType: 'High-Speed', trainPrefix: 'ICE' },
      { duration: 300, basePrice: 59, carrier: 'DBAHN', carrierName: 'EuroCity', trainType: 'Inter-City', trainPrefix: 'EC' },
    ],
    transferTime: 45,
    totalDuration: 585,
    totalBasePrice: 139,
  },
};

/**
 * Helper: Check if a direct route exists
 */
export function hasDirectRoute(origin: string, destination: string): boolean {
  return !!directRoutes[`${origin}-${destination}`];
}

/**
 * Helper: Check if a multi-segment route exists
 */
export function hasMultiSegmentRoute(origin: string, destination: string): boolean {
  return !!multiSegmentRoutes[`${origin}-${destination}`];
}

/**
 * Helper: Get route config (direct or multi-segment)
 */
export function getRouteConfig(origin: string, destination: string): DirectRouteConfig | MultiSegmentRouteConfig | null {
  const routeKey = `${origin}-${destination}`;
  return directRoutes[routeKey] || multiSegmentRoutes[routeKey] || null;
}

import { EraPlace } from '../interfaces/era-api.types';

/**
 * Mock Places Data
 * 32 şehir/istasyon - 10 Avrupa ülkesi
 */
export const mockPlaces: EraPlace[] = [
  // ============ FRANCE ============
  { id: 'FRPAR', type: 'city', code: 'FRPAR', label: 'Paris', localLabel: 'Paris', country: { code: 'FR', label: 'France', localLabel: 'France' }, timezone: 'Europe/Paris' },
  { id: 'FRPLY', type: 'station', code: 'FRPLY', label: 'Paris Gare de Lyon', localLabel: 'Paris Gare de Lyon', country: { code: 'FR', label: 'France', localLabel: 'France' }, timezone: 'Europe/Paris' },
  { id: 'FRPNO', type: 'station', code: 'FRPNO', label: 'Paris Gare du Nord', localLabel: 'Paris Gare du Nord', country: { code: 'FR', label: 'France', localLabel: 'France' }, timezone: 'Europe/Paris' },
  { id: 'FRLYS', type: 'city', code: 'FRLYS', label: 'Lyon', localLabel: 'Lyon', country: { code: 'FR', label: 'France', localLabel: 'France' }, timezone: 'Europe/Paris' },
  { id: 'FRMRS', type: 'city', code: 'FRMRS', label: 'Marseille', localLabel: 'Marseille', country: { code: 'FR', label: 'France', localLabel: 'France' }, timezone: 'Europe/Paris' },
  { id: 'FRNIC', type: 'city', code: 'FRNIC', label: 'Nice', localLabel: 'Nice', country: { code: 'FR', label: 'France', localLabel: 'France' }, timezone: 'Europe/Paris' },
  
  // ============ UNITED KINGDOM ============
  { id: 'GBLON', type: 'city', code: 'GBLON', label: 'London', localLabel: 'London', country: { code: 'GB', label: 'United Kingdom', localLabel: 'United Kingdom' }, timezone: 'Europe/London' },
  { id: 'GBSTP', type: 'station', code: 'GBSTP', label: 'London St Pancras', localLabel: 'London St Pancras', country: { code: 'GB', label: 'United Kingdom', localLabel: 'United Kingdom' }, timezone: 'Europe/London' },
  { id: 'GBEDB', type: 'city', code: 'GBEDB', label: 'Edinburgh', localLabel: 'Edinburgh', country: { code: 'GB', label: 'United Kingdom', localLabel: 'United Kingdom' }, timezone: 'Europe/London' },
  
  // ============ GERMANY ============
  { id: 'DEBER', type: 'city', code: 'DEBER', label: 'Berlin', localLabel: 'Berlin', country: { code: 'DE', label: 'Germany', localLabel: 'Deutschland' }, timezone: 'Europe/Berlin' },
  { id: 'DEMUC', type: 'city', code: 'DEMUC', label: 'Munich', localLabel: 'München', country: { code: 'DE', label: 'Germany', localLabel: 'Deutschland' }, timezone: 'Europe/Berlin' },
  { id: 'DEFRA', type: 'city', code: 'DEFRA', label: 'Frankfurt', localLabel: 'Frankfurt am Main', country: { code: 'DE', label: 'Germany', localLabel: 'Deutschland' }, timezone: 'Europe/Berlin' },
  { id: 'DECOL', type: 'city', code: 'DECOL', label: 'Cologne', localLabel: 'Köln', country: { code: 'DE', label: 'Germany', localLabel: 'Deutschland' }, timezone: 'Europe/Berlin' },
  
  // ============ ITALY ============
  { id: 'ITROM', type: 'city', code: 'ITROM', label: 'Rome', localLabel: 'Roma', country: { code: 'IT', label: 'Italy', localLabel: 'Italia' }, timezone: 'Europe/Rome' },
  { id: 'ITMIL', type: 'city', code: 'ITMIL', label: 'Milan', localLabel: 'Milano', country: { code: 'IT', label: 'Italy', localLabel: 'Italia' }, timezone: 'Europe/Rome' },
  { id: 'ITFLO', type: 'city', code: 'ITFLO', label: 'Florence', localLabel: 'Firenze', country: { code: 'IT', label: 'Italy', localLabel: 'Italia' }, timezone: 'Europe/Rome' },
  { id: 'ITVEN', type: 'city', code: 'ITVEN', label: 'Venice', localLabel: 'Venezia', country: { code: 'IT', label: 'Italy', localLabel: 'Italia' }, timezone: 'Europe/Rome' },
  { id: 'ITNAP', type: 'city', code: 'ITNAP', label: 'Naples', localLabel: 'Napoli', country: { code: 'IT', label: 'Italy', localLabel: 'Italia' }, timezone: 'Europe/Rome' },
  
  // ============ SPAIN ============
  { id: 'ESMAD', type: 'city', code: 'ESMAD', label: 'Madrid', localLabel: 'Madrid', country: { code: 'ES', label: 'Spain', localLabel: 'España' }, timezone: 'Europe/Madrid' },
  { id: 'ESBAR', type: 'city', code: 'ESBAR', label: 'Barcelona', localLabel: 'Barcelona', country: { code: 'ES', label: 'Spain', localLabel: 'España' }, timezone: 'Europe/Madrid' },
  { id: 'ESSEV', type: 'city', code: 'ESSEV', label: 'Seville', localLabel: 'Sevilla', country: { code: 'ES', label: 'Spain', localLabel: 'España' }, timezone: 'Europe/Madrid' },
  
  // ============ NETHERLANDS ============
  { id: 'NLAMS', type: 'city', code: 'NLAMS', label: 'Amsterdam', localLabel: 'Amsterdam', country: { code: 'NL', label: 'Netherlands', localLabel: 'Nederland' }, timezone: 'Europe/Amsterdam' },
  { id: 'NLROT', type: 'city', code: 'NLROT', label: 'Rotterdam', localLabel: 'Rotterdam', country: { code: 'NL', label: 'Netherlands', localLabel: 'Nederland' }, timezone: 'Europe/Amsterdam' },
  
  // ============ BELGIUM ============
  { id: 'BEBRU', type: 'city', code: 'BEBRU', label: 'Brussels', localLabel: 'Bruxelles', country: { code: 'BE', label: 'Belgium', localLabel: 'Belgique' }, timezone: 'Europe/Brussels' },
  { id: 'BEANT', type: 'city', code: 'BEANT', label: 'Antwerp', localLabel: 'Antwerpen', country: { code: 'BE', label: 'Belgium', localLabel: 'België' }, timezone: 'Europe/Brussels' },
  
  // ============ SWITZERLAND ============
  { id: 'CHZRH', type: 'city', code: 'CHZRH', label: 'Zurich', localLabel: 'Zürich', country: { code: 'CH', label: 'Switzerland', localLabel: 'Schweiz' }, timezone: 'Europe/Zurich' },
  { id: 'CHGVA', type: 'city', code: 'CHGVA', label: 'Geneva', localLabel: 'Genève', country: { code: 'CH', label: 'Switzerland', localLabel: 'Suisse' }, timezone: 'Europe/Zurich' },
  { id: 'CHBRN', type: 'city', code: 'CHBRN', label: 'Bern', localLabel: 'Bern', country: { code: 'CH', label: 'Switzerland', localLabel: 'Schweiz' }, timezone: 'Europe/Zurich' },
  
  // ============ AUSTRIA ============
  { id: 'ATVIE', type: 'city', code: 'ATVIE', label: 'Vienna', localLabel: 'Wien', country: { code: 'AT', label: 'Austria', localLabel: 'Österreich' }, timezone: 'Europe/Vienna' },
  { id: 'ATSBG', type: 'city', code: 'ATSBG', label: 'Salzburg', localLabel: 'Salzburg', country: { code: 'AT', label: 'Austria', localLabel: 'Österreich' }, timezone: 'Europe/Vienna' },
  
  // ============ CZECH REPUBLIC ============
  { id: 'CZPRG', type: 'city', code: 'CZPRG', label: 'Prague', localLabel: 'Praha', country: { code: 'CZ', label: 'Czech Republic', localLabel: 'Česká republika' }, timezone: 'Europe/Prague' },
];

/**
 * Places lookup by code (for fast access)
 */
export const placesMap: Map<string, EraPlace> = new Map(
  mockPlaces.map(place => [place.code, place])
);

export interface Station {
  id: string;
  name: string;
  code: string;
  city: string;
  country: string;
  countryCode: string;
  timezone: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

// Mock station data - ERA API'den gelecek verinin simülasyonu
export const MOCK_STATIONS: Station[] = [
  // France
  { id: 'FRPAR', name: 'Paris Gare du Nord', code: 'FRPNO', city: 'Paris', country: 'France', countryCode: 'FR', timezone: 'Europe/Paris', coordinates: { latitude: 48.8809, longitude: 2.3553 } },
  { id: 'FRPLY', name: 'Paris Gare de Lyon', code: 'FRPLY', city: 'Paris', country: 'France', countryCode: 'FR', timezone: 'Europe/Paris', coordinates: { latitude: 48.8443, longitude: 2.3744 } },
  { id: 'FRLYS', name: 'Lyon Part-Dieu', code: 'FRLPD', city: 'Lyon', country: 'France', countryCode: 'FR', timezone: 'Europe/Paris', coordinates: { latitude: 45.7606, longitude: 4.8590 } },
  { id: 'FRNIC', name: 'Nice Ville', code: 'FRNIC', city: 'Nice', country: 'France', countryCode: 'FR', timezone: 'Europe/Paris', coordinates: { latitude: 43.7046, longitude: 7.2619 } },
  { id: 'FRMRS', name: 'Marseille Saint-Charles', code: 'FRMSC', city: 'Marseille', country: 'France', countryCode: 'FR', timezone: 'Europe/Paris', coordinates: { latitude: 43.3026, longitude: 5.3806 } },
  
  // Germany
  { id: 'DEBER', name: 'Berlin Hauptbahnhof', code: 'DEBHF', city: 'Berlin', country: 'Germany', countryCode: 'DE', timezone: 'Europe/Berlin', coordinates: { latitude: 52.5251, longitude: 13.3694 } },
  { id: 'DEMUC', name: 'München Hauptbahnhof', code: 'DEMHF', city: 'Munich', country: 'Germany', countryCode: 'DE', timezone: 'Europe/Berlin', coordinates: { latitude: 48.1403, longitude: 11.5600 } },
  { id: 'DEFRA', name: 'Frankfurt Hauptbahnhof', code: 'DEFHF', city: 'Frankfurt', country: 'Germany', countryCode: 'DE', timezone: 'Europe/Berlin', coordinates: { latitude: 50.1070, longitude: 8.6636 } },
  { id: 'DEHAM', name: 'Hamburg Hauptbahnhof', code: 'DEHHF', city: 'Hamburg', country: 'Germany', countryCode: 'DE', timezone: 'Europe/Berlin', coordinates: { latitude: 53.5530, longitude: 10.0069 } },
  { id: 'DECOL', name: 'Köln Hauptbahnhof', code: 'DEKHF', city: 'Cologne', country: 'Germany', countryCode: 'DE', timezone: 'Europe/Berlin', coordinates: { latitude: 50.9432, longitude: 6.9586 } },
  
  // Italy
  { id: 'ITROM', name: 'Roma Termini', code: 'ITRMT', city: 'Rome', country: 'Italy', countryCode: 'IT', timezone: 'Europe/Rome', coordinates: { latitude: 41.9010, longitude: 12.5014 } },
  { id: 'ITMIL', name: 'Milano Centrale', code: 'ITMIC', city: 'Milan', country: 'Italy', countryCode: 'IT', timezone: 'Europe/Rome', coordinates: { latitude: 45.4863, longitude: 9.2049 } },
  { id: 'ITFLO', name: 'Firenze Santa Maria Novella', code: 'ITSMN', city: 'Florence', country: 'Italy', countryCode: 'IT', timezone: 'Europe/Rome', coordinates: { latitude: 43.7764, longitude: 11.2479 } },
  { id: 'ITVEN', name: 'Venezia Santa Lucia', code: 'ITVSL', city: 'Venice', country: 'Italy', countryCode: 'IT', timezone: 'Europe/Rome', coordinates: { latitude: 45.4410, longitude: 12.3207 } },
  { id: 'ITNAP', name: 'Napoli Centrale', code: 'ITNAC', city: 'Naples', country: 'Italy', countryCode: 'IT', timezone: 'Europe/Rome', coordinates: { latitude: 40.8531, longitude: 14.2681 } },
  
  // Spain
  { id: 'ESMAD', name: 'Madrid Puerta de Atocha', code: 'ESMAT', city: 'Madrid', country: 'Spain', countryCode: 'ES', timezone: 'Europe/Madrid', coordinates: { latitude: 40.4065, longitude: -3.6892 } },
  { id: 'ESBAR', name: 'Barcelona Sants', code: 'ESBCS', city: 'Barcelona', country: 'Spain', countryCode: 'ES', timezone: 'Europe/Madrid', coordinates: { latitude: 41.3792, longitude: 2.1404 } },
  { id: 'ESSEV', name: 'Sevilla Santa Justa', code: 'ESSVQ', city: 'Seville', country: 'Spain', countryCode: 'ES', timezone: 'Europe/Madrid', coordinates: { latitude: 37.3918, longitude: -5.9752 } },
  { id: 'ESVAL', name: 'Valencia Joaquín Sorolla', code: 'ESVJS', city: 'Valencia', country: 'Spain', countryCode: 'ES', timezone: 'Europe/Madrid', coordinates: { latitude: 39.4658, longitude: -0.3774 } },
  
  // Netherlands
  { id: 'NLAMS', name: 'Amsterdam Centraal', code: 'NLAMC', city: 'Amsterdam', country: 'Netherlands', countryCode: 'NL', timezone: 'Europe/Amsterdam', coordinates: { latitude: 52.3791, longitude: 4.9003 } },
  { id: 'NLROT', name: 'Rotterdam Centraal', code: 'NLRTC', city: 'Rotterdam', country: 'Netherlands', countryCode: 'NL', timezone: 'Europe/Amsterdam', coordinates: { latitude: 51.9244, longitude: 4.4699 } },
  
  // Belgium
  { id: 'BEBRU', name: 'Bruxelles-Midi', code: 'BEBMI', city: 'Brussels', country: 'Belgium', countryCode: 'BE', timezone: 'Europe/Brussels', coordinates: { latitude: 50.8354, longitude: 4.3365 } },
  { id: 'BEANT', name: 'Antwerpen-Centraal', code: 'BEANT', city: 'Antwerp', country: 'Belgium', countryCode: 'BE', timezone: 'Europe/Brussels', coordinates: { latitude: 51.2172, longitude: 4.4212 } },
  
  // Switzerland
  { id: 'CHZRH', name: 'Zürich Hauptbahnhof', code: 'CHZHB', city: 'Zurich', country: 'Switzerland', countryCode: 'CH', timezone: 'Europe/Zurich', coordinates: { latitude: 47.3782, longitude: 8.5403 } },
  { id: 'CHGVA', name: 'Genève Cornavin', code: 'CHGVA', city: 'Geneva', country: 'Switzerland', countryCode: 'CH', timezone: 'Europe/Zurich', coordinates: { latitude: 46.2104, longitude: 6.1424 } },
  { id: 'CHBSL', name: 'Basel SBB', code: 'CHBSL', city: 'Basel', country: 'Switzerland', countryCode: 'CH', timezone: 'Europe/Zurich', coordinates: { latitude: 47.5476, longitude: 7.5897 } },
  
  // Austria
  { id: 'ATVIE', name: 'Wien Hauptbahnhof', code: 'ATWVB', city: 'Vienna', country: 'Austria', countryCode: 'AT', timezone: 'Europe/Vienna', coordinates: { latitude: 48.1863, longitude: 16.3785 } },
  { id: 'ATSBG', name: 'Salzburg Hauptbahnhof', code: 'ATSBG', city: 'Salzburg', country: 'Austria', countryCode: 'AT', timezone: 'Europe/Vienna', coordinates: { latitude: 47.8129, longitude: 13.0458 } },
  
  // UK
  { id: 'GBLON', name: 'London St Pancras', code: 'GBSTP', city: 'London', country: 'United Kingdom', countryCode: 'GB', timezone: 'Europe/London', coordinates: { latitude: 51.5317, longitude: -0.1260 } },
  { id: 'GBEBS', name: 'Edinburgh Waverley', code: 'GBEWV', city: 'Edinburgh', country: 'United Kingdom', countryCode: 'GB', timezone: 'Europe/London', coordinates: { latitude: 55.9521, longitude: -3.1897 } },
];
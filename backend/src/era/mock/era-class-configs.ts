import { EraComfortCategory } from '../interfaces/era-api.types';

/**
 * Class Configuration Type
 */
export interface ClassConfig {
  code: string;
  label: string;
  labelTr: string;
  comfortCategory: EraComfortCategory;
  priceMultiplier: number;
  refundable: boolean;
  exchangeable: boolean;
  flexibilityCode: string;
  flexibilityLabel: string;
}

/**
 * Available Ticket Classes
 * 3 class: Standard, Business, First
 */
export const classConfigs: ClassConfig[] = [
  {
    code: 'STANDARD',
    label: 'Standard Class',
    labelTr: 'Standart',
    comfortCategory: 'standard',
    priceMultiplier: 1.0,
    refundable: false,
    exchangeable: true,
    flexibilityCode: 'SEMI_FLEX',
    flexibilityLabel: 'Semi-Flexible',
  },
  {
    code: 'BUSINESS',
    label: 'Business Class',
    labelTr: 'Business',
    comfortCategory: 'comfort',
    priceMultiplier: 1.6,
    refundable: true,
    exchangeable: true,
    flexibilityCode: 'FLEXIBLE',
    flexibilityLabel: 'Flexible',
  },
  {
    code: 'FIRST',
    label: 'First Class',
    labelTr: 'Birinci Sınıf',
    comfortCategory: 'premier',
    priceMultiplier: 2.2,
    refundable: true,
    exchangeable: true,
    flexibilityCode: 'FULL_FLEX',
    flexibilityLabel: 'Fully Flexible',
  },
];

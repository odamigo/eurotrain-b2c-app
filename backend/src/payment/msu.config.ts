export const MSU_CONFIG = {
  // API Credentials
  merchantUser: process.env.MSU_MERCHANT_USER || '',
  merchantPassword: process.env.MSU_MERCHANT_PASSWORD || '',
  merchant: process.env.MSU_MERCHANT || '',

  // URLs
  apiUrl: process.env.MSU_API_URL || 'https://test.merchantsafeunipay.com/msu/api/v2',
  hostedPageUrl: process.env.MSU_HOSTED_PAGE_URL || 'https://test.merchantsafeunipay.com/msu/api/v2',

  // Callbacks
  returnUrl: process.env.FRONTEND_URL ? process.env.FRONTEND_URL + '/payment/callback' : 'http://localhost:3000/payment/callback',
  webhookUrl: process.env.BACKEND_URL ? process.env.BACKEND_URL + '/payment/webhook' : 'http://localhost:3001/payment/webhook',

  // Supported Currencies
  currencies: {
    EUR: { code: 'EUR', symbol: '€', name: 'Euro' },
    USD: { code: 'USD', symbol: '$', name: 'US Dollar' },
    TRY: { code: 'TRY', symbol: '₺', name: 'Turkish Lira' },
  },

  // Default Settings
  defaultCurrency: 'EUR',
  language: 'TR',

  // 3D Secure Settings
  force3DSecure: true,
  threeDSecureType: 'YES',

  // Payment Settings
  paymentSystem: 'CREDITCARD',
  installmentEnabled: false,
  maxInstallments: 12,

  // Timeout Settings
  sessionTimeout: 30, // minutes
  apiTimeout: 30000, // milliseconds

  // Retry Settings
  maxRetries: 3,
  retryDelay: 1000, // milliseconds
};

export const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: '€',
  USD: '$',
  TRY: '₺',
};

export const getCurrencyByLocale = (locale: string): string => {
  const turkishLocales = ['tr', 'tr-TR', 'TR'];
  if (turkishLocales.includes(locale)) {
    return 'TRY';
  }
  return 'EUR';
};

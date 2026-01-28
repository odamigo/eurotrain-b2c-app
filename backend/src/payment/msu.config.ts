export const MSU_CONFIG = {
  // API URLs
  apiUrl: process.env.MSU_API_URL || 'https://test.merchantsafeunipay.com/msu/api/v2',
  hostedPageUrl: process.env.MSU_HOSTED_PAGE_URL || 'https://test.merchantsafeunipay.com',

  // Merchant Credentials
  merchant: process.env.MSU_MERCHANT || '',
  merchantUser: process.env.MSU_MERCHANT_USER || '',
  merchantPassword: process.env.MSU_MERCHANT_PASSWORD || '',
  merchantSecretKey: process.env.MSU_MERCHANT_SECRET_KEY || '',

  // Callback URLs - DÜZELTILDI: /payment/callback kullanılıyor
  returnUrl: process.env.BACKEND_URL 
    ? process.env.BACKEND_URL + '/payment/callback' 
    : 'http://localhost:3001/payment/callback',
  
  webhookUrl: process.env.BACKEND_URL 
    ? process.env.BACKEND_URL + '/payment/webhook' 
    : 'http://localhost:3001/payment/webhook',

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
  sessionType: 'PAYMENTSESSION',
  installmentEnabled: false,
  maxInstallments: 12,

  // Timeout Settings
  sessionTimeout: 30,
  apiTimeout: 30000,

  // Retry Settings
  maxRetries: 3,
  retryDelay: 1000,

  // Hash Algorithm
  hashAlgorithm: 'SHA-256',
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

export const validateMsuConfig = (): { valid: boolean; missing: string[] } => {
  const missing: string[] = [];
  if (!MSU_CONFIG.merchant) missing.push('MSU_MERCHANT');
  if (!MSU_CONFIG.merchantUser) missing.push('MSU_MERCHANT_USER');
  if (!MSU_CONFIG.merchantPassword) missing.push('MSU_MERCHANT_PASSWORD');
  if (!MSU_CONFIG.merchantSecretKey) missing.push('MSU_MERCHANT_SECRET_KEY');
  return { valid: missing.length === 0, missing };
};

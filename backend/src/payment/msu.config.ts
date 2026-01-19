export const MSU_CONFIG = {
  // API Credentials
  merchantUser: process.env.MSU_MERCHANT_USER || '',
  merchantPassword: process.env.MSU_MERCHANT_PASSWORD || '',
  merchant: process.env.MSU_MERCHANT || '',
  
  // URLs
  apiUrl: process.env.MSU_API_URL || 'https://test.merchantsafeunipay.com/msu/api/v2',
  hostedPageUrl: process.env.MSU_HOSTED_PAGE_URL || 'https://test.merchantsafeunipay.com/msu/api/v2',
  
  // Callbacks
  returnUrl: process.env.MSU_RETURN_URL || 'http://localhost:3000/payment/callback',
  
  // Settings
  currency: 'TRY',
  language: 'TR',
};
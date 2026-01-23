import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from './settings.entity';

export interface ExchangeRates {
  EUR: number;
  USD: number;
  TRY: number;
  USD_TO_EUR: number;
  TRY_TO_EUR: number;
  markup: number;
  lastUpdated: string;
  source: string;
}

@Injectable()
export class SettingsService implements OnModuleInit {
  private readonly logger = new Logger(SettingsService.name);
  private ratesCache: ExchangeRates | null = null;
  private cacheExpiry: Date | null = null;

  constructor(
    @InjectRepository(Setting)
    private settingRepository: Repository<Setting>,
  ) {}

  async onModuleInit() {
    await this.seedDefaults();
  }

  // ==================== TEMEL CRUD ====================

  async get(key: string, language: string = 'en'): Promise<string | null> {
    const setting = await this.settingRepository.findOne({
      where: { key, language },
    });
    if (!setting) {
      const defaultSetting = await this.settingRepository.findOne({
        where: { key, language: 'en' },
      });
      return defaultSetting?.value || null;
    }
    return setting.value;
  }

  async set(
    key: string,
    value: string,
    category: string = 'general',
    language: string = 'en',
    description?: string,
  ): Promise<Setting> {
    let setting = await this.settingRepository.findOne({
      where: { key, language },
    });

    if (setting) {
      setting.value = value;
      setting.category = category;
      if (description) setting.description = description;
    } else {
      setting = this.settingRepository.create({
        key,
        value,
        category,
        language,
        description,
      });
    }

    return this.settingRepository.save(setting);
  }

  async getByCategory(category: string, language: string = 'en'): Promise<Setting[]> {
    return this.settingRepository.find({
      where: { category, language },
      order: { key: 'ASC' },
    });
  }

  async getAll(): Promise<Setting[]> {
    return this.settingRepository.find({
      order: { category: 'ASC', key: 'ASC' },
    });
  }

  async delete(key: string, language: string = 'en'): Promise<void> {
    await this.settingRepository.delete({ key, language });
  }

  // ==================== TCMB KUR ====================

  async fetchTCMBRates(): Promise<ExchangeRates> {
    try {
      this.logger.log('Fetching exchange rates from TCMB...');

      const response = await fetch('https://www.tcmb.gov.tr/kurlar/today.xml', {
        headers: {
          'User-Agent': 'EuroTrain/1.0',
        },
      });

      if (!response.ok) {
        throw new Error('TCMB API error: ' + response.status);
      }

      const xmlText = await response.text();

      // USD efektif satış
      const usdMatch = xmlText.match(
        /<Currency[^>]*Kod="USD"[^>]*>[\s\S]*?<ForexSelling>([\d.,]+)<\/ForexSelling>/,
      );
      // EUR efektif satış
      const eurMatch = xmlText.match(
        /<Currency[^>]*Kod="EUR"[^>]*>[\s\S]*?<ForexSelling>([\d.,]+)<\/ForexSelling>/,
      );

      const usdRate = usdMatch ? parseFloat(usdMatch[1].replace(',', '.')) : null;
      const eurRate = eurMatch ? parseFloat(eurMatch[1].replace(',', '.')) : null;

      if (!usdRate || !eurRate) {
        throw new Error('Could not parse TCMB rates');
      }

      const markup = await this.getMarkup();

      const rates: ExchangeRates = {
        EUR: 1,
        USD: Number((usdRate / eurRate).toFixed(4)),
        TRY: Number((eurRate * (1 + markup / 100)).toFixed(4)),
        USD_TO_EUR: Number((usdRate / eurRate).toFixed(4)),
        TRY_TO_EUR: Number((eurRate).toFixed(4)),
        markup,
        lastUpdated: new Date().toISOString(),
        source: 'TCMB',
      };

      this.ratesCache = rates;
      this.cacheExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 saat

      await this.set('exchange_rates', JSON.stringify(rates), 'currency', 'en');

      this.logger.log('TCMB rates fetched: EUR/TRY=' + eurRate + ', USD/TRY=' + usdRate);

      return rates;
    } catch (error) {
      this.logger.error('TCMB fetch failed: ' + (error as Error).message);
      return this.getFallbackRates();
    }
  }

  private async getFallbackRates(): Promise<ExchangeRates> {
    // Önce cache'e bak
    if (this.ratesCache) {
      this.logger.warn('Using cached rates');
      return this.ratesCache;
    }

    // DB'den bak
    const savedRates = await this.get('exchange_rates', 'en');
    if (savedRates) {
      try {
        const rates = JSON.parse(savedRates) as ExchangeRates;
        this.ratesCache = rates;
        return rates;
      } catch (e) {
        // ignore
      }
    }

    // Son çare: sabit değerler
    this.logger.warn('Using fallback rates');
    const markup = await this.getMarkup();
    return {
      EUR: 1,
      USD: 1.08,
      TRY: 38.5 * (1 + markup / 100),
      USD_TO_EUR: 1.08,
      TRY_TO_EUR: 38.5,
      markup,
      lastUpdated: new Date().toISOString(),
      source: 'FALLBACK',
    };
  }

  async getExchangeRates(): Promise<ExchangeRates> {
    // Cache geçerliyse
    if (this.ratesCache && this.cacheExpiry && new Date() < this.cacheExpiry) {
      return this.ratesCache;
    }

    // DB'den kontrol et
    const savedRates = await this.get('exchange_rates', 'en');
    if (savedRates) {
      try {
        const rates = JSON.parse(savedRates) as ExchangeRates;
        const lastUpdated = new Date(rates.lastUpdated);
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

        if (lastUpdated > oneHourAgo) {
          this.ratesCache = rates;
          this.cacheExpiry = new Date(lastUpdated.getTime() + 60 * 60 * 1000);
          return rates;
        }
      } catch (e) {
        // ignore
      }
    }

    // Yeni kurları çek
    return this.fetchTCMBRates();
  }

  // ==================== MARKUP ====================

  async getMarkup(): Promise<number> {
    const markup = await this.get('currency_markup', 'en');
    return markup ? parseFloat(markup) : 2.5;
  }

  async setMarkup(markup: number): Promise<void> {
    await this.set('currency_markup', markup.toString(), 'currency', 'en', 'Currency conversion markup percentage');
    // Cache'i temizle ki yeni markup ile kurlar hesaplansın
    this.ratesCache = null;
    this.cacheExpiry = null;
    this.logger.log('Markup updated to ' + markup + '%');
  }

  // ==================== YASAL METİNLER ====================

  async getTerms(language: string = 'en'): Promise<string> {
    const terms = await this.get('terms_conditions', language);
    return terms || 'Terms and conditions not set.';
  }

  async setTerms(content: string, language: string = 'en'): Promise<void> {
    await this.set('terms_conditions', content, 'legal', language, 'Terms and Conditions');
  }

  async getPrivacyPolicy(language: string = 'en'): Promise<string> {
    const policy = await this.get('privacy_policy', language);
    return policy || 'Privacy policy not set.';
  }

  async setPrivacyPolicy(content: string, language: string = 'en'): Promise<void> {
    await this.set('privacy_policy', content, 'legal', language, 'Privacy Policy');
  }

  // ==================== VARSAYILAN DEĞERLER ====================

  private async seedDefaults(): Promise<void> {
    const defaults = [
      {
        key: 'currency_markup',
        value: '2.5',
        category: 'currency',
        description: 'Markup percentage for non-EUR payments',
      },
      {
        key: 'default_currency',
        value: 'EUR',
        category: 'currency',
        description: 'Default display currency',
      },
      {
        key: 'supported_currencies',
        value: 'EUR,USD,TRY',
        category: 'currency',
        description: 'Comma-separated list of supported currencies',
      },
      {
        key: 'terms_conditions',
        value: '# Kullanım Koşulları\n\nBu sayfa henüz düzenlenmemiştir.',
        category: 'legal',
        description: 'Terms and Conditions',
      },
      {
        key: 'privacy_policy',
        value: '# Gizlilik Politikası\n\nBu sayfa henüz düzenlenmemiştir.',
        category: 'legal',
        description: 'Privacy Policy',
      },
    ];

    for (const def of defaults) {
      const existing = await this.get(def.key, 'en');
      if (!existing) {
        await this.set(def.key, def.value, def.category, 'en', def.description);
        this.logger.log('Seeded default: ' + def.key);
      }
    }
  }

  // ==================== PARA BİRİMİ DÖNÜŞÜMÜ ====================

  async convertToEUR(amount: number, fromCurrency: string): Promise<number> {
    if (fromCurrency === 'EUR') return amount;

    const rates = await this.getExchangeRates();

    if (fromCurrency === 'USD') {
      return Number((amount / rates.USD_TO_EUR).toFixed(2));
    }
    if (fromCurrency === 'TRY') {
      return Number((amount / rates.TRY_TO_EUR).toFixed(2));
    }

    return amount;
  }

  async convertFromEUR(amount: number, toCurrency: string): Promise<{ amount: number; rate: number; markup: number; hasMarkup: boolean }> {
    const rates = await this.getExchangeRates();

    if (toCurrency === 'EUR') {
      return { amount, rate: 1, markup: 0, hasMarkup: false };
    }

    if (toCurrency === 'USD') {
      const converted = Number((amount * rates.USD_TO_EUR).toFixed(2));
      return { amount: converted, rate: rates.USD_TO_EUR, markup: rates.markup, hasMarkup: true };
    }

    if (toCurrency === 'TRY') {
      const converted = Number((amount * rates.TRY).toFixed(2));
      return { amount: converted, rate: rates.TRY, markup: rates.markup, hasMarkup: true };
    }

    return { amount, rate: 1, markup: 0, hasMarkup: false };
  }
}
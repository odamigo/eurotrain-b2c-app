import { Controller, Get, Post, Put, Body, Query, UseGuards, Logger } from '@nestjs/common';
import { SettingsService, ExchangeRates } from './settings.service';
import { JwtAuthGuard } from '../security/jwt-auth.guard';

@Controller('settings')
export class SettingsController {
  private readonly logger = new Logger(SettingsController.name);

  constructor(private readonly settingsService: SettingsService) {}

  // ==================== PUBLIC ENDPOINTS ====================

  @Get('exchange-rates')
  async getExchangeRates(): Promise<{ success: boolean; rates: ExchangeRates }> {
    const rates = await this.settingsService.getExchangeRates();
    return { success: true, rates };
  }

  @Get('convert')
  async convertCurrency(
    @Query('amount') amount: string,
    @Query('from') from: string = 'EUR',
    @Query('to') to: string = 'TRY',
  ): Promise<{
    success: boolean;
    original: { amount: number; currency: string };
    converted: { amount: number; currency: string };
    rate: number;
    markup: number;
    hasMarkup: boolean;
    notice?: string;
  }> {
    const amountNum = parseFloat(amount) || 0;

    if (from === 'EUR') {
      const result = await this.settingsService.convertFromEUR(amountNum, to);
      return {
        success: true,
        original: { amount: amountNum, currency: from },
        converted: { amount: result.amount, currency: to },
        rate: result.rate,
        markup: result.markup,
        hasMarkup: result.hasMarkup,
        notice: result.hasMarkup ? 'Orijinal para birimi dışında ödeme yapıldığında kur farkı uygulanmaktadır.' : undefined,
      };
    }

    // Diğer dönüşümler için önce EUR'a çevir
    const eurAmount = await this.settingsService.convertToEUR(amountNum, from);
    const result = await this.settingsService.convertFromEUR(eurAmount, to);

    return {
      success: true,
      original: { amount: amountNum, currency: from },
      converted: { amount: result.amount, currency: to },
      rate: result.rate,
      markup: result.markup,
      hasMarkup: result.hasMarkup,
      notice: result.hasMarkup ? 'Orijinal para birimi dışında ödeme yapıldığında kur farkı uygulanmaktadır.' : undefined,
    };
  }

  @Get('terms')
  async getTerms(@Query('lang') lang: string = 'tr'): Promise<{ success: boolean; content: string; language: string }> {
    const content = await this.settingsService.getTerms(lang);
    return { success: true, content, language: lang };
  }

  @Get('privacy')
  async getPrivacyPolicy(@Query('lang') lang: string = 'tr'): Promise<{ success: boolean; content: string; language: string }> {
    const content = await this.settingsService.getPrivacyPolicy(lang);
    return { success: true, content, language: lang };
  }

  // ==================== ADMIN ENDPOINTS ====================

  @Get('admin/all')
  @UseGuards(JwtAuthGuard)
  async getAllSettings() {
    const settings = await this.settingsService.getAll();
    return { success: true, settings };
  }

  @Get('admin/exchange-rates')
  @UseGuards(JwtAuthGuard)
  async getAdminExchangeRates() {
    const rates = await this.settingsService.getExchangeRates();
    const markup = await this.settingsService.getMarkup();
    return { success: true, rates, markup };
  }

  @Post('admin/exchange-rates/refresh')
  @UseGuards(JwtAuthGuard)
  async refreshExchangeRates() {
    this.logger.log('Admin requested exchange rates refresh');
    const rates = await this.settingsService.fetchTCMBRates();
    return { success: true, rates, message: 'Kurlar TCMB\'den güncellendi' };
  }

  @Put('admin/markup')
  @UseGuards(JwtAuthGuard)
  async setMarkup(@Body() body: { markup: number }) {
    if (body.markup < 0 || body.markup > 20) {
      return { success: false, message: 'Markup 0-20 arasında olmalıdır' };
    }
    await this.settingsService.setMarkup(body.markup);
    return { success: true, message: 'Markup güncellendi: %' + body.markup };
  }

  @Put('admin/terms')
  @UseGuards(JwtAuthGuard)
  async setTerms(@Body() body: { content: string; language?: string }) {
    await this.settingsService.setTerms(body.content, body.language || 'tr');
    return { success: true, message: 'Kullanım koşulları güncellendi' };
  }

  @Put('admin/privacy')
  @UseGuards(JwtAuthGuard)
  async setPrivacyPolicy(@Body() body: { content: string; language?: string }) {
    await this.settingsService.setPrivacyPolicy(body.content, body.language || 'tr');
    return { success: true, message: 'Gizlilik politikası güncellendi' };
  }

  @Put('admin/setting')
  @UseGuards(JwtAuthGuard)
  async setSetting(
    @Body() body: { key: string; value: string; category?: string; language?: string; description?: string },
  ) {
    const setting = await this.settingsService.set(
      body.key,
      body.value,
      body.category || 'general',
      body.language || 'en',
      body.description,
    );
    return { success: true, setting };
  }
}
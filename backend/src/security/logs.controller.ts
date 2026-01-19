import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { LoggerService } from './logger.service';

@Controller('admin/logs')
@UseGuards(JwtAuthGuard)
export class LogsController {
  constructor(private logger: LoggerService) {}

  /**
   * GET /admin/logs/errors
   * Son hataları getir
   */
  @Get('errors')
  getErrors(@Query('limit') limit?: string) {
    const errors = this.logger.getRecentErrors(parseInt(limit || '50'));
    return {
      success: true,
      count: errors.length,
      data: errors,
    };
  }

  /**
   * GET /admin/logs/stats
   * Hata istatistikleri
   */
  @Get('stats')
  getStats() {
    const stats = this.logger.getErrorStats();
    return {
      success: true,
      data: stats,
    };
  }
}

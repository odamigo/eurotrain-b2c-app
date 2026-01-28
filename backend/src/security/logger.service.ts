import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';

export interface LogEntry {
  timestamp: string;
  level: 'error' | 'warn' | 'info' | 'debug';
  message: string;
  context?: string;
  stack?: string;
  metadata?: any;
}

@Injectable()
export class LoggerService implements NestLoggerService {
  private isProduction: boolean;
  private recentErrors: LogEntry[] = [];
  private errorCount = { today: 0, date: new Date().toDateString() };
  private readonly MAX_RECENT_ERRORS = 100;

  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  private writeLog(entry: LogEntry) {
    // Console'a yaz - Railway/Vercel otomatik toplar
    const color = {
      error: '\x1b[31m', // kırmızı
      warn: '\x1b[33m',  // sarı
      info: '\x1b[36m',  // cyan
      debug: '\x1b[90m', // gri
    };
    const reset = '\x1b[0m';
    
    const logMessage = `${color[entry.level]}[${entry.level.toUpperCase()}]${reset} ${entry.timestamp} - ${entry.context || 'App'}: ${entry.message}`;
    
    if (entry.level === 'error') {
      console.error(logMessage);
      if (entry.stack) {
        console.error(entry.stack);
      }
    } else if (entry.level === 'warn') {
      console.warn(logMessage);
    } else {
      console.log(logMessage);
    }

    // Production'da JSON formatında da logla (log aggregation için)
    if (this.isProduction) {
      const jsonLog = JSON.stringify({
        ...entry,
        env: 'production',
        service: 'eurotrain-backend'
      });
      
      if (entry.level === 'error') {
        console.error(jsonLog);
      } else {
        console.log(jsonLog);
      }
    }

    // Error'ları memory'de tut (admin panel için)
    if (entry.level === 'error' || entry.level === 'warn') {
      this.recentErrors.unshift(entry);
      if (this.recentErrors.length > this.MAX_RECENT_ERRORS) {
        this.recentErrors.pop();
      }
    }
  }

  log(message: string, context?: string) {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: 'info',
      message,
      context,
    });
  }

  error(message: string, stack?: string, context?: string) {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: 'error',
      message,
      stack,
      context,
    });

    // Kritik hata bildirimi
    this.notifyAdmin('error', message, stack);
  }

  warn(message: string, context?: string) {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: 'warn',
      message,
      context,
    });
  }

  debug(message: string, context?: string) {
    if (!this.isProduction) {
      this.writeLog({
        timestamp: new Date().toISOString(),
        level: 'debug',
        message,
        context,
      });
    }
  }

  verbose(message: string, context?: string) {
    this.debug(message, context);
  }

  // Kritik hata bildirimi
  private notifyAdmin(level: string, message: string, stack?: string) {
    if (level === 'error') {
      console.log('\x1b[41m\x1b[37m ⚠️  CRITICAL ERROR - ADMIN NOTIFICATION NEEDED \x1b[0m');
      
      // Hata sayısını takip et
      const today = new Date().toDateString();
      if (this.errorCount.date !== today) {
        this.errorCount = { today: 0, date: today };
      }
      
      this.errorCount.today++;
      
      // 10'dan fazla hata varsa uyar
      if (this.errorCount.today > 10) {
        console.log('\x1b[41m\x1b[37m ⚠️  TOO MANY ERRORS TODAY: ' + this.errorCount.today + ' \x1b[0m');
      }
    }
  }

  // Son hataları getir (admin panel için)
  getRecentErrors(limit: number = 50): LogEntry[] {
    return this.recentErrors.slice(0, limit);
  }

  // Hata istatistikleri
  getErrorStats(): { today: number; total: number; lastError?: string } {
    const today = new Date().toDateString();
    const todayCount = this.errorCount.date === today ? this.errorCount.today : 0;
    
    return {
      today: todayCount,
      total: this.recentErrors.filter(e => e.level === 'error').length,
      lastError: this.recentErrors[0]?.timestamp
    };
  }
}

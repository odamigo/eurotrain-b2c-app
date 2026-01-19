import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

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
  private logDir: string;
  private errorLogFile: string;
  private combinedLogFile: string;

  constructor() {
    this.logDir = path.join(process.cwd(), 'logs');
    this.errorLogFile = path.join(this.logDir, 'error.log');
    this.combinedLogFile = path.join(this.logDir, 'combined.log');
    
    // Log klasörü oluştur
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private writeLog(entry: LogEntry) {
    const logLine = JSON.stringify(entry) + '\n';
    
    // Combined log'a yaz
    fs.appendFileSync(this.combinedLogFile, logLine);
    
    // Error ve warn'ları ayrı dosyaya da yaz
    if (entry.level === 'error' || entry.level === 'warn') {
      fs.appendFileSync(this.errorLogFile, logLine);
    }

    // Console'a da yaz
    const color = {
      error: '\x1b[31m', // kırmızı
      warn: '\x1b[33m',  // sarı
      info: '\x1b[36m',  // cyan
      debug: '\x1b[90m', // gri
    };
    const reset = '\x1b[0m';
    
    console.log(
      `${color[entry.level]}[${entry.level.toUpperCase()}]${reset} ${entry.timestamp} - ${entry.context || 'App'}: ${entry.message}`
    );
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

    // Kritik hata bildirimi (ileride email/telegram eklenebilir)
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
    if (process.env.NODE_ENV !== 'production') {
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
  private async notifyAdmin(level: string, message: string, stack?: string) {
    // Bu kısım email servisi kurulduktan sonra aktif edilecek
    // Şimdilik sadece console'a özel mesaj
    if (level === 'error') {
      console.log('\x1b[41m\x1b[37m ⚠️  CRITICAL ERROR - ADMIN NOTIFICATION NEEDED \x1b[0m');
      
      // Hata sayısını takip et
      const errorCountFile = path.join(this.logDir, 'error-count.json');
      let errorCount = { today: 0, date: new Date().toDateString() };
      
      if (fs.existsSync(errorCountFile)) {
        try {
          errorCount = JSON.parse(fs.readFileSync(errorCountFile, 'utf8'));
          if (errorCount.date !== new Date().toDateString()) {
            errorCount = { today: 0, date: new Date().toDateString() };
          }
        } catch {}
      }
      
      errorCount.today++;
      fs.writeFileSync(errorCountFile, JSON.stringify(errorCount));
      
      // 10'dan fazla hata varsa uyar
      if (errorCount.today > 10) {
        console.log('\x1b[41m\x1b[37m ⚠️  TOO MANY ERRORS TODAY: ' + errorCount.today + ' \x1b[0m');
      }
    }
  }

  // Son hataları getir (admin panel için)
  getRecentErrors(limit: number = 50): LogEntry[] {
    try {
      if (!fs.existsSync(this.errorLogFile)) {
        return [];
      }
      
      const content = fs.readFileSync(this.errorLogFile, 'utf8');
      const lines = content.trim().split('\n').filter(Boolean);
      
      return lines
        .slice(-limit)
        .reverse()
        .map(line => {
          try {
            return JSON.parse(line);
          } catch {
            return null;
          }
        })
        .filter(Boolean) as LogEntry[];
    } catch {
      return [];
    }
  }

  // Hata istatistikleri
  getErrorStats(): { today: number; total: number; lastError?: string } {
    const errorCountFile = path.join(this.logDir, 'error-count.json');
    let today = 0;
    
    if (fs.existsSync(errorCountFile)) {
      try {
        const data = JSON.parse(fs.readFileSync(errorCountFile, 'utf8'));
        if (data.date === new Date().toDateString()) {
          today = data.today;
        }
      } catch {}
    }

    let total = 0;
    let lastError: string | undefined;
    
    if (fs.existsSync(this.errorLogFile)) {
      const content = fs.readFileSync(this.errorLogFile, 'utf8');
      const lines = content.trim().split('\n').filter(Boolean);
      total = lines.length;
      
      if (lines.length > 0) {
        try {
          const last = JSON.parse(lines[lines.length - 1]);
          lastError = last.timestamp;
        } catch {}
      }
    }

    return { today, total, lastError };
  }
}

import { Module } from '@nestjs/common';
import { PdfService } from './pdf.service';
import { PdfController } from './pdf.controller';
import { QrService } from './qr.service';
import { BookingsModule } from '../bookings/bookings.module';

@Module({
  imports: [BookingsModule],
  controllers: [PdfController],
  providers: [PdfService, QrService],
  exports: [PdfService, QrService],
})
export class PdfModule {}

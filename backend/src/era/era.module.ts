import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// Services
import { EraAuthService } from './services/era-auth.service';
import { EraPlacesService } from './services/era-places.service';
import { EraSearchService } from './services/era-search.service';
import { EraBookingService } from './services/era-booking.service';
import { EraRefundService } from './services/era-refund.service';
import { EraMockService } from './mock/era-mock.service';

// Controller
import { EraController } from './era.controller';

@Module({
  imports: [ConfigModule],
  controllers: [EraController],
  providers: [
    // Mock service (used when ERA_MOCK_MODE=true or no credentials)
    EraMockService,
    
    // Core services
    EraAuthService,
    EraPlacesService,
    EraSearchService,
    EraBookingService,
    EraRefundService,
  ],
  exports: [
    // Export for use in other modules (e.g., BookingsModule)
    EraAuthService,
    EraPlacesService,
    EraSearchService,
    EraBookingService,
    EraRefundService,
  ],
})
export class EraModule {}

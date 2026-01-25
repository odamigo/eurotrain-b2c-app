import { Module } from '@nestjs/common';
import { McpController } from './mcp.controller';
import { OfferCacheService } from './services/offer-cache.service';
import { SessionCacheService } from './services/session-cache.service';
import { EraModule } from '../era/era.module';

@Module({
  imports: [
    EraModule,  // For EraSearchService
  ],
  controllers: [McpController],
  providers: [
    OfferCacheService,
    SessionCacheService,
  ],
  exports: [
    OfferCacheService,
    SessionCacheService,
  ],
})
export class McpModule {}

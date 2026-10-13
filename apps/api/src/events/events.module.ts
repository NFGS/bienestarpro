import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { JwtConfigModule } from '../auth/jwt-config.module';
import {
  EventsController,
  LearnerDeliveriesController,
} from './events.controller';
import { EventsService } from './events.service';
import { PublicController } from './public.controller';

@Module({
  imports: [AuditModule, JwtConfigModule],
  controllers: [EventsController, LearnerDeliveriesController, PublicController],
  providers: [EventsService],
})
export class EventsModule {}

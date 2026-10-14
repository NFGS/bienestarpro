import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { JwtConfigModule } from '../auth/jwt-config.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { MeetingsController } from './meetings.controller';
import { MeetingsScheduler } from './meetings.scheduler';
import { MeetingsService } from './meetings.service';

@Module({
  imports: [AuditModule, JwtConfigModule, NotificationsModule],
  controllers: [MeetingsController],
  providers: [MeetingsService, MeetingsScheduler],
})
export class MeetingsModule {}

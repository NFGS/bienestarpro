import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { JwtConfigModule } from '../auth/jwt-config.module';
import { NotificationsController } from './notifications.controller';
import { NotificationsRelay } from './notifications.relay';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [AuditModule, JwtConfigModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsRelay],
  exports: [NotificationsService],
})
export class NotificationsModule {}

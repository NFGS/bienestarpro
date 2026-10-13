import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { JwtConfigModule } from '../auth/jwt-config.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PublicationsController } from './publications.controller';
import { PublicationsService } from './publications.service';

@Module({
  imports: [AuditModule, JwtConfigModule, NotificationsModule],
  controllers: [PublicationsController],
  providers: [PublicationsService],
})
export class PublicationsModule {}

import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { JwtConfigModule } from '../auth/jwt-config.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SurveysController } from './surveys.controller';
import { SurveysService } from './surveys.service';

@Module({
  imports: [AuditModule, JwtConfigModule, NotificationsModule],
  controllers: [SurveysController],
  providers: [SurveysService],
})
export class SurveysModule {}

import { Module } from '@nestjs/common';
import { JwtConfigModule } from '../auth/jwt-config.module';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';

@Module({
  imports: [JwtConfigModule],
  controllers: [AuditController],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}

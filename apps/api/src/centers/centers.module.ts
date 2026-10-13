import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { JwtConfigModule } from '../auth/jwt-config.module';
import { CentersController } from './centers.controller';
import { CentersService } from './centers.service';

@Module({
  imports: [AuditModule, JwtConfigModule],
  controllers: [CentersController],
  providers: [CentersService],
})
export class CentersModule {}

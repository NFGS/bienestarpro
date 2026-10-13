import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { JwtConfigModule } from '../auth/jwt-config.module';
import { DirectoryController } from './directory.controller';
import { DirectoryService } from './directory.service';
import { EmergencyContactsService } from './emergency-contacts.service';

@Module({
  imports: [AuditModule, JwtConfigModule],
  controllers: [DirectoryController],
  providers: [DirectoryService, EmergencyContactsService],
})
export class DirectoryModule {}

import { Module } from '@nestjs/common';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { CentersModule } from './centers/centers.module';
import { DbModule } from './db/db.module';
import { HealthModule } from './health/health.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    DbModule,
    AuditModule,
    HealthModule,
    AuthModule,
    UsersModule,
    CentersModule,
  ],
})
export class AppModule {}

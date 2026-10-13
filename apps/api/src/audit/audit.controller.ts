import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AuditService } from './audit.service';
import { AuditQueryDto } from './dto/audit-query.dto';

/** CU-04 / RF-04: consultar la auditoría (solo lectura, con filtros y paginación). */
@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  @Roles('superadmin', 'coordinacion')
  list(@Query() query: AuditQueryDto, @Req() request: AuthenticatedRequest) {
    const user = request.user;
    // Coordinación solo ve la auditoría de su centro; superadmin ve todo.
    const centerId =
      user && user.role !== 'superadmin' ? (user.centerId ?? undefined) : undefined;
    return this.audit.list({
      action: query.action,
      actorId: query.actorId,
      from: query.from,
      to: query.to,
      page: query.page,
      limit: query.limit,
      centerId,
    });
  }
}

import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/auth.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/jwt-auth.guard';
import { RequireTotpGuard } from '../auth/require-totp.guard';
import { Roles } from '../auth/roles.decorator';
import type { AppRole } from '../auth/roles.constants';
import { RolesGuard } from '../auth/roles.guard';
import {
  CreatePublicationDto,
  PublicationMetricDto,
  UpdatePublicationDto,
} from './dto/publications.dto';
import { PublicationsService } from './publications.service';

const MANAGE_ROLES: AppRole[] = ['superadmin', 'coordinacion'];

@Controller('publications')
@UseGuards(JwtAuthGuard, RolesGuard, RequireTotpGuard)
export class PublicationsController {
  constructor(private readonly publications: PublicationsService) {}

  /** CU-25: las publicaciones del centro (cualquier rol autenticado puede leerlas). */
  @Get()
  list(@Req() request: AuthenticatedRequest) {
    return this.publications.list(request.user as AuthenticatedUser);
  }

  @Post()
  @Roles(...MANAGE_ROLES)
  create(
    @Body() dto: CreatePublicationDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.publications.create(dto, request.user as AuthenticatedUser);
  }

  @Patch(':id')
  @Roles(...MANAGE_ROLES)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePublicationDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.publications.update(id, dto, request.user as AuthenticatedUser);
  }

  /** Publica y difunde al segmento por el hub de notificaciones. */
  @Post(':id/publish')
  @HttpCode(HttpStatus.OK)
  @Roles(...MANAGE_ROLES)
  publish(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.publications.publish(id, request.user as AuthenticatedUser);
  }

  /** CU-26: registra una interacción agregada (vista, lectura o clic). */
  @Post(':id/metrics')
  @HttpCode(HttpStatus.OK)
  metric(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PublicationMetricDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.publications.addMetric(
      id,
      dto,
      request.user as AuthenticatedUser,
    );
  }

  @Get(':id/metrics')
  metrics(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.publications.metrics(id, request.user as AuthenticatedUser);
  }
}

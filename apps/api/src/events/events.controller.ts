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
  Query,
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
  AdjustQuotaDto,
  CreateEventDto,
  DeliveryDto,
  EventQueryDto,
  PublishEventDto,
} from './dto/events.dto';
import { EventsService } from './events.service';

const READ_ROLES: AppRole[] = [
  'superadmin',
  'coordinacion',
  'auxiliar',
  'instructor',
];
const MANAGE_ROLES: AppRole[] = ['superadmin', 'coordinacion'];
const DELIVERY_ROLES: AppRole[] = ['superadmin', 'coordinacion', 'auxiliar'];
const CAFETERIA_ROLES: AppRole[] = [
  'superadmin',
  'coordinacion',
  'auxiliar',
  'cafeteria',
];

@Controller('events')
@UseGuards(JwtAuthGuard, RolesGuard, RequireTotpGuard)
export class EventsController {
  constructor(private readonly events: EventsService) {}

  /** CU-10 / RF-12: eventos del centro. */
  @Get()
  @Roles(...READ_ROLES)
  list(@Query() query: EventQueryDto, @Req() request: AuthenticatedRequest) {
    return this.events.list(request.user as AuthenticatedUser, query);
  }

  @Post()
  @Roles(...MANAGE_ROLES)
  create(
    @Body() dto: CreateEventDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.events.create(dto, request.user as AuthenticatedUser);
  }

  /** Detalle del evento con cupos, participantes y entregas. */
  @Get(':id')
  @Roles(...READ_ROLES)
  detail(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.events.getDetail(request.user as AuthenticatedUser, id);
  }

  /** CU-10 / RF-12: publicar dispara el cálculo de cupos y la convocatoria. */
  @Post(':id/publish')
  @HttpCode(HttpStatus.OK)
  @Roles(...MANAGE_ROLES)
  publish(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PublishEventDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.events.publish(id, dto, request.user as AuthenticatedUser);
  }

  /** CU-13 / RF-16: ajuste de cupos con motivo auditado. */
  @Patch(':id/groups/:eventGroupId/quota')
  @Roles(...MANAGE_ROLES)
  adjustQuota(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('eventGroupId', ParseUUIDPipe) eventGroupId: string,
    @Body() dto: AdjustQuotaDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.events.adjustQuota(
      id,
      eventGroupId,
      dto,
      request.user as AuthenticatedUser,
    );
  }

  /** CU-14 / RF-17 y RF-18: registrar entrega (QR o manual, idempotente). */
  @Post(':id/deliveries')
  @Roles(...DELIVERY_ROLES)
  deliver(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DeliveryDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.events.registerDelivery(
      id,
      dto,
      request.user as AuthenticatedUser,
    );
  }

  /** CU-15 / RF-19: consolidado para cafetería. */
  @Get(':id/cafeteria')
  @Roles(...CAFETERIA_ROLES)
  cafeteria(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.events.cafeteriaSummary(request.user as AuthenticatedUser, id);
  }

  @Post(':id/cafeteria/prepared')
  @HttpCode(HttpStatus.OK)
  @Roles(...CAFETERIA_ROLES)
  markPrepared(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.events.markPrepared(id, request.user as AuthenticatedUser);
  }

  /** CU-16 / RF-20: cierre con cálculo de desperdicio. */
  @Post(':id/close')
  @HttpCode(HttpStatus.OK)
  @Roles(...MANAGE_ROLES)
  close(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.events.close(id, request.user as AuthenticatedUser);
  }
}

/** CU-17 / RF-21: historial de entregas de un aprendiz. */
@Controller('learners')
@UseGuards(JwtAuthGuard, RolesGuard, RequireTotpGuard)
export class LearnerDeliveriesController {
  constructor(private readonly events: EventsService) {}

  @Get(':id/deliveries')
  @Roles(...READ_ROLES)
  history(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.events.learnerHistory(request.user as AuthenticatedUser, id);
  }
}

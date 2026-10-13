import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
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
  CreateTemplateDto,
  PreferencesDto,
  UpdateTemplateDto,
} from './dto/notifications.dto';
import { NotificationsService } from './notifications.service';

const MANAGE_ROLES: AppRole[] = ['superadmin', 'coordinacion'];
const ACUSES_ROLES: AppRole[] = ['superadmin', 'coordinacion', 'auxiliar'];

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard, RequireTotpGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  /** CU-19 / RF-23: plantillas versionadas de mensajes. */
  @Get('notification-templates')
  @Roles(...MANAGE_ROLES)
  listTemplates(@Req() request: AuthenticatedRequest) {
    return this.notifications.listTemplates(
      request.user as AuthenticatedUser,
    );
  }

  @Post('notification-templates')
  @Roles(...MANAGE_ROLES)
  createTemplate(
    @Body() dto: CreateTemplateDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.notifications.createTemplate(
      dto,
      request.user as AuthenticatedUser,
    );
  }

  @Patch('notification-templates/:id')
  @Roles(...MANAGE_ROLES)
  updateTemplate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTemplateDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.notifications.updateTemplate(
      id,
      dto,
      request.user as AuthenticatedUser,
    );
  }

  /** CU-20 / RF-24: preferencias propias de notificación. */
  @Get('me/notification-preferences')
  getPreferences(@Req() request: AuthenticatedRequest) {
    return this.notifications.getMyPreferences(
      request.user as AuthenticatedUser,
    );
  }

  @Put('me/notification-preferences')
  updatePreferences(
    @Body() dto: PreferencesDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.notifications.updateMyPreferences(
      dto,
      request.user as AuthenticatedUser,
    );
  }

  /** CU-21 / RF-26: acuses de entrega de las notificaciones de un evento. */
  @Get('events/:id/notifications')
  @Roles(...ACUSES_ROLES)
  listEventNotifications(
    @Param('id', ParseUUIDPipe) eventId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.notifications.listEventNotifications(
      request.user as AuthenticatedUser,
      eventId,
    );
  }
}

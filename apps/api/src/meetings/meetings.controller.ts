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
  CancelMeetingDto,
  CommitmentStatusDto,
  CreateMeetingDto,
  RsvpDto,
  UpdateMeetingDto,
  UpsertMinutesDto,
} from './dto/meetings.dto';
import { MeetingsService } from './meetings.service';

const MANAGE_ROLES: AppRole[] = ['superadmin', 'coordinacion'];

@Controller('meetings')
@UseGuards(JwtAuthGuard, RolesGuard, RequireTotpGuard)
export class MeetingsController {
  constructor(private readonly meetings: MeetingsService) {}

  /** CU-31: mis invitaciones como convocado. */
  @Get('invited')
  invited(@Req() request: AuthenticatedRequest) {
    return this.meetings.invited(request.user as AuthenticatedUser);
  }

  @Get()
  @Roles(...MANAGE_ROLES)
  list(@Req() request: AuthenticatedRequest) {
    return this.meetings.list(request.user as AuthenticatedUser);
  }

  /** CU-30: agenda y notifica a los convocados. */
  @Post()
  @Roles(...MANAGE_ROLES)
  create(
    @Body() dto: CreateMeetingDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.meetings.create(dto, request.user as AuthenticatedUser);
  }

  @Get(':id')
  get(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.meetings.get(id, request.user as AuthenticatedUser);
  }

  /** CU-30 FA-1: edita y notifica la actualización. */
  @Patch(':id')
  @Roles(...MANAGE_ROLES)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMeetingDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.meetings.update(id, dto, request.user as AuthenticatedUser);
  }

  /** CU-30 FA-1: cancela y notifica la actualización. */
  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @Roles(...MANAGE_ROLES)
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelMeetingDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.meetings.cancel(
      id,
      dto.reason,
      request.user as AuthenticatedUser,
    );
  }

  /** Marca la reunión como realizada (habilita el acta). */
  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  @Roles(...MANAGE_ROLES)
  complete(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.meetings.complete(id, request.user as AuthenticatedUser);
  }

  /** CU-31: confirma o rechaza la asistencia. */
  @Post(':id/rsvp')
  @HttpCode(HttpStatus.OK)
  rsvp(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RsvpDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.meetings.rsvp(id, dto, request.user as AuthenticatedUser);
  }

  /** CU-33: registra o actualiza el acta. */
  @Put(':id/minutes')
  @Roles(...MANAGE_ROLES)
  minutes(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpsertMinutesDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.meetings.upsertMinutes(
      id,
      dto,
      request.user as AuthenticatedUser,
    );
  }

  /** CU-33: marca un compromiso como cumplido. */
  @Patch(':id/minutes/commitments/:commitmentId')
  @Roles(...MANAGE_ROLES)
  commitment(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('commitmentId', ParseUUIDPipe) commitmentId: string,
    @Body() dto: CommitmentStatusDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.meetings.updateCommitment(
      id,
      commitmentId,
      dto.done,
      request.user as AuthenticatedUser,
    );
  }
}

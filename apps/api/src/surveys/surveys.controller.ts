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
  Res,
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
  CreateSurveyDto,
  SubmitSurveyDto,
  UpdateSurveyDto,
} from './dto/surveys.dto';
import { SurveysService } from './surveys.service';

const MANAGE_ROLES: AppRole[] = ['superadmin', 'coordinacion'];

/** Superficie mínima de la respuesta de Fastify usada para exportar CSV. */
interface HeaderReply {
  header(name: string, value: string): unknown;
}

@Controller('surveys')
@UseGuards(JwtAuthGuard, RolesGuard, RequireTotpGuard)
export class SurveysController {
  constructor(private readonly surveys: SurveysService) {}

  /** CU-28: encuestas publicadas aplicables al aprendiz autenticado. */
  @Get('available')
  available(@Req() request: AuthenticatedRequest) {
    return this.surveys.available(request.user as AuthenticatedUser);
  }

  @Get()
  @Roles(...MANAGE_ROLES)
  list(@Req() request: AuthenticatedRequest) {
    return this.surveys.list(request.user as AuthenticatedUser);
  }

  @Post()
  @Roles(...MANAGE_ROLES)
  create(
    @Body() dto: CreateSurveyDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.surveys.create(dto, request.user as AuthenticatedUser);
  }

  @Get(':id')
  @Roles(...MANAGE_ROLES)
  get(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.surveys.get(id, request.user as AuthenticatedUser);
  }

  @Patch(':id')
  @Roles(...MANAGE_ROLES)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSurveyDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.surveys.update(id, dto, request.user as AuthenticatedUser);
  }

  /** CU-27: publica y difunde la invitación al segmento por el hub. */
  @Post(':id/publish')
  @HttpCode(HttpStatus.OK)
  @Roles(...MANAGE_ROLES)
  publish(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.surveys.publish(id, request.user as AuthenticatedUser);
  }

  /** CU-28: envía las respuestas (anónimas sin identificador). */
  @Post(':id/responses')
  @HttpCode(HttpStatus.OK)
  submit(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SubmitSurveyDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.surveys.submit(id, dto, request.user as AuthenticatedUser);
  }

  /** CU-29: resultados agregados por pregunta y segmento. */
  @Get(':id/results')
  @Roles(...MANAGE_ROLES)
  results(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.surveys.results(id, request.user as AuthenticatedUser);
  }

  /** CU-29 FL-3: exportación CSV de los resultados agregados. */
  @Get(':id/results/export')
  @Roles(...MANAGE_ROLES)
  async export(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) reply: HeaderReply,
  ) {
    const { filename, csv } = await this.surveys.exportCsv(
      id,
      request.user as AuthenticatedUser,
    );
    reply.header('Content-Type', 'text/csv; charset=utf-8');
    reply.header('Content-Disposition', `attachment; filename="${filename}"`);
    return csv;
  }
}

import {
  Body,
  Controller,
  Delete,
  Get,
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
import { DirectoryService } from './directory.service';
import { EmergencyContactsService } from './emergency-contacts.service';
import {
  AssignInstructorDto,
  CreateGroupDto,
  GroupQueryDto,
  UpdateGroupDto,
} from './dto/groups.dto';
import {
  CreateLearnerDto,
  GrantConsentDto,
  LearnerQueryDto,
  UpdateLearnerDto,
} from './dto/learners.dto';
import { CreateProgramDto, UpdateProgramDto } from './dto/programs.dto';
import {
  CreateEmergencyContactDto,
  UpdateEmergencyContactDto,
} from './dto/emergency-contacts.dto';

const READ_ROLES: AppRole[] = [
  'superadmin',
  'coordinacion',
  'instructor',
  'auxiliar',
];
const MANAGE_ROLES: AppRole[] = ['superadmin', 'coordinacion'];

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard, RequireTotpGuard)
export class DirectoryController {
  constructor(
    private readonly directory: DirectoryService,
    private readonly emergencyContacts: EmergencyContactsService,
  ) {}

  // ---- Programas ----

  @Get('programs')
  @Roles(...READ_ROLES)
  listPrograms(@Req() request: AuthenticatedRequest) {
    return this.directory.listPrograms(request.user as AuthenticatedUser);
  }

  @Post('programs')
  @Roles(...MANAGE_ROLES)
  createProgram(
    @Body() dto: CreateProgramDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.directory.createProgram(dto, request.user as AuthenticatedUser);
  }

  @Patch('programs/:id')
  @Roles(...MANAGE_ROLES)
  updateProgram(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProgramDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.directory.updateProgram(
      id,
      dto,
      request.user as AuthenticatedUser,
    );
  }

  // ---- Fichas ----

  @Get('groups')
  @Roles(...READ_ROLES)
  listGroups(
    @Query() query: GroupQueryDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.directory.listGroups(
      request.user as AuthenticatedUser,
      query,
    );
  }

  @Get('groups/:id')
  @Roles(...READ_ROLES)
  getGroup(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.directory.getGroupDetail(
      request.user as AuthenticatedUser,
      id,
    );
  }

  @Post('groups')
  @Roles(...MANAGE_ROLES)
  createGroup(
    @Body() dto: CreateGroupDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.directory.createGroup(dto, request.user as AuthenticatedUser);
  }

  @Patch('groups/:id')
  @Roles(...MANAGE_ROLES)
  updateGroup(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGroupDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.directory.updateGroup(
      id,
      dto,
      request.user as AuthenticatedUser,
    );
  }

  // ---- Aprendices ----

  @Get('learners')
  @Roles(...READ_ROLES)
  listLearners(
    @Query() query: LearnerQueryDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.directory.listLearners(
      request.user as AuthenticatedUser,
      query,
    );
  }

  @Post('learners')
  @Roles(...MANAGE_ROLES)
  createLearner(
    @Body() dto: CreateLearnerDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.directory.createLearner(dto, request.user as AuthenticatedUser);
  }

  @Patch('learners/:id')
  @Roles(...MANAGE_ROLES)
  updateLearner(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLearnerDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.directory.updateLearner(
      id,
      dto,
      request.user as AuthenticatedUser,
    );
  }

  // ---- Instructores por ficha ----

  @Post('groups/:id/instructors')
  @Roles(...MANAGE_ROLES)
  assignInstructor(
    @Param('id', ParseUUIDPipe) groupId: string,
    @Body() dto: AssignInstructorDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.directory.assignInstructor(
      groupId,
      dto,
      request.user as AuthenticatedUser,
    );
  }

  @Delete('groups/:id/instructors/:assignmentId')
  @Roles(...MANAGE_ROLES)
  removeInstructor(
    @Param('id', ParseUUIDPipe) groupId: string,
    @Param('assignmentId', ParseUUIDPipe) assignmentId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.directory.removeInstructor(
      groupId,
      assignmentId,
      request.user as AuthenticatedUser,
    );
  }

  // ---- Consentimientos ----

  @Post('learners/:id/consents')
  @Roles(...MANAGE_ROLES)
  grantConsent(
    @Param('id', ParseUUIDPipe) learnerId: string,
    @Body() dto: GrantConsentDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.directory.grantConsent(
      learnerId,
      dto,
      request.user as AuthenticatedUser,
    );
  }

  @Patch('consents/:id/revoke')
  @Roles(...MANAGE_ROLES)
  revokeConsent(
    @Param('id', ParseUUIDPipe) consentId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.directory.revokeConsent(
      consentId,
      request.user as AuthenticatedUser,
    );
  }

  // ---- Contactos de emergencia (M10: RF-28/29) ----

  @Post('learners/:id/emergency-contacts')
  @Roles(...MANAGE_ROLES)
  createEmergencyContact(
    @Param('id', ParseUUIDPipe) learnerId: string,
    @Body() dto: CreateEmergencyContactDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.emergencyContacts.create(
      learnerId,
      dto,
      request.user as AuthenticatedUser,
    );
  }

  @Get('learners/:id/emergency-contacts')
  @Roles(...MANAGE_ROLES)
  listEmergencyContacts(
    @Param('id', ParseUUIDPipe) learnerId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.emergencyContacts.list(
      learnerId,
      request.user as AuthenticatedUser,
    );
  }

  @Patch('emergency-contacts/:id')
  @Roles(...MANAGE_ROLES)
  updateEmergencyContact(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEmergencyContactDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.emergencyContacts.update(
      id,
      dto,
      request.user as AuthenticatedUser,
    );
  }

  @Delete('emergency-contacts/:id')
  @Roles(...MANAGE_ROLES)
  removeEmergencyContact(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.emergencyContacts.remove(
      id,
      request.user as AuthenticatedUser,
    );
  }
}

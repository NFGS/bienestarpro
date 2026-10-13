import {
  Body,
  Controller,
  Get,
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
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CentersService } from './centers.service';
import { CreateCenterDto } from './dto/create-center.dto';
import { UpdateCenterDto } from './dto/update-center.dto';

@Controller('centers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CentersController {
  constructor(private readonly centers: CentersService) {}

  @Get()
  @Roles('superadmin', 'coordinacion')
  list(@Req() request: AuthenticatedRequest) {
    return this.centers.list(request.user as AuthenticatedUser);
  }

  @Post()
  @Roles('superadmin')
  create(
    @Body() dto: CreateCenterDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.centers.create(dto, request.user as AuthenticatedUser);
  }

  @Patch(':id')
  @Roles('superadmin')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCenterDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.centers.update(id, dto, request.user as AuthenticatedUser);
  }
}

import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  AuthService,
  AuthenticatedUser,
  LoginResult,
} from './auth.service';
import { ActivateTotpDto } from './dto/activate-totp.dto';
import { LoginDto } from './dto/login.dto';
import { AuthenticatedRequest, JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /** CU-01 / RF-01: iniciar sesión (documento o correo + contraseña [+ TOTP]). */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto): Promise<LoginResult> {
    return this.auth.login(dto.identifier, dto.password, dto.totpCode);
  }

  /** Sesión actual (para restaurar la sesión en la PWA). */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() request: AuthenticatedRequest): AuthenticatedUser {
    return request.user as AuthenticatedUser;
  }

  /** CU-05 / RF-05: iniciar el enrolamiento del segundo factor. */
  @Post('totp/enroll')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  enrollTotp(@Req() request: AuthenticatedRequest) {
    return this.auth.startTotpEnrollment(request.user as AuthenticatedUser);
  }

  /** CU-05 / RF-05: activar el segundo factor con un código real. */
  @Post('totp/activate')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  activateTotp(
    @Body() dto: ActivateTotpDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.auth.activateTotp(
      request.user as AuthenticatedUser,
      dto.code,
    );
  }
}

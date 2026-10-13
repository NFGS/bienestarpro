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
import { LoginDto } from './dto/login.dto';
import { AuthenticatedRequest, JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /** CU-01 / RF-01: iniciar sesión (documento o correo + contraseña). */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto): Promise<LoginResult> {
    return this.auth.login(dto.identifier, dto.password);
  }

  /** Sesión actual (para restaurar la sesión en la PWA). */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() request: AuthenticatedRequest): AuthenticatedUser {
    return request.user as AuthenticatedUser;
  }
}

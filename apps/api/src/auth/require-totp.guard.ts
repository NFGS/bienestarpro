import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { AuthenticatedRequest } from './jwt-auth.guard';
import { TOTP_REQUIRED_ROLES } from './roles.constants';
import type { AppRole } from './roles.constants';

/**
 * RF-05: los roles con TOTP obligatorio no pueden operar funciones
 * administrativas sin haber verificado el segundo factor (claim `totp`).
 * Debe ejecutarse después de JwtAuthGuard.
 */
@Injectable()
export class RequireTotpGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<AuthenticatedRequest>();
    const user = request.user;
    if (!user || !TOTP_REQUIRED_ROLES.includes(user.role as AppRole)) {
      return true;
    }
    if (request.authPayload?.totp === true) {
      return true;
    }
    throw new ForbiddenException(
      'Debes configurar el segundo factor (TOTP) antes de usar funciones administrativas',
    );
  }
}

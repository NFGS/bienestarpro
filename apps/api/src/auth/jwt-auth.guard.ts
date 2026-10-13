import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { eq } from 'drizzle-orm';
import { DbService } from '../db/db.module';
import { users } from '../db/schema';
import type { AuthenticatedUser } from './auth.service';

/** Petición con usuario autenticado adjunto por el guard. */
export interface AuthenticatedRequest {
  headers: { authorization?: string };
  user?: AuthenticatedUser;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly dbService: DbService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<AuthenticatedRequest>();
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token requerido');
    }
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string }>(
        header.slice(7),
      );
      const [user] = await this.dbService.db
        .select()
        .from(users)
        .where(eq(users.id, payload.sub))
        .limit(1);
      if (!user || user.status !== 'activo') {
        throw new Error('Usuario inactivo o inexistente');
      }
      request.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        centerId: user.centerId,
      };
      return true;
    } catch {
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }
}

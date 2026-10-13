import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { verify } from 'argon2';
import { eq, or } from 'drizzle-orm';
import { DbService } from '../db/db.module';
import { users } from '../db/schema';

/** RF-01: bloqueo tras 5 intentos fallidos, 15 minutos (configurable aquí). */
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

/** Mensaje genérico: nunca revela si la cuenta existe (criterio de RF-01). */
const INVALID_CREDENTIALS = 'Credenciales inválidas';

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: string;
  centerId: string | null;
}

export interface LoginResult {
  accessToken: string;
  user: AuthenticatedUser;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly dbService: DbService,
    private readonly jwt: JwtService,
  ) {}

  async login(identifier: string, password: string): Promise<LoginResult> {
    const [user] = await this.dbService.db
      .select()
      .from(users)
      .where(
        or(
          eq(users.email, identifier.toLowerCase()),
          eq(users.document, identifier),
        ),
      )
      .limit(1);

    if (!user || user.status !== 'activo') {
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
      throw new UnauthorizedException(
        'Cuenta bloqueada temporalmente por intentos fallidos. Intenta de nuevo más tarde.',
      );
    }

    const valid = await verify(user.passwordHash, password);
    if (!valid) {
      const failed = user.failedAttempts + 1;
      const lockedUntil =
        failed >= MAX_FAILED_ATTEMPTS
          ? new Date(Date.now() + LOCK_MINUTES * 60_000)
          : null;
      await this.dbService.db
        .update(users)
        .set({
          failedAttempts: lockedUntil ? 0 : failed,
          lockedUntil,
        })
        .where(eq(users.id, user.id));
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    await this.dbService.db
      .update(users)
      .set({ failedAttempts: 0, lockedUntil: null })
      .where(eq(users.id, user.id));

    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      role: user.role,
      centerId: user.centerId,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        centerId: user.centerId,
      },
    };
  }

  async findById(id: string): Promise<AuthenticatedUser | null> {
    const [user] = await this.dbService.db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    if (!user || user.status !== 'activo') {
      return null;
    }
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      centerId: user.centerId,
    };
  }
}

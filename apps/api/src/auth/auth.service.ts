import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { verify } from 'argon2';
import { eq, or } from 'drizzle-orm';
import { AuditService } from '../audit/audit.service';
import { DbService } from '../db/db.module';
import { users } from '../db/schema';
import {
  createOtpSecret,
  otpauthUrl,
  verifyOtpCode,
} from './otp';
import type { AppRole } from './roles.constants';
import { TOTP_REQUIRED_ROLES } from './roles.constants';
import { decryptSecret, encryptSecret } from './totp-crypto';

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
  /** true cuando el rol exige TOTP y aún no está configurado (RF-05). */
  totpEnrollmentRequired: boolean;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly dbService: DbService,
    private readonly jwt: JwtService,
    private readonly audit: AuditService,
  ) {}

  async login(
    identifier: string,
    password: string,
    totpCode?: string,
  ): Promise<LoginResult> {
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
      await this.audit.record({
        action: 'login.failed',
        entity: 'session',
        actorEmail: user?.email ?? null,
        centerId: user?.centerId ?? null,
        detail: { identifier, reason: 'usuario_no_encontrado_o_inactivo' },
      });
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
      await this.audit.record({
        action: 'login.locked',
        entity: 'session',
        actorId: user.id,
        actorEmail: user.email,
        centerId: user.centerId,
        detail: { identifier },
      });
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
      await this.audit.record({
        action: 'login.failed',
        entity: 'session',
        actorId: user.id,
        actorEmail: user.email,
        centerId: user.centerId,
        detail: {
          identifier,
          reason: 'credenciales_invalidas',
          bloqueada: lockedUntil !== null,
        },
      });
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    await this.dbService.db
      .update(users)
      .set({ failedAttempts: 0, lockedUntil: null })
      .where(eq(users.id, user.id));

    const totpRequired = TOTP_REQUIRED_ROLES.includes(user.role as AppRole);
    let totpVerified = !totpRequired;
    if (totpRequired && user.totpEnabledAt) {
      if (!totpCode) {
        throw new UnauthorizedException({
          message: 'Se requiere el código de verificación',
          code: 'totp_required',
        });
      }
      const validTotp = this.verifyTotpCode(user.totpSecret, totpCode);
      if (!validTotp) {
        await this.audit.record({
          action: 'login.failed',
          entity: 'session',
          actorId: user.id,
          actorEmail: user.email,
          centerId: user.centerId,
          detail: { identifier, reason: 'totp_invalido' },
        });
        throw new UnauthorizedException({
          message: 'Código de verificación inválido',
          code: 'totp_invalid',
        });
      }
      totpVerified = true;
    }

    await this.audit.record({
      action: 'login.success',
      entity: 'session',
      actorId: user.id,
      actorEmail: user.email,
      centerId: user.centerId,
      detail: totpRequired ? { totp: totpVerified } : null,
    });

    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      role: user.role,
      centerId: user.centerId,
      totp: totpVerified,
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
      totpEnrollmentRequired: totpRequired && !user.totpEnabledAt,
    };
  }

  /** CU-05 / RF-05: inicia el enrolamiento del segundo factor (secreto pendiente). */
  async startTotpEnrollment(
    actor: AuthenticatedUser,
  ): Promise<{ otpauthUrl: string; secret: string }> {
    const [row] = await this.dbService.db
      .select()
      .from(users)
      .where(eq(users.id, actor.id))
      .limit(1);
    if (!row || row.status !== 'activo') {
      throw new UnauthorizedException('Usuario no disponible');
    }
    if (row.totpEnabledAt) {
      throw new ConflictException('El segundo factor ya está configurado');
    }
    const secret = createOtpSecret();
    await this.dbService.db
      .update(users)
      .set({ totpSecret: encryptSecret(secret) })
      .where(eq(users.id, actor.id));
    await this.audit.record({
      action: 'totp.enrollment_started',
      entity: 'user',
      entityId: actor.id,
      actorId: actor.id,
      actorEmail: actor.email,
      centerId: actor.centerId,
    });
    return {
      otpauthUrl: otpauthUrl(actor.email, secret),
      secret,
    };
  }

  /** CU-05 / RF-05: activa el segundo factor verificando un código real. */
  async activateTotp(actor: AuthenticatedUser, code: string): Promise<void> {
    const [row] = await this.dbService.db
      .select()
      .from(users)
      .where(eq(users.id, actor.id))
      .limit(1);
    if (!row?.totpSecret) {
      throw new BadRequestException(
        'Primero inicia el enrolamiento del segundo factor',
      );
    }
    if (row.totpEnabledAt) {
      throw new ConflictException('El segundo factor ya está activo');
    }
    const secret = decryptSecret(row.totpSecret);
    if (!verifyOtpCode(code, secret)) {
      throw new UnauthorizedException('Código de verificación inválido');
    }
    await this.dbService.db
      .update(users)
      .set({ totpEnabledAt: new Date() })
      .where(eq(users.id, actor.id));
    await this.audit.record({
      action: 'totp.activated',
      entity: 'user',
      entityId: actor.id,
      actorId: actor.id,
      actorEmail: actor.email,
      centerId: actor.centerId,
    });
  }

  private verifyTotpCode(encrypted: string | null, code: string): boolean {
    if (!encrypted) {
      return false;
    }
    try {
      return verifyOtpCode(code, decryptSecret(encrypted));
    } catch {
      return false;
    }
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

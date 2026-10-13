import { SetMetadata } from '@nestjs/common';
import type { AppRole } from './roles.constants';

export const ROLES_KEY = 'required_roles';

/** Restringe un controlador o ruta a los roles indicados (usar con RolesGuard). */
export const Roles = (...roles: AppRole[]): MethodDecorator & ClassDecorator =>
  SetMetadata(ROLES_KEY, roles);

import {
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { APP_ROLES } from '../../auth/roles.constants';
import type { AppRole } from '../../auth/roles.constants';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsIn([...APP_ROLES])
  role?: AppRole;

  @IsOptional()
  @IsIn(['activo', 'inactivo'])
  status?: 'activo' | 'inactivo';
}

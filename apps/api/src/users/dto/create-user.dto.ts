import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { APP_ROLES } from '../../auth/roles.constants';
import type { AppRole } from '../../auth/roles.constants';

export class CreateUserDto {
  @IsString()
  @MinLength(6)
  @MaxLength(20)
  document!: string;

  @IsEmail()
  @MaxLength(160)
  email!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(120)
  name!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;

  @IsIn([...APP_ROLES])
  role!: AppRole;

  @IsOptional()
  @IsUUID()
  centerId?: string;
}

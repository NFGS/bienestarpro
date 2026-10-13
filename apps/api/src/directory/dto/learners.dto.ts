import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class LearnerQueryDto {
  @IsOptional()
  @IsUUID()
  groupId?: string;
}

export class CreateLearnerDto {
  @IsUUID()
  groupId!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(20)
  document!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(160)
  fullName!: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(160)
  email?: string;
}

export class UpdateLearnerDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  fullName?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(160)
  email?: string;

  @IsOptional()
  @IsIn(['activo', 'retirado'])
  status?: 'activo' | 'retirado';
}

export class GrantConsentDto {
  /** Versión del aviso de privacidad aceptada (RF-11). */
  @IsString()
  @MinLength(3)
  @MaxLength(40)
  policyVersion!: string;
}

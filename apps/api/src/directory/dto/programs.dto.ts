import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateProgramDto {
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  name!: string;
}

export class UpdateProgramDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  name?: string;

  @IsOptional()
  @IsIn(['activo', 'inactivo'])
  status?: 'activo' | 'inactivo';
}

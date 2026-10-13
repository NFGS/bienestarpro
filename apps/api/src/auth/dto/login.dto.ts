import { IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  /** Documento o correo (ADR-0006: login simple para perfiles no técnicos). */
  @IsString()
  @MinLength(4)
  @MaxLength(120)
  identifier!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;
}

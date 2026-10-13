import { IsString, Matches } from 'class-validator';

export class ActivateTotpDto {
  @IsString()
  @Matches(/^\d{6}$/)
  code!: string;
}

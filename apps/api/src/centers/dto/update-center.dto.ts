import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateCenterDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  region?: string;
}

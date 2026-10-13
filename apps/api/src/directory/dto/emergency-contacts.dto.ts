import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateEmergencyContactDto {
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  name!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(60)
  relationship!: string;

  @IsString()
  @Matches(/^[+()\-\s0-9]{7,20}$/)
  phone!: string;
}

export class UpdateEmergencyContactDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(60)
  relationship?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[+()\-\s0-9]{7,20}$/)
  phone?: string;
}

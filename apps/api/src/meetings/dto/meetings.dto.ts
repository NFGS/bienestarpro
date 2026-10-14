import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class MeetingInviteeDto {
  @IsIn(['usuario', 'ficha'])
  inviteeType!: 'usuario' | 'ficha';

  @IsUUID()
  inviteeId!: string;
}

export class CreateMeetingDto {
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsDateString()
  startsAt!: string;

  @IsOptional()
  @IsDateString()
  endsAt?: string;

  /** Lugar físico o enlace virtual. */
  @IsString()
  @MinLength(3)
  @MaxLength(300)
  location!: string;

  /** Momento del recordatorio automático (RF-38). */
  @IsOptional()
  @IsDateString()
  reminderAt?: string;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => MeetingInviteeDto)
  invitees!: MeetingInviteeDto[];
}

export class UpdateMeetingDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(300)
  location?: string;

  @IsOptional()
  @IsDateString()
  reminderAt?: string;

  /** Reemplaza la lista de convocados (solo en reuniones agendadas). */
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => MeetingInviteeDto)
  invitees?: MeetingInviteeDto[];
}

export class RsvpDto {
  @IsIn(['confirmado', 'rechazado'])
  status!: 'confirmado' | 'rechazado';
}

export class CancelMeetingDto {
  @IsOptional()
  @IsString()
  @MaxLength(300)
  reason?: string;
}

export class MinutesCommitmentDto {
  /** Si viene un id existente, el compromiso conserva su estado `done`. */
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(300)
  text!: string;

  @IsOptional()
  @IsBoolean()
  done?: boolean;
}

export class UpsertMinutesDto {
  @IsString()
  @MinLength(3)
  @MaxLength(4000)
  topics!: string;

  @IsArray()
  @IsString({ each: true })
  @MaxLength(160, { each: true })
  attendees!: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MinutesCommitmentDto)
  commitments!: MinutesCommitmentDto[];
}

export class CommitmentStatusDto {
  @IsBoolean()
  done!: boolean;
}

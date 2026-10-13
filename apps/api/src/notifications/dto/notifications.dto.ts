import {
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export const NOTIFICATION_TYPES = [
  'evento_convocatoria',
  'evento_recordatorio',
  'reunion_aviso',
  'generico',
] as const;

export const NOTIFICATION_CHANNELS = ['push', 'whatsapp', 'email'] as const;

export class CreateTemplateDto {
  @IsIn([...NOTIFICATION_TYPES])
  type!: string;

  @IsIn([...NOTIFICATION_CHANNELS])
  channel!: string;

  @IsString()
  @MinLength(5)
  @MaxLength(2000)
  content!: string;
}

export class UpdateTemplateDto {
  @IsString()
  @MinLength(5)
  @MaxLength(2000)
  content!: string;
}

export class PreferencesDto {
  @IsOptional()
  @IsArray()
  @IsIn([...NOTIFICATION_CHANNELS], { each: true })
  channels?: string[];

  @IsOptional()
  @Matches(/^\d{2}:\d{2}$/)
  quietHoursStart?: string;

  @IsOptional()
  @Matches(/^\d{2}:\d{2}$/)
  quietHoursEnd?: string;
}

import {
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { JOURNEYS } from '../../directory/dto/groups.dto';

export class CreateEventDto {
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date!: string;

  @IsIn([...JOURNEYS])
  journey!: string;

  @IsOptional()
  @IsISO8601()
  confirmationDeadline?: string;
}

export class EventQueryDto {
  @IsOptional()
  @IsIn(['borrador', 'activo', 'cerrado'])
  status?: string;
}

export class PublishEventDto {
  @IsOptional()
  @IsISO8601()
  confirmationDeadline?: string;
}

export class AdjustQuotaDto {
  @IsInt()
  @Min(0)
  @Max(10000)
  quota!: number;

  @IsString()
  @MinLength(3)
  @MaxLength(200)
  reason!: string;
}

export class DeliveryDto {
  @IsIn(['qr', 'manual'])
  method!: 'qr' | 'manual';

  /** Método QR: token del aprendiz. */
  @IsOptional()
  @IsUUID()
  qrToken?: string;

  /** Método manual: aprendiz (búsqueda por documento se resuelve en el cliente). */
  @IsOptional()
  @IsUUID()
  learnerId?: string;

  /** Idempotencia para sincronización offline (UUID generado en el cliente). */
  @IsUUID()
  clientUuid!: string;

  /** Motivo (obligatorio en manual; requerido al autorizar excepciones). */
  @IsOptional()
  @IsString()
  @MaxLength(200)
  reason?: string;

  /** Autoriza la entrega sin confirmación previa (CU-14 FA-2). */
  @IsOptional()
  @IsBoolean()
  override?: boolean;
}

export class PublicConfirmationDto {
  @IsUUID()
  token!: string;

  @IsBoolean()
  attending!: boolean;
}

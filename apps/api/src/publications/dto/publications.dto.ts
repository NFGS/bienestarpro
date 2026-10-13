import {
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PublicationSegmentDto {
  @IsIn(['programa', 'ficha', 'jornada'])
  segmentType!: 'programa' | 'ficha' | 'jornada';

  @IsString()
  @MinLength(3)
  @MaxLength(60)
  segmentValue!: string;
}

export class CreatePublicationDto {
  @IsIn(['noticia', 'campana'])
  type!: 'noticia' | 'campana';

  @IsString()
  @MinLength(3)
  @MaxLength(160)
  title!: string;

  @IsString()
  @MinLength(5)
  @MaxLength(2000)
  content!: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PublicationSegmentDto)
  segments?: PublicationSegmentDto[];
}

export class UpdatePublicationDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(2000)
  content?: string;
}

export class PublicationMetricDto {
  @IsIn(['view', 'read', 'click'])
  event!: 'view' | 'read' | 'click';
}

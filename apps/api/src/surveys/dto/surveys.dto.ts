import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class SurveyOptionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  label!: string;
}

export class SurveyQuestionDto {
  @IsString()
  @MinLength(3)
  @MaxLength(300)
  text!: string;

  @IsIn(['unica', 'multiple', 'escala'])
  type!: 'unica' | 'multiple' | 'escala';

  @IsOptional()
  @IsBoolean()
  required?: boolean;

  /** Opciones para unica/multiple. */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SurveyOptionDto)
  options?: SurveyOptionDto[];

  /** Rango para preguntas de escala. */
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  scaleMin?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  scaleMax?: number;
}

export class SurveySegmentDto {
  @IsIn(['programa', 'ficha', 'jornada'])
  segmentType!: 'programa' | 'ficha' | 'jornada';

  @IsString()
  @MinLength(3)
  @MaxLength(60)
  segmentValue!: string;
}

export class CreateSurveyDto {
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  title!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(1000)
  description!: string;

  @IsBoolean()
  anonymous!: boolean;

  /** Umbral de respuestas para desgloses en encuestas anónimas (RN-08). */
  @IsOptional()
  @IsInt()
  @Min(3)
  @Max(100)
  minResponses?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SurveyQuestionDto)
  questions?: SurveyQuestionDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SurveySegmentDto)
  segments?: SurveySegmentDto[];
}

export class UpdateSurveyDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsBoolean()
  anonymous?: boolean;

  @IsOptional()
  @IsInt()
  @Min(3)
  @Max(100)
  minResponses?: number;

  /** Reemplaza la estructura de preguntas (solo en borrador). */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SurveyQuestionDto)
  questions?: SurveyQuestionDto[];

  /** Reemplaza los segmentos (solo en borrador). */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SurveySegmentDto)
  segments?: SurveySegmentDto[];
}

export class SurveyAnswerDto {
  @IsUUID()
  questionId!: string;

  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  optionIds?: string[];

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  scaleValue?: number;
}

export class SubmitSurveyDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => SurveyAnswerDto)
  answers!: SurveyAnswerDto[];
}

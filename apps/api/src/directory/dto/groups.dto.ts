import {
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export const JOURNEYS = ['manana', 'tarde', 'noche'] as const;

export class GroupQueryDto {
  @IsOptional()
  @IsIn([...JOURNEYS])
  journey?: string;

  @IsOptional()
  @IsUUID()
  programId?: string;
}

export class CreateGroupDto {
  @IsUUID()
  programId!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(20)
  code!: string;

  @IsIn([...JOURNEYS])
  journey!: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  startDate?: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  endDate?: string;
}

export class UpdateGroupDto {
  @IsOptional()
  @IsIn(['activa', 'inactiva'])
  status?: 'activa' | 'inactiva';

  @IsOptional()
  @IsIn([...JOURNEYS])
  journey?: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  startDate?: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  endDate?: string;
}

export class AssignInstructorDto {
  @IsUUID()
  instructorId!: string;

  @IsIn(['director', 'instructor'])
  roleInGroup!: 'director' | 'instructor';
}

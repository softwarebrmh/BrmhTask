import {
  IsString, IsOptional, IsUUID, IsEnum, IsDateString,
  IsNumber, Min, IsArray, ArrayUnique, MinLength, MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaskPriority } from '../../../common/enums/task-priority.enum';

export class CreateTaskDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(500)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  parentTaskId?: string;

  @ApiPropertyOptional({ enum: TaskPriority })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  plannedDueDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  plannedEffortPh?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedEffortPh?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  assigneeIds?: string[];
}

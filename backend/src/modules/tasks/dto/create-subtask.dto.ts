import { IsString, IsOptional, IsEnum, IsDateString, IsUUID, IsArray, ArrayUnique, MinLength, MaxLength } from 'class-validator';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { TaskPriority } from '../../../common/enums/task-priority.enum';

export class CreateSubtaskDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(500)
  name: string;

  @ApiPropertyOptional({ enum: TaskPriority })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  assigneeIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  plannedDueDate?: string;
}

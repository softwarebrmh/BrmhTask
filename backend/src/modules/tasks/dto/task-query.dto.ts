import { IsOptional, IsEnum, IsString, IsUUID, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { TaskStatus } from '../../../common/enums/task-status.enum';
import { TaskPriority } from '../../../common/enums/task-priority.enum';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class TaskQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Max(100) @Type(() => Number)
  limit?: number = 20;

  @ApiPropertyOptional({ enum: TaskStatus })
  @IsOptional() @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiPropertyOptional({ enum: TaskPriority })
  @IsOptional() @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiPropertyOptional() @IsOptional() @IsUUID()
  assigneeId?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'UUID or "null" for top-level tasks only' })
  @IsOptional() @IsString()
  parentTaskId?: string;
}

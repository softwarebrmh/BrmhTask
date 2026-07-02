import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TaskPriority } from '../../../common/enums/task-priority.enum';

export class UpdateTaskPriorityDto {
  @ApiProperty({ enum: TaskPriority })
  @IsEnum(TaskPriority)
  priority: TaskPriority;
}

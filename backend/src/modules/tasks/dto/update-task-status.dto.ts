import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TaskStatus } from '../../../common/enums/task-status.enum';

export class UpdateTaskStatusDto {
  @ApiProperty({ enum: TaskStatus })
  @IsEnum(TaskStatus)
  status: TaskStatus;
}

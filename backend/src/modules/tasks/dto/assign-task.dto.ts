import { IsArray, IsUUID, ArrayMinSize, ArrayUnique } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignTaskDto {
  @ApiProperty()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsUUID('4', { each: true })
  assigneeIds: string[];
}

import { IsArray, IsUUID, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReorderStepsDto {
  @ApiProperty()
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  stepIds: string[];
}

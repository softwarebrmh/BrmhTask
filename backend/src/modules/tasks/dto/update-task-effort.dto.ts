import { IsNumber, IsOptional, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTaskEffortDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  actualEffortPh?: number;

  @ApiPropertyOptional({ description: 'Admin only' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedEffortPh?: number;
}

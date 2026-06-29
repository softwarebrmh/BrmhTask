import { IsOptional, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { SprintStatus } from '@prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SprintQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Max(100) @Type(() => Number)
  limit?: number = 20;

  @ApiPropertyOptional({ enum: SprintStatus })
  @IsOptional() @IsEnum(SprintStatus)
  status?: SprintStatus;
}

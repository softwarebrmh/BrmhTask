import { IsOptional, IsEnum, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ProjectStatus } from '@prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ProjectQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Max(100) @Type(() => Number)
  limit?: number = 20;

  @ApiPropertyOptional({ enum: ProjectStatus })
  @IsOptional() @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  search?: string;
}

import { IsOptional, IsEnum, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { StaffStatus } from '@prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class StaffQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Max(100) @Type(() => Number)
  limit?: number = 20;

  @ApiPropertyOptional({ enum: StaffStatus })
  @IsOptional() @IsEnum(StaffStatus)
  status?: StaffStatus;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  search?: string;
}

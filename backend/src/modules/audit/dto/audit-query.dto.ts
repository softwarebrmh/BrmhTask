import { IsOptional, IsEnum, IsUUID, IsDateString, IsInt, Min, Max } from 'class-validator';
import { AuditEntityType } from '@prisma/client';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AuditQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Max(100) @Type(() => Number)
  limit?: number = 50;

  @ApiPropertyOptional({ enum: AuditEntityType })
  @IsOptional() @IsEnum(AuditEntityType)
  entityType?: AuditEntityType;

  @ApiPropertyOptional() @IsOptional() @IsUUID()
  actorId?: string;

  @ApiPropertyOptional() @IsOptional() @IsDateString()
  from?: string;

  @ApiPropertyOptional() @IsOptional() @IsDateString()
  to?: string;
}

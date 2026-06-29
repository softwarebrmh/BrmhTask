import { IsString, IsOptional, MinLength, MaxLength, Matches, IsUrl } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCompanyDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Matches(/^\d{2}:\d{2}$/, { message: 'workingHoursStart must be HH:MM' })
  workingHoursStart?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Matches(/^\d{2}:\d{2}$/, { message: 'workingHoursEnd must be HH:MM' })
  workingHoursEnd?: string;
}

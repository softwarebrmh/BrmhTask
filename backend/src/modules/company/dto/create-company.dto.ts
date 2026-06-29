import { IsString, IsOptional, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCompanyDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ default: 'UTC' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({ default: '09:00' })
  @IsOptional()
  @Matches(/^\d{2}:\d{2}$/, { message: 'workingHoursStart must be HH:MM' })
  workingHoursStart?: string;

  @ApiPropertyOptional({ default: '18:00' })
  @IsOptional()
  @Matches(/^\d{2}:\d{2}$/, { message: 'workingHoursEnd must be HH:MM' })
  workingHoursEnd?: string;
}

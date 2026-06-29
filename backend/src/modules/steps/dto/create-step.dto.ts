import { IsString, IsOptional, IsInt, MinLength, MaxLength, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStepDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}

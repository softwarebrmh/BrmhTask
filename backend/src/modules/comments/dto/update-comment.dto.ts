import { IsString, IsOptional, IsArray, IsUUID, MinLength, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCommentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  content?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  mentionedUserIds?: string[];
}

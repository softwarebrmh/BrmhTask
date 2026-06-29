import { IsString, IsOptional, IsArray, IsUUID, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReplyDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  content: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  mentionedUserIds?: string[];
}

import { IsString, IsOptional, IsArray, IsUUID, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  content: string;

  @ApiPropertyOptional({ description: 'Array of user IDs mentioned in the comment' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  mentionedUserIds?: string[];
}

import { IsEmail } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty()
  @IsEmail()
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;
}

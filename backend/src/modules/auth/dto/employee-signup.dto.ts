import { IsEmail, IsString, IsOptional, MinLength, MaxLength, Matches } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class EmployeeSignupDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  fullName: string;

  @ApiProperty()
  @IsEmail()
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  @Matches(/^(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'Password must contain at least one uppercase letter and one number',
  })
  password: string;

  @ApiProperty({ description: 'Company slug / join code shared by the admin', required: false })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.toLowerCase().trim())
  companySlug?: string;
}

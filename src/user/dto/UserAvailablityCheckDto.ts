import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UserAvailablityCheckDto {
  @ApiPropertyOptional({ example: 'johndoe' })
  @IsOptional()
  @IsString()
  username: string;

  @ApiPropertyOptional({ example: 'john@example.com' })
  @IsOptional()
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: '08012345678' })
  @IsOptional()
  @IsString({ message: 'Phone number must be a string' })
  @Matches(/^[0-9]+$/, { message: 'Phone number must contain only digits' })
  @Length(10, 15, {
    message: 'Phone number must be between 10 and 15 digits long',
  })
  phoneNumber: string;
}

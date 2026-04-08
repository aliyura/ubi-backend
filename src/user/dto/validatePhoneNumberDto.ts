import { IsEmail, IsNotEmpty, IsString, Matches, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ValidatePhoneNumberDto {
  @ApiProperty({ example: '08012345678' })
  @IsString({ message: 'Phone number must be a string' })
  @IsNotEmpty({ message: 'Phone number is required' })
  @Matches(/^[0-9]+$/, { message: 'Phone number must contain only digits' })
  @Length(10, 15, {
    message: 'Phone number must be between 10 and 15 digits long',
  })
  phoneNumber: string;
}

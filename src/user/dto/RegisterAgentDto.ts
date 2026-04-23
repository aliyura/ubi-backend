import {
  IsNotEmpty,
  IsString,
  Length,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterAgentDto {
  @ApiProperty({ example: 'abc123token' })
  @IsNotEmpty()
  @IsString()
  invitationToken: string;

  @ApiProperty({ example: 'John Doe' })
  @IsNotEmpty()
  @IsString()
  fullname: string;

  @ApiProperty({ example: 'johndoe' })
  @IsNotEmpty()
  @IsString()
  username: string;

  @ApiProperty({ example: '08012345678' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9]+$/, { message: 'Phone number must contain only digits' })
  @Length(10, 15, { message: 'Phone number must be between 10 and 15 digits long' })
  phoneNumber: string;

  @ApiProperty({ example: '8-Mar-1995' })
  @IsNotEmpty()
  @IsString()
  @Matches(
    /^(0?[1-9]|[12][0-9]|3[01])-(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-\d{4}$/,
    { message: 'Date of birth must be in format: DD-MMM-YYYY (e.g., 8-Mar-1995)' },
  )
  dateOfBirth: string;

  @ApiProperty({ example: 'StrongPass123!' })
  @IsNotEmpty()
  @IsString()
  @Length(8, 32, { message: 'Password must be between 8 and 32 characters' })
  password: string;
}

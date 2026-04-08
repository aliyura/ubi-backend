import {
  IsNotEmpty,
  IsString,
  Length,
} from 'class-validator';
import { Match } from 'src/decorators/match.decorator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ example: 'johndoe' })
  @IsNotEmpty()
  username: string;

  @ApiProperty({ example: 'NewPass123!' })
  @IsNotEmpty()
  @IsString()
  @Length(8, 32, { message: 'Password must be between 8 and 32 characters' })
  password: string;

  @ApiProperty({ example: 'NewPass123!' })
  @IsNotEmpty()
  @IsString()
  @Match('password', { message: 'Confirm password must match password' })
  confirmPassword: string;
}

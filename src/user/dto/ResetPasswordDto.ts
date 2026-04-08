import {
  IsNotEmpty,
  IsString,
  Length,
} from 'class-validator';
import { Match } from 'src/decorators/match.decorator';

export class ResetPasswordDto {
  @IsNotEmpty()
  username: string;

   @IsNotEmpty()
  @IsString()
  @Length(8, 32, { message: 'Password must be between 8 and 32 characters' })
  password: string;

  @IsNotEmpty()
  @IsString()
  @Match('password', { message: 'Confirm password must match password' })
  confirmPassword: string;
}

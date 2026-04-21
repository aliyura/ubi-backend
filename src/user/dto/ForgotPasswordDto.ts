import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'johndoe' })
  @IsNotEmpty({ message: 'Username is required' })
  @IsString()
  username: string;
}

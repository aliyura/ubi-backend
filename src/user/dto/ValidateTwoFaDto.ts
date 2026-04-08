import { IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ValidateTwoFaDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsNotEmpty({ message: 'Email is required' })
  @Transform(({ value }) => value?.trim().toLowerCase())
  username: string;
}

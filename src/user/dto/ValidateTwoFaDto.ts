import { IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';

export class ValidateTwoFaDto {
  @IsNotEmpty({ message: 'Email is required' })
  @Transform(({ value }) => value?.trim().toLowerCase())
  username: string;
}

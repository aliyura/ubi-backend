import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

export class WalletSetupDto {
  @IsNotEmpty({ message: 'BVN is required' })
  @IsString({ message: 'BVN must be a string' })
  @Matches(/^[0-9]{11}$/, {
    message: 'BVN must be exactly 11 digits',
  })
  bvn: string;

  @IsNotEmpty()
  @IsString()
  state: string;

  @IsNotEmpty()
  @IsString()
  lga: string;

  @IsNotEmpty()
  @IsString()
  houseAddress: string;

  @IsNotEmpty()
  @IsBoolean()
  isBusiness: boolean;

  @IsNotEmpty()
  @IsBoolean()
  gender: string;
}

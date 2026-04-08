import { Exclude } from 'class-transformer';

export class UserEntity {
  @Exclude()
  password: string;

  @Exclude()
  passcode: string;

  @Exclude()
  walletPin: string;

  @Exclude()
  bvn: string;

  @Exclude()
  referredBy: string;

  @Exclude()
  scamTicketCount: string;

  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial);
  }
}

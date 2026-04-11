import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotAcceptableException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { WalletPinDto } from './dto/WalletPinDto';
import {
  ACCOUNT_TYPE,
  BENEFICIARY_TYPE,
  BILL_TYPE,
  CURRENCY,
  TIER_LEVEL,
  Transaction,
  TRANSACTION_CATEGORY,
  TRANSACTION_STATUS,
  TRANSACTION_TYPE,
  User,
  Wallet,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { ChangePinDto } from './dto/ChangePinDto';
import { ApiProviderService } from 'src/api-providers/api-providers.service';
import { ChangePasscodeDto } from './dto/ChangePasscodeDto';
import { EditProfileDto } from './dto/EditProfileDto';
import { ChangePasswordDto } from './dto/ChangePasswordDto';
import { ResetWalletPinDto } from './dto/ResetWalletPinDto';
import { EmailService } from 'src/email/email.service';
import { WalletEntity } from '../wallet/serializer/wallet.serializer';
import { plainToInstance } from 'class-transformer';
import { KycTier2Dto } from './dto/KycTier2Dto';
import { ReportScamDto } from './dto/ReportScamDto';
import {
  subDays,
  format,
  startOfDay,
  startOfMonth,
  startOfYear,
  startOfWeek,
} from 'date-fns';

import {
  TIER_ONE_CUMMULATIVE_BALANCE_LIMIT,
  TIER_ONE_DAILY_CUMMULATIVE_TRANSACTION_LIMIT,
  TIER_THREE_CUMMULATIVE_BALANCE_LIMIT,
  TIER_THREE_DAILY_CUMMULATIVE_TRANSACTION_LIMIT,
  TIER_TWO_CUMMULATIVE_BALANCE_LIMIT,
  TIER_TWO_DAILY_CUMMULATIVE_TRANSACTION_LIMIT,
} from 'src/constants';
import { CreateFarmerAccountDto } from './dto/CreateFarmerAccountDto';
import { KycTier3Dto } from './dto/KycTier3Dto';
import { ValidatePhoneNumberDto } from './dto/validatePhoneNumberDto';
import { VerifyPhoneNumberDto } from './dto/verifyPhoneNumberDto';
import * as NodeCache from 'node-cache';
import { Helpers } from 'src/helpers';
import {
  PasscodeDto,
  RegisterFarmerDto,
  RegisterDto,
  ResetPasswordDto,
  ValidateEmailDto,
  VerifyEmailDto,
} from 'src/user/dto/';
import { UserEntity } from './serializer/user.serializer';
import { REFERRAL_BONUS_PRICE } from 'src/constants';
import { ForgotPasswordDto } from './dto/ForgotPasswordDto';
import { VerifyForgotPasswordDto } from './dto/VerifyForgotPasswordDto';
import { UserAvailablityCheckDto } from './dto/UserAvailablityCheckDto';
import { WalletSetupDto } from 'src/wallet/dto/WalletSetupDto';
import { FileService } from 'src/file/file.service';
import {
  REPORT_SCAM_FILE_UPLOAD_FOLDER_NAME,
  USER_FILE_UPLOAD_FOLDER_NAME,
} from 'src/constants';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  private readonly cache = new NodeCache({ stdTTL: 600, checkperiod: 120 }); // 10m OTP
  private readonly BCRYPT_SALT_ROUNDS = 12;

  constructor(
    private readonly prisma: PrismaService,
    private readonly apiProvider: ApiProviderService,
    private readonly emailService: EmailService,
    private readonly fileService: FileService,
  ) {}

  async register(body: RegisterDto | RegisterFarmerDto) {
    let user: User;
    try {
      user = await this.prisma.$transaction(async (tx) => {
        // check duplicates safely
        const existingUser = await tx.user.findFirst({
          where: {
            OR: [
              { email: body.email },
              { username: body.username },
              { phoneNumber: body.phoneNumber },
            ],
          },
        });

        if (existingUser)
          throw new BadRequestException(
            'User with email, username, or phone number already exists',
          );

        const hashedPassword = await bcrypt.hash(
          String(body.password),
          this.BCRYPT_SALT_ROUNDS,
        );

        //check if phone number and  email are verified
        const emailVerified = this.cache.get(body.email);
        const phoneNumberVerified = this.cache.get(body.phoneNumber);

        const payload: any = {
          fullname: body.fullname,
          username: body.username,
          phoneNumber: body.phoneNumber,
          email: body.email,
          password: hashedPassword,
          referralCode: await this.generateReferralCode(),
          dateOfBirth: body.dateOfBirth,
          accountType: body.accountType,
          isBusiness: body.accountType === ACCOUNT_TYPE.FARMER,
          currency: body.currency ?? 'NGN',
          companyRegistrationNumber:
            body.accountType === ACCOUNT_TYPE.FARMER
              ? (body as RegisterFarmerDto)?.companyRegistrationNumber
              : '',
          isPhoneVerified: phoneNumberVerified == 'verified',
          isEmailVerified: emailVerified == 'verified',
        };

        if (body.referralCode) {
          const referredUser = await tx.user.findFirst({
            where: { referralCode: body.referralCode },
            include: { wallet: true },
          });

          if (!referredUser)
            throw new BadRequestException('Invalid referral code');

          const wallet = referredUser.wallet.find(
            (w) => w.currency === body.currency,
          );
          if (!wallet) throw new BadRequestException('Invalid referral code');

          await tx.wallet.update({
            where: { id: wallet.id },
            data: { balance: wallet.balance + REFERRAL_BONUS_PRICE },
          });

          payload.referredBy = referredUser.id;
        }

        return tx.user.create({ data: payload });
      });
    } catch (error) {
      const errorMessage = String((error as any)?.message || '').toLowerCase();

      if (
        errorMessage.includes('account_type') ||
        errorMessage.includes('invalid input value for enum') ||
        errorMessage.includes('not found in enum')
      ) {
        throw new BadRequestException(
          'Account type configuration is out of sync with the database. Run the latest migrations and try again.',
        );
      }
      throw error;
    }

    // Send OTP + welcome emails
    const otpCode = this.setOtpForUser(user);
    this.sendEmailSafe({
      to: user.email,
      subject: 'Welcome to UBI',
      template: 'auth/welcome-email.hbs',
      context: { firstName: user.fullname.split(' ')[0] },
    });
    this.sendVerificationEmail(user.email, otpCode);

    return {
      message: 'User created successfully',
      user: plainToInstance(UserEntity, user),
      statusCode: HttpStatus.OK,
    };
  }

  async validateEmail(body: ValidateEmailDto) {
    if (body.email && (await this.getUser(body.email)))
      throw new BadRequestException('User with this email already exist');

    const otpCode = Helpers.getCode();
    this.cache.set(body.email, otpCode);

    this.sendVerificationEmail(body.email, otpCode.toString());

    return {
      message: 'Email verification code sent',
      statusCode: HttpStatus.OK,
    };
  }

  async checkUserExistance(body: UserAvailablityCheckDto) {
    if (body.username && (await this.getUser(body.username)))
      throw new BadRequestException('User with this username already exist');
    else if (body.email && (await this.getUser(body.email)))
      throw new BadRequestException('User with this email already exist');
    else if (body.phoneNumber && (await this.getUser(body.phoneNumber)))
      throw new BadRequestException('User with this phoneNumber already exist');

    return {
      message: 'User is available for registration',
      statusCode: HttpStatus.OK,
    };
  }

  async verifyEmail(body: VerifyEmailDto) {
    const savedOtp = this.cache.get(body.email);
    if (savedOtp != body.otpCode)
      throw new BadRequestException('Invalid or expired verification code');

    this.cache.set(body.email, 'verified');

    return {
      message: 'Email verified successfully',
      statusCode: HttpStatus.OK,
    };
  }

  async createPasscode(body: PasscodeDto, user: User) {
    const hashedPasscode = await bcrypt.hash(
      String(body.passcode),
      this.BCRYPT_SALT_ROUNDS,
    );
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passcode: hashedPasscode, isPasscodeSet: true },
    });
    return {
      message: 'Passcode created successfully',
      statusCode: HttpStatus.OK,
    };
  }

  async forgotPassword(body: ForgotPasswordDto) {
    const user = await this.getUser(body.username);
    if (!user) throw new BadRequestException('User does not exist');

    const otpCode = this.setOtpForUser(user);
    this.sendEmailSafe({
      to: user.email,
      subject: 'Reset Your Password - UBI',
      template: 'auth/forgot-password-email.hbs',
      context: { otpCode },
    });

    return { message: 'Password reset email sent', statusCode: HttpStatus.OK };
  }

  async verifyForgotPassword(body: VerifyForgotPasswordDto) {
    const user = await this.getUser(body.username);
    const savedOtp = this.getOtpForUser(user);
    if (savedOtp != body.otpCode)
      throw new BadRequestException('Invalid verification code');
    this.deleteOtpForUser(user);
    return { message: 'OTP verified successfully', statusCode: HttpStatus.OK };
  }

  async resetPassword(body: ResetPasswordDto) {
    const user = await this.getUser(body.username);
    if (!user) throw new BadRequestException('User does not exist');
    if (body.password != body.confirmPassword)
      throw new BadRequestException('Passwords do not match');

    const hashedPassword = await bcrypt.hash(
      String(body.password),
      this.BCRYPT_SALT_ROUNDS,
    );
    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });
    return { message: 'Password reset successful', statusCode: HttpStatus.OK };
  }

  async getBeneficiaries(
    category: BENEFICIARY_TYPE,
    transferType: 'inter' | 'intra',
    billType: BILL_TYPE,
    user: User,
  ) {
    let result: any;

    if (category === BENEFICIARY_TYPE.TRANSFER) {
      const intraStartsWith = 'UBI';

      if (transferType === 'intra') {
        const query = {
          userId: user.id,
          type: category,
          accountName: { startsWith: intraStartsWith },
        };
        console.log('query:', query);

        result = await this.prisma.beneficiary.findMany({
          where: query,
        });
      } else {
        const query = {
          userId: user.id,
          type: category,
          NOT: { accountName: { startsWith: intraStartsWith } },
        };
        console.log('query:', query);

        result = await this.prisma.beneficiary.findMany({
          where: query,
        });
      }
    } else {
      result = await this.prisma.beneficiary.findMany({
        where: { userId: user.id, type: category, billType },
      });
    }

    return {
      message: 'Beneficiary details retrieved successfully',
      statusCode: HttpStatus.OK,
      data: result,
    };
  }

  async getStatisticsLineChart(user: User & { wallet?: Wallet }) {
    const walletId = user?.wallet?.id;
    if (!walletId) {
      return {
        message: 'Statistics retrieved successfully',
        statusCode: HttpStatus.OK,
        data: [],
      };
    }

    const since = startOfDay(subDays(new Date(), 7));
    const [creditTransactions, debitTransactions] = await Promise.all([
      this.prisma.transaction.findMany({
        where: {
          walletId,
          type: TRANSACTION_TYPE.CREDIT,
          status: TRANSACTION_STATUS.success,
          createdAt: { gte: since },
        },
        select: {
          createdAt: true,
          billDetails: true,
          transferDetails: true,
          depositDetails: true,
        },
      }),
      this.prisma.transaction.findMany({
        where: {
          walletId,
          type: TRANSACTION_TYPE.DEBIT,
          status: TRANSACTION_STATUS.success,
          createdAt: { gte: since },
        },
        select: {
          createdAt: true,
          billDetails: true,
          transferDetails: true,
          depositDetails: true,
        },
      }),
    ]);

    const sumAmount = (
      t: Pick<
        Transaction,
        'billDetails' | 'transferDetails' | 'depositDetails'
      >,
    ) =>
      (t?.billDetails as any)?.amountPaid ??
      (t?.transferDetails as any)?.amountPaid ??
      (t?.depositDetails as any)?.amountPaid ??
      0;

    const groupByDate = (txns: any[]) =>
      txns.reduce(
        (acc, t) => {
          const d = format(new Date(t.createdAt), 'dd MMM');
          acc[d] = (acc[d] ?? 0) + sumAmount(t);
          return acc;
        },
        {} as Record<string, number>,
      );

    const [creditGrouped, debitGrouped] = [
      groupByDate(creditTransactions),
      groupByDate(debitTransactions),
    ];

    const last7Days = Array.from({ length: 7 }, (_, i) =>
      format(subDays(new Date(), i), 'dd MMM'),
    ).reverse();

    let cumulativeEarnings = 0;
    let cumulativeDebits = 0;
    const data = last7Days.map((date, i) => {
      const dailyCredit = creditGrouped[date] ?? 0;
      const dailyDebit = debitGrouped[date] ?? 0;
      cumulativeEarnings += dailyCredit;
      cumulativeDebits += dailyDebit;
      return {
        id: i + 1,
        date,
        credits: cumulativeEarnings,
        debits: cumulativeDebits,
      };
    });

    return {
      message: 'Statistics retrieved successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }

  async getStatisticsPieChart(
    user: User & { wallet?: Wallet },
    sort: 'all' | 'today' | 'week' | 'month' | 'year',
  ) {
    const walletId = user?.wallet?.id;
    if (!walletId) {
      return {
        message: 'Statistics retrieved successfully',
        statusCode: HttpStatus.OK,
        data: [
          { id: 1, title: 'Total Deposit', value: 0, color: '#64D284' },
          { id: 2, title: 'Total transfers', value: 0, color: '#FF8D7D' },
          { id: 3, title: 'Total bill payment', value: 0, color: '#C9A62A' },
        ],
      };
    }

    const dateFilter =
      sort === 'today'
        ? startOfDay(new Date())
        : sort === 'week'
          ? startOfWeek(new Date(), { weekStartsOn: 1 })
          : sort === 'month'
            ? startOfMonth(new Date())
            : sort === 'year'
              ? startOfYear(new Date())
              : undefined;

    const transactions = await this.prisma.transaction.findMany({
      where: {
        walletId,
        status: TRANSACTION_STATUS.success,
        ...(dateFilter && { createdAt: { gte: dateFilter } }),
      },
      select: {
        billDetails: true,
        transferDetails: true,
        depositDetails: true,
      },
    });

    const totalFor = (category: TRANSACTION_CATEGORY) =>
      transactions.reduce((acc, t) => {
        if (category === TRANSACTION_CATEGORY.DEPOSIT) {
          return acc + ((t.depositDetails as any)?.amountPaid ?? 0);
        }
        if (category === TRANSACTION_CATEGORY.TRANSFER) {
          return acc + ((t.transferDetails as any)?.amountPaid ?? 0);
        }
        if (category === TRANSACTION_CATEGORY.BILL_PAYMENT) {
          return acc + ((t.billDetails as any)?.amountPaid ?? 0);
        }
        return acc;
      }, 0);

    const [totalDeposit, totalTransfer, totalBillPayment] = [
      totalFor(TRANSACTION_CATEGORY.DEPOSIT),
      totalFor(TRANSACTION_CATEGORY.TRANSFER),
      totalFor(TRANSACTION_CATEGORY.BILL_PAYMENT),
    ];

    return {
      message: 'Statistics retrieved successfully',
      statusCode: HttpStatus.OK,
      data: [
        {
          id: 1,
          title: 'Total Deposit',
          value: totalDeposit,
          color: '#64D284',
        },
        {
          id: 2,
          title: 'Total transfers',
          value: totalTransfer,
          color: '#FF8D7D',
        },
        {
          id: 3,
          title: 'Total bill payment',
          value: totalBillPayment,
          color: '#C9A62A',
        },
      ],
    };
  }

  async setWalletPin(body: WalletPinDto, user: User) {
    const hashedPin = await bcrypt.hash(
      String(body.pin),
      this.BCRYPT_SALT_ROUNDS,
    );
    await this.prisma.user.update({
      where: { id: user.id },
      data: { walletPin: hashedPin, isWalletPinSet: true },
    });
    return {
      message: 'Your 4-digit wallet PIN has been set successfully',
      statusCode: HttpStatus.OK,
    };
  }

  async verifyWalletPin(body: WalletPinDto, user: User) {
    if (!user?.isWalletPinSet)
      throw new BadRequestException('Wallet pin not set');

    const isMatched = await bcrypt.compare(
      String(body.pin),
      user?.walletPin ?? '',
    );
    if (!isMatched) throw new BadRequestException('Incorect pin');

    return {
      message: 'Your 4-digit wallet PIN has been verified successfully',
      statusCode: HttpStatus.OK,
    };
  }

  async verifyNinDetails(nin: string, user: User) {
    let res: any;
    try {
      res = await this.apiProvider.verifyNin(nin);
    } catch (error: any) {
      if (error?.response?.status === 400)
        throw new BadRequestException(error?.response?.data?.error);
      throw new BadRequestException('Invalid nin');
    }

    this.assertNameMatches(
      user?.fullname,
      res?.entity?.first_name,
      res?.entity?.last_name,
    );

    await this.prisma.user.update({
      where: { id: user?.id },
      data: { nin, isNinVerified: true },
    });

    return { message: 'Nin verified successfully', statusCode: HttpStatus.OK };
  }

  async verifyTier2Kyc(body: KycTier2Dto, user: User) {
    let res: any;
    res = await this.apiProvider.verifyNin(body.nin);

    this.assertNameMatches(
      user?.fullname,
      res?.entity?.first_name,
      res?.entity?.last_name,
    );

    await this.prisma.user.update({
      where: { id: user?.id },
      data: {
        nin: body.nin,
        isNinVerified: true,
        tierLevel: TIER_LEVEL.two,
        dailyCummulativeTransactionLimit:
          TIER_TWO_DAILY_CUMMULATIVE_TRANSACTION_LIMIT,
        cummulativeBalanceLimit: TIER_TWO_CUMMULATIVE_BALANCE_LIMIT,
      },
    });

    return {
      message: 'Tier2 kyc verification successful',
      statusCode: HttpStatus.OK,
    };
  }

  async verifyTier3Kyc(body: KycTier3Dto, user: User) {
    let res: any;
    try {
      res = await this.apiProvider.dojahTier3Upgrade(body, user);
    } catch (error: any) {
      this.logger.error('error upgrading to tier3', error?.message || error);
      if (error?.response?.status === 400)
        throw new BadRequestException(error?.response?.data?.error);
      throw error;
    }

    const eq = (a?: string, b?: string) =>
      (a ?? '').toLowerCase() === (b ?? '').toLowerCase();
    if (
      !eq(res?.entity?.state_of_residence, body?.state) ||
      !eq(res?.entity?.residential_address, body?.address) ||
      !eq(res?.entity?.lga_of_residence, body?.city)
    ) {
      throw new BadRequestException('Failed to verify address details');
    }

    await this.prisma.user.update({
      where: { id: user?.id },
      data: {
        address: body?.address,
        state: body?.state,
        city: body?.city,
        isAddressVerified: true,
        tierLevel: TIER_LEVEL.three,
        dailyCummulativeTransactionLimit:
          TIER_THREE_DAILY_CUMMULATIVE_TRANSACTION_LIMIT,
        cummulativeBalanceLimit: TIER_THREE_CUMMULATIVE_BALANCE_LIMIT,
      },
    });

    return {
      message: 'Tier3 kyc verification successful',
      statusCode: HttpStatus.OK,
    };
  }

  async changePin(body: ChangePinDto, user: User) {
    const isValidPin = await bcrypt.compare(
      String(body.oldPin),
      user.walletPin ?? '',
    );
    if (!isValidPin) {
      throw new BadRequestException(
        'The PIN you entered does not match your current PIN. Please try again.',
      );
    }

    if (String(body.newPin) === String(body.oldPin)) {
      throw new BadRequestException(
        'New pin cannot be the same as the old pin',
      );
    }

    const hashedPin = await bcrypt.hash(
      String(body.newPin),
      this.BCRYPT_SALT_ROUNDS,
    );

    await this.prisma.user.update({
      where: { id: user.id },
      data: { walletPin: hashedPin },
    });

    return {
      message: 'Your 4-digit wallet PIN has been successfully updated',
      statusCode: HttpStatus.OK,
    };
  }

  async changePasscode(body: ChangePasscodeDto, user: User) {
    const isValidPasscode = await bcrypt.compare(
      String(body.oldPasscode),
      user.passcode ?? '',
    );
    if (!isValidPasscode) {
      throw new BadRequestException(
        'The Passcode you entered does not match your current Passcode. Please try again.',
      );
    }

    if (body.newPasscode === body.oldPasscode) {
      throw new BadRequestException(
        'New passcode cannot be the same as the old passcode',
      );
    }

    const hashedPasscode = await bcrypt.hash(
      String(body.newPasscode),
      this.BCRYPT_SALT_ROUNDS,
    );
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passcode: hashedPasscode },
    });

    return {
      message: 'Passcode updated successfully',
      statusCode: HttpStatus.OK,
    };
  }

  async requestChangePassword(user: User) {
    const otpToken = this.setOtpForUser(user);

    this.sendEmailSafe({
      to: user.email,
      subject: 'Reset Password - UBI',
      template: 'user/request-change-password.hbs',
      context: { firstName: this.firstNameOf(user?.fullname), otpToken },
    });

    return {
      message: 'Reset password email sent successfully',
      statusCode: HttpStatus.OK,
    };
  }

  async changePassword(request: ChangePasswordDto, user: User) {
    if (request.otpCode) {
      const savedOtp = this.getOtpForUser(user);
      if (savedOtp != request.otpCode) {
        throw new BadRequestException('Invalid otp or expired');
      }
      // optional: delete once used for password change
      this.deleteOtpForUser(user);
    }

    const isValidPassword = await bcrypt.compare(
      String(request.oldPassword),
      user.password ?? '',
    );
    if (!isValidPassword) {
      throw new BadRequestException(
        'The Password you entered does not match your current Password. Please try again.',
      );
    }

    if (request.newPassword === request.oldPassword) {
      throw new BadRequestException(
        'New password cannot be the same as the old password',
      );
    }

    const hashedPassword = await bcrypt.hash(
      String(request.newPassword),
      this.BCRYPT_SALT_ROUNDS,
    );
    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return {
      message: 'Password updated successfully',
      statusCode: HttpStatus.OK,
    };
  }

  async forgetPin(user: User) {
    const otpToken = this.setOtpForUser(user);

    this.sendEmailSafe({
      to: user.email,
      subject: 'Reset Wallet Pin - UBI',
      template: 'user/reset-pin-email.hbs',
      context: {
        firstName: this.firstNameOf(user.fullname),
        otpCode: otpToken,
      },
    });

    return { message: 'Pin reset email sent', statusCode: HttpStatus.OK };
  }

  async resetPin(body: ResetWalletPinDto, user: User) {
    if (body.otpCode) {
      const savedOtp = this.getOtpForUser(user);
      if (savedOtp != body.otpCode) {
        throw new BadRequestException('Invalid otp or expired');
      }
      this.deleteOtpForUser(user);
    }

    if (body.pin != body.confirmPin) {
      throw new BadRequestException(
        'The PIN and confirmation PIN do not match. Please try again.',
      );
    }

    const hashedPin = await bcrypt.hash(
      String(body.pin),
      this.BCRYPT_SALT_ROUNDS,
    );
    await this.prisma.user.update({
      where: { id: user.id },
      data: { walletPin: hashedPin },
    });

    return {
      message: 'Your 4-digit wallet PIN has been reset successfully',
      statusCode: HttpStatus.OK,
    };
  }

  async deleteUserAccount(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId },
      include: { wallet: true },
    });

    if (!user) throw new BadRequestException('User not found');

    if (user.wallet) {
      // keep behavior: attempt provider deletion, then delete user
      this.apiProvider.deleteVirtualAccount(user).then(async () => {
        await this.prisma.user.delete({ where: { id: userId } });
      });
    } else {
      await this.prisma.user.delete({ where: { id: userId } });
    }

    return {
      message: 'Your account has been successfully deleted',
      statusCode: HttpStatus.OK,
    };
  }

  async createAccount(bvn: string, user: User) {
    const newWallet = await this.prisma.$transaction(
      async (trx) => {
        // explicit lock to prevent duplicate naira wallet
        const lockWallet: Wallet[] =
          await trx.$queryRaw`SELECT * FROM wallet WHERE "userId" = ${user?.id}::uuid AND currency = 'NGN' FOR UPDATE LIMIT 1`;

        if (lockWallet.length > 0) {
          throw new NotAcceptableException(
            'Naira wallet has been created before',
          );
        }

        let nairaAccount: any;
        try {
          const request = {
            bvn: bvn,
            state: user.state,
            lga: user.city,
            houseAddress: user.address,
            isBusiness: false,
          } as WalletSetupDto;

          nairaAccount = await this.apiProvider.createVirtualAccount(
            user,
            request,
          );
        } catch (error) {
          this.logger.error('error creating account', error);
          throw error;
        }

        await trx.user.update({
          where: { id: user.id },
          data: {
            isBvnVerified: true,
            bvn,
            tierLevel: TIER_LEVEL.one,
            dailyCummulativeTransactionLimit:
              TIER_ONE_DAILY_CUMMULATIVE_TRANSACTION_LIMIT,
            cummulativeBalanceLimit: TIER_ONE_CUMMULATIVE_BALANCE_LIMIT,
          },
        });

        return trx.wallet.create({
          data: {
            userId: user.id,
            accountName: nairaAccount?.account_name,
            bankName: nairaAccount?.bank_name,
            accountNumber: nairaAccount?.account_number,
            accountRef: nairaAccount?.order_ref,
          },
        });
      },
      { isolationLevel: 'Serializable', timeout: 20000 },
    );

    return {
      message: 'Wallet created succesfully',
      statusCode: HttpStatus.CREATED,
      data: plainToInstance(WalletEntity, newWallet),
    };
  }

  async createFarmerAccount(body: CreateFarmerAccountDto, user: User) {
    if (user?.accountType !== ACCOUNT_TYPE.FARMER)
      throw new BadRequestException('Account type must be of type farmer');

    const newWallet = await this.prisma.$transaction(
      async (trx) => {
        const lockWallet: Wallet[] =
          await trx.$queryRaw`SELECT * FROM wallet WHERE "userId" = ${user?.id}::uuid AND currency = 'NGN' FOR UPDATE LIMIT 1`;

        if (lockWallet.length > 0)
          throw new NotAcceptableException(
            'Naira wallet has been created before',
          );

        let nairaAccount: any;
        try {
          nairaAccount = await this.apiProvider.createVirtualFarmerAccount(
            body?.bvn,
            user,
            body,
          );
        } catch (error) {
          this.logger.error('error creating farmer account', error);
          throw error;
        }

        await trx.user.update({
          where: { id: user.id },
          data: {
            isBvnVerified: true,
            bvn: body.bvn,
            tierLevel: TIER_LEVEL.one,
            // daily/cumulative limits can be set later if needed
          },
        });

        return trx.wallet.create({
          data: {
            userId: user.id,
            accountName: nairaAccount?.account_name,
            bankName: nairaAccount?.bank_name,
            accountNumber: nairaAccount?.account_number,
            accountRef: nairaAccount?.order_ref,
          },
        });
      },
      { isolationLevel: 'Serializable', timeout: 20000 },
    );

    return {
      message: 'Farmer wallet created succesfully',
      statusCode: HttpStatus.CREATED,
      data: plainToInstance(WalletEntity, newWallet),
    };
  }

  async createForeignAccount(currency: CURRENCY, user: User) {
    const wallet = await this.prisma.wallet.findFirst({
      where: { userId: user?.id, currency },
    });
    if (wallet)
      throw new NotAcceptableException(
        'foreign wallet has been created before',
      );

    try {
      await this.apiProvider.createForeignAccout(currency, user);
    } catch (error) {
      this.logger.error('error creating foreign account', error);
      throw error;
    }

    // Keeping original behavior: no wallet persisted here (commented in original)
    return {
      message: 'Wallet created succesfully',
      statusCode: HttpStatus.CREATED,
    };
  }

  async editProfile(
    body: EditProfileDto,
    user: User,
    file: Express.Multer.File,
  ) {
    let uploadedFile: { url: string; fileName: string } | null = null;
    if (file) {
      const uploadResponse = await this.fileService.uploadFile(file, {
        folder: USER_FILE_UPLOAD_FOLDER_NAME,
        prefix: user.id,
      });

      if (!uploadResponse.success || !uploadResponse.data) {
        throw new BadRequestException(uploadResponse.message);
      }

      uploadedFile = uploadResponse.data;
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        fullname: body.fullName,
        phoneNumber: body.phoneNumber,
        profileImageUrl: uploadedFile?.url,
        profileImageFilename: uploadedFile?.fileName,
      },
    });

    return {
      message: 'Profile updated successfully',
      statusCode: HttpStatus.OK,
    };
  }

  async reportScam(body: ReportScamDto, user: User, file: Express.Multer.File) {
    let uploadedFile: { url: string; fileName: string } | null = null;
    if (file) {
      const uploadResponse = await this.fileService.uploadFile(file, {
        folder: REPORT_SCAM_FILE_UPLOAD_FOLDER_NAME,
        prefix: user.id,
      });

      if (!uploadResponse.success || !uploadResponse.data) {
        throw new BadRequestException(uploadResponse.message);
      }

      uploadedFile = uploadResponse.data;
    }

    const ticketRefNumber = (user?.scamTicketCount ?? 0) + 1;

    await this.prisma.$transaction(
      async (trx) => {
        await trx.user.update({
          where: { id: user.id },
          data: { scamTicketCount: ticketRefNumber },
        });

        const ticket = await trx.scamTicket.create({
          data: {
            userId: user?.id,
            ref_number: ticketRefNumber,
            title: body.title,
            screenshotImageUrl: uploadedFile?.url,
            description: body?.description,
          },
        });

        // send acknowledgement (out of TX but here for flow)
        try {
          this.sendEmailSafe({
            to: user.email,
            subject: `#${ticketRefNumber} Ticket Created - ${body.title}`,
            template: 'user/scam-report-email.hbs',
            context: {
              ticketId: ticketRefNumber,
              title: body.title,
              submissionDate: format(
                new Date(ticket?.createdAt),
                "MMMM do, yyyy 'at' h:mm a",
              ),
            },
          });
        } catch (error) {
          this.logger.warn('Error sending ticket email', error);
        }

        return ticket;
      },
      { isolationLevel: 'Serializable' },
    );

    return {
      message: 'Information retrieve successfully',
      statusCode: HttpStatus.OK,
    };
  }

  async validatePhoneNumber(body: ValidatePhoneNumberDto) {
    if (body.phoneNumber && (await this.getUser(body.phoneNumber)))
      throw new BadRequestException('User with this phoneNumber already exist');

    const otpToken = Helpers.getCode();
    this.cache.set(body.phoneNumber, otpToken);

    const otpMessage = `Your UBI verification code is ${otpToken}. Valid for 10 minutes. Do not share this code with anyone.`;
    let res: any;
    try {
      res = await this.apiProvider.sendSms(body.phoneNumber, otpMessage, 'sms');
    } catch (error) {
      this.logger.error('error sending sms', error);
      throw error;
    }

    return {
      message: 'Otp code sent to your phone number',
      statusCode: HttpStatus.OK,
      data: res,
    };
  }

  async verifyPhoneNumber(body: VerifyPhoneNumberDto) {
    const savedOtp = this.cache.get<string>(body.phoneNumber);
    if (savedOtp != body.otpCode) {
      throw new BadRequestException('Invalid otp or expired');
    }
    this.cache.set(body.phoneNumber, 'verified');

    return {
      message: 'Phone number verified successfully',
      statusCode: HttpStatus.OK,
    };
  }

  private setOtpForUser(user: User): string {
    const otp = Helpers.getCode();
    this.cache.set(user.email, otp);
    this.cache.set(user.phoneNumber, otp);
    return otp.toString();
  }

  private getOtpForUser(user: User): string | null {
    return (
      this.cache.get<string>(user.email) ??
      this.cache.get<string>(user.phoneNumber)
    );
  }

  private deleteOtpForUser(user: User) {
    if (user.email) this.cache.del(user.email);
    if (user.phoneNumber) this.cache.del(user.phoneNumber);
  }

  private firstNameOf(fullname?: string): string {
    const first = (fullname ?? '').trim().split(/\s+/)[0] ?? '';
    return first;
  }

  private assertNameMatches(fullname?: string, first?: string, last?: string) {
    const [fn, ln] = (fullname ?? '').trim().split(/\s+/, 2);
    const a = (s?: string) => (s ?? '').toLowerCase();
    const okFirst = a(first) === a(fn) || a(first) === a(ln);
    const okLast = a(last) === a(fn) || a(last) === a(ln);
    if (!okFirst || !okLast) {
      throw new BadRequestException(
        'The provided NIN does not match your first name or last name. Please verify your details and try again.',
      );
    }
  }

  private sendEmailSafe(options: {
    to: string;
    subject: string;
    template: string;
    context?: any;
  }) {
    try {
      this.emailService.sendEmail(options as any);
    } catch (error) {
      this.logger.error(`Email send error to ${options.to}`, error);
    }
  }

  private sendVerificationEmail(email: string, otpCode: string) {
    this.sendEmailSafe({
      to: email,
      subject: 'Verify Your Email Address',
      template: 'auth/verify-email.hbs',
      context: { otpCode, year: new Date().getFullYear() },
    });
  }

  private async generateReferralCode(): Promise<string> {
    const CHAR = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    while (true) {
      const code = Array.from(
        { length: 6 },
        () => CHAR[Math.floor(Math.random() * CHAR.length)],
      ).join('');
      const exists = await this.prisma.user.findFirst({
        where: { referralCode: code },
      });
      if (!exists) return code;
    }
  }

  private async getUser(username: string): Promise<User | null> {
    return await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: username },
          { phoneNumber: username },
          { username: username },
        ],
      },
    });
  }
}

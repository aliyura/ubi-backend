import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { EmailService } from 'src/email/email.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserEntity } from '../user/serializer/user.serializer';
import { plainToInstance } from 'class-transformer';
import { USER_ROLE, User } from '@prisma/client';
import { Helpers } from 'src/helpers';
import * as NodeCache from 'node-cache';
import { LoginDto } from './dto/LoginDto';
import { PasscodeLoginDto } from './dto/PasscodeLoginDto';
import { VerifyEmailDto } from 'src/user/dto/VerifyEmailDto';
import { ValidateTwoFaDto } from 'src/user/dto/ValidateTwoFaDto';
import { VerifyTwoFaDto } from 'src/user/dto/VerifyTwoFaDto';
import { ApiProviderService } from 'src/api-providers/api-providers.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly cache = new NodeCache();
  private readonly OTP_EXPIRES_IN = 600; // 10 minutes
  private readonly ACCESS_TOKEN_EXPIRES_IN = '48h';
  private readonly JWT_SECRET_KEY = 'JWT_SECRET';

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly apiProvider: ApiProviderService,
  ) {}

  async login(body: LoginDto) {
    const user = await this.getUser(body.username);
    if (!user) throw new BadRequestException('Invalid username or password');
    if (!(await bcrypt.compare(body.password, user.password)))
      throw new BadRequestException('Invalid username or password');

    const otpToken = this.setOtpForUser(user);

    let accessToken: string | undefined;
    if (user.enabledTwoFa) {
      const request = {
        username: user.email,
      } as ValidateTwoFaDto;
      await this.sendTwoFa(request);
    } else {
      accessToken = await this.issueAccessToken(user);
      this.sendLoginNotification(user, body);
    }

    return {
      message: 'Login successful',
      user: plainToInstance(UserEntity, user),
      statusCode: HttpStatus.OK,
      accessToken,
    };
  }

  async passcodeLogin(body: PasscodeLoginDto) {
    const user = await this.getUser(body.username);
    if (!user || !user.isPasscodeSet)
      throw new BadRequestException('Invalid or missing passcode');

    if (!(await bcrypt.compare(body.passcode, user.passcode)))
      throw new BadRequestException('Invalid passcode');

    const accessToken = await this.issueAccessToken(user);
    if (body.deviceName && body.ipAddress && body.operatingSystem)
      this.sendLoginNotification(user, body);

    return {
      message: 'Passcode login successful',
      statusCode: HttpStatus.OK,
      user: plainToInstance(UserEntity, user),
      accessToken,
    };
  }

  async sendTwoFa(body: ValidateTwoFaDto) {
    const user = await this.getUser(body.username);
    if (!user) throw new BadRequestException('User does not exist');

    const otpCode = this.setOtpForUser(user);
    //send sms
    this.sendEmailSafe({
      to: user.email,
      subject: 'Your Login Verification Code - UBI',
      template: 'auth/2fa-email.hbs',
      context: { firstName: user.fullname.split(' ')[0], otpCode },
    });

    //send sms
    const otpMessage = `Your UBI verification code is ${otpCode}. Valid for 10 minutes. Do not share this code with anyone.`;
    try {
      await this.apiProvider.sendSms(user.phoneNumber, otpMessage, 'sms');
    } catch (error) {
      this.logger.error('error sending sms', error);
    }

    return { message: '2FA otp sent', statusCode: HttpStatus.OK };
  }

  async verifyTwoFaCode(body: VerifyTwoFaDto) {
    const user = await this.getUser(body.username);
    if (!user) throw new BadRequestException('User does not exist');

    const savedOtp = this.getOtpForUser(user);
    if (savedOtp != body.otpCode && !this.isOtpBypassed(body.otpCode))
      throw new BadRequestException('Invalid otp or expired');

    this.deleteOtpForUser(user);

    const accessToken = await this.issueAccessToken(user);
    return {
      message: '2FA verified successfully',
      statusCode: HttpStatus.OK,
      user: plainToInstance(UserEntity, user),
      accessToken,
    };
  }

  /* =====================
     PRIVATE HELPERS
     ===================== */
  private isOtpBypassed(otpCode: string): boolean {
    const bypass = this.configService.get<string>('OTP_BYPASS_CODE');
    return !!bypass && otpCode === bypass;
  }

  private setOtpForUser(user: User): string {
    const otp = Helpers.getCode();
    this.cache.set(user.email, otp, this.OTP_EXPIRES_IN);
    if (user.phoneNumber)
      this.cache.set(user.phoneNumber, otp, this.OTP_EXPIRES_IN);
    return otp.toString();
  }

  private getOtpForUser(user: User): string | undefined {
    return (
      this.cache.get<string>(user.email) ||
      this.cache.get<string>(user.phoneNumber)
    );
  }

  private deleteOtpForUser(user: User) {
    this.cache.del(user.email);
    if (user.phoneNumber) this.cache.del(user.phoneNumber);
  }

  private async issueAccessToken(user: User): Promise<string> {
    const currentVersion = this.incrementTokenVersion(user);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { tokenVersion: currentVersion },
    });

    if (user.role === USER_ROLE.AGENT) {
      this.prisma.agentActivityLog.create({
        data: {
          agentId: user.id,
          action: 'LOGIN',
          description: 'Agent logged in',
        },
      }).catch(() => {});
    }

    const payload = {
      sub: user.id,
      email: user.email,
      version: currentVersion,
    };
    return this.jwtService.signAsync(payload, {
      secret: this.configService.get(this.JWT_SECRET_KEY),
      expiresIn: this.ACCESS_TOKEN_EXPIRES_IN,
    });
  }

  private sendVerificationEmail(email: string, otpCode: string) {
    this.sendEmailSafe({
      to: email,
      subject: 'Verify Your Email Address',
      template: 'auth/verify-email.hbs',
      context: { otpCode, year: new Date().getFullYear() },
    });
  }

  private sendLoginNotification(user: User, body: any) {
    this.sendEmailSafe({
      to: user.email,
      subject: 'New Login Detected on Your UBI Account',
      template: 'auth/login-email.hbs',
      context: {
        fullname: user.fullname,
        formattedDateTime: this.formatDateTime(new Date()),
        ...body,
        year: new Date().getFullYear(),
      },
    });
  }

  private incrementTokenVersion(user: User): number {
    const MAX_INT = 2147483647;
    return user.tokenVersion >= MAX_INT ? 0 : user.tokenVersion + 1;
  }

  private formatDateTime(date: Date): string {
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
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

  private async getUser(username: string): Promise<User | null> {
    return await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: username },
          { phoneNumber: username },
          { username: username },
        ],
      },
      include: {
        wallet: true,
      },
    });
  }
}

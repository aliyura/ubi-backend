import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { UserService } from './user.service';
import { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerOptions } from 'src/config/multer.config';
import { UserEntity } from 'src/user/serializer/user.serializer';
import { BENEFICIARY_TYPE, BILL_TYPE } from '@prisma/client';
import {
  RegisterDto,
  ValidateEmailDto,
  VerifyEmailDto,
  ResetPasswordDto,
  PasscodeDto,
  RegisterBusinessDto,
  CreateAccountDto,
  CreateBusinessAccountDto,
  CreateForeignAccountDto,
  WalletPinDto,
  NinDto,
  ResetWalletPinDto,
  ReportScamDto,
  KycTier2Dto,
  KycTier3Dto,
  ValidatePhoneNumberDto,
  VerifyPhoneNumberDto,
  EditProfileDto,
  ChangePinDto,
  ChangePasscodeDto,
  ChangePasswordDto,
} from './dto/';
import { ForgotPasswordDto } from './dto/ForgotPasswordDto';
import { VerifyForgotPasswordDto } from './dto/VerifyForgotPasswordDto';
import { UserAvailablityCheckDto } from './dto/UserAvailablityCheckDto';

@Controller('v1/user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() body: RegisterDto) {
    return this.userService.register(body);
  }

  @Post('register-business')
  @HttpCode(HttpStatus.CREATED)
  async registerBusinessAccount(@Body() body: RegisterBusinessDto) {
    return this.userService.register(body);
  }
  @Post('create-passcode')
  async createPasscode(@Body() body: PasscodeDto, @Req() req: Request) {
    const user = req['user'];
    return this.userService.createPasscode(body, user);
  }


  @Post('forgot-password')
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.userService.forgotPassword(body);
  }

  @Post('verify-forgot-password')
  async verifyForgotPassword(@Body() body: VerifyForgotPasswordDto) {
    return this.userService.verifyForgotPassword(body);
  }

  @Post('reset-password')
  async resetPassword(@Body() body: ResetPasswordDto) {
    return this.userService.resetPassword(body);
  }

  @Post('create-account')
  async createAccount(@Body() body: CreateAccountDto, @Req() req: Request) {
    const user = req['user'];
    return this.userService.createAccount(body?.bvn, user);
  }

  @Post('create-business-account')
  async createBusinessAccount(
    @Body() body: CreateBusinessAccountDto,
    @Req() req: Request,
  ) {
    const user = req['user'];
    return this.userService.createBusinessAccount(body, user);
  }

  @Post('create-foreign-account')
  async createForeignAccount(
    @Body() body: CreateForeignAccountDto,
    @Req() req: Request,
  ) {
    const user = req['user'];
    return this.userService.createForeignAccount(body.currency, user);
  }

  @Post('set-wallet-pin')
  async setWalletPin(@Body() body: WalletPinDto, @Req() req: Request) {
    const user = req['user'];
    return this.userService.setWalletPin(body, user);
  }

  @Post('verify-wallet-pin')
  @HttpCode(HttpStatus.OK)
  async verifyWalletPin(@Body() body: WalletPinDto, @Req() req: Request) {
    const user = req['user'];
    return this.userService.verifyWalletPin(body, user);
  }

  @Post('verify-nin')
  @HttpCode(HttpStatus.OK)
  async verifyNin(@Body() body: NinDto, @Req() req: Request) {
    const user = req['user'];
    return this.userService.verifyNinDetails(body.nin, user);
  }

  @Post('forget-pin')
  async forgetPin(@Req() req: Request) {
    const user = req['user'];
    return this.userService.forgetPin(user);
  }

  @Post('reset-pin')
  async resetPin(@Body() body: ResetWalletPinDto, @Req() req: Request) {
    const user = req['user'];
    return this.userService.resetPin(body, user);
  }

  @Post('report-scam')
  @UseInterceptors(FileInterceptor('screenshot', multerOptions('report-scam')))
  async reportScam(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: ReportScamDto,
    @Req() req: Request,
  ): Promise<any> {
    const user = req['user'];
    return this.userService.reportScam(body, user, file);
  }

  @Post('kyc-tier2')
  @HttpCode(HttpStatus.OK)
  async verifyTier2Kyc(@Body() body: KycTier2Dto, @Req() req: Request) {
    const user = req['user'];
    return this.userService.verifyTier2Kyc(body, user);
  }

  @Post('kyc-tier3')
  @HttpCode(HttpStatus.OK)
  async verifyTier3Kyc(@Body() body: KycTier3Dto, @Req() req: Request) {
    const user = req['user'];
    return this.userService.verifyTier3Kyc(body, user);
  }

  @Post('existance-check')
  @HttpCode(HttpStatus.OK)
  async checkUserExistance(@Body() body: UserAvailablityCheckDto) {
    return this.userService.checkUserExistance(body);
  }

  @Post('validate-phonenumber')
  @HttpCode(HttpStatus.OK)
  async validatePhoneNumber(@Body() body: ValidatePhoneNumberDto) {
    return this.userService.validatePhoneNumber(body);
  }

  @Post('verify-phonenumber')
  @HttpCode(HttpStatus.OK)
  async verifyPhoneNumber(@Body() body: VerifyPhoneNumberDto) {
    return this.userService.verifyPhoneNumber(body);
  }

  @Post('validate-email')
  @HttpCode(HttpStatus.OK)
  async validateEmail(@Body() body: ValidateEmailDto) {
    return this.userService.validateEmail(body);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() body: VerifyEmailDto) {
    return this.userService.verifyEmail(body);
  }

  @Put('edit-profile')
  @UseInterceptors(FileInterceptor('profile-image', multerOptions('profile')))
  async editProfile(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: EditProfileDto,
    @Req() req: Request,
  ): Promise<any> {
    const user = req['user'];
    return this.userService.editProfile(body, user, file);
  }

  @Put('change-pin')
  async changePin(@Body() body: ChangePinDto, @Req() req: Request) {
    const user = req['user'];
    return this.userService.changePin(body, user);
  }

  @Put('change-passcode')
  async changePasscode(@Body() body: ChangePasscodeDto, @Req() req: Request) {
    const user = req['user'];
    return this.userService.changePasscode(body, user);
  }

  @Put('change-password')
  async changePassword(@Body() body: ChangePasswordDto, @Req() req: Request) {
    const user = req['user'];
    return this.userService.changePassword(body, user);
  }

  @Delete(':id')
  async deleteAccount(@Param('id') userId: string) {
    return this.userService.deleteUserAccount(userId);
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @Get('me')
  async getDetails(@Req() req: Request) {
    const user = req['user'];
    return new UserEntity(user);
  }

  @Get('get-beneficiaries')
  async getBeneficiaryByCategory(
    @Req() req: Request,
    @Query('category') category: BENEFICIARY_TYPE,
    @Query('transferType') transferType: 'intra' | 'inter',
    @Query('billType') billType: BILL_TYPE,
  ) {
    const user = req['user'];
    return this.userService.getBeneficiaries(
      category,
      transferType,
      billType,
      user,
    );
  }

  @Get('statistics-line-chart')
  async getStatisticsLineChart(@Req() req: Request) {
    const user = req['user'];
    return this.userService.getStatisticsLineChart(user);
  }

  @Get('statistics-pie-chart')
  async getStatisticsPieChart(
    @Req() req: Request,
    @Query('sort') sort: 'all' | 'today' | 'week' | 'month' | 'year',
  ) {
    const user = req['user'];
    return this.userService.getStatisticsPieChart(user, sort);
  }

  @Get('request-change-password')
  async requestChangePassword(@Req() req: Request) {
    const user = req['user'];
    return this.userService.requestChangePassword(user);
  }
}

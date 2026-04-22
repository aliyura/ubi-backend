import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { RolesGuard } from 'src/guards/role.guard';
import { Roles } from 'src/guards/roles.decorator';
import { USER_ROLE } from '@prisma/client';
import {
  ApiBody,
  ApiConsumes,
  ApiExcludeEndpoint,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
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
  RegisterFarmerDto,
  CreateAccountDto,
  CreateFarmerAccountDto,
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
import { userResponse } from './user.response';

@Controller('v1/user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register' })
  @ApiResponse({ status: HttpStatus.CREATED, example: userResponse.register })
  async register(@Body() body: RegisterDto) {
    return this.userService.register(body);
  }

  @Post('register-farmer')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register Farmer Account' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    example: userResponse.registerFarmerAccount,
  })
  async registerFarmerAccount(@Body() body: RegisterFarmerDto) {
    return this.userService.register(body);
  }
  @Post('create-passcode')
  @ApiOperation({ summary: 'Create Passcode' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    example: userResponse.createPasscode,
  })
  async createPasscode(@Body() body: PasscodeDto, @Req() req: Request) {
    const user = req['user'];
    return this.userService.createPasscode(body, user);
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Forgot Password' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    example: userResponse.forgotPassword,
  })
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.userService.forgotPassword(body);
  }

  @Post('verify-forgot-password')
  @ApiOperation({ summary: 'Verify Forgot Password' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    example: userResponse.verifyForgotPassword,
  })
  async verifyForgotPassword(@Body() body: VerifyForgotPasswordDto) {
    return this.userService.verifyForgotPassword(body);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset Password' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    example: userResponse.resetPassword,
  })
  async resetPassword(@Body() body: ResetPasswordDto) {
    return this.userService.resetPassword(body);
  }

  @Post('create-account')
  @ApiOperation({ summary: 'Create Account' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    example: userResponse.createAccount,
  })
  async createAccount(@Body() body: CreateAccountDto, @Req() req: Request) {
    const user = req['user'];
    return this.userService.createAccount(body?.bvn, user);
  }

  @ApiExcludeEndpoint()
  @Post('create-farmer-account')
  @ApiOperation({ summary: 'Create Farmer Account' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    example: userResponse.createFarmerAccount,
  })
  async createFarmerAccount(
    @Body() body: CreateFarmerAccountDto,
    @Req() req: Request,
  ) {
    const user = req['user'];
    return this.userService.createFarmerAccount(body, user);
  }

  @Post('create-foreign-account')
  @ApiOperation({ summary: 'Create Foreign Account' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    example: userResponse.createForeignAccount,
  })
  async createForeignAccount(
    @Body() body: CreateForeignAccountDto,
    @Req() req: Request,
  ) {
    const user = req['user'];
    return this.userService.createForeignAccount(body.currency, user);
  }

  @Post('set-wallet-pin')
  @ApiOperation({ summary: 'Set Wallet Pin' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    example: userResponse.setWalletPin,
  })
  async setWalletPin(@Body() body: WalletPinDto, @Req() req: Request) {
    const user = req['user'];
    return this.userService.setWalletPin(body, user);
  }

  @Post('verify-wallet-pin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify Wallet Pin' })
  @ApiResponse({ status: HttpStatus.OK, example: userResponse.verifyWalletPin })
  async verifyWalletPin(@Body() body: WalletPinDto, @Req() req: Request) {
    const user = req['user'];
    return this.userService.verifyWalletPin(body, user);
  }

  @Post('verify-nin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify Nin' })
  @ApiResponse({ status: HttpStatus.OK, example: userResponse.verifyNin })
  async verifyNin(@Body() body: NinDto, @Req() req: Request) {
    const user = req['user'];
    return this.userService.verifyNinDetails(body.nin, user);
  }

  @Post('forget-pin')
  @ApiOperation({ summary: 'Forget Pin' })
  @ApiResponse({ status: HttpStatus.CREATED, example: userResponse.forgetPin })
  async forgetPin(@Req() req: Request) {
    const user = req['user'];
    return this.userService.forgetPin(user);
  }

  @Post('reset-pin')
  @ApiOperation({ summary: 'Reset Pin' })
  @ApiResponse({ status: HttpStatus.CREATED, example: userResponse.resetPin })
  async resetPin(@Body() body: ResetWalletPinDto, @Req() req: Request) {
    const user = req['user'];
    return this.userService.resetPin(body, user);
  }

  @Post('report-scam')
  @UseInterceptors(FileInterceptor('screenshot', multerOptions('report-scam')))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['title', 'description', 'screenshot'],
      properties: {
        title: {
          type: 'string',
          example: 'Unauthorized debit alert',
        },
        description: {
          type: 'string',
          example: 'I was debited but did not authorize this transfer.',
        },
        screenshot: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiOperation({ summary: 'Report Scam' })
  @ApiResponse({ status: HttpStatus.CREATED, example: userResponse.reportScam })
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
  @ApiOperation({ summary: 'Verify Tier2 Kyc' })
  @ApiResponse({ status: HttpStatus.OK, example: userResponse.verifyTier2Kyc })
  async verifyTier2Kyc(@Body() body: KycTier2Dto, @Req() req: Request) {
    const user = req['user'];
    return this.userService.verifyTier2Kyc(body, user);
  }

  @Post('kyc-tier3')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify Tier3 Kyc' })
  @ApiResponse({ status: HttpStatus.OK, example: userResponse.verifyTier3Kyc })
  async verifyTier3Kyc(@Body() body: KycTier3Dto, @Req() req: Request) {
    const user = req['user'];
    return this.userService.verifyTier3Kyc(body, user);
  }

  @Post('existance-check')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check User Existance' })
  @ApiResponse({
    status: HttpStatus.OK,
    example: userResponse.checkUserExistance,
  })
  async checkUserExistance(@Body() body: UserAvailablityCheckDto) {
    return this.userService.checkUserExistance(body);
  }

  @Post('validate-phonenumber')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate Phone Number' })
  @ApiResponse({
    status: HttpStatus.OK,
    example: userResponse.validatePhoneNumber,
  })
  async validatePhoneNumber(@Body() body: ValidatePhoneNumberDto) {
    return this.userService.validatePhoneNumber(body);
  }

  @Post('verify-phonenumber')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify Phone Number' })
  @ApiResponse({
    status: HttpStatus.OK,
    example: userResponse.verifyPhoneNumber,
  })
  async verifyPhoneNumber(@Body() body: VerifyPhoneNumberDto) {
    return this.userService.verifyPhoneNumber(body);
  }

  @Post('validate-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate Email' })
  @ApiResponse({ status: HttpStatus.OK, example: userResponse.validateEmail })
  async validateEmail(@Body() body: ValidateEmailDto) {
    return this.userService.validateEmail(body);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify Email' })
  @ApiResponse({ status: HttpStatus.OK, example: userResponse.verifyEmail })
  async verifyEmail(@Body() body: VerifyEmailDto) {
    return this.userService.verifyEmail(body);
  }

  @Put('edit-profile')
  @UseInterceptors(FileInterceptor('profile-image', multerOptions('profile')))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['fullName'],
      properties: {
        fullName: {
          type: 'string',
          example: 'John Doe',
        },
        phoneNumber: {
          type: 'string',
          example: '08012345678',
        },
        'profile-image': {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiOperation({ summary: 'Edit Profile' })
  @ApiResponse({ status: HttpStatus.OK, example: userResponse.editProfile })
  async editProfile(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: EditProfileDto,
    @Req() req: Request,
  ): Promise<any> {
    const user = req['user'];
    return this.userService.editProfile(body, user, file);
  }

  @Put('change-pin')
  @ApiOperation({ summary: 'Change Pin' })
  @ApiResponse({ status: HttpStatus.OK, example: userResponse.changePin })
  async changePin(@Body() body: ChangePinDto, @Req() req: Request) {
    const user = req['user'];
    return this.userService.changePin(body, user);
  }

  @Put('change-passcode')
  @ApiOperation({ summary: 'Change Passcode' })
  @ApiResponse({ status: HttpStatus.OK, example: userResponse.changePasscode })
  async changePasscode(@Body() body: ChangePasscodeDto, @Req() req: Request) {
    const user = req['user'];
    return this.userService.changePasscode(body, user);
  }

  @Put('change-password')
  @ApiOperation({ summary: 'Change Password' })
  @ApiResponse({ status: HttpStatus.OK, example: userResponse.changePassword })
  async changePassword(@Body() body: ChangePasswordDto, @Req() req: Request) {
    const user = req['user'];
    return this.userService.changePassword(body, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete Account' })
  @ApiResponse({ status: HttpStatus.OK, example: userResponse.deleteAccount })
  async deleteAccount(@Param('id', ParseUUIDPipe) userId: string) {
    return this.userService.deleteUserAccount(userId);
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @Get('me')
  @ApiOperation({ summary: 'Get Details' })
  @ApiResponse({ status: HttpStatus.OK, example: userResponse.getDetails })
  async getDetails(@Req() req: Request) {
    const user = req['user'];
    return new UserEntity(user);
  }

  @Get('tier')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RolesGuard)
  @Roles(USER_ROLE.USER, USER_ROLE.FARMER)
  @ApiOperation({ summary: 'Get Tier Info' })
  @ApiResponse({ status: HttpStatus.OK, example: userResponse.getTier })
  async getTierInfo(@Req() req: Request) {
    const user = req['user'];
    return this.userService.getTierInfo(user);
  }

  @Get('get-beneficiaries')
  @ApiOperation({ summary: 'Get Beneficiary By Category' })
  @ApiResponse({
    status: HttpStatus.OK,
    example: userResponse.getBeneficiaryByCategory,
  })
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
  @ApiOperation({ summary: 'Get Statistics Line Chart' })
  @ApiResponse({
    status: HttpStatus.OK,
    example: userResponse.getStatisticsLineChart,
  })
  async getStatisticsLineChart(@Req() req: Request) {
    const user = req['user'];
    return this.userService.getStatisticsLineChart(user);
  }

  @Get('statistics-pie-chart')
  @ApiOperation({ summary: 'Get Statistics Pie Chart' })
  @ApiResponse({
    status: HttpStatus.OK,
    example: userResponse.getStatisticsPieChart,
  })
  async getStatisticsPieChart(
    @Req() req: Request,
    @Query('sort') sort: 'all' | 'today' | 'week' | 'month' | 'year',
  ) {
    const user = req['user'];
    return this.userService.getStatisticsPieChart(user, sort);
  }

  @Get('request-change-password')
  @ApiOperation({ summary: 'Request Change Password' })
  @ApiResponse({
    status: HttpStatus.OK,
    example: userResponse.requestChangePassword,
  })
  async requestChangePassword(@Req() req: Request) {
    const user = req['user'];
    return this.userService.requestChangePassword(user);
  }
}

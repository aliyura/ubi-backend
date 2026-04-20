import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiExcludeController,
  ApiExcludeEndpoint,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { Request } from 'express';
import { TransferDto } from './dto/TransferDto';
import {
  CURRENCY,
  TRANSACTION_CATEGORY,
  TRANSACTION_STATUS,
  TRANSACTION_TYPE,
} from '@prisma/client';
import { VerifyAccountDto } from './dto/VerifyAccountDto';
import { BvnVerificationDto } from './dto/BvnVerificationDto';
import { DecodeQrCodeDto } from './dto/DecodeQrCodeDto';
import { walletResponse } from './wallet.response';

@Controller('v1/wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('get-banks/:currency')
  @ApiOperation({ summary: 'Get all banks by currency' })
  @ApiResponse({ status: HttpStatus.OK, example: walletResponse.getAllBanks })
  async getAllBanks(@Param('currency') currency: string) {
    return this.walletService.getAllBanks(currency);
  }

  @ApiExcludeEndpoint()
  @Get('get-matched-banks/:accountNumber')
  @ApiOperation({ summary: 'Get matched banks by account number' })
  @ApiResponse({
    status: HttpStatus.OK,
    example: walletResponse.getAllMatchedBanks,
  })
  async getAllMatchedBanks(@Param('accountNumber') accountNumber: string) {
    return this.walletService.getAllMatchedBanks(accountNumber);
  }

  @Get('get-transfer-fee')
  @ApiOperation({ summary: 'Get transfer fee details' })
  @ApiResponse({
    status: HttpStatus.OK,
    example: walletResponse.getTransferDetails,
  })
  async getTransferDetails(
    @Query('currency') currency: string,
    @Query('amount') amount: number,
    @Query('accountNumber') accountNumber: string,
  ) {
    return this.walletService.fetchTransferFee(currency, amount, accountNumber);
  }

  @Get('transaction')
  @ApiOperation({ summary: 'Get wallet transactions' })
  @ApiResponse({
    status: HttpStatus.OK,
    example: walletResponse.getTransactions,
  })
  async getTransactions(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('type') type: TRANSACTION_TYPE,
    @Query('category') category: TRANSACTION_CATEGORY,
    @Query('status') status: TRANSACTION_STATUS,
    @Query('search') search: string,
    @Req() req: Request,
  ) {
    const user = req['user'];
    return this.walletService.getTransactions(
      page,
      limit,
      type,
      category,
      status,
      search,
      user,
    );
  }

  @Post('verify-account')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify account number' })
  @ApiResponse({
    status: HttpStatus.OK,
    example: walletResponse.verifyAccountNumber,
  })
  async verifyAccountNumber(@Body() body: VerifyAccountDto) {
    return this.walletService.verifyAccount(body);
  }

  @Post('initiate-transfer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Initiate transfer' })
  @ApiResponse({
    status: HttpStatus.OK,
    example: walletResponse.initiateTransfer,
  })
  async initiateTransfer(@Body() body: TransferDto, @Req() req: Request) {
    const user = req['user'];
    return this.walletService.transferFund(body, user);
  }

  @Get('generate-qrcode')
  @ApiOperation({ summary: 'Generate wallet QR code' })
  @ApiResponse({
    status: HttpStatus.OK,
    example: walletResponse.generateQrCode,
  })
  async generateQrCode(@Req() req: Request, @Query('amount') amount: number) {
    const user = req['user'];
    return this.walletService.generateQrCode(user, amount, CURRENCY.NGN);
  }

  @Post('decode-qrcode')
  @ApiOperation({ summary: 'Decode wallet QR code' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    example: walletResponse.decodeQrCode,
  })
  async decodeQrCode(@Body() body: DecodeQrCodeDto) {
    return this.walletService.decodeQrCode(body.qrCode);
  }

  @Post('bvn-verification')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Verify BVN details' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    example: walletResponse.bvnVerification,
  })
  async ValidateBvnVerification(
    @Body() body: BvnVerificationDto,
    @Req() req: Request,
  ) {
    const user = req['user'];
    return this.walletService.bvnVerification(body, user);
  }
}

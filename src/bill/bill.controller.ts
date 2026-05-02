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
  ApiExcludeEndpoint,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { BillService } from './bill.service';
import { PayDto } from './dto/PayDto';
import { GiftCardPayDto } from './dto/GiftCardPayDto';
import { VerifyBillerDto } from './dto/VerifyBillerDto';
import { PayBillDto } from './dto/PayBillDto';
import { GetBeneficiariesDto } from './dto/GetBeneficiariesDto';
import { BILL_TYPE } from '@prisma/client';
import { billResponse } from './bill.response';

@ApiTags('Bill')
@Controller('/v1/bill')
export class BillController {
  constructor(private readonly billService: BillService) {}

  // local airtime
  @Get('airtime/get-plan')
  @ApiOperation({ summary: 'Get Airtime Plan' })
  @ApiResponse({ status: HttpStatus.OK, example: billResponse.getAirtimePlan })
  async getAirtimePlan(
    @Query('phone') phone: string,
    @Query('currency') currency: string,
  ) {
    return this.billService.getAirtimePlan(phone, currency);
  }

  @ApiExcludeEndpoint()
  @Get('airtime/network-providers')
  @ApiOperation({ summary: 'Get Airtime Network Providers' })
  @ApiResponse({
    status: HttpStatus.OK,
    example: billResponse.getAirtimeNetworkProviders,
  })
  async getAirtimeNetworkProviders() {
    return this.billService.getAirtimeNetworkProviders();
  }

  @ApiExcludeEndpoint()
  @Get('data/get-plan/:network')
  @ApiOperation({ summary: 'Get Data Network Providers' })
  @ApiResponse({
    status: HttpStatus.OK,
    example: billResponse.getDataNetworkProviders,
  })
  async getDataNetworkProviders(@Param('network') network: string) {
    return this.billService.getDataPlanByNetwork(network);
  }

  // international airtime
  @ApiExcludeEndpoint()
  @Get('airtime/international/get-plan')
  @ApiOperation({ summary: 'Get International Airtime Plan' })
  @ApiResponse({
    status: HttpStatus.OK,
    example: billResponse.getInternationalAirtimePlan,
  })
  async getInternationalAirtimePlan(@Query('phone') phone: number) {
    return this.billService.getInternationalAirtimePlan(phone);
  }

  @ApiExcludeEndpoint()
  @Get('airtime/international/get-fx-rate')
  @ApiOperation({ summary: 'Get Airtime Fx Rate' })
  @ApiResponse({
    status: HttpStatus.OK,
    example: billResponse.getAirtimeFxRate,
  })
  async getAirtimeFxRate(
    @Query('amount') amount: number,
    @Query('operatorId') operatorId: number,
  ) {
    return this.billService.getAirtimeFxRate(amount, operatorId);
  }

  @Get('data/get-plan')
  @ApiOperation({ summary: 'Get Data Plan' })
  @ApiResponse({ status: HttpStatus.OK, example: billResponse.getDataPlan })
  async getDataPlan(
    @Query('phone') phone: string,
    @Query('currency') currency: string,
  ) {
    return this.billService.getDataPlan(phone, currency);
  }

  @ApiExcludeEndpoint()
  @Get('cable/get-plan')
  @ApiOperation({ summary: 'Get Cabel Plan' })
  @ApiResponse({ status: HttpStatus.OK, example: billResponse.getCabelPlan })
  async getCabelPlan(@Query('currency') currency: string) {
    return this.billService.getCablePlan(currency);
  }

  @ApiExcludeEndpoint()
  @Get('electricity/get-plan')
  @ApiOperation({ summary: 'Get Electricity Plan' })
  @ApiResponse({
    status: HttpStatus.OK,
    example: billResponse.getElectricityPlan,
  })
  async getElectricityPlan(@Query('currency') currency: string) {
    return this.billService.getElectricityPlan(currency);
  }

  @ApiExcludeEndpoint()
  @Get('internet/get-plan')
  @ApiOperation({ summary: 'Get Internet Plan' })
  @ApiResponse({ status: HttpStatus.OK, example: billResponse.getInternetPlan })
  async getInternetPlan(@Query('currency') currency: string) {
    return this.billService.getInternetPlan(currency);
  }

  @ApiExcludeEndpoint()
  @Get('transport/get-plan')
  @ApiOperation({ summary: 'Get Transport Plan' })
  @ApiResponse({
    status: HttpStatus.OK,
    example: billResponse.getTransportPlan,
  })
  async getTransportPlan(@Query('currency') currency: string) {
    return this.billService.getTransportPlan(currency);
  }

  @ApiExcludeEndpoint()
  @Get('school/get-plan')
  @ApiOperation({ summary: 'Get Schoolfee Plan' })
  @ApiResponse({
    status: HttpStatus.OK,
    example: billResponse.getSchoolfeePlan,
  })
  async getSchoolfeePlan(@Query('currency') currency: string) {
    return this.billService.getSchoolfeePlan(currency);
  }

  @ApiExcludeEndpoint()
  @Get('airtime/get-variation')
  @ApiOperation({ summary: 'Get Airtime Variation' })
  @ApiResponse({
    status: HttpStatus.OK,
    example: billResponse.getAirtimeVariation,
  })
  async getAirtimeVariation(@Query('operatorId') operatorId: number) {
    return this.billService.getVariation(operatorId);
  }

  @ApiExcludeEndpoint()
  @Get('data/get-variation')
  @ApiOperation({ summary: 'Get Data Variation' })
  @ApiResponse({
    status: HttpStatus.OK,
    example: billResponse.getDataVariation,
  })
  async getDataVariation(@Query('operatorId') operatorId: number) {
    return this.billService.getVariation(operatorId);
  }

  @Post('data/pay')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Data Pay' })
  @ApiResponse({ status: HttpStatus.OK, example: billResponse.dataPay })
  async dataPay(@Body() body: PayDto, @Req() req: Request) {
    const user = req['user'];
    return this.billService.pay(body, user, BILL_TYPE.data);
  }

  @Post('airtime/pay')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Airtime Pay' })
  @ApiResponse({ status: HttpStatus.OK, example: billResponse.airtimePay })
  async airtimePay(@Body() body: PayDto, @Req() req: Request) {
    const user = req['user'];
    return this.billService.pay(body, user, BILL_TYPE.airtime);
  }

  @ApiExcludeEndpoint()
  @Post('airtime/international/pay')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'International Airtime Pay' })
  @ApiResponse({
    status: HttpStatus.OK,
    example: billResponse.internationalAirtimePay,
  })
  async internationalAirtimePay(@Body() body: PayDto, @Req() req: Request) {
    const user = req['user'];
    return this.billService.pay(body, user, BILL_TYPE.internationalAirtime);
  }

  @ApiExcludeEndpoint()
  @Get('giftcard/get-categories')
  @ApiOperation({ summary: 'Get Gift Card Categories' })
  @ApiResponse({
    status: HttpStatus.OK,
    example: billResponse.getGiftCardCategories,
  })
  async getGiftCardCategories() {
    return this.billService.getGiftCardCategories();
  }

  @ApiExcludeEndpoint()
  @Get('giftcard/get-product')
  @ApiOperation({ summary: 'Get Product By ISOCode' })
  @ApiResponse({
    status: HttpStatus.OK,
    example: billResponse.getProductByISOCode,
  })
  async getProductByISOCode(@Query('currency') currency: string) {
    return this.billService.getProductByISOCode(currency);
  }

  @ApiExcludeEndpoint()
  @Get('giftcard/get-fx-rate')
  @ApiOperation({ summary: 'Get Gift Card Fx Rate' })
  @ApiResponse({
    status: HttpStatus.OK,
    example: billResponse.getGiftCardFxRate,
  })
  async getGiftCardFxRate(
    @Query('amount') amount: number,
    @Query('currency') currency: string,
  ) {
    return this.billService.getGiftCardFxRate(amount, currency);
  }

  @ApiExcludeEndpoint()
  @Get('cable/get-bill-info')
  @ApiOperation({ summary: 'Get Cable Bill Info' })
  @ApiResponse({
    status: HttpStatus.OK,
    example: billResponse.getCableBillInfo,
  })
  async getCableBillInfo(@Query('billerCode') billerCode: string) {
    return this.billService.getBillInfo(billerCode, 'cable');
  }

  @ApiExcludeEndpoint()
  @Get('electricity/get-bill-info')
  @ApiOperation({ summary: 'Get Electricity Bill Info' })
  @ApiResponse({
    status: HttpStatus.OK,
    example: billResponse.getElectricityBillInfo,
  })
  async getElectricityBillInfo(@Query('billerCode') billerCode: string) {
    return this.billService.getBillInfo(billerCode, 'electricity');
  }

  @ApiExcludeEndpoint()
  @Get('internet/get-bill-info')
  @ApiOperation({ summary: 'Get Internet Bill Info' })
  @ApiResponse({
    status: HttpStatus.OK,
    example: billResponse.getInternetBillInfo,
  })
  async getInternetBillInfo(@Query('billerCode') billerCode: string) {
    return this.billService.getBillInfo(billerCode, 'internet');
  }

  @ApiExcludeEndpoint()
  @Get('transport/get-bill-info')
  @ApiOperation({ summary: 'Get Transport Bill Info' })
  @ApiResponse({
    status: HttpStatus.OK,
    example: billResponse.getTransportBillInfo,
  })
  async getTransportBillInfo(@Query('billerCode') billerCode: string) {
    return this.billService.getBillInfo(billerCode, 'transport');
  }

  @ApiExcludeEndpoint()
  @Get('school/get-bill-info')
  @ApiOperation({ summary: 'Get Schoolfee Bill Info' })
  @ApiResponse({
    status: HttpStatus.OK,
    example: billResponse.getSchoolfeeBillInfo,
  })
  async getSchoolfeeBillInfo(@Query('billerCode') billerCode: string) {
    return this.billService.getBillInfo(billerCode, 'schoolfee');
  }

  @ApiExcludeEndpoint()
  @Post('cable/verify-cable-number')
  @ApiOperation({ summary: 'Verify Cable Number' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    example: billResponse.verifyCableNumber,
  })
  async verifyCableNumber(@Body() body: VerifyBillerDto) {
    return this.billService.verifyBillerNumber(body, 'cable');
  }

  @ApiExcludeEndpoint()
  @Post('electricity/verify-meter-number')
  @ApiOperation({ summary: 'Verify Meter Number' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    example: billResponse.verifyMeterNumber,
  })
  async verifyMeterNumber(@Body() body: VerifyBillerDto) {
    return this.billService.verifyBillerNumber(body, 'electricity');
  }

  @ApiExcludeEndpoint()
  @Post('cable/pay')
  @ApiOperation({ summary: 'Cable Pay' })
  @ApiResponse({ status: HttpStatus.CREATED, example: billResponse.cablePay })
  async cablePay(@Body() body: PayBillDto, @Req() req: Request) {
    const user = req['user'];
    return this.billService.pay(body, user, BILL_TYPE.cable);
  }

  @ApiExcludeEndpoint()
  @Post('electricity/pay')
  @ApiOperation({ summary: 'Electricity Pay' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    example: billResponse.electricityPay,
  })
  async electricityPay(@Body() body: PayBillDto, @Req() req: Request) {
    const user = req['user'];
    return this.billService.pay(body, user, BILL_TYPE.electricity);
  }

  @ApiExcludeEndpoint()
  @Post('giftcard/pay')
  @ApiOperation({ summary: 'Giftcard Pay' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    example: billResponse.giftcardPay,
  })
  async giftcardPay(@Body() body: GiftCardPayDto, @Req() req: Request) {
    const user = req['user'];
    return this.billService.pay(body, user, BILL_TYPE.giftcard);
  }

  @ApiExcludeEndpoint()
  @Get('giftcard/get-redeem-code')
  @ApiOperation({ summary: 'Get Gift Card Redeem Code' })
  @ApiResponse({
    status: HttpStatus.OK,
    example: billResponse.getGiftCardRedeemCode,
  })
  async getGiftCardRedeemCode(@Query('transactionId') transactionId: number) {
    return this.billService.redeemGiftCard(transactionId);
  }

  @Get('beneficiary/list')
  @ApiOperation({ summary: 'Get Beneficiaries' })
  @ApiResponse({
    status: HttpStatus.OK,
    example: billResponse.getBeneficiaries,
  })
  async getBeneficiaries(
    @Query() query: GetBeneficiariesDto,
    @Req() req: Request,
  ) {
    const user = req['user'];
    return this.billService.getBenafiaries(user, query.billType);
  }

  @ApiExcludeEndpoint()
  @Post('internet/pay')
  @ApiOperation({ summary: 'Internet Pay' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    example: billResponse.internetPay,
  })
  async internetPay(@Body() body: PayBillDto, @Req() req: Request) {
    const user = req['user'];
    return this.billService.pay(body, user, BILL_TYPE.internet);
  }

  @ApiExcludeEndpoint()
  @Post('transport/pay')
  @ApiOperation({ summary: 'Transport Pay' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    example: billResponse.transportPay,
  })
  async transportPay(@Body() body: PayBillDto, @Req() req: Request) {
    const user = req['user'];
    return this.billService.pay(body, user, BILL_TYPE.transport);
  }

  @ApiExcludeEndpoint()
  @Post('school/pay')
  @ApiOperation({ summary: 'Schoolfee Pay' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    example: billResponse.schoolfeePay,
  })
  async schoolfeePay(@Body() body: PayBillDto, @Req() req: Request) {
    const user = req['user'];
    return this.billService.pay(body, user, BILL_TYPE.schoolfee);
  }
}

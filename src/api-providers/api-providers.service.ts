import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { SafeHavenService } from './providers/safe-haven.service';
import { BILL_TYPE, CURRENCY, User } from '@prisma/client';
import { DojahService } from './providers/dojah.service';
import { FlutterwaveService } from './providers/flutterwave.service';
import { TransferDto } from 'src/wallet/dto/TransferDto';
import { ReloadlyService } from './providers/reloadly.service';
import { PayDto } from 'src/bill/dto/PayDto';
import { VFDBankService } from './providers/VFDBank.service';
import { GiftCardPayDto } from 'src/bill/dto/GiftCardPayDto';
import { VerifyBillerDto } from 'src/bill/dto/VerifyBillerDto';
import { PayBillDto } from 'src/bill/dto/PayBillDto';
import { CreateFarmerAccountDto } from 'src/user/dto/CreateFarmerAccountDto';
import { KycTier3Dto } from 'src/user/dto/KycTier3Dto';
import { ConfigService } from '@nestjs/config';
import { defaultBankName } from 'src/constants';
import { getAllISOCodes } from 'iso-country-currency';
import { GraphService } from './providers/graph.service';
import { HelperService } from './providers/helper.service';
import { BellAccountService } from './providers/bellmfb.service';
import { SmileIdService } from './providers/smile-id.service';
import { WalletSetupDto } from 'src/wallet/dto/WalletSetupDto';
import { BvnVerificationDto } from 'src/wallet/dto/BvnVerificationDto';
import { QoreIdService } from './providers/qoreid.service';
import { String } from 'aws-sdk/clients/acm';

@Injectable()
export class ApiProviderService {
  private readonly logger = new Logger(ApiProviderService.name);

  constructor(
    private readonly flutterwaveService: FlutterwaveService,
    private readonly dojahService: DojahService,
    private readonly qoreidService: QoreIdService,
    private readonly reloadlyService: ReloadlyService,
    private readonly VFDBankService: VFDBankService,
    private readonly safeHavenService: SafeHavenService,
    private readonly graphService: GraphService,
    private readonly configService: ConfigService,
    private readonly helperService: HelperService,
    private readonly bellAccountService: BellAccountService,
    private readonly smileIdService: SmileIdService,
  ) {}

  async sendSms(
    phoneNumber: string,
    message: string,
    channel: 'sms' | 'whatsapp' = 'sms',
  ) {
    const maskedPhone = phoneNumber.slice(-4).padStart(phoneNumber.length, '*');

    if (this.configService.get<string>('BYPASS_SMS') === 'true') {
      this.logger.warn(
        `[SMS BYPASS] Simulated SMS to: ${maskedPhone} — no real message sent`,
      );
      return {
        status: 'simulated',
        message: 'SMS delivery simulated (BYPASS_SMS=true)',
      };
    }

    const sender = (process.env.SMS_SENDER_PROVIDER || 'sendar') as
      | 'dojah'
      | 'termii'
      | 'sendar';
    this.logger.log(`Sending SMS via provider: ${sender} to: ${maskedPhone}`);
    return this.helperService.sendSms(phoneNumber, message, sender, channel);
  }

  async getSafeHavenBankName(bankCode: string) {
    return this.safeHavenService.getBankName(bankCode);
  }
  async getBellBankName(bankCode: string) {
    return this.bellAccountService.getBankName(bankCode);
  }

  addCountryCode(phoneNumber: string) {
    return this.helperService.addCountryCode(phoneNumber);
  }

  async createVirtualAccount(
    user: User,
    request: WalletSetupDto,
  ): Promise<{
    account_name: string;
    account_number: string;
    bank_name?: string;
    order_ref?: string;
  }> {
    try {
      // flutterwave bank
      const res = await this.flutterwaveService.createVirtualAccount({
        bvn: request.bvn,
        email: user?.email,
        narration: `UBI/${user?.fullname}`,
        is_permanent: true,
      });

      this.logger.log('Flutterwave response:', res);
      return {
        account_name: `UBI/${user?.fullname}`,
        account_number: res?.data?.account_number,
        order_ref: res?.data?.order_ref,
        bank_name: res?.data?.bank_name,
      };

      // // vfd bank
      // const res = await this.VFDBankService.createNoConsentVirtualAccount({
      //   bvn: bvn,
      //   dateOfBirth: user?.dateOfBirth,
      // });

      // console.log('res', res);
      // return {
      //   account_name: `${res?.firstname} ${res?.lastname}`,
      //   account_number: res?.accountNo,
      //   bank_name: 'VFD MFB',
      // };

      //safe haven bank

      // const res = await this.safeHavenService.createSubAccount(
      //   {
      //     phoneNumber: this.addCountryCode(user?.phoneNumber),
      //     emailAddress: user?.email,
      //     externalReference: user?.id,
      //     bvn,
      //     verificationId,
      //     otpCode,
      //     companyRegistrationNumber: user?.companyRegistrationNumber,
      //   },
      //   type ? type : 'personal',
      // );

      // const res = await this.bellAccountService.createIndividualClient({
      //   firstname: user?.fullname.split(' ')[0],
      //   lastname: user?.fullname.split(' ')[1],
      //   phoneNumber: this.addCountryCode(user?.phoneNumber),
      //   address: user?.address,
      //   bvn: String(request.bvn),
      //   gender: request.gender
      //     ? (request.gender.toString().toLowerCase() as 'male' | 'female')
      //     : 'male',
      //   dateOfBirth: user?.dateOfBirth,
      //   emailAddress: user?.email,
      // });

      // console.log('create account res', res);
      // return {
      //   account_name: res?.data?.accountName,
      //   account_number: res?.data?.accountNumber,
      //   bank_name: defaultBankName,
      // };
    } catch (error) {
      console.log('error', error);
      throw new BadRequestException('Failed to create virtual account');
    }
  }

  async createVirtualFarmerAccount(
    bvn: string,
    user: User,
    body: CreateFarmerAccountDto,
  ) {
    return this.flutterwaveService.createVirtualAccount({
      email: user?.email,
      bvn,
      narration: 'Farmer Account',
      is_permanent: true,
    });
  }

  async tier2Upgrade(user: User & { wallet?: any }) {
    return this.VFDBankService.tier2Upgrade({
      accountNumber: user?.wallet?.accountNumber,
      nin: user?.nin,
    });
  }

  async dojahTier3Upgrade(body: KycTier3Dto, user: User) {
    if (this.configService.get<string>('BYPASS_KYC_VERIFICATION') === 'true') {
      this.logger.warn(
        '[KYC BYPASS] Simulated tier3 address verification (no external provider called)',
      );
      return {
        entity: {
          state_of_residence: body?.state,
          residential_address: body?.address,
          lga_of_residence: body?.city,
        },
      };
    }
    return this.dojahService.verifyAddressDetails(
      {
        address: body?.address,
        city: body?.city,
        state: body?.state,
      },
      user,
    );
  }

  async tier3Upgrade(body: KycTier3Dto, user: User & { wallet?: any }) {
    if (user?.tierLevel == 'one') {
      return this.VFDBankService.tier3Upgrade({
        accountNumber: user?.wallet?.accountNumber,
        nin: user?.nin,
        address: body?.address,
      });
    }

    return this.VFDBankService.tier3Upgrade({
      accountNumber: user?.wallet?.accountNumber,
      address: body?.address,
    });
  }

  async deleteVirtualAccount(user: User & { wallet?: any }) {
    return this.flutterwaveService.deleteVirtualAccount(
      user?.wallet?.order_ref,
    );
  }

  async createForeignAccout(currency: CURRENCY, user: User) {
    // return this.flutterwaveService.createForeignAccount({
    //   account_name: `ubi/${user?.fullname}`,
    //   email: user?.email,
    //   // mobilenumber: '010101010',
    //   country: this.getCountryCodeFromCurrency(currency),
    // });
    return this.graphService.createAccount(
      {
        name_first: user?.fullname.split(' ')[0],
        name_last: user?.fullname.split(' ')[1],
        name_other: user?.fullname.split(' ')[2] || 'none',
        phone: user?.phoneNumber,
        email: user?.email,
        dob: user?.dateOfBirth,
      },
      'NG',
      currency,
    );
  }

  async verifyBvn(bvn: string) {
    return this.dojahService.validateBvn(bvn);
  }

  async verifyBvnWithFace(request: BvnVerificationDto) {
    return this.qoreidService.verifyBvnFace(request);
  }

  async getAllBanks(currency: string) {
    return this.flutterwaveService.getAllBanks();
  }

  async verifyAccount(accountNumber: string, bankCode: string) {
    return await this.flutterwaveService.getNameEquiry(bankCode, accountNumber);
  }

  async verifyNinWithSelfie(nin: string, selfieBase64: string) {
    return this.dojahService.verifyNinWithSelfie({
      selfie_image: selfieBase64,
      nin,
    });
  }

  async verifyNin(nin: string) {
    if (this.configService.get<string>('BYPASS_KYC_VERIFICATION') === 'true') {
      this.logger.warn(
        '[KYC BYPASS] Simulated NIN verification (no external provider called)',
      );
      return {
        entity: {
          first_name: 'bypass',
          last_name: 'bypass',
        },
      };
    }
    return this.dojahService.verifyNin({ nin });
  }

  async bvnLookUp(bvn: string) {
    return this.dojahService.bvnLookUp(bvn);
  }

  async transferFlutterwaveFund(
    body: TransferDto,
    debitAccountNumber: string,
    debitAccountName: string,
    trx_ref?: string,
  ) {
    return this.flutterwaveService.initiateTransfer({
      account_bank: body.bankCode,
      account_number: body.accountNumber,
      amount: body.amount,
      currency: body.currency,
      debit_subaccount: body.debitSubaccountId,
    });
  }

  async transferVFDFund(
    body: TransferDto,
    type: 'intra' | 'inter',
    user: User & { wallet?: any },
  ) {
    return this.VFDBankService.transferFund({
      fromAccountNo: user?.wallet?.accountNumber,
      toAccountNo: body.accountNumber,
      toBankCode: body.bankCode,
      amount: String(body.amount),
      description: body.description,
      type,
    });
  }

  async transferSafeHavenFund(
    body: TransferDto,
    debitAccountNumber: string,
    debitAccountName: string,
    trx_ref?: string,
  ) {
    return this.safeHavenService.transerFund({
      nameEnquiryReference: body?.sessionId,
      debitAccountNumber: this.configService.get<string>(
        'SAFEHAVE_DEBIT_ACCOUNT_NUMBER',
      ),
      beneficiaryBankCode: body?.bankCode,
      beneficiaryAccountNumber: body?.accountNumber,
      amount: body?.amount,
      narration: body?.description,
      paymentReference: trx_ref,
      saveBeneficiary: body.saveBeneficiary || false,
      debitAccountInfo: {
        debitAccountNumber,
        debitAccountName,
      },
    });
  }

  async transferBellBankFund(
    body: TransferDto,
    debitAccountNumber: string,
    debitAccountName: string,
    trx_ref?: string,
  ) {
    return this.bellAccountService.transerFund({
      nameEnquiryReference: body?.sessionId,
      debitAccountNumber: this.configService.get<string>(
        'SAFEHAVE_DEBIT_ACCOUNT_NUMBER',
      ),
      beneficiaryBankCode: body?.bankCode,
      beneficiaryAccountNumber: body?.accountNumber,
      amount: body?.amount,
      narration: body?.description || 'UBI transaction',
      paymentReference: trx_ref,
      saveBeneficiary: body.saveBeneficiary || false,
      debitAccountInfo: {
        debitAccountNumber,
        debitAccountName,
      },
    });
  }

  async getOperator(operatorId: string) {
    return this.flutterwaveService.getBillers(operatorId);
  }

  async getAutoDetectOperator(phone: number, countryisoCode: string) {
    return this.reloadlyService.getAutoDetectOperator(phone, countryisoCode);
  }

  async purchaseTopup(
    body: PayDto,
    email: string,
    bill_type: BILL_TYPE | string,
    trx_ref?: string,
  ) {
    let amountToUse = body.amount;
    if (bill_type === 'data') {
      const operator = await this.reloadlyService.getOperator(body.operatorId);

      const validAmounts = operator?.fixedAmounts || [];
      if (!validAmounts.length) {
        throw new BadRequestException(
          'No valid amounts found for this operator',
        );
      }
      amountToUse = this.getClosestValidTopupAmount(body.amount, validAmounts);
    }

    return this.flutterwaveService.purchaseBill(
      body.itemCode,
      body.billerCode,
      {
        customer_id: '+234' + body.phone.substring(1),
        country: 'NG',
        amount: amountToUse ?? body.amount,
        reference: trx_ref,
      },
    );
    // return this.reloadlyService.payTopup({
    //   amount: amountToUse ?? body.amount,
    //   useLocalAmount: false,
    //   operatorId: body.operatorId,
    //   recipientEmail: email,
    //   customIdentifier: trx_ref,
    //   recipientPhone: {
    //     countryCode: this.getCountryCodeFromCurrency(body.currency),
    //     number: body.phone,
    //   },
    // });
  }

  async getAirtimeFxRate(amount: number, operatorId: number) {
    return this.reloadlyService.getAirtimeFxRate(amount, operatorId);
  }

  async getGiftCardFxRate(amount: number, currency: string) {
    return this.reloadlyService.getGiftCardFxRate(amount, currency);
  }

  async purchaseGiftcard(
    body: GiftCardPayDto,
    email: string,
    trx_ref?: string,
  ) {
    return this.reloadlyService.orderGiftCard({
      customIdentifier: trx_ref,
      productId: body.productId,
      quantity: body.quantity,
      recipientEmail: email,
      senderName: 'UBI',
      unitPrice: body.unitPrice,
    });
  }

  async redeemGiftCard(transactionId: number) {
    return this.reloadlyService.redeemGiftCard(transactionId);
  }

  async purchaseBill(body: PayBillDto, trx_ref?: string) {
    return this.flutterwaveService.purchaseBill(
      body.itemCode,
      body.billerCode,
      {
        amount: body.amount,
        country: this.getCountryCodeFromCurrency(body.currency),
        customer_id: body.billerNumber,
        reference: trx_ref,
      },
    );
  }

  async purchaseBillWithIdentifier(
    body: PayBillDto,
    userId: string,
    trx_ref?: string,
  ) {
    return this.flutterwaveService.purchaseBill(
      body.itemCode,
      body.billerCode,
      {
        amount: body.amount,
        country: this.getCountryCodeFromCurrency(body.currency),
        customer_id: userId,
        reference: trx_ref,
      },
    );
  }

  async getGiftCardCategories() {
    return this.reloadlyService.getGiftCardCategories();
  }

  async getBillInfo(billerCode: string) {
    return this.flutterwaveService.getBillInfo(billerCode);
  }

  async verifyBillerNumber(body: VerifyBillerDto) {
    return this.flutterwaveService.verifyBillerNumber(body.itemCode, {
      code: body.billerCode,
      customer: body.billerNumber,
    });
  }

  async getProductByISOCode(currency: string) {
    const countrycode = this.getCountryCodeFromCurrency(currency);
    return this.reloadlyService.getGiftCardProductByISOCode(countrycode);
  }

  public getCountryCodeFromCurrency(currency: string): string | null {
    const allIsoCodes = getAllISOCodes();

    console.log(currency);

    const countryCode = allIsoCodes?.find((iso) => iso?.currency === currency);

    return countryCode?.iso || 'NG';
  }

  getClosestValidTopupAmount(
    requestedAmount: number,
    operatorAmounts: number[],
  ) {
    if (!Array.isArray(operatorAmounts) || operatorAmounts.length === 0) {
      throw new BadRequestException(
        'Operator does not have valid fixed amounts',
      );
    }
    // Find the closest match by absolute difference
    let closest = operatorAmounts[0];
    let minDiff = Math.abs(requestedAmount - closest);

    for (const amt of operatorAmounts) {
      const diff = Math.abs(requestedAmount - amt);
      if (diff < minDiff) {
        closest = amt;
        minDiff = diff;
      }
    }
    return closest;
  }

  async verifyBasicKyc(
    userId: string,
    payload: {
      middle_name?: string;
      bvn: string;
      gender?: string;
    },
  ) {
    return this.smileIdService.verifyBasicKyc(userId, {
      ...payload,
      id_type: 'BVN',
    });
  }
}

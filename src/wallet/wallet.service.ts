import {
  BadRequestException,
  ConflictException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotAcceptableException,
  NotFoundException,
} from '@nestjs/common';
import { ApiProviderService } from 'src/api-providers/api-providers.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { TransferDto } from './dto/TransferDto';
import {
  BENEFICIARY_TYPE,
  CURRENCY,
  GENDER,
  Prisma,
  TIER_LEVEL,
  TRANSACTION_CATEGORY,
  TRANSACTION_STATUS,
  TRANSACTION_TYPE,
  User,
  USER_ACCOUNT_STATUS,
  Wallet,
} from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import * as QRCode from 'qrcode';
import { VerifyAccountDto } from './dto/VerifyAccountDto';
import {
  BUSINESS_TIER_ONE_CUMMULATIVE_BALANCE_LIMIT,
  BUSINESS_TIER_ONE_DAILY_CUMMULATIVE_TRANSACTION_LIMIT,
  CONCURRENT_BASE_DELAY,
  CONCURRENT_MAX_RETRIES,
  defaultBankCode,
  defaultBankName,
  TIER_ONE_CUMMULATIVE_BALANCE_LIMIT,
  TIER_ONE_DAILY_CUMMULATIVE_TRANSACTION_LIMIT,
} from 'src/constants';
import * as bcrypt from 'bcrypt';
import { Jimp } from 'jimp';
import jsQR from 'jsqr';
import { EmailService } from 'src/email/email.service';
import { getSMSAlertMessage } from 'src/utils';
import { BvnVerificationDto } from './dto/BvnVerificationDto';
import { WalletSetupDto } from './dto/WalletSetupDto';

@Injectable()
export class WalletService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly apiProvider: ApiProviderService,
    private readonly emailService: EmailService,
  ) {}

  // async onModuleInit() {
  //   console.log('Server starting...');
  //   // Run in background AFTER server starts
  //   setTimeout(async () => {
  //     try {
  //       console.log('Persisting banks in background...');
  //       // await this.prisma.bankAccountCache.deleteMany({});
  //       // /only if you want to reset the bank verification cache
  //       await this.safePersistBanks();
  //       console.log('Bank persistence completed!');
  //     } catch (err) {
  //       console.error('Bank persistence failed:', err);
  //     }
  //   }, 100); // 100ms after startup
  // }

  async safePersistBanks() {
    const responseData: any = await this.apiProvider.getAllBanks('ng');
    const banks = responseData || [];

    const ops = banks.map((bank) =>
      this.prisma.bankNameCache.upsert({
        where: { bankCode: String(bank.bankCode).trim() },
        update: {
          bankName: bank.bankName?.trim() || bank.name || '',
        },
        create: {
          bankCode: String(bank.bankCode).trim(),
          bankName: bank.bankName?.trim() || bank.name || '',
        },
      }),
    );

    const batchSize = 50;
    for (let i = 0; i < ops.length; i += batchSize) {
      const chunk = ops.slice(i, i + batchSize);
      await this.prisma.$transaction(chunk);
    }
    console.log('Banks persisted!');
  }

  async getAllBanks(currency: string) {
    const responseData: any = await this.apiProvider.getAllBanks(currency);

    return {
      message: 'Banks retrieve successfully',
      statusCode: HttpStatus.OK,
      data: responseData,
    };
  }

  async getAllMatchedBanks(accountNumber: string, currency = 'NGN') {
    const cached = await this.prisma.bankAccountCache.findUnique({
      where: { accountNumber },
    });

    if (cached) {
      const verified = await this.apiProvider.verifyAccount(
        accountNumber,
        cached.bankCode,
      );

      let bankNameRecord = verified.bankName;
      if (!verified.bankName) {
        bankNameRecord = await this.prisma.bankNameCache.findUnique({
          where: { bankCode: cached.bankCode },
        });

        if (!bankNameRecord) {
          const responseData = await this.apiProvider.getAllBanks(currency);
          const banks = responseData || [];
          const bank = banks.find((b) => (b.bankCode = cached.bankCode));
          bankNameRecord=bank.name;
        }
      }

      const finalBankName =
        bankNameRecord?.bankName || cached.bankName || 'Unknown Bank';

      const accountData = {
        bankName: finalBankName,
        bankCode: verified.bankCode,
        accountName: verified.accountName,
        accountNumber: verified.accountNumber,
        sessionId: verified.sessionId,
      };
      const matchedBanks = [
        {
          name: accountData.bankName,
          routingKey: accountData.bankCode,
          bankCode: accountData.bankCode,
          categoryId: accountData.bankCode,
        },
      ];

      return {
        message: 'Account verified successfully (cached)',
        statusCode: 200,
        account: accountData,
        data: matchedBanks,
      };
    }

    let banks = await this.prisma.bankNameCache.findMany();

    if (banks.length === 0) {
      const responseData = await this.apiProvider.getAllBanks(currency);
      banks = responseData || [];

      const ops = banks.map((b) =>
        this.prisma.bankNameCache.upsert({
          where: { bankCode: String(b.bankCode).trim() },
          update: { bankName: b.bankName?.trim() || '' },
          create: {
            bankCode: String(b.bankCode).trim(),
            bankName: b.bankName?.trim() || '',
          },
        }),
      );

      const batchSize = 50;
      for (let i = 0; i < ops.length; i += batchSize) {
        await this.prisma.$transaction(ops.slice(i, i + batchSize)); // ✅ FIXED
      }
    }

    const majorBanks = [
      '011',
      '032',
      '057',
      '058',
      '033',
      '044',
      '035',
      '050',
      '070',
      '000014',
      '000026',
      '000027',
    ];

    const microFinanceBanks = [
      '100004',
      '090405',
      '090267',
      '090551',
      '100033',
      '100026',
      '090110',
      '090455',
      '090198',
      '090270',
      '090268',
      '100039',
    ];

    const priorityCodes = microFinanceBanks.map((c) => c.trim());
    const majorCodes = majorBanks.map((c) => c.trim());

    const priorityBanks = priorityCodes
      .map((code) => banks.find((b) => b.bankCode === code))
      .filter(Boolean);

    const majorBankList = majorCodes
      .map((code) => banks.find((b) => b.bankCode === code))
      .filter(Boolean);

    const otherBanks = banks.filter(
      (b) =>
        !priorityCodes.includes(b.bankCode) && !majorCodes.includes(b.bankCode),
    );

    const verifySequential = async (bankList: any[]) => {
      for (const bank of bankList) {
        try {
          const response = await this.apiProvider.verifyAccount(
            accountNumber,
            bank.bankCode,
          );

          if (response?.accountName) return { bank, data: response };
        } catch (_) {}
      }
      return null;
    };

    const verifyConcurrent = async (bankList: any[]) => {
      try {
        return await Promise.any(
          bankList.map(async (bank) => {
            const response = await this.apiProvider.verifyAccount(
              accountNumber,
              bank.bankCode,
            );
            if (response?.accountName) return { bank, data: response };
            throw new Error();
          }),
        );
      } catch {
        return null;
      }
    };

    let match = await verifySequential(priorityBanks);
    if (!match) match = await verifySequential(majorBankList);
    if (!match) match = await verifyConcurrent(otherBanks);

    if (!match) {
      throw new BadRequestException(
        'No matched bank found for this account number',
      );
    }

    const { bank, data } = match;

    let bankNameRecord = data.bankName;
    if (!data.bankName) {
      bankNameRecord = await this.prisma.bankNameCache.findUnique({
        where: { bankCode: data.bankCode },
      });
    }

    const finalBankName =
      bankNameRecord?.bankName || bank.bankName || 'Unknown Bank';

    await this.prisma.bankAccountCache.upsert({
      where: { accountNumber },
      update: {
        accountName: data.accountName,
        bankName: finalBankName,
        routingKey: bank.routingKey,
        categoryId: bank.categoryId,
        bankCode: data.bankCode,
        verifiedAt: new Date(),
      },
      create: {
        accountNumber,
        accountName: data.accountName,
        bankName: finalBankName,
        routingKey: bank.routingKey,
        categoryId: bank.categoryId,
        bankCode: data.bankCode,
      },
    });

    const accountData = {
      bankName: finalBankName,
      bankCode: data.bankCode,
      accountName: data.accountName,
      accountNumber: data.accountNumber,
      sessionId: data.sessionId,
    };
    const matchedBanks = [
      {
        name: accountData.bankName,
        routingKey: accountData.bankCode,
        bankCode: accountData.bankCode,
        categoryId: accountData.bankCode,
      },
    ];

    return {
      message: 'Account matched successfully',
      statusCode: 200,
      account: accountData,
      data: matchedBanks,
    };
  }

  async verifyAccount(body: VerifyAccountDto) {
    let responseData: any;
    try {
      responseData = await this.apiProvider.verifyAccount(
        body.accountNumber,
        body.bankCode ?? defaultBankCode,
      );
      let bankNameRecord = responseData.bankName;

      if (!responseData.bankName) {
        bankNameRecord = await this.prisma.bankNameCache.findUnique({
          where: { bankCode: responseData.bankCode },
        });
      }
      const finalBankName =
        bankNameRecord?.bankName || responseData.bankName || 'Unknown Bank';
      responseData.bankName = finalBankName;

      await this.prisma.bankAccountCache.upsert({
        where: { accountNumber: body.accountNumber },
        update: {
          accountName: responseData.accountName,
          bankName: finalBankName,
          routingKey: responseData.routingKey,
          categoryId: responseData.categoryId,
          bankCode: responseData.bankCode,
          verifiedAt: new Date(),
        },
        create: {
          accountNumber: body.accountNumber,
          accountName: responseData.accountName,
          bankName: finalBankName,
          routingKey: responseData.routingKey,
          categoryId: responseData.categoryId,
          bankCode: responseData.bankCode,
        },
      });
    } catch (error) {
      if (error?.response?.status === 400)
        throw new BadRequestException('Enter a valid account details');

      throw error;
    }

    return {
      message: 'Account details retrieve successfully',
      statusCode: 200,
      data: responseData,
    };
  }

  async generateQrCode(
    user: User & { wallet?: Wallet[] },
    amount: number,
    currency: CURRENCY,
  ) {
    // verify account number to get the sessionId
    let data: any;
    const wallet = user?.wallet?.find((w: Wallet) => w.currency === currency);
    try {
      data = await this.apiProvider.verifyAccount(
        wallet?.accountNumber,
        defaultBankCode,
      );
    } catch (error) {
      console.log('error verifying account number', error);
      throw new BadRequestException('Failed to verify account number');
    }
    // transfer details data
    const transferData = {
      bankCode: defaultBankCode,
      accountNumber: wallet?.accountNumber,
      currency: wallet?.currency,
      fee: 0,
      amount: Number(amount),
      sessionId: data?.data?.sessionId,
    };

    // stringify the transfer details
    const qrData = JSON.stringify(transferData);

    let qrCode: any;
    try {
      // encode the transfer details to base64 qrCode
      qrCode = await QRCode.toDataURL(qrData);
    } catch (error) {
      console.log('error', error);
      throw new InternalServerErrorException(
        `Failed to generate QR code: ${error.message}`,
      );
    }

    return {
      message: 'Qrcode generated successfully',
      statusCode: 200,
      data: qrCode,
    };
  }

  async decodeQrCode(qrCode: string) {
    const image = await Jimp.read(qrCode);

    const { data, width, height } = image.bitmap;
    const code = jsQR(new Uint8ClampedArray(data), width, height);

    if (!code) {
      throw new Error('QR Code could not be decoded.');
    }

    return {
      message: 'QR Code decoded successfully',
      statusCode: 200,
      data:
        typeof code?.data === 'string' ? JSON.parse(code?.data) : code?.data,
    };
  }

  async deductBalance(
    wallet: Wallet,
    amount: number,
    trx: Prisma.TransactionClient,
  ) {
    const newBalance = wallet?.balance - amount;

    await trx.wallet.update({
      where: {
        id: wallet.id,
      },
      data: {
        balance: newBalance,
      },
    });
    return newBalance;
  }

  async addbalance(
    wallet: Wallet,
    amount: number,
    trx: Prisma.TransactionClient,
  ) {
    const newBalance = wallet.balance + amount;

    await trx.wallet.update({
      where: {
        id: wallet.id,
      },
      data: {
        balance: newBalance,
      },
    });

    return newBalance;
  }

  private checkforMinimumAndMaximumAmount(
    currency: string,
    amount: number,
    user: User,
  ) {
    switch (currency) {
      case 'NGN':
        // check minimum amount
        if (amount < 50)
          throw new BadRequestException('Minimun amount for transfer is 50');

        // check maximum amount
        if (amount > user?.dailyCummulativeTransactionLimit)
          throw new BadRequestException(
            `You cannot transfer more than ${user?.dailyCummulativeTransactionLimit} due to the tier level of your account. Please upgrade your account to increase your transfer limits.`,
          );
        break;
      default:
        if (amount < 500)
          throw new BadRequestException('Minimun amount for transfer is 500');
    }
  }

  private getTransferFee(currency: string, amount: number) {
    switch (currency) {
      case 'NGN':
        if (amount < 500) {
          return 0;
        } else if (amount >= 500 && amount <= 20000) {
          return 20;
        } else if (amount > 20000 && amount <= 60000) {
          return 30;
        } else if (amount > 60000 && amount <= 100000) {
          return 100;
        } else if (amount > 100000 && amount <= 500000) {
          return 150;
        } else {
          return 200;
        }
      default:
        return amount;
    }
  }

  private generateTransactionRef(type: string) {
    const prefix = type === 'CREDIT' ? 'credit_' : 'debit_';
    const uniqueId = uuidv4(); // Generate a unique UUID
    return `${prefix}${uniqueId}`;
  }

  async bvnVerification(body: BvnVerificationDto, user: User) {
    // let bvnLookupRes: any;
    // try {
    //   bvnLookupRes = await this.apiProvider.bvnLookUp(body?.bvn);
    // } catch (error) {
    //   throw new BadRequestException('Failed to validate BVN');
    // }

    // if (!bvnLookupRes?.entity?.phone_number) {
    //   throw new BadRequestException('Failed to validate BVN');
    // }

    let walletSetupRequest = {} as WalletSetupDto;
    try {
      const existingWallet = await this.prisma.wallet.findFirst({
        where: { userId: user.id },
      });
      if (existingWallet) {
        throw new BadRequestException('User already have a wallet');
      }

      const bvnVerificationResponse =
        await this.apiProvider.verifyBvnWithFace(body);

      if (
        bvnVerificationResponse.statusCode &&
        bvnVerificationResponse.statusCode != 200 &&
        bvnVerificationResponse.statusCode != 201 &&
        bvnVerificationResponse.statusCode != 402
      ) {
        throw new BadRequestException(
          bvnVerificationResponse.statusCode == 404
            ? 'Invalid BVN'
            : bvnVerificationResponse.statusCode == 402
              ? 'Verification unit exussted, Try again after sometime'
              : bvnVerificationResponse?.message ||
                'BVN verification failed, Try again',
        );
      }

      if (
        bvnVerificationResponse?.metadata?.match == true &&
        bvnVerificationResponse?.metadata?.match_score > 0
      ) {
        walletSetupRequest = {
          bvn: bvnVerificationResponse.bvn.bvn,
          state: bvnVerificationResponse.bvn.state_of_residence,
          lga: bvnVerificationResponse.bvn.lga_of_residence,
          houseAddress: bvnVerificationResponse.bvn.residential_address,
          isBusiness: false,
          gender: bvnVerificationResponse.bvn.gender,
        };
      } else {
        throw new BadRequestException(
          bvnVerificationResponse?.message ||
            "BVN didn't match face provided, Try again",
        );
      }
    } catch (error) {
      console.log('error:', error);
      throw new BadRequestException(error?.message || 'Failed to validate BVN');
    }

    let newWallet: any;
    let res: any;
    try {
      res = await this.apiProvider.createVirtualAccount(
        user,
        walletSetupRequest,
      );
    } catch (error) {
      console.log('error:', error);
      throw new BadRequestException(error?.message || 'Failed to setup wallet');
    }

    // update the user
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        selfieBase64Image: body.selfieImage,
        state: walletSetupRequest.state,
        city: walletSetupRequest.lga,
        address: walletSetupRequest.houseAddress,
        isBvnVerified: true,
        bvn: body.bvn,
        tierLevel: TIER_LEVEL.one,
        dailyCummulativeTransactionLimit: walletSetupRequest.isBusiness
          ? BUSINESS_TIER_ONE_DAILY_CUMMULATIVE_TRANSACTION_LIMIT
          : TIER_ONE_DAILY_CUMMULATIVE_TRANSACTION_LIMIT,
        cummulativeBalanceLimit: walletSetupRequest.isBusiness
          ? BUSINESS_TIER_ONE_CUMMULATIVE_BALANCE_LIMIT
          : TIER_ONE_CUMMULATIVE_BALANCE_LIMIT,
      },
    });

    // create new wallet
    newWallet = await this.prisma.wallet.create({
      data: {
        userId: user.id,
        accountName: res?.account_name,
        bankName: res?.bank_name,
        accountNumber: res?.account_number,
        accountRef: res?.order_ref,
      },
    });

    return {
      message: 'Wallet created succesfully',
      statusCode: 201,
      data: newWallet,
    };
  }

  async getTransactions(
    page: number,
    limit: number,
    type: TRANSACTION_TYPE,
    category: TRANSACTION_CATEGORY,
    status: TRANSACTION_STATUS,
    search: string,
    user: User & { wallet?: any },
  ) {
    let response: any;

    const walletIds = user?.wallet?.map((w) => w.id) || [];
    const query = {
      walletId: { in: walletIds },
      type,
      category,
      status,
      transactionRef: search,
    };

    if (page && limit) {
      const skip = (page - 1) * limit;

      const [transactions, totalCount] = await Promise.all([
        this.prisma.transaction.findMany({
          skip,
          take: Number(limit),
          where: query,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.transaction.count({
          where: {
            walletId: user?.wallet?.id,
            type,
            category,
            status,
            transactionRef: search,
          },
        }),
      ]);

      response = {
        transactions,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      };
    } else {
      const transactions = await this.prisma.transaction.findMany({
        where: query,
        orderBy: { createdAt: 'desc' },
      });

      response = {
        transactions,
      };
    }

    return {
      message: 'Transactions retrieve successfully',
      statusCode: HttpStatus.OK,
      ...response,
    };
  }

  async fetchTransferFee(
    currency: string,
    amount: number,
    accountNumber: string,
  ) {
    // this.checkforMinimumAndMaximumAmount(currency, amount);

    const wallet = await this.prisma.wallet.findFirst({
      where: {
        accountNumber,
      },
    });

    let fee: number;

    if (wallet) {
      fee = 0;
    } else {
      fee = this.getTransferFee(currency, amount);
    }

    return {
      message: 'Fee retrieve successfully',
      statusCode: HttpStatus.OK,
      data: {
        fee: fee,
      },
    };
  }

  async transferFundVFD(body: TransferDto, user: User & { wallet?: any }) {
    // check if the account is restricted
    if (user?.status === USER_ACCOUNT_STATUS.restricted)
      throw new NotAcceptableException(
        'Your account has been restricted. Please contact support for assistance.',
      );

    // check for minimum amount to transfer
    this.checkforMinimumAndMaximumAmount(body.currency, body.amount, user);

    const toWallet = await this.prisma.wallet.findFirst({
      where: {
        accountNumber: body.accountNumber,
        currency: body.currency,
      },
    });

    const fromWallet = await this.prisma.wallet.findFirst({
      where: {
        userId: user?.id,
        currency: body.currency,
      },
    });

    if (fromWallet?.id === toWallet?.id)
      throw new BadRequestException('Enter a valid account number');

    if (!fromWallet)
      throw new NotFoundException(
        `Wallet of ${body.currency} not created, please create a wallet to initiate a transfer`,
      );

    if (body.amount > fromWallet?.balance)
      throw new BadRequestException('Insufficient Funds');

    let fee: any;

    // check for 10 free transactions and aggregate the total transaction amount for the current day
    const [trxCount, totalDebitTransferAmount] = await Promise.all([
      this.prisma.transaction.count({
        where: {
          walletId: user?.wallet?.id,
          category: TRANSACTION_CATEGORY.TRANSFER,
        },
      }),
      this.prisma.$queryRaw<{ total: number }[]>`
          SELECT SUM(("transferDetails"->>'amount')::numeric) AS total
          FROM transaction
          WHERE "walletId" = ${user?.wallet?.id}::uuid
            AND category = 'TRANSFER'
            AND type = 'DEBIT'
            AND status = 'success'
            AND DATE("createdAt") = CURRENT_DATE; -- Assuming "createdAt" is the timestamp column
        `,
    ]);

    const totalAmount = totalDebitTransferAmount[0]?.total || 0;

    console.log('totalAmount of transaction', totalAmount);

    if (totalAmount > user?.dailyCummulativeTransactionLimit)
      throw new BadRequestException(
        `You have exceeded your daily transaction limit of ${user?.dailyCummulativeTransactionLimit}. Please wait until the next day or upgrade your account to increase your limit.`,
      );

    fee =
      trxCount <= 10
        ? 0
        : toWallet
          ? 0
          : this.getTransferFee(body.currency, body.amount);

    if (body.fee && body.fee !== fee) {
      throw new BadRequestException('Incorrect transfer fee');
    }

    const amountPaid = body.amount + fee;

    let fromWalletNewBalance: number;
    if (toWallet) {
      let response: any;
      try {
        response = await this.apiProvider.transferVFDFund(body, 'intra', user);
      } catch (error) {
        console.log('error initiating intra transfer', error);

        if (error.response?.status == 400)
          throw new BadRequestException(error?.response?.data?.message);

        throw error;
      }

      console.log('response from intra transfer', response);
      await this.prisma.$transaction(
        async (trx) => {
          // lock from wallet for updates
          const lockfromWallet: Wallet[] =
            await trx.$queryRaw`SELECT * FROM wallet WHERE id = ${fromWallet.id}::uuid AND currency::text = ${body.currency.toString()} FOR UPDATE LIMIT 1`;

          fromWalletNewBalance = await this.deductBalance(
            lockfromWallet[0],
            amountPaid,
            trx,
          );

          console.log('new balance', fromWalletNewBalance);

          // create a debit transaction
          await trx.transaction.create({
            data: {
              walletId: fromWallet.id,
              transactionRef: this.generateTransactionRef('DEBIT'),
              type: TRANSACTION_TYPE.DEBIT,
              currency: body.currency,
              status: TRANSACTION_STATUS.success,
              description: body.description,
              previousBalance: fromWallet?.balance,
              currentBalance: fromWalletNewBalance,
              transferDetails: {
                senderName: fromWallet?.accountName,
                senderAccountNumber: fromWallet?.accountNumber,
                senderBankName: fromWallet?.bankName,
                beneficiaryName: toWallet?.accountName,
                beneficiaryAccountNumber: toWallet?.accountNumber,
                beneficiaryBankName: toWallet?.bankName,
                amount: body.amount,
                fee,
              },
            },
          });
        },
        {
          isolationLevel: 'Serializable',
          timeout: 20000,
        },
      );
    } else {
      let response: { beneficiaryDetails: any; data: any };
      try {
        response = await this.apiProvider.transferVFDFund(body, 'inter', user);
      } catch (error) {
        console.log('error initiating inter transfer', error);
        if (error.response?.status == 400)
          throw new BadRequestException(error?.response?.data?.message);
        throw error;
      }

      await this.prisma.$transaction(
        async (trx) => {
          // lock from wallet for updates
          const lockfromWallet: Wallet[] =
            await trx.$queryRaw`SELECT * FROM wallet WHERE id = ${fromWallet.id}::uuid AND currency::text = ${body.currency.toString()} FOR UPDATE LIMIT 1`;

          fromWalletNewBalance = await this.deductBalance(
            lockfromWallet[0],
            amountPaid,
            trx,
          );

          // create a debit transaction
          await trx.transaction.create({
            data: {
              walletId: fromWallet.id,
              transactionRef: this.generateTransactionRef('DEBIT'),
              type: TRANSACTION_TYPE.DEBIT,
              status: TRANSACTION_STATUS.success,
              currency: body.currency,
              description: body.description,
              previousBalance: fromWallet?.balance,
              currentBalance: fromWalletNewBalance,
              reference: response?.data?.reference,
              transferDetails: {
                senderName: fromWallet?.accountName,
                senderAccountNumber: fromWallet?.accountNumber,
                senderBankName: fromWallet?.bankName,
                beneficiaryName: response?.beneficiaryDetails?.name,
                beneficiaryAccountNumber:
                  response?.beneficiaryDetails?.account?.number,
                beneficiaryBankName: response?.beneficiaryDetails?.bank,
                amount: body.amount,
                sessionId: response?.data?.sessionId,
                fee,
              },
            },
          });
        },
        {
          isolationLevel: 'Serializable',
        },
      );
    }

    return {
      message: 'Transfer initiated successfully',
      statusCode: HttpStatus.OK,
    };
  }

  async transferFundInternal(
    fromWallet: Wallet,
    toWallet: Wallet,
    amountPaid: number,
    body: TransferDto,
    user: User & { wallet?: Wallet },
    fee: number,
    currency: CURRENCY,
  ) {
    const MAX_RETRIES = CONCURRENT_MAX_RETRIES;
    const BASE_DELAY = CONCURRENT_BASE_DELAY;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        await this.prisma.$transaction(async (trx) => {
          const lockfromWallet: Wallet[] =
            await trx.$queryRaw`SELECT * FROM wallet WHERE id = ${fromWallet.id}::uuid AND currency::text = ${currency.toString()} FOR UPDATE SKIP LOCKED LIMIT 1`;

          const locktoWallet: Wallet[] =
            await trx.$queryRaw`SELECT * FROM wallet WHERE id = ${toWallet.id}::uuid AND currency::text = ${currency.toString()} FOR UPDATE SKIP LOCKED LIMIT 1`;

          // check if beneficiary is to be added
          if (body?.saveBeneficiary) {
            // check if that account number has been added before
            const beneficiary = await trx.beneficiary.findFirst({
              where: {
                userId: user?.id,
                accountNumber: body?.accountNumber,
              },
            });

            if (!beneficiary) {
              // add beneficiary
              await trx.beneficiary.create({
                data: {
                  userId: user?.id,
                  type: BENEFICIARY_TYPE.TRANSFER,
                  bankCode: body?.bankCode || '090672', //bellbank default bank code
                  accountNumber: body?.accountNumber,
                  bankName: defaultBankName,
                  accountName: toWallet.accountName,
                },
              });
            }
          }

          const [fromWalletNewBalance, toWalletNewBalance] = await Promise.all([
            this.deductBalance(lockfromWallet[0], amountPaid, trx),
            this.addbalance(locktoWallet[0], body.amount, trx),
          ]);

          const debitTrxRef = this.generateTransactionRef('DEBIT');
          const creditTrxRef = this.generateTransactionRef('CREDIT');

          await Promise.all([
            // create a debit transaction for fromWallet
            trx.transaction.create({
              data: {
                walletId: fromWallet.id,
                transactionRef: debitTrxRef,
                type: TRANSACTION_TYPE.DEBIT,
                currency: body.currency,
                status: TRANSACTION_STATUS.success,
                description: body.description,
                previousBalance: fromWallet?.balance,
                currentBalance: fromWalletNewBalance,
                transferDetails: {
                  senderName: fromWallet?.accountName,
                  senderAccountNumber: fromWallet?.accountNumber,
                  senderBankName: defaultBankName,
                  beneficiaryName: toWallet?.accountName,
                  beneficiaryAccountNumber: toWallet?.accountNumber,
                  beneficiaryBankName: defaultBankName,
                  amount: body.amount,
                  amountPaid,
                  fee,
                },
              },
            }),

            //create a credit transaction for toWallet
            trx.transaction.create({
              data: {
                walletId: toWallet.id,
                transactionRef: creditTrxRef,
                type: TRANSACTION_TYPE.CREDIT,
                category: TRANSACTION_CATEGORY.DEPOSIT,
                currency: body.currency,
                status: TRANSACTION_STATUS.success,
                description: body.description,
                previousBalance: toWallet?.balance,
                currentBalance: toWalletNewBalance,
                depositDetails: {
                  senderName: fromWallet?.accountName,
                  senderAccountNumber: fromWallet?.accountNumber,
                  senderBankName: defaultBankName,
                  beneficiaryName: toWallet?.accountName,
                  beneficiaryAccountNumber: toWallet?.accountNumber,
                  beneficiaryBankName: defaultBankName,
                  amount: body.amount,
                  amountPaid,
                  fee,
                },
              },
            }),
          ]);

          const RAccountNumber = toWallet.accountNumber;
          const SAccountNUmber = fromWallet.accountNumber;
          const maskedRAccountNumber = `${RAccountNumber.substring(0, 2)}xxx..${RAccountNumber.substring(RAccountNumber.length - 4, RAccountNumber.length - 1)}x`;
          const maskedSAccountNumber = `${SAccountNUmber.substring(0, 2)}xxx..${SAccountNUmber.substring(SAccountNUmber.length - 4, SAccountNUmber.length - 1)}x`;

          try {
            //send debit alert email
            const amount = new Intl.NumberFormat('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(Number(body.amount.toFixed(2)));

            const now = new Date();
            const formattedDate = now.toLocaleString('en-US', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            });

            let maskedAccountName = fromWallet.accountName;
            if (maskedAccountName) {
              if (maskedAccountName.includes('_')) {
                const parts = maskedAccountName.split('_');
                maskedAccountName =
                  parts.length > 1 ? parts[1] : maskedAccountName;
              }

              if (maskedAccountName.includes(' ')) {
                maskedAccountName = maskedAccountName;
                // .split(' ')
                // .map(
                //   (word) =>
                //     word.charAt(0).toUpperCase() +
                //     word.slice(1).toLowerCase(),
                // )
                // .join(' ');
              }
            }

            //send debit email alert
            this.emailService.sendEmail({
              to: user.email,
              subject: 'Debit Alert',
              template: 'user/debit.hbs',
              context: {
                amount,
                accountName: maskedAccountName,
                accountNumber: maskedRAccountNumber,
                dateAndTime: formattedDate,
                receipientName: toWallet?.accountName,
                reference: debitTrxRef,
                narration: body.description || '',
                availableBalance: new Intl.NumberFormat('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }).format(Number(fromWalletNewBalance.toFixed(2))),
                year: new Date().getFullYear(),
              },
            });

            //send debit sms alert
            this.apiProvider.sendSms(
              user.phoneNumber,
              getSMSAlertMessage(
                amount,
                toWallet?.accountName,
                fromWallet?.accountName,
                debitTrxRef,
                formattedDate,
                Number(fromWalletNewBalance.toFixed(2)),
                'transfer',
                {
                  isCredit: false,
                },
                maskedSAccountNumber,
                maskedRAccountNumber,
                toWallet.bankName,
                // .toUpperCase(),
              ),
            );
          } catch (error) {
            console.log('Error sending debit transfer alert', error);
          }

          try {
            //send credit alert email
            const amount = new Intl.NumberFormat('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(body.amount);

            const now = new Date();
            const formattedDate = now.toLocaleString('en-US', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            });

            let maskedAccountName = fromWallet.accountName;
            if (maskedAccountName) {
              if (maskedAccountName.includes('_')) {
                const parts = maskedAccountName.split('_');
                maskedAccountName =
                  parts.length > 1 ? parts[1] : maskedAccountName;
              }

              if (maskedAccountName.includes(' ')) {
                maskedAccountName = maskedAccountName;
                // .split(' ')
                // .map(
                //   (word) =>
                //     word.charAt(0).toUpperCase() +
                //     word.slice(1).toLowerCase(),
                // )
                // .join(' ');
              }
            }
            //send credit email alert
            this.emailService.sendEmail({
              to: user.email,
              subject: 'Credit Alert',
              template: 'user/credit.hbs',
              context: {
                amount,
                accountName: maskedAccountName,
                accountNumber: maskedRAccountNumber,
                dateAndTime: formattedDate,
                senderName: fromWallet?.accountName,
                reference: creditTrxRef,
                narration: body.description || '',
                availableBalance: new Intl.NumberFormat('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }).format(toWalletNewBalance),
                year: new Date().getFullYear(),
              },
            });

            //send credit sms alert
            this.apiProvider.sendSms(
              user.phoneNumber,
              getSMSAlertMessage(
                amount,
                toWallet?.accountName,
                fromWallet?.accountName,
                creditTrxRef,
                formattedDate,
                Number(toWalletNewBalance.toFixed(2)),
                'transfer',
                {
                  isCredit: true,
                },
                maskedSAccountNumber,
                maskedRAccountNumber,
                fromWallet.bankName.toLowerCase(),
              ),
            );
          } catch (error) {
            console.log('Error sending credit transfer alert', error);
          }
        });

        return {
          message: 'Transfer initiated successfully',
          statusCode: HttpStatus.OK,
        };
      } catch (error) {
        if (
          (error.code === 'P2034' || error.code === 'P40001') &&
          attempt < MAX_RETRIES - 1
        ) {
          // Exponential backoff with jitter
          const delay =
            Math.min(
              BASE_DELAY * Math.pow(2, attempt),
              5000, // Max delay of 5 seconds
            ) +
            Math.random() * 100;

          console.log(
            `Serialization failure on attempt ${attempt + 1}. Retrying in ${delay}ms...`,
          );

          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        // Create failed transfer transaction
        await this.prisma.transaction.create({
          data: {
            walletId: user.wallet.id,
            transactionRef: this.generateTransactionRef('DEBIT'),
            type: TRANSACTION_TYPE.DEBIT,
            currency: body.currency,
            status: TRANSACTION_STATUS.failed,
            previousBalance: user.wallet.balance,
            currentBalance: user.wallet.balance,
            transferDetails: {
              senderName: fromWallet?.accountName,
              senderAccountNumber: fromWallet?.accountNumber,
              senderBankName: defaultBankName,
              beneficiaryName: toWallet?.accountName,
              beneficiaryAccountNumber: toWallet?.accountNumber,
              beneficiaryBankName: defaultBankName,
              amount: body.amount,
              amountPaid,
              fee,
            },
          },
        });

        // Log and rethrow other errors
        console.error('Transaction failed:', error);
        throw new InternalServerErrorException(
          'Transaction service temporarily unavailable. Please retry shortly.',
        );
      }
    }

    throw new InternalServerErrorException('Transfer processing failed');
  }

  async transferFundSafeHaven(
    fromWallet: Wallet,
    amountPaid: number,
    body: TransferDto,
    user: User & { wallet?: Wallet },
    fee: number,
    currency: CURRENCY,
  ) {
    const MAX_RETRIES = CONCURRENT_MAX_RETRIES;
    const BASE_DELAY = CONCURRENT_BASE_DELAY;

    const trxRef = this.generateTransactionRef('DEBIT');
    let beneficiaryBankName: any;
    let transferData: any;
    let pendingTransactionId: string;
    let fromWalletNewBalance: number;

    try {
      // create a pending transaction
      await this.prisma.$transaction(
        async (trx) => {
          const lockfromWallet: Wallet[] =
            await trx.$queryRaw`SELECT * FROM wallet WHERE id = ${fromWallet.id}::uuid AND currency::text = ${currency.toString()} FOR UPDATE SKIP LOCKED LIMIT 1`;

          if (!lockfromWallet.length || !lockfromWallet[0]) {
            throw new ConflictException(
              'Unable to access wallet at this time, please try again',
            );
          }

          [fromWalletNewBalance, beneficiaryBankName] = await Promise.all([
            this.deductBalance(lockfromWallet[0], amountPaid, trx),
            this.apiProvider.getSafeHavenBankName(body?.bankCode),
          ]);

          //create a pending transaction
          const pendingTrx = await trx.transaction.create({
            data: {
              walletId: fromWallet.id,
              transactionRef: trxRef,
              type: TRANSACTION_TYPE.DEBIT,
              currency: body.currency,
              status: TRANSACTION_STATUS.pending,
              description: body.description,
              previousBalance: fromWallet?.balance,
              currentBalance: fromWalletNewBalance,
              transferDetails: {
                senderName: fromWallet?.accountName,
                senderAccountNumber: fromWallet?.accountNumber,
                senderBankName: fromWallet?.bankName,
                beneficiaryName: transferData?.creditAccountName,
                beneficiaryAccountNumber: transferData?.creditAccountNumber,
                beneficiaryBankName,
                amount: body.amount,
                amountPaid,
                fee,
              },
            },
          });

          pendingTransactionId = pendingTrx.id;
        },
        {
          isolationLevel: 'Serializable',
          timeout: 10000,
        },
      );
    } catch (error) {
      console.log('Error initiating transfer', error);
      throw new InternalServerErrorException(
        'Service temporarily unavailable. Please retry shortly.',
      );
    }

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const res = await this.apiProvider.transferSafeHavenFund(
          { ...body, amount: amountPaid },
          fromWallet.accountNumber,
          trxRef,
        );

        if (res?.statusCode !== 200) {
          throw new InternalServerErrorException('Transfer processing failed');
        }

        transferData = res?.data;
        // check if beneficiary is to be added
        if (body?.saveBeneficiary) {
          // check if that account number has been added before
          const beneficiary = await this.prisma.beneficiary.findFirst({
            where: {
              userId: user?.id,
              accountNumber: body?.accountNumber,
            },
          });

          if (!beneficiary) {
            // add beneficiary
            await this.prisma.beneficiary.create({
              data: {
                userId: user?.id,
                type: BENEFICIARY_TYPE.TRANSFER,
                bankCode: body?.bankCode,
                accountNumber: body?.accountNumber,
                bankName: beneficiaryBankName,
                accountName: transferData?.creditAccountName,
              },
            });
          }
        }

        // update transaction
        await this.prisma.transaction.update({
          where: {
            id: pendingTransactionId,
          },
          data: {
            status: TRANSACTION_STATUS.success,
            transferDetails: {
              senderName: fromWallet?.accountName,
              senderAccountNumber: fromWallet?.accountNumber,
              senderBankName: fromWallet?.bankName,
              beneficiaryName: transferData?.creditAccountName,
              beneficiaryAccountNumber: transferData?.creditAccountNumber,
              beneficiaryBankName,
              amount: body.amount,
              amountPaid,
              fee,
            },
          },
        });

        try {
          //send debit alert email
          const RAccountNumber = transferData?.creditAccountNumber;
          const SAccountNumber = fromWallet.accountNumber;
          const maskedRAccountNumber = `${RAccountNumber.substring(0, 2)}xxx..${RAccountNumber.substring(RAccountNumber.length - 4, RAccountNumber.length - 1)}x`;
          const maskedSAccountNumber = `${SAccountNumber.substring(0, 2)}xxx..${SAccountNumber.substring(SAccountNumber.length - 4, SAccountNumber.length - 1)}x`;

          const amount = new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(Number(body.amount.toFixed(2)));

          const now = new Date();
          const formattedDate = now.toLocaleString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            timeZone: 'Africa/Lagos',
          });

          let maskedAccountName = fromWallet.accountName;
          if (maskedAccountName) {
            if (maskedAccountName.includes('_')) {
              const parts = maskedAccountName.split('_');
              maskedAccountName =
                parts.length > 1 ? parts[1] : maskedAccountName;
            }

            if (maskedAccountName.includes(' ')) {
              maskedAccountName = maskedAccountName;
              // .split(' ')
              // .map(
              //   (word) =>
              //     word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
              // )
              // .join(' ');
            }
          }

          this.emailService.sendEmail({
            to: user.email,
            subject: 'Debit Alert',
            template: 'user/debit.hbs',
            context: {
              amount,
              accountName: maskedAccountName,
              accountNumber: maskedRAccountNumber,
              dateAndTime: formattedDate,
              receipientName: transferData?.creditAccountName,
              narration: body.description || '',
              reference: trxRef,
              availableBalance: new Intl.NumberFormat('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }).format(fromWalletNewBalance),
              year: new Date().getFullYear(),
            },
          });

          //send debit sms alert
          this.apiProvider.sendSms(
            user.phoneNumber,
            getSMSAlertMessage(
              amount,
              transferData?.creditAccountName,
              fromWallet?.accountName,
              trxRef,
              formattedDate,
              Number(fromWalletNewBalance.toFixed(2)),
              'transfer',
              {
                isCredit: false,
              },
              maskedSAccountNumber,
              maskedRAccountNumber,
              beneficiaryBankName,
              // .toUpperCase(),
            ),
          );
        } catch (error) {
          console.log('Error sending transfer alert', error);
        }

        return {
          message: 'Transfer initiated successfully',
          statusCode: HttpStatus.OK,
        };
      } catch (error) {
        // Handle specific Prisma transaction conflict errors
        if (
          (error.code === 'P2034' || error.code === 'P40001') &&
          attempt < MAX_RETRIES - 1
        ) {
          // Exponential backoff with jitter
          const delay =
            Math.min(
              BASE_DELAY * Math.pow(2, attempt),
              5000, // Max delay of 5 seconds
            ) +
            Math.random() * 100;

          console.log(
            `Serialization failure on attempt ${attempt + 1}. Retrying in ${delay}ms...`,
          );

          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        // update the trx to failed
        await this.prisma.transaction.update({
          where: {
            id: pendingTransactionId,
          },
          data: {
            status: TRANSACTION_STATUS.failed,
            currentBalance: fromWalletNewBalance - body.amount,
          },
        });

        // refund's  user wallet
        await this.prisma.$transaction(async (trx) => {
          const lockfromWallet: Wallet[] =
            await trx.$queryRaw`SELECT * FROM wallet WHERE id = ${fromWallet.id}::uuid AND currency::text = ${currency.toString()} FOR UPDATE SKIP LOCKED LIMIT 1`;

          if (!lockfromWallet.length || !lockfromWallet[0]) {
            throw new ConflictException(
              'Unable to access wallet at this time, please try again',
            );
          }

          await this.addbalance(lockfromWallet[0], amountPaid, trx);
        });

        // Log and rethrow other errors
        console.error('Transaction failed:', error);
        throw new InternalServerErrorException('Transfer processing failed');
      }
    }
    throw new InternalServerErrorException('Transfer processing failed');
  }

  async transferFundBellBank(
    fromWallet: Wallet,
    amountPaid: number,
    body: TransferDto,
    user: User & { wallet?: Wallet },
    fee: number,
    currency: CURRENCY,
  ) {
    const MAX_RETRIES = CONCURRENT_MAX_RETRIES;
    const BASE_DELAY = CONCURRENT_BASE_DELAY;

    const trxRef = this.generateTransactionRef('DEBIT');
    let beneficiaryBankName: any;
    let transferData: any;
    let pendingTransactionId: string;
    let fromWalletNewBalance: number;

    try {
      // create a pending transaction
      await this.prisma.$transaction(
        async (trx) => {
          const lockfromWallet: Wallet[] =
            await trx.$queryRaw`SELECT * FROM wallet WHERE id = ${fromWallet.id}::uuid AND currency::text = ${currency.toString()} FOR UPDATE SKIP LOCKED LIMIT 1`;

          if (!lockfromWallet.length || !lockfromWallet[0]) {
            throw new ConflictException(
              'Unable to access wallet at this time, please try again',
            );
          }

          [fromWalletNewBalance, beneficiaryBankName] = await Promise.all([
            this.deductBalance(lockfromWallet[0], amountPaid, trx),
            this.apiProvider.getBellBankName(body?.bankCode),
          ]);

          //create a pending transaction
          const pendingTrx = await trx.transaction.create({
            data: {
              walletId: fromWallet.id,
              transactionRef: trxRef,
              type: TRANSACTION_TYPE.DEBIT,
              currency: body.currency,
              status: TRANSACTION_STATUS.pending,
              description: body.description,
              previousBalance: fromWallet?.balance,
              currentBalance: fromWalletNewBalance,
              transferDetails: {
                senderName: fromWallet?.accountName,
                senderAccountNumber: fromWallet?.accountNumber,
                senderBankName: fromWallet?.bankName,
                beneficiaryName: transferData?.creditAccountName,
                beneficiaryAccountNumber: transferData?.creditAccountNumber,
                beneficiaryBankName,
                amount: body.amount,
                amountPaid,
                fee,
              },
            },
          });

          pendingTransactionId = pendingTrx.id;
        },
        {
          isolationLevel: 'Serializable',
          timeout: 10000,
        },
      );
    } catch (error) {
      console.log('Error initiating transfer', error);
      throw new InternalServerErrorException(
        'Service temporarily unavailable. Please retry shortly.',
      );
    }

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const res = await this.apiProvider.transferBellBankFund(
          { ...body, amount: amountPaid },
          fromWallet.accountNumber,
          fromWallet.accountName,
          trxRef,
        );

        console.log('Bellbank transfer response: ', res);

        if (res?.success !== true) {
          throw new InternalServerErrorException('Transfer processing failed');
        }

        transferData = res?.data;
        // check if beneficiary is to be added
        if (body?.saveBeneficiary) {
          // check if that account number has been added before
          const beneficiary = await this.prisma.beneficiary.findFirst({
            where: {
              userId: user?.id,
              accountNumber: body?.accountNumber,
            },
          });

          if (!beneficiary) {
            // add beneficiary
            await this.prisma.beneficiary.create({
              data: {
                userId: user?.id,
                type: BENEFICIARY_TYPE.TRANSFER,
                bankCode: transferData?.destinationBankCode,
                accountNumber: transferData?.destinationAccountNumber,
                bankName: transferData?.destinationBankName,
                accountName: transferData?.destinationAccountName,
              },
            });
          }
        }

        // update transaction
        await this.prisma.transaction.update({
          where: {
            id: pendingTransactionId,
          },
          data: {
            status: TRANSACTION_STATUS.success,
            transferDetails: {
              senderName: fromWallet?.accountName,
              senderAccountNumber: fromWallet?.accountNumber,
              senderBankName: fromWallet?.bankName,
              beneficiaryName: transferData?.destinationAccountName,
              beneficiaryAccountNumber: transferData?.destinationAccountNumber,
              beneficiaryBankName: transferData?.destinationBankName,
              amount: body.amount,
              amountPaid,
              fee,
            },
          },
        });

        try {
          //send debit alert email
          const RAccountNumber = transferData?.destinationAccountNumber;
          const SAccountNumber = fromWallet.accountNumber;
          const maskedRAccountNumber = `${RAccountNumber.substring(0, 2)}xxx..${RAccountNumber.substring(RAccountNumber.length - 4, RAccountNumber.length - 1)}x`;
          const maskedSAccountNumber = `${SAccountNumber.substring(0, 2)}xxx..${SAccountNumber.substring(SAccountNumber.length - 4, SAccountNumber.length - 1)}x`;

          const amount = new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(Number(body.amount.toFixed(2)));

          const now = new Date();
          const formattedDate = now.toLocaleString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            timeZone: 'Africa/Lagos',
          });

          let maskedAccountName = fromWallet.accountName;
          if (maskedAccountName) {
            if (maskedAccountName.includes('_')) {
              const parts = maskedAccountName.split('_');
              maskedAccountName =
                parts.length > 1 ? parts[1] : maskedAccountName;
            }

            if (maskedAccountName.includes(' ')) {
              maskedAccountName = maskedAccountName;
              // .split(' ')
              // .map(
              //   (word) =>
              //     word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
              // )
              // .join(' ');
            }
          }

          this.emailService.sendEmail({
            to: user.email,
            subject: 'Debit Alert',
            template: 'user/debit.hbs',
            context: {
              amount,
              accountName: maskedAccountName,
              accountNumber: maskedRAccountNumber,
              dateAndTime: formattedDate,
              receipientName: transferData?.destinationAccountName,
              narration: body.description || '',
              reference: trxRef,
              availableBalance: new Intl.NumberFormat('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }).format(fromWalletNewBalance),
              year: new Date().getFullYear(),
            },
          });

          //send debit sms alert
          this.apiProvider.sendSms(
            user.phoneNumber,
            getSMSAlertMessage(
              amount,
              transferData?.destinationAccountName,
              fromWallet?.accountName,
              trxRef,
              formattedDate,
              Number(fromWalletNewBalance.toFixed(2)),
              'transfer',
              {
                isCredit: false,
              },
              maskedSAccountNumber,
              maskedRAccountNumber,
              beneficiaryBankName,
              // .toUpperCase(),
            ),
          );
        } catch (error) {
          console.log('Error sending transfer alert', error);
        }

        return {
          message: 'Transfer initiated successfully',
          statusCode: HttpStatus.OK,
        };
      } catch (error) {
        // Handle specific Prisma transaction conflict errors
        if (
          (error.code === 'P2034' || error.code === 'P40001') &&
          attempt < MAX_RETRIES - 1
        ) {
          // Exponential backoff with jitter
          const delay =
            Math.min(
              BASE_DELAY * Math.pow(2, attempt),
              5000, // Max delay of 5 seconds
            ) +
            Math.random() * 100;

          console.log(
            `Serialization failure on attempt ${attempt + 1}. Retrying in ${delay}ms...`,
          );

          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        // update the trx to failed
        await this.prisma.transaction.update({
          where: {
            id: pendingTransactionId,
          },
          data: {
            status: TRANSACTION_STATUS.failed,
            currentBalance: fromWalletNewBalance - body.amount,
          },
        });

        // refund's  user wallet
        await this.prisma.$transaction(async (trx) => {
          const lockfromWallet: Wallet[] =
            await trx.$queryRaw`SELECT * FROM wallet WHERE id = ${fromWallet.id}::uuid AND currency::text = ${currency.toString()} FOR UPDATE SKIP LOCKED LIMIT 1`;

          if (!lockfromWallet.length || !lockfromWallet[0]) {
            throw new ConflictException(
              'Unable to access wallet at this time, please try again',
            );
          }

          await this.addbalance(lockfromWallet[0], amountPaid, trx);
        });

        // Log and rethrow other errors
        console.error('Transaction failed:', error);
        throw new InternalServerErrorException('Transfer processing failed');
      }
    }
    throw new InternalServerErrorException('Transfer processing failed');
  }

  async transferFundFlutterwave(
    fromWallet: Wallet,
    amountPaid: number,
    body: TransferDto,
    user: User & { wallet?: Wallet },
    fee: number,
    currency: CURRENCY,
  ) {
    const MAX_RETRIES = CONCURRENT_MAX_RETRIES;
    const BASE_DELAY = CONCURRENT_BASE_DELAY;

    const trxRef = this.generateTransactionRef('DEBIT');
    let beneficiaryBankName: any;
    let transferData: any;
    let pendingTransactionId: string;
    let fromWalletNewBalance: number;

    try {
      // create a pending transaction
      await this.prisma.$transaction(
        async (trx) => {
          const lockfromWallet: Wallet[] =
            await trx.$queryRaw`SELECT * FROM wallet WHERE id = ${fromWallet.id}::uuid AND currency::text = ${currency.toString()} FOR UPDATE SKIP LOCKED LIMIT 1`;

          if (!lockfromWallet.length || !lockfromWallet[0]) {
            throw new ConflictException(
              'Unable to access wallet at this time, please try again',
            );
          }

          [fromWalletNewBalance, beneficiaryBankName] = await Promise.all([
            this.deductBalance(lockfromWallet[0], amountPaid, trx),
            this.apiProvider.getBellBankName(body?.bankCode),
          ]);

          //create a pending transaction
          const pendingTrx = await trx.transaction.create({
            data: {
              walletId: fromWallet.id,
              transactionRef: trxRef,
              type: TRANSACTION_TYPE.DEBIT,
              currency: body.currency,
              status: TRANSACTION_STATUS.pending,
              description: body.description,
              previousBalance: fromWallet?.balance,
              currentBalance: fromWalletNewBalance,
              transferDetails: {
                senderName: fromWallet?.accountName,
                senderAccountNumber: fromWallet?.accountNumber,
                senderBankName: fromWallet?.bankName,
                beneficiaryName: transferData?.creditAccountName,
                beneficiaryAccountNumber: transferData?.creditAccountNumber,
                beneficiaryBankName,
                amount: body.amount,
                amountPaid,
                fee,
              },
            },
          });

          pendingTransactionId = pendingTrx.id;
        },
        {
          isolationLevel: 'Serializable',
          timeout: 10000,
        },
      );
    } catch (error) {
      console.log('Error initiating transfer', error);
      throw new InternalServerErrorException(
        'Service temporarily unavailable. Please retry shortly.',
      );
    }

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const res = await this.apiProvider.transferSafeHavenFund(
          { ...body, amount: amountPaid },
          fromWallet.accountNumber,
          fromWallet.accountName,
          trxRef,
        );

        console.log('Flutterwave transfer response: ', res);

        if (res?.success !== true) {
          throw new InternalServerErrorException('Transfer processing failed');
        }

        transferData = res?.data;
        // check if beneficiary is to be added
        if (body?.saveBeneficiary) {
          // check if that account number has been added before
          const beneficiary = await this.prisma.beneficiary.findFirst({
            where: {
              userId: user?.id,
              accountNumber: body?.accountNumber,
            },
          });

          if (!beneficiary) {
            // add beneficiary
            await this.prisma.beneficiary.create({
              data: {
                userId: user?.id,
                type: BENEFICIARY_TYPE.TRANSFER,
                bankCode: transferData?.destinationBankCode,
                accountNumber: transferData?.destinationAccountNumber,
                bankName: transferData?.destinationBankName,
                accountName: transferData?.destinationAccountName,
              },
            });
          }
        }

        // update transaction
        await this.prisma.transaction.update({
          where: {
            id: pendingTransactionId,
          },
          data: {
            status: TRANSACTION_STATUS.success,
            transferDetails: {
              senderName: fromWallet?.accountName,
              senderAccountNumber: fromWallet?.accountNumber,
              senderBankName: fromWallet?.bankName,
              beneficiaryName: transferData?.destinationAccountName,
              beneficiaryAccountNumber: transferData?.destinationAccountNumber,
              beneficiaryBankName: transferData?.destinationBankName,
              amount: body.amount,
              amountPaid,
              fee,
            },
          },
        });

        try {
          //send debit alert email
          const RAccountNumber = transferData?.destinationAccountNumber;
          const SAccountNumber = fromWallet.accountNumber;
          const maskedRAccountNumber = `${RAccountNumber.substring(0, 2)}xxx..${RAccountNumber.substring(RAccountNumber.length - 4, RAccountNumber.length - 1)}x`;
          const maskedSAccountNumber = `${SAccountNumber.substring(0, 2)}xxx..${SAccountNumber.substring(SAccountNumber.length - 4, SAccountNumber.length - 1)}x`;

          const amount = new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(Number(body.amount.toFixed(2)));

          const now = new Date();
          const formattedDate = now.toLocaleString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            timeZone: 'Africa/Lagos',
          });

          let maskedAccountName = fromWallet.accountName;
          if (maskedAccountName) {
            if (maskedAccountName.includes('_')) {
              const parts = maskedAccountName.split('_');
              maskedAccountName =
                parts.length > 1 ? parts[1] : maskedAccountName;
            }

            if (maskedAccountName.includes(' ')) {
              maskedAccountName = maskedAccountName;
              // .split(' ')
              // .map(
              //   (word) =>
              //     word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
              // )
              // .join(' ');
            }
          }

          this.emailService.sendEmail({
            to: user.email,
            subject: 'Debit Alert',
            template: 'user/debit.hbs',
            context: {
              amount,
              accountName: maskedAccountName,
              accountNumber: maskedRAccountNumber,
              dateAndTime: formattedDate,
              receipientName: transferData?.destinationAccountName,
              narration: body.description || '',
              reference: trxRef,
              availableBalance: new Intl.NumberFormat('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }).format(fromWalletNewBalance),
              year: new Date().getFullYear(),
            },
          });

          //send debit sms alert
          this.apiProvider.sendSms(
            user.phoneNumber,
            getSMSAlertMessage(
              amount,
              transferData?.destinationAccountName,
              fromWallet?.accountName,
              trxRef,
              formattedDate,
              Number(fromWalletNewBalance.toFixed(2)),
              'transfer',
              {
                isCredit: false,
              },
              maskedSAccountNumber,
              maskedRAccountNumber,
              beneficiaryBankName,
              // .toUpperCase(),
            ),
          );
        } catch (error) {
          console.log('Error sending transfer alert', error);
        }

        return {
          message: 'Transfer initiated successfully',
          statusCode: HttpStatus.OK,
        };
      } catch (error) {
        // Handle specific Prisma transaction conflict errors
        if (
          (error.code === 'P2034' || error.code === 'P40001') &&
          attempt < MAX_RETRIES - 1
        ) {
          // Exponential backoff with jitter
          const delay =
            Math.min(
              BASE_DELAY * Math.pow(2, attempt),
              5000, // Max delay of 5 seconds
            ) +
            Math.random() * 100;

          console.log(
            `Serialization failure on attempt ${attempt + 1}. Retrying in ${delay}ms...`,
          );

          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        // update the trx to failed
        await this.prisma.transaction.update({
          where: {
            id: pendingTransactionId,
          },
          data: {
            status: TRANSACTION_STATUS.failed,
            currentBalance: fromWalletNewBalance - body.amount,
          },
        });

        // refund's  user wallet
        await this.prisma.$transaction(async (trx) => {
          const lockfromWallet: Wallet[] =
            await trx.$queryRaw`SELECT * FROM wallet WHERE id = ${fromWallet.id}::uuid AND currency::text = ${currency.toString()} FOR UPDATE SKIP LOCKED LIMIT 1`;

          if (!lockfromWallet.length || !lockfromWallet[0]) {
            throw new ConflictException(
              'Unable to access wallet at this time, please try again',
            );
          }

          await this.addbalance(lockfromWallet[0], amountPaid, trx);
        });

        // Log and rethrow other errors
        console.error('Transaction failed:', error);
        throw new InternalServerErrorException('Transfer processing failed');
      }
    }
    throw new InternalServerErrorException('Transfer processing failed');
  }

  async transferFund(body: TransferDto, user: User & { wallet?: Wallet }) {
    if (!user?.isWalletPinSet)
      throw new BadRequestException('Wallet pin not set');

    const isMatched = await bcrypt.compare(body?.walletPin, user?.walletPin);

    if (!isMatched) throw new BadRequestException('Incorect pin');

    // check if the account is restricted
    if (user?.status === USER_ACCOUNT_STATUS.restricted)
      throw new NotAcceptableException(
        'Your account has been restricted. Please contact support for assistance.',
      );

    // check for minimum amount to transfer
    // this.checkforMinimumAndMaximumAmount(body.currency, body.amount, user);

    const toWallet = await this.prisma.wallet.findFirst({
      where: {
        accountNumber: body.accountNumber,
        currency: body.currency,
      },
    });

    const fromWallet = await this.prisma.wallet.findFirst({
      where: {
        userId: user?.id,
        currency: body.currency,
      },
    });

    if (!fromWallet)
      throw new NotFoundException(
        `Wallet of ${body.currency} not created, please create a wallet to initiate a transfer`,
      );

    if (fromWallet?.id === toWallet?.id)
      throw new BadRequestException(
        'Source and destination accounts must be different.',
      );

    if (body.amount > fromWallet?.balance)
      throw new BadRequestException('Insufficient Funds');

    let fee: any;

    // check for 10 free transactions and aggregate the total transaction amount for the current day
    const [trxCount, totalDebitTransferAmount] = await Promise.all([
      this.prisma.transaction.count({
        where: {
          walletId: user?.wallet?.id,
          category: TRANSACTION_CATEGORY.TRANSFER,
        },
      }),
      this.prisma.$queryRaw<{ total: number }[]>`
          SELECT SUM(("transferDetails"->>'amount')::numeric) AS total
          FROM transaction
          WHERE "walletId" = ${user?.wallet?.id}::uuid
            AND category = 'TRANSFER'
            AND type = 'DEBIT'
            AND status = 'success'
            AND DATE("createdAt") = CURRENT_DATE; -- Assuming "createdAt" is the timestamp column
        `,
    ]);

    const totalAmount = totalDebitTransferAmount[0]?.total || 0;

    console.log('totalAmount of transaction', totalAmount);

    if (totalAmount > user?.dailyCummulativeTransactionLimit)
      throw new BadRequestException(
        `You have exceeded your daily transaction limit of ${user?.dailyCummulativeTransactionLimit}. Please wait until the next day or upgrade your account to increase your limit.`,
      );

    fee =
      trxCount <= 10
        ? 0
        : toWallet
          ? 0
          : this.getTransferFee(body.currency, body.amount);

    if (body.fee && body.fee !== fee) {
      throw new BadRequestException('Incorrect transfer fee');
    }

    const amountPaid = body.amount + fee;

    if (toWallet) {
      return await this.transferFundInternal(
        fromWallet,
        toWallet,
        amountPaid,
        body,
        user,
        fee,
        body.currency,
      );
    }

    return await this.transferFundSafeHaven(
      fromWallet,
      amountPaid,
      body,
      user,
      fee,
      body.currency,
    );
  }
}

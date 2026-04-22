import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { EmailService } from 'src/email/email.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { HelperService } from './helper.service';
import {
  TRANSACTION_CATEGORY,
  TRANSACTION_STATUS,
  TRANSACTION_TYPE,
} from '@prisma/client';
import { getSMSAlertMessage } from 'src/utils';
import { defaultBankName } from 'src/constants';
import * as NodeCache from 'node-cache';

interface IndividualClientPayload {
  firstname: string;
  lastname: string;
  middlename?: string;
  phoneNumber: string;
  address: string;
  bvn: string;
  gender: 'male' | 'female';
  dateOfBirth: string; // format: YYYY/MM/DD (e.g., 1993/12/29)
  metadata?: Record<string, any>;
  emailAddress?: string;
}

interface IndividualClientResponse {
  success: boolean;
  data: {
    metadata: Record<string, any>;
    createdAt: number;
    updatedAt: number;
    id: number;
    accountNumber: string;
    accountName: string;
    accountType: string;
    firstname: string;
    lastname: string;
    middlename: string;
    mobileNumber: string;
    externalReference: string;
    emailAddress: string;
    bvn: string;
    gender: string;
    address: string;
    dateOfBirth: string;
    validityType: string;
  };
}

@Injectable()
export class BellAccountService {
  private readonly logger = new Logger(BellAccountService.name);
  BASE_URL =
    process.env.BELL_CONSUMER_BASEURL || 'https://sandbox-baas-api.bellmfb.com';
  private readonly cache = new NodeCache({
    stdTTL: 600, // 10 minutes
    checkperiod: 120, // check every 2 minutes
  });

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly helperService: HelperService,
  ) {}

  async getAccessToken() {
    const savedToken = await this.cache.get('token');
    if (savedToken) {
      return {
        accessToken: savedToken,
      };
    } else {
      const url = this.BASE_URL + '/v1/generate-token';
      const headers = {
        'Content-Type': 'application/json',
        consumerKey: this.configService.get<string>('BELL_CONSUMER_KEY'),
        consumerSecret: this.configService.get<string>('BELL_CONSUMER_SECRET'),
        validityTime: this.configService.get<number>(
          'BELL_CONSUMER_VALIDITY_TIME',
        ),
      };
      try {
        const response = await axios.post(url, {}, { headers });

        if (response?.status !== 200)
          throw new InternalServerErrorException('Failed to generate token');

        const data = response?.data;
        this.cache.set('token', data?.token);
        return {
          accessToken: data?.token,
        };
      } catch (error) {
        console.log('error', error);
        throw new InternalServerErrorException('Failed to generate token');
      }
    }
  }

  private async getHeaders() {
    const tokenObj = await this.getAccessToken();

    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenObj?.accessToken}`,
    };
  }

  async createIndividualClient(
    payload: IndividualClientPayload,
  ): Promise<IndividualClientResponse> {
    const url = this.BASE_URL + '/v1/account/clients/individual';

    console.log('payload', payload);

    try {
      const response = await axios.post(url, payload, {
        headers: await this.getHeaders(),
      });

      if (response?.status !== 200) {
        console.error(response?.data);
        throw new InternalServerErrorException(
          'Failed to create individual client account',
        );
      }

      return response.data;
    } catch (error) {
      console.error(
        'Error creating individual client account:',
        error.response?.data || error?.message,
      );
      throw new InternalServerErrorException(
        error.response?.data?.message ||
          'Failed to create individual client account',
      );
    }
  }

  async handleFundingWebhook(eventData: any) {
    this.logger.log(`[BellMFB] handleFundingWebhook — ref: ${eventData?.reference}, account: ${eventData?.virtualAccount}, amount: ${eventData?.netAmount}`);
    try {
      const wallet = await this.prisma.wallet.findFirst({
        where: {
          accountNumber: eventData?.virtualAccount,
          currency: eventData?.destinationCurrency ?? 'NGN',
        },
        include: {
          user: true,
        },
      });

      if (!wallet) throw new InternalServerErrorException('Wallet not found');

      const oldBalance = wallet?.balance;
      const newBalance = oldBalance + Number(eventData?.netAmount);

      this.logger.log(`[BellMFB] wallet found — account: ${eventData?.virtualAccount}, balance: ${oldBalance} → ${newBalance}`);

      await Promise.all([
        // update the user wallet balance
        this.prisma.wallet.update({
          where: { id: wallet?.id },
          data: {
            balance: newBalance,
          },
        }),
        // create a payment event
        this.prisma.paymentEvent.create({
          data: {
            refId: eventData?.reference,
            status: eventData?.status ?? 'success',
            currency: eventData?.destinationCurrency ?? 'NGN',
            fee: Number(eventData?.transactionFee ?? 0),
            amountPaid: Number(eventData?.netAmount),
            settlementAmount: Number(eventData?.netAmount),
          },
        }),
      ]);

      // create transaction
      await this.prisma.transaction.create({
        data: {
          walletId: wallet?.id,
          transactionRef: eventData?.reference,
          type: TRANSACTION_TYPE.CREDIT,
          category: TRANSACTION_CATEGORY.DEPOSIT,
          currency: eventData?.destinationCurrency ?? 'NGN',
          status: TRANSACTION_STATUS.success,
          previousBalance: oldBalance,
          currentBalance: newBalance,
          description: eventData?.narration,
          depositDetails: {
            senderName: eventData?.sourceAccountName,
            senderAccountNumber: eventData?.sourceAccountNumber,
            senderBankName: eventData.sourceBankName,
            beneficiaryName: eventData?.sourceAccountName,
            beneficiaryAccountNumber: eventData?.creditAccountNumber,
            beneficiaryBankName: wallet.user.fullname,
            amount: Number(eventData?.netAmount),
            amountPaid: Number(eventData?.amountReceived),
          },
        },
      });

      try {
        //send credit alert email
        const accountSNum = wallet.accountNumber;
        const maskedSAccountNumber = `${accountSNum.substring(0, 2)}xxx..${accountSNum.substring(accountSNum.length - 4, accountSNum.length - 1)}x`;

        const amount = new Intl.NumberFormat('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(eventData?.netAmount);

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

        this.emailService.sendEmail({
          to: wallet?.user?.email,
          subject: 'Credit Alert',
          template: 'user/credit.hbs',
          context: {
            amount,
            accountName: wallet.accountName
              .split('_')[1]
              .split(' ')
              .map(
                (word) =>
                  word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
              )
              .join(' '),
            accountNumber: maskedSAccountNumber,
            senderName: eventData?.sourceAccountName,
            dateAndTime: formattedDate,
            narration: eventData?.remarks || '',
            reference: eventData?.reference,
            availableBalance: new Intl.NumberFormat('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(Number(newBalance.toFixed(2))),
            year: new Date().getFullYear(),
          },
        });

        //send credit sms alert
        this.helperService.sendSms(
          wallet.user.phoneNumber,
          getSMSAlertMessage(
            amount,
            wallet?.accountName,
            eventData?.sourceAccountName,
            eventData?.reference,
            formattedDate,
            newBalance,
            'transfer',
            {
              isCredit: true,
            },
            maskedSAccountNumber,
            eventData.sourceBankName.toUpperCase(),
          ),
          'sendar',
        );
      } catch (error) {
        this.logger.error(`[BellMFB] error sending credit alert — ref: ${eventData?.reference}`, error?.message);
      }

      this.logger.log(`[BellMFB] handleFundingWebhook complete — ref: ${eventData?.reference}, amount: ${eventData?.netAmount}`);
    } catch (error) {
      this.logger.error(`[BellMFB] error processing funding webhook — ref: ${eventData?.reference}`, error?.message);
      throw error;
    }
  }

  async getAllBanks() {
    const url = this.BASE_URL + '/v1/transfer/banks';
    const response = await axios.get(url, {
      headers: await this.getHeaders(),
    });

    if (response.status !== 200) {
      throw new InternalServerErrorException(
        response.data?.message || 'Failed to get banks',
      );
    }

    const data = response?.data?.data || [];
    const responseData = data?.map((item: any) => ({
      name: item.institutionName?.trim(),
      routingKey: item.bankInstitutionCode?.trim(),
      bankCode: item.institutionCode?.trim(),
      categoryId: item.category?.trim(),
    }));
    return responseData;
  }

  async getNameEquiry(bankCode: string, accountNumber: string) {
    const url = this.BASE_URL + '/v1/transfer/name-enquiry';
    console.log('Bellbank api:', url);
    const payload = {
      bankCode,
      accountNumber,
    };
    try {
      const response = await axios.post(url, payload, {
        headers: await this.getHeaders(),
      });
      if (response?.status !== 200) {
        throw new InternalServerErrorException(
          response.data?.message || 'Name inquiry failed',
        );
      }

      const data = response?.data?.data;
      const responsePayload = {
        bankCode: data?.bankCode,
        bankName: data?.bank,
        accountNumber: data?.accountNumber,
        accountName: data?.accountName,
      };
      return responsePayload;
    } catch (error) {
      console.log(error.response?.data || error?.message);
      console.error(
        'Error verifying account:',
        error.response?.data || error?.message,
      );
      throw new InternalServerErrorException(
        error.response?.data?.message || 'Error verifying account',
      );
    }
  }

  async verifyTransaction(reference: string) {
    const url = this.BASE_URL + `/v1/transactions/reference/${reference}`;
    try {
      const response = await axios.get(url, {
        headers: await this.getHeaders(),
      });

      if (response?.status !== 200) {
        console.error(response?.data);
        throw new InternalServerErrorException(
          response.data?.message || 'Transfer verification failed',
        );
      }

      return response.data;
    } catch (error) {
      console.error(
        'Error creating individual client account:',
        error.response?.data || error?.message,
      );
      throw new InternalServerErrorException(
        error.response?.data?.message ||
          'Failed to create individual client account',
      );
    }
  }

  async transerFund(payload: {
    nameEnquiryReference: string;
    debitAccountNumber: string;
    beneficiaryBankCode: string;
    beneficiaryAccountNumber: string;
    amount: number;
    narration: string;
    paymentReference?: string;
    saveBeneficiary?: boolean;
    debitAccountInfo: {
      debitAccountNumber: string;
      debitAccountName: string;
    };
  }) {
    const url = this.BASE_URL + '/v1/transfer';

    const bellBankActualPayload = {
      beneficiaryBankCode: payload.beneficiaryBankCode,
      beneficiaryAccountNumber: payload.beneficiaryAccountNumber,
      narration: payload.narration,
      amount: payload.amount,
      reference: payload.paymentReference,
      senderName: payload.debitAccountInfo.debitAccountNumber,
    };
    console.log('payload for transfer:', bellBankActualPayload);
    let response: any;
    try {
      response = await axios.post(url, bellBankActualPayload, {
        headers: await this.getHeaders(),
      });
    } catch (error) {
      console.log('error transfering', error?.data);
      throw error;
    }

    console.log('response from transfer', response?.data);
    if (response.status !== 201 && response.status !== 200) {
      throw new InternalServerErrorException(
        response?.message || 'Failed to transfer fund',
      );
    }

    return response?.data;
  }

  async handleTransferWebhook(body: any) {
    const eventData = body?.data;
    // console.log('eventData', eventData);

    if (eventData?.type === 'Outwards') return;

    try {
      const { isVerified } = await this.verifyTransaction(body?.reference);
      console.log('isVerified', isVerified);

      if (!isVerified)
        throw new InternalServerErrorException('Error verifying transaction');

      const existimgPaymentEvent = await this.prisma.paymentEvent.findFirst({
        where: {
          refId: eventData?.paymentReference,
        },
      });

      if (existimgPaymentEvent) return;

      // get wallet
      const wallet = await this.prisma.wallet.findFirst({
        where: {
          accountNumber: eventData?.creditAccountNumber,
          currency: eventData?.currency ?? 'NGN',
        },
        include: {
          user: true,
        },
      });

      if (!wallet) throw new InternalServerErrorException('Wallet not found');

      const oldBalance = wallet?.balance;
      // const newBalance =
      //   oldBalance + (Number(eventData?.amount) - Number(eventData?.fee));
      const newBalance = oldBalance + Number(eventData?.amount);

      const senderBankCode = eventData?.sessionId?.substring(0, 6);

      const [senderBankName] = await Promise.all([
        // get sender bank name from the sessionId - the bankCode is the first 6 digit from  the sessionId
        this.getBankName(senderBankCode),
        // update the user wallet balance
        this.prisma.wallet.update({
          where: { id: wallet?.id },
          data: {
            balance: newBalance,
          },
        }),
        // create a payment event
        this.prisma.paymentEvent.create({
          data: {
            refId: eventData?.paymentReference,
            status: eventData?.status ?? 'success',
            currency: eventData?.currency ?? 'NGN',
            fee: eventData?.fee ?? 0,
            amountPaid: Number(eventData?.amount),
            settlementAmount: Number(eventData?.amount),
          },
        }),
      ]);

      // create transaction
      await this.prisma.transaction.create({
        data: {
          walletId: wallet?.id,
          transactionRef: eventData?.paymentReference,
          type: TRANSACTION_TYPE.CREDIT,
          category: TRANSACTION_CATEGORY.DEPOSIT,
          currency: eventData?.currency ?? 'NGN',
          status: TRANSACTION_STATUS.success,
          previousBalance: oldBalance,
          currentBalance: newBalance,
          description: eventData?.narration,
          depositDetails: {
            senderName: eventData?.debitAccountName,
            senderAccountNumber: eventData?.debitAccountNumber,
            senderBankName,
            beneficiaryName: eventData?.creditAccountName,
            beneficiaryAccountNumber: eventData?.creditAccountNumber,
            beneficiaryBankName: defaultBankName,
            amount: Number(eventData?.amount) - Number(eventData?.fees),
            amountPaid: Number(eventData?.amount),
          },
        },
      });

      try {
        //send credit alert email
        const accountSNum = wallet.accountNumber;
        const accountRNum = eventData?.debitAccountNumber;
        const maskedSAccountNumber = `${accountSNum.substring(0, 2)}xxx..${accountSNum.substring(accountSNum.length - 4, accountSNum.length - 1)}x`;
        const maskedRAccountNumber = `${accountRNum.substring(0, 2)}xxx..${accountRNum.substring(accountRNum.length - 4, accountRNum.length - 1)}x`;

        const amount = new Intl.NumberFormat('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(eventData?.amount);

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

        this.emailService.sendEmail({
          to: wallet?.user?.email,
          subject: 'Credit Alert',
          template: 'user/credit.hbs',
          context: {
            amount,
            accountName: wallet.accountName
              .split('/')[1]
              .split(' ')
              .map(
                (word) =>
                  word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
              )
              .join(' '),
            accountNumber: maskedSAccountNumber,
            senderName: eventData?.debitAccountName,
            dateAndTime: formattedDate,
            narration: eventData?.narration || '',
            reference: eventData?.paymentReference,
            availableBalance: new Intl.NumberFormat('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(Number(newBalance.toFixed(2))),
            year: new Date().getFullYear(),
          },
        });

        //send credit sms alert
        this.helperService.sendSms(
          wallet.user.phoneNumber,
          getSMSAlertMessage(
            amount,
            wallet?.accountName,
            eventData?.debitAccountName,
            eventData?.paymentReference,
            formattedDate,
            newBalance,
            'transfer',
            {
              isCredit: true,
            },
            maskedSAccountNumber,
            maskedRAccountNumber,
            senderBankName.toUpperCase(),
          ),
          'dojah',
        );
      } catch (error) {
        console.log('Error sending deposit alert', error);
      }

      console.log('finish');
    } catch (error) {
      console.log('error funding account', error);
      throw error;
    }
  }

  async getBankName(code: string) {
    const data = await this.getAllBanks();
    const banks = data?.data;
    return banks?.find((bank: { bankCode: string }) => bank?.bankCode === code)
      ?.name;
  }
}

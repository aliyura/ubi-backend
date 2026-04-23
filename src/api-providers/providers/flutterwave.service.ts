import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  TRANSACTION_CATEGORY,
  TRANSACTION_STATUS,
  TRANSACTION_TYPE,
  USER_ACCOUNT_STATUS,
} from '@prisma/client';
import axios from 'axios';
import { Helpers } from 'src/helpers';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class FlutterwaveService {
  private readonly logger = new Logger(FlutterwaveService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async createVirtualAccount(payload: {
    email: string;
    bvn: string;
    narration: string;
    is_permanent: boolean;
  }) {
    const url =
      this.configService.get<string>('FLUTTERWAVE_BASE_URL') +
      '/v3/virtual-account-numbers';

    const response = await axios.post(url, payload, {
      headers: this.getHeaders(),
    });

    if (response.status != 200) {
      console.error(response?.data);
      throw new InternalServerErrorException(
        'Failed to create virtual account',
      );
    }

    return response?.data;
  }

  async createForeignAccount(payload: {
    account_name: string;
    email: string;
    mobilenumber?: string;
    country: string;
  }) {
    const url =
      this.configService.get<string>('FLUTTERWAVE_BASE_URL') +
      '/v3/payout-subaccounts';

    const response = await axios.post(url, payload, {
      headers: this.getHeaders(),
    });

    if (response.status != 200) {
      console.error(response?.data);
      throw new InternalServerErrorException(
        'Failed to create foreign account',
      );
    }

    return response?.data;
  }

  async deleteVirtualAccount(order_ref: string) {
    const url =
      this.configService.get<string>('FLUTTERWAVE_BASE_URL') +
      `/v3/virtual-account-numbers/${order_ref}`;

    const response = await axios.post(
      url,
      {
        status: 'inactive',
      },

      {
        headers: this.getHeaders(),
      },
    );

    if (response.status !== 200) {
      console.error(response?.data);
      throw new InternalServerErrorException('Failed to delete account');
    }

    return response.data;
  }

  async initiateTransfer(payload: {
    account_bank: string;
    account_number: string;
    amount: number;
    currency: string;
    debit_subaccount: string;
  }) {
    const url =
      this.configService.get<string>('FLUTTERWAVE_BASE_URL') + '/v3/transfers';

    console.log('Flutterwave transfer request: ', payload);

    const response = await axios.post(url, payload, {
      headers: this.getHeaders(),
    });

    console.log('Flutterwave transfer request: ', response?.data.data);

    if (response.status !== 200) {
      console.error(response?.data);
      throw new InternalServerErrorException('Failed to initiate transfer');
    }

    return response?.data;
  }

  async getBillers(category: string) {
    const url =
      this.configService.get<string>('FLUTTERWAVE_BASE_URL') +
      `/v3/bills/${category}/billers?country=NG`;

    const response = await axios.get(url, {
      headers: this.getHeaders(),
    });

    if (response.status !== 200) {
      console.error(response?.data);
      throw new InternalServerErrorException('Failed to get bill information');
    }

    return response?.data?.data;
  }

  async getBillInfo(billerCode: string) {
    const url =
      this.configService.get<string>('FLUTTERWAVE_BASE_URL') +
      `/v3/billers/${billerCode}/items`;

    const response = await axios.get(url, {
      headers: this.getHeaders(),
    });

    if (response.status !== 200) {
      console.error(response?.data);
      throw new InternalServerErrorException('Failed to get bill information');
    }

    return response?.data?.data;
  }

  async verifyBillerNumber(
    itemCode: string,
    payload: {
      code: string;
      customer: string;
    },
  ) {
    let response: any;

    try {
      const url =
        this.configService.get<string>('FLUTTERWAVE_BASE_URL') +
        `/v3/bill-items/${itemCode}/validate`;

      response = await axios.get(url, {
        headers: this.getHeaders(),
        params: payload,
      });
    } catch (error) {
      // console.log('error while verifying biller number', error);
      // throw new BadRequestException(error?.response?.data?.message);
      throw error;
    }

    if (response.status !== 200) {
      console.error(response?.data);
      throw new InternalServerErrorException('Failed to verify biller number');
    }

    return response?.data?.data;
  }

  async getAllBanks() {
    const url =
      this.configService.get<string>('FLUTTERWAVE_BASE_URL') + `/v3/banks/ng`;
    const response = await axios.get(url, {
      headers: this.getHeaders(),
    });

    if (response?.status !== 200) {
      console.error(response?.data);
      throw new BadRequestException('Failed to get banks');
    }

    if (response?.data?.data) {
      const data = response?.data?.data || [];
      const responseData = data?.map((item: any) => ({
        name: item.name,
        routingKey: item.code,
        bankCode: item.code,
        categoryId: item.id,
      }));
      return responseData;
    } else {
      throw new BadRequestException('Failed to get banks');
    }
  }

  async getNameEquiry(bankCode: string, accountNumber: string) {
    try {
      const url =
        this.configService.get<string>('FLUTTERWAVE_BASE_URL') +
        '/v3/accounts/resolve';

      const payload = {
        account_number: accountNumber,
        account_bank: bankCode,
      };
      console.log('flutterwave account inquiry request:', payload, url);
      const response = await axios.post(url, payload, {
        headers: this.getHeaders(),
      });

      console.log('flutterwave inquiry response:', response?.data.data);

      if (response.status !== 200) {
        console.error(response?.data);
        throw new InternalServerErrorException(
          'Failed to verify account details',
        );
      }
      const data = response?.data?.data;
      const responsePayload = {
        bankCode: bankCode,
        bankName: data?.bank_name,
        accountNumber: data?.account_number,
        accountName: data?.account_name,
        sessionId: data?.sessionId || Helpers.getTransactionRef(),
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

  async purchaseBill(
    itemCode: string,
    billerCode: string,
    payload: {
      customer_id: string;
      country: string;
      amount: number;
      reference: string;
    },
  ) {
    const url =
      this.configService.get<string>('FLUTTERWAVE_BASE_URL') +
      `/v3/billers/${billerCode}/items/${itemCode}/payment`;

    let response: any;
    try {
      response = await axios.post(url, payload, {
        headers: this.getHeaders(),
      });
    } catch (error) {
      console.log('error paying for bill', error);
      throw error;
    }

    if (response.status !== 200)
      throw new InternalServerErrorException('Failed to purchase bill');

    return response?.data?.data;
  }

  private getHeaders() {
    const secretKey = this.configService.get<String>('FLUTTERWAVE_SECRET_KEY');
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${secretKey}`,
    };
  }

  async handlePaymentSuccess(body: any) {
    const data = body?.data;
    const metaData = body?.meta_data;

    this.logger.log(
      `[Flutterwave] handlePaymentSuccess — ref: ${data?.id}, amount: ${data?.amount} ${data?.currency}`,
    );

    return this.prisma.$transaction(
      async (trx) => {
        const { isVerified, data: trxData } = await this.verifyTransaction(
          data?.id,
          data?.amount,
          data?.currency,
        );

        this.logger.log(
          `[Flutterwave] transaction verification — ref: ${data?.id}, isVerified: ${isVerified}`,
        );

        if (!isVerified)
          throw new InternalServerErrorException('Error verifying transaction');

        const existimgPaymentEvent = await trx.paymentEvent.findFirst({
          where: {
            refId: String(data?.id),
          },
        });

        if (existimgPaymentEvent?.status === data?.status) {
          this.logger.log(
            `[Flutterwave] duplicate payment event skipped — ref: ${data?.id}`,
          );
          return;
        }

        const user = await trx.user.findFirst({
          where: {
            email: data?.customer?.email,
          },
        });

        if (!user)
          throw new InternalServerErrorException(
            'User account with email does not exist',
          );

        const wallet = await trx.wallet.findFirst({
          where: {
            userId: user.id,
            currency: data?.currency ?? 'NGN',
          },
        });

        if (!wallet)
          throw new InternalServerErrorException('User wallet not found');

        const oldBalance = wallet?.balance;
        const newBalance = oldBalance + trxData?.amount_settled;

        this.logger.log(
          `[Flutterwave] wallet found — account: ${wallet.accountNumber}, balance: ${oldBalance} → ${newBalance}`,
        );

        //check if the amount credited is above the singleCreditLimit
        if (Number(data?.amount) > user?.dailyCummulativeTransactionLimit) {
          this.logger.warn(
            `[Flutterwave] single credit limit exceeded — userId: ${user.id}, amount: ${data?.amount}, restricting account`,
          );
          await trx.user.update({
            where: {
              id: user?.id,
            },
            data: {
              status: USER_ACCOUNT_STATUS.restricted,
            },
          });
        }

        //check if the daily amount credited is above the dailyCreditLimit
        const totalCreditDepositAmount = await trx.$queryRaw<
          { total: number }[]
        >`
          SELECT SUM(("depositDetails"->>'amountPaid')::numeric) AS total
          FROM transaction
          WHERE "walletId" = ${wallet?.id}::uuid
            AND category = 'DEPOSIT'
            AND type = 'CREDIT'
            AND status = 'success'
            AND DATE("createdAt") = CURRENT_DATE; -- Assuming "createdAt" is the timestamp column
        `;

        const totalAmount = totalCreditDepositAmount[0]?.total || 0;

        this.logger.log(
          `[Flutterwave] daily deposit total — userId: ${user.id}, total: ${totalAmount}, limit: ${user?.dailyCummulativeTransactionLimit}`,
        );
        if (totalAmount > user?.dailyCummulativeTransactionLimit) {
          this.logger.warn(
            `[Flutterwave] daily cumulative limit exceeded — userId: ${user.id}, restricting account`,
          );
          await trx.user.update({
            where: {
              id: user?.id,
            },
            data: {
              status: USER_ACCOUNT_STATUS.restricted,
            },
          });
        }

        // update the user wallet balance
        await trx.wallet.update({
          where: { id: wallet?.id },
          data: {
            balance: newBalance,
          },
        });

        // create a payment event
        await trx.paymentEvent.create({
          data: {
            refId: String(data?.id),
            status: data?.status,
            currency: data?.currency,
            fee: data?.app_fee,
            amountPaid: data?.amount,
            settlementAmount: trxData?.amount_settled,
          },
        });

        // create transaction
        await trx.transaction.create({
          data: {
            walletId: wallet?.id,
            transactionRef: String(data?.id),
            type: TRANSACTION_TYPE.CREDIT,
            category: TRANSACTION_CATEGORY.DEPOSIT,
            currency: data?.currency,
            status: TRANSACTION_STATUS.success,
            previousBalance: oldBalance,
            currentBalance: newBalance,
            depositDetails: {
              senderName: metaData?.originatorname,
              senderAccountNumber: metaData?.originatoraccountnumber,
              senderBankName: metaData?.bankname,
              amount: trxData?.amount_settled,
              amountPaid: data?.amount,
              fee: data?.app_fee,
            },
          },
        });

        this.logger.log(
          `[Flutterwave] handlePaymentSuccess complete — ref: ${data?.id}, settled: ${trxData?.amount_settled}`,
        );
      },
      {
        isolationLevel: 'Serializable',
      },
    );
  }

  async handlePaymentFailure(body: any) {
    const data = body?.data;
    const metaData = body?.meta_data;

    this.logger.log(
      `[Flutterwave] handlePaymentFailure — ref: ${data?.id}, amount: ${data?.amount} ${data?.currency}`,
    );

    return this.prisma.$transaction(
      async (trx) => {
        const existimgPaymentEvent = await trx.paymentEvent.findFirst({
          where: {
            refId: String(data?.id),
          },
        });

        if (existimgPaymentEvent?.status === data?.status) {
          this.logger.log(
            `[Flutterwave] duplicate failure event skipped — ref: ${data?.id}`,
          );
          return;
        }

        const user = await trx.user.findFirst({
          where: {
            email: data?.customer?.email,
          },
        });

        if (!user)
          throw new InternalServerErrorException(
            'User account with email does not exist',
          );

        const wallet = await trx.wallet.findFirst({
          where: {
            userId: user.id,
            currency: data?.currency ?? 'NGN',
          },
        });

        if (!wallet)
          throw new InternalServerErrorException('User wallet not found');

        // create a payment event
        await trx.paymentEvent.create({
          data: {
            refId: String(data?.id),
            status: data?.satus,
            currency: data?.currency,
            fee: data?.app_fee,
            amountPaid: data?.amount,
            settlementAmount: 0,
          },
        });

        // create failed transaction
        await trx.transaction.create({
          data: {
            walletId: wallet?.id,
            transactionRef: String(data?.id),
            type: TRANSACTION_TYPE.CREDIT,
            category: TRANSACTION_CATEGORY.DEPOSIT,
            currency: data?.currency,
            status: TRANSACTION_STATUS.failed,
            previousBalance: wallet?.balance,
            currentBalance: wallet?.balance,
            depositDetails: {
              senderName: metaData?.originatorname,
              senderAccountNumber: metaData?.originatoraccountnumber,
              senderBankName: metaData?.bankname,
              amount: data?.amount,
              amountPaid: data?.amount,
              fee: data?.app_fee,
            },
          },
        });

        this.logger.log(
          `[Flutterwave] handlePaymentFailure complete — ref: ${data?.id}, failed transaction recorded`,
        );
      },
      {
        isolationLevel: 'Serializable',
      },
    );
  }

  async handleTransferSuccess(body: any) {
    const data = body?.data;

    this.logger.log(
      `[Flutterwave] handleTransferSuccess — ref: ${data?.reference}, amount: ${data?.amount} ${data?.currency}`,
    );

    return await this.prisma.$transaction(
      async (trx) => {
        const existimgPaymentEvent = await trx.paymentEvent.findFirst({
          where: {
            refId: data?.reference,
          },
        });

        if (existimgPaymentEvent?.status === data?.status) {
          this.logger.log(
            `[Flutterwave] duplicate transfer success event skipped — ref: ${data?.reference}`,
          );
          return;
        }

        const existingTrx = await trx.transaction.findFirst({
          where: {
            transferDetails: {
              path: ['beneficiaryAccountNumber'],
              equals: data?.account_number,
            },
            status: TRANSACTION_STATUS.pending,
            // reference: data?.reference,
            transactionRef: data?.reference,
          },
        });

        if (!existingTrx)
          throw new InternalServerErrorException('Transaction not found');

        this.logger.log(
          `[Flutterwave] pending transaction found — txnId: ${existingTrx.id}, updating to success`,
        );

        await trx.transaction.update({
          where: {
            id: existingTrx.id,
          },
          data: {
            status: TRANSACTION_STATUS.success,
          },
        });

        // create a payment event
        await trx.paymentEvent.create({
          data: {
            refId: data?.reference,
            status: data?.status,
            currency: data?.currency,
            fee: data?.fee,
            amountPaid: data?.amount,
          },
        });

        this.logger.log(
          `[Flutterwave] handleTransferSuccess complete — ref: ${data?.reference}`,
        );
      },

      {
        isolationLevel: 'Serializable',
      },
    );
  }

  async handleTransferFailure(body: any) {
    const data = body?.data;

    this.logger.log(
      `[Flutterwave] handleTransferFailure — ref: ${data?.reference}, amount: ${data?.amount} ${data?.currency}`,
    );

    return await this.prisma.$transaction(
      async (trx) => {
        const existimgPaymentEvent = await trx.paymentEvent.findFirst({
          where: {
            refId: data?.reference,
          },
        });

        if (existimgPaymentEvent?.status === data?.status) {
          this.logger.log(
            `[Flutterwave] duplicate transfer failure event skipped — ref: ${data?.reference}`,
          );
          return;
        }

        const existingTrx = await trx.transaction.findFirst({
          where: {
            transferDetails: {
              path: ['beneficiaryAccountNumber'],
              equals: data?.account_number,
            },
            status: TRANSACTION_STATUS.pending,
            // reference: data?.reference,
            transactionRef: data?.reference,
          },
        });

        if (!existingTrx)
          throw new InternalServerErrorException('Transaction not found');

        this.logger.log(
          `[Flutterwave] reversing wallet balance — txnId: ${existingTrx.id}, restoring to ${existingTrx?.previousBalance}`,
        );

        // add the amount back
        await trx.wallet.update({
          where: {
            id: existingTrx?.walletId,
          },
          data: {
            balance: existingTrx?.previousBalance,
          },
        });

        //update the transaction to failed trx
        await trx.transaction.update({
          where: {
            id: existingTrx.id,
          },
          data: {
            status: TRANSACTION_STATUS.failed,
          },
        });

        // create a payment event
        await trx.paymentEvent.create({
          data: {
            refId: data?.reference,
            status: data?.status,
            currency: data?.currency,
            fee: data?.fee,
            amountPaid: data?.amount,
          },
        });

        this.logger.log(
          `[Flutterwave] handleTransferFailure complete — ref: ${data?.reference}, balance reversed`,
        );
      },

      {
        isolationLevel: 'Serializable',
      },
    );
  }

  private async verifyTransaction(
    id: string,
    amount: number,
    currency: string,
  ) {
    const url =
      this.configService.get<string>('FLUTTERWAVE_BASE_URL') +
      `/v3/transactions/${id}/verify`;

    const response = await axios.get(url, { headers: this.getHeaders() });

    if (response?.status === 200) {
      if (
        response.data.data?.status === 'successful' &&
        response.data.data?.amount === amount &&
        response.data.data?.currency === currency
      ) {
        return { isVerified: true, data: response.data.data };
      } else return { isVerified: false };
    } else {
      return { isVerified: false };
    }
  }
}

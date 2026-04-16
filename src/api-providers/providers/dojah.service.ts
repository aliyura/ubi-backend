import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User } from '@prisma/client';
import axios from 'axios';

@Injectable()
export class DojahService {
  private readonly logger = new Logger(DojahService.name);

  constructor(private readonly configService: ConfigService) {}

  async sendSms(data: {
    phoneNumber: string;
    message: string;
    channel?: 'sms' | 'whatsapp';
  }) {
    const url =
      this.configService.get<string>('DOJAH_BASE_URL') +
      '/api/v1/messaging/sms';

    const payload = {
      destination: data.phoneNumber,
      message: data.message,
      channel: data.channel,
      sender_id: 'UBI',
    };

    this.logger.debug(`Sending SMS via Dojah to: ${data.phoneNumber.slice(-4).padStart(data.phoneNumber.length, '*')}`);
    try {
      const response = await axios.post(url, payload, {
        headers: this.getHeaders(),
      });

      if (response.status !== 200) {
        this.logger.error(`Dojah SMS failed [status=${response.status}]: ${JSON.stringify(response?.data)}`);
        throw new InternalServerErrorException('Failed to send sms');
      }

      return response.data;
    } catch (error) {
      if (error instanceof InternalServerErrorException) throw error;
      const responseData = error?.response?.data;
      this.logger.error(
        `Dojah SMS request failed [status=${error?.response?.status}]: ${JSON.stringify(responseData) ?? error?.message}`,
        error?.stack,
      );
      throw new InternalServerErrorException(
        responseData?.message || responseData?.error || error?.message || 'Failed to send sms',
      );
    }
  }

  async bvnLookUp(bvn: string) {
    const url =
      this.configService.get<string>('DOJAH_BASE_URL') + '/api/v1/kyc/bvn/full';

    this.logger.debug(`Dojah BVN lookup`);
    try {
      const response = await axios.get(url, {
        headers: this.getHeaders(),
        params: { bvn },
      });

      if (response.status !== 200) {
        this.logger.error(`Dojah BVN lookup failed [status=${response.status}]: ${JSON.stringify(response?.data)}`);
        throw new InternalServerErrorException('Failed to validate BVN');
      }

      return response.data;
    } catch (error) {
      if (error instanceof InternalServerErrorException) throw error;
      const responseData = error?.response?.data;
      this.logger.error(
        `Dojah BVN lookup request failed [status=${error?.response?.status}]: ${JSON.stringify(responseData) ?? error?.message}`,
        error?.stack,
      );
      throw new InternalServerErrorException(
        responseData?.message || responseData?.error || error?.message || 'Failed to validate BVN',
      );
    }
  }

  async validateBvn(bvn: string) {
    const url =
      this.configService.get<string>('DOJAH_BASE_URL') + '/api/v1/kyc/bvn';

    this.logger.debug(`Dojah BVN validation`);
    try {
      const response = await axios.get(url, {
        headers: this.getHeaders(),
        params: { bvn },
      });

      if (response.status !== 200) {
        this.logger.error(`Dojah BVN validation failed [status=${response.status}]: ${JSON.stringify(response?.data)}`);
        throw new InternalServerErrorException('Failed to validate BVN');
      }

      return response.data;
    } catch (error) {
      if (error instanceof InternalServerErrorException) throw error;
      const responseData = error?.response?.data;
      this.logger.error(
        `Dojah BVN validation request failed [status=${error?.response?.status}]: ${JSON.stringify(responseData) ?? error?.message}`,
        error?.stack,
      );
      throw new InternalServerErrorException(
        responseData?.message || responseData?.error || error?.message || 'Failed to validate BVN',
      );
    }
  }

  async verifyAddressDetails(
    _payload: {
      address: string;
      city: string;
      state: string;
    },
    user: User,
  ) {
    const url =
      this.configService.get<string>('DOJAH_BASE_URL') +
      '/api/v1/kyc/bvn/advance';

    this.logger.debug(`Dojah address verification for user: ${user?.id}`);
    try {
      const response = await axios.get(url, {
        headers: this.getHeaders(),
        params: { bvn: user?.bvn },
      });

      if (response?.status !== 200) {
        this.logger.error(`Dojah address verification failed [status=${response?.status}]: ${JSON.stringify(response?.data)}`);
        throw new InternalServerErrorException('Failed to verify address details');
      }

      return response?.data;
    } catch (error) {
      if (error instanceof InternalServerErrorException) throw error;
      const responseData = error?.response?.data;
      this.logger.error(
        `Dojah address verification request failed [status=${error?.response?.status}]: ${JSON.stringify(responseData) ?? error?.message}`,
        error?.stack,
      );
      throw new InternalServerErrorException(
        responseData?.message || responseData?.error || error?.message || 'Failed to verify address details',
      );
    }
  }

  async verifyNinWithSelfie(payload: { selfie_image: string; nin: string }) {
    const url =
      this.configService.get<string>('DOJAH_BASE_URL') +
      '/api/v1/kyc/nin/verify';

    this.logger.debug(`Dojah NIN + selfie verification`);
    try {
      const response = await axios.post(url, payload, {
        headers: this.getHeaders(),
      });

      if (response?.status !== 200) {
        this.logger.error(`Dojah NIN+selfie verification failed [status=${response?.status}]: ${JSON.stringify(response?.data)}`);
        throw new InternalServerErrorException('Failed to verify nin and face image');
      }

      return response?.data;
    } catch (error) {
      if (error instanceof InternalServerErrorException) throw error;
      const responseData = error?.response?.data;
      this.logger.error(
        `Dojah NIN+selfie verification request failed [status=${error?.response?.status}]: ${JSON.stringify(responseData) ?? error?.message}`,
        error?.stack,
      );
      throw new InternalServerErrorException(
        responseData?.message || responseData?.error || error?.message || 'Failed to verify nin and face image',
      );
    }
  }

  async verifyNin(payload: { nin: string }) {
    const url =
      this.configService.get<string>('DOJAH_BASE_URL') + '/api/v1/kyc/nin';

    this.logger.debug(`Dojah NIN lookup`);
    try {
      const response = await axios.get(url, {
        headers: this.getHeaders(),
        params: payload,
      });

      if (response?.status !== 200) {
        this.logger.error(`Dojah NIN lookup failed [status=${response?.status}]: ${JSON.stringify(response?.data)}`);
        throw new InternalServerErrorException('Failed to get nin details');
      }

      return response?.data;
    } catch (error) {
      if (error instanceof InternalServerErrorException) throw error;
      const responseData = error?.response?.data;
      this.logger.error(
        `Dojah NIN lookup request failed [status=${error?.response?.status}]: ${JSON.stringify(responseData) ?? error?.message}`,
        error?.stack,
      );
      throw new InternalServerErrorException(
        responseData?.message || responseData?.error || error?.message || 'Failed to get nin details',
      );
    }
  }

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      Authorization: this.configService.get<string>('DOJAH_SECRET_KEY'),
      Appid: this.configService.get<string>('DOJAH_APPID'),
    };
  }
}

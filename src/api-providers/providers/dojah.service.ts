import {
  Injectable,
  InternalServerErrorException,
  Logger,
  Param,
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

    try {
      const response = await axios.post(url, payload, {
        headers: this.getHeaders(),
      });

      if (response.status !== 200) {
        this.logger.error(`Dojah SMS failed with status ${response.status}`, response?.data);
        throw new InternalServerErrorException('Failed to send sms');
      }

      return response.data;
    } catch (error) {
      if (error instanceof InternalServerErrorException) throw error;
      this.logger.error('Dojah SMS request failed', error?.response?.data || error?.message);
      throw new InternalServerErrorException(error?.response?.data?.message || 'Failed to send sms');
    }
  }

  async bvnLookUp(bvn: string) {
    const url =
      this.configService.get<string>('DOJAH_BASE_URL') + '/api/v1/kyc/bvn/full';

    const response = await axios.get(url, {
      headers: this.getHeaders(),
      params: {
        bvn,
      },
    });

    if (response.status !== 200) {
      console.error(response?.data);
      throw new InternalServerErrorException('Failed to validate BVN');
    }

    return response.data;
  }

  async validateBvn(bvn: string) {
    const url =
      this.configService.get<string>('DOJAH_BASE_URL') + '/api/v1/kyc/bvn';

    const response = await axios.get(url, {
      headers: this.getHeaders(),
      params: {
        bvn,
      },
    });

    if (response.status !== 200) {
      console.error(response.data);
      throw new InternalServerErrorException('Failed to validate BVN');
    }

    return response.data;
  }

  async verifyAddressDetails(
    payload: {
      address: string;
      city: string;
      state: string;
    },
    user: User,
  ) {
    const url =
      this.configService.get<string>('DOJAH_BASE_URL') +
      '/api/v1/kyc/bvn/advance';

    const response = await axios.get(url, {
      headers: this.getHeaders(),
      params: {
        bvn: user?.bvn,
      },
    });

    if (response?.status !== 200) {
      console.error(response?.data);
      throw new InternalServerErrorException(
        'Failed to verify address details',
      );
    }

    return response?.data;
  }

  async verifyNinWithSelfie(payload: { selfie_image: string; nin: string }) {
    const url =
      this.configService.get<string>('DOJAH_BASE_URL') +
      '/api/v1/kyc/nin/verify';

    const response = await axios.post(url, payload, {
      headers: this.getHeaders(),
    });

    if (response?.status !== 200) {
      console.error(response?.data);
      throw new InternalServerErrorException(
        'Failed to verify nin and face image',
      );
    }

    return response?.data;
  }

  async verifyNin(payload: { nin: string }) {
    const url =
      this.configService.get<string>('DOJAH_BASE_URL') + '/api/v1/kyc/nin';

    const response = await axios.get(url, {
      headers: this.getHeaders(),
      params: payload,
    });

    if (response?.status !== 200) {
      console.error(response?.data);
      throw new InternalServerErrorException('Failed to get nin details');
    }

    return response?.data;
  }

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      Authorization: this.configService.get<string>('DOJAH_SECRET_KEY'),
      Appid: this.configService.get<string>('DOJAH_APPID'),
    };
  }
}

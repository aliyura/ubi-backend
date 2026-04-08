import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import {
  BvnFaceVerificationResponseDto,
  BvnVerificationDto,
} from 'src/wallet/dto/BvnVerificationDto';

@Injectable()
export class QoreIdService {
  constructor(private readonly configService: ConfigService) {}

  private readonly tokenUrl = 'https://api.qoreid.com/token';
  private readonly bvnFaceUrl =
    'https://api.qoreid.com/v1/ng/identities/face-verification/bvn';
  private readonly ninFaceUrl =
    'https://api.qoreid.com/v1/ng/identities/face-verification/nin';

  async getAccessToken() {
    try {
      const payload = {
        clientId: this.configService.get<string>('QOREID_CLIENT_ID'),
        secret: this.configService.get<string>('QOREID_SECRET'),
      };
      const response = await axios.post(this.tokenUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });
      if (!response.data?.accessToken) {
        throw new InternalServerErrorException(
          response.data?.message || 'Failed to get QoreID token',
        );
      }
      return response.data;
    } catch (error) {
      const errorMessage =
        error.response?.message || error.data.message || error.message;
      console.error('Error getting QoreID token:', errorMessage);
      throw new InternalServerErrorException(
        errorMessage || 'Unable to fetch QoreID access token',
      );
    }
  }

  async verifyBvnFace(
    request: BvnVerificationDto,
  ): Promise<BvnFaceVerificationResponseDto> {
    try {
      const tokenData = await this.getAccessToken();
      const accessToken = tokenData?.accessToken;

      const payload = {
        idNumber: request.bvn,
        photoBase64: request.selfieImage,
      };

      const response = await axios.post(this.bvnFaceUrl, payload, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });

      const result = response.data as BvnFaceVerificationResponseDto;

      // Optional: add logging to quickly inspect match result
      if (result?.summary?.face_verification_check) {
        const match = result.summary.face_verification_check.match;
        const score = result.summary.face_verification_check.match_score;
        console.log(`BVN Face Match: ${match} (Score: ${score})`);
      }

      return result;
    } catch (error) {
      const errorMessage =
        error?.response?.message ||
        error?.message ||
        'Verification failed';

      console.error('BVN Face Verification Error:', errorMessage);

      return {
        message: errorMessage,
        statusCode: error?.response?.status || 500,
      } as BvnFaceVerificationResponseDto;
    }
  }

  async verifyNinFace(payload: { nin: string; selfieImage: string }) {
    try {
      const tokenData = await this.getAccessToken();
      const accessToken = tokenData?.access_token;

      const response = await axios.post(this.ninFaceUrl, payload, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      console.error(
        'NIN Face Verification Error:',
        error.response?.data || error.message,
      );
      throw new InternalServerErrorException('Failed to verify NIN face');
    }
  }
}

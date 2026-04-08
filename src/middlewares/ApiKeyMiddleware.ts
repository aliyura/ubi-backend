import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class ApiKeyMiddleware implements NestMiddleware {
  constructor(private readonly configService: ConfigService) {}
  whitelistedUrls = ['/api/v1/webhook/bellmfb'];

  async use(req: Request, res: Response, next: NextFunction) {
    console.log('req:', req.baseUrl);
    const apiKey = req.headers['x-api-key'];
    const configApiKey = this.configService.get<string>('API_KEY');

    if (!this.whitelistedUrls.includes(req.baseUrl)) {
     if (!apiKey) {
        throw new UnauthorizedException('API key is missing');
      }
      if (apiKey !== configApiKey) {
        throw new UnauthorizedException('Invalid API key');
      }
    }
    next();
  }
}

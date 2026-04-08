import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';
import { existsSync } from 'fs';
import { EmailService } from './email.service';

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const distTemplatesDir = join(process.cwd(), 'dist', 'templates');
        const srcTemplatesDir = join(process.cwd(), 'src', 'templates');
        const templateDir = existsSync(distTemplatesDir)
          ? distTemplatesDir
          : srcTemplatesDir;

        return {
          transport: {
            host: configService.get<string>('SMTP_HOST'),
            port: configService.get<number>('SMTP_PORT'),
            secure: true,
            auth: {
              user: configService.get<string>('SMTP_USER'),
              pass: configService.get<string>('SMTP_PASS'),
            },
          },
          defaults: {
            from: configService.get<string>('SMTP_FROM'),
          },
          template: {
            dir: templateDir,
            adapter: new HandlebarsAdapter(),
            options: {
              strict: true,
            },
          },
        };
      },
    }),
  ],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}

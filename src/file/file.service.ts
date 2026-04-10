import { Injectable, Logger } from '@nestjs/common';
import * as AWS from 'aws-sdk';
import * as sharp from 'sharp';
import { Helpers } from 'src/helpers';
import { Messages } from 'src/utils/messages/messages';
import { FilePropsDto } from './dto/file-props.dto';

type FileServiceResponse<T = unknown> = {
  success: boolean;
  message: string;
  data?: T;
};

type UploadedFileData = {
  url: string;
  fileName: string;
};

@Injectable()
export class FileService {
  private readonly logger = new Logger(FileService.name);
  private readonly bucket = process.env.AWS_S3_BUCKET;
  private readonly baseUrl = process.env.AWS_S3_BASEURL;

  private readonly s3 = new AWS.S3({
    endpoint: process.env.AWS_S3_ENDPOINT,
    region:
      process.env.AWS_S3_ENDPOINT?.match(/s3[.-]([a-z0-9-]+)\./i)?.[1] ||
      'us-east-1',
    accessKeyId: process.env.AWS_S3_ACCESS_KEY,
    secretAccessKey: process.env.AWS_S3_KEY_SECRET,
    s3ForcePathStyle: true,
    signatureVersion: 'v4',
  });

  async compressImage(imageBuffer: Buffer, fileSizeKb: number): Promise<Buffer> {
    let newQuality = Math.round(fileSizeKb / 2);
    if (fileSizeKb > 20) {
      newQuality = 10;
    }

    return sharp(imageBuffer)
      .jpeg({ quality: newQuality, mozjpeg: true })
      .png({ quality: newQuality })
      .toBuffer();
  }

  async uploadFile(
    file: Express.Multer.File,
    fileProps: FilePropsDto,
  ): Promise<FileServiceResponse<UploadedFileData>> {
    try {
      if (!file) {
        return { success: false, message: 'Invalid file or not found' };
      }

      const filename = `${Helpers.getCode()}${Date.now()}${Helpers.getExtension(file.originalname)}`;
      const fileSizeKb = file.size / 1000;

      if (fileSizeKb >= 10000) {
        return { success: false, message: Messages.fileTooLarge };
      }

      const compressedBuffer =
        fileSizeKb > 1000
          ? await this.compressImage(file.buffer, fileSizeKb)
          : file.buffer;

      const filePath = this.buildFilePath(filename, fileProps);
      return this.s3Upload(compressedBuffer, filePath, file.mimetype);
    } catch (error) {
      this.logger.error('uploadFile failed', error);
      return { success: false, message: Messages.unableToUploadFile };
    }
  }

  async uploadBuffer(
    buffer: Buffer,
    fileProps: FilePropsDto,
  ): Promise<FileServiceResponse<UploadedFileData>> {
    try {
      if (!buffer) {
        return { success: false, message: 'File not found' };
      }

      const filename = `file${Helpers.getCode()}${Date.now()}.png`;
      const fileSizeKb = buffer.byteLength / 1000;

      if (fileSizeKb >= 10000) {
        return { success: false, message: Messages.fileTooLarge };
      }

      const compressedBuffer =
        fileSizeKb > 1000
          ? await this.compressImage(buffer, fileSizeKb)
          : buffer;

      const filePath = this.buildFilePath(filename, fileProps);
      return this.s3Upload(compressedBuffer, filePath, 'image/png');
    } catch (error) {
      this.logger.error('uploadBuffer failed', error);
      return { success: false, message: Messages.unableToUploadFile };
    }
  }

  async delete(key: string): Promise<FileServiceResponse> {
    try {
      await this.s3
        .deleteObject({
          Bucket: this.bucket,
          Key: key,
        })
        .promise();

      return { success: true, message: 'File deleted successfully' };
    } catch (error) {
      this.logger.error(`delete failed for key: ${key}`, error);
      return { success: false, message: 'Unable to delete file' };
    }
  }

  private buildFilePath(filename: string, fileProps: FilePropsDto): string {
    if (!fileProps?.folder) {
      return filename;
    }

    const objectName = fileProps.prefix
      ? `${fileProps.prefix}-${filename}`
      : filename;

    return `${fileProps.folder}/${objectName}`;
  }

  private async s3Upload(
    file: Buffer,
    name: string,
    mimetype: string,
  ): Promise<FileServiceResponse<UploadedFileData>> {
    try {
      const s3Response = await this.s3
        .upload({
          Bucket: this.bucket,
          Key: String(name),
          Body: file,
          ContentType: mimetype,
          ContentDisposition: 'inline',
        })
        .promise();

      return {
        success: true,
        message: Messages.RequestSuccessful,
        data: {
          url: this.baseUrl ? `${this.baseUrl}/${this.bucket}/${s3Response.Key}` : s3Response.Location,
          fileName: s3Response.Key,
        },
      };
    } catch (error) {
      this.logger.error('s3 upload failed', error);
      return { success: false, message: Messages.unableToUploadFile };
    }
  }
}

import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { memoryStorage } from 'multer';
import {
  FARMER_POLICE_REPORT_UPLOAD_FOLDER_NAME,
  REPORT_SCAM_FILE_UPLOAD_FOLDER_NAME,
  USER_FILE_UPLOAD_FOLDER_NAME,
} from 'src/constants';

export const multerOptions = (
  type: 'profile' | 'report-scam' | 'farmer-police-report',
): MulterOptions => {
  const folder =
    type === 'profile'
      ? USER_FILE_UPLOAD_FOLDER_NAME
      : type === 'report-scam'
        ? REPORT_SCAM_FILE_UPLOAD_FOLDER_NAME
        : FARMER_POLICE_REPORT_UPLOAD_FOLDER_NAME;

  return {
    storage: memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024,
    },
    fileFilter: (_req, file, cb) => {
      const acceptedMimeType =
        type === 'farmer-police-report'
          ? /^(image\/(jpg|jpeg|png|webp)|application\/pdf)$/
          : /^image\/(jpg|jpeg|png|webp)$/;

      if (!file.mimetype.match(acceptedMimeType)) {
        return cb(new Error(`Invalid file type for folder: ${folder}`), false);
      }
      cb(null, true);
    },
  };
};

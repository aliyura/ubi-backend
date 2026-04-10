import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { memoryStorage } from 'multer';
import {
  REPORT_SCAM_FILE_UPLOAD_FOLDER_NAME,
  USER_FILE_UPLOAD_FOLDER_NAME,
} from 'src/constants';

export const multerOptions = (
  type: 'profile' | 'report-scam',
): MulterOptions => {
  const folder =
    type === 'profile'
      ? USER_FILE_UPLOAD_FOLDER_NAME
      : REPORT_SCAM_FILE_UPLOAD_FOLDER_NAME;

  return {
    storage: memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024,
    },
    fileFilter: (_req, file, cb) => {
      if (!file.mimetype.match(/^image\/(jpg|jpeg|png|webp)$/)) {
        return cb(new Error(`Invalid file type for folder: ${folder}`), false);
      }
      cb(null, true);
    },
  };
};

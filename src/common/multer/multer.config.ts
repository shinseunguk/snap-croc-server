import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { BadRequestException } from '@nestjs/common';
import { Request } from 'express';
import { randomUUID } from 'crypto';

// 허용되는 이미지 파일 확장자
const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

// 최대 파일 크기 (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export const profileImageMulterConfig = {
  storage: diskStorage({
    destination: (req: Request, file: Express.Multer.File, cb) => {
      // uploads/profiles 디렉토리에 저장
      const uploadPath = join(process.cwd(), 'uploads', 'profiles');
      cb(null, uploadPath);
    },
    filename: (req: Request, file: Express.Multer.File, cb) => {
      // randomUUID를 사용하여 고유한 파일명 생성
      const ext = extname(file.originalname);
      const filename = `${randomUUID()}${ext}`;
      cb(null, filename);
    },
  }),
  fileFilter: (req: Request, file: Express.Multer.File, cb) => {
    const ext = extname(file.originalname).toLowerCase();
    
    // 파일 확장자 검증
    if (!ALLOWED_IMAGE_EXTENSIONS.includes(ext)) {
      return cb(
        new BadRequestException(
          `지원하지 않는 파일 형식입니다. 허용되는 형식: ${ALLOWED_IMAGE_EXTENSIONS.join(', ')}`
        ),
        false,
      );
    }

    // MIME 타입 검증
    if (!file.mimetype.startsWith('image/')) {
      return cb(
        new BadRequestException('이미지 파일만 업로드 가능합니다.'),
        false,
      );
    }

    cb(null, true);
  },
  limits: {
    fileSize: MAX_FILE_SIZE, // 5MB
    files: 1, // 한 번에 하나의 파일만 업로드
  },
};
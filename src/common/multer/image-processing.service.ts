import { Injectable, Logger } from '@nestjs/common';
import sharp from 'sharp';
import { join } from 'path';
import { promises as fs } from 'fs';

@Injectable()
export class ImageProcessingService {
  private readonly logger = new Logger(ImageProcessingService.name);

  /**
   * 이미지 리사이징 및 최적화
   * @param filePath 원본 파일 경로
   * @param width 목표 너비 (기본값: 300)
   * @param height 목표 높이 (기본값: 300)
   * @returns 처리된 파일 경로
   */
  async resizeAndOptimize(
    filePath: string,
    width: number = 300,
    height: number = 300,
  ): Promise<string> {
    try {
      // 처리된 파일을 저장할 경로 생성
      const processedFileName = filePath.replace(/(\.[^.]+)$/, '_processed$1');

      await sharp(filePath)
        .resize(width, height, {
          fit: 'cover', // 비율을 유지하며 크롭
          position: 'center',
        })
        .jpeg({ quality: 80 }) // JPEG 품질 80%
        .toFile(processedFileName);

      this.logger.log(`이미지 처리 완료: ${processedFileName}`);
      
      // 원본 파일 삭제
      await fs.unlink(filePath);
      
      return processedFileName;
    } catch (error) {
      this.logger.error('이미지 처리 실패:', error);
      throw error;
    }
  }

  /**
   * 파일 삭제
   * @param filePath 삭제할 파일 경로
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
      this.logger.log(`파일 삭제 완료: ${filePath}`);
    } catch (error) {
      if (error.code !== 'ENOENT') { // 파일이 존재하지 않는 경우는 무시
        this.logger.error('파일 삭제 실패:', error);
      }
    }
  }

  /**
   * 업로드 디렉토리가 존재하지 않으면 생성
   */
  async ensureUploadDirectory(): Promise<void> {
    const uploadPath = join(process.cwd(), 'uploads', 'profiles');
    
    try {
      await fs.access(uploadPath);
    } catch {
      await fs.mkdir(uploadPath, { recursive: true });
      this.logger.log(`업로드 디렉토리 생성: ${uploadPath}`);
    }
  }
}
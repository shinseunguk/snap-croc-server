import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AppModule } from './app.module';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ImageProcessingService } from './common/multer/image-processing.service';

// crypto 모듈 polyfill (Node.js 18 호환성)
if (!globalThis.crypto) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  globalThis.crypto = require('crypto') as Crypto;
}

async function bootstrap() {
  // 한국 시간대 설정
  process.env.TZ = 'Asia/Seoul';
  
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // ConfigService 가져오기
  const configService = app.get(ConfigService);

  // Winston Logger 사용
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  // 업로드 디렉토리 생성 확인
  const imageProcessingService = app.get(ImageProcessingService);
  await imageProcessingService.ensureUploadDirectory();

  // 정적 파일 서빙 설정
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  // CORS 설정
  app.enableCors({
    origin: configService.get<string>('cors.origin'),
    credentials: true,
  });

  // Global prefix 설정
  const apiPrefix = configService.get<string>('api.prefix');
  const apiVersion = configService.get<string>('api.version');
  app.setGlobalPrefix(`${apiPrefix}/${apiVersion}`);

  // Swagger 설정
  const config = new DocumentBuilder()
    .setTitle('Snap Croc API')
    .setDescription('Snap Croc Server API Documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('snap-croc')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  const port = configService.get<number>('port') || 3000;
  await app.listen(port);

  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Swagger documentation: http://localhost:${port}/api-docs`);
}

void bootstrap();

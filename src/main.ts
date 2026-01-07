import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Global prefix 설정
  app.setGlobalPrefix('api/v1');
  
  // Swagger 설정
  const config = new DocumentBuilder()
    .setTitle('Snap Croc API')
    .setDescription('Snap Croc Server API Documentation')
    .setVersion('1.0')
    .addTag('snap-croc')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);
  
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Swagger documentation: http://localhost:${port}/api-docs`);
}
bootstrap();

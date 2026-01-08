import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import * as path from 'path';

@Module({
  imports: [
    WinstonModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const logLevel = configService.get<string>('logging.level') || 'info';
        const logPath =
          configService.get<string>('logging.filePath') || './logs';

        return {
          level: logLevel,
          format: winston.format.combine(
            winston.format.timestamp({
              format: () => new Date().toLocaleString('ko-KR', {
                timeZone: 'Asia/Seoul',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false,
              }),
            }),
            winston.format.errors({ stack: true }),
            winston.format.json(),
          ),
          transports: [
            new winston.transports.Console({
              format: winston.format.combine(
                winston.format.colorize(),
                winston.format.printf(
                  ({
                    timestamp,
                    level,
                    message,
                    stack,
                  }: {
                    timestamp: string;
                    level: string;
                    message: string;
                    stack?: string;
                  }) => {
                    return `${timestamp} [${level}] ${message}${stack ? `\n${stack}` : ''}`;
                  },
                ),
              ),
            }),
            new winston.transports.File({
              filename: path.join(logPath, 'error.log'),
              level: 'error',
              maxsize: 5242880, // 5MB
              maxFiles: 5,
            }),
            new winston.transports.File({
              filename: path.join(logPath, 'combined.log'),
              maxsize: 5242880, // 5MB
              maxFiles: 5,
            }),
          ],
        };
      },
      inject: [ConfigService],
    }),
  ],
})
export class LoggerModule {}

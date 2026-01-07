// crypto 모듈 polyfill (Node.js 18 호환성)
if (!globalThis.crypto) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  globalThis.crypto = require('crypto') as Crypto;
}

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('database.host'),
        port: configService.get('database.port'),
        username: configService.get('database.username'),
        password: configService.get('database.password'),
        database: configService.get('database.database'),
        entities: [User],
        synchronize: configService.get('nodeEnv') === 'development',
        logging: configService.get('nodeEnv') === 'development',
        timezone: '+09:00',
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}

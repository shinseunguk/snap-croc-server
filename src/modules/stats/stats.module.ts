import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatsController, RankingsController } from './stats.controller';
import { StatsService } from './stats.service';
import { User } from '../../entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [StatsController, RankingsController],
  providers: [StatsService],
  exports: [StatsService],
})
export class StatsModule {}

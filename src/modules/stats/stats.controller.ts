import { Controller, Get, UseGuards, Req, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { StatsService } from './stats.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { UserStatsDto, RankingResponseDto } from './dto/stats-response.dto';
import { RankingQueryDto } from './dto/ranking-query.dto';
import { User } from '../../entities/user.entity';
import type { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: User;
}

@ApiTags('게임 통계 및 랭킹')
@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '내 게임 통계 조회' })
  @ApiResponse({
    status: 200,
    description: '게임 통계 조회 성공',
    type: UserStatsDto,
  })
  @ApiResponse({ status: 401, description: '인증 필요' })
  @ApiResponse({ status: 404, description: '사용자를 찾을 수 없음' })
  async getMyStats(@Req() req: AuthenticatedRequest): Promise<UserStatsDto> {
    return this.statsService.getUserStats(req.user.id);
  }
}

@ApiTags('게임 통계 및 랭킹')
@Controller('rankings')
export class RankingsController {
  constructor(private readonly statsService: StatsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '전체 랭킹 조회',
    description:
      '포인트 기준 전체 랭킹을 조회합니다. 내 랭킹이 myRanking 필드에 표시됩니다.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: '페이지 번호 (기본값: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: '페이지당 항목 수 (기본값: 20, 최대: 50)',
    example: 20,
  })
  @ApiResponse({
    status: 200,
    description: '랭킹 조회 성공',
    type: RankingResponseDto,
  })
  @ApiResponse({ status: 401, description: '인증 필요' })
  async getRankings(
    @Query() query: RankingQueryDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<RankingResponseDto> {
    return this.statsService.getRankings(query, req.user.id);
  }
}

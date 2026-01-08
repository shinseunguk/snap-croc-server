import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThan } from 'typeorm';
import { User } from '../../entities/user.entity';
import {
  UserStatsDto,
  RankingUserDto,
  RankingResponseDto,
} from './dto/stats-response.dto';
import { RankingQueryDto } from './dto/ranking-query.dto';

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getUserStats(userId: number): Promise<UserStatsDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    // 사용자의 전체 순위 계산
    const globalRank = await this.calculateUserRank(userId);

    return {
      totalGames: user.gamesPlayed,
      wins: user.wins,
      losses: user.losses,
      winRate: user.winRate,
      points: user.points,
      level: user.level,
      tier: user.tier,
      currentWinStreak: user.winStreak,
      bestWinStreak: user.bestWinStreak,
      globalRank,
    };
  }

  async getRankings(
    query: RankingQueryDto,
    currentUserId?: number,
  ): Promise<RankingResponseDto> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    // 전체 사용자 수 조회
    const totalUsers = await this.userRepository.count({
      where: { isActive: true },
    });

    // 랭킹 목록 조회 (포인트 순으로 정렬)
    const [users, total] = await this.userRepository.findAndCount({
      where: { isActive: true },
      order: {
        points: 'DESC',
        wins: 'DESC', // 포인트가 같을 때는 승리 수로 정렬
        id: 'ASC', // 모든 값이 같을 때는 ID 순으로
      },
      skip: offset,
      take: limit,
    });

    // 랭킹 데이터 매핑
    const rankings: RankingUserDto[] = users.map((user, index) => ({
      id: user.id,
      nickname: user.nickname || `사용자${user.id}`,
      displayProfile: user.displayProfile,
      points: user.points,
      wins: user.wins,
      losses: user.losses,
      winRate: user.winRate,
      tier: user.tier,
      rank: offset + index + 1, // 실제 순위 계산
    }));

    // 내 랭킹 정보 조회 (로그인한 경우)
    let myRanking: RankingUserDto | undefined;
    if (currentUserId) {
      myRanking = await this.getMyRanking(currentUserId);
    }

    const totalPages = Math.ceil(total / limit);

    return {
      myRanking,
      rankings,
      totalUsers,
      currentPage: page,
      itemsPerPage: limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    };
  }

  private async getMyRanking(
    userId: number,
  ): Promise<RankingUserDto | undefined> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      return undefined;
    }

    const rank = await this.calculateUserRank(userId);

    return {
      id: user.id,
      nickname: user.nickname || `사용자${user.id}`,
      displayProfile: user.displayProfile,
      points: user.points,
      wins: user.wins,
      losses: user.losses,
      winRate: user.winRate,
      tier: user.tier,
      rank,
    };
  }

  private async calculateUserRank(userId: number): Promise<number> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      return -1;
    }

    // 현재 사용자보다 높은 포인트를 가진 사용자 수 + 1이 순위
    const higherRankedCount = await this.userRepository.count({
      where: [
        // 포인트가 더 높은 사용자
        {
          isActive: true,
          points: MoreThan(user.points),
        },
        // 포인트가 같고 승리 수가 더 많은 사용자
        {
          isActive: true,
          points: user.points,
          wins: MoreThan(user.wins),
        },
        // 포인트, 승리 수가 같고 ID가 더 작은 사용자 (먼저 가입한 사용자)
        {
          isActive: true,
          points: user.points,
          wins: user.wins,
          id: LessThan(user.id),
        },
      ],
    });

    return higherRankedCount + 1;
  }
}

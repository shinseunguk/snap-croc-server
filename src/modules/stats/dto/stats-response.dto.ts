import { ApiProperty } from '@nestjs/swagger';

export class UserStatsDto {
  @ApiProperty({ description: '총 게임 수', example: 50 })
  totalGames: number;

  @ApiProperty({ description: '승리 횟수', example: 32 })
  wins: number;

  @ApiProperty({ description: '패배 횟수', example: 18 })
  losses: number;

  @ApiProperty({ description: '승률 (%)', example: 64 })
  winRate: number;

  @ApiProperty({ description: '현재 포인트', example: 1850 })
  points: number;

  @ApiProperty({ description: '현재 레벨', example: 19 })
  level: number;

  @ApiProperty({ description: '현재 티어', example: '🥇 골드' })
  tier: string;

  @ApiProperty({ description: '현재 연승', example: 5 })
  currentWinStreak: number;

  @ApiProperty({ description: '최고 연승 기록', example: 15 })
  bestWinStreak: number;

  @ApiProperty({ description: '전체 순위', example: 42 })
  globalRank: number;
}

export class RankingUserDto {
  @ApiProperty({ description: '사용자 ID', example: 1 })
  id: number;

  @ApiProperty({ description: '닉네임', example: '스냅킹' })
  nickname: string;

  @ApiProperty({ 
    description: '표시할 프로필',
    example: { type: 'emoji', value: '🐊', source: 'selected_emoji' }
  })
  displayProfile: {
    type: 'emoji' | 'image';
    value: string;
    source: 'custom_upload' | 'selected_emoji' | 'social_login' | 'default';
  };

  @ApiProperty({ description: '포인트', example: 2500 })
  points: number;

  @ApiProperty({ description: '승리 횟수', example: 45 })
  wins: number;

  @ApiProperty({ description: '패배 횟수', example: 12 })
  losses: number;

  @ApiProperty({ description: '승률 (%)', example: 79 })
  winRate: number;

  @ApiProperty({ description: '티어', example: '🏆 플래티넘' })
  tier: string;

  @ApiProperty({ description: '순위', example: 1 })
  rank: number;
}

export class RankingResponseDto {
  @ApiProperty({ 
    description: '내 랭킹 정보 (항상 맨 위에 표시)',
    type: RankingUserDto,
    nullable: true 
  })
  myRanking?: RankingUserDto;

  @ApiProperty({ 
    description: '랭킹 목록',
    type: [RankingUserDto] 
  })
  rankings: RankingUserDto[];

  @ApiProperty({ description: '전체 사용자 수', example: 1250 })
  totalUsers: number;

  @ApiProperty({ description: '현재 페이지', example: 1 })
  currentPage: number;

  @ApiProperty({ description: '페이지당 항목 수', example: 20 })
  itemsPerPage: number;

  @ApiProperty({ description: '전체 페이지 수', example: 63 })
  totalPages: number;

  @ApiProperty({ description: '다음 페이지 존재 여부', example: true })
  hasNext: boolean;

  @ApiProperty({ description: '이전 페이지 존재 여부', example: false })
  hasPrevious: boolean;
}
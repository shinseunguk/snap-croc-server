import { ApiProperty } from '@nestjs/swagger';
import { SocialProvider } from '../../../entities/user.entity';
import type { NotificationSettings } from '../../../entities/user.entity';
import { DisplayProfileDto } from './display-profile.dto';

export class UserResponseDto {
  @ApiProperty({ description: '사용자 ID' })
  id: number;

  @ApiProperty({ description: '이메일 주소' })
  email: string;

  @ApiProperty({ description: '사용자 이름', nullable: true })
  name?: string;

  @ApiProperty({ description: '닉네임', nullable: true })
  nickname?: string;

  @ApiProperty({
    description: '프로필 이미지 URL (소셜 로그인)',
    nullable: true,
  })
  profileImage?: string;

  @ApiProperty({ description: '커스텀 프로필 이미지 URL', nullable: true })
  profileImageUrl?: string;

  @ApiProperty({ description: '아바타 이모지', example: '🐊', nullable: true })
  avatar?: string;

  @ApiProperty({
    description: '실제 표시할 프로필 (우선순위 적용)',
    type: DisplayProfileDto,
  })
  displayProfile: DisplayProfileDto;

  @ApiProperty({ description: '소셜 로그인 제공자', enum: SocialProvider })
  provider: SocialProvider;

  @ApiProperty({ description: '승리 횟수' })
  wins: number;

  @ApiProperty({ description: '패배 횟수' })
  losses: number;

  @ApiProperty({ description: '포인트' })
  points: number;

  @ApiProperty({ description: '플레이한 게임 수' })
  gamesPlayed: number;

  @ApiProperty({ description: '현재 연승 횟수' })
  winStreak: number;

  @ApiProperty({ description: '최고 연승 기록' })
  bestWinStreak: number;

  @ApiProperty({ description: '승률 (%)' })
  winRate: number;

  @ApiProperty({ description: '레벨' })
  level: number;

  @ApiProperty({ description: '티어', example: '🥈 실버' })
  tier: string;

  @ApiProperty({ description: '알림 설정', nullable: true })
  notificationSettings?: NotificationSettings;

  @ApiProperty({ description: '가입일' })
  createdAt: Date;

  @ApiProperty({ description: '마지막 로그인 시간', nullable: true })
  lastLoginAt?: Date;
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  DeleteDateColumn,
} from 'typeorm';

export enum SocialProvider {
  GOOGLE = 'google',
  APPLE = 'apple',
  KAKAO = 'kakao',
}

export enum UserStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  DEACTIVATED = 'deactivated',
}

export interface NotificationSettings {
  game: boolean;        // 모든 게임 관련 알림 (초대, 결과 등)
  marketing: boolean;   // 이벤트 및 프로모션 알림
}

@Entity('users')
@Index(['provider', 'socialId'], { unique: true })
@Index(['status', 'isActive'])
@Index(['points'])  // 랭킹 조회용
@Index(['wins'])    // 승리 순위
@Index(['nickname']) // 닉네임 검색
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true, length: 50, unique: true })
  nickname?: string;

  @Column({ nullable: true })
  profileImage: string;

  @Column({
    type: 'enum',
    enum: SocialProvider,
  })
  provider: SocialProvider;

  @Column()
  socialId: string;

  @Column({ nullable: true })
  refreshToken: string;

  @Column({ default: true })
  isActive: boolean;

  // 게임 통계
  @Column({ default: 0 })
  wins: number;

  @Column({ default: 0 })
  losses: number;

  @Column({ default: 0 })
  points: number;

  // 사용자 커스터마이징
  @Column({ default: '🐊' })  // 기본 악어 이모지
  avatar: string;

  @Column({ default: 0 })
  gamesPlayed: number;

  @Column({ default: 0 })
  winStreak: number;  // 연승 횟수

  @Column({ default: 0 })
  bestWinStreak: number;  // 최고 연승 기록

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt?: Date;

  @Column({
    type: 'jsonb',
    nullable: true,
    default: {
      game: true,         // 게임 알림은 기본적으로 켜짐
      marketing: false,   // 마케팅 알림은 기본적으로 꺼짐
    },
  })
  notificationSettings?: NotificationSettings;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;

  // 계산된 속성들 (DB에 저장되지 않음)
  get winRate(): number {
    if (this.gamesPlayed === 0) return 0;
    return Math.round((this.wins / this.gamesPlayed) * 100);
  }

  get level(): number {
    // 100포인트당 1레벨
    return Math.floor(this.points / 100) + 1;
  }

  get tier(): string {
    if (this.points >= 5000) return '🎆 다이아몬드';
    if (this.points >= 3000) return '🏆 플래티넘';
    if (this.points >= 1500) return '🥇 골드';
    if (this.points >= 700) return '🥈 실버';
    if (this.points >= 300) return '🥉 브론즈';
    return '🌱 뉴비';
  }
}

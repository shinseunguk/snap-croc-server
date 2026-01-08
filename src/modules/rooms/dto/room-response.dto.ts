import { ApiProperty } from '@nestjs/swagger';

export class RoomMemberDto {
  @ApiProperty({
    description: '사용자 ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: '닉네임',
    example: '스냅킹',
  })
  nickname: string;

  @ApiProperty({
    description: '아바타',
    example: { type: 'emoji', value: '🦖' },
  })
  avatar: {
    type: string;
    value: string;
  };

  @ApiProperty({
    description: '준비 상태',
    example: false,
  })
  isReady: boolean;

  @ApiProperty({
    description: '방장 여부',
    example: true,
  })
  isHost: boolean;

  @ApiProperty({
    description: '입장 시간',
    example: '2024-01-01T00:00:00Z',
  })
  joinedAt: Date;
}

export class RoomResponseDto {
  @ApiProperty({
    description: '방 ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: '방 코드',
    example: 'ABC123',
  })
  code: string;

  @ApiProperty({
    description: '방 상태',
    example: 'waiting',
    enum: ['waiting', 'in_game', 'finished'],
  })
  status: string;

  @ApiProperty({
    description: '방장 ID',
    example: 1,
  })
  hostId: number;

  @ApiProperty({
    description: '최대 인원',
    example: 2,
  })
  maxMembers: number;

  @ApiProperty({
    description: '현재 인원',
    example: 1,
  })
  currentMembers: number;

  @ApiProperty({
    description: '게임 설정: 이빨 개수',
    example: 16,
  })
  totalTeeth: number;

  @ApiProperty({
    description: '참가자 목록',
    type: [RoomMemberDto],
  })
  members: RoomMemberDto[];

  @ApiProperty({
    description: '생성 시간',
    example: '2024-01-01T00:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: '게임 시작 시간',
    example: '2024-01-01T00:00:00Z',
    nullable: true,
  })
  gameStartedAt?: Date;
}

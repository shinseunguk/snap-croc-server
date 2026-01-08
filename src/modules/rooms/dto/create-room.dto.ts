import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateRoomDto {
  @ApiProperty({
    description: '방 제목 (선택사항)',
    example: '즐거운 게임방',
    required: false,
  })
  @IsOptional()
  @IsString()
  title?: string;
}

export class CreateRoomResponseDto {
  @ApiProperty({
    description: '생성된 방 ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: '방 입장 코드',
    example: 'ABC123',
  })
  code: string;

  @ApiProperty({
    description: '방 상태',
    example: 'waiting',
  })
  status: string;

  @ApiProperty({
    description: '방장 ID',
    example: 1,
  })
  hostId: number;

  @ApiProperty({
    description: '생성 시간',
    example: '2024-01-01T00:00:00Z',
  })
  createdAt: Date;
}

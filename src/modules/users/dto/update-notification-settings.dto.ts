import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateNotificationSettingsDto {
  @ApiProperty({
    description: '게임 관련 알림 활성화 여부',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  game?: boolean;

  @ApiProperty({
    description: '마케팅 관련 알림 활성화 여부',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  marketing?: boolean;
}

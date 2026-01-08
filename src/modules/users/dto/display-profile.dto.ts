import { ApiProperty } from '@nestjs/swagger';

export enum DisplayProfileType {
  IMAGE = 'image',
  EMOJI = 'emoji',
}

export class DisplayProfileDto {
  @ApiProperty({
    description: '프로필 타입',
    enum: DisplayProfileType,
    example: DisplayProfileType.IMAGE,
  })
  type: DisplayProfileType;

  @ApiProperty({
    description: '프로필 값 (이미지 URL 또는 이모지)',
    example: '/uploads/profiles/abc123-456def.jpg',
  })
  value: string;

  @ApiProperty({
    description: '프로필 소스 (어디서 가져온 것인지)',
    example: 'custom_upload',
    enum: ['custom_upload', 'selected_emoji', 'social_login', 'default'],
  })
  source: 'custom_upload' | 'selected_emoji' | 'social_login' | 'default';
}

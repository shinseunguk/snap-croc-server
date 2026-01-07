import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum AvatarType {
  EMOJI = 'emoji',
  IMAGE = 'image',
}

export class UpdateAvatarDto {
  @ApiProperty({
    description: '아바타 타입',
    enum: AvatarType,
    example: AvatarType.EMOJI,
  })
  @IsEnum(AvatarType)
  type: AvatarType;

  @ApiProperty({
    description: '아바타 값 (이모지 문자열 또는 이미지 URL)',
    example: '🐊',
    required: false,
  })
  @IsOptional()
  @IsString()
  value?: string;
}

export class ProfileImageUploadResponseDto {
  @ApiProperty({
    description: '업로드된 이미지 URL',
    example: '/uploads/profiles/abc123-456def.jpg',
  })
  imageUrl: string;

  @ApiProperty({
    description: '성공 메시지',
    example: '프로필 이미지가 성공적으로 업로드되었습니다.',
  })
  message: string;
}
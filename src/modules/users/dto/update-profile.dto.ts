import { IsOptional, IsString, IsEnum, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from './user-response.dto';

export enum AvatarType {
  EMOJI = 'emoji',
  IMAGE = 'image',
}

export class UpdateProfileDto {
  @ApiProperty({
    description: '닉네임 (2-20자, 한글/영문/숫자/언더스코어만 가능)',
    example: '스냅킹2024',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(2, 20, { message: '닉네임은 2-20자 사이여야 합니다.' })
  @Matches(/^[가-힣a-zA-Z0-9_]+$/, {
    message: '닉네임은 한글, 영문, 숫자, 언더스코어(_)만 사용 가능합니다.',
  })
  nickname?: string;

  @ApiProperty({
    description: '아바타 타입',
    enum: AvatarType,
    example: AvatarType.EMOJI,
    required: false,
  })
  @IsOptional()
  @IsEnum(AvatarType)
  avatarType?: AvatarType;

  @ApiProperty({
    description: '아바타 값 (이모지 문자열, 이미지 타입일 경우 생략 가능)',
    example: '🦖',
    required: false,
  })
  @IsOptional()
  @IsString()
  avatarValue?: string;
}

export class UpdateProfileResponseDto {
  @ApiProperty({
    description: '업데이트된 사용자 정보',
    type: () => UserResponseDto,
  })
  user: UserResponseDto;

  @ApiProperty({
    description: '업로드된 이미지 URL (이미지 업로드한 경우)',
    example: '/uploads/profiles/abc123-456def.jpg',
    required: false,
  })
  uploadedImageUrl?: string;

  @ApiProperty({
    description: '성공 메시지',
    example: '프로필이 성공적으로 업데이트되었습니다.',
  })
  message: string;
}
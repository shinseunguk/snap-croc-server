import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, Matches } from 'class-validator';

export class UpdateNicknameDto {
  @ApiProperty({
    description: '변경할 닉네임',
    example: '스냅악어123',
    minLength: 2,
    maxLength: 20,
  })
  @IsString()
  @Length(2, 20, { message: '닉네임은 2-20자 사이여야 합니다.' })
  @Matches(/^[가-힣a-zA-Z0-9_]+$/, {
    message: '닉네임은 한글, 영문, 숫자, 언더스코어(_)만 사용 가능합니다.',
  })
  nickname: string;
}
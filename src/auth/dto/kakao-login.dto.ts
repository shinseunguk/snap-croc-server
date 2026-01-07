import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class KakaoLoginDto {
  @ApiProperty({
    description: 'Kakao access token',
    example: 'kakao_access_token_here',
  })
  @IsString()
  @IsNotEmpty()
  access_token: string;
}

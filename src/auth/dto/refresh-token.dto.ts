import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token',
    example: 'jwt_refresh_token_here',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

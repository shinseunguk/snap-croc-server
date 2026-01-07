import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { AuthService } from '../auth.service';
import { Request } from 'express';
import axios from 'axios';
import { User } from '../../entities/user.entity';

interface KakaoAccount {
  email?: string;
  profile?: {
    nickname?: string;
    profile_image_url?: string;
  };
}

interface KakaoUserResponse {
  id: number;
  kakao_account: KakaoAccount;
}

interface KakaoRequestBody {
  access_token: string;
}

@Injectable()
export class KakaoStrategy extends PassportStrategy(Strategy, 'kakao') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super();
  }

  async validate(req: Request): Promise<User> {
    try {
      const { access_token } = req.body as KakaoRequestBody;

      if (!access_token) {
        throw new Error('Access token is required');
      }

      // 카카오 API로 사용자 정보 조회
      const response = await axios.get<KakaoUserResponse>(
        'https://kapi.kakao.com/v2/user/me',
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        },
      );

      const { id, kakao_account } = response.data;
      const { email, profile } = kakao_account;

      const user = await this.authService.validateSocialUser({
        socialId: id.toString(),
        email: email || `${id}@kakao.com`,
        name: profile?.nickname,
        profileImage: profile?.profile_image_url,
        provider: 'kakao',
        accessToken: access_token,
      });

      return user;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Kakao authentication failed: ${errorMessage}`);
    }
  }
}

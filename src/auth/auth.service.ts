import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { User, SocialProvider, UserStatus } from '../entities/user.entity';

interface SocialUserData {
  socialId: string;
  email: string;
  name?: string;
  profileImage?: string;
  provider: string;
  accessToken: string;
  refreshToken?: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async validateSocialUser(socialUserData: SocialUserData): Promise<User> {
    const { socialId, email, name, profileImage, provider, refreshToken } =
      socialUserData;

    // 기존 사용자 찾기 (socialId + provider 조합으로)
    let user = await this.userRepository.findOne({
      where: {
        socialId,
        provider: provider as SocialProvider,
      },
    });

    if (!user) {
      // 이메일로 기존 사용자 찾기 (다른 소셜 로그인으로 가입한 경우)
      const existingUser = await this.userRepository.findOne({
        where: { email },
      });

      if (existingUser) {
        // 기존 사용자에 새로운 소셜 계정 연결
        user = await this.userRepository.save({
          ...existingUser,
          socialId,
          provider: provider as SocialProvider,
          refreshToken,
        });
      } else {
        // 새로운 사용자 생성
        user = await this.userRepository.save({
          email,
          name,
          profileImage,
          provider: provider as SocialProvider,
          socialId,
          refreshToken,
        });
      }
    } else {
      // 기존 사용자 정보 업데이트
      user = await this.userRepository.save({
        ...user,
        name: name || user.name,
        profileImage: profileImage || user.profileImage,
        refreshToken: refreshToken || user.refreshToken,
      });
    }

    return user;
  }

  async generateTokens(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      provider: user.provider,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '30d' });

    // Refresh token을 DB에 저장하고 마지막 로그인 시간 업데이트
    await this.userRepository.update(user.id, {
      refreshToken,
      lastLoginAt: new Date(),
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        profileImage: user.profileImage,
        provider: user.provider,
      },
    };
  }

  async validateRefreshToken(refreshToken: string): Promise<{ user: User; newTokens: { accessToken: string; refreshToken: string } } | null> {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.userRepository.findOne({
        where: {
          id: payload.sub,
          refreshToken,
          status: UserStatus.ACTIVE,
        },
      });

      if (!user) {
        return null;
      }

      // Rolling 방식: 새로운 토큰들 생성
      const newPayload = {
        sub: user.id,
        email: user.email,
        provider: user.provider,
      };

      const newAccessToken = this.jwtService.sign(newPayload);
      const newRefreshToken = this.jwtService.sign(newPayload, { expiresIn: '30d' });

      // 새로운 refresh token을 DB에 저장
      await this.userRepository.update(user.id, {
        refreshToken: newRefreshToken,
        lastLoginAt: new Date(),
      });

      return {
        user,
        newTokens: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        },
      };
    } catch {
      // JWT 만료 또는 유효하지 않은 토큰
      return null;
    }
  }

  async findById(id: number): Promise<User | null> {
    return this.userRepository.findOne({
      where: {
        id,
        status: UserStatus.ACTIVE,
      },
    });
  }
}

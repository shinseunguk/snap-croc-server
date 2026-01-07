import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-apple';
import { AuthService } from '../auth.service';

interface AppleProfile {
  id: string;
  email?: string;
  name?: {
    firstName: string;
    lastName: string;
  };
}

type AppleVerifyCallback = (error: Error | null, user?: any) => void;

@Injectable()
export class AppleStrategy extends PassportStrategy(Strategy, 'apple') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      clientID: configService.get<string>('APPLE_CLIENT_ID'),
      teamID: configService.get<string>('APPLE_TEAM_ID'),
      keyID: configService.get<string>('APPLE_KEY_ID'),
      privateKeyString: configService.get<string>('APPLE_PRIVATE_KEY'),
      callbackURL: configService.get<string>('APPLE_CALLBACK_URL'),
      scope: ['name', 'email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    idToken: unknown,
    profile: AppleProfile,
    done: AppleVerifyCallback,
  ): Promise<void> {
    try {
      const { id, email, name } = profile;
      const user = await this.authService.validateSocialUser({
        socialId: id,
        email: email || `${id}@apple.com`,
        name: name ? `${name.firstName} ${name.lastName}` : undefined,
        provider: 'apple',
        accessToken,
        refreshToken,
      });

      done(null, user);
    } catch (error) {
      done(error as Error, false);
    }
  }
}

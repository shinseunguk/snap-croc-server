import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { Socket } from 'socket.io';

@Injectable()
export class WsJwtAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client: Socket = context.switchToWs().getClient<Socket>();
      const token = this.extractTokenFromHandshake(client);

      if (!token) {
        throw new WsException('No token provided');
      }

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('jwt.secret'),
      });

      const user = await this.authService.findById(payload.sub);
      if (!user) {
        throw new WsException('User not found');
      }

      // Socket 객체에 사용자 정보 추가
      (client as any).user = {
        id: user.id,
        email: user.email,
        name: user.name,
        provider: user.provider,
      };

      return true;
    } catch (error) {
      throw new WsException('Unauthorized');
    }
  }

  private extractTokenFromHandshake(client: Socket): string | null {
    // 여러 방법으로 토큰 추출 시도

    // 1. Authorization 헤더에서
    const authHeader = client.handshake.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // 2. Query 파라미터에서
    const token = client.handshake.query.token;
    if (token && typeof token === 'string') {
      return token;
    }

    // 3. Auth 객체에서
    const auth = client.handshake.auth?.token;
    if (auth && typeof auth === 'string') {
      return auth;
    }

    return null;
  }
}

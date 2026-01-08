import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { KakaoLoginDto } from './dto/kakao-login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { User } from '../entities/user.entity';

interface AuthenticatedRequest extends Request {
  user: User;
}

@ApiTags('소셜 인증')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // Google OAuth
  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google 로그인 시작' })
  async googleAuth() {
    // Passport가 자동으로 Google로 리디렉션
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google 로그인 콜백' })
  async googleAuthRedirect(
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    const tokens = await this.authService.generateTokens(req.user);

    // 클라이언트 앱으로 리디렉션 (토큰과 함께)
    const redirectUrl = `${process.env.CLIENT_URL || 'http://localhost:3001'}/auth/callback?token=${tokens.accessToken}`;
    return res.redirect(redirectUrl);
  }

  // Apple OAuth
  @Get('apple')
  @UseGuards(AuthGuard('apple'))
  @ApiOperation({ summary: 'Apple 로그인 시작' })
  async appleAuth() {
    // Passport가 자동으로 Apple로 리디렉션
  }

  @Post('apple/callback')
  @UseGuards(AuthGuard('apple'))
  @ApiOperation({ summary: 'Apple 로그인 콜백' })
  async appleAuthRedirect(
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    const tokens = await this.authService.generateTokens(req.user);
    return res.status(HttpStatus.OK).json(tokens);
  }

  // Kakao 로그인 (클라이언트에서 토큰 받아서 처리)
  @Post('kakao')
  @UseGuards(AuthGuard('kakao'))
  @ApiOperation({ summary: 'Kakao 로그인' })
  @ApiBody({ type: KakaoLoginDto })
  @ApiResponse({ status: 200, description: '로그인 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async kakaoAuth(@Req() req: AuthenticatedRequest) {
    const tokens = await this.authService.generateTokens(req.user);
    return tokens;
  }

  // JWT 토큰 갱신
  @Post('refresh')
  @ApiOperation({ summary: 'JWT 토큰 갱신 (Rolling 방식)' })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({ status: 200, description: '토큰 갱신 성공' })
  @ApiResponse({ status: 401, description: '유효하지 않은 리프레시 토큰' })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    const result = await this.authService.validateRefreshToken(
      refreshTokenDto.refreshToken,
    );

    if (!result) {
      throw new Error('Invalid refresh token');
    }

    return {
      accessToken: result.newTokens.accessToken,
      refreshToken: result.newTokens.refreshToken,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        profileImage: result.user.profileImage,
        provider: result.user.provider,
      },
    };
  }

  // 사용자 프로필 조회
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '사용자 프로필 조회' })
  @ApiResponse({ status: 200, description: '프로필 조회 성공' })
  @ApiResponse({ status: 401, description: '인증 필요' })
  getProfile(@Req() req: AuthenticatedRequest) {
    return req.user;
  }

  // 로그아웃
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '로그아웃' })
  @ApiResponse({ status: 200, description: '로그아웃 성공' })
  async logout() {
    // 사용자의 refresh token을 무효화
    await this.authService.validateRefreshToken('');
    return { message: '로그아웃되었습니다.' };
  }
}

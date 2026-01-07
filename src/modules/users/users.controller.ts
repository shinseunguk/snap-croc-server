import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { UserResponseDto } from './dto/user-response.dto';
import { UpdateProfileDto, UpdateProfileResponseDto } from './dto/update-profile.dto';
import { User } from '../../entities/user.entity';
import { profileImageMulterConfig } from '../../common/multer/multer.config';
import type { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: User;
}

@ApiTags('사용자 관리')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '내 정보 조회' })
  @ApiResponse({
    status: 200,
    description: '사용자 정보 조회 성공',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 401, description: '인증 필요' })
  async getMyInfo(@Req() req: AuthenticatedRequest): Promise<UserResponseDto> {
    return this.usersService.getUserInfo(req.user.id);
  }


  @Get('nickname/check/:nickname')
  @ApiOperation({ summary: '닉네임 중복 확인' })
  @ApiResponse({
    status: 200,
    description: '사용 가능한 닉네임',
    schema: {
      type: 'object',
      properties: {
        available: { type: 'boolean', example: true },
        message: { type: 'string', example: '사용 가능한 닉네임입니다.' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '유효하지 않은 닉네임',
  })
  async checkNickname(
    @Param('nickname') nickname: string,
  ): Promise<{ available: boolean; message: string }> {
    const available = await this.usersService.checkNicknameAvailability(
      nickname,
    );
    return {
      available,
      message: available
        ? '사용 가능한 닉네임입니다.'
        : '이미 사용 중인 닉네임입니다.',
    };
  }



  @Put('me/profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('profileImage', profileImageMulterConfig))
  @ApiOperation({ 
    summary: '프로필 통합 업데이트 (닉네임 + 아바타 + 이미지를 한 번에)' 
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: '프로필 업데이트 정보 (닉네임, 아바타 설정, 이미지 파일)',
    schema: {
      type: 'object',
      properties: {
        nickname: {
          type: 'string',
          description: '변경할 닉네임 (선택적)',
          example: '스냅킹2024',
        },
        avatarType: {
          type: 'string',
          enum: ['emoji', 'image'],
          description: '아바타 타입 (선택적)',
          example: 'emoji',
        },
        avatarValue: {
          type: 'string',
          description: '아바타 값 (이모지인 경우 필수, 이미지인 경우 생략 가능)',
          example: '🦖',
        },
        profileImage: {
          type: 'string',
          format: 'binary',
          description: '프로필 이미지 파일 (선택적, JPG, PNG, GIF, WebP)',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: '프로필 업데이트 성공',
    type: UpdateProfileResponseDto,
  })
  @ApiResponse({ status: 400, description: '잘못된 입력 값' })
  @ApiResponse({ status: 401, description: '인증 필요' })
  @ApiResponse({ status: 409, description: '이미 사용 중인 닉네임' })
  async updateProfile(
    @Req() req: AuthenticatedRequest,
    @Body() updateProfileDto: UpdateProfileDto,
    @UploadedFile() profileImage?: Express.Multer.File,
  ): Promise<UpdateProfileResponseDto> {
    return this.usersService.updateProfile(req.user.id, updateProfileDto, profileImage);
  }

  @Delete('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '회원 탈퇴' })
  @ApiResponse({ status: 204, description: '회원 탈퇴 성공' })
  @ApiResponse({ status: 401, description: '인증 필요' })
  async deleteAccount(@Req() req: AuthenticatedRequest): Promise<void> {
    await this.usersService.deleteUser(req.user.id);
  }
}
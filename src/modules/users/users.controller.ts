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
import { UpdateNicknameDto } from './dto/update-nickname.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UpdateAvatarDto, ProfileImageUploadResponseDto } from './dto/update-avatar.dto';
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

  @Put('me/nickname')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '닉네임 설정/변경' })
  @ApiBody({ type: UpdateNicknameDto })
  @ApiResponse({
    status: 200,
    description: '닉네임 변경 성공',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 400, description: '유효하지 않은 닉네임' })
  @ApiResponse({ status: 401, description: '인증 필요' })
  @ApiResponse({ status: 409, description: '이미 사용 중인 닉네임' })
  async updateNickname(
    @Req() req: AuthenticatedRequest,
    @Body() updateNicknameDto: UpdateNicknameDto,
  ): Promise<UserResponseDto> {
    return this.usersService.updateNickname(
      req.user.id,
      updateNicknameDto.nickname,
    );
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

  @Post('me/profile-image')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file', profileImageMulterConfig))
  @ApiOperation({ summary: '프로필 이미지 업로드' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: '프로필 이미지 파일',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: '이미지 파일 (JPG, PNG, GIF, WebP, 최대 5MB)',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: '프로필 이미지 업로드 성공',
    type: ProfileImageUploadResponseDto,
  })
  @ApiResponse({ status: 400, description: '잘못된 파일 형식 또는 크기 초과' })
  @ApiResponse({ status: 401, description: '인증 필요' })
  async uploadProfileImage(
    @Req() req: AuthenticatedRequest,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ProfileImageUploadResponseDto> {
    if (!file) {
      throw new BadRequestException('파일을 선택해주세요.');
    }

    return this.usersService.uploadProfileImage(req.user.id, file);
  }

  @Put('me/avatar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '아바타 변경 (이모지 또는 업로드된 이미지 선택)' })
  @ApiBody({ type: UpdateAvatarDto })
  @ApiResponse({
    status: 200,
    description: '아바타 변경 성공',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 400, description: '잘못된 아바타 값' })
  @ApiResponse({ status: 401, description: '인증 필요' })
  async updateAvatar(
    @Req() req: AuthenticatedRequest,
    @Body() updateAvatarDto: UpdateAvatarDto,
  ): Promise<UserResponseDto> {
    return this.usersService.updateAvatar(req.user.id, updateAvatarDto);
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
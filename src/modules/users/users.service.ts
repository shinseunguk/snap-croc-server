import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserStatus } from '../../entities/user.entity';
import { UserResponseDto } from './dto/user-response.dto';
import {
  UpdateProfileDto,
  UpdateProfileResponseDto,
  AvatarType,
} from './dto/update-profile.dto';
import { ImageProcessingService } from '../../common/multer/image-processing.service';
import { join } from 'path';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly imageProcessingService: ImageProcessingService,
  ) {}

  async getUserInfo(userId: number): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    return this.mapToUserResponse(user);
  }

  async checkNicknameAvailability(nickname: string): Promise<boolean> {
    // 닉네임 유효성 검사
    this.validateNickname(nickname);

    const existingUser = await this.userRepository.findOne({
      where: { nickname },
    });

    return !existingUser;
  }

  async deleteUser(userId: number): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    // 사용자가 업로드한 프로필 이미지 삭제
    if (user.profileImageUrl) {
      const filePath = join(process.cwd(), user.profileImageUrl);
      await this.imageProcessingService.deleteFile(filePath);
    }

    // Soft delete 수행 (deletedAt 필드 설정)
    user.status = UserStatus.DEACTIVATED;
    user.isActive = false;
    await this.userRepository.save(user);
    await this.userRepository.softDelete(userId);
  }

  async updateProfile(
    userId: number,
    updateProfileDto: UpdateProfileDto,
    profileImageFile?: Express.Multer.File,
  ): Promise<UpdateProfileResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    let uploadedImageUrl: string | undefined;

    // 1. 닉네임 변경 (제공된 경우)
    if (updateProfileDto.nickname) {
      // 닉네임 유효성 검사
      this.validateNickname(updateProfileDto.nickname);

      // 중복 확인 (본인 제외)
      const existingUser = await this.userRepository.findOne({
        where: { nickname: updateProfileDto.nickname },
      });

      if (existingUser && existingUser.id !== userId) {
        throw new ConflictException('이미 사용 중인 닉네임입니다.');
      }

      user.nickname = updateProfileDto.nickname;
    }

    // 2. 프로필 이미지 업로드 (파일이 제공된 경우)
    if (profileImageFile) {
      // 기존 프로필 이미지 삭제
      if (user.profileImageUrl) {
        const oldFilePath = join(process.cwd(), user.profileImageUrl);
        await this.imageProcessingService.deleteFile(oldFilePath);
      }

      // 이미지 리사이징 및 최적화
      const processedFilePath =
        await this.imageProcessingService.resizeAndOptimize(
          profileImageFile.path,
          300,
          300,
        );

      // 상대 경로로 변환
      uploadedImageUrl = processedFilePath.replace(process.cwd(), '');
      user.profileImageUrl = uploadedImageUrl;
    }

    // 3. 아바타 설정 (타입이 제공된 경우)
    if (updateProfileDto.avatarType) {
      if (updateProfileDto.avatarType === AvatarType.EMOJI) {
        // 이모지로 설정
        if (!updateProfileDto.avatarValue) {
          throw new BadRequestException('이모지 값이 필요합니다.');
        }

        if (!this.isValidEmoji(updateProfileDto.avatarValue)) {
          throw new BadRequestException('유효한 이모지가 아닙니다.');
        }

        user.avatar = updateProfileDto.avatarValue;

        // 이모지로 변경할 때는 기존 업로드 이미지 삭제하지 않음
        // (사용자가 나중에 다시 이미지로 변경할 수 있도록)
      } else if (updateProfileDto.avatarType === AvatarType.IMAGE) {
        // 이미지로 설정
        if (!user.profileImageUrl) {
          throw new BadRequestException(
            '업로드된 프로필 이미지가 없습니다. 먼저 이미지를 업로드하거나 이미지 파일을 함께 전송해주세요.',
          );
        }
        user.avatar = undefined; // 이미지 사용 시 avatar는 undefined
      }
    }

    // 변경사항 저장
    await this.userRepository.save(user);

    return {
      user: this.mapToUserResponse(user),
      uploadedImageUrl,
      message: '프로필이 성공적으로 업데이트되었습니다.',
    };
  }

  private isValidEmoji(emoji: string): boolean {
    // 간단한 이모지 유효성 검사
    // 실제로는 더 정교한 유니코드 이모지 검증이 필요할 수 있음
    const emojiRegex =
      /^[\p{Emoji}\p{Emoji_Modifier}\p{Emoji_Component}\p{Extended_Pictographic}]+$/u;
    return emojiRegex.test(emoji) && emoji.length <= 10; // 최대 10자
  }

  private validateNickname(nickname: string): void {
    if (!nickname || nickname.trim().length === 0) {
      throw new BadRequestException('닉네임을 입력해주세요.');
    }

    if (nickname.length < 2 || nickname.length > 20) {
      throw new BadRequestException('닉네임은 2-20자 사이여야 합니다.');
    }

    // 닉네임 패턴 검사 (한글, 영문, 숫자, 언더스코어만 허용)
    const nicknameRegex = /^[가-힣a-zA-Z0-9_]+$/;
    if (!nicknameRegex.test(nickname)) {
      throw new BadRequestException(
        '닉네임은 한글, 영문, 숫자, 언더스코어(_)만 사용 가능합니다.',
      );
    }

    // 금지어 체크 (예시)
    const bannedWords = ['admin', 'administrator', 'system', 'root'];
    const lowerNickname = nickname.toLowerCase();
    if (bannedWords.some((word) => lowerNickname.includes(word))) {
      throw new BadRequestException('사용할 수 없는 닉네임입니다.');
    }
  }

  private mapToUserResponse(user: User): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      nickname: user.nickname,
      profileImage: user.profileImage,
      profileImageUrl: user.profileImageUrl,
      avatar: user.avatar,
      displayProfile: user.displayProfile,
      provider: user.provider,
      wins: user.wins,
      losses: user.losses,
      points: user.points,
      gamesPlayed: user.gamesPlayed,
      winStreak: user.winStreak,
      bestWinStreak: user.bestWinStreak,
      winRate: user.winRate,
      level: user.level,
      tier: user.tier,
      notificationSettings: user.notificationSettings,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    };
  }

  async updateNotificationSettings(
    userId: number,
    settings: { game?: boolean; marketing?: boolean },
  ): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`사용자를 찾을 수 없습니다.`);
    }

    const currentSettings = user.notificationSettings || {
      game: true,
      marketing: false,
    };
    const updatedSettings = {
      ...currentSettings,
    };

    if (settings.game !== undefined) {
      updatedSettings.game = settings.game;
    }
    if (settings.marketing !== undefined) {
      updatedSettings.marketing = settings.marketing;
    }

    user.notificationSettings = updatedSettings;
    await this.userRepository.save(user);

    return this.mapToUserResponse(user);
  }
}

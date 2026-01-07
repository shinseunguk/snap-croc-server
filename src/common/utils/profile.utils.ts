import { DisplayProfileDto, DisplayProfileType } from '../../modules/users/dto/display-profile.dto';

/**
 * 사용자 프로필 데이터로부터 실제 표시할 프로필을 계산하는 유틸리티
 * 대기실, 게임방, 랭킹 등에서 사용자 프로필을 표시할 때 사용
 */
export class ProfileUtils {
  /**
   * 프로필 표시 우선순위에 따른 실제 표시할 프로필 계산
   * @param profileImageUrl 사용자 업로드 커스텀 이미지 URL
   * @param avatar 사용자 선택 이모지
   * @param profileImage 소셜 로그인 프로필 이미지 URL
   * @returns DisplayProfileDto
   */
  static getDisplayProfile(
    profileImageUrl?: string,
    avatar?: string,
    profileImage?: string,
  ): DisplayProfileDto {
    // 1순위: 사용자가 업로드한 커스텀 이미지
    if (profileImageUrl) {
      return {
        type: DisplayProfileType.IMAGE,
        value: profileImageUrl,
        source: 'custom_upload',
      };
    }

    // 2순위: 사용자가 선택한 이모지
    if (avatar) {
      return {
        type: DisplayProfileType.EMOJI,
        value: avatar,
        source: 'selected_emoji',
      };
    }

    // 3순위: 소셜 로그인에서 가져온 프로필 이미지
    if (profileImage) {
      return {
        type: DisplayProfileType.IMAGE,
        value: profileImage,
        source: 'social_login',
      };
    }

    // 4순위: 기본 이모지
    return {
      type: DisplayProfileType.EMOJI,
      value: '🐊',
      source: 'default',
    };
  }

  /**
   * 프로필이 이미지인지 확인
   */
  static isImageProfile(displayProfile: DisplayProfileDto): boolean {
    return displayProfile.type === DisplayProfileType.IMAGE;
  }

  /**
   * 프로필이 이모지인지 확인
   */
  static isEmojiProfile(displayProfile: DisplayProfileDto): boolean {
    return displayProfile.type === DisplayProfileType.EMOJI;
  }

  /**
   * 간단한 사용자 프로필 정보 (닉네임 + 프로필)
   * 대기실, 채팅 등에서 사용할 수 있는 간소화된 사용자 정보
   */
  static createSimpleUserProfile(
    userId: number,
    nickname: string,
    displayProfile: DisplayProfileDto,
  ) {
    return {
      id: userId,
      nickname: nickname || `사용자${userId}`,
      displayProfile,
    };
  }
}
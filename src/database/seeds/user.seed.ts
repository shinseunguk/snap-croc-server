import { DataSource } from 'typeorm';
import { User, SocialProvider, UserStatus } from '../../entities/user.entity';

export async function seedUsers(dataSource: DataSource) {
  const userRepository = dataSource.getRepository(User);

  // 테스트 사용자 데이터 정의
  const testUsers = [
    {
      email: 'test1@snap-croc.com',
      name: '김테스트',
      nickname: '스냅킹',
      provider: SocialProvider.GOOGLE,
      socialId: 'test_google_id_1',
      wins: 25,
      losses: 5,
      points: 1200,
      avatar: '🐊',
      gamesPlayed: 30,
      winStreak: 5,
      bestWinStreak: 12,
    },
    {
      email: 'test2@snap-croc.com',
      name: '이테스트',
      nickname: '크록마스터',
      provider: SocialProvider.GOOGLE,
      socialId: 'test_google_id_2',
      wins: 18,
      losses: 12,
      points: 980,
      avatar: '🦎',
      gamesPlayed: 30,
      winStreak: 2,
      bestWinStreak: 8,
    },
    {
      email: 'test3@snap-croc.com',
      name: '박테스트',
      nickname: '스냅러버',
      provider: SocialProvider.KAKAO,
      socialId: 'test_kakao_id_3',
      wins: 12,
      losses: 18,
      points: 720,
      avatar: '🐸',
      gamesPlayed: 30,
      winStreak: 0,
      bestWinStreak: 5,
    },
    {
      email: 'test4@snap-croc.com',
      name: '최테스트',
      nickname: '게임고수',
      provider: SocialProvider.GOOGLE,
      socialId: 'test_google_id_4',
      wins: 35,
      losses: 10,
      points: 1500,
      avatar: '🦖',
      gamesPlayed: 45,
      winStreak: 8,
      bestWinStreak: 15,
    },
    {
      email: 'test5@snap-croc.com',
      name: '정테스트',
      nickname: '뉴비악어',
      provider: SocialProvider.KAKAO,
      socialId: 'test_kakao_id_5',
      wins: 3,
      losses: 7,
      points: 250,
      avatar: '🐢',
      gamesPlayed: 10,
      winStreak: 1,
      bestWinStreak: 2,
    },
  ];

  const createdUsers: User[] = [];

  for (const userData of testUsers) {
    // 기존 사용자가 있는지 확인
    const existingUser = await userRepository.findOne({
      where: { email: userData.email },
    });

    if (existingUser) {
      console.log(`테스트 사용자가 이미 존재합니다: ${userData.email}`);
      createdUsers.push(existingUser);
      continue;
    }

    // 새 테스트 사용자 생성
    const testUser = new User();
    testUser.email = userData.email;
    testUser.name = userData.name;
    testUser.nickname = userData.nickname;
    testUser.provider = userData.provider;
    testUser.socialId = userData.socialId;
    testUser.isActive = true;
    testUser.wins = userData.wins;
    testUser.losses = userData.losses;
    testUser.points = userData.points;
    testUser.avatar = userData.avatar;
    testUser.gamesPlayed = userData.gamesPlayed;
    testUser.winStreak = userData.winStreak;
    testUser.bestWinStreak = userData.bestWinStreak;
    testUser.status = UserStatus.ACTIVE;
    testUser.lastLoginAt = new Date();
    testUser.notificationSettings = {
      game: true,
      marketing: false,
    };

    const savedUser = await userRepository.save(testUser);
    console.log(`테스트 사용자가 생성되었습니다: ${savedUser.email}`);
    createdUsers.push(savedUser);
  }

  return createdUsers;
}

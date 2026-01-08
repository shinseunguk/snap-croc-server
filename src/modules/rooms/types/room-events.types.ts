// 클라이언트 → 서버 이벤트
export interface ClientToServerEvents {
  join_room: (data: { roomCode: string }) => void;
  leave_room: (data: { roomId: number }) => void;
  ready_toggle: (data: { roomId: number; isReady: boolean }) => void;
  kick_member: (data: { roomId: number; targetUserId: number }) => void;
  update_game_settings: (data: { 
    roomId: number; 
    totalTeeth: number; // 전체 이빨 개수 (최대 16)
  }) => void;
  
  // 게임 플레이 이벤트
  select_tooth: (data: {
    gameId: string;
    toothIndex: number; // 0부터 시작하는 이빨 인덱스
  }) => void;
}

// 서버 → 클라이언트 이벤트
export interface ServerToClientEvents {
  // 방 상태 업데이트
  room_updated: (data: RoomUpdateData) => void;
  
  // 게임 설정 업데이트
  game_settings_updated: (data: GameSettingsData) => void;
  
  // 게임 플레이 이벤트
  turn_started: (data: TurnStartedData) => void;
  tooth_selected_safe: (data: ToothSelectedSafeData) => void;
  crocodile_bite: (data: CrocodileBiteData) => void;

  // 멤버 입장/퇴장
  member_joined: (data: MemberJoinedData) => void;
  member_left: (data: MemberLeftData) => void;
  member_kicked: (data: MemberKickedData) => void;

  // 준비 상태 변경
  member_ready_changed: (data: MemberReadyData) => void;

  // 게임 시작 관련
  all_members_ready: (data: AllReadyData) => void;
  game_countdown: (data: CountdownData) => void;
  game_started: (data: GameStartedData) => void;

  // 에러
  error: (data: ErrorData) => void;
}

// 이벤트 데이터 타입들
export interface RoomUpdateData {
  roomId: number;
  currentMembers: number;
  maxMembers: number;
  status: string;
  members: Array<{
    id: number;
    nickname: string;
    avatar: { type: string; value: string };
    isReady: boolean;
    isHost: boolean;
  }>;
}

export interface MemberJoinedData {
  roomId: number;
  member: {
    id: number;
    nickname: string;
    avatar: { type: string; value: string };
    isReady: boolean;
    isHost: boolean;
  };
  currentMembers: number;
}

export interface MemberLeftData {
  roomId: number;
  userId: number;
  nickname: string;
  currentMembers: number;
  newHostId?: number; // 방장이 바뀐 경우
}

export interface MemberKickedData {
  roomId: number;
  kickedUserId: number;
  kickedUserNickname: string;
  kickedBy: number;
  kickedByNickname: string;
  currentMembers: number;
  newHostId?: number; // 방장이 바뀐 경우
}

export interface MemberReadyData {
  roomId: number;
  userId: number;
  nickname: string;
  isReady: boolean;
  allReady: boolean;
}

export interface AllReadyData {
  roomId: number;
  message: string;
}

export interface CountdownData {
  roomId: number;
  countdown: number; // 3, 2, 1, 0
}

export interface GameStartedData {
  roomId: number;
  gameId: string;
  startedAt: Date;
  totalTeeth: number; // 이번 게임의 이빨 개수
  dangerTooth: number; // 위험한 이빨 인덱스 (0부터)
  players: Array<{
    id: number;
    nickname: string;
    avatar: { type: string; value: string };
  }>;
}

export interface ErrorData {
  message: string;
  code?: string;
}

export interface GameSettingsData {
  roomId: number;
  totalTeeth: number; // 현재 설정된 이빨 개수
  updatedBy: string; // 변경한 사람 닉네임
}

export interface TurnStartedData {
  gameId: string;
  currentTurn: {
    playerId: number;
    nickname: string;
    turnNumber: number; // 몇 번째 턴인지
  };
  turnOrder: number[]; // 전체 턴 순서 (플레이어 ID 배열)
  timeLimit: number; // 턴 제한 시간 (초)
}

export interface ToothSelectedSafeData {
  gameId: string;
  playerId: number;
  nickname: string;
  toothIndex: number;
  remainingTeeth: number[]; // 남은 이빨 인덱스들
  nextTurn: {
    playerId: number;
    nickname: string;
    turnNumber: number;
  };
}

export interface CrocodileBiteData {
  gameId: string;
  playerId: number; // 뽑은 사람 (패자)
  nickname: string;
  toothIndex: number; // 위험한 이빨 번호
  message: string; // "악어가 입을 다물었습니다!"
}

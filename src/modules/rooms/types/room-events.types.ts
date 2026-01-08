// 클라이언트 → 서버 이벤트
export interface ClientToServerEvents {
  join_room: (data: { roomCode: string }) => void;
  leave_room: (data: { roomId: number }) => void;
  ready_toggle: (data: { roomId: number; isReady: boolean }) => void;
  kick_member: (data: { roomId: number; targetUserId: number }) => void;
}

// 서버 → 클라이언트 이벤트
export interface ServerToClientEvents {
  // 방 상태 업데이트
  room_updated: (data: RoomUpdateData) => void;

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
}

export interface ErrorData {
  message: string;
  code?: string;
}

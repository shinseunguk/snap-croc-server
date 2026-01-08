import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room, RoomStatus } from './entities/room.entity';
import { RoomMember } from './entities/room-member.entity';
import { Game, GameStatus } from './entities/game.entity';
import { CreateRoomResponseDto } from './dto/create-room.dto';
import { RoomResponseDto, RoomMemberDto } from './dto/room-response.dto';

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
    @InjectRepository(RoomMember)
    private readonly roomMemberRepository: Repository<RoomMember>,
    @InjectRepository(Game)
    private readonly gameRepository: Repository<Game>,
  ) {}

  private generateRoomCode(): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
  }

  private async generateUniqueRoomCode(): Promise<string> {
    let code: string;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      code = this.generateRoomCode();
      const existingRoom = await this.roomRepository.findOne({
        where: { code },
      });
      if (!existingRoom) {
        return code;
      }
      attempts++;
    } while (attempts < maxAttempts);

    throw new Error('방 코드 생성 실패');
  }

  async createRoom(userId: number): Promise<CreateRoomResponseDto> {
    // 이미 방에 참가 중인지 확인
    const existingMembership = await this.roomMemberRepository.findOne({
      where: { userId },
      relations: ['room'],
    });

    if (
      existingMembership &&
      existingMembership.room.status !== RoomStatus.FINISHED
    ) {
      throw new ConflictException('이미 다른 방에 참가 중입니다.');
    }

    // 방 생성
    const code = await this.generateUniqueRoomCode();
    const room = this.roomRepository.create({
      code,
      hostId: userId,
    });
    await this.roomRepository.save(room);

    // 방장을 멤버로 추가
    const member = this.roomMemberRepository.create({
      roomId: room.id,
      userId,
      isHost: true,
      isReady: false, // 방장도 준비 상태 관리
    });
    await this.roomMemberRepository.save(member);

    return {
      id: room.id,
      code: room.code,
      status: room.status,
      hostId: room.hostId,
      createdAt: room.createdAt,
    };
  }

  async joinRoom(userId: number, code: string): Promise<RoomResponseDto> {
    // 방 찾기
    const room = await this.roomRepository.findOne({
      where: { code: code.toUpperCase() },
      relations: ['members', 'members.user'],
    });

    if (!room) {
      throw new NotFoundException('존재하지 않는 방 코드입니다.');
    }

    if (room.status !== RoomStatus.WAITING) {
      throw new BadRequestException(
        '게임이 이미 시작되었거나 종료된 방입니다.',
      );
    }

    // 이미 방에 있는지 확인
    const existingMember = room.members.find((m) => m.userId === userId);
    if (existingMember) {
      return this.getRoomInfo(room.id);
    }

    // 방이 가득 찼는지 확인
    if (room.members.length >= room.maxMembers) {
      throw new BadRequestException('방이 가득 찼습니다.');
    }

    // 다른 방에 참가 중인지 확인
    const otherMembership = await this.roomMemberRepository.findOne({
      where: { userId },
      relations: ['room'],
    });

    if (
      otherMembership &&
      otherMembership.room.status !== RoomStatus.FINISHED
    ) {
      throw new ConflictException('이미 다른 방에 참가 중입니다.');
    }

    // 멤버 추가
    const member = this.roomMemberRepository.create({
      roomId: room.id,
      userId,
      isHost: false,
      isReady: false,
    });
    await this.roomMemberRepository.save(member);

    return this.getRoomInfo(room.id);
  }

  async getRoomInfo(roomId: number): Promise<RoomResponseDto> {
    const room = await this.roomRepository.findOne({
      where: { id: roomId },
      relations: ['members', 'members.user'],
    });

    if (!room) {
      throw new NotFoundException('방을 찾을 수 없습니다.');
    }

    const memberDtos: RoomMemberDto[] = room.members.map((member) => ({
      id: member.user.id,
      nickname: member.user.nickname || '',
      avatar:
        typeof member.user.avatar === 'string'
          ? { type: 'emoji', value: member.user.avatar }
          : member.user.avatar || { type: 'emoji', value: '🦖' },
      isReady: member.isReady,
      isHost: member.isHost,
      joinedAt: member.joinedAt,
    }));

    return {
      id: room.id,
      code: room.code,
      status: room.status,
      hostId: room.hostId,
      maxMembers: room.maxMembers,
      currentMembers: room.members.length,
      totalTeeth: room.totalTeeth,
      members: memberDtos,
      createdAt: room.createdAt,
      gameStartedAt: room.gameStartedAt,
    };
  }

  async updateReadyStatus(
    roomId: number,
    userId: number,
    isReady: boolean,
  ): Promise<RoomResponseDto> {
    const member = await this.roomMemberRepository.findOne({
      where: { roomId, userId },
      relations: ['room'],
    });

    if (!member) {
      throw new NotFoundException('방에 참가하고 있지 않습니다.');
    }

    if (member.room.status !== RoomStatus.WAITING) {
      throw new BadRequestException(
        '대기 중인 방에서만 준비 상태를 변경할 수 있습니다.',
      );
    }

    // 방장도 준비 상태 변경 가능

    member.isReady = isReady;
    await this.roomMemberRepository.save(member);

    return this.getRoomInfo(roomId);
  }

  async startGameDirectly(roomId: number): Promise<void> {
    const room = await this.roomRepository.findOne({
      where: { id: roomId },
      relations: ['members'],
    });

    if (!room) {
      throw new NotFoundException('방을 찾을 수 없습니다.');
    }

    if (room.status !== RoomStatus.WAITING) {
      throw new BadRequestException(
        '대기 중인 방에서만 게임을 시작할 수 있습니다.',
      );
    }

    // 게임 시작
    room.status = RoomStatus.IN_GAME;
    room.gameStartedAt = new Date();
    await this.roomRepository.save(room);
  }

  async leaveRoom(roomId: number, userId: number): Promise<void> {
    const member = await this.roomMemberRepository.findOne({
      where: { roomId, userId },
      relations: ['room', 'room.members'],
    });

    if (!member) {
      throw new NotFoundException('방에 참가하고 있지 않습니다.');
    }

    const room = member.room;

    // 게임 중에는 나갈 수 없음
    if (room.status === RoomStatus.IN_GAME) {
      throw new BadRequestException('게임 중에는 방을 나갈 수 없습니다.');
    }

    // 멤버 제거
    await this.roomMemberRepository.remove(member);

    // 방장이 나간 경우 처리
    if (member.isHost) {
      const remainingMembers = room.members.filter((m) => m.userId !== userId);

      if (remainingMembers.length > 0) {
        // 다음 멤버를 방장으로 지정
        const newHost = remainingMembers[0];
        newHost.isHost = true;
        // 준비 상태는 유지 (새 방장이 준비하지 않았을 수 있음)
        await this.roomMemberRepository.save(newHost);

        room.hostId = newHost.userId;
        await this.roomRepository.save(room);
      } else {
        // 마지막 멤버인 경우 방 삭제
        await this.roomRepository.remove(room);
      }
    }
  }

  async kickMember(
    roomId: number,
    hostId: number,
    targetUserId: number,
  ): Promise<RoomResponseDto> {
    const room = await this.roomRepository.findOne({
      where: { id: roomId },
      relations: ['members'],
    });

    if (!room) {
      throw new NotFoundException('방을 찾을 수 없습니다.');
    }

    if (room.hostId !== hostId) {
      throw new ForbiddenException('방장만 다른 사용자를 강퇴할 수 있습니다.');
    }

    if (room.status !== RoomStatus.WAITING) {
      throw new BadRequestException('대기 중인 방에서만 강퇴가 가능합니다.');
    }

    if (hostId === targetUserId) {
      throw new BadRequestException('자기 자신을 강퇴할 수 없습니다.');
    }

    const targetMember = room.members.find((m) => m.userId === targetUserId);
    if (!targetMember) {
      throw new NotFoundException('해당 사용자는 방에 없습니다.');
    }

    // 멤버 제거
    await this.roomMemberRepository.remove(targetMember);

    return this.getRoomInfo(roomId);
  }

  async updateGameSettings(
    roomId: number,
    userId: number,
    totalTeeth: number,
  ): Promise<RoomResponseDto> {
    const room = await this.getRoomWithMembers(roomId);

    if (!room) {
      throw new NotFoundException('방을 찾을 수 없습니다.');
    }

    // 방장 권한 확인
    if (room.hostId !== userId) {
      throw new ForbiddenException('방장만 게임 설정을 변경할 수 있습니다.');
    }

    // 대기 중인 방에서만 설정 변경 가능
    if (room.status !== RoomStatus.WAITING) {
      throw new BadRequestException('대기 중인 방에서만 설정을 변경할 수 있습니다.');
    }

    // 이빨 개수 업데이트
    room.totalTeeth = totalTeeth;
    await this.roomRepository.save(room);

    return this.getRoomInfo(roomId);
  }

  async startGameDirectly(roomId: number): Promise<Game> {
    const room = await this.getRoomWithMembers(roomId);

    if (!room) {
      throw new NotFoundException('방을 찾을 수 없습니다.');
    }

    if (room.status !== RoomStatus.WAITING) {
      throw new BadRequestException('이미 진행 중이거나 종료된 방입니다.');
    }

    // 1. 게임 생성 및 초기화
    const gameId = `game_${roomId}_${Date.now()}`;
    const playerIds = room.members.map(member => member.userId);
    
    // 2. 위험한 이빨 랜덤 선택 (0부터 totalTeeth-1 중 하나)
    const dangerTooth = Math.floor(Math.random() * room.totalTeeth);
    
    // 3. 턴 순서 랜덤 섞기
    const turnOrder = [...playerIds].sort(() => Math.random() - 0.5);

    // 4. Game 엔티티 생성
    const game = this.gameRepository.create({
      gameId,
      roomId,
      totalTeeth: room.totalTeeth,
      dangerTooth,
      playerIds,
      turnOrder,
      currentTurnIndex: 0,
      pulledTeeth: [],
    });

    await this.gameRepository.save(game);

    // 5. 방 상태 변경
    room.status = RoomStatus.IN_GAME;
    room.gameStartedAt = new Date();
    await this.roomRepository.save(room);

    return game;
  }

  async selectTooth(gameId: string, playerId: number, toothIndex: number): Promise<{ isSafe: boolean; game: Game }> {
    const game = await this.gameRepository.findOne({
      where: { gameId },
    });

    if (!game) {
      throw new NotFoundException('게임을 찾을 수 없습니다.');
    }

    // 현재 턴인지 확인
    const currentPlayerId = game.turnOrder[game.currentTurnIndex];
    if (currentPlayerId !== playerId) {
      throw new BadRequestException('당신의 턴이 아닙니다.');
    }

    // 이미 뽑힌 이빨인지 확인
    if (game.pulledTeeth.includes(toothIndex)) {
      throw new BadRequestException('이미 뽑힌 이빨입니다.');
    }

    // 유효한 이빨 인덱스인지 확인
    if (toothIndex < 0 || toothIndex >= game.totalTeeth) {
      throw new BadRequestException('유효하지 않은 이빨입니다.');
    }

    // 이빨 뽑기
    game.pulledTeeth.push(toothIndex);
    
    const isSafe = toothIndex !== game.dangerTooth;

    if (isSafe) {
      // 안전한 이빨 → 다음 턴
      game.currentTurnIndex = (game.currentTurnIndex + 1) % game.turnOrder.length;
    } else {
      // 위험한 이빨 → 게임 종료
      game.status = GameStatus.FINISHED;
      game.loserId = playerId;
      
      // 승자는 다른 플레이어
      game.winnerId = game.playerIds.find(id => id !== playerId);
      game.endedAt = new Date();

      // 방 상태도 종료로 변경
      const room = await this.roomRepository.findOne({ where: { id: game.roomId } });
      if (room) {
        room.status = RoomStatus.FINISHED;
        room.gameEndedAt = new Date();
        await this.roomRepository.save(room);
      }
    }

    await this.gameRepository.save(game);
    return { isSafe, game };
  }

  async getGame(gameId: string): Promise<Game> {
    const game = await this.gameRepository.findOne({
      where: { gameId },
    });

    if (!game) {
      throw new NotFoundException('게임을 찾을 수 없습니다.');
    }

    return game;
  }
}

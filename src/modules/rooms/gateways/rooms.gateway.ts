import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards, Logger } from '@nestjs/common';
import { WsJwtAuthGuard } from '../../../auth/guards/ws-jwt-auth.guard';
import { RoomsService } from '../rooms.service';
import { RoomStatus } from '../entities/room.entity';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  RoomUpdateData,
  MemberJoinedData,
  MemberLeftData,
  MemberKickedData,
  MemberReadyData,
  CountdownData,
  GameStartedData,
  ErrorData,
  GameSettingsData,
  TurnStartedData,
  ToothSelectedSafeData,
  CrocodileBiteData,
} from '../types/room-events.types';

interface AuthenticatedSocket extends Socket {
  user: {
    id: number;
    email: string;
    name: string;
    provider: string;
  };
}

@WebSocketGateway({
  namespace: '/rooms',
  cors: {
    origin: true,
    credentials: true,
  },
})
export class RoomsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server<ClientToServerEvents, ServerToClientEvents>;

  private readonly logger = new Logger(RoomsGateway.name);
  private userSockets = new Map<number, string>(); // userId -> socketId
  private socketRooms = new Map<string, number>(); // socketId -> roomId

  constructor(private readonly roomsService: RoomsService) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // JWT 인증은 guard에서 처리됨
      this.logger.log(
        `Client connected: ${client.id}, User: ${client.user?.id}`,
      );

      if (client.user?.id) {
        this.userSockets.set(client.user.id, client.id);
      }
    } catch (error) {
      this.logger.error(`Connection error: ${error.message}`);
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    if (client.user?.id) {
      this.userSockets.delete(client.user.id);
    }

    const roomId = this.socketRooms.get(client.id);
    if (roomId) {
      await this.handleLeaveRoom(client, { roomId });
      this.socketRooms.delete(client.id);
    }
  }

  @SubscribeMessage('join_room')
  @UseGuards(WsJwtAuthGuard)
  async handleJoinRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomCode: string },
  ) {
    try {
      const { roomCode } = data;
      const userId = client.user.id;

      // 코드로 방 입장
      const roomInfo = await this.roomsService.joinRoom(userId, roomCode);

      // Socket.IO 룸에 참가
      await client.join(`room_${roomInfo.id}`);
      this.socketRooms.set(client.id, roomInfo.id);

      // 방 업데이트 정보 전송
      const roomUpdateData: RoomUpdateData = {
        roomId: roomInfo.id,
        currentMembers: roomInfo.currentMembers,
        maxMembers: roomInfo.maxMembers,
        status: roomInfo.status,
        members: roomInfo.members,
      };

      // 자신에게는 방 전체 정보
      client.emit('room_updated', roomUpdateData);

      // 다른 멤버들에게는 입장 알림
      const joinedMember = roomInfo.members.find((m) => m.id === userId);
      if (joinedMember) {
        const memberJoinedData: MemberJoinedData = {
          roomId: roomInfo.id,
          member: joinedMember,
          currentMembers: roomInfo.currentMembers,
        };

        client
          .to(`room_${roomInfo.id}`)
          .emit('member_joined', memberJoinedData);
      }

      this.logger.log(`User ${userId} joined room ${roomInfo.id}`);
    } catch (error) {
      this.handleError(client, error.message);
    }
  }

  @SubscribeMessage('leave_room')
  @UseGuards(WsJwtAuthGuard)
  async handleLeaveRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: number },
  ) {
    try {
      const { roomId } = data;
      const userId = client.user.id;

      // 사용자 정보 조회 (나가기 전)
      const roomInfo = await this.roomsService.getRoomInfo(roomId);
      const leavingMember = roomInfo.members.find((m) => m.id === userId);

      // DB에서 방 나가기 처리
      await this.roomsService.leaveRoom(roomId, userId);

      // Socket.IO 룸에서 나가기
      await client.leave(`room_${roomId}`);
      this.socketRooms.delete(client.id);

      // 다른 멤버들에게 퇴장 알림
      if (leavingMember) {
        // 업데이트된 방 정보 조회
        let updatedRoomInfo;
        try {
          updatedRoomInfo = await this.roomsService.getRoomInfo(roomId);
        } catch (error) {
          // 방이 삭제된 경우 (마지막 멤버가 나간 경우)
          this.logger.log(`Room ${roomId} was deleted`);
          return;
        }

        const memberLeftData: MemberLeftData = {
          roomId,
          userId,
          nickname: leavingMember.nickname,
          currentMembers: updatedRoomInfo.currentMembers,
          newHostId:
            updatedRoomInfo.hostId !== roomInfo.hostId
              ? updatedRoomInfo.hostId
              : undefined,
        };

        this.server.to(`room_${roomId}`).emit('member_left', memberLeftData);

        // 방 전체 업데이트 정보도 전송
        const roomUpdateData: RoomUpdateData = {
          roomId: updatedRoomInfo.id,
          currentMembers: updatedRoomInfo.currentMembers,
          maxMembers: updatedRoomInfo.maxMembers,
          status: updatedRoomInfo.status,
          members: updatedRoomInfo.members,
        };

        this.server.to(`room_${roomId}`).emit('room_updated', roomUpdateData);
      }

      this.logger.log(`User ${userId} left room ${roomId}`);
    } catch (error) {
      this.handleError(client, error.message);
    }
  }

  @SubscribeMessage('ready_toggle')
  @UseGuards(WsJwtAuthGuard)
  async handleReadyToggle(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: number; isReady: boolean },
  ) {
    try {
      const { roomId, isReady } = data;
      const userId = client.user.id;

      // 준비 상태 업데이트
      const updatedRoomInfo = await this.roomsService.updateReadyStatus(
        roomId,
        userId,
        isReady,
      );

      // 사용자 정보 조회
      const readyMember = updatedRoomInfo.members.find((m) => m.id === userId);

      if (readyMember) {
        // 모든 멤버가 준비되었는지 확인
        const allReady =
          updatedRoomInfo.members.length >= 2 &&
          updatedRoomInfo.members.every((m) => m.isReady);

        // 준비 상태 변경 알림
        const memberReadyData: MemberReadyData = {
          roomId,
          userId,
          nickname: readyMember.nickname,
          isReady,
          allReady,
        };

        this.server
          .to(`room_${roomId}`)
          .emit('member_ready_changed', memberReadyData);

        // 모든 멤버가 준비되었으면 게임 시작 카운트다운
        if (allReady && updatedRoomInfo.status === RoomStatus.WAITING) {
          await this.startGameCountdown(roomId);
        }
      }

      this.logger.log(
        `User ${userId} ready status changed to ${isReady} in room ${roomId}`,
      );
    } catch (error) {
      this.handleError(client, error.message);
    }
  }

  @SubscribeMessage('update_game_settings')
  @UseGuards(WsJwtAuthGuard)
  async handleUpdateGameSettings(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: number; totalTeeth: number },
  ) {
    try {
      const { roomId, totalTeeth } = data;
      const userId = client.user.id;

      // 이빨 개수 유효성 검사
      if (totalTeeth < 4 || totalTeeth > 16) {
        throw new Error('이빨 개수는 4개 이상 16개 이하여야 합니다.');
      }

      // 방장 권한 확인 및 설정 업데이트
      const updatedRoom = await this.roomsService.updateGameSettings(
        roomId,
        userId,
        totalTeeth,
      );

      // 설정 변경 알림
      const hostMember = updatedRoom.members.find(m => m.isHost);
      
      this.server.to(`room_${roomId}`).emit('game_settings_updated', {
        roomId,
        totalTeeth,
        updatedBy: hostMember?.nickname || '방장',
      });

      this.logger.log(
        `Game settings updated for room ${roomId}: ${totalTeeth} teeth`,
      );
    } catch (error) {
      this.handleError(client, error.message);
    }
  }

  @SubscribeMessage('kick_member')
  @UseGuards(WsJwtAuthGuard)
  async handleKickMember(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: number; targetUserId: number },
  ) {
    try {
      const { roomId, targetUserId } = data;
      const hostId = client.user.id;

      // 강퇴 대상 정보 조회 (강퇴 전)
      const roomInfo = await this.roomsService.getRoomInfo(roomId);
      const targetMember = roomInfo.members.find((m) => m.id === targetUserId);
      const hostMember = roomInfo.members.find((m) => m.id === hostId);

      if (!targetMember) {
        throw new Error('해당 사용자를 찾을 수 없습니다.');
      }

      if (!hostMember) {
        throw new Error('권한이 없습니다.');
      }

      // 서비스에서 강퇴 처리
      const updatedRoomInfo = await this.roomsService.kickMember(
        roomId,
        hostId,
        targetUserId,
      );

      // 강퇴당한 사용자의 소켓 찾기
      const targetSocketId = this.userSockets.get(targetUserId);

      // 강퇴당한 사용자를 Socket.IO 룸에서 제거
      if (targetSocketId) {
        const targetSocket = this.server.sockets.sockets.get(targetSocketId);
        if (targetSocket) {
          await targetSocket.leave(`room_${roomId}`);
          this.socketRooms.delete(targetSocketId);

          // 강퇴당한 사용자에게 알림
          targetSocket.emit('error', {
            message: '방에서 강퇴되었습니다.',
            code: 'KICKED_FROM_ROOM',
          });
        }
      }

      // 모든 멤버들에게 강퇴 알림
      const memberKickedData: MemberKickedData = {
        roomId,
        kickedUserId: targetUserId,
        kickedUserNickname: targetMember.nickname,
        kickedBy: hostId,
        kickedByNickname: hostMember.nickname,
        currentMembers: updatedRoomInfo.currentMembers,
        newHostId:
          updatedRoomInfo.hostId !== roomInfo.hostId
            ? updatedRoomInfo.hostId
            : undefined,
      };

      this.server.to(`room_${roomId}`).emit('member_kicked', memberKickedData);

      // 방 전체 업데이트 정보도 전송
      const roomUpdateData: RoomUpdateData = {
        roomId: updatedRoomInfo.id,
        currentMembers: updatedRoomInfo.currentMembers,
        maxMembers: updatedRoomInfo.maxMembers,
        status: updatedRoomInfo.status,
        members: updatedRoomInfo.members,
      };

      this.server.to(`room_${roomId}`).emit('room_updated', roomUpdateData);

      this.logger.log(
        `User ${targetUserId} was kicked from room ${roomId} by ${hostId}`,
      );
    } catch (error) {
      this.handleError(client, error.message);
    }
  }

  private async startGameCountdown(roomId: number) {
    this.logger.log(`Starting game countdown for room ${roomId}`);

    // 3초 카운트다운
    for (let i = 3; i > 0; i--) {
      const countdownData: CountdownData = {
        roomId,
        countdown: i,
      };
      this.server.to(`room_${roomId}`).emit('game_countdown', countdownData);

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    // 게임 시작
    try {
      // 게임 생성 및 초기화
      const game = await this.roomsService.startGameDirectly(roomId);
      const roomInfo = await this.roomsService.getRoomInfo(roomId);
      
      // 게임 시작 데이터 (위험한 이빨 정보는 제외)
      const gameStartedData: GameStartedData = {
        roomId,
        gameId: game.gameId,
        startedAt: game.startedAt,
        totalTeeth: game.totalTeeth,
        dangerTooth: -1, // 클라이언트에게는 숨김
        players: roomInfo.members.map(member => ({
          id: member.id,
          nickname: member.nickname,
          avatar: member.avatar,
        })),
      };
      
      this.server.to(`room_${roomId}`).emit('game_started', gameStartedData);
      
      // 첫 번째 턴 시작
      await this.startFirstTurn(game);
      
      this.logger.log(`Game started for room ${roomId}`);
    } catch (error) {
      this.logger.error(
        `Failed to start game for room ${roomId}: ${error.message}`,
      );
      this.handleError(null, error.message, roomId);
    }
  }

  private handleError(
    client: AuthenticatedSocket | null,
    message: string,
    roomId?: number,
  ) {
    this.logger.error(`WebSocket Error: ${message}`);

    const errorData: ErrorData = {
      message,
    };

    if (client) {
      client.emit('error', errorData);
    } else if (roomId) {
      this.server.to(`room_${roomId}`).emit('error', errorData);
    }
  }

  @SubscribeMessage('select_tooth')
  @UseGuards(WsJwtAuthGuard)
  async handleSelectTooth(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { gameId: string; toothIndex: number },
  ) {
    try {
      const { gameId, toothIndex } = data;
      const userId = client.user.id;

      // 이빨 선택 처리
      const result = await this.roomsService.selectTooth(gameId, userId, toothIndex);
      const game = result.game;

      if (result.isSafe) {
        // 안전한 이빨 - 다음 턴 진행
        const nextPlayer = await this.getUserInfo(game.turnOrder[game.currentTurnIndex]);
        
        const toothSelectedSafeData: ToothSelectedSafeData = {
          gameId,
          playerId: userId,
          nickname: client.user.name,
          toothIndex,
          remainingTeeth: this.getRemainingTeeth(game.totalTeeth, game.pulledTeeth),
          nextTurn: {
            playerId: nextPlayer.id,
            nickname: nextPlayer.nickname,
            turnNumber: game.pulledTeeth.length + 1,
          },
        };

        this.server.to(`room_${game.roomId}`).emit('tooth_selected_safe', toothSelectedSafeData);

        // 다음 턴 시작
        const turnStartedData: TurnStartedData = {
          gameId,
          currentTurn: {
            playerId: nextPlayer.id,
            nickname: nextPlayer.nickname,
            turnNumber: game.pulledTeeth.length + 1,
          },
          turnOrder: game.turnOrder,
          timeLimit: 30, // 30초 제한
        };

        this.server.to(`room_${game.roomId}`).emit('turn_started', turnStartedData);

      } else {
        // 위험한 이빨 - 게임 종료
        const crocodileBiteData: CrocodileBiteData = {
          gameId,
          playerId: userId,
          nickname: client.user.name,
          toothIndex,
          message: '악어가 입을 다물었습니다! 💀',
        };

        this.server.to(`room_${game.roomId}`).emit('crocodile_bite', crocodileBiteData);

        // 게임 종료 처리
        await this.handleGameEnd(game);
      }

      this.logger.log(`User ${userId} selected tooth ${toothIndex} in game ${gameId}`);
    } catch (error) {
      this.handleError(client, error.message);
    }
  }

  private async startFirstTurn(game: any) {
    const firstPlayer = await this.getUserInfo(game.turnOrder[0]);
    
    const turnStartedData: TurnStartedData = {
      gameId: game.gameId,
      currentTurn: {
        playerId: firstPlayer.id,
        nickname: firstPlayer.nickname,
        turnNumber: 1,
      },
      turnOrder: game.turnOrder,
      timeLimit: 30,
    };

    this.server.to(`room_${game.roomId}`).emit('turn_started', turnStartedData);
  }

  private async handleGameEnd(game: any) {
    // 승자와 패자 정보 조회
    const winner = await this.getUserInfo(game.winnerId);
    const loser = await this.getUserInfo(game.loserId);

    const gameEndedData = {
      roomId: game.roomId,
      gameId: game.gameId,
      winner: {
        id: winner.id,
        nickname: winner.nickname,
        avatar: winner.avatar,
      },
      loser: {
        id: loser.id,
        nickname: loser.nickname,
        eliminatedBy: 'crocodile_bite' as const,
        toothIndex: game.dangerTooth,
      },
      stats: {
        duration: Math.floor((new Date().getTime() - game.startedAt.getTime()) / 1000),
        totalTurns: game.pulledTeeth.length,
        teethPulled: game.pulledTeeth.length,
      },
    };

    this.server.to(`room_${game.roomId}`).emit('game_ended', gameEndedData);

    // 3초 후 방으로 복귀
    setTimeout(() => {
      this.server.to(`room_${game.roomId}`).emit('return_to_room', {
        roomId: game.roomId,
      });
    }, 3000);
  }

  private getRemainingTeeth(totalTeeth: number, pulledTeeth: number[]): number[] {
    const remaining: number[] = [];
    for (let i = 0; i < totalTeeth; i++) {
      if (!pulledTeeth.includes(i)) {
        remaining.push(i);
      }
    }
    return remaining;
  }

  private async getUserInfo(userId: number) {
    // 임시로 고정 정보 반환 (실제로는 User 서비스에서 조회)
    return { id: userId, nickname: `Player${userId}`, avatar: { type: 'emoji', value: '🦖' } };
  }

  // 외부에서 호출할 수 있는 유틸리티 메서드들
  async notifyRoomUpdate(roomId: number) {
    try {
      const roomInfo = await this.roomsService.getRoomInfo(roomId);
      const roomUpdateData: RoomUpdateData = {
        roomId: roomInfo.id,
        currentMembers: roomInfo.currentMembers,
        maxMembers: roomInfo.maxMembers,
        status: roomInfo.status,
        members: roomInfo.members,
      };

      this.server.to(`room_${roomId}`).emit('room_updated', roomUpdateData);
    } catch (error) {
      this.logger.error(`Failed to notify room update: ${error.message}`);
    }
  }
}

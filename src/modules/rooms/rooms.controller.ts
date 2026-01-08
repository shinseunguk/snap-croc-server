import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { RoomsService } from './rooms.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CreateRoomResponseDto } from './dto/create-room.dto';
import { JoinRoomDto } from './dto/join-room.dto';
import { RoomResponseDto } from './dto/room-response.dto';
import { User } from '../../entities/user.entity';
import type { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: User;
}

@ApiTags('게임 룸')
@Controller('rooms')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  @ApiOperation({ summary: '방 만들기' })
  @ApiResponse({
    status: 201,
    description: '방 생성 성공',
    type: CreateRoomResponseDto,
  })
  @ApiResponse({ status: 409, description: '이미 다른 방에 참가 중' })
  async createRoom(
    @Req() req: AuthenticatedRequest,
  ): Promise<CreateRoomResponseDto> {
    return this.roomsService.createRoom(req.user.id);
  }

  @Post('join')
  @ApiOperation({ summary: '코드로 방 입장' })
  @ApiResponse({
    status: 200,
    description: '방 입장 성공',
    type: RoomResponseDto,
  })
  @ApiResponse({ status: 400, description: '방이 가득 찼거나 게임 중' })
  @ApiResponse({ status: 404, description: '존재하지 않는 방 코드' })
  @ApiResponse({ status: 409, description: '이미 다른 방에 참가 중' })
  async joinRoom(
    @Req() req: AuthenticatedRequest,
    @Body() joinRoomDto: JoinRoomDto,
  ): Promise<RoomResponseDto> {
    return this.roomsService.joinRoom(req.user.id, joinRoomDto.code);
  }

  @Get(':roomId')
  @ApiOperation({ summary: '방 정보 조회' })
  @ApiParam({ name: 'roomId', type: 'number' })
  @ApiResponse({
    status: 200,
    description: '방 정보 조회 성공',
    type: RoomResponseDto,
  })
  @ApiResponse({ status: 404, description: '방을 찾을 수 없음' })
  async getRoomInfo(
    @Param('roomId', ParseIntPipe) roomId: number,
  ): Promise<RoomResponseDto> {
    return this.roomsService.getRoomInfo(roomId);
  }
}

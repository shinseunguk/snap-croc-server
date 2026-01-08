import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Room } from './room.entity';

export enum GameStatus {
  PLAYING = 'playing',
  FINISHED = 'finished',
}

@Entity('games')
export class Game {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  gameId: string; // "game_{roomId}_{timestamp}"

  @Column()
  roomId: number;

  @ManyToOne(() => Room)
  @JoinColumn({ name: 'roomId' })
  room: Room;

  @Column({
    type: 'enum',
    enum: GameStatus,
    default: GameStatus.PLAYING,
  })
  status: GameStatus;

  @Column()
  totalTeeth: number; // 이 게임의 이빨 개수

  @Column()
  dangerTooth: number; // 위험한 이빨 인덱스

  @Column('simple-array')
  playerIds: number[]; // 참가한 플레이어 ID들

  @Column('simple-array')
  turnOrder: number[]; // 턴 순서

  @Column({ default: 0 })
  currentTurnIndex: number; // 현재 턴 인덱스

  @Column('simple-array', { default: '' })
  pulledTeeth: number[]; // 뽑힌 이빨들

  @Column({ nullable: true })
  winnerId: number;

  @Column({ nullable: true })
  loserId: number;

  @CreateDateColumn()
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  endedAt: Date;
}
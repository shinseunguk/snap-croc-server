import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../../entities/user.entity';
import { RoomMember } from './room-member.entity';

export enum RoomStatus {
  WAITING = 'waiting',
  IN_GAME = 'in_game',
  FINISHED = 'finished',
}

@Entity('rooms')
export class Room {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 6, unique: true })
  code: string;

  @Column({
    type: 'enum',
    enum: RoomStatus,
    default: RoomStatus.WAITING,
  })
  status: RoomStatus;

  @Column()
  hostId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'hostId' })
  host: User;

  @Column({ default: 8 })
  maxMembers: number;

  @OneToMany(() => RoomMember, (member) => member.room, {
    cascade: true,
  })
  members: RoomMember[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  gameStartedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  gameEndedAt: Date;
}

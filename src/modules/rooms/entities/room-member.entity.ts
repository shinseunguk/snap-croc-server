import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from '../../../entities/user.entity';
import { Room } from './room.entity';

@Entity('room_members')
@Unique(['roomId', 'userId'])
export class RoomMember {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  roomId: number;

  @Column()
  userId: number;

  @ManyToOne(() => Room, (room) => room.members, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'roomId' })
  room: Room;

  @ManyToOne(() => User, {
    eager: true,
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ default: false })
  isReady: boolean;

  @Column({ default: false })
  isHost: boolean;

  @CreateDateColumn()
  joinedAt: Date;
}

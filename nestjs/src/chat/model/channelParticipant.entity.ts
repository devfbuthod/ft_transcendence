import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from 'src/user/model/user.entity';
import { Channel } from './channel.entity';

export enum ChannelRole {
  OWNER = 'Owner',
  ADMIN = 'Admin',
  USER = 'User',
}

export enum StatusInChannel {
  NORMAL = 'Normal',
  MUTE = 'Mute',
  BAN = 'Ban',
}

@Entity('channelParticipant')
export class ChannelParticipant {
  @PrimaryGeneratedColumn()
  public id!: number;

  @Column()
  public userId!: number;

  @Column()
  public channelId!: number;

  @ManyToOne(() => User, (user) => user.channelParticipant)
  public user!: User;

  @ManyToOne(() => Channel, (channel) => channel.participant, {
    onDelete: 'CASCADE',
  })
  public channel!: Channel;

  @Column({
    type: 'enum',
    enum: ChannelRole,
    default: ChannelRole.USER,
  })
  public role: ChannelRole;

  @Column({
    type: 'enum',
    enum: StatusInChannel,
    default: StatusInChannel.NORMAL,
  })
  public status: StatusInChannel;

  @Column({
    type: 'timestamptz',
    default: null,
  })
  statusExpiration: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  public createDate: Date;
}

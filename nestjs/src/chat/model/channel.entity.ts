import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ChannelParticipant } from './channelParticipant.entity';
import { Message } from './messages.entity';

export enum ChannelType {
  PUBLIC = 'Public',
  PRIVATE = 'Private',
  DIRECT = 'Direct',
}

@Entity()
export class Channel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name!: string;

  /**
   * Contain Bcrypt hashed password of channel if is private
   */
  @Column({ nullable: true })
  password: string;

  @Column({
    type: 'enum',
    enum: ChannelType,
    default: ChannelType.PUBLIC,
  })
  type: ChannelType;

  @CreateDateColumn({ type: 'timestamptz' })
  createDate!: Date;

  @OneToMany(() => ChannelParticipant, (participant) => participant.channel, {
    onDelete: 'CASCADE',
  })
  participant!: ChannelParticipant[];

  @OneToMany(() => Message, (messages) => messages.channel)
  messages!: Message[];
}

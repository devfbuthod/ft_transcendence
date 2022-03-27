import { ChannelParticipant } from 'src/chat/model/channelParticipant.entity';
import { Message } from 'src/chat/model/messages.entity';
import { Game } from 'src/game/model/game.entity';
import UserRelationship from 'src/relationship/model/userRelationship.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryColumn,
} from 'typeorm';
import UserGameRecords from '../../game/model/userGameRecords.entity';
import DatabaseFile from './databasefile.entity';

export enum SiteStatus {
  OWNER = 'Owner',
  MODERATOR = 'Moderator',
  USER = 'User',
  BANNED = 'Banned',
}

export enum OnlineStatus {
  AVAILABLE = 'Available',
  PALYING = 'Playing',
  OFFLINE = 'Offline',
}

@Entity()
export class User {
  @PrimaryColumn()
  id: number;

  @Column()
  nickname: string;

  @Column({ nullable: true })
  avatar: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createDate: Date;

  @Column({
    type: 'enum',
    enum: OnlineStatus,
  })
  userStatus: OnlineStatus;

  @Column({
    type: 'enum',
    enum: SiteStatus,
  })
  siteStatus: SiteStatus;

  @Column({ nullable: true })
  email?: string;

  @Column({ default: false })
  isTwoFactorAuthenticationEnabled: boolean;

  @Column({ nullable: true })
  twoFactorAuthenticationSecret?: string;

  @OneToMany(() => UserGameRecords, (userGameRecords) => userGameRecords.user)
  userGameRecords!: UserGameRecords[];

  @OneToMany(() => Game, (game) => game.winner)
  victories: Game[];

  @OneToMany(
    () => UserRelationship,
    (userRelationship) => userRelationship.user,
  )
  userRelationship!: UserRelationship[];

  @OneToMany(
    () => ChannelParticipant,
    (channelParticipant) => channelParticipant.user,
  )
  public channelParticipant!: ChannelParticipant[];

  @OneToMany(() => Message, (message) => message.author)
  public message!: Message[];

  @OneToOne(() => DatabaseFile, (databaseFile) => databaseFile.user, {
    nullable: true,
  })
  avatarFile?: DatabaseFile;
}

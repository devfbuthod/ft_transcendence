import { User } from 'src/user/model/user.entity';
import UserGameRecords from 'src/game/model/userGameRecords.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  UpdateDateColumn,
} from 'typeorm';

export enum GameMode {
  NORMAL = 'Normal',
  BONUS = 'Bonus',
}

export enum GameStatus {
  ONGOING = 'Ongoing',
  FINISH = 'Finish',
}

@Entity()
export class Game {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: GameMode,
  })
  mode: GameMode;

  @CreateDateColumn({ type: 'timestamptz' })
  createDate: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updateDate: Date;

  @Column({
    type: 'enum',
    enum: GameStatus,
    default: GameStatus.ONGOING,
  })
  status: GameStatus;

  @OneToMany(() => UserGameRecords, (userGameRecords) => userGameRecords.game)
  userGameRecords!: UserGameRecords[];

  @ManyToOne(() => User, (user) => user.victories)
  winner: User;
}

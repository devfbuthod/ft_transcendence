import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Game } from 'src/game/model/game.entity';
import { User } from 'src/user/model/user.entity';

@Entity('userGameRecords')
class UserGameRecords {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  userId!: number;

  @Column()
  gameId!: number;

  @Column()
  score?: number;

  @ManyToOne(() => User, (user) => user.userGameRecords)
  user!: User;

  @ManyToOne(() => Game, (game) => game.userGameRecords)
  game!: Game;
}

export default UserGameRecords;

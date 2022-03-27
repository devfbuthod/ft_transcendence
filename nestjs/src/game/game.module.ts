import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import UserGameRecords from 'src/game/model/userGameRecords.entity';
import { User } from 'src/user/model/user.entity';
import { UserModule } from 'src/user/user.module';
import { GameController } from './controller/game.controller';
import { Game } from './model/game.entity';
import { GameService } from './service/game.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Game, UserGameRecords]),
    UserModule,
  ],
  controllers: [GameController],
  providers: [GameService],
  exports: [GameService],
})
export class GameModule {}

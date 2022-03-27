import { Module } from '@nestjs/common';
import { PongGateway } from './pong.gateway';
import { PongService } from './pong.game.service';
import { PongUsersService } from './pong.users.service';
import { AuthModule } from 'src/auth/auth.module';
import { UserModule } from 'src/user/user.module';
import { GameModule } from 'src/game/game.module';

@Module({
  imports: [AuthModule, UserModule, GameModule],
  providers: [PongGateway, PongService, PongUsersService],
})
export class PongModule {}

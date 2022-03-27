import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { GameService } from '../service/game.service';
import { CurrentUser } from 'src/auth/decorator/currrent.user.decorator';
import { User } from 'src/user/model/user.entity';
import { JwtAuthGuard } from 'src/auth/guard/jwt.guard';
import { SendGameDto } from '../model/send-game.dto';
import { SendOngoingGameDto } from '../model/send-ongoging-game.dto';
import { SendUserGameRecordsDto } from '../model/send-user-game-records.dto';
import UserGameRecords from '../model/userGameRecords.entity';
import { JwtTwoFactorGuard } from 'src/auth/guard/jwt-two-factor.guard';

@UseGuards(JwtAuthGuard)
@UseGuards(JwtTwoFactorGuard)
@Controller('game')
export class GameController {
  constructor(private gameService: GameService) {}

  /*
   ** getAll returns all game records
   */
  @Get('all')
  getGames(): Promise<SendGameDto[]> {
    return this.gameService.getAll();
  }

  /*
   ** getOngoingGames returns current games
   */
  @Get('ongoing')
  getOngoingGames(): Promise<SendOngoingGameDto[]> {
    return this.gameService.getOngoingGames();
  }

  /*
   ** getGameById returns the game with details
   ** parameter id : game's id
   */
  @Get(':id')
  getGameById(@Param('id', ParseIntPipe) id: number): Promise<SendGameDto> {
    return this.gameService.getGameById(id);
  }

  /*
   ** getMyGameRecords returns user's finish game
   */
  @Get('me/records')
  getMyGameRecords(
    @CurrentUser() user: User,
  ): Promise<SendUserGameRecordsDto[]> {
    return this.gameService.getUserGameRecords(user.id);
  }

  /*
   ** getUserGameRecords returns user's finish game
   ** parameter id : user's id
   */
  @Get(':id/records')
  getUserGameRecords(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<SendUserGameRecordsDto[]> {
    return this.gameService.getUserGameRecords(id);
  }

  /*
   ** getUserCurrentGame returns user's current game
   */
  @Get(':id/current')
  getUserCurrentGameId(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<UserGameRecords> {
    return this.gameService.getUserCurrentGameId(id);
  }
}

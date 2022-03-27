import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import UserGameRecords from 'src/game/model/userGameRecords.entity';
import { UserService } from 'src/user/service/user.service';
import { Repository } from 'typeorm';
import { InsertGameResultDto } from '../model/insert-gameResult.dto';
import { CreateGameDto } from '../model/create-game.dto';
import { SendGameDto } from '../model/send-game.dto';
import { Game, GameMode, GameStatus } from '../model/game.entity';
import { User } from 'src/user/model/user.entity';
import { SendOngoingGameDto } from '../model/send-ongoging-game.dto';
import { SendUserGameRecordsDto } from '../model/send-user-game-records.dto';

@Injectable()
export class GameService {
  constructor(
    @InjectRepository(Game) private gameRepository: Repository<Game>,
    @InjectRepository(UserGameRecords)
    private userGameRecords: Repository<UserGameRecords>,
    @Inject(UserService) private readonly userService: UserService,
  ) {}

  async getAll(): Promise<SendGameDto[]> {
    const games = await this.gameRepository.find({
      relations: ['userGameRecords', 'winner'],
      order: { createDate: 'DESC' },
    });
    const ret = games.map((data) => {
      const obj = {
        id: data.id,
        mode: data.mode,
        status: data.status,
        createDate: data.createDate,
        updateDate: data.updateDate,
        leftUserId: data.userGameRecords[0].userId,
        leftUserScore: data.userGameRecords[0].score,
        rightUserId: data.userGameRecords[1].userId,
        rightUserScore: data.userGameRecords[1].score,
        winnerId: data.winner === null ? null : data.winner.id,
      };
      return obj;
    });
    return ret;
  }

  async finishGame() {
    this.gameRepository
      .createQueryBuilder()
      .update(Game)
      .set({ status: GameStatus.FINISH, winner: undefined })
      .where('status = :status', { status: GameStatus.ONGOING })
      .execute();
  }

  async getOngoingGames(): Promise<SendOngoingGameDto[]> {
    const games = await this.gameRepository.find({
      where: { status: GameStatus.ONGOING },
      relations: ['userGameRecords'],
      order: { createDate: 'DESC' },
    });
    const ret = games.map((data) => {
      const obj = {
        id: data.id,
        mode: data.mode,
        createDate: data.createDate,
        leftUserId: data.userGameRecords[0].userId,
        rightUserId: data.userGameRecords[1].userId,
      };
      return obj;
    });
    return ret;
  }

  async getGameById(id: number): Promise<SendGameDto> {
    const game = await this.gameRepository.find({
      where: { id: id },
      relations: ['userGameRecords', 'winner'],
    });
    if (game.length === 0) {
      throw new HttpException(
        'Game with this id does not exist.',
        HttpStatus.NOT_FOUND,
      );
    }
    const ret = game.map((data) => {
      const obj = {
        id: data.id,
        mode: data.mode,
        status: data.status,
        createDate: data.createDate,
        updateDate: data.updateDate,
        leftUserId: data.userGameRecords[0].userId,
        leftUserScore: data.userGameRecords[0].score,
        rightUserId: data.userGameRecords[1].userId,
        rightUserScore: data.userGameRecords[1].score,
        winnerId: data.winner === null ? null : data.winner.id,
      };
      return obj;
    });
    return ret[0];
  }

  async getUserGameRecords(id: number): Promise<SendUserGameRecordsDto[]> {
    await this.userService.getUserProfileById(id);
    const games = await this.userGameRecords.find({
      where: { userId: id, game: { status: GameStatus.FINISH } },
      relations: ['game', 'game.userGameRecords', 'game.winner'],
      order: { gameId: 'DESC' },
    });
    const ret = games.map((data) => {
      const oppo = data.game.userGameRecords.filter(
        (data) => data.userId !== id,
      );
      const obj = {
        gameId: data.gameId,
        mode: data.game.mode,
        createDate: data.game.createDate,
        updateDate: data.game.updateDate,
        userScore: data.score,
        opponentId: oppo[0].userId,
        opponentScore: oppo[0].score,
        userGameStatus:
          data.game.winner === null
            ? 'Null'
            : data.game.winner.id === id
            ? 'Won'
            : 'Lost',
      };
      return obj;
    });
    return ret;
  }

  async getUserCurrentGameId(id: number): Promise<UserGameRecords> {
    await this.userService.getUserProfileById(id);
    const game = await this.userGameRecords.find({
      where: { userId: id },
      select: ['gameId'],
    });
    return game[0];
  }

  async createGame(dto: CreateGameDto, mode: GameMode) {
    await this.checkUsersIdAndAvailability(dto.leftUserId, dto.rightUserId);
    const newGame = this.gameRepository.create();
    newGame.mode = mode;
    await this.gameRepository.save(newGame);
    await this.addUsersToGame(newGame.id, dto);
    return newGame;
  }

  async insertGameResult(
    id: number,
    insertGameResultDto: InsertGameResultDto,
  ): Promise<Game> {
    const game = await this.getOneById(id);
    if (game.status === GameStatus.FINISH) {
      throw new HttpException(
        'This game has already inserted results, can not modify scores again.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const gameRecord = await this.userGameRecords.find({ gameId: id });
    gameRecord[0].score = insertGameResultDto.leftUserScore;
    gameRecord[1].score = insertGameResultDto.rightUserScore;
    await this.userGameRecords.save(gameRecord);

    let winner: User;
    if (gameRecord[0].score > gameRecord[1].score) {
      winner = await this.userService.getOneById(gameRecord[0].userId);
    } else if (gameRecord[0].score < gameRecord[1].score) {
      winner = await this.userService.getOneById(gameRecord[1].userId);
    }
    const gameFinish = await this.getOneById(id);
    gameFinish.winner = winner;
    gameFinish.status = GameStatus.FINISH;
    return this.gameRepository.save(gameFinish);
  }

  /****************************************************************************/
  /*                                 utils                                    */
  /****************************************************************************/

  /*
   ** getOneById returns the game detail
   */
  getOneById(id: number): Promise<Game> {
    return this.gameRepository.findOne(id, {
      relations: ['userGameRecords', 'winner'],
    });
  }

  /*
   ** addUsersToGame add two players to userGameRecords entity
   */
  async addUsersToGame(gameId: number, dto: CreateGameDto): Promise<void> {
    const leftUser = this.userGameRecords.create();
    leftUser.gameId = gameId;
    leftUser.userId = dto.leftUserId;
    leftUser.score = 0;
    await this.userGameRecords.save(leftUser);

    const rightUser = this.userGameRecords.create();
    rightUser.gameId = gameId;
    rightUser.userId = dto.rightUserId;
    rightUser.score = 0;
    await this.userGameRecords.save(rightUser);
  }

  /****************************************************************************/
  /*                                 checkers                                 */
  /****************************************************************************/

  async checkOneUserAvailability(userId: number): Promise<void> {
    const game = await this.userGameRecords.find({
      where: { userId: userId, game: { status: GameStatus.ONGOING } },
      relations: ['game'],
    });
    if (game[0])
      throw new HttpException(
        `You are already in a game !`,
        HttpStatus.BAD_REQUEST,
      );
  }

  async checkUsersIdAndAvailability(
    userOne: number,
    userTwo: number,
  ): Promise<void> {
    if (userOne === userTwo) {
      throw new HttpException('Same player ids !', HttpStatus.BAD_REQUEST);
    }
    /* check users exist */
    await Promise.all([
      this.userService.getUserProfileById(userOne),
      this.userService.getUserProfileById(userTwo),
    ]);
    const [userOneCurrentGame, userTwoCurrentGame] = await Promise.all([
      this.getUserCurrentGame(userOne),
      this.getUserCurrentGame(userTwo),
    ]);
    if (userOneCurrentGame || userTwoCurrentGame) {
      throw new HttpException(
        'One of the users is playing, cannot start a new game right now !',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async getUserCurrentGame(id: number): Promise<UserGameRecords> {
    await this.userService.getUserProfileById(id);
    const game = await this.userGameRecords.find({
      where: { userId: id, game: { status: GameStatus.ONGOING } },
      relations: ['game'],
    });
    return game[0];
  }
}

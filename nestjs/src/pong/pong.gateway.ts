import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { AuthService } from 'src/auth/service/auth.service';
import { OnlineStatus, User } from 'src/user/model/user.entity';
import { UserService } from 'src/user/service/user.service';
import { PongService } from './pong.game.service';
import { PongUsersService } from './pong.users.service';
import { FRAMERATE } from './pong.env';
import { GameService } from 'src/game/service/game.service';
import { GameMode } from 'src/game/model/game.entity';
import { parse } from 'cookie';
import { UseGuards } from '@nestjs/common';
import { WsGuard } from 'src/auth/guard/ws.guard';
// https://www.generacodice.com/en/articolo/713202/how-can-i-find-the-response-time-latency-of-a-client-in-nodejs-with-sockets-socket-

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

@WebSocketGateway({
  namespace: 'pong',
  cors: {
    origin: 'http://' + process.env.DOMAIN_FRONTEND + '/*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
})
@UseGuards(WsGuard)
export class PongGateway {
  constructor(
    private pongService: PongService,
    private authService: AuthService,
    private userService: UserService,
    private pongUsersService: PongUsersService,
    private gameService: GameService,
  ) {}

  @WebSocketServer() server: Socket;

  /**
   * Call after socket creation
   */
  async afterInit() {
    try {
      await this.gameService.finishGame();
    } catch (error) {
      console.log(error);
    }
  }

  async handleConnection(client: Socket) {
    let jwtCookie: string;
    if (client.handshake.headers.cookie)
      jwtCookie = parse(client.handshake.headers.cookie).jwt;
    if (jwtCookie !== undefined) {
      try {
        const user: User = await this.authService.getUserFromSocket(client);
        client.join(user.id.toString());
        this.pongUsersService.userConnect(user.id);
        const resp = this.pongUsersService.isInMatchmaking(user.id);
        client.emit('inMatchMaking', resp);
      } catch (error) {
        client.emit(`alert`, {
          alert: { type: `danger`, message: error.error },
        });
      }
    }
  }

  async handleDisconnect(client: Socket) {
    let jwtCookie: string;
    if (client.handshake.headers.cookie)
      jwtCookie = parse(client.handshake.headers.cookie).jwt;
    if (jwtCookie !== undefined) {
      try {
        const user: User = await this.authService.getUserFromSocket(client);
        client.leave(user.id.toString());
        const currentGame = this.pongService.userDiconnectFromGame(client.id);
        this.pongService.setDisconnected(user.id, false);
        if (currentGame) {
          await this.userService.setUserStatus(user.id, OnlineStatus.AVAILABLE);
          this.server.emit('reload-status', {
            user_id: user.id,
            status: OnlineStatus.AVAILABLE,
          });
          client.leave(currentGame.toString() + '-Game');
        }
        await sleep(2000);
        const left = this.pongUsersService.userDisconnect(user.id);
        if (this.pongUsersService.isInMatchmaking(user.id) && !left) {
          this.pongUsersService.removePlayer(user.id);
        }
        if (this.pongUsersService.isInMatchmakingBonus(user.id) && !left) {
          this.pongUsersService.removePlayerBonus(user.id);
        }
      } catch (error) {
        client.emit(`alert`, {
          alert: { type: `danger`, message: error.error },
        });
      }
    }
  }

  /**
   *
   * @param client Socket de la fenetre qui se connecte au jeu (peut etre plusieur par joueur)
   * si le joueur n'est pas dans la file d'attente, l'ajoute et envoie l'info aux autres fenetre de ce joueur
   */
  @SubscribeMessage('matchmakingON')
  async enterMatchMakingRoom(client: Socket) {
    try {
      const user: User = await this.authService.getUserFromSocket(client);
      if (user.userStatus === OnlineStatus.PALYING)
        throw new WsException(`You are already in a game !`);
      await this.gameService.checkOneUserAvailability(user.id);
      console.log('New Player Joins', user.id.toString());
      //client.emit('inMatchMaking', true);
      this.server.to(user.id.toString()).emit('inMatchMaking', true);
      this.pongUsersService.addNewPlayer(user.id);
      await sleep(2000);
      const userArray = await this.pongUsersService.makeMatchMaking();
      if (userArray) {
        console.log(userArray);
        const GameId = this.pongUsersService.createGameId();
        this.pongService.createNewMatch(
          GameId,
          userArray,
          this.userService,
          false,
        );
        userArray.forEach((e) => {
          this.server.to(e.toString()).emit('inMatchMaking', false);
          this.server.to(e.toString()).emit('inGame', GameId);
        });
      }
    } catch (error) {
      client.emit(`alert`, { alert: { type: `danger`, message: error.error } });
    }
  }

  @SubscribeMessage('matchmakingOFF')
  async leaveMatchMakingRoom(client: Socket) {
    try {
      const user: User = await this.authService.getUserFromSocket(client);

      console.log(`${user.id} ${user.nickname} left Match Making.`);
      this.server.to(user.id.toString()).emit('inMatchMaking', false);
      this.pongUsersService.removePlayer(user.id);
      this.pongUsersService.removePlayerBonus(user.id);
    } catch (error) {
      client.emit(`alert`, { alert: { type: `danger`, message: error.error } });
    }
  }

  @SubscribeMessage('isInMatchmaking?')
  async isInMatchmaking(client: Socket) {
    try {
      const user: User = await this.authService.getUserFromSocket(client);
      const resp = this.pongUsersService.isInAMatchMaking(user.id);
      client.emit('inMatchMaking', resp);
    } catch (error) {
      client.emit(`alert`, { alert: { type: `danger`, message: error.error } });
    }
  }

  @SubscribeMessage('spectate')
  async spectateGame(client: Socket, payload: number) {
    try {
      const user: User = await this.authService.getUserFromSocket(client);
      if (user.userStatus === OnlineStatus.PALYING)
        throw new WsException(`You can't spectate while you're in a game.`);
      // client emit le fait qu'il regarde une partie
      const game = this.pongService.getMatchIdByPlayerId(payload);
      if (!game)
        throw new WsException(
          `the game you want to spectate is over or does not exists`,
        );
      if (!this.pongService.isGameRunning(game))
        throw new WsException(`This game just finished. Maybe next time.`);
      client.join(game.toString() + '-Game');
      client.emit('spectateOn', game);
      client.emit('startWatch', this.pongService.sendPlayersInfos(game));
      if (this.pongService.isBonusGame(game)) {
        client.emit('bonusType', this.pongService.gameInfosBonusType(game));
        client.emit('bonusBH', this.pongService.gameInfosBonusBH(game));
      }
      client.emit('sendScore', this.pongService.sendScore(game));
    } catch (error) {
      client.emit(`alert`, { alert: { type: `danger`, message: error.error } });
    }
  }
  @SubscribeMessage('stopSpectating')
  async stopSpectatingGame(client: Socket, payload: number) {
    try {
      if (payload === 0)
        throw new WsException(`this match is not playing anymore`);
      client.leave(payload.toString() + '-Game');
      client.emit('spectateOn', 0);
    } catch (error) {
      client.emit(`alert`, { alert: { type: `danger`, message: error.error } });
    }
  }

  @SubscribeMessage('tryToInvite')
  async tryToInvite(client: Socket, payload: number) {
    try {
      const user = this.authService.getPayloadFromAuthenticationToken(
        client.handshake.headers.cookie,
      );
      const opponent = await this.userService.getOneById(payload);
      if (opponent.userStatus !== OnlineStatus.AVAILABLE)
        throw new WsException(`${opponent.nickname} is not available 😱.`);
      this.server
        .to(payload.toString())
        .emit('invite', { id: user.id, name: user.username, modal: true });
    } catch (error) {
      client.emit(`alert`, { alert: { type: `danger`, message: error.error } });
    }
  }

  @SubscribeMessage('inviteAnsw')
  async getResponse(client: Socket, payload: { id: number; resp: number }) {
    try {
      const user: User = await this.authService.getUserFromSocket(client);

      if (user.userStatus !== OnlineStatus.AVAILABLE) {
        this.server.to(payload.id.toString()).emit(`alert`, {
          alert: {
            type: `warning`,
            message: `${user.nickname} has started another game!`,
          },
        });
      } else if (payload.resp > 0) {
        this.server.to(payload.id.toString()).emit(`alert`, {
          alert: {
            type: `warning`,
            message:
              payload.resp === 1
                ? `${user.nickname} declined your game proposal, sorry mate !`
                : `${user.nickname} says NOPE to you beeyatch !`,
          },
        });
      } else {
        const userArray = [user.id, payload.id];
        const GameId = this.pongUsersService.createGameId();
        this.pongService.createNewMatch(
          GameId,
          userArray,
          this.userService,
          true,
        );
        userArray.forEach((e) => {
          if (this.pongUsersService.isInMatchmaking(e)) {
            this.pongUsersService.removePlayer(e);
          }
          if (this.pongUsersService.isInMatchmakingBonus(e)) {
            this.pongUsersService.removePlayerBonus(e);
          }
          this.server.to(e.toString()).emit('inMatchMaking', false);
          this.server.to(e.toString()).emit('inGameBonus', GameId);
        });
      }
    } catch (error) {
      client.emit(`alert`, { alert: { type: `danger`, message: error.error } });
    }
  }
  @SubscribeMessage('reloadStartGame')
  reloadStartGame(client: Socket) {
    try {
      const user = this.authService.getPayloadFromAuthenticationToken(
        client.handshake.headers.cookie,
      );
      this.server.to(user.id.toString()).emit('resetGameModal');
    } catch (error) {
      client.emit(`alert`, { alert: { type: `danger`, message: error.error } });
    }
  }

  @SubscribeMessage('reloadInvite')
  reloadInvite(client: Socket) {
    try {
      const user = this.authService.getPayloadFromAuthenticationToken(
        client.handshake.headers.cookie,
      );
      this.server.to(user.id.toString()).emit('inviteRemove');
    } catch (error) {
      client.emit(`alert`, { alert: { type: `danger`, message: error.error } });
    }
  }

  @SubscribeMessage('down')
  onDown(client: Socket, payload: boolean) {
    try {
      const user = this.authService.getPayloadFromAuthenticationToken(
        client.handshake.headers.cookie,
      );
      this.pongService.setKeyValue(false, user.id, payload);
    } catch (error) {
      client.emit(`alert`, { alert: { type: `danger`, message: error.error } });
    }
  }

  @SubscribeMessage('up')
  onUp(client: Socket, payload: boolean) {
    try {
      const user = this.authService.getPayloadFromAuthenticationToken(
        client.handshake.headers.cookie,
      );
      this.pongService.setKeyValue(true, user.id, payload);
    } catch (error) {
      client.emit(`alert`, { alert: { type: `danger`, message: error.error } });
    }
  }

  @SubscribeMessage('space')
  onSpace(client: Socket, payload: boolean) {
    try {
      const user = this.authService.getPayloadFromAuthenticationToken(
        client.handshake.headers.cookie,
      );
      this.pongService.setSpace(user.id, payload);
    } catch (error) {
      client.emit(`alert`, { alert: { type: `danger`, message: error.error } });
    }
  }

  @SubscribeMessage('gameOff')
  async setUserBack(client: Socket) {
    try {
      const user: User = await this.authService.getUserFromSocket(client);
      client.emit('spectateOn', 0);
      if (user.userStatus === OnlineStatus.PALYING) {
        await this.userService.setUserStatus(user.id, OnlineStatus.AVAILABLE);
        this.server.emit('reload-status', {
          user_id: user.id,
          status: OnlineStatus.AVAILABLE,
        });
      }
    } catch (error) {
      client.emit(`alert`, { alert: { type: `danger`, message: error.error } });
    }
  }
  @SubscribeMessage('ready')
  async readyForGame(client: Socket, payload: number) {
    try {
      const user: User = await this.authService.getUserFromSocket(client);
      const infos = this.pongService.playersSetReady(
        payload,
        user.id,
        client.id,
      );
      const toLeave = this.pongService.getAllMatchIdButThisOne(infos.GameId);
      toLeave.forEach((gameId) => client.leave(gameId.toString() + '-Game'));
      client.emit('spectate', 0);
      client.join(infos.GameId.toString() + '-Game');
      const waitForReady = setInterval(async () => {
        const ready = this.pongService.playersReadyCheck(payload);
        if (ready === undefined) {
          clearInterval(waitForReady);
          client.emit(`alert`, {
            alert: {
              type: `danger`,
              message: 'This Game already took place, just start another game.',
            },
          });
          return;
        }
        if (ready) {
          clearInterval(waitForReady);
          let ret;
          if (infos.Player === 1) {
            ret = await this.gameService.createGame(
              this.pongService.getPlayers(infos.GameId),
              GameMode.NORMAL,
            );
          }
          await this.userService.setUserStatus(user.id, OnlineStatus.PALYING);
          this.server.emit('reload-status', {
            user_id: user.id,
            status: OnlineStatus.PALYING,
          });
          if (infos.Player === 1) {
            this.pongService.setDatabaseId(infos.GameId, ret.id);
            this.server
              .to(infos.GameId.toString() + '-Game')
              .emit('startPong', this.pongService.sendPlayersInfos(payload));
            this.startGame(infos.GameId);
          }
        }
        if (this.pongService.playersDisconnectCheck(infos.GameId)) {
          clearInterval(waitForReady);
          client.leave(infos.GameId.toString() + '-Game');
          client.emit(`alert`, {
            alert: {
              type: `warning`,
              message:
                'your opponent is running away, you must go back to matchmaking',
            },
          });
        }
      }, 100);
    } catch (error) {
      client.emit(`alert`, { alert: { type: `danger`, message: error.error } });
    }
  }

  // loop from https://timetocode.tumblr.com/post/71512510386/an-accurate-node-js-game-loop-inbetween-settimeout-and
  startGame(gameId: number) {
    const refreshTime: number = 1000 / FRAMERATE;
    let lastRefresh = Date.now();
    this.pongService.setGameRunning(gameId, true);
    const roomName = gameId.toString() + '-Game';
    if (gameId >= 0) {
      const GameLoop = async () => {
        const now = Date.now();
        if (lastRefresh + refreshTime <= now) {
          lastRefresh = now;
          this.pongService.UpdateGame(gameId);
          this.server
            .to(roomName)
            .volatile.emit('infos', this.pongService.gameInfos(gameId));
        }
        if (this.pongService.goal(gameId)) {
          this.server
            .to(roomName)
            .emit('sendScore', this.pongService.sendScore(gameId));

          if (this.pongService.isEndGame(gameId)) {
            this.pongService.setGameRunning(gameId, false);
          } else {
            this.pongService.setGoal(gameId, false);
          }
        }
        if (!this.pongService.isGameRunning(gameId)) {
          console.log(`Game ${gameId} stopped`);
          this.server
            .to(roomName)
            .emit('GameFinals', this.pongService.sendFinalModal(gameId));
          this.gameService.insertGameResult(
            this.pongService.getDatabaseId(gameId),
            this.pongService.getResults(gameId),
          );
          const players = this.pongService.getPlayers(gameId);
          await this.userService.setUserStatus(
            players.leftUserId,
            OnlineStatus.AVAILABLE,
          );
          this.server.emit('reload-status', {
            user_id: players.leftUserId,
            status: OnlineStatus.AVAILABLE,
          });
          await this.userService.setUserStatus(
            players.rightUserId,
            OnlineStatus.AVAILABLE,
          );
          this.server.emit('reload-status', {
            user_id: players.rightUserId,
            status: OnlineStatus.AVAILABLE,
          });
          this.pongService.deleteGame(gameId);
          return;
        }
        if (Date.now() - lastRefresh < refreshTime - 16) {
          setTimeout(GameLoop);
        } else {
          setImmediate(GameLoop);
        }
      };
      GameLoop();
    }
  }

  /*
██████   ██████  ███    ██ ██    ██ ███████ 
██   ██ ██    ██ ████   ██ ██    ██ ██      
██████  ██    ██ ██ ██  ██ ██    ██ ███████ 
██   ██ ██    ██ ██  ██ ██ ██    ██      ██ 
██████   ██████  ██   ████  ██████  ███████ 
  */

  @SubscribeMessage('BonusmatchmakingON')
  async enterMatchMakingRoomBonus(client: Socket) {
    try {
      const user: User = await this.authService.getUserFromSocket(client);
      if (user.userStatus === OnlineStatus.PALYING)
        throw new WsException(`You are already in a game !`);
      await this.gameService.checkOneUserAvailability(user.id);

      console.log(`${user.id} ${user.nickname} joined Bonus Match Making.`);
      this.server.to(user.id.toString()).emit('inMatchMaking', true);
      this.pongUsersService.addNewPlayerBonus(user.id);
      await sleep(2000);
      const userArray = await this.pongUsersService.makeMatchMakingBonus();
      if (userArray) {
        const GameId = this.pongUsersService.createGameId();
        this.pongService.createNewMatch(
          GameId,
          userArray,
          this.userService,
          true,
        );
        userArray.forEach((e) => {
          this.server.to(e.toString()).emit('inMatchMaking', false);
          this.server.to(e.toString()).emit('inGameBonus', GameId);
        });
      }
    } catch (error) {
      client.emit(`alert`, { alert: { type: `danger`, message: error.error } });
    }
  }

  @SubscribeMessage('readyBonus')
  async readyForGameBonus(client: Socket, payload: number) {
    try {
      const user: User = await this.authService.getUserFromSocket(client);
      const infos = this.pongService.playersSetReady(
        payload,
        user.id,
        client.id,
      );
      const toLeave = this.pongService.getAllMatchIdButThisOne(infos.GameId);
      toLeave.forEach((gameId) => client.leave(gameId.toString() + '-Game'));
      client.emit('spectate', 0);
      client.join(infos.GameId.toString() + '-Game');
      const waitForReady = setInterval(async () => {
        const ready = this.pongService.playersReadyCheck(payload);
        if (ready === undefined) {
          clearInterval(waitForReady);
          client.emit(`alert`, {
            alert: {
              type: `danger`,
              message: 'This Game already took place, just start another game.',
            },
          });
          return;
        }
        if (ready) {
          clearInterval(waitForReady);
          let ret;
          if (infos.Player === 1) {
            ret = await this.gameService.createGame(
              this.pongService.getPlayers(infos.GameId),
              GameMode.NORMAL,
            );
          }
          await this.userService.setUserStatus(user.id, OnlineStatus.PALYING);
          this.server.emit('reload-status', {
            user_id: user.id,
            status: OnlineStatus.PALYING,
          });
          if (infos.Player === 1) {
            this.pongService.setDatabaseId(infos.GameId, ret.id);
            this.server
              .to(infos.GameId.toString() + '-Game')
              .emit(
                'startPongBonus',
                this.pongService.sendPlayersInfos(payload),
              );
            this.startGameBonus(infos.GameId);
          }
        }
        if (this.pongService.playersDisconnectCheck(infos.GameId)) {
          clearInterval(waitForReady);

          client.leave(infos.GameId.toString() + '-Game');
          client.emit(`alert`, {
            alert: {
              type: `warning`,
              message:
                'your opponent is running away, you must go back to matchmaking',
            },
          });
        }
      }, 100);
    } catch (error) {
      client.emit(`alert`, { alert: { type: `danger`, message: error.error } });
    }
  }

  // loop from https://timetocode.tumblr.com/post/71512510386/an-accurate-node-js-game-loop-inbetween-settimeout-and
  startGameBonus(gameId: number) {
    const refreshTime: number = 1000 / FRAMERATE;
    let lastRefresh = Date.now();
    this.pongService.setGameRunning(gameId, true);
    const roomName = gameId.toString() + '-Game';
    if (gameId >= 0) {
      this.server.to(roomName).emit('sendScore', { scoreL: 0, scoreR: 0 });
      if (!this.pongService.checkOk(gameId))
        throw new WsException(
          'there is an error with this game, please start a new one.',
        );
      const GameLoop = async () => {
        const now = Date.now();
        if (lastRefresh + refreshTime <= now) {
          lastRefresh = now;
          this.pongService.UpdateGameBonus(gameId);
          this.server
            .to(roomName)
            .volatile.emit('infos', this.pongService.gameInfos(gameId));
        }
        this.checkBonusToEmit(gameId, roomName);
        if (this.pongService.goal(gameId)) {
          this.server
            .to(roomName)
            .emit('sendScore', this.pongService.sendScore(gameId));
          if (this.pongService.isEndGame(gameId)) {
            this.pongService.setGameRunning(gameId, false);
          } else {
            this.pongService.setGoal(gameId, false);
          }
        }
        if (!this.pongService.isGameRunning(gameId)) {
          console.log(`Game ${gameId} stopped`);
          this.server
            .to(roomName)
            .emit('GameFinals', this.pongService.sendFinalModal(gameId));
          this.gameService.insertGameResult(
            this.pongService.getDatabaseId(gameId),
            this.pongService.getResults(gameId),
          );
          const players = this.pongService.getPlayers(gameId);
          await this.userService.setUserStatus(
            players.leftUserId,
            OnlineStatus.AVAILABLE,
          );
          this.server.emit('reload-status', {
            user_id: players.leftUserId,
            status: OnlineStatus.AVAILABLE,
          });
          await this.userService.setUserStatus(
            players.rightUserId,
            OnlineStatus.AVAILABLE,
          );
          this.server.emit('reload-status', {
            user_id: players.rightUserId,
            status: OnlineStatus.AVAILABLE,
          });
          this.pongService.deleteGame(gameId);
          return;
        }
        if (Date.now() - lastRefresh < refreshTime - 16) {
          setTimeout(GameLoop);
        } else {
          setImmediate(GameLoop);
        }
      };
      GameLoop();
    }
  }

  checkBonusToEmit(gameId: number, roomName: string) {
    const leftCkeck = this.pongService.isBonusUPL(gameId);
    const rightCheck = this.pongService.isBonusUPR(gameId);

    if (leftCkeck === 1 || rightCheck === 1) {
      this.server
        .to(roomName)
        .volatile.emit('bonusY', this.pongService.gameInfosBonusY(gameId));
    }
    if (leftCkeck === 2 || rightCheck === 2) {
      this.server
        .to(roomName)
        .emit('bonusY', this.pongService.gameInfosBonusY(gameId));
      this.server
        .to(roomName)
        .emit('bonusType', this.pongService.gameInfosBonusType(gameId));
    }
    if (leftCkeck === 3 || rightCheck === 3) {
      this.server
        .to(roomName)
        .emit('bonusLaunch', this.pongService.gameInfosBonusLaunch(gameId));
    }
    if (leftCkeck === 4 || rightCheck === 4) {
      this.server
        .to(roomName)
        .emit('bonusBH', this.pongService.gameInfosBonusBH(gameId));
    }
  }
}

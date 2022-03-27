import { Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import {
  Ball,
  Paddle,
  Player,
  ObjectToCollide,
  Match,
  Pos,
  SideBonus,
} from './pong.interface';
import { Socket } from 'socket.io';
import { UserService } from 'src/user/service/user.service';
import { User } from 'src/user/model/user.entity';
import {
  XR,
  XL,
  Y,
  MAXANGLE,
  LITTLEANGLE,
  BALLSPEED,
  H,
  W,
  FRICTIONANGLE,
  MAXSCORE,
  NONE,
  BONUSY,
  BONUSTYPE,
  BONUSBH,
  BONUSLAUNCH,
} from './pong.env';

@Injectable()
export class PongService {
  // constructor(private schedulerRegistry: SchedulerRegistry){}
  private matches: Match[] = [];

  /*
░██████╗░███████╗████████╗████████╗███████╗██████╗░░██████╗
██╔════╝░██╔════╝╚══██╔══╝╚══██╔══╝██╔════╝██╔══██╗██╔════╝
██║░░██╗░█████╗░░░░░██║░░░░░░██║░░░█████╗░░██████╔╝╚█████╗░
██║░░╚██╗██╔══╝░░░░░██║░░░░░░██║░░░██╔══╝░░██╔══██╗░╚═══██╗
╚██████╔╝███████╗░░░██║░░░░░░██║░░░███████╗██║░░██║██████╔╝
░╚═════╝░╚══════╝░░░╚═╝░░░░░░╚═╝░░░╚══════╝╚═╝░░╚═╝╚═════╝░
*/

  getMatchById(id: number) {
    return this.matches.find((e) => {
      e.id === id;
    });
  }

  getMatchIdByPlayerId(playerId: number) {
    const found = this.matches
      .slice()
      .reverse()
      .find((e) => e.pOne.id === playerId || e.pTwo.id === playerId);
    if (found) return found.id;
    return 0;
  }

  playersReadyCheck(gameId): boolean | undefined {
    const currentGame = this.matches.find((e) => e.id === gameId);
    if (!currentGame.pOne || !currentGame.pTwo) return undefined;
    if (currentGame.pOne.ready && currentGame.pTwo.ready) return true;
    return false;
  }

  playersDisconnectCheck(gameId): boolean {
    const currentGame = this.matches.find((e) => e.id === gameId);
    if (!currentGame.pOne.connected || !currentGame.pTwo.connected) return true;
    return false;
  }

  isGameRunning(gameId: number): boolean {
    let ret = false;
    this.matches.forEach((match) => {
      if (match.id === gameId) ret = match.run;
    });
    return ret;
  }

  goal(gameId: number) {
    return this.matches.find((match) => match.id === gameId).goal;
  }

  isEndGame(gameId: number) {
    const currentGame = this.matches.find((match) => match.id === gameId);
    if (currentGame.scoreL === MAXSCORE || currentGame.scoreR === MAXSCORE)
      return true;
    return false;
  }

  getPlayers(gameId: number) {
    const currentGame = this.matches.find((match) => match.id === gameId);
    return {
      leftUserId: currentGame.pOne.id,
      rightUserId: currentGame.pTwo.id,
    };
  }

  getResults(gameId: number) {
    const currentGame = this.matches.find((match) => match.id === gameId);
    return {
      leftUserScore: currentGame.scoreL,
      rightUserScore: currentGame.scoreR,
    };
  }
  getDatabaseId(gameId: number) {
    return this.matches.find((match) => match.id === gameId).dbId;
  }

  isBonusUPL(gameId: number) {
    return this.matches.find((match) => match.id === gameId).bonus.left.bonusUp;
  }

  isBonusUPR(gameId: number) {
    return this.matches.find((match) => match.id === gameId).bonus.right
      .bonusUp;
  }

  isBonusGame(gameId: number) {
    const match = this.matches.find((match) => match.id === gameId);
    if (match.bonus === undefined) return false;
    return true;
  }

  getAllMatchIdButThisOne(thisOne: number) {
    let newArr: number[] = [];
    this.matches.forEach((value) => {
      if (value.id !== thisOne) newArr = [...newArr, value.id];
    });
    return newArr;
  }

  userDiconnectFromGame(clientId: string) {
    let ret = 0;
    this.matches.forEach((match) => {
      if (match.pOne.client === clientId) {
        match.run = false;
        match.pOne.ready = false;
        ret = match.id;
      } else if (match.pTwo.client === clientId) {
        match.run = false;
        match.pTwo.ready = false;
        ret = match.id;
      }
    });
    return ret;
  }
  /*
░██████╗███████╗████████╗████████╗███████╗██████╗░░██████╗
██╔════╝██╔════╝╚══██╔══╝╚══██╔══╝██╔════╝██╔══██╗██╔════╝
╚█████╗░█████╗░░░░░██║░░░░░░██║░░░█████╗░░██████╔╝╚█████╗░
░╚═══██╗██╔══╝░░░░░██║░░░░░░██║░░░██╔══╝░░██╔══██╗░╚═══██╗
██████╔╝███████╗░░░██║░░░░░░██║░░░███████╗██║░░██║██████╔╝
╚═════╝░╚══════╝░░░╚═╝░░░░░░╚═╝░░░╚══════╝╚═╝░░╚═╝╚═════╝░
*/

  private setNewMatch(
    id: number,
    p1: Player,
    p2: Player,
    bonus: boolean,
  ): Match {
    const newMatch: Match = {
      id: id,
      ball: {
        pos: { x: W * 0.5, y: H * 0.5 },
        radius: 15,
        vx: Math.random() > 0.5 ? 1 : -1,
        vy: 0,
        speed: BALLSPEED,
        acceleration: 1,
      },
      paddleL: {
        h: H / 6,
        w: W * 0.02,
        pos: {
          x: W * 0.01,
          y: 0,
        },
        speed: 10, //TODO
      },
      paddleR: {
        h: H / 6,
        w: W * 0.02,
        pos: {
          x: W * 0.97,
          y: H - H / 6,
        },
        speed: 10, // TODO
      },
      scoreL: 0,
      scoreR: 0,
      lastp: false,
      lasty: false,
      pOne: { ...p1 },
      pTwo: { ...p2 },
      run: false,
      goal: false,
      dbId: 0,
      bonus: !bonus
        ? undefined
        : {
            left: {
              y: -1,
              yStart: 0,
              type: 0,
              start: 0,
              bonusUp: NONE,
            },
            right: {
              y: -1,
              yStart: 0,
              type: 0,
              start: 0,
              bonusUp: NONE,
            },
            leftBH: undefined,
            rightBH: undefined,
            blackHoles: '00000000',
            lastBH: 0,
          },
    };
    return newMatch;
  }

  private async createPlayerById(
    id: number,
    userService: UserService,
    paddle: number,
  ): Promise<Player> {
    try {
      const user: User = await userService.getOneById(id);
      const newPlayer: Player = {
        name: user.nickname,
        id: id,
        client: '',
        avatar: user.avatar,
        paddle: paddle,
        score: 0,
        up: false,
        down: false,
        ready: false,
        space: false,
        connected: true,
      };
      return newPlayer;
    } catch (error) {
      console.log(error);
    }
  }

  setKeyValue(up: boolean, id: number, value: boolean) {
    this.matches.forEach((match) => {
      if (match.pOne.id === id) {
        if (up) match.pOne.up = value;
        else match.pOne.down = value;
      }
      if (match.pTwo.id === id) {
        if (up) match.pTwo.up = value;
        else match.pTwo.down = value;
      }
    });
  }

  setSpace(id: number, value: boolean) {
    this.matches.forEach((match) => {
      if (match.pOne.id === id) {
        match.pOne.space = value;
      }
      if (match.pTwo.id === id) {
        match.pTwo.space = value;
      }
    });
  }

  setDisconnected(userId: number, value: boolean) {
    this.matches.forEach((match) => {
      if (match.pOne.id === userId) {
        match.pOne.connected = value;
      }
      if (match.pTwo.id === userId) {
        match.pTwo.connected = value;
      }
    });
  }
  playersSetReady(
    gameId: number,
    playerId: number,
    client: string,
  ): { GameId: number; Player: number } {
    let player = 0;
    this.matches.forEach((match) => {
      if (match.id === gameId) {
        if (playerId === match.pOne.id) {
          match.pOne.client = client;
          match.pOne.ready = true;
          player = 1;
        }
        if (playerId === match.pTwo.id) {
          match.pTwo.client = client;
          match.pTwo.ready = true;
          player = 2;
        }
      }
    });
    return { GameId: gameId, Player: player };
  }

  setGameRunning(gameId: number, running: boolean) {
    this.matches.forEach((match) => {
      if (match.id === gameId) {
        match.run = running;
      }
    });
  }

  setGoal(gameId: number, isGoal: boolean) {
    this.matches.forEach((match) => {
      if (match.id === gameId) {
        match.goal = isGoal;
      }
    });
  }

  setDatabaseId(gameId: number, dbId: number) {
    this.matches.forEach((match) => {
      if (match.id === gameId) {
        match.dbId = dbId;
      }
    });
  }
  /*
  
███╗░░░███╗░█████╗░████████╗░█████╗░██╗░░██╗  ██╗░░██╗░█████╗░███╗░░██╗██████╗░██╗░░░░░███████╗██████╗░░██████╗
████╗░████║██╔══██╗╚══██╔══╝██╔══██╗██║░░██║  ██║░░██║██╔══██╗████╗░██║██╔══██╗██║░░░░░██╔════╝██╔══██╗██╔════╝
██╔████╔██║███████║░░░██║░░░██║░░╚═╝███████║  ███████║███████║██╔██╗██║██║░░██║██║░░░░░█████╗░░██████╔╝╚█████╗░
██║╚██╔╝██║██╔══██║░░░██║░░░██║░░██╗██╔══██║  ██╔══██║██╔══██║██║╚████║██║░░██║██║░░░░░██╔══╝░░██╔══██╗░╚═══██╗
██║░╚═╝░██║██║░░██║░░░██║░░░╚█████╔╝██║░░██║  ██║░░██║██║░░██║██║░╚███║██████╔╝███████╗███████╗██║░░██║██████╔╝
╚═╝░░░░░╚═╝╚═╝░░╚═╝░░░╚═╝░░░░╚════╝░╚═╝░░╚═╝  ╚═╝░░╚═╝╚═╝░░╚═╝╚═╝░░╚══╝╚═════╝░╚══════╝╚══════╝╚═╝░░╚═╝╚═════╝░
*/
  /**
   *
   * @param id Match id
   * @param userIdArr ids of the 2 players
   * @param userService YOU KNOW
   * @param bonus true if bonus is enabled
   * @returns nothing
   */
  async createNewMatch(
    id: number,
    usersIdArr: number[],
    userService: UserService,
    bonus: boolean,
  ) {
    if (this.matches.find((match) => match.id === id) === undefined) {
      const pOne = await this.createPlayerById(usersIdArr[0], userService, 1);
      const pTwo = await this.createPlayerById(usersIdArr[1], userService, 2);
      this.matches.push(this.setNewMatch(id, pOne, pTwo, bonus));
    }
  }
  /**
   *
   * @param gameId Match id
   * @returns an object with players informations to send to the front
   */
  sendPlayersInfos(gameId: number) {
    const currentGame = this.matches.find((e) => e.id === gameId);
    return {
      pLName: currentGame.pOne.name,
      pLAvatar: currentGame.pOne.avatar,
      pRName: currentGame.pTwo.name,
      pRAvatar: currentGame.pTwo.avatar,
    };
  }

  sendScore(matchId: number) {
    const currentGame = this.matches.find((e) => e.id === matchId);
    return {
      scoreL: currentGame.scoreL,
      scoreR: currentGame.scoreR,
    };
  }
  /**
   * @param gameId Match id
   * @returns an object with game informations
   */

  gameInfos(matchId: number) {
    const currentGame = this.matches.find((e) => e.id === matchId);
    return {
      pOneY: currentGame.paddleL.pos.y,
      pTwoY: currentGame.paddleR.pos.y,
      ballX: currentGame.ball.pos.x,
      ballY: currentGame.ball.pos.y,
    };
  }

  /**
   * @param gameId Match id
   * @returns an object with game informations
   */

  gameInfosBonusY(matchId: number) {
    const currentGame = this.matches.find((e) => e.id === matchId);
    return {
      yL: currentGame.bonus.left.y,
      yR: currentGame.bonus.right.y,
    };
  }

  gameInfosBonusType(matchId: number) {
    const currentGame = this.matches.find((e) => e.id === matchId);
    return {
      typeL: currentGame.bonus.left.start ? 0 : currentGame.bonus.left.type,
      typeR: currentGame.bonus.right.start ? 0 : currentGame.bonus.right.type,
    };
  }

  gameInfosBonusLaunch(matchId: number) {
    const currentGame = this.matches.find((e) => e.id === matchId);
    return {
      startL:
        currentGame.bonus.left.start !== 0 ? 0 : currentGame.bonus.left.type,
      startR:
        currentGame.bonus.right.start !== 0 ? 0 : currentGame.bonus.right.type,
    };
  }
  gameInfosBonusBH(matchId: number) {
    const currentGame = this.matches.find((e) => e.id === matchId);
    return currentGame.bonus.blackHoles;
  }
  /**
   * @param gameId Match id
   * @returns an object with the results of the game
   */
  sendFinalModal(matchId: number) {
    // envoyer egalement a la DB
    const currentGame: Match = this.matches.find((e) => e.id === matchId);
    let ret: any;
    if (!currentGame.pTwo.ready || !currentGame.pOne.ready) {
      ret = {
        type: 'forfait',
        loser: !currentGame.pOne.ready
          ? currentGame.pOne.name
          : currentGame.pTwo.name,
      };
      currentGame.pOne.ready
        ? (currentGame.scoreL = 42)
        : (currentGame.scoreR = 42);
    } else {
      currentGame.pOne.score = currentGame.scoreL;
      currentGame.pTwo.score = currentGame.scoreR;
      const winner =
        currentGame.scoreL > currentGame.scoreR
          ? currentGame.pOne
          : currentGame.pTwo;
      const loser =
        currentGame.scoreL > currentGame.scoreR
          ? currentGame.pTwo
          : currentGame.pOne;

      ret = {
        type: 'win',
        winner: winner.name,
        winnerScore: winner.score,
        loser: loser.name,
        loserScore: loser.score,
      };
    }
    return ret;
  }

  deleteGame(matchId: number) {
    this.matches = this.matches.filter((match) => {
      return match.id !== matchId;
    });
  }
  /**
   * 
███╗░░░███╗░█████╗░████████╗██╗░░██╗░██████╗
████╗░████║██╔══██╗╚══██╔══╝██║░░██║██╔════╝
██╔████╔██║███████║░░░██║░░░███████║╚█████╗░
██║╚██╔╝██║██╔══██║░░░██║░░░██╔══██║░╚═══██╗
██║░╚═╝░██║██║░░██║░░░██║░░░██║░░██║██████╔╝
╚═╝░░░░░╚═╝╚═╝░░╚═╝░░░╚═╝░░░╚═╝░░╚═╝╚═════╝░
   */

  private ballCollisionToPaddle(
    ball: Ball,
    paddleL: Paddle,
    paddleR: Paddle,
    mouv: number[],
  ): Pos {
    const rect: Pos = { x: ball.pos.x, y: ball.pos.y };
    let dist = 0;
    //if ball collide avec paddleL
    if (ball.pos.x - ball.radius <= paddleL.pos.x + paddleL.w) {
      rect.x =
        ball.pos.x < paddleL.pos.x
          ? paddleL.pos.x
          : ball.pos.x > paddleL.pos.x + paddleL.w
          ? paddleL.pos.x + paddleL.w
          : rect.x;
      rect.y =
        ball.pos.y < paddleL.pos.y
          ? paddleL.pos.y
          : ball.pos.y > paddleL.pos.y + paddleL.h
          ? paddleL.pos.y + paddleL.h
          : rect.y;
      dist = Math.sqrt(
        Math.pow(ball.pos.x - rect.x, 2) + Math.pow(ball.pos.y - rect.y, 2),
      );
      if (dist <= ball.radius) {
        // calc next vx and vy
        const relativeY = 1 - (rect.y - paddleL.pos.y) / (paddleL.h * 0.5);
        const angleRebound =
          Math.abs(relativeY) === 1
            ? -relativeY * MAXANGLE + mouv[0] * FRICTIONANGLE
            : -relativeY * LITTLEANGLE + mouv[0] * FRICTIONANGLE;
        return { x: Math.cos(angleRebound), y: Math.sin(angleRebound) }; ////////
      } else return { x: 0, y: 0 };
    } else if (ball.pos.x + ball.radius + ball.speed >= paddleR.pos.x) {
      rect.x =
        ball.pos.x < paddleR.pos.x
          ? paddleR.pos.x
          : ball.pos.x > paddleR.pos.x + paddleR.w
          ? paddleR.pos.x + paddleR.w
          : rect.x;
      rect.y =
        ball.pos.y < paddleR.pos.y
          ? paddleR.pos.y
          : ball.pos.y > paddleR.pos.y + paddleR.h
          ? paddleR.pos.y + paddleR.h
          : rect.y;
      dist = Math.sqrt(
        Math.pow(ball.pos.x - rect.x, 2) + Math.pow(ball.pos.y - rect.y, 2),
      );
      if (dist <= ball.radius) {
        const relativeY = 1 - (rect.y - paddleR.pos.y) / (paddleR.h * 0.5);
        const angleRebound =
          Math.abs(relativeY) === 1
            ? -relativeY * MAXANGLE + mouv[1] * FRICTIONANGLE
            : -relativeY * LITTLEANGLE + mouv[1] * FRICTIONANGLE;
        return { x: -Math.cos(angleRebound), y: Math.sin(angleRebound) }; ////////
      } else return { x: 0, y: 0 };
    }
    return { x: 0, y: 0 };
  }

  private ballCollisiontoWall(ball: Ball, wall: ObjectToCollide): number {
    if (ball.pos.x + ball.vx > wall.tr.x - ball.radius) {
      // si la balle touche le bord droit
      return XR;
    } else if (ball.pos.x + ball.vx <= wall.tl.x + ball.radius) {
      //si la balle touche le bord gauche
      return XL;
    } else if (
      ball.pos.y + ball.vy <= wall.tl.y + ball.radius || //si la balle touche le haut
      ball.pos.y + ball.vy >= wall.bl.y - ball.radius // si la balle touche en bas
    ) {
      return Y;
    } else return 0;
  }

  /*

░██████╗░░█████╗░███╗░░░███╗███████╗██╗░░░░░░█████╗░░█████╗░██████╗░
██╔════╝░██╔══██╗████╗░████║██╔════╝██║░░░░░██╔══██╗██╔══██╗██╔══██╗
██║░░██╗░███████║██╔████╔██║█████╗░░██║░░░░░██║░░██║██║░░██║██████╔╝
██║░░╚██╗██╔══██║██║╚██╔╝██║██╔══╝░░██║░░░░░██║░░██║██║░░██║██╔═══╝░
╚██████╔╝██║░░██║██║░╚═╝░██║███████╗███████╗╚█████╔╝╚█████╔╝██║░░░░░
░╚═════╝░╚═╝░░╚═╝╚═╝░░░░░╚═╝╚══════╝╚══════╝░╚════╝░░╚════╝░╚═╝░░░░░
  */

  private afterGoalUpdateref(match: Match, scored: boolean) {
    match.ball = {
      pos: { x: W * 0.5, y: H * 0.5 },
      radius: 15,
      vx: Math.random() > 0.5 ? 1 : -1,
      vy: 0,
      speed: BALLSPEED,
      acceleration: 1,
    };
    if (scored) {
      // player R
      match.scoreR++;
    } else if (!scored) match.scoreL++;
    match.lastp = false;
    match.lasty = false;
    match.goal = true;
  }

  UpdateGame(gameId: number) {
    this.matches.forEach((match) => {
      if (match.id === gameId) {
        const mouv: number[] = [0, 0];

        mouv[0] =
          match.pOne.down && !match.pOne.up
            ? 1
            : match.pOne.up && !match.pOne.down
            ? -1
            : 0;
        mouv[1] =
          match.pTwo.down && !match.pTwo.up
            ? 1
            : match.pTwo.up && !match.pTwo.down
            ? -1
            : 0;
        if (match.id === gameId && match.run) {
          const touch = this.ballCollisionToPaddle(
            match.ball,
            match.paddleL,
            match.paddleR,
            mouv,
          );
          if (touch.x || touch.y) {
            if (match.lastp === false) {
              match.ball.vx = touch.x;
              match.ball.vy = touch.y;
              match.lastp = true;
              if (mouv[0] || mouv[1]) match.ball.acceleration += 0.6;
            }
          } else {
            match.lastp = false;
            const toWall = this.ballCollisiontoWall(match.ball, {
              tl: { x: 0, y: 0 },
              tr: { x: W, y: 0 },
              bl: { x: 0, y: H },
              br: { x: W, y: H },
            });
            if (toWall === XR || toWall === XL) {
              this.afterGoalUpdateref(match, !!(toWall === XL));
              return;
            } else if (toWall === Y && !match.lasty) {
              match.lasty = true;
              match.ball.vy *= -1;
            }
            if (toWall !== Y) {
              match.lasty = false;
            }
          }
          if (match.ball.acceleration > 1) {
            match.ball.acceleration -= 0.005;
          }
          match.ball.pos.x +=
            match.ball.vx * match.ball.speed * match.ball.acceleration;
          match.ball.pos.y +=
            match.ball.vy * match.ball.speed * match.ball.acceleration;
          match.ball.speed += 0.001;
          if (mouv[0]) {
            match.paddleL.pos.y += mouv[0] * match.paddleL.speed;
            if (match.paddleL.pos.y < 0) match.paddleL.pos.y = 0;
            if (match.paddleL.pos.y + match.paddleL.h > H)
              match.paddleL.pos.y = H - match.paddleL.h;
          }
          if (mouv[1]) {
            match.paddleR.pos.y += mouv[1] * match.paddleR.speed;
            if (match.paddleR.pos.y < 0) match.paddleR.pos.y = 0;
            if (match.paddleR.pos.y + match.paddleR.h > H)
              match.paddleR.pos.y = H - match.paddleR.h;
          }
        }
      }
    });
  }

  private placesY = [144, 288, 432, 516, 144, 288, 432, 516];
  private placesX = [0, 100, 200, 300, 400, 550, 650, 750, 850];

  addBlackHolesPos(match: Match) {
    let posL: Pos[] = [];
    let posR: Pos[] = [];
    for (let i = 0; i < 4; i++) {
      if (match.bonus.blackHoles[i] != '0') {
        posL = [
          ...posL,
          {
            x: this.placesX[parseInt(match.bonus.blackHoles[i])],
            y: this.placesY[i],
          },
        ];
      }
    }
    for (let i = 4; i < 8; i++) {
      if (match.bonus.blackHoles[i] != '0') {
        posR = [
          ...posR,
          {
            x: this.placesX[parseInt(match.bonus.blackHoles[i])],
            y: this.placesY[i],
          },
        ];
      }
    }
    match.bonus.leftBH = posL;
    match.bonus.rightBH = posR;
  }
  private createBlackHoles(blackhole: string) {
    const placeLeft = Math.floor(Math.random() * 3.99) + 1;
    const placeRight = Math.floor(Math.random() * 3.99) + 5;
    const voidLeft = Math.floor(Math.random() * 3.99);
    const voidRight = Math.floor(Math.random() * 3.99) + 4;
    const replace = blackhole.split('');
    replace[voidLeft] = placeLeft.toString();
    replace[voidRight] = placeRight.toString();
    blackhole = replace.join('');
    return blackhole;
  }

  private updateBallBonus(match: Match) {
    if (match.bonus.lastBH !== 0) return;
    if (match.ball.pos.x < 500) {
      if (!match.bonus.leftBH) return;
      match.bonus.leftBH.forEach((pos) => {
        const dist = Math.sqrt(
          Math.pow(pos.x - match.ball.pos.x, 2) +
            Math.pow(pos.y - match.ball.pos.y, 2),
        );
        if (dist < 30 && dist !== 0) {
          const arr = [...match.bonus.rightBH];
          const index = Math.floor(Math.random() * (arr.length - 0.01));
          match.ball.pos.x = arr[index].x;
          match.ball.pos.y = arr[index].y;
          match.bonus.lastBH = 1;
          return;
        }
      });
    } else {
      if (!match.bonus.rightBH) return;
      match.bonus.rightBH.forEach((pos) => {
        const dist = Math.sqrt(
          Math.pow(pos.x - match.ball.pos.x, 2) +
            Math.pow(pos.y - match.ball.pos.y, 2),
        );
        if (dist < 30 && dist !== 0) {
          const arr = [...match.bonus.leftBH];
          const index = Math.floor(Math.random() * (arr.length - 0.01));
          match.ball.pos.x = arr[index].x;
          match.ball.pos.y = arr[index].y;
          match.bonus.lastBH = 1;

          return;
        }
      });
    }
  }

  private updateSideBonus(
    bh: string,
    side: SideBonus,
    mouv: number,
    paddle: Paddle,
    ball: Ball,
    space: boolean,
  ): string | undefined {
    if (side.bonusUp === BONUSBH) side.bonusUp = NONE;
    if (side.y >= 0) {
      if (mouv) {
        side.y += mouv * 10;
        if (side.y < 0) side.y += H;
        if (side.y > H) side.y -= H;
      }
      if (side.y >= paddle.pos.y && side.y <= paddle.pos.y + paddle.h) {
        side.yStart = 0;
        side.y = -1;
        const type = Math.floor(Math.random() * 2.99);
        side.type = type + 1;
        side.bonusUp = BONUSTYPE;
        return undefined;
      }
    } else if (side.type !== 0 && side.start === 0) {
      side.bonusUp = NONE;
      if (space) {
        side.start = Date.now();
        side.bonusUp = BONUSLAUNCH;
      }
    } else if (side.start !== 0) {
      side.bonusUp = NONE;
      if (side.type === 3) {
        // DO BH
        side.bonusUp = BONUSBH;
        side.start = 0;
        side.type = 0;
        return this.createBlackHoles(bh);
      } else if (side.type === 2) {
        // do paddle speedup
        paddle.speed = 30;
        if (Date.now() - side.start > 3000) {
          // undo speedup
          paddle.speed = 10;
          side.start = 0;
          side.type = 0;
          return undefined;
        }
      } else if (side.type === 1) {
        // do ball speedup
        ball.speed = 100;
        if (Date.now() - side.start > 300) {
          //undo speedup
          ball.speed = BALLSPEED;
          side.start = 0;
          side.type = 0;
        }
      }
      // // update ce qu'il faut pendant le temps (verifier date - start)
      // // tout remettre a zero
    } else {
      const trigger = Math.random();
      if (trigger > 0.99) {
        side.y = Math.random() * H;
        if (side.y >= paddle.pos.y && side.y <= paddle.pos.y + paddle.h) {
          side.y = -1;
        } else {
          side.bonusUp = BONUSY;
          //   side.yStart = Date.now();
        }
      }
    }
    return undefined;
  }

  private updateBonus(match: Match, mouv: number[]) {
    const left = this.updateSideBonus(
      match.bonus.blackHoles,
      match.bonus.left,
      mouv[1],
      match.paddleL,
      match.ball,
      match.pOne.space,
    );
    const right = this.updateSideBonus(
      match.bonus.blackHoles,
      match.bonus.right,
      mouv[0],
      match.paddleR,
      match.ball,
      match.pTwo.space,
    );
    if (left) {
      match.bonus.blackHoles = left;
      this.addBlackHolesPos(match);
    }
    if (right) {
      match.bonus.blackHoles = right;
      this.addBlackHolesPos(match);
    }
  }

  private saveLostBall(ball: Ball): Pos {
    const newY: number = ball.pos.y < 0 ? ball.radius : H - ball.radius;
    const a: number = -ball.vy;
    const b: number = ball.vx;
    const m: Pos = ball.pos;
    const c: number = a * m.x + b * m.y;
    const newX: number = (c - b * newY) / a;
    return { x: newX, y: newY };
  }

  checkOk(gameId: number) {
    const currentGame = this.matches.find((e) => e.id === gameId);

    if (currentGame.bonus.lastBH === undefined) return false;
    else return true;
  }

  UpdateGameBonus(gameId: number) {
    this.matches.forEach((match) => {
      if (match.id === gameId) {
        const mouv: number[] = [0, 0];
        if (match.bonus.lastBH !== 0)
          match.bonus.lastBH =
            match.bonus.lastBH > 6 ? 0 : match.bonus.lastBH + 1;
        mouv[0] =
          match.pOne.down && !match.pOne.up
            ? 1
            : match.pOne.up && !match.pOne.down
            ? -1
            : 0;
        mouv[1] =
          match.pTwo.down && !match.pTwo.up
            ? 1
            : match.pTwo.up && !match.pTwo.down
            ? -1
            : 0;
        this.updateBallBonus(match);
        this.updateBonus(match, mouv);
        if (match.id === gameId && match.run) {
          const touch = this.ballCollisionToPaddle(
            match.ball,
            match.paddleL,
            match.paddleR,
            mouv,
          );
          if (touch.x || touch.y) {
            if (match.lastp === false) {
              match.ball.vx = touch.x;
              match.ball.vy = touch.y;
              match.lastp = true;
              if (mouv[0] || mouv[1]) match.ball.acceleration += 0.6;
            }
          } else {
            match.lastp = false;
            const toWall = this.ballCollisiontoWall(match.ball, {
              tl: { x: 0, y: 0 },
              tr: { x: W, y: 0 },
              bl: { x: 0, y: H },
              br: { x: W, y: H },
            });
            if (toWall === XR || toWall === XL) {
              this.afterGoalUpdateref(match, !!(toWall === XL));
              return;
            } else if (toWall === Y && !match.lasty) {
              match.lasty = true;
              match.ball.vy *= -1;
            }
            if (toWall !== Y) {
              match.lasty = false;
            }
          }
          if (match.ball.acceleration > 1) {
            match.ball.acceleration -= 0.005;
          }
          match.ball.pos.x +=
            match.ball.vx * match.ball.speed * match.ball.acceleration;
          match.ball.pos.y +=
            match.ball.vy * match.ball.speed * match.ball.acceleration;

          if (match.ball.pos.y < 0 || match.ball.pos.y > H) {
            match.ball.pos = this.saveLostBall(match.ball);
            match.ball.vy *= -1;
          }
          match.ball.speed += 0.001;
          if (mouv[0]) {
            match.paddleL.pos.y += mouv[0] * match.paddleL.speed;
            if (match.paddleL.pos.y < 0) match.paddleL.pos.y = 0;
            if (match.paddleL.pos.y + match.paddleL.h > H)
              match.paddleL.pos.y = H - match.paddleL.h;
          }
          if (mouv[1]) {
            match.paddleR.pos.y += mouv[1] * match.paddleR.speed;
            if (match.paddleR.pos.y < 0) match.paddleR.pos.y = 0;
            if (match.paddleR.pos.y + match.paddleR.h > H)
              match.paddleR.pos.y = H - match.paddleR.h;
          }
        }
      }
    });
  }

  // https://gamedev.stackexchange.com/questions/174240/server-game-loop
}

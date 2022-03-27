import { Injectable } from '@nestjs/common';

@Injectable()
export class PongUsersService {
  private inMatchMaking: number[] = [];
  private inBonusMM: number[] = [];
  private isConnected: number[] = [];
  private gameid = 1;

  private sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  isInMatchmaking(id: number): boolean {
    return this.inMatchMaking.includes(id);
  }

  addNewPlayer(id: number) {
    if (!this.isInMatchmaking(id)) this.inMatchMaking.push(id);
  }

  removePlayer(id: number) {
    const found = this.inMatchMaking.indexOf(id);
    if (found !== -1) {
      this.inMatchMaking.splice(found, 1);
    }
  }

  userConnect(id: number) {
    if (!this.isConnected[id]) this.isConnected[id] = 0;
    this.isConnected[id] += 1;
  }

  userDisconnect(id: number): number {
    this.isConnected[id] -= 1;
    return this.isConnected[id];
  }

  nbWindowForUser(id: number): number {
    return this.isConnected[id];
  }

  async makeMatchMaking(): Promise<any> {
    // attendre 10 sec pour lancer le matchmaking // return un tableau d'id des 2 users qui entrent dans la game et envoie un socket a ces 2 id
    const len = this.inMatchMaking.length;
    let ret: number[] = [];
    if (len === 2) {
      // enlever les users du tableau et renvoyer une copie du tableau
      ret = this.inMatchMaking;
      if (ret.length !== 2) {
        await this.sleep(2000);
        return this.makeMatchMaking();
      }
      ret.forEach(async (value) => {
        if (!value) {
          await this.sleep(2000);
          return this.makeMatchMaking();
        }
      });
      this.inMatchMaking = [];
      return ret;
    } else if (len > 2) {
      // enlever les 2 users du tableau
      for (let i = 0; i < 2; i++) {
        const index = Math.round(Math.random() * this.inMatchMaking.length);
        if (!this.inMatchMaking[index]) {
          if (i == 1) this.addNewPlayer(ret[0]);
          await this.sleep(2000);
          return this.makeMatchMaking();
        }
        ret.push(this.inMatchMaking[index]);
        this.inMatchMaking.splice(index, 1);
      }
      return ret;
      ///// make matchmaking avec random / selon ex parties / lvl
      // return le tableau de 2 id
    } else {
      return NaN;
    }
  }

  createGameId(): number {
    return this.gameid++;
  }

  /*
██████   ██████  ███    ██ ██    ██ ███████ 
██   ██ ██    ██ ████   ██ ██    ██ ██      
██████  ██    ██ ██ ██  ██ ██    ██ ███████ 
██   ██ ██    ██ ██  ██ ██ ██    ██      ██ 
██████   ██████  ██   ████  ██████  ███████ 
  */

  isInMatchmakingBonus(id: number): boolean {
    return this.inBonusMM.includes(id);
  }

  addNewPlayerBonus(id: number) {
    if (!this.isInMatchmakingBonus(id)) this.inBonusMM.push(id);
  }

  removePlayerBonus(id: number) {
    const found = this.inBonusMM.indexOf(id);
    if (found !== -1) {
      this.inBonusMM.splice(found, 1);
    }
  }

  async makeMatchMakingBonus(): Promise<any> {
    // attendre 10 sec pour lancer le matchmaking // return un tableau d'id des 2 users qui entrent dans la game et envoie un socket a ces 2 id
    const len = this.inBonusMM.length;
    let ret: number[] = [];
    if (len === 2) {
      // enlever les users du tableau et renvoyer une copie du tableau
      ret = this.inBonusMM;
      if (ret.length !== 2) {
        await this.sleep(2000);
        return this.makeMatchMakingBonus();
      }
      ret.forEach(async (value) => {
        if (!value) {
          await this.sleep(2000);
          return this.makeMatchMakingBonus();
        }
      });
      this.inBonusMM = [];
      return ret;
    } else if (len > 2) {
      // enlever les 2 users du tableau
      for (let i = 0; i < 2; i++) {
        console.log('Bonus MATCH', this.inBonusMM);
        const index = Math.round(Math.random() * this.inBonusMM.length);
        if (!this.inBonusMM[index]) {
          if (i == 1) this.addNewPlayerBonus(ret[0]);
          await this.sleep(2000);
          return this.makeMatchMakingBonus();
        }
        ret.push(this.inBonusMM[index]);
        this.inBonusMM.splice(index, 1);
      }
      return ret;
      ///// make matchmaking avec random / selon ex parties / lvl
      // return le tableau de 2 id
    } else {
      return NaN;
    }
  }

  isInAMatchMaking(userId: number) {
    if (this.isInMatchmaking(userId) || this.isInMatchmakingBonus(userId))
      return true;
    return false;
  }
}

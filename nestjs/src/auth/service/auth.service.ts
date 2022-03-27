import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { parse } from 'cookie';
import { User } from 'src/user/model/user.entity';
import { UserService } from 'src/user/service/user.service';
import { JwtPayload } from '../strategy/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private userService: UserService,
  ) {}

  login(user: User, isSecondFactorAuthenticated = false) {
    const payload: JwtPayload = {
      username: user.nickname,
      id: user.id,
      email: user.email,
      twoFA: isSecondFactorAuthenticated,
    };
    return {
      accessToken: this.jwtService.sign(payload),
    };
  }

  getPayloadFromAuthenticationToken(cookie: string): JwtPayload {
    const twofa = 'jwt-two-factor=';
    const twofaNiddle = cookie.indexOf(twofa);
    const jwtToken = parse(cookie).jwt;
    let twofaToken: string;
    const payload: JwtPayload = this.jwtService.verify(jwtToken, {
      secret: process.env.JWT_SECRET,
    });
    if (twofaNiddle !== -1) {
      twofaToken = cookie.slice(twofaNiddle + twofa.length);
      const payloadTwofa = this.jwtService.verify(twofaToken, {
        secret: process.env.JWT_SECRET,
      });
      return payloadTwofa;
    } else return payload;
  }

  async getUserFromSocket(client: Socket): Promise<User> {
    const cookie = client.handshake.headers.cookie;
    const payload = this.getPayloadFromAuthenticationToken(cookie);
    if (!payload) throw new WsException('Unauthorized');
    const user = await this.userService.getOneById(payload.id);
    if (!user) throw new WsException('Invalid credentials.');
    return user;
  }
}

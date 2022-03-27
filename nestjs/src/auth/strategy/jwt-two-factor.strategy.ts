import { Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { JwtPayload } from './jwt.strategy';
import { UserService } from 'src/user/service/user.service';

@Injectable()
export class JwtTwoFactorStrategy extends PassportStrategy(
  Strategy,
  'jwt-two-factor',
) {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {
    super({
      jwtFromRequest: (req: Request): string => {
        let tokenJwt = null;
        let tokenJwtTwoFactor = null;

        if (req && req.cookies) {
          tokenJwt = req.cookies['jwt'];
          tokenJwtTwoFactor = req.cookies['jwt-two-factor'];
        }
        return tokenJwtTwoFactor === undefined ? tokenJwt : tokenJwtTwoFactor;
      },
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    const user = await this.userService.getOneById(payload.id);
    if (user) {
      if (user.isTwoFactorAuthenticationEnabled === payload.twoFA) {
        return payload;
      }
    }
  }
}

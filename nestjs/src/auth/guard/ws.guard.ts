import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { UserService } from 'src/user/service/user.service';
import { AuthService } from '../service/auth.service';

@Injectable()
export class WsGuard implements CanActivate {
  constructor(
    private userService: UserService,
    private authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const bannedIds = await this.userService.getBannedUserIds();
    const bearerToken: string = context.switchToHttp().getRequest().handshake
      .headers.cookie;
    try {
      const payload =
        this.authService.getPayloadFromAuthenticationToken(bearerToken);
      if (!payload) return false;
      const user = await this.userService.getOneById(payload.id);
      if (
        user &&
        !bannedIds.includes(user.id) &&
        user.isTwoFactorAuthenticationEnabled === payload.twoFA
      )
        return true;
      else return false;
    } catch (err) {
      return false;
    }
  }
}

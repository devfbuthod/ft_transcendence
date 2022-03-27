import {
  ClassSerializerInterceptor,
  Controller,
  Post,
  UseInterceptors,
  Res,
  UseGuards,
  HttpCode,
  Body,
  UnauthorizedException,
  HttpException,
  HttpStatus,
  Get,
  Delete,
} from '@nestjs/common';
import { User } from 'src/user/model/user.entity';
import { CurrentUser } from '../decorator/currrent.user.decorator';
import { JwtAuthGuard } from '../guard/jwt.guard';
import { TwoFactorAuthService } from '../service/two-factor-auth.service';
import { Response } from 'express';
import { TwoFactorAuthCodeDto } from '../model/twoFactorAuthenticationCode.dto';
import { UserService } from 'src/user/service/user.service';
import { AuthService } from '../service/auth.service';
import { JwtPayload } from '../strategy/jwt.strategy';

@Controller('2fa')
@UseGuards(JwtAuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class TwoFactorAuthController {
  constructor(
    private readonly twoFactorAuthService: TwoFactorAuthService,
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {}

  /*
   * register sets secret in user database, and
   * generates a qrcode in order to active Google two factor auth
   */
  @Get('generate')
  async register(@Res() response: Response, @CurrentUser() user: User) {
    const { otpauthUrl } =
      await this.twoFactorAuthService.generateTwoFactorAuthenticationSecret(
        user,
      );
    response.setHeader('content-type', 'image/png');
    return this.twoFactorAuthService.pipeQrCodeStream(response, otpauthUrl);
  }

  /*
   * turnOnTwoFactorAuthentication verifies 2fa code and secret,
   * returns two factor enable true after valided
   */
  @Post('turn-on')
  @HttpCode(200)
  async turnOnTwoFactorAuthentication(
    @CurrentUser() user: User,
    @Body() { twoFactorAuthenticationCode }: TwoFactorAuthCodeDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ userId: number; twoFactorEnabled: boolean }> {
    if (await this.userService.isUserTwoFactorAuthEnabled(user.id)) {
      throw new HttpException(
        `User ${user.id} has already turned on two factor authentication.`,
        HttpStatus.BAD_REQUEST,
      );
    }
    const isCodeValid =
      await this.twoFactorAuthService.isTwoFactorAuthenticationCodeValid(
        twoFactorAuthenticationCode,
        user,
      );
    if (!isCodeValid) {
      throw new UnauthorizedException('Wrong authentication code');
    }
    await this.userService.turnOnTwoFactorAuthentication(user.id);
    const { accessToken } = this.authService.login(user, true);
    res.cookie('jwt-two-factor', accessToken);
    return {
      userId: user.id,
      twoFactorEnabled: true,
    };
  }

  /*
   * authenticate verifies 2fa code and secret,
   * sets jwt-two-factor cookie, and returns userPayload
   */
  @Post('authenticate')
  @HttpCode(200)
  async authenticate(
    @CurrentUser() userPayload: JwtPayload,
    @Body() twoFactorAuthCode: TwoFactorAuthCodeDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<JwtPayload> {
    const user = await this.userService.getUserWithTwoFactor(userPayload.id);
    if (user.isTwoFactorAuthenticationEnabled === false) {
      throw new HttpException(
        `User ${user.id} has not turned on two factor authentication yet.`,
        HttpStatus.BAD_REQUEST,
      );
    }
    const isCodeValid =
      await this.twoFactorAuthService.isTwoFactorAuthenticationCodeValid(
        twoFactorAuthCode.twoFactorAuthenticationCode,
        user,
      );
    if (!isCodeValid) {
      throw new UnauthorizedException('Wrong authentication code');
    }
    const { accessToken } = this.authService.login(user, true);
    res.cookie('jwt-two-factor', accessToken);
    userPayload.twoFA = true;
    return userPayload;
  }

  @Delete('turn-off')
  async turnOffTwoFactorAuthentication(
    @CurrentUser() userPayload: User,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ userId: number; twoFactorEnabled: boolean }> {
    if (!(await this.userService.isUserTwoFactorAuthEnabled(userPayload.id))) {
      throw new HttpException(
        `User ${userPayload.id} hasn't turned on two factor authentication yet.`,
        HttpStatus.BAD_REQUEST,
      );
    }
    await this.userService.turnOffTwoFactorAuthentication(userPayload.id);
    res.clearCookie('jwt-two-factor');
    return {
      userId: userPayload.id,
      twoFactorEnabled: false,
    };
  }
}

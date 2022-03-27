import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { authenticator } from 'otplib';
import { User } from 'src/user/model/user.entity';
import { UserService } from 'src/user/service/user.service';
import { toFileStream } from 'qrcode';
import { Response } from 'express';

@Injectable()
export class TwoFactorAuthService {
  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService,
  ) {}

  async generateTwoFactorAuthenticationSecret(
    user: User,
  ): Promise<{ secret: string; otpauthUrl: string }> {
    if (await this.userService.isUserTwoFactorAuthEnabled(user.id)) {
      throw new HttpException(
        `User ${user.id} has already turned on two factor authentication.`,
        HttpStatus.BAD_REQUEST,
      );
    }
    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(
      user.email,
      'ft_trancendence',
      secret,
    );
    await this.userService.setTwoFactorAuthenticationSecret(secret, user.id);
    return { secret, otpauthUrl };
  }

  async pipeQrCodeStream(stream: Response, otpauthUrl: string) {
    return toFileStream(stream, otpauthUrl, {
      type: 'png',
      width: 200,
      errorCorrectionLevel: 'H',
    });
  }

  async isTwoFactorAuthenticationCodeValid(
    twoFactorAuthenticationCode: string,
    user: User,
  ): Promise<boolean> {
    const userData = await this.userService.getUserWithTwoFactor(user.id);
    if (userData.twoFactorAuthenticationSecret === null) {
      throw new HttpException(
        `User ${userData.id} has to scan two factor QrCode first.`,
        HttpStatus.BAD_REQUEST,
      );
    }
    const checkResult = authenticator.verify({
      token: twoFactorAuthenticationCode,
      secret: userData.twoFactorAuthenticationSecret,
    });
    return checkResult;
  }
}

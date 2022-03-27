import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';

import { Request, Response } from 'express';
import { User } from 'src/user/model/user.entity';
import { UserService } from 'src/user/service/user.service';
import { AuthService } from '../service/auth.service';
import { FortyTwoAuthGuard as FortyTwoGuard } from '../guard/42.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private userService: UserService,
  ) {}

  /**
   * This route allows you to authenticate to a user account without using OAuth
   * but simply by providing the id of the account you want to be connected to.
   * ! @debug this route is only available in a development and test context
   * @param res object corresponding to the server responce.
   * @returns Promise<User>
   */
  @Get('login/:id')
  async loginDebug(
    @Res({ passthrough: true }) res: Response,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<User> {
    if (process.env.ENVIRONMENT != 'DEV') throw new NotFoundException('');
    const user: User = await this.userService.getOneById(id);
    const { accessToken } = this.authService.login(user);
    res.cookie('jwt', accessToken);
    return user;
  }

  /**
   * Production login root
   */
  @Get('login')
  @UseGuards(FortyTwoGuard)
  login() {
    /* Redirect to authentication pipeline */
  }

  /**
   * 42 OAuth Callback gets response code and creates jwt token.
   * @param req Request object corresponding to the client request.
   * @param res Response object corresponding to the server response.
   */
  @Get('42/callback')
  @UseGuards(FortyTwoGuard)
  fortyTwoCallback(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken } = this.authService.login(req.user);
    res.cookie('jwt', accessToken);
    if (req.user.isTwoFactorAuthenticationEnabled) {
      res.redirect('http://' + process.env.DOMAIN_FRONTEND + '/2fa');
    } else {
      res.redirect('http://' + process.env.DOMAIN_FRONTEND + '/');
    }
  }

  /**
   * Disconnecting user by deleting cookies (jwt's).
   * @param res Response object corresponding to the server response.
   */
  @Get('disconnect')
  disconnect(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('jwt');
    res.clearCookie('jwt-two-factor');
  }
}

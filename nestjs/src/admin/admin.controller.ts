import { Body, Controller, Get, Patch, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from 'src/auth/decorator/currrent.user.decorator';
import { JwtTwoFactorGuard } from 'src/auth/guard/jwt-two-factor.guard';
import { JwtAuthGuard } from 'src/auth/guard/jwt.guard';
import { ChatGateway } from 'src/chat/gateway/chat.gateway';
import { User } from 'src/user/model/user.entity';
import { UserService } from 'src/user/service/user.service';
import { SetUserSiteStatusDto } from './dto/set-user-site-status.dto';

@UseGuards(JwtAuthGuard)
@UseGuards(JwtTwoFactorGuard)
@Controller('admin')
export class AdminController {
  constructor(
    private userService: UserService,
    private chatGateway: ChatGateway,
  ) {}

  @Patch('set')
  async modifySiteStatus(
    @CurrentUser() operator: User,
    @Body() setUserSiteStatusDto: SetUserSiteStatusDto,
  ): Promise<User> {
    const userWithNewSiteStatus = await this.userService.modifyUserSiteStatus(
      operator.id,
      setUserSiteStatusDto,
    );
    this.chatGateway.server
      .to('user-' + setUserSiteStatusDto.id)
      .emit('reload-users');
    this.chatGateway.server.to('user-' + operator.id).emit('reload-users');
    return userWithNewSiteStatus;
  }
}

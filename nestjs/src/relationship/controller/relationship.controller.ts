import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Relationship } from '../model/relationship.entity';
import { RelationshipService } from '../service/relationship.service';
import { RelationshipDto } from '../dto/relationship.dto';
import { CurrentUser } from 'src/auth/decorator/currrent.user.decorator';
import { User } from 'src/user/model/user.entity';
import { JwtAuthGuard } from 'src/auth/guard/jwt.guard';
import { SendRelationshipDto } from '../dto/send-relationship.dto';
import { JwtTwoFactorGuard } from 'src/auth/guard/jwt-two-factor.guard';
import { SendAddFriendRelationshipDto } from '../dto/send-addFriend-relationship.dto';
import { SendSpecificListRelationshipDto } from '../dto/send-specificList-relationship.dto';
import { ChatGateway } from 'src/chat/gateway/chat.gateway';
import { SendAllUsersRelationshipDto } from '../dto/send-allUsers-relationship.dto';
import { UserService } from 'src/user/service/user.service';

@UseGuards(JwtAuthGuard)
@UseGuards(JwtTwoFactorGuard)
@Controller('relationship')
export class RelationshipController {
  constructor(
    private relationshipService: RelationshipService,
    private userService: UserService,
    private chatGateway: ChatGateway,
  ) {}

  /*
   ** getMySpecificRelationList takes query relation_status to request corresponding list,
   ** returns an array with user friends' id, nickname, avatar and status
   */
  @Get('me/list')
  getMySpecificRelationList(
    @CurrentUser() user: User,
    @Query('status') status: string,
  ): Promise<SendSpecificListRelationshipDto[]> {
    return this.relationshipService.getSpecificRelationList(user.id, status);
  }

  /*
   ** getSpecificRelationList takes query relation_status to request corresponding list,
   ** returns an array with user friends' id, nickname, avatar and status
   */
  @Get(':id/list')
  async getSpecificRelationList(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Query('status') status: string,
  ): Promise<SendSpecificListRelationshipDto[]> {
    await this.userService.getUserProfileById(id);
    if (status !== 'friend' && id !== user.id)
      throw new HttpException(
        `User has no right to get other lists.`,
        HttpStatus.BAD_REQUEST,
      );
    return this.relationshipService.getSpecificRelationList(id, status);
  }

  @Get('me/blocked')
  getBlockingIds(@CurrentUser() user: User): Promise<number[]> {
    return this.relationshipService.getBlockingIds(user.id);
  }

  /*
   ** getMySpecificRelationList takes query relation_status to request corresponding list,
   ** returns an array with user friends' id, nickname, avatar and status
   */
  @Get('me/allusers')
  async getMyAllRelationList(
    @CurrentUser() user: User,
  ): Promise<SendAllUsersRelationshipDto[]> {
    return this.relationshipService.getAllRelationList(user.id);
  }

  /*
   ** addFriend returns the new relationship's id
   */
  @Post('add')
  async addFriend(
    @CurrentUser() user: User,
    @Body() relationshipDto: RelationshipDto,
  ): Promise<SendAddFriendRelationshipDto> {
    await this.userService.getUserProfileById(relationshipDto.addresseeUserId);
    const relationship = await this.relationshipService.addFriend(
      user.id,
      relationshipDto,
    );
    this.chatGateway.server
      .to('user-' + relationshipDto.addresseeUserId)
      .emit('reload-users');
    this.chatGateway.server.to('user-' + user.id).emit('reload-users');
    return relationship;
  }

  /*
   ** acceptFriend returns the new relationship
   */
  @Patch('accept/:id')
  async acceptFriend(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<SendRelationshipDto> {
    const relationship = await this.relationshipService.acceptFriend(
      id,
      user.id,
    );
    this.chatGateway.server
      .to('user-' + relationship.users[0])
      .emit('reload-users');
    this.chatGateway.server
      .to('user-' + relationship.users[1])
      .emit('reload-users');

    return relationship;
  }

  /*
   ** rejectFriend returns the rejected relationship
   */
  @Delete('reject/:id')
  rejectFriend(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<SendRelationshipDto> {
    return this.relationshipService.rejectFriend(id, user.id);
  }

  /*
   ** unfriend returns the deleted relationship
   */
  @Delete('unfriend')
  async unfriend(
    @CurrentUser() user: User,
    @Body() relationshipDto: RelationshipDto,
  ): Promise<SendRelationshipDto> {
    await this.userService.getUserProfileById(relationshipDto.addresseeUserId);
    const relationship = await this.relationshipService.deleteFriend(
      user.id,
      relationshipDto,
    );
    this.chatGateway.server
      .to('user-' + relationshipDto.addresseeUserId)
      .emit('reload-users');
    this.chatGateway.server.to('user-' + user.id).emit('reload-users');
    return relationship;
  }

  /*
   ** blockUser returns the block relationship
   ** if the users are friends, they'll be unfriend first
   ** than create the block relationship
   */
  @Post('block')
  async blockUser(
    @CurrentUser() user: User,
    @Body() relationshipDto: RelationshipDto,
  ): Promise<Relationship> {
    await this.userService.getUserProfileById(relationshipDto.addresseeUserId);
    const relationship = await this.relationshipService.blockUser(
      user.id,
      relationshipDto,
    );
    this.chatGateway.server.to('user-' + user.id).emit('reload-block');
    this.chatGateway.server
      .to('user-' + relationshipDto.addresseeUserId)
      .emit('reload-blockedby');
    this.chatGateway.server
      .to('user-' + relationshipDto.addresseeUserId)
      .emit('reload-blockedby');
    this.chatGateway.server
      .to('user-' + relationshipDto.addresseeUserId)
      .emit('reload-users');
    this.chatGateway.server.to('user-' + user.id).emit('reload-users');
    return relationship;
  }

  /*
   ** unblock returns the deleted relationship
   */
  @Delete('unblock')
  async unblock(
    @CurrentUser() user: User,
    @Body() relationshipDto: RelationshipDto,
  ): Promise<SendRelationshipDto> {
    await this.userService.getUserProfileById(relationshipDto.addresseeUserId);
    const relationship = await this.relationshipService.deleteBlockUser(
      user.id,
      relationshipDto,
    );
    this.chatGateway.server.to('user-' + user.id).emit('reload-block');
    this.chatGateway.server
      .to('user-' + relationshipDto.addresseeUserId)
      .emit('reload-blockedby');
    this.chatGateway.server
      .to('user-' + relationshipDto.addresseeUserId)
      .emit('reload-blockedby');
    this.chatGateway.server
      .to('user-' + relationshipDto.addresseeUserId)
      .emit('reload-users');
    this.chatGateway.server.to('user-' + user.id).emit('reload-users');
    return relationship;
  }
}

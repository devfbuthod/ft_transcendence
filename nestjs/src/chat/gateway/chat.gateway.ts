import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WsException,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { AuthService } from 'src/auth/service/auth.service';
import { OnlineStatus, User } from 'src/user/model/user.entity';
import { UserService } from 'src/user/service/user.service';
import { CreateChannelDto } from '../dto/create-channel.dto';
import { JoinChannelDto } from '../dto/join-channel.dto';
import { CreateMessageDto } from '../dto/create-message.dto';
import { ChatService } from '../service/chat.service';
import { MessageService } from '../service/message.service';
import { LoadDirectDto } from '../dto/load-direct.dto';
import { SetChannelAdminDto } from '../dto/set-channel-admin.dto';
import { SetChannelPasswordDto } from '../dto/set-channel-password.dto';
import { ChangeStatusDto } from '../dto/change-status.dto';
import { UseGuards } from '@nestjs/common';
import { WsGuard } from 'src/auth/guard/ws.guard';
import { parse } from 'cookie';

@WebSocketGateway({
  cors: {
    origin: 'http://' + process.env.DOMAIN_FRONTEND,
    methods: ['GET', 'POST'],
    credentials: true,
  },
})
@UseGuards(WsGuard)
export class ChatGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer()
  server: Server;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private readonly chatService: ChatService,
    private readonly messageService: MessageService,
  ) {}

  /**
   * Call after socket creation
   * @param server
   */
  async afterInit(server: any) {
    try {
      await this.userService.resetUserStatus();
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * Call After new client connection
   * @param client
   * @param args
   */
  async handleConnection(client: Socket) {
    let jwtCookie: string;
    if (client.handshake.headers.cookie)
      jwtCookie = parse(client.handshake.headers.cookie).jwt;
    if (jwtCookie !== undefined) {
      try {
        const user: User = await this.authService.getUserFromSocket(client);
        if (!this.NumClientsInRoom('user-' + user.id)) {
          await this.userService.setUserStatus(user.id, OnlineStatus.AVAILABLE);
          this.server.emit('reload-status', {
            user_id: user.id,
            status: OnlineStatus.AVAILABLE,
          });
        }
        client.join('user-' + user.id);
        console.log('New User Join');
        const [channels_in, channels_out] = await Promise.all([
          this.chatService.getUserChannels(user.id),
          this.chatService.getUserNotParticipateChannels(user.id),
        ]);
        client.emit('channels-user-in', channels_in);
        client.emit('channels-user-out', channels_out);
      } catch (error) {
        console.log(error);
      }
    }
  }

  /**
   * Call After client leave
   * @param client
   */
  async handleDisconnect(client: Socket) {
    let jwtCookie: string;
    if (client.handshake.headers.cookie)
      jwtCookie = parse(client.handshake.headers.cookie).jwt;
    if (jwtCookie !== undefined) {
      try {
        const user: User = await this.authService.getUserFromSocket(client);
        client.leave('user-' + user.id);
        if (!this.NumClientsInRoom('user-' + user.id)) {
          await this.userService.setUserStatus(user.id, OnlineStatus.OFFLINE);
          this.server.emit('reload-status', {
            user_id: user.id,
            status: OnlineStatus.OFFLINE,
          });
        }
        console.log('Remove active user');
      } catch (error) {
        console.log(error);
      }
    }
  }

  /**
   * Create channel
   * @param CreateChannelDto : channel name and password
   */
  @SubscribeMessage('channel-create')
  async createChannel(client: Socket, body: CreateChannelDto) {
    try {
      const user = this.authService.getPayloadFromAuthenticationToken(
        client.handshake.headers.cookie,
      );
      await this.chatService.createChannel(user.id, body);
      console.log('Channel created successfully !');
      this.server.emit('channel-need-reload');
    } catch (error) {
      client.emit(`alert`, { alert: { type: `danger`, message: error.error } });
    }
  }

  /**
   * join channel
   * @param JoinChannelDto : channelId and password
   */
  @SubscribeMessage('channel-join')
  async joinChannel(client: Socket, body: JoinChannelDto) {
    try {
      const user = this.authService.getPayloadFromAuthenticationToken(
        client.handshake.headers.cookie,
      );
      await this.chatService.joinChannel(user.id, body);
      console.log('User joined channel successfully !');

      const [channels_in, channels_out, users] = await Promise.all([
        this.chatService.getUserChannels(user.id),
        this.chatService.getUserNotParticipateChannels(user.id),
        this.chatService.getChannelUsers(body.channelId),
      ]);

      this.server.to('channel-' + body.channelId).emit('channel-users', users);
      this.server.to('user-' + user.id).emit('channels-user-in', channels_in);
      this.server.to('user-' + user.id).emit('channels-user-out', channels_out);
    } catch (error) {
      client.emit(`alert`, { alert: { type: `danger`, message: error.error } });
    }
  }

  /**
   * leave channel
   * @param : channel id
   */
  @SubscribeMessage('channel-leave')
  async leaveChannel(client: Socket, { channelId }) {
    try {
      const user = this.authService.getPayloadFromAuthenticationToken(
        client.handshake.headers.cookie,
      );
      const channel = await this.chatService.leaveChannel(user.id, channelId);
      if (channel === -1) {
        this.server.emit('channel-need-reload');
      } else {
        /* NOTIFY THE NEW OWNER */
        const new_onwer_channels_in = await this.chatService.getUserChannels(
          channel,
        );
        this.server
          .to('user-' + channel)
          .emit('channels-user-in', new_onwer_channels_in);
        this.server.to('user-' + channel).emit(`alert`, {
          alert: {
            type: `info`,
            message: 'You are now promote as channel owner !',
          },
        });

        const [channels_in, channels_out, users] = await Promise.all([
          this.chatService.getUserChannels(user.id),
          this.chatService.getUserNotParticipateChannels(user.id),
          this.chatService.getChannelUsers(channelId),
        ]);
        this.server.to('channel-' + channelId).emit('channel-users', users);
        this.server.to('user-' + user.id).emit('channels-user-in', channels_in);
        this.server
          .to('user-' + user.id)
          .emit('channels-user-out', channels_out);
      }
      console.log('User left channel successfully !');
    } catch (error) {
      client.emit(`alert`, { alert: { type: `danger`, message: error.error } });
    }
  }

  /**
   * change user status
   * @param ChangeStatusDto : channel id, user id, saction duration and status
   */
  @SubscribeMessage('channel-status-change')
  async changeChannelUserStatus(client: Socket, body: ChangeStatusDto) {
    try {
      const user = this.authService.getPayloadFromAuthenticationToken(
        client.handshake.headers.cookie,
      );
      await this.chatService.changeChannelUserStatus(user.id, body);
      const channels_in = this.chatService.getUserChannels(body.userId);
      this.server
        .to('user-' + body.userId)
        .emit('channels-user-in', await channels_in);
      const users = await this.chatService.getChannelUsers(body.channelId);
      this.server.to('channel-' + body.channelId).emit('channel-users', users);
    } catch (error) {
      client.emit(`alert`, { alert: { type: `danger`, message: error.error } });
    }
  }

  /**
   * set administrator
   * @param SetChannelAdminDto : channel id, participant id, action
   */
  @SubscribeMessage('channel-admin')
  async setChannelAdmin(client: Socket, body: SetChannelAdminDto) {
    try {
      const user = this.authService.getPayloadFromAuthenticationToken(
        client.handshake.headers.cookie,
      );
      await this.chatService.setChannelAdmin(user.id, body);
      console.log('Channel admin has been set/unset successfully !');
      const channels_in = await this.chatService.getUserChannels(user.id);
      this.server
        .to('user-' + body.participantId)
        .emit('channels-user-in', channels_in);
      const users = await this.chatService.getChannelUsers(body.channelId);
      this.server.to('channel-' + body.channelId).emit('channel-users', users);
    } catch (error) {
      client.emit(`alert`, { alert: { type: `danger`, message: error.error } });
    }
  }
  /**
   * change Password
   * @param SetChannelPasswordDto : channel id, action, password
   */

  @SubscribeMessage('channel-change-password')
  async changeChannelPassword(client: Socket, body: SetChannelPasswordDto) {
    try {
      const user = this.authService.getPayloadFromAuthenticationToken(
        client.handshake.headers.cookie,
      );
      await this.chatService.changeChannelPassword(user.id, body);
      console.log('Channel password has been changed successfully !');
      this.server.emit('channel-need-reload');
    } catch (error) {
      client.emit(`alert`, { alert: { type: `danger`, message: error.error } });
    }
  }

  /**
   * destroy Channel
   * @param : channel id
   */
  @SubscribeMessage('channel-destroy')
  async destroyChannel(client: Socket, { channelId }) {
    try {
      const userPayload = this.authService.getPayloadFromAuthenticationToken(
        client.handshake.headers.cookie,
      );
      const user = await this.userService.getOneById(userPayload.id);
      const channel = await this.chatService.destroyChannel(user, channelId);
      if (channel) {
        console.log(`${channel.name} has been destroyed successfully !`);
        this.server.emit('channel-need-reload');
      }
    } catch (error) {
      client.emit(`alert`, { alert: { type: `danger`, message: error.error } });
    }
  }

  /**
   * set administrator by SiteModerator
   * @param SetChannelAdminDto : channel id, participant id and action
   */
  @SubscribeMessage('channel-admin-site-moderator')
  async setChannelAdminbySite(client: Socket, body: SetChannelAdminDto) {
    try {
      const userPayload = this.authService.getPayloadFromAuthenticationToken(
        client.handshake.headers.cookie,
      );
      const user = await this.userService.getOneById(userPayload.id);
      await this.chatService.setChannelAdminbySiteModerator(user, body);
      console.log(
        'Site Moderator: Channel admin has been set/unset successfully !',
      );
      const channels_in = await this.chatService.getUserChannels(user.id);
      this.server
        .to('user-' + body.participantId)
        .emit('channels-user-in', channels_in);
      const users = await this.chatService.getChannelUsers(body.channelId);
      this.server.to('channel-' + body.channelId).emit('channel-users', users);
    } catch (error) {
      client.emit(`alert`, { alert: { type: `danger`, message: error.error } });
    }
  }

  /**
   * Ask to Reload the Channels list
   */
  @SubscribeMessage('ask-reload-channel')
  async reloadChannel(client: Socket) {
    try {
      const user = this.authService.getPayloadFromAuthenticationToken(
        client.handshake.headers.cookie,
      );
      const [channels_in, channels_out] = await Promise.all([
        this.chatService.getUserChannels(user.id),
        this.chatService.getUserNotParticipateChannels(user.id),
      ]);
      client.emit('channels-user-in', channels_in);
      client.emit('channels-user-out', channels_out);
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * Load channel data (message) and register to the room event
   * @param : channel id
   */
  @SubscribeMessage('channel-load')
  async loadChannel(client: Socket, channelId: number) {
    try {
      if (typeof channelId !== 'number') {
        throw new WsException(`Channel reload: wrong type of arguments.`);
      }
      /* Check channel exists */
      await this.chatService.getChannelById(channelId);
      const userPayload = this.authService.getPayloadFromAuthenticationToken(
        client.handshake.headers.cookie,
      );
      const [user, msgs, users] = await Promise.all([
        this.userService.getOneById(userPayload.id),
        this.messageService.getChannelMessages(channelId),
        this.chatService.getChannelUsers(channelId),
      ]);
      const channelParticipant =
        await this.chatService.getOneChannelParticipant(user.id, channelId);
      const admin = ['Owner', 'Moderator'];
      if (admin.includes(user.siteStatus) || channelParticipant) {
        client.join('channel-' + channelId);
        client.emit('channel-message-list', msgs);
        client.emit('channel-users', users);
      }
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * Unload Channel data
   * @param : channel id
   */
  @SubscribeMessage('channel-unload')
  async unloadChannel(client: Socket, channelId: number) {
    client.leave('channel-' + channelId);
  }

  /**
   * channel send messages
   * @param CreateMessageDto : channel id and message
   */
  @SubscribeMessage('channel-message')
  async newChannelMessage(client: Socket, messageDto: CreateMessageDto) {
    try {
      const userPayload = this.authService.getPayloadFromAuthenticationToken(
        client.handshake.headers.cookie,
      );
      const user: User = await this.userService.getOneById(userPayload.id);
      /* Save message in db */
      const message = await this.messageService.createChannelMessage(
        user.id,
        messageDto,
      );

      const sendMessage = {
        message_id: message.id,
        message_channelId: message.channelId,
        message_authorId: user.id,
        message_createDate: message.createDate,
        author_nickname: user.nickname,
        author_avatar: user.avatar,
        message_content: message.message,
      };

      /* Send message to all people connected in channel */
      this.server
        .to('channel-' + message.channelId)
        .emit('channel-new-message', sendMessage);
    } catch (error) {
      client.emit(`alert`, { alert: { type: `danger`, message: error.error } });
    }
  }

  /****************************************************************************/
  /*                               Direct Channel                             */
  /****************************************************************************/

  /**
   * Ask to (Re)load the direct Channels list
   */
  @SubscribeMessage('private-ask-reload')
  async loadPrivate(client: Socket) {
    try {
      const user = this.authService.getPayloadFromAuthenticationToken(
        client.handshake.headers.cookie,
      );
      const direct = this.chatService.getDirectChannelList(user.id);
      client.emit('private-list', await direct);
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * Load channel data (message) and register to the room event
   * @param LoadDirectDto : user id and channel id
   */
  @SubscribeMessage('private-load')
  async loadDirect(client: Socket, body: LoadDirectDto) {
    try {
      let channelId = body.channelId;
      const userPayload = this.authService.getPayloadFromAuthenticationToken(
        client.handshake.headers.cookie,
      );
      if (typeof channelId !== 'undefined') {
        const [channel, channelParticipant] = await Promise.all([
          this.chatService.getChannelById(body.channelId),
          this.chatService.getOneChannelParticipant(userPayload.id, channelId),
        ]);
        this.chatService.isChannelParticipant(channelParticipant, channel);
      } else if (typeof body.userId !== 'undefined') {
        const [user1, user2] = await Promise.all([
          this.userService.getUserProfileById(userPayload.id),
          this.userService.getUserProfileById(body.userId),
        ]);
        channelId = await this.chatService.createDirectChannel(user1, user2);
        const direct1 = await this.chatService.getDirectChannelList(user1.id);
        const direct2 = await this.chatService.getDirectChannelList(user2.id);
        this.server.to('user-' + user1.id).emit('private-list', direct1);
        this.server.to('user-' + user2.id).emit('private-list', direct2);
      } else throw new WsException('Invalid socket request.');
      client.join('private-' + channelId);
      const [messages, channelInfo] = await Promise.all([
        this.messageService.getChannelMessages(channelId),
        this.chatService.getDirectInfo(userPayload.id, channelId),
      ]);
      client.emit('private-info', channelInfo);
      client.emit('private-message-list', messages);
      console.log('Conversation loaded successfully !');
    } catch (error) {
      client.emit(`alert`, { alert: { type: `danger`, message: error.error } });
    }
  }

  /**
   * Unload Channel data
   * @param data
   */
  @SubscribeMessage('private-unload')
  async unloadDirect(client: Socket, channelId: number) {
    client.leave('private-' + channelId);
  }

  /**
   * channel send messages
   * @param data
   */
  @SubscribeMessage('private-message')
  async newDirectMessage(client: Socket, messageDto: CreateMessageDto) {
    try {
      const userPayload = this.authService.getPayloadFromAuthenticationToken(
        client.handshake.headers.cookie,
      );
      const user: User = await this.userService.getOneById(userPayload.id);
      /* Save message in db */
      const message = await this.messageService.createChannelMessage(
        user.id,
        messageDto,
      );

      const sendMessage = {
        message_id: message.id,
        message_channelId: message.channelId,
        message_authorId: user.id,
        message_createDate: message.createDate,
        author_nickname: user.nickname,
        author_avatar: user.avatar,
        message_content: message.message,
      };

      /* Send message to all people connected in channel */
      this.server
        .to('private-' + message.channelId)
        .emit('private-new-message', sendMessage);
    } catch (error) {
      client.emit(`alert`, { alert: { type: `danger`, message: error.error } });
    }
  }

  NumClientsInRoom(room: string) {
    const clients = this.server.sockets.adapter.rooms.get(room);
    if (clients) return clients.size;
    return 0;
    // console.log(room);
    // console.log(this.server.sockets.adapter.rooms);
    // console.log(this.server.sockets.adapter.rooms.get(room));
  }
}

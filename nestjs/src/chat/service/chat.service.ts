import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { CreateChannelDto } from '../dto/create-channel.dto';
import { Channel, ChannelType } from '../model/channel.entity';
import * as bcrypt from 'bcrypt';
import {
  ChannelParticipant,
  ChannelRole,
  StatusInChannel,
} from '../model/channelParticipant.entity';
import { JoinChannelDto } from '../dto/join-channel.dto';
import { WsException } from '@nestjs/websockets';
import { SiteStatus, User } from 'src/user/model/user.entity';
import { OptionAdmin, SetChannelAdminDto } from '../dto/set-channel-admin.dto';
import {
  OptionPassword,
  SetChannelPasswordDto,
} from '../dto/set-channel-password.dto';
import { ChangeStatusDto } from '../dto/change-status.dto';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Channel) private channelRepository: Repository<Channel>,
    @InjectRepository(ChannelParticipant)
    private channelParticipantRepository: Repository<ChannelParticipant>,
  ) {}

  /**
   * createChannel creates new channel with a channel owner.
   * (channel-create)
   * @param channelCreatorId id of user who creates channel
   * @param createChannelDto data required for creating channel (name and passward)
   * @returns Promise<Channel>
   */
  async createChannel(
    channelCreatorId: number,
    body: CreateChannelDto,
  ): Promise<Channel> {
    await this.createChannelDtoValidation(body);
    /* Create new channel*/
    const newChannel = this.channelRepository.create({ ...body });
    if (newChannel.password) {
      newChannel.type = ChannelType.PRIVATE;
      newChannel.password = await bcrypt.hash(newChannel.password, 10);
    } else newChannel.password = null;
    await this.channelRepository.save(newChannel);

    /* Add channel owner*/
    await this.addChannelParticipant(
      newChannel.id,
      channelCreatorId,
      ChannelRole.OWNER,
    );
    return newChannel;
  }

  /**
   * joinChannel adds a new channel participant.
   * (channel-join)
   * @param JoinChannelDto: channel id and password
   * @returns ChannelParticipant
   */
  async joinChannel(
    userId: number,
    body: JoinChannelDto,
  ): Promise<ChannelParticipant> {
    this.joinChannelDtoValidation(body);
    const [channel, participant] = await Promise.all([
      this.getChannelById(body.channelId),
      this.getOneChannelParticipant(userId, body.channelId),
    ]);
    if (channel.type === ChannelType.DIRECT)
      throw new WsException('You cannot join a private chat channel.');
    if (participant)
      throw new WsException('You are already a member of this channel.');
    if (channel.type === ChannelType.PRIVATE) {
      if (!(await bcrypt.compare(body.password, channel.password))) {
        throw new WsException('Invalid channel password !');
      }
    }
    return this.addChannelParticipant(body.channelId, userId, ChannelRole.USER);
  }

  /**
   * leaveChannel removes a channel current participant.
   * (channel-leave)
   * @param : channel id
   * @returns number,
   *  - -1 : If channels as been deleted
   *  - id : of new channel owner.
   */
  async leaveChannel(userId: number, channelId: number): Promise<number> {
    if (typeof channelId !== 'number') {
      throw new WsException(`Channel leave: wrong type of arguments.`);
    }
    const [channel, participant, otherUsers] = await Promise.all([
      this.getChannelById(channelId),
      this.getOneChannelParticipant(userId, channelId),
      this.channelParticipantRepository.find({
        where: {
          channelId: channelId,
          userId: Not(userId),
          status: StatusInChannel.NORMAL,
        },
      }),
    ]);
    this.isChannelParticipant(participant, channel);
    /* check participant's status */
    if (participant.status !== StatusInChannel.NORMAL) {
      throw new WsException(
        'You could not leave a channel from which you were banned or mute.',
      );
    }
    /* no other participant with normal status left, delete the channel */
    if (otherUsers.length === 0) {
      const removedChannel = await this.channelRepository.remove(channel);
      console.log(`Channel ${removedChannel.name} has been deleted.`);
      return -1;
    }
    /* If participant is the channel user, and there are normal users left */
    let newOwnerId: number;
    if (participant.role === ChannelRole.OWNER) {
      const admin = otherUsers.filter(
        (data) => data.role === ChannelRole.ADMIN,
      );
      if (admin.length !== 0) {
        admin[0].role = ChannelRole.OWNER;
        await this.channelParticipantRepository.save(admin[0]);
        newOwnerId = admin[0].userId;
      } else {
        otherUsers[0].role = ChannelRole.OWNER;
        await this.channelParticipantRepository.save(otherUsers[0]);
        newOwnerId = otherUsers[0].userId;
      }
    }
    await this.channelParticipantRepository.remove(participant);
    return newOwnerId;
  }

  /**
   * changeChannelUserStatus
   * (channel-status-change)
   * @param : userId and ChangeStatusDto(channelId, userId, sanctionDuration, status)
   */
  async changeChannelUserStatus(
    operatorId: number,
    body: ChangeStatusDto,
  ): Promise<ChannelParticipant> {
    this.changeStatusDtoValidation(body);
    const [channel, operator, user] = await Promise.all([
      this.getChannelById(body.channelId),
      this.getOneChannelParticipant(operatorId, body.channelId),
      this.getOneChannelParticipant(body.userId, body.channelId),
    ]);

    this.checkGroupChannelTypeAndParticipants(channel, operator, user);
    if (
      operator.role !== ChannelRole.OWNER &&
      operator.role !== ChannelRole.ADMIN
    ) {
      throw new WsException(
        'You must be an administrator or owner to change the status of a user.',
      );
    }
    if (
      (operator.role == ChannelRole.ADMIN && user.role == ChannelRole.ADMIN) ||
      user.role == ChannelRole.OWNER
    ) {
      throw new WsException(
        'You must have a higher role to change the status of a user.',
      );
    }
    user.status = body.status;
    if (body.sanctionDuration === 0) user.statusExpiration = null;
    else {
      user.statusExpiration = new Date(
        Date.now() + body.sanctionDuration * 60 * 1000,
      );
    }
    return this.channelParticipantRepository.save(user);
  }

  /**
   * setChannelAdmin
   * (channel-admin)
   * @param : SetChannelAdminDto (channel id, participant id, action)
   */
  async setChannelAdmin(
    operatorId: number,
    body: SetChannelAdminDto,
  ): Promise<ChannelParticipant> {
    this.setChannelAdminDtoValidation(body);
    const [channel, operator, user] = await Promise.all([
      this.getChannelById(body.channelId),
      this.getOneChannelParticipant(operatorId, body.channelId),
      this.getOneChannelParticipant(body.participantId, body.channelId),
    ]);
    this.checkGroupChannelTypeAndParticipants(channel, operator, user);
    this.isChannelOwner(operator, channel);
    return this.saveChannelAdminChange(user, body, channel);
  }

  /**
   * setChannelAdminbySiteModerator
   * (site-channel-admin)
   * @param : SetChannelAdminDto (channel id, participant id, action)
   */
  async setChannelAdminbySiteModerator(
    operator: User,
    body: SetChannelAdminDto,
  ): Promise<ChannelParticipant> {
    this.setChannelAdminDtoValidation(body);
    if (
      operator.siteStatus === SiteStatus.OWNER ||
      operator.siteStatus === SiteStatus.MODERATOR
    ) {
      const [channel, user] = await Promise.all([
        this.getChannelById(body.channelId),
        this.getOneChannelParticipant(body.participantId, body.channelId),
      ]);
      if (channel.type !== ChannelType.DIRECT) {
        this.isChannelParticipant(user, channel);
        return this.saveChannelAdminChange(user, body, channel);
      }
    }
  }

  /**
   * changeChannelPassword
   * (channel-change-password)
   * @param : SetChannelPasswordDto (channel id, action, password)
   */
  async changeChannelPassword(
    userId: number,
    body: SetChannelPasswordDto,
  ): Promise<Channel> {
    this.setChannelPasswordDtoValidation(body);
    const [channel, user] = await Promise.all([
      this.getChannelById(body.channelId),
      this.getOneChannelParticipant(userId, body.channelId),
    ]);

    this.isChannelParticipant(user, channel);
    this.isChannelOwner(user, channel);
    if (body.action === OptionPassword.ADD) {
      this.checkChannelType(channel, ChannelType.PUBLIC);
      this.checkChannelPassword(body.password);
      channel.password = await bcrypt.hash(body.password, 10);
      channel.type = ChannelType.PRIVATE;
    } else if (body.action === OptionPassword.CHANGE) {
      this.checkChannelType(channel, ChannelType.PRIVATE);
      this.checkChannelPassword(body.password);
      channel.password = await bcrypt.hash(body.password, 10);
    } else {
      if (body.password.length > 0) {
        throw new WsException(
          'Channel set password: you cannot set a channel to public with a new password.',
        );
      }
      this.checkChannelType(channel, ChannelType.PRIVATE);
      channel.type = ChannelType.PUBLIC;
      channel.password = null;
    }
    return this.channelRepository.save(channel);
  }

  /**
   * destroyChannel
   * (channel-destroy)
   * @param : channel id
   */
  async destroyChannel(user: User, channelId: number): Promise<Channel> {
    if (typeof channelId !== 'number') {
      throw new WsException('Channel destroy: channelId type is not number.');
    }
    if (
      user.siteStatus !== SiteStatus.OWNER &&
      user.siteStatus !== SiteStatus.MODERATOR
    ) {
      throw new WsException(
        `Only site owner or moderator can destroy a group channel.`,
      );
    }
    const channel = await this.getChannelById(channelId);
    if (channel.type === ChannelType.DIRECT) {
      throw new WsException(
        `Channel ${channel.name} is a direct chat, you cannot destroy it.`,
      );
    }
    return this.channelRepository.remove(channel);
  }

  /****************************************************************************/
  /*                          Channel Getters                                 */
  /****************************************************************************/

  /**
   * getAllChannels returns the list of channels that have been created.
   * @returns Promise<Channel[]> returns channel list.
   */
  getAllChannels(): Promise<Channel[]> {
    return this.channelRepository.find({ order: { createDate: 'ASC' } });
  }

  /**
   * getChannelById Return channel data
   * @param channelId
   */
  async getChannelById(channelId: number): Promise<Channel> {
    const channel = await this.channelRepository.findOne(channelId);
    if (!channel) throw new WsException('The channel does not exist.');
    return channel;
  }

  /**
   * getChannelUsers get the channel's users
   * @param channelId channel id
   * @returns Promise<any> return
   */
  async getChannelUsers(channelId: number): Promise<any> {
    await this.getChannelById(channelId);
    return this.channelParticipantRepository
      .createQueryBuilder('channelParticipant')
      .leftJoinAndSelect('channelParticipant.user', 'user')
      .select(['role', 'status', 'user.id', 'user.nickname', 'user.avatar'])
      .where('channelParticipant.channelId = :Id', { Id: channelId })
      .execute();
  }

  /****************************************************************************/
  /*                             User Getters                                 */
  /****************************************************************************/

  /**
   * getUserChannels returns all the channels in which user participates.
   * @param userId the id of user
   * @returns Promise<ChannelParticipant> [{ channel_id, channel_name, channel_type, role, status}]
   */
  getUserChannels(userId: number): Promise<any> {
    return this.channelParticipantRepository
      .createQueryBuilder('channelParticipant')
      .leftJoinAndSelect('channelParticipant.channel', 'channel')
      .select(['role', 'status', 'channel.id', 'channel.type', 'channel.name'])
      .where('channelParticipant.userId = :Id', { Id: userId })
      .andWhere('channel.type != :type', { type: ChannelType.DIRECT })
      .execute();
  }

  /**
   * getUserNotParticipateChannels returns the list of channels user dosen't participates.
   * @param userId the id of user
   * @returns Promise<ChannelParticipant> [{ channel_id, channel_name, channel_type, role, status}]
   */
  async getUserNotParticipateChannels(userId: number): Promise<any> {
    /* Get channels' ids in which the user participate*/
    const [userChannels, allUserChannels] = await Promise.all([
      this.channelParticipantRepository.find({
        where: { userId: userId },
      }),
      this.channelParticipantRepository
        .createQueryBuilder('channelParticipant')
        .leftJoinAndSelect('channelParticipant.channel', 'channel')
        .select([
          'role',
          'status',
          'channel.id',
          'channel.type',
          'channel.name',
        ])
        .where('channel.type != :type', { type: ChannelType.DIRECT })
        .execute(),
    ]);
    const channelIds = userChannels.map((data) => data.channelId);
    const seen = [];
    const userNotJoinChannels = allUserChannels
      .filter((data) => (channelIds.includes(data.channel_id) ? false : true))
      .filter((data) => {
        if (seen.includes(data.channel_id)) return false;
        else {
          seen.push(data.channel_id);
          return true;
        }
      });
    return userNotJoinChannels;
  }

  /**
   * getOneChannelParticipant returns the participant in the matched channel,
   * if this user is not in the channel, return null
   * @param userId
   * @param channelId
   * @returns
   */
  getOneChannelParticipant(
    userId: number,
    channelId: number,
  ): Promise<ChannelParticipant> {
    return this.channelParticipantRepository.findOne({
      where: {
        userId: userId,
        channelId: channelId,
      },
    });
  }

  /****************************************************************************/
  /*                               Direct Channel                             */
  /****************************************************************************/

  async createDirectChannel(user1: User, user2: User): Promise<number> {
    /* Check if the channel already exists */
    const [channelUser1, channelUser2] = await Promise.all([
      this.findUserDirectChannels(user1.id),
      this.findUserDirectChannels(user2.id),
    ]);
    const channelId = channelUser1.filter((id) => channelUser2.includes(id));
    /* return existing channel id */
    if (channelId.length === 1) return channelId[0];

    const newChannel = this.channelRepository.create();
    newChannel.name = `${user1.nickname} , ${user2.nickname}`;
    newChannel.type = ChannelType.DIRECT;
    await this.channelRepository.save(newChannel);

    await Promise.all([
      this.addChannelParticipant(newChannel.id, user1.id, ChannelRole.OWNER),
      this.addChannelParticipant(newChannel.id, user2.id, ChannelRole.OWNER),
    ]);
    return newChannel.id;
  }

  async getDirectInfo(userId: number, channelId: number): Promise<any> {
    const channelInfos = await this.channelRepository
      .createQueryBuilder('channel')
      .leftJoinAndSelect('channel.participant', 'participant')
      .leftJoinAndSelect('participant.user', 'user')
      .select(['channel.id'])
      .addSelect('user.id', 'user_id')
      .addSelect('user.nickname', 'user_name')
      .addSelect('user.avatar', 'user_avatar')
      .where('channel.id = :Id', { Id: channelId })
      .andWhere('channel.type = :Type', { Type: ChannelType.DIRECT })
      .execute();

    const channelInfo = channelInfos.filter(
      (channel) => channel.user_id != userId,
    );

    return channelInfo[0];
  }

  async getDirectChannelList(userId: number): Promise<Channel[]> {
    const channelIds = await this.findUserDirectChannels(userId);

    return this.channelRepository
      .createQueryBuilder('channel')
      .leftJoinAndSelect('channel.participant', 'participant')
      .leftJoinAndSelect('participant.user', 'user')
      .select(['channel.id'])
      .addSelect('user.id', 'user_id')
      .addSelect('user.nickname', 'user_name')
      .addSelect('user.avatar', 'user_avatar')
      .where('participant.userId != :Id', { Id: userId })
      .andWhere('channel.type = :Type', { Type: ChannelType.DIRECT })
      .andWhereInIds(channelIds)
      .execute();
  }

  /****************************************************************************/
  /*                                 Utils                                     */
  /****************************************************************************/

  addChannelParticipant(
    channelId: number,
    userId: number,
    role: ChannelRole,
  ): Promise<ChannelParticipant> {
    const channelParticipant = this.channelParticipantRepository.create();
    channelParticipant.channelId = channelId;
    channelParticipant.userId = userId;
    channelParticipant.role = role;
    return this.channelParticipantRepository.save(channelParticipant);
  }

  saveChannelAdminChange(
    user: ChannelParticipant,
    body: SetChannelAdminDto,
    channel: Channel,
  ): Promise<ChannelParticipant> {
    if (body.action === OptionAdmin.SET) {
      this.isChannelParticipantNormalUser(user, channel);
      user.role = ChannelRole.ADMIN;
      return this.channelParticipantRepository.save(user);
    } else {
      this.isChannelAdmin(user, channel);
      user.role = ChannelRole.USER;
      return this.channelParticipantRepository.save(user);
    }
  }

  async findUserDirectChannels(userId: number): Promise<number[]> {
    const channelIds = (
      await this.channelParticipantRepository
        .createQueryBuilder('participant')
        .leftJoinAndSelect('participant.channel', 'channel')
        .select('channel.id', 'id')
        .where('channel.type = :Type', { Type: ChannelType.DIRECT })
        .andWhere('participant.userId = :Id', { Id: userId })
        .execute()
    ).map((channel) => channel.id);
    return channelIds;
  }

  /****************************************************************************/
  /*                                 Checkers                                 */
  /****************************************************************************/

  checkChannelPassword(password: string): void {
    if (password.length < 4 || password.length > 16) {
      throw new WsException(
        'Channel password should consist 4 to 16 letters including alphabets numbers and specials.',
      );
    }
  }

  checkChannelType(channel: Channel, type: ChannelType): void {
    if (channel.type !== type) {
      throw new WsException(
        `The channel [${channel.name}] type is ${channel.type}.`,
      );
    }
  }

  isChannelParticipant(
    participant: ChannelParticipant,
    channel: Channel,
  ): void {
    if (!participant) {
      throw new WsException(
        `User is not a member of channel [${channel.name}].`,
      );
    }
  }

  isChannelOwner(participant: ChannelParticipant, channel: Channel): void {
    if (participant.role !== ChannelRole.OWNER) {
      throw new WsException(
        `Participant is not the owner of channel [${channel.name}].
        Only the owner can add/change/delete password and set/unset administrators.`,
      );
    }
  }

  isChannelAdmin(participant: ChannelParticipant, channel: Channel): void {
    if (participant.role !== ChannelRole.ADMIN) {
      throw new WsException(
        `Participant is not the administrator of channel [${channel.name}].`,
      );
    }
  }

  isChannelParticipantNormalUser(
    participant: ChannelParticipant,
    channel: Channel,
  ): void {
    if (participant.role !== ChannelRole.USER) {
      throw new WsException(
        `Participant is already the owner/administrator of channel [${channel.name}].`,
      );
    }
    if (participant.status !== StatusInChannel.NORMAL) {
      throw new WsException(
        `The participant is muted/banned in channel [${channel.name}].`,
      );
    }
  }

  checkGroupChannelTypeAndParticipants(
    channel: Channel,
    participant1: ChannelParticipant,
    participant2: ChannelParticipant,
  ): void {
    if (channel.type === ChannelType.DIRECT) {
      throw new WsException(`Channel [${channel.name}] is a direct chat !`);
    }
    this.isChannelParticipant(participant1, channel);
    this.isChannelParticipant(participant2, channel);
  }

  /****************************************************************************/
  /*                              Validations                                 */
  /****************************************************************************/

  async createChannelDtoValidation(body: CreateChannelDto): Promise<void> {
    if (typeof body.name !== 'string' || typeof body.password !== 'string') {
      throw new WsException(`Channel create: wrong type of arguments.`);
    }

    if (body.name.length < 2 || body.name.length > 32) {
      throw new WsException(
        `Channel create: channel name's length should be between 2 to 32.`,
      );
    }
    const channelNames = (await this.getAllChannels()).map((data) => data.name);
    if (channelNames.includes(body.name)) {
      throw new WsException('Channel name has been taken, choose a new one.');
    }

    if (body.password.length > 0) {
      this.checkChannelPassword(body.password);
    }
  }

  joinChannelDtoValidation(body: JoinChannelDto): void {
    if (
      typeof body.channelId !== 'number' ||
      typeof body.password !== 'string'
    ) {
      throw new WsException(`Channel join: wrong type of arguments.`);
    }
  }

  changeStatusDtoValidation(body: ChangeStatusDto): void {
    if (
      typeof body.channelId !== 'number' ||
      typeof body.userId !== 'number' ||
      typeof body.status !== 'string' ||
      typeof body.sanctionDuration !== 'number'
    ) {
      throw new WsException(
        'Channel change user status: wrong type of arguments.',
      );
    }

    if (
      body.status !== StatusInChannel.BAN &&
      body.status !== StatusInChannel.MUTE &&
      body.status !== StatusInChannel.NORMAL
    ) {
      throw new WsException(
        'Channel change user status: this status does not exist.',
      );
    }
  }

  setChannelAdminDtoValidation(body: SetChannelAdminDto): void {
    if (
      typeof body.channelId !== 'number' ||
      typeof body.participantId !== 'number' ||
      typeof body.action !== 'string'
    ) {
      throw new WsException('Channel set admin: wrong type of arguments.');
    }

    if (body.action !== OptionAdmin.SET && body.action !== OptionAdmin.UNSET) {
      throw new WsException('Channel set admin: wrong setting action.');
    }
  }

  setChannelPasswordDtoValidation(body: SetChannelPasswordDto): void {
    if (
      typeof body.channelId !== 'number' ||
      typeof body.action !== 'string' ||
      typeof body.password !== 'string'
    ) {
      throw new WsException('Channel set password: wrong type of arguments.');
    }

    if (
      body.action !== OptionPassword.ADD &&
      body.action !== OptionPassword.CHANGE &&
      body.action !== OptionPassword.REMOVE
    ) {
      throw new WsException(`Channel set password: wrong setting action.`);
    }
  }
}

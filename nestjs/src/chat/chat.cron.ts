import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatGateway } from './gateway/chat.gateway';
import {
  ChannelParticipant,
  StatusInChannel,
} from './model/channelParticipant.entity';
import { ChatService } from './service/chat.service';

@Injectable()
export class ChatTasksService {
  constructor(
    private chatGateway: ChatGateway,
    private chatService: ChatService,
    @InjectRepository(ChannelParticipant)
    private channelParticipantRepository: Repository<ChannelParticipant>,
  ) {}
  @Cron('30 * * * * *')
  async handleCron() {
    const expiredStatusParticipants: ChannelParticipant[] =
      await this.channelParticipantRepository
        .createQueryBuilder('channelParticipant')
        .select([])
        .where('channelParticipant.statusExpiration <= NOW()')
        .execute();

    expiredStatusParticipants.forEach(async (participant) => {
      const users = await this.chatService.getChannelUsers(
        participant.channelId,
      );
      this.chatGateway.server
        .to('channel-' + participant.channelId)
        .emit('channel-users', users);
      participant.status = StatusInChannel.NORMAL;
      participant.statusExpiration = null;
      await this.channelParticipantRepository.save(participant);
    });
  }
}

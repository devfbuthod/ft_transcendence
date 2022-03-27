import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WsException } from '@nestjs/websockets';
import { Channel } from 'diagnostics_channel';
import { RelationshipService } from 'src/relationship/service/relationship.service';
import { Repository } from 'typeorm';
import { CreateMessageDto } from '../dto/create-message.dto';
import { StatusInChannel } from '../model/channelParticipant.entity';
import { Message } from '../model/messages.entity';
import { ChatService } from './chat.service';

@Injectable()
export class MessageService {
  constructor(
    private channelService: ChatService,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(Channel)
    private channelRepository: Repository<Message>,
    @Inject(forwardRef(() => RelationshipService))
    private relationshipService: RelationshipService,
  ) {}

  async createChannelMessage(
    authorId: number,
    body: CreateMessageDto,
  ): Promise<Message> {
    this.createMessageDtoValidation(body);
    const [channel, participant] = await Promise.all([
      this.channelService.getChannelById(body.channelId),
      this.channelService.getOneChannelParticipant(authorId, body.channelId),
    ]);
    this.channelService.isChannelParticipant(participant, channel);

    if (participant.status !== StatusInChannel.NORMAL) {
      if (participant.statusExpiration === null)
        throw new WsException(
          'Cannot post message in channel if you are ban or mute !',
        );
      if (participant.statusExpiration.getTime() < Date.now()) {
        participant.status = StatusInChannel.NORMAL;
        participant.statusExpiration = null;
        await this.channelRepository.save(participant);
      } else
        throw new WsException(
          'Cannot post message in channel if you are ban or mute !',
        );
    }

    const newMessage = this.messageRepository.create({ ...body });
    newMessage.authorId = authorId;
    return this.messageRepository.save(newMessage);
  }

  getChannelMessages(channelId: number): Promise<any> {
    return this.messageRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.author', 'author')
      .select([
        'message.id',
        'message.channelId',
        'message.authorId',
        'author.nickname',
        'author.avatar',
        'message.createDate',
      ])
      .addSelect('message.message', 'message_content')
      .where('message.channelId = :Id', { Id: channelId })
      .orderBy('message.createDate', 'ASC')
      .execute();
  }

  /****************************************************************************/
  /*                              Validations                                 */
  /****************************************************************************/

  createMessageDtoValidation(body: CreateMessageDto): void {
    if (
      typeof body.channelId !== 'number' ||
      typeof body.message !== 'string'
    ) {
      throw new WsException(`Channel message create: wrong type of arguments.`);
    }
    if (body.message.length === 0 || body.message.length > 125) {
      throw new WsException(
        `Channel message create: message cannot be empty or longer than 125 characters.`,
      );
    }
  }
}

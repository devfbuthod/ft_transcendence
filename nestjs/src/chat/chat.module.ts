import { ChatService } from './service/chat.service';
import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { GameModule } from 'src/game/game.module';
import { UserModule } from 'src/user/user.module';
import { ChatGateway } from './gateway/chat.gateway';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Channel } from './model/channel.entity';
import { Message } from './model/messages.entity';
import { ChannelParticipant } from './model/channelParticipant.entity';
import { MessageService } from './service/message.service';
import { RelationshipModule } from 'src/relationship/relationship.module';
import { ChatTasksService } from './chat.cron';

@Module({
  imports: [
    TypeOrmModule.forFeature([Channel, ChannelParticipant, Message]),
    UserModule,
    GameModule,
    AuthModule,
    forwardRef(() => RelationshipModule),
  ],
  providers: [ChatService, MessageService, ChatGateway, ChatTasksService],
  exports: [ChatModule, ChatGateway],
})
export class ChatModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatModule } from 'src/chat/chat.module';
import { User } from 'src/user/model/user.entity';
import { UserModule } from 'src/user/user.module';
import { RelationshipController } from './controller/relationship.controller';
import { Relationship } from './model/relationship.entity';
import UserRelationship from './model/userRelationship.entity';
import { RelationshipService } from './service/relationship.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Relationship, UserRelationship, User]),
    UserModule,
    ChatModule,
  ],
  controllers: [RelationshipController],
  providers: [RelationshipService],
  exports: [RelationshipService],
})
export class RelationshipModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './model/user.entity';
import { UserService } from './service/user.service';
import { UserController } from './controller/user.controller';
import DatabaseFile from './model/databasefile.entity';
import { UserGateway } from './user.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([User, DatabaseFile])],
  controllers: [UserController],
  providers: [UserService, UserGateway],
  exports: [UserService, UserGateway],
})
export class UserModule {}

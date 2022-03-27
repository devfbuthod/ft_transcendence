import { OnlineStatus } from 'src/user/model/user.entity';

export class SendAllUsersRelationshipDto {
  id: number;
  nickname: string;
  avatar: string;
  userStatus: OnlineStatus;
  relationship: string;
}

import { OnlineStatus, SiteStatus } from 'src/user/model/user.entity';

export class SendSpecificListRelationshipDto {
  user_id: number;
  user_nickname: string;
  user_avatar: string;
  user_userStatus: OnlineStatus;
  user_siteStatus: SiteStatus;
  relation_id: number;
}

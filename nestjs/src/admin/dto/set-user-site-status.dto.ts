import { IsEnum, IsInt } from 'class-validator';

export enum OptionSiteStatus {
  MODERATOR = 'Moderator',
  USER = 'User',
  BANNED = 'Banned',
}

export class SetUserSiteStatusDto {
  @IsInt()
  id: number;

  @IsEnum(OptionSiteStatus)
  newStatus: OptionSiteStatus;
}

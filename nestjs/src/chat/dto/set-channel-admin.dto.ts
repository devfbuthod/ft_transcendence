import { IsEnum, IsInt } from 'class-validator';

export enum OptionAdmin {
  SET = 'Set',
  UNSET = 'Unset',
}

export class SetChannelAdminDto {
  @IsInt()
  channelId: number;

  @IsInt()
  participantId: number;

  @IsEnum(OptionAdmin)
  action: OptionAdmin;
}

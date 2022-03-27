import { IsEnum, IsInt } from 'class-validator';

export enum OptionPassword {
  ADD = 'Add',
  CHANGE = 'Change',
  REMOVE = 'Remove',
}

export class SetChannelPasswordDto {
  @IsInt()
  channelId: number;

  @IsEnum(OptionPassword)
  action: OptionPassword;

  password: string;
}

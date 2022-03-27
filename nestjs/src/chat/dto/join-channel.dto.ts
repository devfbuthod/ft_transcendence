import { IsInt } from 'class-validator';

export class JoinChannelDto {
  @IsInt()
  channelId: number;

  password: string;
}

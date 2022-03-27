import { IsInt } from 'class-validator';

export class LoadDirectDto {
  @IsInt()
  userId: number; // pour load avec un userID
  @IsInt()
  channelId: number; // Pour load avec un channelId
}

import { IsInt, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateMessageDto {
  @IsInt()
  channelId: number;

  @IsNotEmpty()
  @MaxLength(125)
  message: string;
}

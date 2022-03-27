import { IsAlphanumeric, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateChannelDto {
  @IsAlphanumeric()
  @MaxLength(32)
  @IsNotEmpty()
  name: string;

  password: string;
}

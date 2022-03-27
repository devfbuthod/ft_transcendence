/*
 ** Test only, delete later
 */
import {
  IsAlphanumeric,
  IsInt,
  IsNotEmpty,
  IsUrl,
  MaxLength,
} from 'class-validator';

export class CreateUserDto {
  @IsInt()
  id: number;

  @IsAlphanumeric()
  @MaxLength(10)
  @IsNotEmpty()
  nickname: string;

  @IsUrl()
  avatar: string;
}

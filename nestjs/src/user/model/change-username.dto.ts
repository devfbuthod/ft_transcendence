import {
  IsAlphanumeric,
  IsNotEmpty,
  MaxLength,
  MinLength,
} from 'class-validator';

export class ChangeUserNameDto {
  @IsAlphanumeric()
  @MinLength(2)
  @MaxLength(15)
  @IsNotEmpty()
  nickname: string;
}

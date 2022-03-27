import {
  IsNotEmpty,
  IsNumberString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class TwoFactorAuthCodeDto {
  @IsNotEmpty()
  @IsNumberString()
  @MinLength(6)
  @MaxLength(6)
  twoFactorAuthenticationCode: string;
}

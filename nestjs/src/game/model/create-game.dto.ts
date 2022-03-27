import { IsInt, IsNotEmpty, Max, Min } from 'class-validator';

export class CreateGameDto {
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Max(1000000)
  leftUserId: number;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Max(1000000)
  rightUserId: number;
}

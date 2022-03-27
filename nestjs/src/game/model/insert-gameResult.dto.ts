import { IsInt, IsNotEmpty, Max, Min } from 'class-validator';

export class InsertGameResultDto {
  @IsInt()
  @Min(-1)
  @Max(10)
  @IsNotEmpty()
  leftUserScore: number;

  @IsInt()
  @Min(-1)
  @Max(10)
  @IsNotEmpty()
  rightUserScore: number;
}

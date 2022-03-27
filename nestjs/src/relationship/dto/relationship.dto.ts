import { IsInt, IsNotEmpty, Max, Min } from 'class-validator';

export class RelationshipDto {
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Max(1000000)
  readonly addresseeUserId: number;
}

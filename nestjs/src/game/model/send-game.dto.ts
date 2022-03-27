export class SendGameDto {
  id: number;
  mode: string;
  status: string;
  createDate: Date;
  updateDate: Date;
  leftUserId: number;
  leftUserScore: number;
  rightUserId: number;
  rightUserScore: number;
  winnerId: number;
}

export class SendUserGameRecordsDto {
  gameId: number;
  mode: string;
  createDate: Date;
  updateDate: Date;
  userScore: number;
  opponentId: number;
  opponentScore: number;
  userGameStatus: string;
}

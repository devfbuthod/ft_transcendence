const XR = 1;
const XL = 3;
const Y = 2;
const LEFTMAXANGLE = (Math.PI * 5) / 12; // 75 deg to radian
const LEFTLITTLEANGLE = Math.PI * 0.25;
const RIGHTMAXANGLE = (Math.PI * 7) / 12; // 75 deg to radian
const RIGHTLITTLEANGLE = Math.PI * 0.75;
const H = 800 * 0.9;
const W = 1000;
export const FRAMERATE = 60;
export type ObjectToCollide = {
  tl: Pos;
  tr: Pos;
  bl: Pos;
  br: Pos;
};

type Pos = {
  x: number;
  y: number;
};

export type Paddle = {
  h: number;
  w: number;
  pos: Pos;
  speed: number;
};

export type Ball = {
  pos: Pos;
  radius: number;
  vx: number;
  vy: number;
  speed: number;
  acceleration: number;
};

export type Player = {
  name: string;
  id: number;
  avatar: string;
  paddle: number;
  score: number;
  up: boolean;
  down: boolean;
};

// export function ballCollisiontoWall(ball: Ball, wall: ObjectToCollide): number {
//   if (ball.pos.x + ball.vx > wall.tr.x - ball.radius) {
//     // si la balle touche le bord droit
//     return XR;
//   } else if (ball.pos.x + ball.vx <= wall.tl.x + ball.radius) {
//     //si la balle touche le bord gauche
//     return XL;
//   } else if (
//     ball.pos.y + ball.vy <= wall.tl.y + ball.radius || //si la balle touche le haut
//     ball.pos.y + ball.vy >= wall.bl.y - ball.radius // si la balle touche en bas
//   ) {
//     return Y;
//   } else return 0;
// }

// export function ballCollisionToPaddle(
//   ball: Ball,
//   paddleL: Paddle,
//   paddleR: Paddle,
// ): Pos {
//   const rect: Pos = { x: ball.pos.x, y: ball.pos.y };
//   let dist = 0;
//   //if ball collide avec paddleL
//   if (ball.pos.x - ball.radius <= paddleL.pos.x + paddleL.w) {
//     rect.x =
//       ball.pos.x < paddleL.pos.x
//         ? paddleL.pos.x
//         : ball.pos.x > paddleL.pos.x + paddleL.w
//         ? paddleL.pos.x + paddleL.w
//         : rect.x;
//     rect.y =
//       ball.pos.y < paddleL.pos.y
//         ? paddleL.pos.y
//         : ball.pos.y > paddleL.pos.y + paddleL.h
//         ? paddleL.pos.y + paddleL.h
//         : rect.y;
//     dist = Math.sqrt(
//       Math.pow(ball.pos.x - rect.x, 2) + Math.pow(ball.pos.y - rect.y, 2),
//     );
//     if (dist <= ball.radius) {
//       // calc next vx and vy
//       const relativeY = 1 - (rect.y - paddleL.pos.y) / (paddleL.h * 0.5);
//       const angleRebound =
//         Math.abs(relativeY) === 1
//           ? -relativeY * LEFTMAXANGLE
//           : -relativeY * LEFTLITTLEANGLE;
//       return { x: Math.cos(angleRebound), y: Math.sin(angleRebound) }; ////////
//     } else return { x: 0, y: 0 };
//   } else if (ball.pos.x + ball.radius + ball.speed >= paddleR.pos.x) {
//     console.log(ball.pos.x, paddleR.pos.x);
//     rect.x =
//       ball.pos.x < paddleR.pos.x
//         ? paddleR.pos.x
//         : ball.pos.x > paddleR.pos.x + paddleR.w
//         ? paddleR.pos.x + paddleR.w
//         : rect.x;
//     rect.y =
//       ball.pos.y < paddleR.pos.y
//         ? paddleR.pos.y
//         : ball.pos.y > paddleR.pos.y + paddleR.h
//         ? paddleR.pos.y + paddleR.h
//         : rect.y;
//     dist = Math.sqrt(
//       Math.pow(ball.pos.x - rect.x, 2) + Math.pow(ball.pos.y - rect.y, 2),
//     );
//     if (dist <= ball.radius) {
//       const relativeY = 1 - (rect.y - paddleR.pos.y) / (paddleR.h * 0.5);
//       const angleRebound =
//         Math.abs(relativeY) === 1
//           ? -relativeY * LEFTMAXANGLE
//           : -relativeY * LEFTLITTLEANGLE;
//       return { x: -Math.cos(angleRebound), y: Math.sin(angleRebound) }; ////////
//     } else return { x: 0, y: 0 };
//   }
//   return { x: 0, y: 0 };
// }

export type Party = {
  ball: Ball;
  paddleL: Paddle;
  paddleR: Paddle;
  scoreL: number;
  scoreR: number;

  lasty: boolean;
  lastp: boolean;
};

// export function setNewParty(): Party {
//   const newParty: Party = {
//     ball: {
//       pos: { x: W * 0.5, y: H * 0.5 },
//       radius: 15,
//       vx: Math.random() > 0.5 ? 1 : -1,
//       vy: 0,
//       speed: 2,
//       acceleration: 1,
//     },
//     paddleL: {
//       h: H / 6,
//       w: W * 0.02,
//       pos: {
//         x: W * 0.01,
//         y: 0,
//       },
//       speed: 10, //TODO
//     },
//     paddleR: {
//       h: H / 6,
//       w: W * 0.02,
//       pos: {
//         x: W * 0.97,
//         y: H - H / 6,
//       },
//       speed: 10, // TODO
//     },
//     scoreL: 0,
//     scoreR: 0,
//     lastp: false,
//     lasty: false,
//   };
//   return newParty;
// }

// export function newScore(scored: number, party: Party): Party {
//   const newParty: Party = {
//     ball: {
//       pos: { x: W * 0.5, y: H * 0.5 },
//       radius: 15,
//       vx: Math.random() > 0.5 ? 1 : -1,
//       vy: 0,
//       speed: 2,
//       acceleration: 1,
//     },
//     paddleL: {
//       ...party.paddleL,
//     },
//     paddleR: {
//       ...party.paddleR,
//     },
//     scoreL: scored === XR ? party.scoreL : party.scoreL + 1,
//     scoreR: scored === XR ? party.scoreR + 1 : party.scoreR,

//     lastp: false,
//     lasty: false,
//   };
//   return newParty;
// }

// export function createGameInfos(users: Player[]) {
//   //TODO Ajouter les avatars et autre
//   return `{
//             pOneName: ${users[0].name},
//             pTwoName: ${users[1].name},
//         }`;
// }

// export function gameInfos(party: Party) {
//   // TODO AJouter les scores et stop entre les points
//   return {
//     pOneY: party.paddleL.pos.y,
//     pTwoY: party.paddleR.pos.y,
//     ballX: party.ball.pos.x,
//     ballY: party.ball.pos.y,
//     scoreL: party.scoreL,
//     scoreR: party.scoreR,
//   };
// }
// export function UpdateGame(users: Player[], party: Party) {
//   const mouv: number[] = [0, 0];
//   users.map((e) => {
//     if (e.paddle == 1) mouv[0] = e.down && !e.up ? 1 : e.up && !e.down ? -1 : 0;
//     if (e.paddle == 2) mouv[1] = e.down && !e.up ? 1 : e.up && !e.down ? -1 : 0;
//   });
//   const touch = ballCollisionToPaddle(party.ball, party.paddleL, party.paddleR);
//   if (touch.x || touch.y) {
//     if (party.lastp === false) {
//       console.log('HOP');
//       party.ball.vx = touch.x;
//       party.ball.vy = touch.y;
//       party.lastp = true;
//       if (mouv[0] || mouv[1]) party.ball.acceleration += 0.6;
//     }
//   } else {
//     party.lastp = false;
//     const toWall = ballCollisiontoWall(party.ball, {
//       tl: { x: 0, y: 0 },
//       tr: { x: W, y: 0 },
//       bl: { x: 0, y: H },
//       br: { x: W, y: H },
//     });
//     if (toWall === XR || toWall === XL) {
//       return newScore(toWall, party);
//     } else if (toWall === Y && !party.lasty) {
//       party.lasty = true;
//       party.ball.vy *= -1;
//     }
//     if (toWall !== Y) {
//       party.lasty = false;
//     }
//   }
//   if (party.ball.acceleration > 1) {
//     party.ball.acceleration -= 0.005;
//   }
//   party.ball.pos.x +=
//     party.ball.vx * party.ball.speed * party.ball.acceleration;
//   party.ball.pos.y +=
//     party.ball.vy * party.ball.speed * party.ball.acceleration;
//   if (mouv[0]) {
//     party.paddleL.pos.y += mouv[0] * party.paddleL.speed;
//     if (party.paddleL.pos.y < 0) party.paddleL.pos.y = 0;
//     if (party.paddleL.pos.y + party.paddleL.h > H)
//       party.paddleL.pos.y = H - party.paddleL.h;
//   }
//   if (mouv[1]) {
//     party.paddleR.pos.y += mouv[1] * party.paddleR.speed;
//     if (party.paddleR.pos.y < 0) party.paddleR.pos.y = 0;
//     if (party.paddleR.pos.y + party.paddleR.h > H)
//       party.paddleR.pos.y = H - party.paddleR.h;
//   }

//   return party;
// }

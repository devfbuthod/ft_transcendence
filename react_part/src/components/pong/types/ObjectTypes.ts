type Pos = {
	x: number;
	y: number;
}

type Paddle = {
	h: number;
	w: number;
	pos: Pos;
}

type Ball = {
	pos: Pos;
	radius: number;
}


export type {Paddle, Ball, Pos}
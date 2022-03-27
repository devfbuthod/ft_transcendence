
import create from 'zustand'
import {Paddle, Ball} from './../types/ObjectTypes'
const H = 800;
const W = 1000;
type Player = {
	avatar:string;
	name: string;
}
type Box = {
	x:number;
	y:number;
	w:number;
	h:number;
}

type Score = {
	h: number;
	w: number;
	imgLeft:Box;
	nameLeft:Box;
	bonusLeft: Box;
	score: Box;
	imgRight:Box;
	nameRight:Box;
	bonusRight: Box;
	fontSize: number;
}

type Bonus = {
	x: number;
	y: number;
	id: number;
}

type Infos = {
	pOneY: number;
	pTwoY: number;
	ballX: number;
	ballY: number;
}

type Store = {
	setNewPos: (infos:Infos) => void;
	paddleL: Paddle;
	paddleR: Paddle;
	ball: Ball;
	w: number;
	h: number;
	scoreBar: Score;
	bonus: boolean;
	setBonusY: (yL:number, yR:number) => void;
	setBonusType: (L: number, R: number) => void;
	addBlackHole: (next:string) => void;
	blackHole: string | undefined;
	BonusLeft: Bonus;
	BonusRight: Bonus;
	radius: number; // ?
	setScore: (L:number, R:number) => void;
	right:number;
	left:number;
	gameStatus:number;
	setGameStatus: (status:number) => void;
	playerL:Player;
	playerR:Player;
}


const useStore = create<Store>((set) => {
	return {
// set default values
	// paddle left
    paddleL: {
        h: H / 6,
        w: W * 0.02,
        pos:{
            y: 0,
            x: W * 0.01,
        }
    },
    // paddleR
    paddleR:{
        h: H / 6,
        w: W * 0.02,
        pos:{
            y: H * 0.9 - (H / 6),
            x: W * 0.97,
        }
    },
	//	ball
		ball:{
			pos: {
				x:W * 0.5,
				y:H * 0.9 *0.5
			},
			radius: 15,
		},
	setNewPos: (infos:Infos) => set((state:Store) => ({ ////////// FAIRE RATIO POUR 
		ball:{...state.ball, pos:{x:infos.ballX, y:infos.ballY}},
		paddleR:{...state.paddleR, pos:{x:state.paddleR.pos.x, y:infos.pTwoY}},
		paddleL:{...state.paddleL, pos:{x:state.paddleL.pos.x, y:infos.pOneY}}
	})),
	//	general settings
		w: W,
		h: H * 0.9,
	// Score canvas settings
		scoreBar: {
            h: H * 0.1,
            w: W,
            imgLeft:	{
                x:H *0.0125,
                y:H *0.0125,
                w:H * 0.075,
                h:H * 0.075 },
            nameLeft:	{
                x:W * 0.08,
                y:H * 0.0125,
                w:W * 0.3,
                h:H * 0.075 },
            bonusLeft:	{
                x:W * 0.38,
                y:H * 0.0125,
                w:H * 0.075, 
                h:H * 0.075 },
            score:		{
                x:W * 0.44,
                y:H *0.0125, 
                w:W * 0.12, 
                h:H * 0.075 },
            imgRight:	{
                x:W - (H * 0.0875), 
                y:H *0.0125, 
                w:H * 0.075, 
                h:H * 0.075 },
            nameRight:	{
                x:W * 0.62, 
                y:H *0.0125, 
                w:W * 0.3, 
                h:H * 0.075 },
            bonusRight:	{
                x:W * 0.56, 
                y:H * 0.0125, 
                w:H * 0.075, 
                h:H * 0.075 },
            fontSize: 48 * H / 1000,
		},
		bonus: false,
		BonusLeft: {
			up : false,
			x: W * 0.02,
			y: -1,
			id: 0,
		},
		BonusRight:{
			up : false,
			x: W * 0.98,
			y: -1,
			id: 0,
		},
		blackHole: undefined,
		setBonusY: (yL, yR) => set((s) => ({
			BonusLeft: {...s.BonusLeft, y:yL},
			BonusRight: {...s.BonusRight, y: yR}
		})),
		setBonusType: (L, R) => set((s) => ({
			BonusLeft: {...s.BonusLeft, id:L},
			BonusRight: {...s.BonusRight, id: R}
		})),
		addBlackHole: (next)=> set(() => ({blackHole:next})),
		radius:2,
		setScore: (L, R) => set(() => ({ left:L, right:R})),
		left:0,
		right:0,
		gameStatus:0,
		setGameStatus: (status) => set(() => ({gameStatus:status})),
		playerL :{ name: '', avatar: ''},
		playerR :{ name: '', avatar: ''},
	}
});

export default useStore;
export type { Ball, Paddle, Score, Bonus, Player };
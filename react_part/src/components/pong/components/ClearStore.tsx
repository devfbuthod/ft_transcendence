import useStore from "../hooks/useStore";
const H = 800;
const W = 1000;

const clearStore = () => {
    useStore.setState(
    s => ({...s,
        paddleL: {
            ...s.paddleL,
            h: H / 6,
            w: W * 0.02,
            pos:{
                ...s.paddleL.pos,
                x: W * 0.01,
            }
        },
        // paddleR
        paddleR:{
            ...s.paddleR,
            h: H / 6,
            w: W * 0.02,
            pos:{
                y: H * 0.9 - (H / 6),
                x: W * 0.97,
            }
        },
        // ball
        ball:{
            ...s.ball,
            pos: {
                x:W * 0.5,
                y:H * 0.9 *0.5
            },
            radius: 15,
        },
        w: W,
        h: H * 0.9,
        scoreBar:{
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
            fontSize: 48 * H / 1000, },
            BonusLeft:{
                ...s.BonusLeft,
                y: -1,
                x:W * 0.02,
                id: 0,
            },	
            BonusRight:{
                ...s.BonusRight,
                x:W * 0.98,
                y: -1,
                id: 0,
            },
		blackHole: undefined,
		radius:2,
		left:0,
		right:0,
		gameStatus:0,
		}))
    return null
}

export default clearStore
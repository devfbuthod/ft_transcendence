import {useRef, useEffect} from "react"
import useStore,{Score, Player} from "../../hooks/useStore";
import "./../ScoreCanvas.css";

function draw(ctx:CanvasRenderingContext2D, p:Score, playerL:Player, playerR:Player)  {
	
	ctx.clearRect(0,0, p.w, p.h);
	// player Left
	// // name
	ctx.beginPath()
	ctx.fillStyle = "#374B43"
	ctx.font = `${p.fontSize}px Roboto`;
	ctx.textAlign = 'left';
	ctx.fillText(`${playerL.name}`, p.nameLeft.x, p.nameLeft.y + (p.nameLeft.h * 0.75), p.nameLeft.w -p.imgLeft.x);
	ctx.closePath();
	// // avatar
	const leftavatar = playerL.avatar;
	let avatarL = new Image();
    avatarL.src = leftavatar;
	const sizeL = avatarL.width < avatarL.height ? avatarL.width : avatarL.height;
	avatarL.onload = start;//function () {ctx.drawImage(avatarL, (avatarL.width - sizeL) * 0.5, (avatarL.height - sizeL) * 0.5, sizeL, sizeL, p.imgLeft.x, p.imgLeft.y, p.imgLeft.w, p.imgLeft.h);}
	avatarL.src = leftavatar;
	// player Right
	// // avatar
	const rightavatar = playerR.avatar;

	let avatarR = new Image();
	avatarR.src = rightavatar;
	const sizeR = avatarR.width < avatarR.height ? avatarR.width : avatarR.height;
	avatarR.onload = start;//function () {ctx.drawImage(avatarR, (avatarR.width - sizeR) * 0.5, (avatarR.height - sizeR) * 0.5, sizeR, sizeR,p.imgRight.x, p.imgRight.y, p.imgRight.w, p.imgRight.h)};
    avatarR.src = rightavatar;
    let imgCount = 2;
    function start() {
        if (--imgCount> 0) {return;}
        ctx.drawImage(avatarR, (avatarR.width - sizeR) * 0.5, (avatarR.height - sizeR) * 0.5, sizeR, sizeR,p.imgRight.x, p.imgRight.y, p.imgRight.w, p.imgRight.h);
        ctx.drawImage(avatarL, (avatarL.width - sizeL) * 0.5, (avatarL.height - sizeL) * 0.5, sizeL, sizeL, p.imgLeft.x, p.imgLeft.y, p.imgLeft.w, p.imgLeft.h);
    }
	// // name
	ctx.beginPath()
	ctx.font = `${p.fontSize}px Roboto`;
	ctx.textAlign = 'right';
	ctx.fillText(`${playerR.name}`, p.nameRight.x + p.nameRight.w , p.nameRight.y + (p.nameRight.h * 0.75), p.nameRight.w - p.imgLeft.x);
	ctx.closePath();
}


const ScoreCanvasPlayers:React.VFC<{}> = () => {
	const props = useStore(s => s.scoreBar);
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const contextRef = useRef<CanvasRenderingContext2D | null>(null);
	const playerL:Player = useStore(s => s.playerL);
	const playerR:Player = useStore(s => s.playerR);
	useEffect(() => {
		const canvas:(HTMLCanvasElement | null) = canvasRef.current;
		canvas!.width = 1000;
		canvas!.height = 80;
		canvas!.style.width = props.w +'px';
		canvas!.style.height= props.h +'px';
		const ctx:(CanvasRenderingContext2D | null) = canvas!.getContext("2d");
		if (ctx) {
			contextRef.current = ctx;
		}
		draw(ctx!, props, playerL, playerR);
	});

	return (
		<canvas id="score-players" ref={canvasRef} ></canvas>
	);
}

export default ScoreCanvasPlayers
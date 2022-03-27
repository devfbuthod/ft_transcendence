import  {useRef, useEffect,} from "react"
import useStore from "../../hooks/useStore";
import "./../GameCanvas.css"

const H:number = 720;
const W:number = 1000;
const placesY = [ 144, 288, 432, 516, 144, 288, 432, 516 ];
const placesX = [ 0, 100, 200, 300, 400, 550, 650, 750, 850];
function drawBonus(ctx:CanvasRenderingContext2D, x: number, y :number) : void {
	ctx.beginPath();
	let gradient = ctx.createRadialGradient(x, y, 0, x, y, 15);
	gradient.addColorStop(0, "rgba(224,255,255, 0)");
	gradient.addColorStop(0.75, "#E0FFFF")
	gradient.addColorStop(1, "white");
	ctx.beginPath();
	ctx.fillStyle = gradient;
	ctx.arc(x, y, 15, 0, Math.PI * 2);
	ctx.fill();
	ctx.closePath();
}
function drawBH(ctx:CanvasRenderingContext2D, bh:string) : void {
	
	for (let i = 0; i < 8; i++) {
		if (bh[i] !== '0'){
			const y = placesY[i];
			const x = placesX[parseInt(bh[i])]
			const gradient = ctx.createRadialGradient(x, y,25,  x, y, 35);
			gradient.addColorStop(0, 'black');
			gradient.addColorStop(1, 'rgba(0,0,0,0)');
			ctx.beginPath();
			ctx.fillStyle = gradient;
			ctx.arc(x, y, 35, 0, Math.PI * 2, true);
			ctx.fill();
			ctx.closePath();
			ctx.closePath();
		}
	}
	
}
	
	const GameCanvasBonus:React.VFC<{}> = () => {
		const h = useStore(s => s.h);
		const w = useStore(s => s.w);
		const BonusLeft = useStore(s => s.BonusLeft);
		const BonusRight = useStore(s => s.BonusRight);
		const bh = useStore(s => s.blackHole);
	
		const canvasRef = useRef<HTMLCanvasElement | null>(null);
		// preserve information that we need between rerender
		const contextRef = useRef<CanvasRenderingContext2D | null>(null);
		//let requestId:number;
		useEffect(() => {
			const canvas:(HTMLCanvasElement | null) = canvasRef.current;
			canvas!.width = W;
			canvas!.height = H;
			canvas!.style.width = w +'px';
			canvas!.style.height= h +'px';
			const ctx:(CanvasRenderingContext2D | null) = canvas!.getContext("2d");
			if (ctx) {
				contextRef.current = ctx;
			}
			if (bh) drawBH(ctx!, bh);
			if (BonusLeft.y >= 0) drawBonus(ctx!, BonusLeft.x , BonusLeft.y);
			if (BonusRight.y >= 0) drawBonus(ctx!, BonusRight.x , BonusRight.y);
		} ); // ajouter le score au rerender
	
	return (
		<canvas id="bonus-layer" ref={canvasRef} ></canvas>
	);}
export default GameCanvasBonus
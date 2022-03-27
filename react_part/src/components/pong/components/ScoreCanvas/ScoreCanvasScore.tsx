import  {useRef, useEffect} from "react"
import useStore,{Score} from "../../hooks/useStore";
import "./../ScoreCanvas.css";

function draw(ctx:CanvasRenderingContext2D, p:Score, scoreL:number, scoreR:number)  {
	
	ctx.clearRect(0,0, p.w, p.h);
	ctx.beginPath()
	ctx.fillStyle = "#374B43"
	ctx.font = `${p.fontSize}px Roboto`;
	ctx.textAlign = 'center';
	ctx.fillText(`${scoreL} - ${scoreR}`, p.score.x + (p.score.w * 0.5), p.score.y + (p.score.h * 0.75), p.score.w -p.imgLeft.x);
	ctx.closePath();
}


const ScoreCanvasScore:React.VFC<{}> = () => {
	const props = useStore(s => s.scoreBar);
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const contextRef = useRef<CanvasRenderingContext2D | null>(null);
	const scoreL = useStore(s => s.left);
	const scoreR = useStore(s => s.right);
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
		draw(ctx!, props, scoreL, scoreR);
	} ); // ajouter le score au rerender


	return (
		<canvas id="score" ref={canvasRef} ></canvas>
	);
}

export default ScoreCanvasScore
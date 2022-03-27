import  {useRef, useEffect} from "react"
import useStore,{Score} from "../../hooks/useStore";
import "./../ScoreCanvas.css";

	function draw(ctx:CanvasRenderingContext2D, p:Score, id: number)  {
	
		ctx.clearRect(0,0, p.w, p.h);
		if (id === 0)
			return;
		const imglink = id === 1 ? process.env.PUBLIC_URL + '5g.png' : id === 2 ? process.env.PUBLIC_URL + 'speed.png': process.env.PUBLIC_URL + 'black-hole.png';
		// // bonus
		let bonus = new Image();
		bonus.onload = function () {
            ctx.drawImage(bonus, p.bonusRight.x, p.bonusRight.y, p.bonusRight.w, p.bonusRight.h);
		}
        bonus.src = imglink;
	}
	
	
	const ScoreCanvasBonusRight:React.VFC<{}> = () => {
		const props = useStore(s => s.scoreBar);
		const bonusType = useStore(s => s.BonusRight.id);
		const canvasRef = useRef<HTMLCanvasElement | null>(null);
		// preserve information that we need between rerender
		const contextRef = useRef<CanvasRenderingContext2D | null>(null);
		//let requestId:number;
		useEffect(() => {
			const canvas:(HTMLCanvasElement | null) = canvasRef.current;
			canvas!.width = props.w;
			canvas!.height = props.h;
			canvas!.style.width = props.w +'px';
			canvas!.style.height= props.h +'px';
			const ctx:(CanvasRenderingContext2D | null) = canvas!.getContext("2d");
			if (ctx) {
				contextRef.current = ctx;
			}
			draw(ctx!, props, bonusType);
		} ); // ajouter le score au rerender
	
	return (
		<canvas id="score-bonus-right" ref={canvasRef} ></canvas>
	);}
export default ScoreCanvasBonusRight
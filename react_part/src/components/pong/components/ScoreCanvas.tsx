import useStore from "../hooks/useStore";
import ScoreCanvasScore from "./ScoreCanvas/ScoreCanvasScore";
import ScoreCanvasPlayers from "./ScoreCanvas/ScoreCanvasPlayers";
import ScoreCanvasBonusRight from "./ScoreCanvas/ScoreCanvasBonusRight";
import ScoreCanvasBonusLeft from "./ScoreCanvas/ScoreCanvasBonusLeft";
import "./ScoreCanvas.css";

// https://stackoverflow.com/questions/3008635/html5-canvas-element-multiple-layers
// https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas
const ScoreBar:React.VFC<{}> = () => {
	const props = useStore(s => s.scoreBar);
 //
	return (
		<div id="score-canvas" style={{width:`${props.w}px`, height:`${props.h}px`}}>
			<ScoreCanvasPlayers />
			<ScoreCanvasScore />
			<ScoreCanvasBonusLeft />
			<ScoreCanvasBonusRight />
		</div>
	);}
export default ScoreBar
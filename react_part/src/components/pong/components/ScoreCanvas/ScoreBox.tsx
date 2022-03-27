import useStore,{Player} from "../../hooks/useStore";
import "./ScoreBox.css";


const ScoreBox:React.VFC<{}> = () => {
    const bonusL = useStore(s => s.BonusLeft.id);
    const bonusR = useStore(s => s.BonusRight.id);
    const playerL:Player = useStore(s => s.playerL);
	const playerR:Player = useStore(s => s.playerR);    

	return (
		<div id="box">
                <img alt="" src={playerL.avatar} className="avatar" style={{}} />
                {bonusL ? <img alt="" src={bonusL === 1 ? process.env.PUBLIC_URL + '5g.png' : bonusL === 2 ? process.env.PUBLIC_URL + 'speed.png': process.env.PUBLIC_URL + 'black-hole.png'} className="bonus" /> : <div className="bonus"></div>}
                {bonusR ? <img alt="" src={bonusR === 1 ? process.env.PUBLIC_URL + '5g.png' : bonusR === 2 ? process.env.PUBLIC_URL + 'speed.png': process.env.PUBLIC_URL + 'black-hole.png'} className="bonus " /> : <div className="bonus"></div>}
                <img alt="" src={playerR.avatar} className="avatar" />
        </div>
	);
}

export default ScoreBox
import { useEffect,  useContext} from "react";
import  {Socket} from 'socket.io-client';
import { GameSocketContext } from "../../../context/gameSocket";
import useStore from './../hooks/useStore'


 const SocketInfosBonus:React.VFC<{}> = () => {
	const socket:Socket = useContext(GameSocketContext);
	const bonusL = useStore(s => s.BonusLeft);
	const bonusR = useStore(s => s.BonusRight);
	const blackHole = useStore(s => s.blackHole)
	const setBonusY = useStore(s => s.setBonusY);
	const setBonusType = useStore(s => s.setBonusType);
	const setBonusBH = useStore(s => s.addBlackHole);

	useEffect(() => {
		socket.on('bonusY', (d) => {
			if (d.yL !== bonusL.y || d.yR !== bonusR.y )
				setBonusY(d.yL, d.yR);
		});
		socket.on('bonusType', (d) => {
			if (d.typeL !== bonusL.id || d.typeR !== bonusR.id)
				setBonusType(d.typeL, d.typeR);
		});
		socket.on('bonusLaunch', (d) => {
			if (d.startL !== bonusL.id || d.startR !== bonusR.id)
				setBonusType(d.startL, d.startR);
		});
		socket.on('bonusBH', (d: string) => {
			if (blackHole !== d)
				setBonusBH(d);
		});
		return (() => {
			socket.off('bonusY');
			socket.off('bonusType');
			socket.off('bonusLaunch');
			socket.off('bonusBH');
		})
	})
	return (null);
 }

export default SocketInfosBonus
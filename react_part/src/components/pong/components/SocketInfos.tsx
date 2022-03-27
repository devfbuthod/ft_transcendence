import { useEffect , useState, useContext} from "react";
import {Socket} from 'socket.io-client';
import { GameSocketContext } from "../../../context/gameSocket";
import useStore from './../hooks/useStore'

type Infos = {
	pOneY: number;
	pTwoY: number;
	ballX: number;
	ballY: number;
}

 const SocketInfos:React.VFC<{}> = () => {
	const socket:Socket = useContext(GameSocketContext);
	const setPosition = useStore( s => s.setNewPos);
	const setScore = useStore(s => s.setScore);
	const [infos, setinfos] = useState<Infos>({
		pOneY: 0,
		pTwoY: 0,
		ballX: 0,
		ballY: 0,
	});


	useEffect(() => {
        socket.on('infos', (d) => {
			setinfos(d);
			setPosition(infos);
		})
		socket.on('sendScore', (d) => {
			setScore(d.scoreL, d.scoreR);
		})
		return (() => {
			socket.off('infos');
			socket.off('sendScore');
		})
	});
	
		return (null);
 }

export default SocketInfos
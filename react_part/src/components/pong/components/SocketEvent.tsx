import {  useContext} from "react";
import  {Socket} from 'socket.io-client';
import useKeyPressCB from "../hooks/UseKeyPressCB";
import { GameSocketContext } from "../../../context/gameSocket";

 const SocketEvent:React.VFC<{}> = () => {
	const socket:Socket = useContext(GameSocketContext);
	useKeyPressCB("ArrowUp", (sendup:boolean) => { socket.emit('up', sendup)});
	useKeyPressCB("ArrowDown", (senddown:boolean) => { socket.emit('down', senddown)});
	useKeyPressCB(" ", (space:boolean) => { socket.emit('space', space)});

	return null
 }

export default SocketEvent
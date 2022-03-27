import React, {useContext, useEffect, useState} from "react";
import { GameSocketContext } from "../../../context/gameSocket";
import {Modal, Button, Image} from 'react-bootstrap';
import {Socket} from 'socket.io-client';
import useStore from '../hooks/useStore';

type FinalInfos = {
	type: string;
	winner: string;
	winnerScore: number;
	loser: string;
	loserScore: number;
}
const PongInfoModal:React.FC = () => {
    const socket:Socket = useContext(GameSocketContext);
	const [show, setShow] = useState<boolean>(false);
	const [infos, setInfos] = useState<FinalInfos>();
	const setGameState = useStore(s => s.setGameStatus);

	useEffect(() => {
		socket.on('GameFinals', (e) => { //   LA OU ON PEUT FOUTRE LE WARNING SI DANS LES OPTIONS
			if (e.type === 'win')
			{
				setInfos(e);
				setShow(true);
			}
			else if (e.type === 'forfait')
			{
				setInfos({type: e.type, loser:e.loser, loserScore: 0, winner: '', winnerScore: 0});
				setShow(true);
			}
		})
        socket.on('resetGameModal', () => setShow(false))
		return (() => {
			socket.off('GameFinals');
            socket.off('resetGameModal');
		})
	})

	const backToSite = () => {
		socket.emit('gameOff');
		setGameState(0);
		setShow(false);
	}
	
	return (
	  <Modal
	  	show={show} 
		size="lg"
		aria-labelledby="contained-modal-title-vcenter"
		centered
	  >
		<Modal.Body style={{alignContent: 'center', margin: '0 auto'}}>
		{infos?.type === 'win' ? <Image src={process.env.PUBLIC_URL + 'crown.png'}/> : <Image src={process.env.PUBLIC_URL + 'accident.png'} />}
		<h2 style={{textAlign:'center'}}>{infos?.type === 'win' ? `${infos.winner} won !!!` : `${infos?.loser} left !!!`}</h2>
		<p style={{textAlign:'center'}}>{infos?.type === 'win' ? `${infos.winner} ${infos.winnerScore} - ${infos.loser} ${infos.loserScore}` : `They lose by forfait.`}</p>

		</Modal.Body>

		<Modal.Footer>
		  <Button onClick={backToSite}>Oki dokie</Button>
		</Modal.Footer>
	  </Modal>
	);
  }

export default PongInfoModal
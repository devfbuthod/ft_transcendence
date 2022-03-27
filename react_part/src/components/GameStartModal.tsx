import React, {useContext, useEffect, useState} from "react";
import { GameSocketContext } from "../context/gameSocket";
import {Modal, Button} from 'react-bootstrap';
import { useHistory } from "react-router-dom";
import {Socket} from 'socket.io-client';
import useStore from './pong/hooks/useStore';
import clearStore from "./pong/components/ClearStore";

const GameStartModal:React.FC = () => {
    const socket:Socket = useContext(GameSocketContext);
	const [gameId, setGameId] =useState<number>(-1);
	const setGameState = useStore(s => s.setGameStatus);
	const gameState = useStore(s => s.gameStatus);
	let history = useHistory();
	const enter = () => {
		clearStore();
		if (gameState === 1)
			socket.emit('ready', gameId);
		if (gameState === 3) {
			socket.emit('readyBonus', gameId)
		}
		setGameState(0);
		socket.emit('reloadStartGame');
		history.push("/home");
	}

	useEffect(() => {
		let isMounted = true;
		if (isMounted) {
		socket.on('inGame', (e) => { //   LA OU ON PEUT FOUTRE LE WARNING SI DANS LES OPTIONS
			setGameId(e);
			setGameState(1);
		});
		socket.on('inGameBonus', (e) => {
			setGameId(e);
			setGameState(3);
		});
		}
		return (() => {
			isMounted = false;
			socket.off('inGame');
			socket.off('inGameBonus')
		})
	})
	return (
	  <Modal
	  	show={gameState === 1 || gameState === 3} 
		size="lg"
		aria-labelledby="contained-modal-title-vcenter"
		centered
	  >
		<Modal.Header closeButton>
		  <Modal.Title id="contained-modal-title-vcenter">
			Enter the Game
		  </Modal.Title>
		</Modal.Header>
		<Modal.Body>
		  <h4>Your game is ready</h4>
		</Modal.Body>

		<Modal.Footer>
		  <Button onClick={enter}>Enter the game</Button>
		</Modal.Footer>
	  </Modal>
	);
  }

export default GameStartModal
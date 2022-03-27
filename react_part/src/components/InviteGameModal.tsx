import React, {useContext, useEffect, useState} from "react";
import { GameSocketContext } from "../context/gameSocket";
import {Modal, Button} from 'react-bootstrap';
import {Socket} from 'socket.io-client';

const InviteGameModal:React.FC = () => {
    const socket:Socket = useContext(GameSocketContext);
	const [opponentId, setOpponentId] = useState<number>();
    const [opponentName, setOpponentName] = useState<string>();
    const [modalShow, setModalShow] = useState<boolean>(false);
	const Okay = () => {
        socket.emit('inviteAnsw', {id:opponentId, resp: 0});
		socket.emit('reloadInvite');
        setModalShow(false);
	}

    const Nope = () => {
        socket.emit('inviteAnsw', {id:opponentId, resp: 1});
		socket.emit('reloadInvite');
        setModalShow(false);
	}

    const NopeButMean = () => {
        socket.emit('inviteAnsw', {id:opponentId, resp: 2});
		socket.emit('reloadInvite');
        setModalShow(false);
	}

	useEffect(() => {
		let isMounted = true;
		if (isMounted) {
		socket.on('invite', (e: {id: number,name:string, modal: boolean}) => { //   LA OU ON PEUT FOUTRE LE WARNING SI DANS LES OPTIONS
			setOpponentId(e.id);
            setOpponentName(e.name);
            setModalShow(e.modal);
		});
		}
		socket.on('inviteRemove', () =>
		{
			setModalShow(false);
		});
		return (() => {
			isMounted = false;
			socket.off('invite');
			socket.off('inviteRemove');
		})
	})
	return (
	  <Modal
	  	show={modalShow} 
		size="lg"
		aria-labelledby="contained-modal-title-vcenter"
		centered
	  >
		<Modal.Header closeButton>
		  <Modal.Title id="contained-modal-title-vcenter">
			You've got your invitation !
		  </Modal.Title>
		</Modal.Header>
		<Modal.Body>
		  {opponentName} invite you to play with them!
		</Modal.Body>

		<Modal.Footer>
		  <Button onClick={Okay}>Accept</Button>
          <Button onClick={Nope}>Decline politely</Button>
          <Button onClick={NopeButMean}>Decline abruptly</Button>
		</Modal.Footer>
	  </Modal>
	);
  }

export default InviteGameModal
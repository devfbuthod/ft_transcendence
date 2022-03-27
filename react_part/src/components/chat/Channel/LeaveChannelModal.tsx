import { useState, useContext } from 'react'
import {Button, Modal} from 'react-bootstrap'
import {SocketContext} from '../../../context/socket'

interface IChannel {
	channel_id: number,
	channel_name: string
    }

function LeaveChannelButton(props: {channel: IChannel, CallBackFunction: () => void })
{
	const socket = useContext(SocketContext);
	const [ShowModal, SetShowModal] = useState(false);

	const onHide = () => {SetShowModal(false)};

	const Leave = () => {
		socket.emit('channel-leave', {channelId: props.channel.channel_id}); 
		props.CallBackFunction()
		onHide(); }

	return (
	<div style={{display: 'inline'}}>
		<Button className="ButtonCreate bg-primary" onClick={() => { SetShowModal(true) }}>
			Leave Channel
		</Button>
		<Modal
		show={ShowModal}
		onHide={() => SetShowModal(false)}
		size="lg"
		aria-labelledby="contained-modal-title-vcenter"
		centered
		>
		<Modal.Header closeButton>
		<Modal.Title id="contained-modal-title-vcenter">
			Are you sure you want to leave {props.channel.channel_name} ?
		</Modal.Title>
		</Modal.Header>
		<Modal.Footer>
		<Button variant="primary" onClick={Leave} >
			Yes
		</Button>
		<Button variant="secondary" onClick={onHide}>
			No
		</Button>
		</Modal.Footer>
		</Modal>
	</div>
	)
}

export default LeaveChannelButton;
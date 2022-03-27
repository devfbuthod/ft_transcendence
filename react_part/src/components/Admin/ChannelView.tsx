import React, { useContext, useEffect, useState } from 'react'
import {Col, Row, Form, Button, Image, Modal} from 'react-bootstrap'
import { ContextMenuTrigger, ContextMenu, MenuItem } from 'react-contextmenu';
import { socket, SocketContext } from '../../context/socket';
import { ListChannelMessage } from '../chat/Channel/ChatChannel';
import {IMyChannel, IOtherChannel} from '../chat/Channel/ListChannel'
import {IMessage, IUser} from '../chat/ChatInterface'
import Cross from "../pictures/cross.svg"

interface IChannel
{
	channel_id: number,
	channel_name: string,
}

type backdrop_type = boolean | "static" | undefined

interface IPropsModal {
	show: boolean,
	onHide: () => void,
	backdrop: backdrop_type,
	channelSelected: IChannel | undefined,
	setChannelSelected: Function,
	reloadChannelList: number,
	setReloadChannelList: Function,
}

function ModalDestroyChannel(props: IPropsModal)
{
	let socket = useContext(SocketContext);

	function SubmitForm(event: any)
	{
		event.preventDefault();
		if (props.channelSelected !== undefined)
		{
			socket.emit("channel-destroy", {channelId: props.channelSelected.channel_id});
		}
		props.setChannelSelected(undefined);
		onHide();
		setTimeout(props.setReloadChannelList, 200, [props.reloadChannelList + 1])
	}

	function onHide(){
		props.onHide();
	}

	return(
		<Modal
		show = {props.show}
		onHide = {props.onHide}
		backdrop = {props.backdrop}

		size="lg"
		aria-labelledby="contained-modal-title-vcenter"
		centered
		>
		<Modal.Header closeButton>
			<Modal.Title id="contained-modal-title-vcenter">
			{ props.channelSelected !== undefined &&
			`Are you sure you want to destroy ${props.channelSelected.channel_name}?`}
			</Modal.Title>
		</Modal.Header>
		<Modal.Footer>
			<Button variant="primary" onClick={SubmitForm}>
				Confirm
			</Button>
			<Button variant="secondary" onClick={onHide}>
				Cancel
			</Button>
		</Modal.Footer>
		</Modal>
	)
}

function ListChannel(props: {channelSelected: IChannel | undefined, setChannelSelected: Function})
{
	let socket = useContext(SocketContext);
	const [ListChannel, setListChannel] = useState<IChannel[]>([]);
	const [MyChannels, setMyChannels] = useState<IChannel[]>([]);
	const [OtherChannels, setOtherChannels] = useState<IChannel[]>([]);

	const [ShowModal, setShowModal] = useState(false);
	const onHide = () => {setShowModal(false);}
	const [reloadChannelList, setReloadChannelList] = useState<number>(0);

	useEffect(() => {
		socket.emit('ask-reload-channel');
		socket.on('channel-need-reload', () => setReloadChannelList(reloadChannelList + 1));
		return(() => {socket.off('channel-need-reload')});
	}, [reloadChannelList, socket])

	useEffect(() => {

	}, [socket])


	useEffect(() => {
		setListChannel(MyChannels.concat(OtherChannels));
		socket.on('channels-user-in', (data: IMyChannel[]) => {
			setMyChannels(data.map((Mychannel) => {
				let newChannel: IChannel = {channel_id: Mychannel.channel_id, channel_name: Mychannel.channel_name};
				return(newChannel);
			}));
		});
		socket.on('channels-user-out', (data: IOtherChannel[]) => {
			setOtherChannels(data.map((Otherchannel) => {
				let newChannel: IChannel = {channel_id: Otherchannel.channel_id, channel_name: Otherchannel.channel_name};
				return(newChannel);
			}));
		});

		return(() => {
			socket.off('channels-user-in');
			socket.off('channels-user-out');
		})
	}, [socket, MyChannels, OtherChannels, ])

	return (
		<Row>
			<Col xs={10} md={10} lg={10}>
			<Form>
			<Form.Select aria-label="Change Status Site"
				onChange={(e: any) => {
					props.setChannelSelected(ListChannel.find(element => {return(element.channel_id === Number(e.target.value))}))
				}}
				>
				<option value={undefined}> Select Channel </option>
				{ListChannel.map((Channel) => {return(
					<option key={`optionListChannel-${Channel.channel_id}`} value={Channel.channel_id}> {Channel.channel_name} </option>
					)})}
			</Form.Select>
			</Form>
			</Col>
			<Col>
				{props.channelSelected !== undefined &&
					<Image src={Cross} style={{height:"2em", margin: "0.3em"}} alt="redcross" onClick={() => setShowModal(true)}/>
				}
			</Col>
			<ModalDestroyChannel
			show={ShowModal}
			onHide={onHide}
			backdrop="static"
			channelSelected={props.channelSelected}
			setChannelSelected={props.setChannelSelected}
			reloadChannelList={reloadChannelList}
			setReloadChannelList={setReloadChannelList}
			/>
		</Row>
	)
}

function Messages(props: {channelSelected: IChannel | undefined})
{
	const [ListMessage, setListMessage] = useState<IMessage[]>([]);

	useEffect(() => {
		if (props.channelSelected === undefined)
			setListMessage([]);
	}, [props.channelSelected])

	useEffect(() => {
		socket.on('channel-message-list', (data: IMessage[]) => {setListMessage(data)});

		return(() => {socket.off('channel-message-list');})
	}, [])

	useEffect(() => {
		socket.on('channel-new-message', (new_message: IMessage) => {
			const buffer = [...ListMessage];
			buffer.push(new_message);
			setListMessage(buffer);
		})
		return(() => {socket.off('channel-new-message');})
	}, [ListMessage])

	return (
		<div>
			Messages
			<ListChannelMessage ListMessage={ListMessage}/>
		</div>
	)
}

function UserButton(props: {user: IUser, channel: IChannel})
{
	return(
		<div>
		<ContextMenuTrigger id={`ContextMenuAdminViewUser_${props.user.user_id}`}>
			<Button variant="primary" key={`user-ChannelView-${props.user.user_id}`} style={{margin: "0.5em"}}>
				{props.user.user_nickname}
			</Button>
		</ContextMenuTrigger>

		{props.user.role !== 'Owner' &&
			<ContextMenu id={`ContextMenuAdminViewUser_${props.user.user_id}`}>
			{
				props.user.role === 'User' ?
				<MenuItem onClick={() => {socket.emit("channel-admin-site-moderator",
					{channelId: props.channel.channel_id,
					participantId: props.user.user_id,
					action: 'Set'})}}>
					Promote to Admin
				</MenuItem>
				: props.user.role === 'Admin' ?
				<MenuItem onClick={() => {socket.emit("channel-admin-site-moderator",
					{channelId: props.channel.channel_id,
					participantId: props.user.user_id,
					action: 'Unset'})}}>
					Demote to User
				</MenuItem>
				:
				<div></div>
			}
			</ContextMenu>
			}
		</div>
	)
}

function ListUsers(props: {channelSelected: IChannel | undefined})
{
	const [ListUser, setListUser] = useState<IUser[]>([]);
	let CurrentChannel : IChannel;
	if (props.channelSelected !== undefined)
		CurrentChannel = props.channelSelected;
	useEffect(() => {
		socket.on('channel-users', (data: IUser[]) => {setListUser(data);});

		return(() => {socket.off('channel-users');});
	}, [])

	return (
		<Row>
			List Users
			{props.channelSelected !== undefined &&
				ListUser.map((user: IUser) =>{return(
				<UserButton
				key={`UserAdminView${user.user_id}`}
				user={user}
				channel={CurrentChannel}/>
			)})}
		</Row>
	)
}

export default function ChannelView()
{
	const [channelSelected, setChannelSelected] = useState<IChannel | undefined>(undefined);

	useEffect(() => {
		const CurrentChannel = channelSelected;
		if (channelSelected !== undefined)
			socket.emit('channel-load', channelSelected.channel_id);
		return(() => {
			if (CurrentChannel !== undefined)
				socket.emit('channel-unload', CurrentChannel.channel_id);});
	}, [channelSelected])

	return (
		<div>
			<Row>
				Channel Selected :
				<ListChannel channelSelected={channelSelected} setChannelSelected={setChannelSelected}/>
			</Row>
			<Row>
				<Col lg={8}>
					<Messages channelSelected={channelSelected} />
				</Col>
				<Col>
					<ListUsers channelSelected={channelSelected} />
				</Col>
			</Row>
		</div>
	)
}
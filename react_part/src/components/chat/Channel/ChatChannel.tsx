import {IMessage, Message, IUser} from '../ChatInterface'
import {DataContext, Data} from '../../../App'
import 'bootstrap/dist/css/bootstrap.min.css'
import { Form, Button, Row, Col, Image, } from 'react-bootstrap'
import 'bootstrap/dist/css/bootstrap.min.css'
import React, {useState, useContext, useEffect, useRef} from 'react'
import {SocketContext} from '../../../context/socket'
import '../ChatInterface.css'
import {IChannel, } from '../../web_pages/UserPart'
import ListChannelUser from './ListUserChannel'
import ParametersChannel from './ParametersChannel'
import ParametersIcon from '../../pictures/parameters-icon.png'
import axios from 'axios'
import { IBlockedUser } from '../../members/ListBlockedUsers'

export function ListChannelMessage(props: {ListMessage: IMessage[]}) {

	const messagesEndRef = useRef<null | HTMLDivElement>(null)
	const userData = useContext(DataContext);

	useEffect(() => {
		//console.log("list message in ChatMessages: ");
		//console.log(props.ListMessage);
		scrollToBottom();
	}, [props.ListMessage])

	const scrollToBottom = () => {
		if (messagesEndRef.current !== null && messagesEndRef.current.id === 'bottomchatmessage')
	  		messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: 'end', inline: 'nearest' })
	}

    return (
        <div className="overflow-auto" style={{height: '38em', border:'1px solid black',}}>
		{props.ListMessage.map((message) => <Message
			key={`message_${message.message_channelId}_${message.message_id}`}
			message={message}
			userData={userData}/>)}
		<div id="bottomchatmessage" ref={messagesEndRef} />
        </div>
    )
}

function FormMessageChannel(props: {channelSelected: IChannel, ListUsers: IUser[], userData: Data})
{
	const socket = useContext(SocketContext);
	const [messageForm, SetMessageForm] = useState<string>("");

	useEffect(() => {
		return (() => {SetMessageForm("");});
	}, [])

	const ChangeMsg = (e: React.ChangeEvent<HTMLInputElement>) => { SetMessageForm(e.currentTarget.value);}

   	 //Form management
    	const handleSubmit = (event: any) => {
		event.preventDefault();
		if (messageForm === "")
		{
			event.stopPropagation();
			return ;
		}
		socket.emit('channel-message', {channelId: props.channelSelected.channel_id, message: messageForm});
		//console.log(`channel ${channelSelected.channel_name} send : ${message}`);
		SetMessageForm("");
	}

	return (
		<Form className="FormSendMessage justify-content-center" style={{padding:"0px", paddingTop:"0.8em"}}>
			<Form.Control type="text" value={messageForm} placeholder="Message" onChange={ChangeMsg}/>
			{
				props.ListUsers.find((element) => element.user_id === props.userData.id) !== undefined
				&& props.ListUsers.find((element) => element.user_id === props.userData.id)?.status !== 'Mute'
				?	<Button type="submit" onClick={handleSubmit}> Send </Button>
				:	<Button type="submit" variant="danger" disabled> Send </Button>
			}
		</Form>
	)
}

export function ChatChannel(channelSelected: IChannel)
{
	const socket = useContext(SocketContext);
	const userData = useContext(DataContext);
	const [ListUsers, SetListUsers] = useState<IUser[]>([]);
	// list of all messages including the blocked messages
	const [ListAllMessage, SetListAllMessage] = useState<IMessage[]>([]);
	// list message shown to user
	const [ListShownMessage, SetListShownMessage] = useState<IMessage[]>([]);
	// list blocked user
	const [BlockedUsers, SetBlockedUsers] = useState<IBlockedUser[]>([]);
	// state asking to reload list of blocked users
	const [ReloadBlockedUserlist, SetReloadBlockedUserlist] = useState<number>(0);

	//get list blocked at the mount of the component + start listening socket
	useEffect(() => {
		let isMounted = true;
		axios.get('http://' + process.env.REACT_APP_DOMAIN_BACKEND + '/relationship/me/list?status=block', {withCredentials: true,})
		.then(res => { if(isMounted)
			SetBlockedUsers(res.data);
		})
		.catch(res => { if (isMounted)
			console.log("error on getting data blocked users");
		})

		socket.on("reload-block", () => {SetReloadBlockedUserlist(ReloadBlockedUserlist + 1); });

		return (() => { socket.off("reload-block"); isMounted = false; });
	}, [ReloadBlockedUserlist, socket]);

	// load to the channel then get list user and message of the channel
	useEffect(() => {
		socket.emit('channel-load', channelSelected.channel_id);
	        socket.on('channel-users', (data: IUser[]) => { SetListUsers(data); });
	        socket.on('channel-message-list', (data: IMessage[]) => {
			let newlist: IMessage[] = [];
			for (const message of data)
			{
				if (BlockedUsers.find((user) => user.user_id === message.message_authorId) === undefined)
					newlist.push(message);
			}
			SetListAllMessage(data);
			SetListShownMessage(newlist);
		});

		return (() => {
			//console.log(`channel-unload: ${channelSelected.channel_id}`);
			socket.emit('channel-unload', channelSelected.channel_id);
			socket.off('channel-users');
			socket.off('channel-message-list');
			})
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [socket, channelSelected])

	// change list message if list blocked users change
	useEffect(() => {
		let newlist: IMessage[] = [];
		for (const message of ListAllMessage)
		{
			if (BlockedUsers.find((user) => user.user_id === message.message_authorId) === undefined)
				newlist.push(message);
		}
		SetListShownMessage(newlist);
	}, [BlockedUsers, ListAllMessage])

	//add a new message to the chat if user is not blocked
	useEffect(() => {
		socket.on('channel-new-message', (new_message: IMessage) => {
			if (BlockedUsers.find((user) => user.user_id === new_message.message_authorId) === undefined)
			{
				const buffer = [...ListShownMessage];
				buffer.push(new_message);
				SetListShownMessage(buffer);
			}
			ListAllMessage.push(new_message);
		})
		return (() => {socket.off('channel-new-message');});

	}, [ListShownMessage, BlockedUsers, ListAllMessage, socket])

	return (
	<Row className="TitleChannel">
		{channelSelected !== undefined ?
			<ParametersChannel {...channelSelected} />
		: <div></div>}
		<Col lg={8}>
			<ListChannelMessage ListMessage={ListShownMessage}/>
			<FormMessageChannel channelSelected={channelSelected} ListUsers={ListUsers} userData={userData} />
		</Col>
		<Col>
			<ListChannelUser ListUsers={ListUsers} myrole={channelSelected.role} channelId={channelSelected.channel_id}/>
		</Col>
	</Row>)
}

export function ChatChannelDisabled()
{
	//const socket = useContext(SocketContext);

	return (
	<Row className="TitleChannel">
		<Row>
			<Col>
				<h2> </h2>
				<Image className="iconParameters" roundedCircle src={ParametersIcon} />
			</Col>
		</Row>
		<Col lg={8}>
			<ListChannelMessage ListMessage={[]}/>
			<Form className="FormSendMessage justify-content-center" style={{padding:"0px", paddingTop:"0.8em"}}>
				<Form.Control type="name" placeholder="Message" />
				<Button type="submit" variant="danger" disabled> Send </Button>
			</Form>
		</Col>
		<Col style={{height:"60em"}}>
			<div style={{height:"40em"}}> list channel participants</div>
		</Col>
	</Row>);
}
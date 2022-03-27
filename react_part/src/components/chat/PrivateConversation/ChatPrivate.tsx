
import { useEffect, useContext, useState, useRef } from 'react'
import {Form, Button} from 'react-bootstrap'
import { SocketContext } from '../../../context/socket'
import { DataContext, Data } from '../../../App'
import { IUserConversation } from '../../web_pages/UserPart'
import {IMessage, Message} from '../ChatInterface'
import './ChatPrivate.css'


interface IUser {
	channel_id: number,
	user_id: number,
	user_name: string,
	user_avatar: string,
}

function ListConversationMessage(props: {ListMessage: IMessage[]}) {

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

function FormMessageConversation(props: {OtherUser: IUser, userData: Data, socket: any})
{
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
		props.socket.emit('private-message', {channelId: props.OtherUser.channel_id, message: messageForm});
		//console.log(`channel ${channelSelected.channel_name} send : ${message}`);
		SetMessageForm("");
	}

	return (
		<Form className="FormSendMessage justify-content-center" style={{padding:"0px", paddingTop:"0.8em"}}>
			<Form.Control type="text" value={messageForm} placeholder="Message" onChange={ChangeMsg}/>
			{
				<Button type="submit" onClick={handleSubmit}> Send </Button>
			}
		</Form>
	)
}

export function ChatPrivate(props : {privateSelected: IUserConversation})
{
	const socket = useContext(SocketContext);
	const [listMessage, setListMessage] = useState<IMessage[]>([]);
	const [OtherUser, setOtherUser] = useState<IUser>({channel_id: 0, user_id: 0, user_name: "undefined", user_avatar: ""})
	const userData = useContext(DataContext);

	useEffect(() => {
		socket.emit('private-load', {userId: props.privateSelected.user_id});
		socket.on('private-message-list', (list: IMessage[]) => {setListMessage(list);});
		socket.on('private-info', (user: IUser) => {setOtherUser(user);});
		return (() => {
			socket.emit('private-unload', {channelId: OtherUser.channel_id});
			socket.off('private-message-list');
			socket.off('private-info');
		});
	}, [socket, props.privateSelected, OtherUser.channel_id])

	useEffect(() => {
		socket.on('private-new-message', (new_message: IMessage) => {
			const buffer = [...listMessage];
			buffer.push(new_message);
			setListMessage(buffer);
		})
		return(() => {socket.off('private-new-message');});
	}, [listMessage, socket])

	return (
		<div>
			<div className="OtherUser">
					{OtherUser.user_name}
			</div>
			<div className="ChatPrivate">
				<ListConversationMessage ListMessage={listMessage}/>
			</div>
			<FormMessageConversation OtherUser={OtherUser} userData={userData} socket={socket} />
		</div>
	)
}

export function ChatPrivateDisabled()
{
	const socket = useContext(SocketContext);
	const userData = useContext(DataContext);

	return (
		<div>
			<div className="OtherUser">
					Chat
			</div>
			<div className="ChatPrivate">
				<ListConversationMessage ListMessage={[]}/>
			</div>
			<FormMessageConversation
				OtherUser={{channel_id: 0, user_id: 0, user_name: "undefined", user_avatar: ""}}
				userData={userData} socket={socket} />
		</div>
	)
}
import axios from 'axios';
import React, { useContext, useEffect, useState } from 'react'
import {Row, Button, Col} from 'react-bootstrap'
import { SocketContext } from '../../../context/socket'
import { IUserConversation } from '../../web_pages/UserPart';
import './ListPrivateConversation.css'
import {IBlockedUser} from '../../members/ListBlockedUsers'

interface IConversation {
	channel_id: number,
	user_id: number,
	user_name: string,
	user_avatar: string,
}

function ButtonPrivateConversation(props: {Conversation: IConversation, setUserConversationSelected: any})
{
	return (
		<Button
		key={`PrivateConversation-${props.Conversation.user_id}`}
		className="ButtonConversation"
		onClick={() => props.setUserConversationSelected({user_id: props.Conversation.user_id})}>
			{props.Conversation.user_name}

		</Button>
	)
}

export default function ListPrivateConversation(props: {
	UserConversationSelected: IUserConversation | undefined,
	setUserConversationSelected: React.Dispatch<React.SetStateAction<IUserConversation | undefined>>,
	BlockedUsers : IBlockedUser[]})
{
	let socket = useContext(SocketContext);
	let userSelected = props.UserConversationSelected;
	let setUserSelected = props.setUserConversationSelected;
	const [PrivateConversation, setPrivateConversation] = useState<IConversation[]>([]);
	const [AllPrivateConversation, setAllPrivateConversation] = useState<IConversation[]>([]);
	const [ListBlockedBy, setListBlockedBy] = useState<number[]>([]);
	const [ReloadBlockedBy, setReloadBlockedBy] = useState<number>(0);

	useEffect(() => {
		socket.emit("private-ask-reload");
	}, [socket])

	useEffect(() => {
		let isMounted = true;

		socket.on("reload-blockedby", () => {setReloadBlockedBy(ReloadBlockedBy + 1);})
		axios.get('http://' + process.env.REACT_APP_DOMAIN_BACKEND + '/relationship/me/blocked', {withCredentials: true,})
		.then(res => {
			if (isMounted)
			{
				setListBlockedBy(res.data);
				if (res.data.find((user_id: number) => userSelected !== undefined && user_id === userSelected.user_id) !== undefined)
				{
					setUserSelected(undefined);
				}
			}
		})
		.catch(res => {
			if (isMounted)
				console.log(res)})

		return(() => {
			socket.off("reload-blockedby");
			isMounted = false;
		})
	}, [ReloadBlockedBy, socket, setUserSelected, userSelected])

	useEffect(() => {
		socket.on("private-list", (list: IConversation[]) => { setAllPrivateConversation(list);});
		return (() => {socket.off("private-list");});
	}, [AllPrivateConversation, socket])

	useEffect(() => {
		const newlist : IConversation[] = [];
		for (const conversation of AllPrivateConversation)
		{
			if (props.BlockedUsers.find((blockedUser) => blockedUser.user_id === conversation.user_id) === undefined
			&& ListBlockedBy.find((user_id) => user_id === conversation.user_id) === undefined)
			{
				newlist.push(conversation);
			}
		}
		setPrivateConversation(newlist);
	}, [socket, AllPrivateConversation, props.BlockedUsers, ListBlockedBy])

	return (
	<Row className="ScrollingListPrivate">
		<Col style={{overflow: 'auto', marginBottom: '20px'}} lg={6}>
		{ PrivateConversation.length !== 0
		?	PrivateConversation.map((Conversation) => ButtonPrivateConversation({Conversation: Conversation, setUserConversationSelected: props.setUserConversationSelected}))
		:	<div></div>
		}
		</Col>
	</Row>
	)
}

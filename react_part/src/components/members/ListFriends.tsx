import { useState, useEffect, useContext } from "react";
import {SwitchContext} from '../web_pages/UserPart';
import { socket } from "../../context/socket";
import {Image, Col, Row} from 'react-bootstrap';
import axios from 'axios';
import "./ListFriends.css";
import './members.css';
import status from './Status';
import { ContextMenu, MenuItem, ContextMenuTrigger } from "react-contextmenu";
import {Block, InvitateToGame, SpectateGame, Unfriend} from './ContextMenuFunctions';
import { SiteStatus } from "../../App";
import { useHistory } from "react-router";
import { gameSocket } from "../../context/gameSocket";

interface IFriend {
	user_id: number;
	user_nickname: string;
	user_avatar: string;
	user_userStatus: StatusType,
	user_siteStatus: SiteStatus,
}

type StatusType = 'Available' | 'Playing' | 'Offline';



export default function ListFriends()
{
	function ContextMenuFriend(props: {Friend: IFriend})
	{
		return (
		<ContextMenu id={`ContextMenuFriend_${props.Friend.user_id}`}>

			{ props.Friend.user_userStatus === 'Available' &&
			<MenuItem onClick={() => InvitateToGame(props.Friend.user_id, gameSocket)}>
				Invite to game
			</MenuItem>}

			{ props.Friend.user_userStatus === 'Playing' &&
			<MenuItem onClick={() => SpectateGame(props.Friend.user_id, gameSocket)}>
				Spectate Game
			</MenuItem>}

			<MenuItem onClick={() => SwitchPrivateConversation(props.Friend.user_id)}>
				Send a message
			</MenuItem>

			<MenuItem onClick={() => history.push(`/profile/${props.Friend.user_id}`)}>
				View Profile
			</MenuItem>

			<MenuItem onClick={() => Unfriend(props.Friend.user_id)} >
				Unfriend
			</MenuItem>

			<MenuItem onClick={() => Block(props.Friend.user_id)}>
				Block
			</MenuItem>
		</ContextMenu>
		)
	}

	function Friend(props: {Friend: IFriend})
		{
			return (
				<div key={`Friend_${props.Friend.user_id}`}>
				<ContextMenuTrigger id={`ContextMenuFriend_${props.Friend.user_id}`}>
				<div key={`Friend_${props.Friend.user_id}`} className="Friend UserButton">
				<Row>
					<Col lg={3} className="position-relative">
						<Image src={props.Friend.user_avatar} className="PictureUser" alt="picture" rounded fluid/>
						{status(props.Friend.user_userStatus)}
					</Col>
					<Col lg={5}>
						<div style={{margin:"1em"}}> {props.Friend.user_nickname} </div>
					</Col>
				</Row>
				</div>
				</ContextMenuTrigger>
				<ContextMenuFriend Friend={props.Friend} />
				</div>
			)
		}

	const [Friends, SetFriends] = useState<IFriend[]>([]);
	const [Reload, setReload] = useState(0);
	const [ReloadStatus, SetReloadStatus] = useState<{user_id: number, status: StatusType}>({user_id: 0, status: 'Available'});
	const [RefreshVar, SetRefreshVar] = useState<boolean>(false);
	let history = useHistory();
	const SwitchPrivateConversation = useContext(SwitchContext);

	//get list of friends at the mount of the component + start listening socket
	useEffect(() => {
		let isMounted = true;
		axios.get('http://' + process.env.REACT_APP_DOMAIN_BACKEND + '/relationship/me/list?status=friend', {withCredentials: true,})
		.then(res => { if (isMounted)
			SetFriends(res.data);
		})
		.catch(res => { if (isMounted) {
            if (res.response !== undefined && res.response.data.message === "User is banned by the site.")
            {
                window.location.reload();
				console.log(res.response.data);
            }
        }
		})

		socket.on('reload-status', (data: {user_id: number, status: StatusType}) => {SetReloadStatus(data)});
		
		gameSocket.on('reload-status', (data: {user_id: number, status: StatusType}) => {SetReloadStatus(data)});

		socket.on("reload-users", () => {
			setReload(Reload + 1);
		})
		return (() => {socket.off("reload-users"); gameSocket.off("reload-status"); socket.off("reload-status");  isMounted = false;});
	}, [Reload])

	//actualize the status
	useEffect(() => {
		if (ReloadStatus.user_id !== 0)
		{
			const friend = Friends.find(element => element.user_id === ReloadStatus.user_id)
			if (friend !== undefined)
			{
				friend.user_userStatus = ReloadStatus.status;
				SetRefreshVar(!RefreshVar);
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ReloadStatus])

    return (
		<div className="ScrollingListMemebers">
			{Friends.map((friend: IFriend) => <Friend Friend={friend} key={`Friend_${friend.user_id}`} />)}
		</div>
	)
}
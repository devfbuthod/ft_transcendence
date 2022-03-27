import { useState, useEffect, useContext} from "react"
import { ContextMenu, MenuItem, ContextMenuTrigger } from "react-contextmenu";
import {Image, Col, Row} from 'react-bootstrap'
import {useHistory} from "react-router-dom"
import axios from 'axios'
import { gameSocket } from "../../context/gameSocket";
import { socket } from "../../context/socket";
import { SwitchContext } from "../web_pages/UserPart";
import status from './Status'
import {SiteStatus} from "../../App"
import {Unfriend, Askfriend, Block, InvitateToGame, SpectateGame } from "./ContextMenuFunctions";
import './members.css'
import "./ListUsers.css"

interface IUser {
	id: number;
	nickname: string;
	avatar: string;
	userStatus: 'Available' | 'Playing' | 'Offline';
	relationship: null | 'Friend' | 'Block' | 'Not confirmed';
	user_siteStatus: SiteStatus;
}

type StatusType = 'Available' | 'Playing' | 'Offline';

export default function ListUsers()
{
	function ContextMenuUser(props: {User: IUser})
	{
		//console.log(`${props.User.nickname} : ${props.User.relationship}`)

		return (
		<ContextMenu id={`ContextMenuUser_${props.User.id}`}>
			<div>
			<MenuItem onClick={() => {SwitchToPrivate(props.User.id)}}>
				Send a message
			</MenuItem>
			</div>
			<MenuItem onClick={() => history.push(`/profile/${props.User.id}`)}>
				View Profile
			</MenuItem>
            { props.User.userStatus === 'Available' &&
			<MenuItem onClick={() => InvitateToGame(props.User.id, gameSocket)}>
				Invite to game
			</MenuItem>}

			{ props.User.userStatus === 'Playing' &&
			<MenuItem onClick={() => SpectateGame(props.User.id, gameSocket)}>
				Spectate Game
			</MenuItem>}
			{ props.User.relationship !== 'Friend' &&
			<MenuItem onClick={() => Askfriend(props.User.id)}>
				Add Friend
			</MenuItem>}

			{ props.User.relationship === 'Friend' &&
			<MenuItem onClick={() => Unfriend(props.User.id)}>
				Unfriend
			</MenuItem>}

			<MenuItem onClick={() => Block(props.User.id)}>
				Block
			</MenuItem>

		</ContextMenu>
		)
	}

	function User(User: IUser)
	{
		return (
			<div key={`User_${User.id}`}>
			<ContextMenuTrigger id={`ContextMenuUser_${User.id}`}>
			<div className="User UserButton">
				<Row>
					<Col lg={3} className="position-relative">
						<Image src={User.avatar} className="PictureUser" alt="picture" fluid/>
						{status(User.userStatus)}
					</Col>
					<Col lg={5}>
						<div style={{margin:"1em"}}> {User.nickname} </div>
					</Col>
				</Row>
			</div>
			</ContextMenuTrigger>
			<ContextMenuUser User={User}/>

			</div>
		)
		//console.log(`User : ${User}`)
	}

	const [Users, SetUsers] = useState<IUser[]>([]);
	const [Reload, setReload] = useState(0);
	const [ReloadStatus, SetReloadStatus] = useState<{user_id: number, status: StatusType}>({user_id: 0, status: 'Available'});
	const [RefreshVar, SetRefreshVar] = useState<boolean>(false);
	let history = useHistory();
	const SwitchToPrivate = useContext(SwitchContext);

	useEffect(() => {
		let isMounted = true;
		axios.get('http://' + process.env.REACT_APP_DOMAIN_BACKEND + '/relationship/me/allusers', {withCredentials: true,})
		.then(res => { if (isMounted)
			SetUsers(res.data);
		})
		.catch(res => { if (isMounted)
			console.log("error");
		})
		socket.on('reload-status', (data: {user_id: number, status: StatusType}) => {SetReloadStatus(data)});
		gameSocket.on('reload-status', (data: {user_id: number, status: StatusType}) => {SetReloadStatus(data)});

		socket.on('reload-users', () => {
			setReload(Reload + 1)
		});
		return (() => {socket.off('reload-status'); gameSocket.off('reload-status');socket.off('reload-users'); isMounted = false;});
		//console.log(Users);
	}, [Reload]);

	//actualize the status
	useEffect(() => {
		if (ReloadStatus.user_id !== 0)
		{
			const user = Users.find(element => element.id === ReloadStatus.user_id)
			if (user !== undefined)
			{
				user.userStatus = ReloadStatus.status;
				SetRefreshVar(!RefreshVar);
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ReloadStatus])

	return (
		<div className="ScrollingListMembers">
			{Users.map(User)}
			{/*<Button onClick={() => SetReloadUserlist(!ReloadUserlist)}> Reload Users
			</Button>*/}
		</div>
	)
}
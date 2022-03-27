import { useState, useEffect } from "react"
import { socket } from "../../context/socket";
import { gameSocket } from '../../context/gameSocket';
import {Image, Col, Row} from 'react-bootstrap'
import axios from 'axios'
import "./ListBlockedUsers.css"
import './members.css'
import status from './Status'
import { ContextMenu, MenuItem, ContextMenuTrigger } from "react-contextmenu";
import {Unblock} from './ContextMenuFunctions'
import {SiteStatus} from "../../App"
import { useHistory } from "react-router";

export interface IBlockedUser {
	user_id: number;
	user_nickname: string;
	user_avatar: string;
	user_userStatus: StatusType;
	user_siteStatus: SiteStatus;
}

type StatusType = 'Available' | 'Playing' | 'Offline';

export default function ListBlockedUsers()
{
	function ContextMenuBlockedUser(props: {user_id: number})
	{
		return (
		<ContextMenu id={`ContextMenuBlockedUser_${props.user_id}`}>
			<MenuItem onClick={() => history.push(`/profile/${props.user_id}`)}>
				View Profile
			</MenuItem>
			<MenuItem onClick={() => Unblock(props.user_id)} >
				Unblock
			</MenuItem>
		</ContextMenu>
		)
	}

	function BlockedUser(BlockedUser: IBlockedUser)
	{
			return (
				<div key={`BlockedUser_${BlockedUser.user_id}`}>
				<ContextMenuTrigger id={`ContextMenuBlockedUser_${BlockedUser.user_id}`}>
				<div className="BlockedUser UserButton">
				<Row>
					<Col lg={3} className="position-relative">
						<Image src={BlockedUser.user_avatar} className="PictureUser" alt="picture" rounded fluid/>
						{status(BlockedUser.user_userStatus)}
					</Col>
					<Col lg={5}>
						<div style={{margin:"1em"}}> {BlockedUser.user_nickname} </div>
					</Col>
				</Row>
				</div>
				</ContextMenuTrigger>
				<ContextMenuBlockedUser user_id={BlockedUser.user_id}/>

				</div>
			)
			//console.log(`BlockedUser : ${BlockedUser}`)
	}

	const [RefreshVar, SetRefreshVar] = useState<boolean>(false);
	const [BlockedUsers, SetBlockedUsers] = useState<IBlockedUser[]>([]);
	//const [ReloadBlockedUserlist, SetReloadBlockedUserlist] = useState<{user_id1: number, user_id2: number}>({user_id1: 0, user_id2: 0});
	const [Reload, setReload] = useState(0);
	const [ReloadStatus, SetReloadStatus] = useState<{user_id: number, status: StatusType}>({user_id: 0, status: 'Available'});
	//const userData = useContext(DataContext);
	let history = useHistory();

	//get list blocked at the mount of the component + start listening socket
	useEffect(() => {
		let isMounted = true;
		axios.get('http://' + process.env.REACT_APP_DOMAIN_BACKEND + '/relationship/me/list?status=block', {withCredentials: true,})
		.then(res => { if(isMounted)
			SetBlockedUsers(res.data);
		})
		.catch(res => { if (isMounted)
			console.log("error");
		})

		socket.on('reload-status', (data: {user_id: number, status: StatusType}) => {SetReloadStatus(data)});
		gameSocket.on('reload-status', (data: {user_id: number, status: StatusType}) => {SetReloadStatus(data)});

		socket.on("reload-users", () => { setReload(Reload + 1); });

		return (() => {socket.off('reload-status'); gameSocket.off('reload-status'); socket.off('reload-users'); isMounted = false;});
	}, [Reload]);

	//actualize the status
	useEffect(() => {
		if (ReloadStatus.user_id !== 0)
		{
			const blocked = BlockedUsers.find(element => element.user_id === ReloadStatus.user_id)
			if (blocked !== undefined)
			{
				blocked.user_userStatus = ReloadStatus.status;
				SetRefreshVar(!RefreshVar);
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ReloadStatus])

	return (
		<div className="ScrollingListMembers">
			{BlockedUsers.map(BlockedUser)}
			{/*<Button onClick={() => SetReloadBlockedUserlist(!ReloadBlockedUserlist)}> Reload BlockedUsers
			</Button>*/}
		</div>
	)
}
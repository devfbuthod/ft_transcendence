import { useState, useEffect } from "react"
import { socket } from "../../context/socket";
import {Image, Col, Row} from 'react-bootstrap'
import axios from 'axios'
import "./ListFriendRequests.css"
import './members.css'
import ApprovedButton from '../pictures/check.svg'
import DeclineButton from '../pictures/cross.svg'
import {ValidationFriend} from "./ContextMenuFunctions"
import { SiteStatus } from '../../App'
import status from "./Status";

interface IFriendRequest {
	user_id: number;
	user_nickname: string;
	user_avatar: string;
	user_userStatus: 'Available' | 'Playing' | 'Offline';
	relation_id: number;
	user_siteStatus: SiteStatus;
}

export default function ListFriendRequests()
{
	const [FriendRequests, SetFriendRequests] = useState<IFriendRequest[]>([]);
	//const [ReloadFriendRequestlist, SetReloadFriendRequestlist] = useState<{user_id1: number, user_id2: number}>({user_id1: -1, user_id2: -1});
	const [Reload, setReload] = useState(0);
	//const DataUser = useContext(DataContext);
	const ReloadComponent = () => setReload(Reload + 1);

	//load list friend requests
	useEffect(() => {
		//console.log("Friend Request reloaded!")
		let isMounted = true;
		axios.get('http://' + process.env.REACT_APP_DOMAIN_BACKEND + '/relationship/me/list?status=notconfirmed', {withCredentials: true,})
		.then(res => { if (isMounted)
			SetFriendRequests(res.data);
		})
		.catch(res => { if (isMounted)
			console.log(`error: ${res}`);
		})
		socket.on('reload-users', () => {setReload(Reload + 1)});
		return (() => {isMounted = false; socket.off('reload-users')})
	}, [Reload]);

	function FriendRequest(FriendRequest: IFriendRequest)
	{
		return (
			<div key={`FriendRequest_${FriendRequest.user_id}`} className="FriendRequest UserButton">
				<Row>
					<Col lg={3} className="position-relative">
						<Image src={FriendRequest.user_avatar} className="PictureUser" alt="picture" rounded fluid/>
						{status(FriendRequest.user_userStatus)}
					</Col>
					<Col lg={4}>
						<div style={{margin:"1em"}}> {FriendRequest.user_nickname} </div>
					</Col>
					<Col lg={5}>
						<Image className="ValidationButton" src={ApprovedButton} rounded onClick={() => ValidationFriend(FriendRequest.relation_id, true, ReloadComponent) }/>
						<Image className="ValidationButton" src={DeclineButton} rounded onClick={() => ValidationFriend(FriendRequest.relation_id, false, ReloadComponent) }/>
					</Col>
				</Row>
			</div>
		)
		//console.log(`FriendRequest : ${FriendRequest}`)
	}

	return (
		<div className="ScrollingListMembers">
			{FriendRequests.map(FriendRequest)}
			{/*<Button onClick={() => SetReloadFriendRequestlist(!ReloadFriendRequestlist)}> Reload FriendRequests
			</Button>*/}
		</div>
	)
}